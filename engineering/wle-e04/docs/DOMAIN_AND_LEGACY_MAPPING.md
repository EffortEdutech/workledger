# WLE-E04-01 — Domain Contract, State Model and Legacy Mapping

**Authority:** WLE-P1B `1.0.0-rc1` candidate; WLE-P1 E04 workpack; E01/E01B appointment capability, E02 contract revision registry, E03 evidence custody. Source read: `EffortEdutech/contract-diary-platform` pinned SHA `6d3a9ad292e702100d133095bb03362ab38638dc`, `frontend/src/services/diaryService.js`.

## Core decision
The Daily Diary is a **factual time-ordered site record**, not a certificate, contractual instruction, valuation, notice service, or legal conclusion. It belongs to `(organization_id,project_id,contract_id)` and an explicit project-local `diary_date`, `shift_code` (`day|night`). The proposed uniqueness is per `(tenant,project,contract,date,shift)`. Legacy Contract Diary enforces one diary per `(contract,date)`; reconciling shift/date data is a separate migration decision, not automatic. No future-date or contract-form deadline rule is invented here because project timezone policy and contractual exceptions require review.

## Legacy fields preserved at candidate level

| Legacy `work_diaries` field | Enterprise diary candidate | Comment |
|---|---|---|
| `contract_id` | `organization_id, project_id, contract_id` | Canonical UUID crosswalk required; never assume legacy and enterprise IDs match |
| `diary_date` | `diary_date`, plus `shift_code` | Shift change is a candidate; one-per-day migration review pending |
| `weather_conditions` | `facts.weather_conditions` | Options include Sunny, Cloudy, Rainy, Heavy Rain, Stormy; E04 also allows Other/Not Recorded |
| `site_conditions` | `facts.site_conditions` | Factual free text; no AI alteration |
| `work_progress` | `facts.work_progress` | Mandatory on submission, not necessarily on offline draft |
| `manpower[]` | `facts.manpower[]` | Trade, non-negative headcount, hours as decimal string |
| `equipment[]` | `facts.equipment[]` | Type and count |
| `materials_delivered[]` | `facts.materials_delivered[]` | Material/unit/quantity decimal string; **not a BOQ valuation** |
| `issues_delays` | `facts.issues_delays` | Factual note only, not a contractual EOT notice |
| `status` | `draft`, `submitted`, `acknowledged` | Original legacy progression preserved |
| `created_by` | `author_user_id` | Derived from trusted server auth, never command payload |
| `acknowledged_by`, `acknowledged_at` | recorded server fields | Requires independent eligible MC reviewer |

Legacy `acknowledgeDiary` source has `TODO: Add role check for MC ... For now, any user can acknowledge`. This is an observed code-level authorization gap (carried as `CDP-SEC-004`) not resolved in that separate application by E04. E04 candidate explicitly denies read-only or submitter acknowledgers, but requires actual E01B/Supabase integration before it is a deployed control.

## Server transaction protocol (candidate)

- `sync_draft`: create draft with `expected_version=0`, or replace full factual snapshot in existing author-owned draft using `expected_version=N`. The server checks current appointment and exact canonical contract scope. Partial patches and last-write-wins are prohibited. Every accepted version is represented by event digest (content history must be retained in a reviewed storage implementation; current synthetic store only retains latest draft state).
- `attach_evidence`: while draft, only the original diary author can link a unique E03 `evidence_id`, with verified object integrity, recomputed bytes and exact contract scope. Physical storage and mutation ordering remain E03 ownership.
- `submit`: only author, completed weather+work progress, author currently appointed with `construction.diary.submit`; change status to `submitted`, lock factual snapshot and emit receipt.
- `acknowledge`: only submitted, another verified user with `construction.diary.acknowledge` and `main_contractor_reviewer` capacity in same contract. Acknowledgement is a receipt of a factual record, not certification of amounts, legal claims, or agreement with all statements.

## Candidate event family
`diary.draft_synced.v1`, `diary.evidence_linked.v1`, `diary.submitted.v1`, `diary.acknowledged.v1`. Every successful command has an idempotent receipt and pending outbox row; deterministic sorted-key JSON hash chain is **not** RFC 8785 JCS, digitally signed, externally anchored, or guaranteed tamper-proof against privileged operators.

## Decisions left open
Canonical link to accepted E02 contract revision; legacy source crosswalk and approved import strategy; dispute correction/supplement policy; multiple shifts per day; custody of paper/photo originals; project timezone/future-date exceptions; measured work quantities (E05/E07); weather authoritative provider; independent reviewer nomination/bootstrapping; offline multi-user controls. No source-system-of-record switch.
