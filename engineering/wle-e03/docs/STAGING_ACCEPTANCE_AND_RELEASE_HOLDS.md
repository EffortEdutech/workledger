# WLE-E03-03 — Test Gates, Staging Runbook & Explicit Holds

## Evidence classification
- **EXECUTED_LOCAL:** Node v22.16.0, 45 synthetic tests in this package. Memory store and actual Node Buffer hashing. No Supabase project, credentials, Storage API or database SQL used.
- **DESIGNED_ONLY:** `wle_e03` physical SQL candidate, object custody design, signer port, hold-release real workflow, event/outbox delivery, export persistence.
- **HOLD:** Production, `main` merge, customer migration, externally signed legal claims, file sharing, and CIPAA dossier legal use.

## Gate matrix
| Gate | Required independent evidence | Current |
|---|---|---|
| E03-A identity and scope model | frozen 1.0.0-rc1 and E01/E02 contract IDs | candidate design |
| E03-B byte digest & negative tests | local Node test log | PASS: 45 synthetic tests |
| E03-C real Storage controls | approved bucket, immutable provider strategy, end-to-end byte readback, malware limits | NOT TESTED |
| E03-D PostgreSQL private schema / RLS | DBA-reviewed candidate SQL, non-bypass roles, two-user/two-tenant negative tests | NOT TESTED |
| E03-E atomicity & concurrent retries | real DB event/outbox/receipt, concurrent clients, storage orphan recovery | NOT TESTED |
| E03-F audit chain operational proof | trust anchor / verified log retention / backups / export verification | NOT TESTED |
| E03-G legal hold, signer assurance | independently reviewed signer, hold release, retention/privacy policy | HOLD |
| E03-H upstream E02 seal integration | same trust domain, checked evidence receipt, separate legal decision | HOLD |
| E03-I customer pilot or production | owner, DBA, security/legal, operational signoffs | HOLD |

## Staging sequence — not executed
1. Owner identifies and approves isolated WorkLedger Enterprise Supabase project, administrator, region, quota/budget and security change ticket. Do not touch unrelated Aircond Care or FireMan projects.
2. Security and DBA inspect actual E01/E01B/E02 migration order and data ownership. Pin all source SHAs; test real Supabase JWT `getUser` and strict appointment capability from a restricted server credential (not `service_role`).
3. Review storage bucket privacy, object rewrite capability, versioning/integrity, conditional upload and signed URL policy. Prepare separately restricted runtime uploader and reader identities; no arbitrary SQL proxy.
4. DBA reviews candidate DDL and creates a **real CLI-generated migration only after approval**. Check SQL syntax, composite FKs, permissions, RLS, tenant/sibling-contract negative read/write/streaming access in a disposable staging database.
5. Test original-file readback checksum, intentionally corrupt/replaced bytes, cross-tenant and stale-session access, storage partial uploads, DB failure after object storage, orphaned object reconciliation, retry under distributed locks, and backups/restores.
6. Test append-only audit permissions, event hash checks, export manifest and protected redactions, independent hold release, retention override, secrets/clock skew and log inspection. Test queue dispatch retries and dead-letter monitoring only after publisher exists.
7. Connect E02 signer integration only after verified third-party identity evidence and independent legal review. Test signature failures without presuming court validity.
8. Record exact project ref, source SHA, migration ID, role grants, storage policies, PASS/FAIL/NOT TESTED and separate written release approval.

## Unchanged external dependencies
`WLE-SEC-002` real RLS, `WLE-E00-DEPLOY-001` Vercel Node20 preview failure, `CDP-SEC-004` Contract Diary role authorization, `QS-SEC-001` privileged QS DB, E01/E01B real Auth/staging and E02 SQL/signing. WLE Standard lint/security advisory backlog is not cleared by this module.

## Operator decision
Accept this package only as a **candidate for scoped code review and further isolated engineering**. Neither generated SQL nor synthetic tests authorise a deployment, migration, legal certificate or production release.
