# WLE-E05 — Local Execution Evidence & Gate Summary

**Date:** 13 November 2026 MYT. **Environment:** isolated Linux runtime; Node.js v22.16.0, npm local. **Working baseline:** E04 `b0bc8a523871ef6e398b70df0bcaa1d682866006`.

| Suite | Command | Executed | Outcome |
|---|---|---:|---|
| WLE-E05 BOQ revision and work packages | `npm test` from E05 | 64 | **64 PASS / 0 FAIL / 0 SKIP** |
| WLE-E04 diary/offline | separate `npm test` from E04 source directory | 58 | **58 PASS / 0 FAIL** |
| WLE-E03 evidence/audit | separate `npm test` from extracted previously verified E03 source package | 45 | **45 PASS / 0 FAIL** |
| WLE-E02 contract registry | separate `npm test` from extracted E02 source package | 30 | **30 PASS / 0 FAIL** |

**Total: 197 separate synthetic Node test cases passed, not integrated end-to-end proof.** Exact text logs are in the adjacent `*_OUTPUT.txt` files. E00/E01/E01B tests not rerun.

E05 test coverage includes: exact money/quantity string handling, tenant and sibling scope, forged principal, invalid/absent E02 contract and E03 byte receipts, line item identity, duplicate numbering, allocation under/over 100%, write authority, immutable approved/locked snapshots, source instance crosswalk, same-source repoint denial, independently authorised reviewer, submission-specific E04 reference, optimistic stale version, duplicate retry/concurrency and injected rollback. One initial test run recorded 61/64; three test assumptions were corrected and suite rerun to 64/64, with latest log as evidence. This is not a PostgreSQL integration assertion.

**NOT TESTED:** SQL syntax against a real PG server; actual DBA roles, RLS, Supabase JWT, object storage/E03 readback, real-source BOQ import, simultaneous multi-process DB writers, legal contract source authority, live browser UI, real financial calculations, approved QS rounding, programme or claims integration, standalone Vercel preview.

**Release classification:** ISOLATED ENGINEERING CANDIDATE only; no staging acceptance, production migration, `main` merge, paid customer pilot or legal/commercial certification. All inherited holds remain active.
