# WLE-E02 Candidate v0.1 — Executed Test Evidence

**Run:** 13 November 2026 (MYT), isolated local container, Node.js v22.16.0, npm 10.9.2.  
**Command:** `npm test` at candidate package root.  
**Result:** **30 passed / 0 failed / 0 skipped**; total runner elapsed ~215 ms.  
**Type:** Node built-in `node:test` with in-memory serialized transaction adapter, no external database.

## Test classes

- Create immutable revision and atomic synthetic audit/outbox/receipt; exact retry, collision, revision number conflict.
- Cross-tenant, wrong party, read-only capability, forged principal, invalid bearer, invalid dates/timezone/metadata and stale expected-version denial.
- Missing revision and evidence unverified/wrong hash/wrong tenant denial; single sealed snapshot, second seal immutable and exact party requirement.
- Source instance namespace, duplicate mapping, crosswalk collision and cross-contract/missing-revision denial.
- Fault-injection rollback, 10 parallel same-key replay in one-process transaction queue, revoked capability on replay, strict source input and forbidden commercial grants.

## Explicit NOT TESTED

- SQL syntax execution, RLS grants and PostgreSQL concurrency / isolation;
- Supabase staging Auth/JWT and E01/E01B runtime compatibility;
- External evidence byte hashing, legal signer verification and E03 storage;
- Real outbox dispatcher, DLQ, event hash canonicalization compatibility;
- Vercel preview, production DB and customer tenant migration.

No production or external-connected system was modified to run the tests. Evidence is reproducible with `node --version && npm test`.
