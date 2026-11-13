# WLE-E07 — Executed Test Report & Gate Disposition

**Date:** 13 November 2026 MYT. Runtime: Linux, Node v22.16.0. All tests executed from concrete source files. P1B public `1.0.0-rc1` unchanged.

| Suite | Source file, executed | PASS | FAIL |
|---|---|---:|---:|
| E07 candidate | `WLE-E07_Candidate_v0.1/tests/actuals.test.mjs` | **107** | 0 |
| E06 regression | `WLE-E06_Candidate_v0.1/tests/adapter.test.mjs` | **80** | 0 |
| E05 regression | `WLE-E05_Candidate_v0.1/tests/boq.test.mjs` | **64** | 0 |
| E04 regression | `WLE-E04_Candidate_v0.1/tests/diary.test.mjs` | **58** | 0 |
| E03 full verified source | `wle_e03_verified/WLE-E03_Candidate_v0.1/tests/foundation.test.mjs` | **45** | 0 |
| E02 verified source | `wle_e02_regression/WLE-E02_Candidate_v0.1/tests/registry.test.mjs` | **30** | 0 |
| **Total separately executed** | | **384** | **0** |

**All suites are independently executed synthetic Node tests**, not end-to-end integrated E01–E07 runtime tests. Logs are present under `evidence/`; each log has a nonzero test count and zero fails/skips. The E03 full source is NOT the partial loose E03 candidate directory; the verified full fixture is used.

## E07 implemented negative and positive cases

- Decimal string arithmetic, max-4dp, no JS floats, no exponent, no negative or mixed-unit implicit totals.
- Current server-verified E01 actor/appointment capabilities (mock), denial of forged actor/role, outsider, read-only, revoked actor and cross-tenant/contract requests.
- Immutable E06 accepted baseline, E05 BOQ version/hash, exact canonical task UUID / external QS integer source tuple / manifest SHA and no capture on superseded baseline.
- E04 submitted/acknowledged evidence version/date/trusted facts digest and attachment references; changes to diary hash/version block review.
- `pending_review` observation excluded from actuals until independent verification of E04 acknowledgement; self-verification/rejection/void denied.
- Quantity and completion assessment kept distinct, 10000bp observed finish produces only plain calendar-day difference; null remains unassessed.
- Idempotent replay and payload-conflict denial; simulated serial concurrency and rollback, event-chain integrity, immutable correction and previously published report.
- As-of report source event-sequence optimistic gate; same digest replay; stale cut denied; immutable baseline and source IDs; historical superseded baseline remains available.

## Additional contract validations

- JSON schema for factual report validated with `jsonschema` Draft202012Validator against the generated `contracts/SYNTHETIC_PROGRESS_REPORT_EXAMPLE.json` and its `report_sha256` checked against the candidate `digest()` output; these are **synthetic**.
- Conceptual SQL `sql/008_programme_actuals_reporting_CANDIDATE.sql` not executed, and has no runtime grants or permissive policies.
- HTML prototype is disconnected and contains synthetic figures only.

## NO-GO / HOLD

Actual Supabase PostgreSQL and force-RLS, two genuine tenants, original-byte E03 custody, real E04 diary service, E06 QS signed acceptance and source task mapping, real contract appointment, QS measurement methodology, production signer/register, commercial claims and legal reliance all remain unverified. `main`, WorkLedger Standard, Contract Diary, QS Service and customer databases are untouched.

**Disposition: WLE-E07 isolated candidate test PASS. Production release HOLD.**
