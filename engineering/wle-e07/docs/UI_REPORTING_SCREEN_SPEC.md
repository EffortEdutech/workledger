# WLE-E07-04 — Programme Progress & Reporting Screen Specification

**Disconnected concept only.** No React route, production data, user login or live E04/E06 adapter. The supplied HTML prototype uses invented IDs, counts and dates.

## Route structure (proposed, not deployed)

- `Programme > Baseline`: frozen programme scope, QS source namespace and programme integer ID, import manifest hash, independently accepted Enterprise baseline version, source revision, status active/superseded, E05 BOQ version and original source. Include provenance and immutable history timeline.
- `Programme > Actuals`: task table with canonical task UUID + QS external task integer, WBS, baseline start/finish/float, observed diary references, submitted observations, verified measures and audit/review/correction states.
- `Programme > Reports`: choose exact baseline version + as-of local date; show event-sequence cut, source hash, provisional/factual report state, task rows and explicit null/not-assessed percentages. Publish requires named authorised appointer and current event sequence. Historical reports always read-only.

## Capture fields (reviewer and recorder separated)

Reporter chooses exact active baseline and task, E04 diary/date/version, evidence link; then **quantity increment with explicit unit** OR **completion assessment basis points**. The UI must never silently transform quantity into percentage, or a diary's free text into measured facts. Submit creates `pending_review`; independently appointed reviewer can verify/reject with a reason only after E04 acknowledged and unchanged evidence receipt. Corrections append a void with reason and retain original.

## Progress visualisation constraints

- Planned programme dates and floats are read-only E06 source values, never E07-calculated CPM.
- Completion `null`: display **Not assessed**; 0bp (verified): display **0.00% (assessed)**. Never conflate.
- Quantity ledger grouped by unit; no “total quantity” across m³, m², m or item.
- Date difference is labelled **Observed finish vs planned finish — calendar days only**, not late payment, critical delay, EOT or LD.
- Always show current baseline vs historical baseline badge; a superseded baseline can be viewed but not receive new progress.
- Report contains direct identifiers / provenance but must not expose sensitive evidence bytes or other-tenant identifiers in UI logs/URLs.

## Accessibility & production controls

Keyboard access, accessible table headings, labels separate from status colour, responsive overflow, visible focus, sensible mobile panels; no privileged client JWT/service signing keys in web storage or JS bundle. Actual command endpoints feature-flagged **OFF** by default, and must not be displayed as operating before staging passes.
