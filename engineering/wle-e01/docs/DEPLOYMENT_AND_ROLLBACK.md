# Candidate Migration and Rollback Runbook — NOT FOR PRODUCTION EXECUTION

## Before applying anywhere

1. Confirm isolated disposable/staging DB **belongs to WorkLedger Enterprise**; identify owner and tenancy, data handling rules, schema version and actual existing app tables.
2. Run a reviewed schema diff and ensure schema `wle_e01` is not already in use; this SQL is for demonstration and cannot be assumed collision-free.
3. Create a separate `wle_e01_gateway` `NOLOGIN NOSUPERUSER NOBYPASSRLS` role with restricted server credential flow (do not reuse `service_role` or `postgres`). `sql/000_TEST_ONLY_create_roles.sql` is **test-only**, not for production environment.
4. DBA reviews grants, RLS policy recursion and query plans; capture approved migration ID, snapshot, change ticket and rollback window.
5. Apply `sql/001_canonical_tenant_appointment_rls.sql` only to a disposable target; seed synthetic fixtures; run negative tests and compare table/policy inventory.
6. Integrate `gateway.mjs` only on trusted server after verified auth. No public DB/query proxy.

## Rollback for a disposable E01-only database

Stop E01-only API calls; verify there are no real records/evidence to preserve. Under a signed DBA change ticket, `DROP SCHEMA wle_e01 CASCADE` can reverse the disposable prototype **only if it was created for E01 and contains no retained data**. It is not an automated rollback script. If any real events or customer data exist, archive and reconcile them first; do not delete audited records. Revoke restricted gateway credentials and review grants/network access. WorkLedger Standard should be unaffected because its schemas and imports are untouched.

## Invariants for approval

No `public` schema tables altered, no unrestricted `authenticated` or `anon` role grants, no privileged client secrets, no shared QS superuser, no unstaged customer-data migration, and no silent rewriting of legacy WorkLedger contract IDs.
