import { sanitizeHtml } from './sanitize';
import { describe, it, expect } from 'vitest';

describe('sanitizeHtml - Security Checks', () => {
  it('should prevent reverse tabnabbing by adding rel="noopener noreferrer" to target="_blank" links', () => {
    const input = '<a href="https://example.com" target="_blank">External Link</a>';
    const output = sanitizeHtml(input);

    // Check that target="_blank" is preserved (it's allowed)
    expect(output).toContain('target="_blank"');

    // Check that rel="noopener noreferrer" is added
    // Note: The order of attributes or values in rel might vary, but "noopener" and "noreferrer" must be present
    expect(output).toMatch(/rel="[^"]*noopener[^"]*"/);
    expect(output).toMatch(/rel="[^"]*noreferrer[^"]*"/);
  });

  it('should preserve existing rel values when adding noopener noreferrer', () => {
    const input = '<a href="https://example.com" target="_blank" rel="nofollow">External Link</a>';
    const output = sanitizeHtml(input);

    expect(output).toContain('nofollow');
    expect(output).toMatch(/rel="[^"]*noopener[^"]*"/);
    expect(output).toMatch(/rel="[^"]*noreferrer[^"]*"/);
  });

  it('should not add rel="noopener noreferrer" if target is not _blank', () => {
    const input = '<a href="https://example.com">Internal Link</a>';
    const output = sanitizeHtml(input);

    expect(output).not.toContain('rel="noopener noreferrer"');
    expect(output).not.toContain('target="_blank"');
  });
});
