# WLE-E03-04 — Controlled Codex Engineering Handoff

**Source of truth:** `EffortEdutech/workledger` `feature/wle-e02-contract-version-registry` @ `8962a44fbd5301b366420cd22108b224f4e12535`, plus WLE-P1B `1.0.0-rc1` candidate freeze and this WLE-E03 branch. E02 has 30 synthetic Node tests, SQL/RLS not accepted. E03 does not modify Standard Vite source, Contract Diary, QS Service, actual Supabase projects or any customer data.

## Immediate instructions
1. Work on the isolated `engineering/wle-e03/` path and preserve the `1.0.0-rc1` public contract set. Do not merge into `main` automatically.
2. Run `cd engineering/wle-e03 && npm test`; record Node version, Git SHA, test count and logs. Run E02 `npm test` separately in the inherited branch. Note that synthetic tests are not database tests.
3. Read `docs/DOMAIN_AND_E02_INTEGRATION.md`, `docs/THREAT_MODEL_STORAGE_AND_RETENTION.md`, `sql/004_evidence_audit_schema_CANDIDATE.sql`, prior E02 security holds and WLE-P1-10.
4. Next bounded PR: storage adapter and scan/quarantine design + private readback checks; a different bounded PR for reviewed private DB writer/RLS, with isolated staging approval. No client-side upload privilege to internal evidence register.
5. Build persistent storage/DB two-phase custody with idempotent receipts and explicit orphan reconciliation; never assume object store and DB share one transaction. Perform two real users/two tenants and sibling contracts negative checks.
6. E02 seal adapter must retain `signature_validity:'not_assessed'` until a trusted external signer verification and legal policy exist. The injected mocked party verifier is only for tests. Explicitly deny silently elevating E01B low-risk capabilities.
7. Rollback: disable non-production feature flag, quarantine uncommitted objects, keep evidence and audit records. Never delete held original data or run destructive SQL without separately approved and documented retention policy.
8. Submit PR-ready schema/API diff, staged tests, vulnerable path review, storage integrity and log evidence, retention/hold decisions, accepted/rejected gates and restore plan.

## Copyable bounded task
> Continue WLE-E03 Evidence & Audit Foundation from isolated candidate v0.1. Verify exact E02 parent SHA, run E02 and E03 synthetic tests, inspect frozen `1.0.0-rc1` interfaces and prior security backlog. Implement only an isolated private evidence upload/readback adapter with original-byte SHA-256, restricted actor/appointment gate and storage quarantine; require two-tenant/sibling-contract denies, idempotent receipts and failure-path recovery. Treat candidate SQL and signed-party port as unapproved until DBA, security and legal gate. Do not touch production, unrelated Supabase projects, WorkLedger Standard, CDP or QS code. Return tests, issues and rollback notes rather than a production claim.
