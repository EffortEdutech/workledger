# WLE-E06-04 — Security, Staging, Threats & Release Controls

**Classification:** isolated Node candidate, **NOT a shipped QS interface**. No SQL executed. WLE P1B `1.0.0-rc1` remains unchanged. E01–E05 holds inherited.

| Gate | Evidence needed | Actual status |
|---|---|---|
| E06-A Source audit | pinned WLE E05 and private QS source, stage enum, confirmation semantics | PASS documentation only |
| E06-B Adapter contract | explicit UUID→int mapping, state machine, signed manifest contract, separate acceptance | CANDIDATE |
| E06-C Local executable tests | 80 tests incl signed Ed25519, cross-tenant rejects, cycle, replay, races | **PASS synthetic** |
| E06-D Previous regressions | E05 64, E04 58, E03 verified 45, E02 verified 30 | PASS separately executed |
| E06-E Physical schema & RLS | owner/DBA-approved E01–E06 migrations, non-bypass gateway, 2 tenants/users | NOT TESTED |
| E06-F QS service boundary | private endpoint, mTLS/workload key, role-limited `pg`, item/provenance crosswalk | NOT BUILT |
| E06-G QS orchestration integration | real worker, stage runs, supervision, status and manifest publisher end-to-end | NOT TESTED |
| E06-H JCS/signatures | cross-language RFC8785 vectors, trusted key registry, rotation, revocation, signer authority | HOLD |
| E06-I E05 BOQ alignment | item-level native QS `boq_item_id` reconciliation, unit/precision, batch readback | NOT TESTED |
| E06-J QS professional review | independently trusted query of real programme review decisions and confirmed stage | NOT TESTED |
| E06-K DB concurrency/import | distributed inbox idempotency, source uniqueness, task crosswalk, baseline acceptance CAS and rollback | NOT TESTED |
| E06-L UI/synthetic pilot | feature flag off by default, Enterprise-only UAT and Standard regression | DESIGN ONLY |
| E06-M Release/legal | owner, DBA, security, QS professional, legal signoffs | **HOLD** |

## Threat register and negative case coverage

- `QS-SEC-001`: QS `pg` credentials/routing expose privileged DB to cross-tenant users. **Open; no direct `pg` or raw SQL boundary permitted**.
- `WLE-INT-001`: wrong/ambiguous UUID→native integer project map can contaminate a different contract. **Synthetic crosswalk tests pass; real mapping remains unverified**.
- `WLE-SEC-002`: PostgreSQL RLS privilege bypass; synthetic actor ports are **not** live auth. No browser-origin capability fields accepted. Real writer privileges and DB policies remain open.
- `QS-TEST-002`: QS engine, worker and database integration tests not executed for E06. Existence of `package.json` scripts is not pass evidence.
- `QS-MANIFEST-001`: digest/spec drift, signature key compromise, replay with altered event, stale signatory or forged professional decision. Synthetic Ed25519 and inbox tests pass; cross-language and external trust remain open.
- `QS-BOQ-001`: `BOQ_snapshot_sha256` cannot prove QS imported the same item rows/units/quantity, especially provisional lines or precision truncation. Full reconciliation required.
- `QS-ACT-001`: two acceptors race to activate distinct baselines. Synthetic serial CAS test passes; real DB transactional concurrency is **NOT TESTED**.
- `QS-RET-001`: legal hold, audit independent anchoring and immutable evidence retrieval not implemented by E06.

## Staging and rollback: NOT executed

1. Obtain owner-approved isolated WorkLedger + separate least-privileged QS staging, region/cost and explicit DBA change ticket; preserve unrelated environments.
2. Reconcile physical E01–E06 schema candidates; no direct SQL from this package. Add private server writer and RLS check with 2 actual users/2 tenants/sibling contracts; attempt forbidden direct UPDATEs.
3. Implement and exercise private source-side QS endpoint with rotating workload credentials, atomic remote request idempotency and validated source BOQ import. Confirm no `postgres` credential in external request handling or browser.
4. Generate actual signed manifest from QS `status=confirmed, generation_stage=complete` and review decisions, fetch original bytes/manifest, and cross-validate JCS+Ed25519 with revoked/rotated keys.
5. Reconcile task IDs/dependencies, timezones, calendars, QS stage results and full input source digest. Test rejected/reopened outcomes, simultaneous import, transient failure, duplicate message and outbox recovery.
6. Isolated feature flag + staged rollback: disable adapter queues, stop dispatch, preserve immutable accepted baselines and source evidence, reconcile all in-flight requests, restore only tested migrations via DBA-approved plan; no destructive delete of audit/receipts.
7. Record actual Git SHAs, SQL migration IDs, key IDs without secrets, PASS/FAIL/NOT TESTED, request receipts, trace logs and independent signoffs before pilot.

**No payment/certifier/EOT/CIPAA or industry registry authority is granted by programme confirmation.** This candidate does not assert compliance with CIDB, PAM, PWD/JKR or a specific contract form.
