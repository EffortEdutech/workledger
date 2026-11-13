# WLE-E06-01 — Actual QS Source Verification & Contract Lineage

**Read on 13 November 2026 MYT.** Private repo `EffortEdutech/QS-Service` observed main SHA `9dc3555b841b9fe1cc0b1d07a62648d2b8a116be`, `qs-web-app/src/lib/workProgramme/orchestration.ts` blob SHA `e9298f09fdf42a26140790537654dab106f8d974`; `qs-web-app/package.json` inspected.

## Directly observed

- `generateDraftProgramme(projectId:number, options)` creates an actual QS `programmes` database row with `status='draft'`, `generation_stage='discipline_profiling'`, and a first-stage job item. Native project and programme identities are SQL integer IDs.
- `advanceProgrammeStage` requires completed stage job, output schema validation and professional confirmation. It runs downstream WBS/dependency/duration/CPM engines within its documented stage gates. Reopen operation invalidates/supersedes downstream materialisation rather than treating previous output as current.
- Stage enum observed: `discipline_profiling`, `activity_mapping`, `wbs_structuring`, `sequencing`, `productivity_strategy`, `cpm_review`, `programme_review`, `complete`. Six skill IDs in `STAGE_SKILL` (five skill stages plus director review). Note source file's historic first paragraph predates later additions; actual exported functions and enum govern.
- `beginProgrammeDirectorReview` requires `status='draft'`, stage `cpm_review`; `confirmProgrammeBaseline` only operates with `status='draft'`, stage `complete`, and an approved `stage:programme_review` decision, then writes `status='confirmed'` plus `stage:baseline_confirmation` decision.
- `loadBoqItemRows` reads numeric `boq_item_id`, `quantity`, `unit`, section, trade code, source flags from QS's own `boq_items` table by numeric `project_id`.
- QS `package.json`: Next.js 16.2.11, Node-backed PostgreSQL `pg`, `tsx`, separate tests for baseline confirmation / DB / orchestration. **These tests were not executed for this E06 delivery.**

## Proposed, NOT observed in QS repository

- No verified deployed `POST /v1/enterprise/programme-requests` endpoint, QS job service credential mechanism, `programme-baseline-v1` manifest publisher, WLE crosswalk, signed publication endpoint or proof of QS-side BOQ importer was established. E06 builds injectable private ports and wire schema candidate only, not their live implementations.
- QS numerical `boq_item_id` references and planning taxonomy `planning_work_packages` must not be mistaken for E05's UUID item_key / revision-local work-package identity. A DBA/QS-approved explicit item-by-item reconciliation and unit conversion policy is mandatory before real dispatch.
- QS does not receive Enterprise authoritative baseline status automatically from `confirmProgrammeBaseline`; it indicates QS's own reviewed status. WLE appointed authority must separately accept imported baseline.

## Authority hierarchy and holds

WLE-P1B `1.0.0-rc1` (provisional) and `06_QS_INTEGRATION_MANIFEST_AND_BASELINE_FREEZE.md` define the contract; WLE-P1 `08_QS_SERVICE_INTEGRATION_CONTRACT.md` defines boundaries and fixtures. E05 source SHA `3ed34c804fce2f4153b23f77800730180a92b09f` provides immutable BOQ. E01 appointment and E03 original-byte custody not yet staged. E06 must not change E05's QS-unapproved decimal convention or infer an E02 seal validates legal signatory status.
