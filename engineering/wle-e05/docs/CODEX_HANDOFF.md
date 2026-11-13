# WLE-E05-04 — Controlled Codex Engineering Handoff

## Pinned inputs

- WorkLedger Enterprise `EffortEdutech/workledger`, previous branch `feature/wle-e04-diary-offline-capture` SHA `b0bc8a523871ef6e398b70df0bcaa1d682866006` (observed on 13 November 2026 MYT). Confirm current branch head before any change.
- WLE-P1B `1.0.0-rc1` provisional public contract freeze unchanged; E01/E01B tenant/appointments; E02 registered contract revision; E03 private evidence custody; E04 factual diaries. All staging/prod holds remain.
- Contract Diary reference `EffortEdutech/contract-diary-platform` SHA `6d3a9ad292e702100d133095bb03362ab38638dc`: `frontend/src/services/boqService.js`, `docs/Link n Ai/01_work_diary_link_guideline.md`, `DAILY_LOG.md` confirmed legacy `boq_items.boq_id` (not a direct contract foreign key).

## Candidate verification

```bash
cd engineering/wle-e05
node --version # 22+
npm test       # E05 64/64
cd ../wle-e04 && npm test # 58/58 separately
cd ../wle-e03 && npm test # 45/45 separately
cd ../wle-e02 && npm test # 30/30 separately
```

Treat zero tests or absent files as NOT VERIFIED. Pin SHA and stdout to PR; calculate manifest SHA-256 again from working tree. The 197 passing Node tests are synthetic and separately executed; they are **not** E01–E05 integration evidence.

## Bounded implementation PR order

1. Governance: obtain engineering ADR signoff for E05 decimal/BOQ revision semantics and approved staging scope; preserve baseline/variation/legal boundaries and existing Standard runtime.
2. Refine candidate DTOs and real source crosswalk from verified legacy physical schema; record exact mapping of `boq`, `boq_sections`, `boq_items`, breakdown and `boq_id` to enterprise revision-specific line identity. No blind imports.
3. Implement non-bypass private PostgreSQL transaction gateway and security policies only in a separately approved isolated staging project after DBA reconciliation of E01–E05. Source verifier must rehash E03 original file, scope E02 contract rev and use server-verified principal.
4. Test concurrency: two writers drafting revision, one creating same revision number, allocation percentage race, idempotent retries, stale version, revoked appointments, cross-tenant and sibling-BOQ access, and attempted direct mutation of accepted/locked snapshots.
5. Obtain QS-approved decimal and valuation policy; do not elevate the candidate 4dp/half-up rule into contract valuation. Keep rate, tax, provisional and non-measurable items explicit.
6. Add feature-flagged BOQ review UI and real integration only after controls pass; no auto BOQ → programme generation until E06, no E04 quantity actuals until E07, no progress certificates until E09.
7. Deliver signed PR evidence: code/schema diff, role matrix, test count, source hash, mutation denial, staging readback, migration/rollback, unresolved issues and signoffs.

## Copyable Codex task

> Continue WorkLedger Enterprise WLE-E05 BOQ Revisions & Work-Package Mapping from the isolated candidate only. Pin the E04 parent SHA `b0bc8a523871ef6e398b70df0bcaa1d682866006`, preserve WLE-P1B `1.0.0-rc1` and all E01–E04 holds. Reproduce the E05 synthetic test suite, separately rerun E02–E04, and review the frozen BOQ/legacy mapping. Design and test E05's private versioned registry: exact scoped BOQ snapshots, stable line keys, checked decimals, independently governed approve/lock, append-only source mapping, explicit work-package allocation and factual E04 diary links. Never grant payment/certifier/CIPAA authority or import legacy data by assumption. Do not edit `main`, WorkLedger Standard, Contract Diary, QS Service or any production database. Submit bounded PR-ready artifacts, negative-security proof and staging/rollback plan. Real SQL and pilot require owner/DBA/QS/security/legal approvals.

## No-go

No unreviewed SQL migration, no public `authenticated` allow-all RLS, no direct browser privileged key, no latest-version overwrites, no implicit source IDs, no court-ready or valuation claims. Do not merge `main` without explicit release gate.
