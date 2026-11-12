# WLE-E02-01 — Domain Contract & Candidate Decisions

**Status:** candidate, subordinate to WLE-P1B `1.0.0-rc1` and E01/E01B source authority. Do not reinterpret architectural candidates as owner-signed freezes.

## Scope & aggregate

`organization_id`, `project_id` and `contract_id` are the E01 canonical composite scope. `revision_id` is a new UUID. `revision_no` is a positive integer unique inside one scoped contract. `contract_revision_records` is an append-only registration; `contract_signed_evidence_seals` is a one-time insert-only evidence lock, **not an automatic legal signature validator**. Corrections to a version require a new `revision_id`/`revision_no`; no silent overwrites.

A `register` command includes `form_code` (explicit string or `null` if not yet selected), `timezone` (valid IANA name), `key_dates` (typed project-local calendar dates or explicitly null, no calculated deadlines), E01 `party_ids`, `source_document_sha256` and `source_document_reference`. The source hash is metadata until independently verified against original bytes; no contract sum or retention default is introduced. Contract form legal clauses and monetary fields remain governed by a future reviewed form-specific schema.

A `seal` command requires an already registered scoped revision, a `signed_evidence_id`, supplied signed file SHA-256, `signed_by_party_id` linked to that precise revision, and a trusted `verifyDocumentEvidence` result that confirms its own scope, party, digest and verification time. It stores exactly one locked seal. This test port represents **verified evidence data**, not a legally established signer, consent, authority, witnessing or enforceability opinion. Production needs E03 physical byte integrity, signer-authenticated evidence and legal review.

A `map` command requires `source_system`, `source_instance_id`, `source_entity_type`, `source_record_id`, `source_revision` and exact `revision_id`. Key is the five-part immutable source identity, not a name or source integer alone. One canonical revision may have multiple source aliases; one source key may never map to two canonical revisions. QS and Contract Diary are separate sources with distinct administrators; no automated transfer of ownership.

## Private command envelope and result

All three commands share: `command_id`, `idempotency_key`, `organization_id`, `project_id`, `contract_id`, `acting_appointment_id`, `expected_version`, `reason` plus kind-specific fields. No `actor_user_id`, browser-side role, `is_admin`, token or raw key is accepted in the body. Server identity comes from verified bearer token; role capability is validated inside each transaction. E02 command forms are **private candidates**; no public OpenAPI or modification of frozen `1.0.0-rc1` DTOs is asserted.

`register` and `map` require `expected_version=0`; `seal` requires `expected_version=1` for a registered, not-yet-sealed revision. Response includes status, revision ID, version and event ID. Accepted request idempotency is scoped by `(organization, authenticated actor, command kind, revision ID, idempotency key)`. A same-key same-payload retry reuses the receipt; a same-key altered payload fails with `idempotency_conflict`. Transport `command_id` is excluded from the business fingerprint; it stays in new audit events.

## Candidate capabilities

- `construction.contract.revision_create` to register a new revision;
- `construction.contract.revision_seal` to attach independently verified signed evidence;
- `construction.contract.source_map` to confirm a source-key mapping.

There is **no implicit permission** from `construction.contract.read`, membership or a platform admin profile. The capabilities are not part of the E01B low-risk appointment-grant allowlist; they require a separate owner-reviewed provisioning policy and authorised signer bootstrap. Commercial certificates and legal/court service require independent future capabilities and controls.

## Audit & evidence policy

Each state-changing command atomically records a scoped event, SHA-256 event-payload digest, **pending** outbox row and idempotency receipt. Event digest in the synthetic adapter uses deterministic sorted JSON keys; it **is not yet RFC 8785 JCS or a legal evidence hash standard**. The file SHA is a claim until raw bytes have been verified by a controlled evidence service. Outbox transport, retries, DLQ and retention/legal holds remain future work; an event row alone is not external delivery.

## Non-implemented items

No database adapter, HTTP route, frontend UI, signed PDF verifier, e-signature provider, legal form checker, payment, CIPAA case workflow, actual date calculators, customer migration, or storage object upload. E01B private command logic is not amended; no new live permission is granted. This work is fit for code review and subsequent isolated integration, not deployment.
