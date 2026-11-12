# E01 Findings, Next Batches and Codex Actions

## Status

E01 is a tested isolated **engineering candidate**. It is not a live WorkLedger user permission service and its schema is not applied to any Supabase project.

## Deferred / failed / open

- `E01-HOLD-01`: Live project schema reconciliation and Supabase Auth/RLS/storage test **NOT TESTED**. WLE-P0B `WLE-SEC-002` remains a release hold.
- `E01-HOLD-02`: Appointment grant/revoke operation, owner delegation, signer evidence and atomic audit/outbox **NOT IMPLEMENTED**; a migration/seed administrator changing synthetic statuses is *not* a production API.
- `E01-HOLD-03`: Private DB credential provision, pool transaction handling and network restriction against untrusted SQL requests **NOT DEPLOYED**. A custom GUC is not unforgeable by a compromised connection.
- `E01-HOLD-04`: Existing Contract Diary `acknowledgeDiary` missing MC role guard remains **UNFIXED**; E01 does not change the legacy app.
- `E01-HOLD-05`: QS privileged connection remains **UNFIXED**; E01 does not alter QS Service.
- `E01-HOLD-06`: E00 preview deployment uses Node 20.x, which Vercel rejected on 2026-11-12; no runtime upgrade is hidden inside E01.
- `E01-HOLD-07`: Public API, integrated application workflow, commercial powers and CIPAA features are **NOT IMPLEMENTED**; only internal authorization decision is provided.
- `E01-HOLD-08`: PGlite PostgreSQL engine uses WASM; a real managed Supabase DB + JWT + restricted connection and negative cases must be independently verified.

## Codex engineering continuation

1. Keep E01 separate from the WorkLedger Vite runtime until design review; do not import `src/gateway.mjs` into browser modules.
2. Establish a separate staging Supabase project under an approved owner; capture exact live migration/schema provenance and approved data handling. No production writes during discovery.
3. Provision a restricted role and server-only connection pool. Implement a server endpoint/middleware that calls `getUser(accessToken)` and `gateway.authorize`. Prevent direct requests to database; observe auth failures and redact sensitive logs.
4. Implement appointment provisioning, delegation, grant, revoke and expiry as audited transactions with admin bootstrap, security-invoker defaults, least privilege, actor provenance, anti-forgery, optimistic concurrency, and separation-of-duty tests. **No blanket SECURITY DEFINER**.
5. Verify RLS against real Supabase with two separate JWT identities, duplicate contract labels and cross-tenant / cross-contract negative fixtures; verify storage signed URLs and `auth` schemas as separately scoped follow-on.
6. Add mutations only through state-specific command handlers: diary acknowledge must verify contract authority *and diary state/author*, and record append-only event/outbox in same transaction.
7. Pin the supported Vercel Node runtime with compatibility tests in a separate deployment remediation PR; don't rewrite legacy Standard as part of E01.
8. Re-run E00's 33 tests, E01's unit+RLS tests, existing Standard build and lint/audit separately. Report each real result without hiding legacy failures.

## Release acceptance

- Documentation and isolated code can proceed with open defects.
- Branch merge requires code review, executable tests and appropriate security/design sign-off.
- External tenant onboarding, financial/legal authority and production launch remain **ON HOLD** pending staged Supabase policy, incident/restore, consent, audit and legal controls.
