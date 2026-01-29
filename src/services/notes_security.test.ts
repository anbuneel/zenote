import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchNotes } from './notes';
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

// Helper to create a chainable mock builder for searchNotes
// searchNotes calls .order() twice
function createSearchMockBuilder(data: unknown[] = [], error: Error | null = null): MockQueryBuilder {
  let orderCallCount = 0;
  const mockBuilder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    // Mock chaining of order:
    order: vi.fn().mockImplementation(function (this: MockQueryBuilder) {
      orderCallCount++;
      if (orderCallCount < 2) {
        return this; // Chainable for first call
      }
      return Promise.resolve({ data, error }); // Resolve on second call
    }),
  };
  return mockBuilder;
}

describe('searchNotes security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('safely handles inputs with comma by quoting them', async () => {
    const mockBuilder = createSearchMockBuilder();
    mockSupabaseFrom(mockBuilder);

    const query = 'foo,bar';
    await searchNotes(query);

    // Expect quoted string to prevent filter injection
    expect(mockBuilder.or).toHaveBeenCalledWith(
      'title.ilike."%foo,bar%",content.ilike."%foo,bar%"'
    );
  });

  it('safely handles inputs with parentheses by quoting them', async () => {
    const mockBuilder = createSearchMockBuilder();
    mockSupabaseFrom(mockBuilder);

    const query = 'foo)bar';
    await searchNotes(query);

    expect(mockBuilder.or).toHaveBeenCalledWith(
      'title.ilike."%foo)bar%",content.ilike."%foo)bar%"'
    );
  });

  it('sanitizes double quotes from input', async () => {
    const mockBuilder = createSearchMockBuilder();
    mockSupabaseFrom(mockBuilder);

    const query = 'foo"bar';
    await searchNotes(query);

    // Expect double quotes to be removed and the result to be quoted
    expect(mockBuilder.or).toHaveBeenCalledWith(
      'title.ilike."%foobar%",content.ilike."%foobar%"'
    );
  });
});
