# WLE-E07-05 — Controlled Codex / Engineering Handoff

**Stage:** Isolated WLE-E07 Candidate v0.1, 13 Nov 2026 MYT. **No live integration or release permission.**

## Immutable pins

- WorkLedger Enterprise `EffortEdutech/workledger`, E06 parent `feature/wle-e06-qs-service-integration-adapter` at `c3837800b56b14d4260e8283f9e891deaa6644b9`; new E07 branch should start at this SHA only.
- QS Service `EffortEdutech/QS-Service` observed main `9dc3555b841b9fe1cc0b1d07a62648d2b8a116be`—reference only. Preserve WLE-P1B public `1.0.0-rc1` candidate freeze.
- Source authority: WLE-P1-14 E07 workpack; E04 factual diaries, E05 BOQ snapshots, E06 accepted baselines, E01 appointments. Existing E06 RLS/signature/QS endpoint holds persist. E09/E10/E11 remain separate.

## Reproduce test results

```bash
cd engineering/wle-e07
node --version # >=22
npm test        # 107/107 Node PASS, 0 FAIL
cd ../wle-e06 && npm test # 80/80
cd ../wle-e05 && npm test # 64/64
cd ../wle-e04 && npm test # 58/58
# E03 verified FULL source test path: 45/45; E02 verified source: 30/30
```

The total 384 cases are separate synthetic tests, not integrated SQL/staging evidence. If an earlier source file or test directory is absent, mark **NOT VERIFIED**, do not count an empty `node --test` run.

## Bounded implementation sequence

1. Governance: owner/DBA/security/QS approve a specific isolated staging environment and reviewed E07 measurement decisions (unit precision, physical measurability, acceptance roles, completion assessment, source integrity and correction). Keep code candidate until then.
2. E06 production acceptance truth: independently verified active/superseded baseline, immutable import manifest SHA, task UUID/source integer crosswalk, E05 BOQ revision and no changed task lineage. E07 app code must not accept caller-supplied baseline proof.
3. E04/E03 evidence truth: trusted diary ID, version, project local date, `acknowledged` state for verification, original facts SHA, attachment IDs and **rehashed original bytes**. E07 mock only checks injected proof, never E03 storage itself.
4. Private command handler: transactional, current E01 appointment capability on every operation; no browser role/capability or service key. New capability strings in E07 are proposed, **not granted** by E01/E01B.
5. PostgreSQL schema/RLS: reconcile `008_programme_actuals_reporting_CANDIDATE.sql` with actual E01/E04/E06 physical indexes. Enforce stable baseline/task/diary cross-contract FKs, recorded measure version, independent review, append-only correction, one-shot report cut and durable idempotency/receipts. Force RLS with least-privileged, non-BYPASSRLS roles.
6. QS review: approve exactly how completion bp, actual increments, units, scope changes, measurement dates and diary/source observations are interpreted. Do not imply programme task percentage is certified BOQ value.
7. Feature-flagged Enterprise-only read-only reporting screens and reviewer UI; perform two-tenant cross-boundary, revoked reviewer, stale baseline, two-reviewer races, report race, duplicate commands, tampered diary facts, older baseline readback and rollback negative tests.
8. Provide code + SQL diff, branch/parent SHAs, file SHA manifest, test logs, simulated and real integration results **clearly separated**, RLS policy audit, migration/rollback, unresolved holds and named approvals. Do not merge/deploy without the appropriate gate.

## Copy/paste task for Codex

> Implement the next approved, bounded step of WorkLedger Enterprise **WLE-E07 Programme Actuals & Reporting** using isolated candidate code under `engineering/wle-e07`. Pin `EffortEdutech/workledger @ c3837800b56b14d4260e8283f9e891deaa6644b9` and keep WLE-P1B `1.0.0-rc1` unchanged. Reproduce E07's 107 tests and separately regress E06/E05/E04/E03/E02 against real files. Enforce server-trusted current E01 appointment, E06 accepted immutable baseline and source crosswalk, E04 acknowledged diary and original facts SHA, E03 stored byte evidence, explicit typed measures and independent review. Preserve both canonical task UUID and native QS integer IDs, baseline/import version, BOQ SHA, diary ID/version/sha and published source event sequence. Keep pending observations out of verified progress; never turn a diary into certified progress or a claim. Make corrections append-only and published reports immutable, with null as unassessed progress. Build and test PostgreSQL transactions and two-tenant RLS in independently authorised staging only; no UI credentials, no direct privileged QS SQL, no root `main`/Standard/Contract Diary/QS mutations, no production data. Deliver comprehensive negative security proof, Codex PR, rollback and signed go/no-go.

## Release disposition

**E07 isolated engineering candidate PASS. Production, real DB, real E06 QS source, signer and commercial/legal release HOLD.**
