# WLE-E01 — Canonical Tenant, Contract Appointment & Authorisation Gateway

**Candidate v0.1, frozen wire DTO reference `1.0.0-rc1` · non-production engineering only.**

This is an additive, private-schema, server-only module under `engineering/wle-e01/`. It does **not** change the WorkLedger Standard Vite app, its `src/` imports, its existing Supabase tables, its auth providers, or the QS Service codebase. Its purpose is to demonstrate enforceable *PostgreSQL row security + server-authenticated contract appointment checking*, beyond E00's in-memory simulation.

## Scope proved by tests

- Canonical UUID-based organisation, project, construction contract, party, membership and appointment tables with **composite tenant/contract foreign keys**.
- A separate, private PostgreSQL schema `wle_e01`; `FORCE ROW LEVEL SECURITY` on all eight tables; no direct `anon`/`authenticated` grants; restricted gateway is SELECT-only.
- Authorisation requires **active tenant, effective active membership, correct appointee user, correct tenant/project/contract, current effective appointment and explicit capability**.
- PostgreSQL `SECURITY INVOKER` functions and policy-based visibility for organisations/projects/contracts/parties/appointments/capabilities. Authority/audit events deliberately have no gateway read policy at E01.
- Node gateway requires a validated bearer token via an injected verifier and a **single read-only PostgreSQL transaction** that sets a trusted server-only actor context; rejects forged actor/role fields and has no browser/HTTP entrypoint.
- Negative fixtures for cross-tenant access, same-tenant wrong contract, unauthorised org administrator, expired/revoked/proposed appointment, client actor forgery, arbitrary capability, direct write attempt, browser schema access and wrong composite FK.

## Test commands

```bash
cd engineering/wle-e01
npm ci
npm test
npm run test:rls
npm run test:all
```

`test:rls` uses the **PostgreSQL 18.6 engine compiled to WebAssembly (PGlite v0.5.16)**, not SQLite or mocked policy interpretation. It tests SQL policy execution and transaction scope in a disposable database. PGlite **is not** your Supabase deployment; differences in Auth, grants, pooling, extensions, storage and project configuration remain to be independently tested.

## Schema files

- `sql/000_TEST_ONLY_create_roles.sql` — creates the no-login test roles in an isolated database; not a migration for Supabase.
- `sql/001_canonical_tenant_appointment_rls.sql` — candidate *private* schema, RLS, grants and functions. Requires an existing `wle_e01_gateway` role. **DO NOT APPLY DIRECTLY TO PRODUCTION.**
- `src/gateway.mjs` — server-only authorisation facade; no HTTP listener, no browser code, no service-role bypass.

## Staging requirements not waived

A DBA must inspect the **actual** WorkLedger Supabase schema, ownership, auth/user mapping, grants, table exposure, storage, current RLS, migration ordering and connection limits before adapting this schema. `organization_id` and `contract_id` are currently shadow canonical keys; this is **not** an approved data migration. Use a separate, least-privileged server role, never QS's privileged `postgres` pool. The server must resolve a Supabase user using `auth.getUser(token)` and use `SET LOCAL` inside a transaction. A PostgreSQL custom setting alone is **not a cryptographic identity token**, so do not expose the gateway role/DB credentials or a SQL endpoint publicly.

Appointment creation, authority delegation, revocation-command audit, state-specific commercial approvals and the final server API are **not yet implemented**. Revocation denial is tested by changing a synthetic database record with the test administrator. This does **not** mean the production grant/revoke UX is ready. See `docs/REMAINING_GATES_AND_CODEX.md`.

## Provenance

- Parent code: `EffortEdutech/workledger` E00 commit `1380b5021f9646a95266e44488da9f57284036f3`.
- Contracts: WLE-P1B candidate v0.1, `1.0.0-rc1` without wire schema changes.
- Defect carryovers: `WLE-SEC-002`, `CDP-SEC-004`, `QS-SEC-001`, `WLE-TEST-005`, `WLE-E00-DEPLOY-001`.

**No claims of customer-data tenancy security, CIPAA readiness or production launch approval.**
