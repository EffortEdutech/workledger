# WLE-E04-02 — Offline Sync, Evidence Intents and Client Data Protection

## Scope
The supplied `createOfflineDiaryQueue` is a **Node memory reference**, not a deployable browser offline store. It models draft-only outbound commands and local raw evidence intents. It cannot cache or exercise authority to submit or acknowledge. The offline user's last-login profile, cached appointment, status badge or device timestamp cannot authorise later server operations.

## Draft sync algorithm

1. Local application receives a new UUID for `diary_id` and one UUID per operation, plus `device_id`; `diary_date` and `shift_code` are explicit. Capture factual fields locally; queue full snapshots, not last-write-wins partial patches.
2. Each outgoing operation retains one `idempotency_key`, `expected_version`, and body hash. A retry uses the same business payload/key; a fresh `command_id` is transport-only. Multiple offline edits of one diary receive consecutive expected versions. Queue order must be preserved.
3. When network is available, user explicitly reauthenticates. Private server calls `getUser(access_token)` and checks current E01/E01B contract appointment and capacity **within the transaction**. Never trust a browser actor ID or cached role.
4. Server rejects cross-tenant, stale-version, revoked appointment, ID collision and unrecognised diary/shift. Client retains the disputed operation and factual input in `conflict` state, offers non-destructive human review/rebase; never silently overwrite.
5. Only a server-issued receipt for exact `diary_id`, next version and draft status marks an outbound draft `synced`. A failed request is retained with the same key and expected version for safe retry.

## Evidence-intent lifecycle

1. Capture local original image/document bytes while offline. Hash **actual bytes** immediately, store image bytes under a protected local key and queue its filename/size/digest. E04 reference uses `Buffer` memory, not durable storage. A client SHA is only an integrity expectation, **not** proof of preservation.
2. On reconnection, upload through an E03 authorised custody workflow; the server performs independent hash-on-bytes, malware/media checks, quarantine, scoped object storage, readback and reconciliation (real components remain unimplemented).
3. Only after independently verified E03 preservation may a server-authenticated `attach_evidence` command link the ID/digest to the **same diary and exact tenant/contract**. An E04 attachment receipt is required separately. Local `readyForServerSubmission` denies while any draft is unsynced or any evidence intent is not linked.
4. Never delete locally captured evidence merely because an upload request began; retain until independent preservation + diary-link receipts and reviewed backup policy. Real cleanup must consider file custody/legal hold/privacy.

## Production browser/security backlog

- Use IndexedDB (not `localStorage` for binary files), per-user and per-tenant partition, encrypted at rest under a platform-managed device/session strategy; evaluate practical key custody, browser private mode and device loss risks. Do not present web-origin local encryption alone as complete protection against a compromised device or XSS.
- Define quotas, retention/eviction, crash durability, service-worker registration/update/invalidation, background sync availability, battery/network limits, browser restarts, multiple tabs and multi-device edits.
- Prevent cross-account reuse after signout; reliably clear/export or protect pending drafts with user consent and verified identity; never store bearer tokens in queued commands.
- Quarantine unsafe files, apply media-type validation, check EXIF/location privacy and permit only controlled preview of trusted derivatives. Avoid public object URLs and uncontrolled signed URL caching.
- Server actor/role must be fresh at every retry. An offline request is **draft intent**, not a submitted diary or time-of-service proof. UTC capture time, server receipt time and project-local working date must be distinct and trusted appropriately.

## Failure matrix

| Failure | Expected outcome |
|---|---|
| Offline / network loss | Keep pending draft/evidence; no auto-submit/ack |
| Request retried after timeout | Same idempotency key, same payload; one business effect |
| Same key, changed content | `idempotency_conflict` |
| Another device updated draft | `stale_version`; require reviewed reconciliation |
| Contract appointment expired or revoked | Forbidden at sync, including replay |
| E03 digest/scope mismatch | Refuse attachment, preserve original locally pending review |
| E03 upload succeeds, E04 link fails | Retain custody ID; retry exact link, reconcile orphan/custody |
| Server event/outbox write fails | Roll back current DB transaction; if storage already happened perform custody reconciliation |
| Captured image never re-uploaded | Keep diary draft unsubmitted unless a reviewed exception policy exists |
| User tries to acknowledge offline | Never available in offline queue |

Acceptance is **synthetic only** until a browser IndexedDB implementation, durable storage, real JWT/RLS, distributed concurrency and independent security review have passed.
