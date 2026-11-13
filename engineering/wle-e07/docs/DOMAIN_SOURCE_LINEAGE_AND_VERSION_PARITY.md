# WLE-E07-01 — Actuals Domain and Source Lineage

**Authority**: WLE-P1-14 Workpack E07; P1B `1.0.0-rc1` provisional logical DTO; E04 immutable diary after submission/acknowledgement; E05 locked BOQ version; E06 signed, professionally confirmed QS manifest and independently Enterprise-accepted baseline. Source refs observed on 13 Nov 2026.

## Ownership

- **E06** controls creation of immutable Enterprise programme baselines after independent Enterprise acceptance. QS native IDs (positive integer) remain external refs. E07 cannot approve/replace a baseline or validate a QS professional decision itself.
- **E04** controls factual site diaries (date, shift, facts, evidence references, author, version and submitted/acknowledged status). `submitted` means the author submitted a diary. `acknowledged` means a separate appointed reviewer acknowledged the factual diary. Neither state asserts that a particular completed percentage or measured quantity is validated.
- **E05** controls BOQ version and work package allocations. A diary↔work-package reference does not establish a programme task↔BOQ line mapping. E07 therefore does *not* auto-map E05 lines to E06 tasks or compute value from E05 rates.
- **E07** controls observation measure, independent factual review, corrections and projection/report snapshots. No contractual entitlement or claim value is written.

## E07 progress measure frozen identity

`organization_id`, `project_id`, `contract_id`, `baseline_id`, `baseline_version`, `import_id`, `manifest_sha256`, `boq_version_id`, `boq_snapshot_sha256`, `source_instance`, `source_revision`, `external_programme_id` (QS integer), `canonical_task_id` (WLE UUID), `external_task_id` (QS integer), `diary_id`, `diary_version`, `diary_facts_sha256`, original `diary_evidence_ids`, `observation_date` (project-local `YYYY-MM-DD`), measurement type and value, creation actor, review/void actor, version and event sequence.

**Invariant:** Every verified observation retains ALL source IDs and its accepted baseline authority. It never floats to the latest baseline merely because a new one is active. When an E06 successor baseline becomes active, retain the prior baseline and its historical E07 observations/reports. A successor actual must be independently captured and mapped; do not copy by WBS title.

## Accepted-baseline proof (injected port, not a real E06 bridge)

`verifyAcceptedBaseline` must return exact tenant/contract, baseline ID, import ID, status `active|superseded`, positive baseline version, manifest digest, E05 BOQ revision/digest, QS source namespace/native programme ID/revision and immutable task snapshots with native/canonical task IDs and dates. Candidate tests inject this object; production must retrieve and validate independently signed E06 manifest/import/acceptance receipts, not accept the caller's object.

## Diary proof (injected port, not a real E04 bridge)

`verifyDiary` returns exact tenant/project/contract, diary ID, immutable version and local date, `submitted|acknowledged`, trusted diary facts SHA-256 and attached evidence IDs. The actual record captures digest + E03 reference IDs at observation time. Review must recheck the same digest and attached IDs; if E04 changed unexpectedly or original E03 custody was not proved, production must hard-fail. E03 original-byte integrity and attachment existence are **NOT** independently verified by E07's current synthetic implementation.

## High-risk ambiguities deliberately unresolved

1. Unit-specific precision, physical quantity measurement methodology, work-package/task allocation and cumulative vs remeasurement measurement policy need authorised QS approval.
2. E07 uses two distinct types: incremental physical quantity and absolute task completion basis points. Their values are **never convertible by default**. Completion basis points require reviewed measurement evidence and assessment method by task.
3. Diary status `acknowledged` is *not* a payment certificate or acceptance of unit quantity. Separate E07 reviewer decision enforces this distinction.
4. Calendar-day difference between the observed 100% date and planned finish is a simple arithmetic comparison, not CPM rescheduling, float analysis, delay causation, compensation event or EOT.
5. Report hash is a synthetic canonical JSON digest. It is not a digital signature, original evidence custody proof or court admissibility opinion.
