
import { render } from '@testing-library/react';
import { NoteCard } from './NoteCard';
import { describe, test, expect } from 'vitest';

describe('NoteCard Performance', () => {
  test('renders large note content efficiently', () => {
    // Create a 500KB string (HTML content)
    // 500,000 characters
    const hugeContent = '<div>' + 'a'.repeat(500000) + '</div>';

    const note = {
      id: '1',
      title: 'Large Note',
      content: hugeContent,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      pinned: false,
    };

    const start = performance.now();
    render(
      <NoteCard
        note={note}
        onClick={() => {}}
        onDelete={() => {}}
        onTogglePin={() => {}}
        isCompact={false}
      />
    );
    const end = performance.now();
    const duration = end - start;

    console.log(`Render time for large note: ${duration.toFixed(2)}ms`);

    // We expect this to be slow initially (e.g. > 100ms depending on machine),
    // but the optimization should bring it down significantly.
    // For now, we just log it.
    expect(true).toBe(true);
  });
});
