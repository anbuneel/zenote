import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteCard } from './NoteCard';
import { createMockNote } from '../test/factories';
import * as sanitizeModule from '../utils/sanitize';

describe('NoteCard', () => {
  const defaultProps = {
    note: createMockNote(),
    onClick: vi.fn(),
    onDelete: vi.fn(),
    onTogglePin: vi.fn(),
    isCompact: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders note title and content', () => {
    const note = createMockNote({
      title: 'My Title',
      content: '<p>My Content</p>',
    });

    render(<NoteCard {...defaultProps} note={note} />);

    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('My Content')).toBeInTheDocument();
  });

  it('sanitizes content rendering', () => {
    const note = createMockNote({
      content: '<script>alert("xss")</script><p>Safe</p>',
    });

    render(<NoteCard {...defaultProps} note={note} />);

    expect(screen.getByText('Safe')).toBeInTheDocument();
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const note = createMockNote({ title: 'Click Me' });
    render(<NoteCard {...defaultProps} note={note} onClick={onClick} />);

    // Click the title text, which is inside the card
    await user.click(screen.getByText('Click Me'));

    expect(onClick).toHaveBeenCalledWith(note.id);
  });

  it('renders compact mode correctly', () => {
    const note = createMockNote({
      content: '<p>This is a long content that should be truncated in compact mode</p>',
    });

    render(<NoteCard {...defaultProps} note={note} isCompact={true} />);

    // In compact mode, we expect a plain text preview
    expect(screen.getByText(/This is a long content/)).toBeInTheDocument();
    // HTML tags should be stripped
    expect(screen.queryByText('<p>')).not.toBeInTheDocument();
  });

  describe('Memoization Optimization', () => {
    it('does not re-sanitize content when props change but content remains same', () => {
      // Spy on the real implementation
      const sanitizeSpy = vi.spyOn(sanitizeModule, 'sanitizeHtml');

      const note = createMockNote({
        id: 'note-1',
        content: '<p>Static Content</p>',
        pinned: false,
      });

      const { rerender } = render(
        <NoteCard {...defaultProps} note={note} />
      );

      // Initial render should call sanitizeHtml
      expect(sanitizeSpy).toHaveBeenCalledTimes(1);

      // Update prop (e.g. pinned) but keep content same
      // We must create a new object reference for the note to trigger a potential re-render of the memoized component
      const updatedNote = { ...note, pinned: true };

      rerender(
        <NoteCard {...defaultProps} note={updatedNote} />
      );

      // Should NOT have called sanitizeHtml again thanks to useMemo
      expect(sanitizeSpy).toHaveBeenCalledTimes(1);
    });

    it('re-sanitizes content when content changes', () => {
      const sanitizeSpy = vi.spyOn(sanitizeModule, 'sanitizeHtml');

      const note = createMockNote({
        id: 'note-1',
        content: '<p>Content A</p>',
      });

      const { rerender } = render(
        <NoteCard {...defaultProps} note={note} />
      );

      expect(sanitizeSpy).toHaveBeenCalledTimes(1);

      // Update content
      const updatedNote = { ...note, content: '<p>Content B</p>' };

      rerender(
        <NoteCard {...defaultProps} note={updatedNote} />
      );

      // Should call sanitizeHtml again
      expect(sanitizeSpy).toHaveBeenCalledTimes(2);
    });
  });
});
