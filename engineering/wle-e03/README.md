# WorkLedger Enterprise — WLE-E03 Evidence & Audit Foundation

**Candidate v0.1 · 13 November 2026 (MYT) · ISOLATED NON-PRODUCTION ENGINEERING**

**Base:** `EffortEdutech/workledger` E02 `feature/wle-e02-contract-version-registry` @ `8962a44fbd5301b366420cd22108b224f4e12535`. WLE-P1B private `1.0.0-rc1` logical reference unchanged.

## What is delivered
- `src/foundation.mjs`: server-only executable custody and audit reference; authenticates via injected backend verifier; checks appointment capability inside serialized synthetic transaction, rehashes actual Node `Buffer` bytes before preservation; uses scoped immutable object keys, writes audit/outbox/receipt; strict idempotency and negative security checks.
- `tests/foundation.test.mjs`: 45 Node tests including tamper detection, exact retry, cross-scope fail closed, redaction as new byte object, hold governance, exports, E02 evidence port and rollback fault injection.
- `sql/004_evidence_audit_schema_CANDIDATE.sql`: **NOT EXECUTED** private PostgreSQL DDL design. Default deny, `FORCE ROW LEVEL SECURITY`, no grants or production role/policy.
- `contracts.json`: private proposed evidence verification contract, not an externally published API.
- `docs/`: domain design, risk and storage design, staging acceptance/holds, Codex workpack.
- `evidence/`: exact test stdout, test report and SHA-256 manifest.

## Run
```bash
cd engineering/wle-e03
node --version   # Node >= 22
npm test
```

## Local regression
An independent test invocation of the immediately preceding E02 ZIP also recorded **30/30 PASS**, without validating its unexecuted SQL. The stdout is included as `evidence/E02_REGRESSION_OUTPUT.txt`.

## Critical trust separation
**A file SHA-256 demonstrates equality of bytes against a stored digest, not signature authenticity or legal admissibility.** The E02 verification port returns `verified:false` without independent party evidence. Even when synthetic party evidence is accepted it reports `signature_validity:'not_assessed'`.

**No real object bucket, remote DB, HTTP endpoint, signer service or physical SQL migration is implemented.** Test-only memory makes object writes and metadata appear atomic; real object storage and PostgreSQL require a staged custody/reconciliation design. The canonical JSON hash uses sorted object keys and is **not RFC 8785 JCS** or a digital signature. Outbox is only pending; no delivery or DLQ. There is no delete, public URL, legal-service action, payment or CIPAA decision function. Retention periods are deliberately unset.

**Release gate:** E01B/E02 staging holds, security/RLS, privacy/legal retention and Vercel root preview defects all persist. No main merge, customer pilot, production migration or legal claim is authorised.
