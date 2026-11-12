# WLE-E00 — Engineering Repository & Contract Test Foundation

**Status:** isolated non-production proof-of-contract; WorkLedger Enterprise `1.0.0-rc1` candidate. **Not an API implementation, Supabase schema migration, authenticated service, or legal engine.**

## Scope

This additive `engineering/wle-e00` folder is intentionally **not imported** by the WorkLedger Standard Vite application. It freezes copies of the P1B schemas, OpenAPI and synthetic fixtures, provides a dependency-free Node 20+ in-memory mock, and tests tenant and appointment authority, diary transitions, idempotency, QS UUID/number crosswalk, immutable baseline acceptance and report lineage.

## Reproduce

```bash
cd engineering/wle-e00
npm test                    # Node built-in node:test: no npm install needed
python3 -m pip install jsonschema   # only if absent; isolated environment
npm run test:contracts      # 5 valid + 5 deliberately invalid fixtures
```

## Provenance

- WorkLedger pinned parent commit: `e78a5a6a7426f149ab89dc2707e3cc8ab1c85168`.
- Contract Diary reference: `6d3a9ad292e702100d133095bb03362ab38638dc`.
- QS Service reference: `9dc3555b841b9fe1cc0b1d07a62648d2b8a116be`.
- Authority: **WLE-P1B Candidate v0.1**, JSON Schema/OpenAPI `1.0.0-rc1`, Google Drive WorkLedger Enterprise.
- Test input: synthetic only. The P1B sample `manifest_sha256` is an example field and **not** verified by cryptographic signature/original-file readback. The mock is not a production trust boundary.

## Limits

No real QS calculation, financial approval, API service, database or RLS verification is provided. All authorisation checks here are mock semantics and must be reimplemented and independently tested with real server and DB policies during E01+. Baseline import intentionally requires a verified source crosswalk and an explicit Enterprise contractual acceptance after QS professional review. The mock uses in-memory maps; concurrent/multi-process atomicity is NOT proven.

## Git/release discipline

- Create an isolated `feature/wle-e00-contract-test-foundation` branch; do not open a PR until the existing preview-deploy workflow is reviewed; do not merge without owner review.
- Files are additive under `engineering/wle-e00/`; Standard source, `package.json`, lockfile, CI deployment workflows and database are unchanged.
- Merge/go-live gated separately; link the WLE-P0B issue backlog, especially `WLE-TEST-003`, `WLE-SEC-002`, `QS-SEC-001` and `CDP-SEC-004`.
