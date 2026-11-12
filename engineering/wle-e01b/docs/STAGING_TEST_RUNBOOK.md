# WLE-E01B — Isolated Supabase Staging Verification Runbook

## Staging discovery on 12 November 2026

The connected Supabase organisation returned only **Aircond Care** (`zxhuprfxibpaoblbdflu`) and **FireMan** (`swghhxlqrdvhlluqwves`). Neither is identified as a WorkLedger Enterprise staging project. **No SQL or Auth operations were performed on either.** An authorised project or explicit owner-approved creation and cost controls are required before genuine Supabase staging acceptance.

## Step-by-step staging acceptance (NOT executed)

1. Owner approves project name `WorkLedger Enterprise — Staging`, region, budget/quotas, responsible administrator and access policies. Create or connect **only** that isolated project; verify empty customer data, region, snapshots and project ID.
2. DBA inspects current schema, credentials, grants, RLS, Data API exposure, auth settings, and relevant Postgres extensions. Do not assume SQL designed for PGlite is deployable as-is.
3. Under a change ticket, provision separate **least privilege** gateway and appointment-writer roles with correct login/inheritance network privileges. No `service_role` / `postgres` in application configuration. Record allowed network origins. Do not upload secrets or JWTs to the audit ZIP.
4. Reconcile and apply E01 baseline, then E01B delta as reviewed migration in disposable staging. **Never** execute `000_TEST_ONLY_writer_role.sql` in managed Supabase, and do not reuse testing UUIDs as real users.
5. Create two separate synthetic Supabase Auth identities belonging to different orgs. Validate verified `auth.getUser(access_token)` on a server and reject forged/expired tokens; never trust `raw_user_meta_data` for permissions.
6. Check private-schema non-exposure through Data API and browser roles, including RLS SELECT/INSERT/UPDATE/DELETE across two organisations, sibling contracts and same contract with different appointments.
7. Execute request → distinct reviewer approval → activation → revocation, stale versions, idempotent replay and cross-tenant denials using real role credentials and transaction pooling.
8. Trigger synthetic outbox insertion failure; assert database transaction rolled back request/appointment, audit, outbox and receipt. Verify readback and outbox pending records without publishing.
9. Run `supabase test db` / pgTAP where supported, inspect Supabase advisors, SSL/network grants, WAL/backup, query performance and RLS recursion.
10. Log PASS/FAIL/NOT TESTED with exact project ref, migrated change ID, SHA, role matrix and release-review sign-off; destroy or archive staging fixtures only under approved retention procedures.

## Mandatory safety hold

- **NO** changes to Aircond Care or FireMan.
- **NO** production WorkLedger migrations, customer data, real tokens or role secrets in this stage.
- **NO** declaration of live RLS, JWT, outbox processing or production readiness until an explicitly authorised isolated staging project has passed steps 1–10.
