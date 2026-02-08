import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml truncation behavior', () => {
  it('should handle truncated HTML gracefully', () => {
    const html = '<div><a href="https://example.com">Link text</a></div>';
    const truncated = html.slice(0, 15); // "<div><a href='h"
    const sanitized = sanitizeHtml(truncated);

    // DOMPurify typically closes open tags or strips invalid ones.
    // We want to ensure it doesn't crash and returns something safe.
    expect(sanitized).toBeTypeOf('string');
    expect(sanitized).not.toContain('<script');
  });

  it('should handle large truncated input', () => {
    const longHtml = '<div>' + 'a'.repeat(2000) + '</div>';
    const truncated = longHtml.slice(0, 100); // "<div>aaaa..."
    const sanitized = sanitizeHtml(truncated);

    expect(sanitized).toBeTypeOf('string');
    expect(sanitized.length).toBeLessThanOrEqual(truncated.length + 100); // allow for some closing tags
  });

  it('should close unclosed tags from truncation', () => {
     const input = '<p><strong>Bold text here</strong></p>';
     // Truncate in the middle of "Bold"
     // <p><strong>Bo
     const truncated = input.slice(0, 15);
     const sanitized = sanitizeHtml(truncated);

     // Should result in <p><strong>Bo</strong></p> or similar valid HTML
     expect(sanitized).toMatch(/<p>.*<\/p>/);
     // It might be <p><strong>Bo</strong></p>
  });
});
