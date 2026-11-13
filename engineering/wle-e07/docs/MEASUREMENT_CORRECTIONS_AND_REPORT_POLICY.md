# WLE-E07-02 — Measurement, Correction and Reporting Rules

## Measurement validation

| Measurement | Candidate representation | Allowed calculation | Not permitted |
|---|---|---|---|
| Physical quantity | positive decimal **string** <=4dp, explicit unit, per observed increment | exact `BigInt` sum within **identical unit** | JS floats; aggregating different units; BOQ valuation; inferred percent |
| Task completion | absolute integer `completion_bp` 0–10000 per accepted-baseline task | last independently verified assessment by observation date | earned value; monetary progress; implied complete status from quantity |
| Planned task | E06 frozen source start/finish/float/duration and source task IDs | read-only baseline display | CPM recomputation, date overwrite or earned-delay entitlement |
| Observed finish | last verified assessment of 10000 bp with observation date | calendar-day difference to frozen plan | EOT award, liquidated damages, contractual date change |

A physical quantity record of 2.5 m³ is NOT a certificate that 2.5 m³ is payable. A programme task assessment of 6000 bp is NOT the BOQ item's certified percentage. WLE E05's 4dp/half-up arithmetic candidate is not ratified contract valuation and is not used in E07.

## Lifecycle

`record_actual → pending_review → independent verify_actual | reject_actual`. A verified record is immutable. To correct, use `void_actual` with explicit reason, new independent current capability check, a new auditable event and retained original record; submit a fresh measure if new factual progress is necessary. There is no silent update, negative quantity adjustment or deletion.

- Capture accepts trusted `submitted|acknowledged` E04 diary, exact version, date and facts SHA. Confirmation requires `acknowledged` diary and independent E07 reviewer. E07 reviewer may be the E04 ack person **only if** owner/security approves that role separation; a distinct E07 reviewer from E07 observation author is mandatory in this candidate.
- Numeric completion progress must not decrease by observation date among unvoided verified entries. Backdated increase that contradicts a later lower verified assessment is rejected, unless explicitly corrected by append-only voids. Same-day ties order by verified event sequence.
- A reviewed physical quantity may be above the original BOQ quantity due to change/remeasurement; this candidate does not hard-cap, auto-price or approve such exceedance. A future QS controls rule must flag deviations without quietly suppressing observations.
- On successor baseline acceptance, new E07 measurement is refused against the superseded baseline; its retained reports and measurements remain queryable with current authorisation.

## Immutable report read model

A report binds `(org,project,contract,baseline_id,baseline_version,import_id,manifest_sha256,boq_snapshot_sha256,as_of_date,source_event_sequence)` and freezes a task-level projection. `completion_bp:null` means **not assessed**; `verified_quantity_by_unit:{}` means **no verified quantity**, not measured zero. Include IDs of contributing measures and diaries, planned dates and source IDs, and counts of unreviewed/voided records. Published reports preserve exact source snapshot and do not change when a later measure is verified, voided or a baseline is superseded. New report = new report ID and checksum.

`as_of_date` is an observation-date cutoff; `source_event_sequence` is an independently pinned event-ledger cutoff. A report contains only verified measurements which existed by that sequence and whose observation date falls on or before the cutoff, excluding voids completed by that sequence. `publish_report` requires `expected_event_sequence`; stale clients cannot silently publish a shifted cut.

The internal hash chain is demonstrative only. It is not independently anchored to a durable ledger, signer, retention system or admissible court evidence.

## UI wording requirements

Use: “Physical progress observation”; “Verified factual progress”; “Not assessed”; “Provisional report — non-contractual”; “Calendar comparison only”. Do not say “certified completion”, “amount payable”, “EOT granted”, “CIPAA served” or “critical delay confirmed” based solely on E07.
