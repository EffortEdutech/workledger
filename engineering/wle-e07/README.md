# WorkLedger Enterprise — WLE-E07 Programme Actuals & Reporting

**Candidate v0.1 · 13 November 2026 (MYT) · ISOLATED / NON-PRODUCTION**

## Controlled lineage

- WorkLedger parent `EffortEdutech/workledger` on isolated `feature/wle-e06-qs-service-integration-adapter`, SHA **`c3837800b56b14d4260e8283f9e891deaa6644b9`**; frozen public WLE-P1B **`1.0.0-rc1`** is unchanged.
- QS Service reference `EffortEdutech/QS-Service`, `main` SHA `9dc3555b841b9fe1cc0b1d07a62648d2b8a116be`. Do not change this repo or use privileged database access.
- WLE-P1-14 workpack E07: accepted baseline viewer, diary-linked actual recording, traceable reporting, source identifiers on all progress snapshots, version parity. Depends on E04–E06. E09 commercial claims and E10 EOT are excluded.
- This is a **synthetic server-side reference**; E06 has no verified live QS API / physical Supabase staging, and its live security release gates remain open. This package is independently testable without bypassing those holds.

## Included files

- `src/actuals.mjs`: isolated Node E07 actuals gateway with injected trusted E01/E04/E06 ports, serial in-memory transactions, independent review, append-only corrective voids, stable report projections and immutable published report snapshots.
- `tests/actuals.test.mjs`: **107 negative, arithmetic, scope, replay, reviewer, report and provenance tests** (actual execution logs under `evidence/`).
- `contracts/`: private proposed E07 commands and report data contract; **public P1B 1.0.0-rc1 unchanged**; valid synthetic report fixture.
- `sql/008_programme_actuals_reporting_CANDIDATE.sql`: default-deny conceptual PostgreSQL schema, **NOT a migration approval or executed SQL**.
- `docs/`: domain/authority lineage, measurement policy, live/staging hold matrix, endpoint/UI proposals and a bounded Codex handoff.
- `ui/`: isolated reporting-review sketch; no live APIs, no WorkLedger Standard changes.
- `evidence/`: local Node stdout, separately executed E02–E06 regression, QA report and file integrity manifest.

## Test

```bash
cd engineering/wle-e07
node --version # v22.16.0 was used for this candidate
npm test       # 107 PASS, 0 FAIL
```

Separately executed from real source files in this session: E06 **80**, E05 **64**, E04 **58**, E03 verified full candidate **45**, E02 verified candidate **30**, **384 isolated Node cases total**, all passing; no integrated SQL/runtime proof is implied.

## Domain control guarantees (synthetic)

1. Every actual and report is scoped by `organization_id,project_id,contract_id`, an independently verified E06 *accepted* baseline UUID/import, its version, exact manifest SHA-256, E05 BOQ revision/hash, and stable `canonical_task_id` plus native QS integer task reference.
2. `record_actual` accepts only a verified E04 `submitted`/`acknowledged` diary with exact version, local observation date, **server-trusted diary facts SHA and original evidence reference IDs**. This is an *observation* (`pending_review`), not verified progress.
3. A separate appointed reviewer must confirm current E04 **acknowledged** status and unchanged facts evidence digest to `verify_actual`. Only verified/nonvoided measures enter the factual projection. Role scopes and appointment capabilities are rechecked on every operation, including replay.
4. Two *non-interchangeable* measurement types: an **exact positive increment by physical unit** (decimal string, at most four fractional digits) or an **absolute task completion assessment** (`completion_bp` integer 0–10000). No automatic BOQ/quantity valuation, no assumed denomination, no implicit percentage from measured quantities.
5. Completion assessments are monotone by observation date (subject to independently reviewed append-only correction); independent `void_actual` leaves the original measurement and event intact. Corrected reports are newly published versions, not rewritten snapshots.
6. Report view preserves source `external_programme_id`, `source_revision`, `external_task_id`, canonical task UUID, WBS, QS calendar, source diary IDs, accepted manifest and BOQ. Completion percentage **null = unassessed**, never silently converted to zero. The finish date difference is a plain calendar-day observation only, **not contractual EOT/delay**.
7. `publish_report` requires optimistic `expected_event_sequence` and freezes its derived payload and digest. Past published reports remain unchanged after corrections or baseline supersession. Historical baseline reporting is allowed; new observations against superseded baselines are refused.

## Strict NO-GO

No actual QS HTTP call, data ingestion from live Contract Diary, real JWT/appointment claims, E04/E03 byte-readback, actual DB/RLS permissions, live concurrency, customer data, contract progress certificate, earned value, payment, VO/EOT determination, CIPAA notice, CIDB legal conformance or production launch. The SQL and HTML are design-only. No modifications to `main`, WorkLedger Standard, Contract Diary, QS Service or production environments.

**Next dependency stage (not part of E07): WLE-E08 — Quality and Safety.**
