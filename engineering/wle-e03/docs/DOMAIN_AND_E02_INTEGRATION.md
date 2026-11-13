# WLE-E03-01 — Evidence Domain & E02 Contract Integration

**Authority:** WLE-P1B logical DTO candidate `1.0.0-rc1`; WLE-P1-10 Evidence Chain, Audit and Offline Synchronisation; isolated WLE-E02 candidate from `feature/wle-e02-contract-version-registry` (commit `8962a44fbd5301b366420cd22108b224f4e12535`). This package does not revise frozen public wire DTOs.

## Custody model
An evidence `evidence_id` belongs to one `(organization_id, project_id, contract_id)`. It records source record type and ID, original filename, declared media type, independently derived `size_bytes` and lower-case `sha256`, captured and occurred instants, server uploaded instant, uploader principal and appointment, retention class, provenance source, visibility and a storage-object key calculated by the trusted backend. The **preserve** command requires original bytes; the backend calculates SHA-256 before accepting any declared hash. A hash supplied by the client alone cannot create a preserved receipt. Candidate ceiling is 16 MiB for synthetic tests only.

`detected_media_type` is explicitly `null`: magic-byte sniffing, scanning and malicious-content quarantine are not implemented. The object store is in-memory only. The original is never replaced. **redact** makes an independent derivative asset with new SHA and `redaction_parent_id`, and a separate object key; no original overwrites or in-place redaction. OCR/previews will likewise require derived evidence IDs in a later phase.

The `legal_hold` field is a derived status from the independent hold ledger, not an asset mutation. The snapshot's string `derived_from_hold_ledger` is an engineering marker only; production projections should return a separately computed boolean/active count after authorisation. There is **no delete API** in this candidate. No default retention duration or destruction policy is invented.

## Commands and capabilities
Private, server-only commands: `preserve`, `redact`, `place_hold`, `release_hold`, `export_manifest`. Each requires a unique command ID, stable idempotency key, composite scope, one acting appointment, reason and a server-verified principal. A supplied `actor_user_id` or caller-chosen storage key is rejected.

Capabilities are **new candidates**: `construction.evidence.preserve`, `.redact`, `.hold`, `.hold_release`, `.export`, `.read`. No E01B low-risk appointment workflow may grant them automatically. Read of a physical original requires a fresh backend capability check and recomputed digest; a signed URL is **not implemented**. Release of a hold requires a different actor and an independent reviewed release callback; mocked callbacks are not evidence of real approvals.

Every accepted state change creates one event, one pending outbox row and one command receipt in a synthetic serialized transaction. Exact replay returns the original receipt; altered payload or bytes under the same key returns `idempotency_conflict`. This **does not prove** distributed Postgres idempotency or object/database atomicity.

## E02 `verifyDocumentEvidence` boundary
`verifyForE02` accepts E02's server-only expected scope, evidence ID, claimed byte digest, signer party and transactional context. It first validates that the original/derivative object exists in the same scope and rehashes stored bytes; it then requires a **distinct trusted party-evidence verifier** callback to validate the asserted party. If no verifier is installed, it returns `{verified:false}`. If configured and checks match, its receipt reports `byte_integrity_verified:true`, matched scope, `party_id`, evidence timestamp and `signature_validity:'not_assessed'`.

This E03 port is a **candidate interface**, not a shared PostgreSQL transaction across E02/E03 and not an e-signature validation service. A deterministic mocked verifier returning true does not establish genuine signer identity, signature, consent, authority, witnessing or legal enforceability. E02 seal and executed-contract status must remain disabled until independent signer assurance, real byte custody and legal review are proven.

## Audit and export
Audit event envelope contains IDs, aggregate, actor and appointment, request, UTC timestamps, previous/next state, reason, correlation/causation, source payload and prior event hash. Hash is deterministic sorted-key JSON **not RFC 8785/JCS**, not digitally signed or externally anchored. An append-only chain can reveal changes within its trust boundary but does **not** prevent a privileged operator rewriting both events and hashes. Production requires signer/clock controls, append-only enforcement, independent checkpoints and checked readback.

Export manifests list exact evidence IDs, file digests, size, parent ID, retention class, active hold IDs, and audit chain head. Export itself creates a new audit event. The manifest is a snapshot **without file bytes** and must not be described as court-ready by default.
