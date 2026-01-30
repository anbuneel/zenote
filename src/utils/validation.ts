import { sanitizeHtml, htmlToPlainText } from './sanitize';

// Constants
export const MAX_NOTE_TITLE_LENGTH = 200;
export const MAX_NOTE_CONTENT_LENGTH = 500000; // ~500KB

/**
 * Validate and sanitize note title.
 * - Trims whitespace
 * - Checks length
 * - Strips HTML tags (returns plain text)
 */
export function validateNoteTitle(title: string): string {
  if (!title) return '';

  const trimmed = title.trim();

  if (trimmed.length > MAX_NOTE_TITLE_LENGTH) {
    throw new Error(`Title must be less than ${MAX_NOTE_TITLE_LENGTH} characters`);
  }

  // Strip HTML tags to ensure title is plain text
  // We don't escape entities here to avoid double-escaping on display
  // (Display components usually handle escaping or sanitization)
  return htmlToPlainText(trimmed);
}

/**
 * Validate and sanitize note content.
 * - Checks length
 * - Sanitizes HTML (removes dangerous tags like <script>)
 */
export function validateNoteContent(content: string): string {
  if (!content) return '';

  if (content.length > MAX_NOTE_CONTENT_LENGTH) {
    throw new Error(`Content must be less than ${MAX_NOTE_CONTENT_LENGTH} characters`);
  }

  // Sanitize HTML to prevent XSS (Stored XSS)
  // This allows safe tags (p, b, i, lists) but strips scripts/iframes
  return sanitizeHtml(content);
}
