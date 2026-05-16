-- ============================================================
-- Migration 002: Remove 'super_admin' from org_members.role
-- ============================================================
-- Problem:  org_members.role CHECK includes 'super_admin' as
--           a valid org-level role. But super_admin is a
--           platform-level identity stored in
--           user_profiles.global_role — it has no meaning as
--           a membership role inside a specific organisation.
--
--           Having it here allows accidental assignment of
--           'super_admin' as an org role, which bypasses the
--           intended two-tier role separation. The UI already
--           guards against this (UserList.jsx filters it out),
--           but the DB should enforce it too.
--
-- Fix:      Drop and re-add the role CHECK without 'super_admin'.
--
-- Affects:  public.org_members
-- Safe to run on: live Supabase DB — check your data first
--           (query below) to confirm no rows have
--           role = 'super_admin' before running.
-- ============================================================

-- Safety check: ensure no existing rows use 'super_admin' as org role
DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM public.org_members
  WHERE role = 'super_admin';

  IF bad_count > 0 THEN
    RAISE EXCEPTION '❌ Cannot run migration: % org_members row(s) have role = super_admin. Fix data first.', bad_count;
  ELSE
    RAISE NOTICE '✅ Safety check passed: no org_members rows with role = super_admin.';
  END IF;
END $$;

-- Step 1: Drop existing role constraint
ALTER TABLE public.org_members
  DROP CONSTRAINT IF EXISTS org_members_role_check;

-- Step 2: Re-add without 'super_admin'
ALTER TABLE public.org_members
  ADD CONSTRAINT org_members_role_check
  CHECK (role = ANY (ARRAY[
    'org_owner'::text,
    'org_admin'::text,
    'manager'::text,
    'technician'::text,
    'subcontractor'::text,
    'worker'::text,
    'client'::text
    -- 'super_admin' intentionally excluded:
    -- platform identity lives in user_profiles.global_role,
    -- not in org membership records.
  ]));

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'org_members'
      AND constraint_name = 'org_members_role_check'
  ) THEN
    RAISE NOTICE '✅ Migration 002 complete: org_members.role constraint updated.';
  ELSE
    RAISE EXCEPTION '❌ Migration 002 failed: constraint not found after ALTER.';
  END IF;
END $$;
