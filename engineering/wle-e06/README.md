# WorkLedger Enterprise — WLE-E06 QS Service Integration Adapter

**Candidate v0.1 · 13 November 2026 (MYT) · ISOLATED NON-PRODUCTION REFERENCE**

## Source pins / contract authority

- WorkLedger Enterprise **parent**: `EffortEdutech/workledger`, `feature/wle-e05-boq-revisions-work-packages`, verified HEAD `3ed34c804fce2f4153b23f77800730180a92b09f`.
- QS Service source: private `EffortEdutech/QS-Service`, `main`, observed latest `9dc3555b841b9fe1cc0b1d07a62648d2b8a116be` (13 Nov 2026). Read: `qs-web-app/src/lib/workProgramme/orchestration.ts`, `qs-web-app/package.json`.
- Authority: WLE-P1B `1.0.0-rc1` provisional freeze and `06_QS_INTEGRATION_MANIFEST_AND_BASELINE_FREEZE.md`, WLE-P1 `08_QS_SERVICE_INTEGRATION_CONTRACT.md`, WLE-P1 workpack E06, and E05 candidate. **No publication, deployment or customer acceptance is implied.**

## Implemented in this isolated package

- `src/adapter.mjs`: node-only mock of enterprise QS crosswalk, E05 locked revision check, trusted source-BOQ alignment, request & private dispatch envelope, QS stage/status event inbox, Ed25519-signed JCS-subset manifest ingestion, professional review verification, task-ID crosswalk, inactive import and separate independent Enterprise baseline acceptance. Synthetic serial in-memory transactions/events/outbox/receipts, *not* PostgreSQL or network.
- `tests/adapter.test.mjs`: 80 deterministic Node tests (including real in-memory Ed25519 signing with ephemeral test keys; not a production trust store).
- `contracts/`: private proposed DTOs, manifest schema and synthetic example. Does **not** alter P1B `1.0.0-rc1` public contract.
- `sql/007_qs_adapter_CANDIDATE.sql`: *unexecuted* conceptual design with private schema, composite references, FORCE RLS and default-deny. **NO grants or policies.**
- `docs/`: actual-QS source mapping, manifest/signature/replay protocol, security gate matrix, Codex instructions, proposed API routes.
- `ui/`: read-only standalone simulation, not imported by WorkLedger Standard.
- `evidence/`: real local stdout, independent regression and exact-file checksum manifest.

## Run

```sh
cd engineering/wle-e06
node --version   # tested on v22.16.0
npm test         # 80 tests: 80 PASS, 0 FAIL
```

Separate previous candidates: E05 **64**, E04 **58**, E03 verified source **45**, E02 verified source **30** tests re-executed. Total **277 distinct passing isolated Node tests**, NOT an integrated two-tenant database or QS runtime integration test.

## What E06 enforces

1. QS native project/programme/task IDs remain **positive integers**, never coerced into Enterprise UUIDs. Crosswalks are explicit and do not allow a source project ID to point at a second tenant or contract.
2. The input is a **current locked E05 BOQ revision**, with exact canonical snapshot digest and separately trusted QS-side BOQ alignment. E05's 4dp/half-up **valuation convention is not QS-approved**; it is not used to certify money.
3. `request_generation` is a non-authoritative intent; dispatch uses a private adapter port with a stable idempotency key. The current QS repo has no verified deployed WLE Enterprise endpoint; **real dispatch is not implemented**.
4. QS status and `programme_status=confirmed` / `generation_stage=complete` are separately checked. Every published manifest requires a professional decision, actual signature verification against an injected trusted Ed25519 public key, exact tenant/BOQ/request identity, acyclic dependencies, valid task ID mapping and provenance.
5. Ingested manifest remains **pending_acceptance**. A separate appointed Enterprise approver, different from requesting importer, explicitly `accept_import`s with optimistic baseline version. Accepted predecessor is retained with `superseded` status; source reopening invalidates only *pending* imports, never erases a previously accepted baseline.
6. At-least-once QS events are inbox-idempotent. Every synthetic command creates receipts and, where applicable, hash-chained events and pending outbox entries. Neither hash chain nor signer record is court-grade evidence by itself.

## Strict NO-GO

No live QS API calls, QS worker execution, production DB, SQL migration, RLS/roles, payment certificate, actual programme activation, BOQ import into QS, signed legal attestation or CIPAA workflow. No edits to WorkLedger Standard, QS Service, Contract Diary or their databases. No `main` merge. Production/staging remains **HOLD** pending owner/DBA/security/QS acceptance.

**Next bounded stage:** WLE-E07 programme actuals & reporting only after E06 staging and acceptance gates are independently resolved.
