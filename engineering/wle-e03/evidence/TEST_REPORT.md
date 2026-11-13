# WLE-E03 — Executed Local Test Evidence

- **Date:** 13 November 2026 (MYT)
- **Execution environment:** isolated local container; Node.js v22.16.0 / npm 10.9.2.
- **Command:** `cd WLE-E03_Candidate_v0.1 && npm test`.
- **Result:** **45 passed / 0 failed / 0 skipped**, see `NODE_TEST_OUTPUT.txt`.
- **Mechanism:** Node built-in test runner, synthetic serialized in-memory copy-on-write database *and object storage*, actual SHA-256 byte digests, injected independent authorisation and reviewer callbacks.

## Covered
- Byte digest, mutated claims, zero bytes, filename traversal, forged principal, unknown field, cross-tenant/sibling contract denial.
- Replay, altered idempotency payload, 12 concurrent same-key submissions in one process, synthetic transaction fault rollback, event/outbox/receipt presence.
- Rehash private stored data, corrupt object rejection, separate redacted derivative, immutable original.
- Hold creation, independent release, self-release ban, repeat-release ban, audit history retained.
- Export manifest, active hold references, deterministic event hash links, E02 verification port signer missing/wrong-party/wrong-hash checks; no legal signature validity assertion.

## Inherited E02 regression
The extracted local E02 candidate ZIP was tested with its own Node script: **30 passed / 0 failed**, recorded in `E02_REGRESSION_OUTPUT.txt`. No PostgreSQL or Supabase runtime was involved.

## NOT TESTED / cannot be inferred
- PostgreSQL DDL/RLS, grants, multi-process concurrency or distributed locks.
- Supabase Auth `getUser`, Storage private bucket, upload streaming, object readback and physical retention.
- Actual e-signature identity, legal hold decision, Malaysian regulatory compliance, legal service/CIPAA admissibility.
- Persistent audit trust anchoring, external hash chain signing, outbox dispatch and dead-letter queues.
- E02 shared SQL transaction or E01B integration; Vercel preview / build compatibility / production effects.

This report is an engineering assertion tied to the attached local `node:test` log, not evidence of staging acceptance.
