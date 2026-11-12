# WLE-E01B — Appointment Administration, Audit and Outbox

**Status:** Candidate v0.1 · additive, isolated engineering component · **NOT PRODUCTION READY**.

**Parent:** `EffortEdutech/workledger`, commit `985a67def2e79ffad3f972786eb52b49bc62512d` (`feature/wle-e01-canonical-tenant-appointments`). No Standard app, QS Service or Contract Diary source code is changed. WLE-P1B wire contracts `1.0.0-rc1` remain unchanged.

## Behaviour delivered

- Server-only **request → independent approval → activation** workflow; direct permission grants are prohibited.
- **Revocation** by an authorised contract administrator, with strict version checks and immediate denial from E01's existing RLS authority checks.
- Database-enforced tenant, project, contract and party relationships, active membership and current appointment capability; command authority is checked again **inside each write transaction**.
- Immutable **from application writer role** audit events, outbox rows and command receipts written in the same transaction as the underlying state transition. The outbox is a durable pending record; **dispatch worker has not been implemented**.
- Replay-safe command receipt keys with conflict detection; database uniqueness prevents duplicates. Concurrent in-flight identical requests and retry/backoff policy need further load tests.
- Separation of duties: requester may not be appointee; approver differs from requester/appointee; grant activation by original requester requires the independent approver still be currently eligible. Self-revocation forbidden.
- Only four non-commercial capacities and a low-risk capability allowlist. No grant of financial certification, payment, dispute/legal, tenant administration or privilege delegation through this flow.

## Files

- `sql/000_TEST_ONLY_writer_role.sql`: disposable PGlite role; never execute on real project.
- `sql/002_appointment_command_candidate.sql`: additive **candidate** migration, requires E01 baseline. For reviewed isolated DB only; not an authorised Supabase migration.
- `src/appointmentCommands.mjs`: authenticated, transaction-scoped private operations; no HTTP listener or secrets.
- `tests/commands.pg.test.mjs`: actual PostgreSQL 18.6 (PGlite) RLS, transactions, negative cases, rollback injections.
- `tests/commands.unit.test.mjs`: malformed commands, client-forged identity and restricted business grant rules.

## Run (after checking out E01 and E01B side-by-side)

```bash
cd engineering/wle-e01b
npm ci
npm test
# from repository root
node --test engineering/wle-e01/tests/*.test.mjs
node --test engineering/wle-e00/tests/*.test.mjs
npm run build
```

The `commands.pg.test.mjs` suite reads baseline SQL from `../wle-e01/sql/` and is safe only in its isolated ephemeral PGlite engine. Do not run that synthetic seed script against a shared or live database.

## Invariants / explicit limits

1. A trusted backend obtains the actor only via `Supabase.auth.getUser(token)` and connects using a **dedicated limited DB writer**; no `service_role`, `postgres`, public SQL proxy, or browser import. `SET LOCAL` custom GUCs alone are **not** proof of identity.
2. This component does not provision IAM/database roles, migrate existing WorkLedger customer data, serve authenticated HTTP routes, publish outbox messages, enforce legal/CIPAA authority or prove production Supabase RLS.
3. Pending requests, active appointees and immutable ledger records must be retained according to reviewed business/legal retention rules before production rollout.
4. Legacy Standard lint/dependency issues and the known Vercel Node 20 preview rejection remain separate backlog items.

See `docs/SECURITY_ARCHITECTURE.md`, `docs/STAGING_TEST_RUNBOOK.md` and the evidence folder.
