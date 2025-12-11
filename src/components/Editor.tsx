import { useState, useEffect, useRef, useCallback } from 'react';
import type { Note, Tag } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { TagSelector } from './TagSelector';

interface EditorProps {
  note: Note;
  tags: Tag[];
  onBack: () => void;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onToggleTag: (noteId: string, tagId: string) => void;
  onCreateTag?: () => void;
}

export function Editor({ note, tags, onBack, onUpdate, onDelete, onToggleTag, onCreateTag }: EditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentNoteId, setCurrentNoteId] = useState(note.id);

  // Reset local state when switching to a different note
  useEffect(() => {
    if (currentNoteId !== note.id) {
      setCurrentNoteId(note.id);
      setTitle(note.title);
      setContent(note.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  // Track unsaved changes
  const hasUnsavedChanges = title !== note.title || content !== note.content;

  const handleSave = useCallback(() => {
    if (title === note.title && content === note.content) return;

    setIsSaving(true);
    onUpdate({
      ...note,
      title,
      content,
      updatedAt: new Date(),
    });

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Show "Saving" indicator briefly, then hide it
    // The actual save is debounced in App.tsx (500ms), so we show for 800ms total
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
    }, 800);
  }, [title, content, note, onUpdate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSave();
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onBack]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    // Auto-resize
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Focus will move to the editor naturally
    }
  };

  // Auto-resize title on mount
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, []);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(note.id);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Editor Header */}
      <header
        className="
          h-16
          px-6
          flex
          items-center
          justify-between
          sticky
          top-0
          z-10
        "
        style={{ background: 'var(--color-bg-primary)' }}
      >
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 min-w-0">
          {/* App Name - Clickable to go back */}
          <button
            onClick={() => { handleSave(); onBack(); }}
            className="
              shrink-0
              transition-colors duration-200
              focus:outline-none
              cursor-pointer
              select-none
              hover:text-[var(--color-accent)]
            "
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            Zenote
          </button>

          {/* Separator */}
          <span
            className="shrink-0 text-lg"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            /
          </span>

          {/* Note Title */}
          <span
            className="truncate text-lg"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
            }}
            title={title || 'Untitled'}
          >
            {title || 'Untitled'}
          </span>

          {/* Save Status Indicator */}
          {(isSaving || hasUnsavedChanges) && (
            <span
              className="shrink-0 ml-3 text-xs px-2 py-1 rounded-full flex items-center gap-1.5"
              style={{
                fontFamily: 'var(--font-body)',
                color: isSaving ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                background: isSaving ? 'var(--color-accent-glow)' : 'var(--color-bg-secondary)',
              }}
            >
              {isSaving ? (
                <>
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: 'var(--color-accent)' }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--color-text-tertiary)' }}
                  />
                  Unsaved
                </>
              )}
            </span>
          )}
        </nav>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="
            w-9 h-9
            rounded-full
            flex items-center justify-center
            transition-all duration-200
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--color-accent)]
          "
          style={{ color: 'var(--color-text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-destructive)';
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Delete note"
          title="Delete note"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </header>

      {/* Editor Content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="max-w-[800px] mx-auto px-10 pb-40">
          {/* Title */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleSave}
            placeholder="Untitled"
            className="
              w-full
              font-semibold
              bg-transparent
              border-none
              outline-none
              resize-none
              overflow-hidden
              leading-tight
              mb-1
            "
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.75rem',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
            }}
            rows={1}
          />

          {/* Tag Selector */}
          <div className="mb-3">
            <TagSelector
              tags={tags}
              selectedTagIds={note.tags.map((t) => t.id)}
              onToggleTag={(tagId) => onToggleTag(note.id, tagId)}
              onCreateTag={onCreateTag}
            />
          </div>

          {/* Rich Text Content */}
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            onBlur={handleSave}
          />
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="
              w-[400px]
              p-8
              shadow-2xl
            "
            style={{
              background: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--glass-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-xl font-semibold mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
              }}
            >
              Delete this note?
            </h3>
            <p
              className="mb-8"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
              }}
            >
              This action cannot be undone. The note will be permanently removed from your library.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="
                  px-5 py-2.5
                  rounded-lg
                  text-sm font-medium
                  transition-all duration-200
                "
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-secondary)',
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="
                  px-5 py-2.5
                  rounded-lg
                  text-sm font-medium
                  transition-all duration-200
                "
                style={{
                  fontFamily: 'var(--font-body)',
                  color: '#fff',
                  background: '#DC2626',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#B91C1C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#DC2626';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
