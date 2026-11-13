# WLE-E06-02 — BOQ Authority, Native ID Crosswalk & Workflow State

## Source-of-truth boundary

- E05 holds exact immutable `{organization_id, project_id, contract_id, boq_id, revision_id}` with stable item keys and `work_packages[].allocations[]` (basis points); only status `locked` and `current=true` are eligible for a **new** QS request.
- E06 content-addresses a normalised server-read E05 snapshot using SHA-256 of canonical JSON. This is distinct from E05's original `source_sha256`, which hashes original input document bytes; neither digest certifies legal source authenticity.
- Prior to dispatch the trusted `verifySourceAlignment` must compare exact E05 revision digest and canonical contract scope with actual QS project/BOQ import, including item-by-item source IDs, units, quantities, provisional types, and unit-specific precision. E06's mock port returns a synthetically verified answer; **this check is NOT currently performed against a live QS database**.
- QS `projects.project_id`, `programmes.programme_id`, `programme_tasks.task_id` and `boq_items.boq_item_id` use positive native integers. Enterprise IDs are UUIDs; explicit source_instance+qs_project_id mapping is one-to-one within tenant/project/contract.
- E05 work packages describe scope allocations; QS planning work packages and WBS activities are different taxonomies. Never auto-match on package title or code alone. E06 does not calculate duration or CPM.

## Lifecycle

`Unmapped → map_project → request_generation (queued) → private dispatch → QS stage/status events → confirmed + complete → signed manifest ingestion (pending_acceptance) → independent Enterprise accept_import (active baseline)`.

QS status transitions are tracked as events. On `reopened`, non-accepted imported candidates are marked `invalidated_reopened`; previously accepted Enterprise baselines are retained unmodified, and new revision/supersession requires new request and acceptance. Failed/withdrawn jobs are not deemed accepted.

## Current candidate tradeoffs

- `canonicalJSON` is a restricted RFC 8785-inspired implementation in Node: sorted UTF-16 property keys, ECMAScript JSON encoding and rejection of non-JSON numbers. Formal cross-language JCS conformance, unicode edge fixtures and signed raw byte transport still require review.
- `taskCrosswalk` preserves an external task's canonical UUID across the same source programme ID's revisions. A newly created QS programme is a different source identity even if it has a similar title or WBS code.
- E06 accepts no browser-supplied `actor_user_id` or roles; requires E01 appointment port for `map_project`, `request_generation`, `accept_import`, and read. New capabilities are proposed and **not pre-granted**.
- Source-native review decision verification is mandatory after cryptographic validation; a signature alone proves only possession of an allowlisted signing key, not QS professional eligibility or contract acceptance.
- No QS superuser `postgres` key, service-role secret or customer data is stored in browser; no direct shared SQL schema access is authorized.
