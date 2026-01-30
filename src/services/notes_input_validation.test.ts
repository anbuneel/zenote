import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNote } from './notes';
import { createMockQueryBuilder, type MockQueryBuilder } from '../test/factories';
import { supabase } from '../lib/supabase';

// Mock supabase
vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => createMockQueryBuilder()),
    },
  };
});

// Helper for mocking
function mockSupabaseFrom(builder: MockQueryBuilder): void {
  vi.mocked(supabase.from).mockReturnValue(builder);
}

describe('Notes Input Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects overly long titles', async () => {
    const longTitle = 'a'.repeat(201); // 200 limit
    const mockBuilder = createMockQueryBuilder();
    mockSupabaseFrom(mockBuilder);

    await expect(createNote('user-1', longTitle, 'content'))
      .rejects.toThrow(/title/i);
  });

  it('rejects overly long content', async () => {
    const longContent = 'a'.repeat(500001); // 500KB limit
    const mockBuilder = createMockQueryBuilder();
    mockSupabaseFrom(mockBuilder);

    await expect(createNote('user-1', 'Title', longContent))
      .rejects.toThrow(/content/i);
  });

  it('sanitizes content before storage', async () => {
    const maliciousContent = '<script>alert(1)</script><p>Safe</p>';
    const mockBuilder = createMockQueryBuilder({
       singleResult: {
         data: { id: '1', user_id: '1', title: 'T', content: '<p>Safe</p>', created_at: '', updated_at: '' },
         error: null
       }
    });
    mockSupabaseFrom(mockBuilder);

    await createNote('user-1', 'Title', maliciousContent);

    // Verify insert was called with SANITIZED content
    expect(mockBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.not.stringContaining('<script>'),
      })
    );

    expect(mockBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('<p>Safe</p>'),
      })
    );
  });

  it('strips HTML from title before storage', async () => {
    const htmlTitle = '<b>Bold</b> & <script>alert(1)</script>';
    const mockBuilder = createMockQueryBuilder({
       singleResult: {
         data: { id: '1', user_id: '1', title: 'Bold & ', content: '', created_at: '', updated_at: '' },
         error: null
       }
    });
    mockSupabaseFrom(mockBuilder);

    await createNote('user-1', htmlTitle, 'content');

    // Should strip tags but keep text
    expect(mockBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.not.stringContaining('<b>'),
      })
    );
    expect(mockBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.not.stringContaining('<script>'),
      })
    );
    // Note: htmlToPlainText decodes entities, so & may remain &
    expect(mockBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/Bold\s*&\s*/),
      })
    );
  });
});
