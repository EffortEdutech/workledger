# WLE-E05-01 — BOQ Domain, Source Lineage & Revision Rules

**Authority:** WLE-P1B `1.0.0-rc1` candidate / WLE-P1-14 workpack E05; E01 tenant/appointment; E02 contract revisions; E03 evidence; E04 factual diary. All outputs are NON-PRODUCTION.

## Directly inspected repository sources

- `EffortEdutech/contract-diary-platform` pinned `6d3a9ad292e702100d133095bb03362ab38638dc`, `frontend/src/services/boqService.js`: creates BOQ header in `boq` with `contract_id`, `currency`, draft status. Sections `boq_sections` use `boq_id`; line `boq_items` uses `boq_id`, `section_id`, `item_number`, description, `item_type`, `unit`, `quantity`, `unit_rate` and display order. Legacy BOQ header supports `draft`, `approved`, `locked`, but this file's status update permits a direct status update; it does not demonstrate independent approval or immutable revision snapshots.
- `DAILY_LOG.md` explicitly identifies an earlier `boq_items.contract_id` query failure and correction to using `boq_id`. **Do not mistake the older ai-context `database_tables.md` suggestion ("confirm actual table name") for observed physical schema.**
- `docs/Link n Ai/01_work_diary_link_guideline.md` describes BOQ as commercial scope basis, with programme and diary linkage separate and claim traceability requiring links. It is an architectural guideline, **not verification that every legacy database constraint is enforced**.
- `WLE-P1-14` defines E05 as BOQ revisions/work-package mapping, followed by E06 QS adapter, E07 programme actuals, E09 commercial claims and E11 counsel-reviewed CIPAA evidence. That order is preserved.

## Candidate enterprise BOQ identity

Each snapshot is scoped to `(organization_id,project_id,contract_id,boq_id,revision_id)`. A `revision_no` records its order. The first revision has `base_revision_id:null`; a new revision must reference the most recent **locked** predecessor. A further revision is a new immutable record; it never rewrites the approved predecessor. Different contracts cannot share an implicit BOQ authority.

**Frozen line identity:** `item_key` remains stable across revisions of the *same BOQ* when describing the same work scope; `item_code` is the human-facing numbering within one snapshot. Added/omitted/changed scope is computed by comparing line keys and contents. Source crosswalk records old source ID and source revision. `item_code` alone is never a primary key across versions.

## Header / line mapping

| Legacy | Enterprise candidate | Caution |
|---|---|---|
| `boq.id` | `boq_id` via explicit crosswalk | Never assume UUID parity |
| `boq.contract_id` | enterprise org/project/contract tuple | Contract lookup trusted server-side |
| `boq_sections.id` / section_number | `section_code` text | Section crosswalk design remains open |
| `boq_items.id` / `boq_id` | `item_key`, scoped `revision_id` | Need source instance and source record revision |
| `item_number` | `item_code` | Unique only within revision |
| `quantity` | decimal string (4dp candidate) | No float in command payload |
| `unit_rate` | decimal string (4dp candidate) | Exact decimal; QS policy remains open |
| `amount` | computed two-decimal candidate amount | Not certified amount or claim value |
| `item_type` | measured / lump_sum / provisional | More legacy item types need reconciliation |
| BOQ `approved`, `locked` | separately guarded states | Independent reviewer in candidate, not assumed legacy behaviour |

## Work packages

`package_id` is an identity within a particular BOQ revision; `package_code`, `title`, `discipline` and `allocations[]` define the proposed execution grouping. Each allocation uses `{item_key,share_bp}`. `share_bp` is an integer in 1..10000 (10,000 = 100%). Sum per item across packages cannot exceed 10,000. Multiple packages may split a BOQ item, and some items may remain unallocated. Allocation is a **scope coverage descriptor**, not a quantity, productivity or value-weighted programme calculation.

## E04 and future linkage

`link_diary` is limited to a **locked** BOQ revision and a trusted, same-scope E04 diary in `submitted` or `acknowledged` state. The link only stores an observation reference. It does **not** convert diary quantities into BOQ completion, alter the accepted baseline or create a progress claim. E07 will own measured actuals and E09 the commercial valuation/certification boundary.

## Open decisions

- Accepted BOQ source of truth and owner approval of revisions; relationship to E02 sealed contract version versus E02 registered version.
- Whether pricing supports more decimal places, provisional sums, prime cost sums, currencies other than MYR, taxes and contract-specific rounding.
- Quantity precision by unit, negative adjustments, credited amounts and eventual import of legacy section hierarchy / item breakdown.
- WBS hierarchy and split/merge treatment of line keys; baseline scope reconciliation after variation orders.
- BOQ import formats and large-batch SQL path; template/version provenance, import duplicate handling and source evidence signed authenticity.
- Work-package allocation interpretation and whether 100% coverage should become mandatory at later gate.
