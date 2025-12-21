import { useRef, useState, useEffect } from 'react';
import type { Tag } from '../types';
import { TagPill, AllNotesPill, AddTagPill } from './TagPill';

interface TagFilterBarProps {
  tags: Tag[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearFilter: () => void;
  onAddTag: () => void;
  onEditTag: (tag: Tag) => void;
}

// Custom hook to track scroll/resize state without setState in effects
function useScrollFades(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  tagsLength: number
) {
  const [fadeState, setFadeState] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateFades = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const hasOverflow = scrollWidth > clientWidth;
      const newLeft = hasOverflow && scrollLeft > 8;
      const newRight = hasOverflow && scrollLeft < scrollWidth - clientWidth - 8;

      setFadeState((prev) => {
        if (prev.left !== newLeft || prev.right !== newRight) {
          return { left: newLeft, right: newRight };
        }
        return prev;
      });
    };

    // Initial calculation
    updateFades();

    // Subscribe to scroll events
    el.addEventListener('scroll', updateFades, { passive: true });

    // Subscribe to resize
    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateFades);
      resizeObserver.disconnect();
    };
  }, [scrollRef, tagsLength]);

  return fadeState;
}

export function TagFilterBar({
  tags,
  selectedTagIds,
  onTagToggle,
  onClearFilter,
  onAddTag,
  onEditTag,
}: TagFilterBarProps) {
  const isAllNotesActive = selectedTagIds.length === 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { left: showLeftFade, right: showRightFade } = useScrollFades(scrollRef, tags.length);

  return (
    <div className="relative">
      {/* Left fade indicator */}
      <div
        className="
          absolute left-0 top-0 bottom-0 w-8 md:w-12 z-10
          pointer-events-none
          transition-opacity duration-200
        "
        style={{
          background: 'linear-gradient(to right, var(--color-bg-primary), transparent)',
          opacity: showLeftFade ? 1 : 0,
        }}
      />

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="
          h-14 md:h-[60px]
          px-4 md:px-12
          flex items-center
          gap-2 md:gap-3
          overflow-x-auto
          shrink-0
        "
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* All Notes pill */}
        <AllNotesPill
          isActive={isAllNotesActive}
          onClick={onClearFilter}
        />

        {/* Divider */}
        {tags.length > 0 && (
          <div
            className="w-px h-5 md:h-6 shrink-0"
            style={{ background: 'var(--glass-border)' }}
          />
        )}

        {/* Tag pills */}
        {tags.map((tag) => (
          <TagPill
            key={tag.id}
            tag={tag}
            isActive={selectedTagIds.includes(tag.id)}
            onClick={() => onTagToggle(tag.id)}
            onEdit={() => onEditTag(tag)}
          />
        ))}

        {/* Add tag button */}
        <AddTagPill onClick={onAddTag} />
      </div>

      {/* Right fade indicator */}
      <div
        className="
          absolute right-0 top-0 bottom-0 w-8 md:w-12 z-10
          pointer-events-none
          transition-opacity duration-200
        "
        style={{
          background: 'linear-gradient(to left, var(--color-bg-primary), transparent)',
          opacity: showRightFade ? 1 : 0,
        }}
      />
    </div>
  );
}
