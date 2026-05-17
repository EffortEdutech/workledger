-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003 — Fix work_entries.organization_id
--
-- Problem:
--   The trigger that was supposed to auto-set organization_id on work_entries
--   (from contracts.organization_id via the contract_id FK) was never applied.
--   All entries created before this migration have organization_id = NULL.
--   getUserWorkEntries() filters by organization_id = orgId, so those entries
--   are silently excluded from the /work page.
--
-- Fix:
--   1. Backfill existing NULL rows from their parent contract.
--   2. Add a BEFORE INSERT trigger so future inserts auto-set organization_id
--      when the client omits it (defence-in-depth alongside the JS fix).
--
-- Run this once in Supabase SQL Editor (or via supabase db push).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Backfill existing rows ─────────────────────────────────────────────────
UPDATE public.work_entries we
SET    organization_id = c.organization_id
FROM   public.contracts c
WHERE  we.contract_id      = c.id
  AND  we.organization_id  IS NULL;

-- ── 2. Trigger function ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_work_entry_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only fill in when the caller didn't provide it
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id
      INTO NEW.organization_id
      FROM public.contracts
     WHERE id = NEW.contract_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 3. Attach trigger ─────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_work_entry_set_org ON public.work_entries;

CREATE TRIGGER trg_work_entry_set_org
  BEFORE INSERT ON public.work_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_work_entry_organization_id();
