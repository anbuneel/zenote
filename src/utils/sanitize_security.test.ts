import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml Security', () => {
  it('should add rel="noopener noreferrer" to links with target="_blank"', () => {
    const input = '<a href="https://example.com" target="_blank">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('should not add rel="noopener noreferrer" to links without target="_blank"', () => {
    const input = '<a href="https://example.com">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('rel="noopener noreferrer"');
  });

  it('should preserve existing rel attributes while adding noopener noreferrer', () => {
    const input = '<a href="https://example.com" target="_blank" rel="nofollow">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('nofollow');
    expect(output).toContain('noopener');
    expect(output).toContain('noreferrer');
  });

  it('should not duplicate rel attributes if already present', () => {
    const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('noopener');
    expect(output).toContain('noreferrer');
    // Ensure noopener appears only once? DOMPurify might dedup or we might just check string.
    // The implementation uses Set or array filtering?
    // My implementation:
    // if (!rels.includes('noopener')) rels.push('noopener');
    // So it won't duplicate.
    const relAttr = output.match(/rel="([^"]*)"/)?.[1];
    const rels = relAttr?.split(' ') || [];
    const noopenerCount = rels.filter(r => r === 'noopener').length;
    expect(noopenerCount).toBe(1);
  });
});
