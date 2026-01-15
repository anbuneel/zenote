# Quiet Tasks Implementation Plan

**Version:** 1.0
**Last Updated:** 2026-01-14
**Status:** Draft
**Author:** Claude (Opus 4.5)

---

## Original Prompt

> "we said we can start with the 'Quiet Reminder' feature. what decisions do we need to make before implementing that?"
> (User selected batch processing, opted for unified view with both explicit checkboxes AND implicit intentions, MVP free for all users)

---

## Overview

Quiet Tasks is a unified view that surfaces:
1. **Explicit tasks** — Tiptap checkboxes (`<li data-checked="false">`)
2. **Implicit intentions** — Natural language patterns ("I should...", "need to...")

The feature helps users remember what matters by surfacing buried tasks without requiring deadlines.

## Key Decisions (Finalized)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Processing location | Client-side (regex) | Privacy-first; no note content sent to server |
| When to extract | Batch (background) | Avoid adding latency to note saves |
| Storage | Supabase `note_tasks` table | Enables cross-device sync |
| Include checkboxes? | Yes | Unified view more useful than separate systems |
| Opt-in mechanism | `user_metadata.quiet_tasks_enabled` | Consistent with existing patterns |
| MVP pricing | Free for all users | Validate feature value before gating |
| Future pricing | Bloom tier ($4/mo) | Gate behind premium once validated |

---

## Phase 1: Database Migration

### 1.1 Create `note_tasks` Table

**File:** `supabase/migrations/add_note_tasks.sql`

```sql
-- Note tasks table for Quiet Tasks feature
-- Stores extracted tasks from notes (both explicit checkboxes and implicit intentions)

create table note_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  note_id uuid references notes(id) on delete cascade not null,

  -- Task content
  text text not null,                    -- The task text (cleaned)
  type text not null check (type in ('checkbox', 'intention')),

  -- Source tracking
  source_pattern text,                   -- Pattern that matched (for intentions)
  source_html text,                      -- Original HTML snippet for context

  -- Status
  status text not null default 'pending' check (status in ('pending', 'completed', 'dismissed', 'snoozed')),
  snoozed_until timestamptz,             -- When snooze expires
  snooze_count int not null default 0,   -- Max 2 snoozes allowed

  -- Timestamps
  extracted_at timestamptz default now() not null,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Prevent duplicate extractions
  unique(note_id, text, type)
);

-- Index for efficient queries
create index idx_note_tasks_user_status on note_tasks(user_id, status);
create index idx_note_tasks_note on note_tasks(note_id);

-- RLS policies
alter table note_tasks enable row level security;

create policy "Users can view their own tasks"
  on note_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on note_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on note_tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on note_tasks for delete
  using (auth.uid() = user_id);

-- Updated_at trigger
create trigger update_note_tasks_updated_at
  before update on note_tasks
  for each row
  execute function update_updated_at_column();
```

### 1.2 Update Types

**File:** `src/types/database.ts` (add to existing)

```typescript
export interface NoteTask {
  id: string;
  user_id: string;
  note_id: string;
  text: string;
  type: 'checkbox' | 'intention';
  source_pattern: string | null;
  source_html: string | null;
  status: 'pending' | 'completed' | 'dismissed' | 'snoozed';
  snoozed_until: string | null;
  snooze_count: number;
  extracted_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**File:** `src/types.ts` (add to existing)

```typescript
export interface Task {
  id: string;
  noteId: string;
  noteTitle: string;  // For display context
  text: string;
  type: 'checkbox' | 'intention';
  status: 'pending' | 'completed' | 'dismissed' | 'snoozed';
  snoozedUntil: Date | null;
  snoozeCount: number;
  extractedAt: Date;
  completedAt: Date | null;
}
```

---

## Phase 2: Extraction Utilities

### 2.1 Task Extraction Module

**File:** `src/utils/taskExtraction.ts`

```typescript
/**
 * Task extraction utilities for Quiet Tasks feature
 * Extracts both explicit checkboxes and implicit intentions from note HTML
 */

export interface ExtractedTask {
  text: string;
  type: 'checkbox' | 'intention';
  sourcePattern?: string;
  sourceHtml: string;
}

// Intention patterns - things users say they want/need to do
const INTENTION_PATTERNS = [
  // Direct intentions
  { pattern: /\bI should\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'I should' },
  { pattern: /\bI need to\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'I need to' },
  { pattern: /\bI want to\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'I want to' },
  { pattern: /\bI have to\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'I have to' },
  { pattern: /\bI must\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'I must' },

  // Reminder patterns
  { pattern: /\bremind me to\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'remind me to' },
  { pattern: /\bdon'?t forget to\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: "don't forget" },
  { pattern: /\bneed to remember\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'need to remember' },

  // Future plans
  { pattern: /\bI('ll| will)\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'I will', captureGroup: 2 },
  { pattern: /\bgoing to\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'going to' },

  // Soft intentions
  { pattern: /\bmaybe I should\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'maybe I should' },
  { pattern: /\bI might\s+(.{10,100}?)(?:\.|,|;|$)/gi, name: 'I might' },
];

// Words that indicate the sentence is NOT a task
const EXCLUSION_WORDS = [
  'yesterday', 'last week', 'last month', 'already', 'finished',
  'completed', 'done', 'did', 'was', 'were', 'had'
];

/**
 * Extract unchecked checkboxes from Tiptap HTML
 */
export function extractCheckboxes(html: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];

  // Match Tiptap task list items that are unchecked
  // Format: <li data-type="taskItem" data-checked="false">content</li>
  const taskItemRegex = /<li[^>]*data-type="taskItem"[^>]*data-checked="false"[^>]*>([\s\S]*?)<\/li>/gi;

  let match;
  while ((match = taskItemRegex.exec(html)) !== null) {
    const content = match[1];
    const text = stripHtml(content).trim();

    if (text.length >= 3 && text.length <= 200) {
      tasks.push({
        text,
        type: 'checkbox',
        sourceHtml: match[0]
      });
    }
  }

  return tasks;
}

/**
 * Extract implicit intentions from plain text
 */
export function extractIntentions(html: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const text = stripHtml(html);
  const seen = new Set<string>();

  for (const { pattern, name, captureGroup = 1 } of INTENTION_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const captured = match[captureGroup]?.trim();

      if (!captured || captured.length < 10) continue;

      // Skip if contains exclusion words (past tense indicators)
      const lowerCaptured = captured.toLowerCase();
      if (EXCLUSION_WORDS.some(word => lowerCaptured.includes(word))) continue;

      // Normalize for deduplication
      const normalized = captured.toLowerCase().replace(/\s+/g, ' ');
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      tasks.push({
        text: capitalizeFirst(captured),
        type: 'intention',
        sourcePattern: name,
        sourceHtml: match[0]
      });
    }
  }

  return tasks;
}

/**
 * Extract all tasks from note HTML
 */
export function extractTasksFromNote(html: string): ExtractedTask[] {
  const checkboxes = extractCheckboxes(html);
  const intentions = extractIntentions(html);

  return [...checkboxes, ...intentions];
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

### 2.2 Unit Tests

**File:** `src/utils/taskExtraction.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  extractCheckboxes,
  extractIntentions,
  extractTasksFromNote
} from './taskExtraction';

describe('taskExtraction', () => {
  describe('extractCheckboxes', () => {
    it('extracts unchecked Tiptap task items', () => {
      const html = `
        <ul data-type="taskList">
          <li data-type="taskItem" data-checked="false">Buy groceries</li>
          <li data-type="taskItem" data-checked="true">Already done</li>
          <li data-type="taskItem" data-checked="false">Call mom</li>
        </ul>
      `;

      const tasks = extractCheckboxes(html);
      expect(tasks).toHaveLength(2);
      expect(tasks[0].text).toBe('Buy groceries');
      expect(tasks[0].type).toBe('checkbox');
      expect(tasks[1].text).toBe('Call mom');
    });

    it('ignores checked items', () => {
      const html = '<li data-type="taskItem" data-checked="true">Done task</li>';
      expect(extractCheckboxes(html)).toHaveLength(0);
    });

    it('ignores items that are too short', () => {
      const html = '<li data-type="taskItem" data-checked="false">Hi</li>';
      expect(extractCheckboxes(html)).toHaveLength(0);
    });
  });

  describe('extractIntentions', () => {
    it('extracts "I should" patterns', () => {
      const html = '<p>I should call my dentist about the appointment.</p>';
      const tasks = extractIntentions(html);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].text).toBe('Call my dentist about the appointment');
      expect(tasks[0].type).toBe('intention');
      expect(tasks[0].sourcePattern).toBe('I should');
    });

    it('extracts "remind me to" patterns', () => {
      const html = '<p>Remind me to check the project deadline tomorrow.</p>';
      const tasks = extractIntentions(html);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].sourcePattern).toBe('remind me to');
    });

    it('ignores past tense (already done)', () => {
      const html = '<p>I should have called yesterday but I already did it.</p>';
      const tasks = extractIntentions(html);

      expect(tasks).toHaveLength(0);
    });

    it('deduplicates similar intentions', () => {
      const html = `
        <p>I should call mom.</p>
        <p>I need to call mom.</p>
      `;
      const tasks = extractIntentions(html);

      // Should dedupe to just one
      expect(tasks).toHaveLength(1);
    });

    it('ignores intentions that are too short', () => {
      const html = '<p>I should go.</p>';
      expect(extractIntentions(html)).toHaveLength(0);
    });
  });

  describe('extractTasksFromNote', () => {
    it('combines checkboxes and intentions', () => {
      const html = `
        <ul data-type="taskList">
          <li data-type="taskItem" data-checked="false">Review PR</li>
        </ul>
        <p>I should also update the documentation before the release.</p>
      `;

      const tasks = extractTasksFromNote(html);
      expect(tasks).toHaveLength(2);
      expect(tasks.find(t => t.type === 'checkbox')).toBeDefined();
      expect(tasks.find(t => t.type === 'intention')).toBeDefined();
    });
  });
});
```

---

## Phase 3: Task Service

### 3.1 Task Service Module

**File:** `src/services/tasks.ts`

```typescript
import { supabase } from '../lib/supabase';
import type { NoteTask } from '../types/database';
import type { Task } from '../types';
import type { ExtractedTask } from '../utils/taskExtraction';

/**
 * Convert database task to app task with note context
 */
function toAppTask(dbTask: NoteTask & { notes: { title: string } }): Task {
  return {
    id: dbTask.id,
    noteId: dbTask.note_id,
    noteTitle: dbTask.notes?.title || 'Untitled',
    text: dbTask.text,
    type: dbTask.type as 'checkbox' | 'intention',
    status: dbTask.status as Task['status'],
    snoozedUntil: dbTask.snoozed_until ? new Date(dbTask.snoozed_until) : null,
    snoozeCount: dbTask.snooze_count,
    extractedAt: new Date(dbTask.extracted_at),
    completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : null,
  };
}

/**
 * Fetch all pending tasks for current user
 * Ordered by extraction date (oldest first - they bubble up)
 */
export async function fetchPendingTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('note_tasks')
    .select('*, notes(title)')
    .in('status', ['pending', 'snoozed'])
    .order('extracted_at', { ascending: true });

  if (error) throw error;

  // Filter out snoozed tasks that haven't expired
  const now = new Date();
  const activeTasks = (data || []).filter(task => {
    if (task.status === 'snoozed' && task.snoozed_until) {
      return new Date(task.snoozed_until) <= now;
    }
    return true;
  });

  return activeTasks.map(toAppTask);
}

/**
 * Sync extracted tasks for a note
 * Inserts new tasks, ignores duplicates
 */
export async function syncTasksForNote(
  noteId: string,
  userId: string,
  extractedTasks: ExtractedTask[]
): Promise<void> {
  if (extractedTasks.length === 0) return;

  const tasksToInsert = extractedTasks.map(task => ({
    user_id: userId,
    note_id: noteId,
    text: task.text,
    type: task.type,
    source_pattern: task.sourcePattern || null,
    source_html: task.sourceHtml,
  }));

  // Use upsert with conflict handling (ignore duplicates)
  const { error } = await supabase
    .from('note_tasks')
    .upsert(tasksToInsert, {
      onConflict: 'note_id,text,type',
      ignoreDuplicates: true
    });

  if (error) throw error;
}

/**
 * Mark a task as completed
 */
export async function completeTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('note_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) throw error;
}

/**
 * Dismiss a task (won't show again)
 */
export async function dismissTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('note_tasks')
    .update({ status: 'dismissed' })
    .eq('id', taskId);

  if (error) throw error;
}

/**
 * Snooze a task for 1 week (max 2 times)
 */
export async function snoozeTask(taskId: string, currentSnoozeCount: number): Promise<boolean> {
  if (currentSnoozeCount >= 2) {
    return false; // Max snoozes reached
  }

  const snoozedUntil = new Date();
  snoozedUntil.setDate(snoozedUntil.getDate() + 7); // 1 week

  const { error } = await supabase
    .from('note_tasks')
    .update({
      status: 'snoozed',
      snoozed_until: snoozedUntil.toISOString(),
      snooze_count: currentSnoozeCount + 1
    })
    .eq('id', taskId);

  if (error) throw error;
  return true;
}

/**
 * Delete all tasks for a note (called when note is deleted)
 */
export async function deleteTasksForNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('note_tasks')
    .delete()
    .eq('note_id', noteId);

  if (error) throw error;
}

/**
 * Get task count for badge display
 */
export async function countPendingTasks(): Promise<number> {
  const { count, error } = await supabase
    .from('note_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}
```

---

## Phase 4: Settings UI

### 4.1 Add Intelligence Tab to Settings

Update `src/components/SettingsModal.tsx` to add a third tab for Intelligence settings.

**Key changes:**

```typescript
// Add to tabs array
const tabs = ['Profile', 'Password', 'Intelligence'] as const;

// Add state for quiet tasks
const [quietTasksEnabled, setQuietTasksEnabled] = useState(
  user?.user_metadata?.quiet_tasks_enabled ?? false
);

// Add handler
const handleQuietTasksToggle = async () => {
  const newValue = !quietTasksEnabled;
  setQuietTasksEnabled(newValue);

  const { error } = await supabase.auth.updateUser({
    data: { quiet_tasks_enabled: newValue }
  });

  if (error) {
    setQuietTasksEnabled(!newValue); // Revert on error
    toast.error('Failed to update setting');
  } else {
    toast.success(newValue ? 'Quiet Tasks enabled' : 'Quiet Tasks disabled');
  }
};

// Add tab content
{activeTab === 'Intelligence' && (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
        Quiet Intelligence
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        Helpful features that surface your own words, not AI-generated content.
      </p>
    </div>

    <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-lg">
      <div>
        <p className="font-medium text-[var(--color-text-primary)]">
          Quiet Tasks
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Surface buried tasks and intentions from your notes
        </p>
      </div>
      <button
        onClick={handleQuietTasksToggle}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          quietTasksEnabled
            ? 'bg-[var(--color-accent)]'
            : 'bg-[var(--color-bg-tertiary)]'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            quietTasksEnabled ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  </div>
)}
```

---

## Phase 5: Quiet Tasks View

### 5.1 Main Component

**File:** `src/components/QuietTasksView.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HeaderShell } from './HeaderShell';
import { LoadingFallback } from './LoadingFallback';
import {
  fetchPendingTasks,
  completeTask,
  dismissTask,
  snoozeTask
} from '../services/tasks';
import type { Task } from '../types';
import toast from 'react-hot-toast';

interface QuietTasksViewProps {
  onBack: () => void;
  onNavigateToNote: (noteId: string) => void;
}

export function QuietTasksView({ onBack, onNavigateToNote }: QuietTasksViewProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await fetchPendingTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (task: Task) => {
    try {
      await completeTask(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      toast.success('Task completed');
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleDismiss = async (task: Task) => {
    try {
      await dismissTask(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      toast.success('Task dismissed');
    } catch (error) {
      toast.error('Failed to dismiss task');
    }
  };

  const handleSnooze = async (task: Task) => {
    try {
      const success = await snoozeTask(task.id, task.snoozeCount);
      if (success) {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        toast.success('Snoozed for 1 week');
      } else {
        toast.error('Maximum snoozes reached');
      }
    } catch (error) {
      toast.error('Failed to snooze task');
    }
  };

  const formatAge = (date: Date): string => {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <HeaderShell
        leftContent={
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        }
        centerContent={
          <h1 className="text-xl font-display text-[var(--color-text-primary)]">
            Quiet Tasks
          </h1>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-text-secondary)] text-lg">
              No pending tasks found
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mt-2">
              Your notes will be scanned for tasks and intentions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div
                key={task.id}
                className="bg-[var(--color-bg-secondary)] rounded-lg p-4 space-y-3"
              >
                {/* Task content */}
                <div className="flex items-start gap-3">
                  <span className="text-lg">
                    {task.type === 'checkbox' ? '☐' : '💭'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--color-text-primary)]">
                      {task.text}
                    </p>
                    <button
                      onClick={() => onNavigateToNote(task.noteId)}
                      className="text-sm text-[var(--color-accent)] hover:underline mt-1"
                    >
                      from "{task.noteTitle}"
                    </button>
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                  <span>{formatAge(task.extractedAt)}</span>
                  {task.snoozeCount > 0 && (
                    <span>Snoozed {task.snoozeCount}x</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-[var(--color-bg-tertiary)]">
                  <button
                    onClick={() => handleComplete(task)}
                    className="flex-1 px-3 py-2 text-sm bg-[var(--color-accent)] text-white rounded hover:opacity-90 transition-opacity"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => handleSnooze(task)}
                    disabled={task.snoozeCount >= 2}
                    className="flex-1 px-3 py-2 text-sm border border-[var(--color-text-secondary)] text-[var(--color-text-secondary)] rounded hover:bg-[var(--color-bg-tertiary)] transition-colors disabled:opacity-50"
                  >
                    Snooze
                  </button>
                  <button
                    onClick={() => handleDismiss(task)}
                    className="px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## Phase 6: Integration & Testing

### 6.1 Background Extraction Hook

**File:** `src/hooks/useTaskExtraction.ts`

```typescript
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { extractTasksFromNote } from '../utils/taskExtraction';
import { syncTasksForNote } from '../services/tasks';
import type { Note } from '../types';

/**
 * Background task extraction hook
 * Runs on app load and periodically extracts tasks from notes
 */
export function useTaskExtraction(notes: Note[]) {
  const { user } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasRun.current || !user) return;

    // Check if feature is enabled
    const enabled = user.user_metadata?.quiet_tasks_enabled;
    if (!enabled) return;

    hasRun.current = true;

    // Extract tasks from all notes (runs in background)
    const extractAll = async () => {
      for (const note of notes) {
        if (!note.content) continue;

        try {
          const extracted = extractTasksFromNote(note.content);
          if (extracted.length > 0) {
            await syncTasksForNote(note.id, user.id, extracted);
          }
        } catch (error) {
          console.error(`Failed to extract tasks from note ${note.id}:`, error);
        }
      }
    };

    // Run with a small delay to not block initial render
    const timer = setTimeout(extractAll, 2000);
    return () => clearTimeout(timer);
  }, [notes, user]);
}
```

### 6.2 E2E Tests

**File:** `e2e/quiet-tasks.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { login, createNote } from './fixtures';

test.describe('Quiet Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('extracts checkbox tasks from notes', async ({ page }) => {
    // Create a note with a task list
    await createNote(page, {
      title: 'My Tasks',
      content: 'Things to do'
    });

    // Add a task list via slash command
    await page.keyboard.type('/task');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Buy groceries');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Call dentist');

    // Save and go back
    await page.keyboard.press('Escape');

    // Enable Quiet Tasks in settings
    await page.click('[data-testid="settings-button"]');
    await page.click('text=Intelligence');
    await page.click('[data-testid="quiet-tasks-toggle"]');
    await page.click('text=Close');

    // Navigate to Quiet Tasks view
    await page.click('[data-testid="quiet-tasks-link"]');

    // Verify tasks are shown
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Call dentist')).toBeVisible();
  });

  test('extracts intention patterns', async ({ page }) => {
    await createNote(page, {
      title: 'Thoughts',
      content: 'I should really organize my desk this weekend.'
    });

    // Enable and check Quiet Tasks
    // ... (similar to above)

    await expect(page.locator('text=organize my desk')).toBeVisible();
  });

  test('can complete, snooze, and dismiss tasks', async ({ page }) => {
    // Setup note with task
    // Navigate to Quiet Tasks

    // Complete a task
    await page.click('button:has-text("Done")');
    await expect(page.locator('text=Task completed')).toBeVisible();

    // Snooze a task
    await page.click('button:has-text("Snooze")');
    await expect(page.locator('text=Snoozed for 1 week')).toBeVisible();

    // Dismiss a task
    await page.click('button:has-text("Dismiss")');
    await expect(page.locator('text=Task dismissed')).toBeVisible();
  });
});
```

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/add_note_tasks.sql` | Create | Database migration |
| `src/types/database.ts` | Update | Add NoteTask interface |
| `src/types.ts` | Update | Add Task type |
| `src/utils/taskExtraction.ts` | Create | Extraction utilities |
| `src/utils/taskExtraction.test.ts` | Create | Unit tests |
| `src/services/tasks.ts` | Create | Task CRUD service |
| `src/components/SettingsModal.tsx` | Update | Add Intelligence tab |
| `src/components/QuietTasksView.tsx` | Create | Main view component |
| `src/hooks/useTaskExtraction.ts` | Create | Background extraction |
| `e2e/quiet-tasks.spec.ts` | Create | E2E tests |
| `src/App.tsx` | Update | Add route and hook |

---

## Implementation Order

1. **Phase 1:** Run database migration in Supabase
2. **Phase 2:** Create extraction utilities + tests
3. **Phase 3:** Create task service
4. **Phase 4:** Update Settings modal with Intelligence tab
5. **Phase 5:** Create Quiet Tasks view
6. **Phase 6:** Add background extraction hook and E2E tests

---

## Future Enhancements (Post-MVP)

- **Weekly Digest Email:** Surface top 3 pending tasks via email
- **Smart Snooze:** Learn optimal snooze times from user behavior
- **Task Aging Badges:** Visual indicators for tasks aging out
- **Bloom Tier Gating:** Gate feature behind subscription when validated

---

*Last updated: 2026-01-14*
