-- ============================================================
-- Migration 001: Fix attachments.mime_type CHECK constraint
-- ============================================================
-- Problem:  mime_type CHECK only allows image types, but
--           file_type allows 'document'. Any document upload
--           (PDF, Word, Excel) hits a Postgres constraint
--           violation and fails silently on the client.
--
-- Fix:      Widen the mime_type CHECK to include common
--           document types alongside the existing image types.
--
-- Affects:  public.attachments
-- Safe to run on: live Supabase DB (no data migration needed,
--           constraint change only — no existing rows broken
--           since all current uploads are photos/signatures)
-- ============================================================

-- Step 1: Drop the existing mime_type constraint
ALTER TABLE public.attachments
  DROP CONSTRAINT IF EXISTS attachments_mime_type_check;

-- Step 2: Re-add with document types included
ALTER TABLE public.attachments
  ADD CONSTRAINT attachments_mime_type_check
  CHECK (mime_type = ANY (ARRAY[
    -- Images (photos, signatures)
    'image/jpeg'::text,
    'image/jpg'::text,
    'image/png'::text,
    'image/webp'::text,
    'image/gif'::text,
    -- Documents
    'application/pdf'::text,
    'application/msword'::text,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'::text,
    'application/vnd.ms-excel'::text,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'::text
  ]));

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'attachments'
      AND constraint_name = 'attachments_mime_type_check'
  ) THEN
    RAISE NOTICE '✅ Migration 001 complete: attachments.mime_type constraint updated.';
  ELSE
    RAISE EXCEPTION '❌ Migration 001 failed: constraint not found after ALTER.';
  END IF;
END $$;
