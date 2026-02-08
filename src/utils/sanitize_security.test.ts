import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml Security', () => {
  it('adds rel="noopener noreferrer" to links with target="_blank"', () => {
    const input = '<a href="https://example.com" target="_blank">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('does not add rel="noopener noreferrer" to links without target="_blank"', () => {
    const input = '<a href="https://example.com">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('rel="noopener noreferrer"');
  });

  it('preserves existing rel attributes while adding noopener noreferrer', () => {
    const input = '<a href="https://example.com" target="_blank" rel="nofollow">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('rel="nofollow noopener noreferrer"');
  });
});
