-- Secure function to fetch a shared note by token
-- This replaces the insecure method of public SELECT access
CREATE OR REPLACE FUNCTION get_shared_note(token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note_id uuid;
  v_note record;
  v_tags json;
BEGIN
  -- 1. Validate token and get note_id
  -- Only valid, non-expired tokens are accepted
  SELECT note_id INTO v_note_id
  FROM note_shares
  WHERE share_token = token
    AND (expires_at IS NULL OR expires_at > now());

  IF v_note_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Get note details
  -- Ensure note is not soft-deleted
  SELECT * INTO v_note
  FROM notes
  WHERE id = v_note_id
    AND deleted_at IS NULL;

  IF v_note IS NULL THEN
    RETURN NULL;
  END IF;

  -- 3. Get tags
  -- Join through note_tags to tags
  SELECT json_agg(
    json_build_object(
      'id', t.id,
      'name', t.name,
      'color', t.color,
      'createdAt', t.created_at
    )
  ) INTO v_tags
  FROM note_tags nt
  JOIN tags t ON t.id = nt.tag_id
  WHERE nt.note_id = v_note_id;

  -- 4. Return combined JSON matching the Note interface
  RETURN json_build_object(
    'id', v_note.id,
    'title', v_note.title,
    'content', v_note.content,
    'createdAt', v_note.created_at,
    'updatedAt', v_note.updated_at,
    'pinned', v_note.pinned,
    'deletedAt', v_note.deleted_at,
    'tags', COALESCE(v_tags, '[]'::json)
  );
END;
$$;

-- Remove insecure public access policies
-- Previously, these allowed enumerating shared notes/tokens

-- Drop policy on note_shares
DROP POLICY IF EXISTS "Anyone can read share tokens" ON note_shares;

-- Drop policy on notes
DROP POLICY IF EXISTS "Public can view notes with valid share token" ON notes;

-- Drop policy on tags
DROP POLICY IF EXISTS "Public can view tags for shared notes" ON tags;

-- Drop policy on note_tags
DROP POLICY IF EXISTS "Public can view note_tags for shared notes" ON note_tags;
