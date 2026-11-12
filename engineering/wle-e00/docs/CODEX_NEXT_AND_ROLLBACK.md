# WLE-E00 — Codex handoff, PR review, rollback and E01 next actions

## Immediate Codex review
1. Verify `feature/wle-e00-contract-test-foundation` is based on WorkLedger `e78a5a6a...` without changing `main`; inspect the feature-branch diff, confirm every path starts `engineering/wle-e00/`.
2. Use Node >=20; run `node --test tests/*.test.mjs` from `engineering/wle-e00`. Install Python `jsonschema` in isolated dev environment for `python3 tests/validate_frozen_contracts.py`.
3. Check P1B schema/fixtures and OpenAPI copies against the original P1B ZIP by SHA; report contract version drift explicitly.
4. Review mock authorization, idempotency, expected-version and crosswalk paths; add tests for missed negative cases without changing legacy apps.
5. Do not open a PR until the existing pull-request-triggered Vercel preview deployment workflow is reviewed. Do not merge or enable Enterprise routes without architecture owner approval; the E00 feature branch is a review candidate.

## Next WLE-E01 slice
- Build a **real server-side** tenant/contract/appointment capability gateway with isolated staging database and negative RLS tests. Map principal from authenticated credentials, not from a caller-supplied `{ userId }` object.
- Restrict `SECURITY DEFINER` and admin secrets, validate active appointment + effective time, deny cross-project joins, process events via transactional outbox.
- Replace P1B illustrative `manifest_sha256` with cryptographically verified publication and a signed source; do not represent source code as signed evidence.
- Preserve the WorkLedger Standard route set and configuration. Expand the CI matrix only once prerequisites and review are available.

## Rollback
No production changes exist; close the draft PR and delete only this feature branch (after review), or revert the additive E00 commit. Reverting E00 means removing `engineering/wle-e00/` only. **No database rollback, cleanup, secret rotation or customer restoration is required for the isolated mock itself.**

## Open approvals
PO/architect ratification of WLE-P1B, explicit staging DB ownership, appointment signatory/contract form, third-party QS service account isolation, legal review for CIPAA and releases. All remain separately tracked.
