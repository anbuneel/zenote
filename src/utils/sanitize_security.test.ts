
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml Security Check', () => {
  it('should add rel="noopener noreferrer" to links with target="_blank"', () => {
    const input = '<a href="https://example.com" target="_blank">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('should not add rel to links without target="_blank"', () => {
    const input = '<a href="https://example.com">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('rel="noopener noreferrer"');
  });
});
