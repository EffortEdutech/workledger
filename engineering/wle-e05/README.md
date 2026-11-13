# WorkLedger Enterprise — WLE-E05 BOQ Revisions & Work-Package Mapping

**Candidate v0.1 · 13 November 2026 (MYT) · ISOLATED, NON-PRODUCTION ENGINEERING**

**Parent:** `EffortEdutech/workledger`, branch `feature/wle-e04-diary-offline-capture` at `b0bc8a523871ef6e398b70df0bcaa1d682866006`. **Public authority:** WLE-P1B `1.0.0-rc1` provisional candidate, unchanged. E01/E01B, E02, E03 and E04 staging/security/release holds remain.

## Delivered

- `src/boq.mjs`: dependency-free, server-only synthetic reference for full BOQ revision snapshots, detailed decimal amount calculation, work-package allocation shares, independent approve and lock, source crosswalk, fact-only diary mapping, event/outbox receipts and revision diff.
- `tests/boq.test.mjs`: 64 Node tests for exact decimals, tenant scope, forged actor, current appointment recheck, source evidence scope, immutable line revisions, percentage allocation boundaries, retries/concurrency and rollback. The synthetic trust callback is NOT an authorised production credential or DB security layer.
- `sql/006_boq_revisions_packages_CANDIDATE.sql`: private PostgreSQL conceptual DDL with composite scope foreign keys and FORCE RLS, **NOT EXECUTED** and **NO RUNTIME GRANTS OR POLICIES**. Migration must be separately reviewed/approved.
- `contracts/private_boq_commands.json`: private proposed command and capability contract, no public API change.
- `docs/`: source audit, quantitative policy, security gates, controlled Codex work package and pilot/migration cautions.
- `ui/`: static review-only BOQ version comparison sketch; not part of WorkLedger runtime.
- `evidence/`: exact executed E05 and E02–E04 separate regression stdout, test report, SHA-256 manifest.

## Commands

```bash
cd engineering/wle-e05
node --version  # 22+
npm test        # candidate execution: 64/64 PASS
```

Separate regression runs of earlier, verified source packages: E04 **58/58**, E03 **45/45**, E02 **30/30**. Combined **197 isolated Node cases PASS**—not an integrated PostgreSQL test or staging acceptance.

## Invariants

1. Exact tenant/project/contract/BOQ scope, server-verified actor and appointment capability on every write or read/replay. No user/role asserted by browser.
2. First revision number 1; next revision only when immediately preceding revision is locked; draft edits replace **full snapshot**, with `expected_version`. Reviewed/locked snapshots cannot be edited. No deletion.
3. Independent reviewer approves and locks the BOQ; neither operation certifies quantities, variation entitlement, claimed work or payment.
4. Line `item_key` is a stable identity across revisions; `item_code` is unique per revision. Full snapshot includes exact quantity, unit, unit rate, computed line amount. Decimal/rounding convention is **candidate**, not ratified QS valuation rule.
5. Package allocations reference exact line keys and have integer basis-point shares; no item may exceed 100% allocation across all packages in one revision. Unallocated scope remains explicit.
6. E02 contract reference and E03 source-file byte-integrity receipts must be verified independently. E02 seal is not proof of contract legal validity; E03 digest is not proof of original authenticity or signer identity.
7. Legacy `boq_items` uses `boq_id`, and `boq` uses `contract_id` in reviewed Contract Diary service. Crosswalk records source system and instance so old IDs are never assumed equal to canonical enterprise IDs.
8. An E04 diary may link to a locked work package only with a scoped, server-trusted submitted/acknowledged diary receipt; this **does not** update actual quantities or progress/claims.

## Not included / NO-GO

No Supabase project/database was accessed, no SQL executed, no browser integration, no company/cost data migrated, no external signature verification, no production boQ baseline acceptance or automatic programme/claim/VO/EOT/CIPAA computation. No `main` merge. The UI is a disconnected sketch. The E04/E03 storage and deployment holds persist.
