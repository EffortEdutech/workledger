# WLE-E00 — Baseline, boundaries, scope and evidence authority

**Date:** 2026-11-12 (Asia/Kuala_Lumpur). **Contract:** WLE-P1B Candidate v0.1 / `1.0.0-rc1`. **Branch:** `feature/wle-e00-contract-test-foundation`. **Status:** isolated engineering candidate.

## Source commit locks

| Repository | Pinned default-branch SHA | Use |
|---|---|---|
| EffortEdutech/workledger | `e78a5a6a7426f149ab89dc2707e3cc8ab1c85168` | GitHub feature-branch parent, Standard baseline |
| EffortEdutech/contract-diary-platform | `6d3a9ad292e702100d133095bb03362ab38638dc` | Historical construction domain reference; not modified |
| EffortEdutech/QS-Service | `9dc3555b841b9fe1cc0b1d07a62648d2b8a116be` | Historical QS calculation reference; not modified |

Google Drive authority: `WorkLedger Enterprise/WLE-P1B_2026-11-12_Architecture_Decisions_Data_Contracts_Codex_Handoff`, archived ZIP and six JSON schemas, ten P1B fixtures, OpenAPI. Copied byte-for-byte into `contracts` and `fixtures` by stage construction scripts; SHA parity is recorded separately.

## Architectural invariant

WLE-E00 is an **additive, private test-harness module** outside the WorkLedger application import graph. No changes to `src/`, root `package.json`, root lockfile, `.github`, database migrations, Supabase clients, Vercel config, or production endpoints. No actual Enterprise routes. In-memory seeding helpers exist solely for synthetic tests; they **must never be shipped as production APIs**.

## Test coverage status

- New mock tests: `node --test tests/*.test.mjs` checks 2-tenant separation, appointments, false actor fields, acknowledgement and submission state, idempotency under retries, QS source-instance crosswalk, manuscript/BOQ version hash matching, contractual acceptance separate from professional review, and report provenance.
- Frozen P1B JSON Schema: `tests/validate_frozen_contracts.py` validates valid/invalid fixture pairs with Draft 2020-12 `jsonschema`.
- No real Postgres, RLS, JWT, QS calculation, Vercel deployment, browser, network replay or concurrent transaction verification is claimed. No source repo build is claimed in the local test environment; earlier P0B Vercel/isolated build evidence remains separate and source-versioned.

## Risks carried into E01+

- WLE-SEC-002: real multi-tenant RLS not tested. Mock identity checks have no enforcement power against a real DB.
- QS-SEC-001: privileged QS postgres connection stays isolated; no real connector credentials.
- CDP-SEC-004: legacy Contract Diary acknowledgement lacks server-side main-contractor check; mock does not fix it.
- WLE-TEST-003: WorkLedger root does not have a native application test script; E00's tests are isolated, not yet wired into main CI.
- WLE-TEST-001/002/004: legacy lint, security audit and CI issues remain open (P0B v0.2).

**Gate:** Acceptable for Codex review, test-contract refinement and E01 branch planning. Not a production or customer-data gate.
