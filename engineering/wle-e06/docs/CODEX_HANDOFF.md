# WLE-E06-05 — Controlled Codex / Engineering Handoff

## Pinned sources

- `EffortEdutech/workledger` parent `feature/wle-e05-boq-revisions-work-packages` SHA `3ed34c804fce2f4153b23f77800730180a92b09f`; keep WLE P1B `1.0.0-rc1` provisional public contract frozen.
- `EffortEdutech/QS-Service` `main` observed `9dc3555b841b9fe1cc0b1d07a62648d2b8a116be`; inspected `qs-web-app/src/lib/workProgramme/orchestration.ts`, `package.json`. DO NOT edit QS repo under this isolated package.
- WLE E01/E01B appointment, E02 contract, E03 original evidence, E04 diaries and E05 locked BOQ source remain gated. E07/E09/E11 are future stages and not accelerated by E06.

## Reproduce

```sh
cd engineering/wle-e06
node --version  # use >=22
npm test        # 80 local tests
cd ../wle-e05 && npm test # 64 separate
cd ../wle-e04 && npm test # 58 separate
# E03 verified package: 45; E02 verified package: 30
# Never accept zero runnable test files as a regression pass.
```

Cross-system import is not implemented as a live API. See `contracts/` for *proposed* wire DTOs. The isolated `src/adapter.mjs` ports are test doubles; they must never be plugged into browser or production without distinct authentication/DB contract.

## Bounded PR order

1. Confirm owner/ADR and isolate independent WorkLedger staging + QS staging. Obtain actual QS physical schema, E05 exact snapshot serialization, QS BOQ importer, and private endpoint security acceptance. No production modifications.
2. Implement a minimal private signed `generation_request` endpoint within QS Service *only in separately authorised QS PR*; derive QS project ID from authoritative source crosswalk, not browser. Use least-privileged database access and atomic QS request-idempotency.
3. Implement QS source-side manifest serializer *from live confirmed programme*, not fake `confirmed` flags. Include professional decision, stage validation, calendar/CPM/task provenance, digest, Ed25519 signature backed by approved secret/key manager.
4. Implement in WorkLedger an independent authenticated private adapter gateway with vetted E01 current appointment, E05 authoritative locked snapshot, QS source alignment, source event inbox, task crosswalk and immutable import receipts. Never introduce direct privileged cross-DB SQL.
5. Enforce separate Enterprise `accept_import` with independent authorised appointed reviewer, serial DB version CAS and active-version index; no automatic acceptance after QS review.
6. Prove real negative tests: two tenants and sibling contracts, unsigned or replaced manifest, key revocation, reopened source, stale BOQ revision, changed source hash, out-of-order/duplicate events, failed delivery, two concurrent imports/accepts.
7. Only then build an Enterprise-only, disabled-by-default UI; test existing WorkLedger Standard unaffected. Ship a PR with diff, full real test logs, schema/RLS and external signature proof, outbox reconciliation, rollback, human approvals, and remaining holds.

## Copy-ready engineering instruction

> Continue **WLE-E06 QS Service Integration Adapter** from isolated Candidate v0.1, pin WLE E05 commit `3ed34c804fce2f4153b23f77800730180a92b09f`, QS Service `9dc3555b841b9fe1cc0b1d07a62648d2b8a116be`, and retain WLE-P1B `1.0.0-rc1`. Reproduce the candidate's 80 Node tests and separately verify prior E05/E04/E03/E02 suites with actual test files. Review E01 appointment and E05 locked BOQ schema before implementing a protected, private WorkLedger–QS job boundary. Build only owner-approved, least-privileged staging adapter routes and a QS signed confirmed-programme manifest publisher; never expose QS `pg` credentials or service keys. Preserve UUID/native integer crosswalk, exact BOQ hash, reliable event inbox/outbox, signed JCS payload, independently verified QS professional review, non-active import receipt and separate Enterprise-appointed baseline acceptance. Reject forged roles, stale BOQs, duplicate/changed source publication, cross-tenant data, dependency cycles and unapproved/reopened stages. Leave production, WorkLedger Standard, QS core, payment/certificates, CIPAA service, and `main` unchanged until explicit acceptance gates. Deliver PR evidence and rollback plan.

## State

**Isolated engineering candidate only.** This workpack is not permission to run migrations, configure real credentials, transfer production BOQ data, grant signing powers or activate QS programmes.
