# WLE-E06 — Executed Test Report and Release Disposition

**Date:** 13 November 2026 (MYT) · local isolated Linux runtime, Node v22.16.0, npm 10.9.2.

| Source | Actual executable test file(s) | Result |
|---|---|---|
| WLE-E06 candidate | `tests/adapter.test.mjs` | **80 passed, 0 failed, 0 skipped** |
| WLE-E05 | `WLE-E05_Candidate_v0.1/tests/boq.test.mjs` | **64 passed, 0 failed** |
| WLE-E04 | `WLE-E04_Candidate_v0.1/tests/diary.test.mjs` | **58 passed, 0 failed** |
| WLE-E03 **verified full prior package**, not the smaller loose directory | `wle_e03_verified/WLE-E03_Candidate_v0.1/tests/foundation.test.mjs` | **45 passed, 0 failed** |
| WLE-E02 **verified extracted archive**, not loose incomplete folder | `wle_e02_regression/WLE-E02_Candidate_v0.1/tests/registry.test.mjs` | **30 passed, 0 failed** |

**Total 277 separately executed Node synthetic test cases PASS; 0 FAIL.** Logs retained in `NODE_TEST_OUTPUT.txt`, `E05_REGRESSION_OUTPUT.txt`, `E04_REGRESSION_OUTPUT.txt`, `E03_REGRESSION_OUTPUT.txt`, `E02_REGRESSION_OUTPUT.txt`. Local inputs are not revalidated as a combined integrated deployment. Do not claim real QS worker, SQL or RLS tests.

## E06 coverage classes

- Real ephemeral Ed25519 signature verification; JCS-subset deterministic SHA-256, malformed/non-JSON rejection, wrong key/bad signature, signature recheck on replay, hash tampering.
- Source-native integer project mapping uniqueness, tenant/contract scope, forced external project mismatch, stale/unlocked E05 revision, exact BOQ snapshot digest and separately supplied QS BOQ reconciliation.
- Verified user/capability gates and no forged browser actor, independent internal dispatcher, idempotent dispatch and failure-before-receipt retry with same request ID.
- QS job confirmed/complete, stage/source scope, source event inbox dedupe, reopens invalidate pending imports, no automatic accepted baseline.
- Accepted manifest 3-task/2-link contract, missing/duplicate tasks, dependency cycles, extra caller fields, review/decision and source revision consistency.
- Stable external task UUID crosswalk across QS source revisions, immutable prior accepted baselines, independent appointed acceptance, baseline version compare-and-swap, duplicate acceptance race serialisation, synthetic atomic event/outbox rollback.

## NOT TESTED / RELEASE HOLD

Actual QS HTTP API and worker, actual live QS BOQ intake/source mapping, PostgreSQL transactions and real RLS, E01 Supabase JWT and appointment, cross-language RFC 8785/JCS full conformance, production signing key registry and revocation, actual QS professional attestation, durable event publisher/reconciliation, customer pilot, legal payment/CIPAA reliance. `main`, WorkLedger Standard, Contract Diary and QS Service repositories/databases remain unchanged.

**STATUS: ISOLATED NON-PRODUCTION ENGINEERING CANDIDATE.** Owner/DBA/security/QS/legal approvals remain required for real integration.
