# WLE-E06-03 — Signed Manifest, Job Dispatch & Safe Replay

## Outbound dispatch (synthetic transport port)

`dispatchGeneration({dispatch_token,request_id})` must be invoked by a verified private worker only. It reads the stored request, re-verifies E05 locked revision and QS source alignment, and calls the injected `submitQSRequest` with `api_version:wle.qs.v1`, exact native project ID, immutable BOQ version/hash and stable `idempotency_key=request_id`. A successful simulated QS receipt is stored; network failure leaves request queued for retry. **No QS HTTP route is called in this candidate.** The production QS endpoint must independently implement server-to-server auth, tenant-to-project check, atomic idempotency and least-privileged DB access.

## Manifest verification

Manifest body `schema_version:1.0.0-rc1`; `source_system:qs-service`; numeric QS project/programme/task IDs; `source_instance`,`source_revision`,`programme_status:confirmed`,`generation_stage:complete`; canonical tenant UUIDs; locked `boq_version_id`,`boq_snapshot_sha256`; immutable calendar, task dates/durations/floats, dependencies (FS/SS/FF/SF), source engine/skill stage provenance; professional decision; publication timestamp.

1. Reject missing, extra or inconsistent fields before trust assertions. Validate every native ID, task uniqueness, dependency reference, self-edge, duplicate edge and directed cycle. Preserve dates and CPM values from QS—never silently recompute.
2. Recompute `manifest_sha256` from canonical JSON of all manifest fields **excluding** `manifest_sha256` and transport signature. Real Ed25519 signature is verified with a *trusted supplied public key* against those bytes. Key is sourced from an injected registry port; real key lifecycle/rotation/revocation is not built.
3. The QS service token, project crosswalk, BOQ version/hash and native professional decision must separately verify. Never treat a hash, a `confirmed` string, an AI recommendation, a browser claim or signature timestamp as sufficient contractual authority.
4. Inbox dedupes `(source_instance,event_id)`; a reused ID with altered digest fails. Separate `(source_instance,external_programme_id,source_revision)` manifest identity cannot be re-pointed or published with changed content. Stable task mapping is explicit.
5. Ingest yields `pending_acceptance` only. No programme is active until independent Enterprise appointed reviewer accepts with optimistic baseline version and separate receipt. Previous accepted baseline immutable except being marked superseded.

## Non-atomic external transport

QS side effect and Enterprise receipt cannot share a physical transaction. A remote request may succeed before Enterprise commit fails. Retry must use the *same* request ID and require QS to return the same remote job/acceptance receipt; add reconciliation and dead-letter queue with human intervention in production. The synthetic lock/clone transaction is **not** a distributed transactional guarantee, nor an outbox publisher.

## Operational safeguards still required

mTLS/workload identity and per-source keys; rotation; nonce/clock tolerance; replay horizon; canonicalisation interoperability; validated QS endpoint; secret-manager inventory; production source-file byte custody; external publisher/outbox monitoring; schema evolution; QoS/rate limits; durable inbox; privacy/log redaction; approved failover/recovery; independent signer appointment register and audit anchoring.
