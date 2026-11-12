# WLE-E00 — Executed tests and results

**Environment:** isolated local execution, Node.js `v22.16.0`, Python3 + `jsonschema 4.26.0`; synthetic in-memory fixtures only. Note that WorkLedger's app declares Node `20.x`; these results test the isolated Node 20+-compatible harness on Node 22, **not** a WorkLedger application build on Node 20.

| Check | Command | Status | Actual |
|---|---|---|---|
| Mock contract/state/negative tests | `node --test tests/*.test.mjs` | **PASS** | 33 passed, 0 failed |
| P1B frozen JSON Schemas / valid fixtures | `python3 tests/validate_frozen_contracts.py` | **PASS** | 5 valid accepted |
| P1B intentionally invalid fixtures | same | **PASS** | 5 invalid rejected |
| Schema validation | same | **PASS** | 5 schemas parse under Draft 2020-12 |
| WorkLedger Standard new-build regression | root `npm run build` | NOT EXECUTED IN E00 | Prior P0B build passed at pinned SHA; additive-only diff permits a source-level no-change assertion, not a new build assertion |
| Production DB / RLS | live authorization fixtures | NOT TESTED | Out of E00 scope; E01 security gate |
| QS remote adapter and calculation | live service | NOT TESTED | QS-SEC-001 service authorization still open |
| Cross-process/idempotent concurrency | multi-process database test | NOT TESTED | In-memory single-process only |
| Real signature and digest verification | trusted storage service | NOT TESTED | The P1B sample manifest hash is synthetic/opaque |

The invalid fixture pass means **the validators rejected it as expected**, not that invalid input is accepted. Original terminal transcripts preserved separately in the stage ZIP under `evidence/`. Run commands after checkout; do not use production keys.
