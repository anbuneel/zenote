import { htmlToPlainText } from './sanitize';

// Constants
export const MAX_NOTE_TITLE_LENGTH = 200;
export const MAX_NOTE_CONTENT_LENGTH = 500000; // ~500KB

/**
 * Validate and sanitize note title.
 * - Trims whitespace
 * - Checks length limit
 * - Strips HTML tags (titles should be plain text)
 */
export function validateNoteTitle(title: string): string {
  if (!title) return '';

  const trimmed = title.trim();

  if (trimmed.length > MAX_NOTE_TITLE_LENGTH) {
    throw new Error(`Title must be less than ${MAX_NOTE_TITLE_LENGTH} characters`);
  }

  // Strip HTML tags to ensure title is plain text
  return htmlToPlainText(trimmed);
}

/**
 * Validate note content length.
 * - Checks length limit (DoS protection)
 * Note: HTML sanitization is handled separately by sanitizeHtml() in the service layer.
 */
export function validateNoteContentLength(content: string): void {
  if (content && content.length > MAX_NOTE_CONTENT_LENGTH) {
    throw new Error(`Content must be less than ${MAX_NOTE_CONTENT_LENGTH} characters`);
  }
}
