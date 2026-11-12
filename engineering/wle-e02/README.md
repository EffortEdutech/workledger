# WorkLedger Enterprise — WLE-E02 Construction Contract Version Registry

**Candidate v0.1 · 13 November 2026 (MYT) · ENGINEERING / SYNTHETIC ONLY**  
**Parent:** `EffortEdutech/workledger` branch `feature/wle-e01b-appointment-governance`, SHA `e5fbb735e8a2743d45471170c41efc2df3864128`.  
**Architecture:** WLE-P1B `1.0.0-rc1` candidate DTO freeze, immutable contract revisions and source-instance-aware crosswalk.  
**Gate:** NOT STAGING ACCEPTED · NOT PRODUCTION READY · NOT LEGALLY AUTHORITATIVE.

## Delivered

- `src/registry.mjs`: server-only executable reference with strict command envelopes and a synthetic serialized transaction store, trusted-auth/appointment/evidence ports, append-only registrations, signed-evidence seals, explicit source crosswalk, idempotent receipts, event and pending outbox.
- `tests/registry.test.mjs`: 30 independent Node tests of scope and signature-evidence negatives, replay/conflict, concurrency and rollback; no external dependencies.
- `sql/003_contract_version_registry_CANDIDATE.sql`: private PostgreSQL design for composite tenant FKs, revision numbering, party linkage, insert-only seal records, source mappings, audit/outbox/receipts and least-privilege RLS. **NOT EXECUTED.**
- `docs/DOMAIN_CONTRACT_AND_DECISIONS.md`: field, governance and state definitions.
- `docs/SECURITY_STAGING_AND_GATES.md`: integration exclusions and acceptance criteria.
- `docs/CODEX_HANDOFF.md`: next engineering implementation steps and exact stops.
- `evidence/TEST_REPORT.md` and `evidence/MANIFEST.json`: reproducibility and integrity.

## Commands

```bash
cd engineering/wle-e02
node --version  # Node >= 22
npm test
```

The candidate is intentionally standalone, requires no dependencies or credentials, and never imports from WorkLedger Standard `src/`. The synthetic store is not a database; its tests do **not** prove PostgreSQL RLS, Supabase JWT identity, pooling, physical schema compatibility, genuine signatures or external event delivery. No tested code path is exposed to browsers.

## Intended contract commands

1. **register** — independently authorized administrator creates one append-only revision with explicit revision number, source SHA-256, form reference, IANA timezone, local key dates and exact E01 contract-party IDs.
2. **seal** — independently authorized server records *verified evidence reference* for one revision, then prevents a second seal. **This does not adjudicate signature legality**. A trusted E03 verification service must confirm original file bytes, signer identity/authority and correct contract scope before runtime enablement.
3. **map** — source-system and instance-identified crosswalk; the same source record+revision must never be repointed to another canonical revision. Repeating exact mapping is a no-op with its own audit receipt.

Every operation rechecks capability in the transaction. New capabilities `construction.contract.revision_create`, `construction.contract.revision_seal`, `construction.contract.source_map` **are not assumed to have been granted in E01**. Their governance/bootstrap remains on HOLD.

## Required holds

- Never apply candidate SQL to production, unreviewed Supabase staging or unrelated projects. The `wle_e02_writer` role must be separately provisioned, audited and protected; transaction-local GUCs are not identity proof.
- Preserve E01/E01B staging acceptance, production merge and Vercel Node 20 preview holds. No `main` merge or Standard runtime import.
- No CIPAA deadline, legal signature validity, standard form, retention period, certifier/payment power or source-system-of-record switch inferred from input fields.
- E03 evidence integrity, external signer verification, transactional SQL adapter, real JWT `getUser`, two-user/two-tenant PostgreSQL RLS tests and owner/DBA sign-off must precede staging acceptance.

## Scope alignment

This implements only WLE-P1 WLE-E02 "Construction contract version registry" as an isolated engineering candidate. WorkLedger Standard, Contract Diary, QS Service and existing production databases are unchanged. WLE-E03 remains the next dependency-ordered workpack.
