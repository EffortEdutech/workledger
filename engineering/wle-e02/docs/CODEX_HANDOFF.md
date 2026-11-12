# WLE-E02-03 — Codex Engineering Handoff

## Baseline

- `EffortEdutech/workledger` parent branch `feature/wle-e01b-appointment-governance` @ `e5fbb735e8a2743d45471170c41efc2df3864128`.
- WLE-P1B `1.0.0-rc1` remains unchanged. Read WLE-P0, P0B, P1, P1B, E00, E01 and E01B authorities before implementing actual DB adapter.
- `engineering/wle-e02/` contains only an isolated synthetic candidate and SQL design; no changes to WorkLedger Standard, Contract Diary or QS Service.

## Required next engineering steps (do not auto-deploy)

1. Pin source commits, inspect complete E01/E01B SQL, tests and cap management. Ensure E02 `construction.contract.*` permissions cannot be granted through E01B's low-risk flow without independent signed policy.
2. Independently review candidate SQL and resolve physical namespace/migration sequencing and policy bootstrap. Never run this candidate DDL on shared or production DB. Use an owner-approved disposable Supabase project only after explicit authorization.
3. Design a restricted, server-only PostgreSQL transaction adapter implementing register / seal / map with composite scoped FKs, receipts, event/outbox and row-lock or unique-key concurrency semantics. Actual app-level `verifyAccessToken` must resolve user via Supabase Auth `getUser`; do not accept actor IDs from request.
4. Connect E03 evidence service only after its SHA256(original bytes) and signer verification contract is implemented and independently accepted. Do not display legally signed or contract executed from synthetic proof.
5. Run adversarial tests with two real Auth users, distinct organisations/projects/contracts, forged actor, revoked appointment, wrong party, existing revision, same source key, double seal, concurrent retry and outbox fault injection; capture exact project ref, SHA and exit logs.
6. Keep `WLE-E00-DEPLOY-001` (Vercel Node 20 preview), `WLE-SEC-002`, `CDP-SEC-004`, `QS-SEC-001` and root legacy defects visible, not hidden by E02 test PASS.
7. Produce PR-ready diff, migration/backout evidence, security review, gate sheet and link to frozen authority; request human owner approval before main merge or production.

## Expected Codex instruction

> Continue **WLE-E02 integration only** from isolated Candidate v0.1. Preserve `1.0.0-rc1`, parent WLE-E01B `e5fbb735`, existing WorkLedger Standard and all release holds. Start with architecture/SQL gap review, then build a private, authenticated transaction adapter for registration, immutable signed-evidence seal and source-instance crosswalk in a separate branch. Supply real PostgreSQL/Supabase RLS tests only in specifically authorised isolated staging. Do not infer legal signature verification from a SHA, do not grant E02 commercial powers through E01B, do not touch the two unrelated Supabase projects and do not merge or deploy automatically. Return the diff, tests, unresolved gates and rollback analysis.
