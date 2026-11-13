# WLE-E04-03 — Security, Database Acceptance and Release Holds

**Date:** 13 Nov 2026 MYT. **Classification:** CANDIDATE / NON-PRODUCTION.

## Trust boundaries
- Browser owns only intent; caller-supplied actor, role, certificate, acknowledgement and file digest claims are not privileged evidence.
- Server must obtain authentic user identity from live Supabase Auth `getUser(token)`, resolve a dedicated minimum-privilege database writer, check E01/E01B current appointment/capability and contract scope, and perform state changes in one PostgreSQL transaction.
- E01B low-risk capability allowlist includes diary submit/acknowledge in specific capacities. E04 tests enforce submitter vs main-contractor reviewer separation. WorkLedger Standard and legacy Contract Diary role checks are NOT automatically repaired.
- SQL `005_diary_offline_CANDIDATE.sql` has no runtime GRANT/POLICY. `wle_e04` is a proposed physical schema, not a ratified topology or Supabase migration. Any grants, policies, role setup and DDL must be reviewed against E01/E01B/E02/E03 source and actual staging before execution.
- E03 must verify source bytes and scope; attachment to a diary is a separate transaction and explicit receipt. An audit hash chain can detect inconsistency in a limited trust model but is not an independently anchored court-grade record.

## Gate matrix

| Gate | Acceptance evidence | Status |
|---|---|---|
| E04-A domain and contract mapping | source-verified fields, state machine, private contracts | CANDIDATE |
| E04-B synthetic diary/offline tests | Node local, negative cases / 58 tests | PASS (synthetic only) |
| E04-C upstream isolated regression | E03 45/45 and E02 30/30 Node tests | PASS (separate runs only) |
| E04-D physical SQL/RLS | reviewed migration, roles, scopes, 2 identities / 2 tenants / sibling contracts | NOT TESTED |
| E04-E real JWT and appointment | verified `getUser`, active submitter/reviewer capacities, expired/revoked replay | NOT TESTED |
| E04-F private object custody | E03 immutable originals, readback, scan/quarantine, orphan reconciliation | NOT TESTED |
| E04-G browser offline | IndexedDB encrypted local records, sync retry, multi-tab/device, safe logout | NOT BUILT |
| E04-H UI integration | protected Enterprise route, no Standard regressions, screenshots/UAT | DESIGN ONLY |
| E04-I distributed idempotency/audit | PostgreSQL simultaneous callers, event/outbox, independent audit trust anchor | NOT TESTED |
| E04-J production/court/CIPAA reliance | business/security/DBA/legal and owner approvals | HOLD |

## Required staging test plan — NOT executed
1. Owner explicitly approves a dedicated WorkLedger Enterprise staging Supabase project/region, cost, security administrator and migration ticket. Unrelated `Aircond Care` and `FireMan` must not be modified.
2. DBA inspects actual schemas, ownership and role inheritance. Adapt E01/E01B/E02/E03/E04 additive migrations with reviewed dependencies. `FORCE ROW LEVEL SECURITY`, exact composite FKs, private Data API exposure and writer role non-bypass must be verified; never run test-only role SQL on managed Supabase.
3. Implement a private authenticated command adapter and exercise real two-user/two-tenant/sibling contract cases, forged actor, altered role, expired/revoked appointment and denied viewer acknowledgement. Test acknowledgement by independent eligible main-contractor reviewer.
4. Test client capture across browser restarts, local loss, multiple tabs, offline edits while server version advances, object upload+DB failure, background sync absence, redaction/original access, bad files and quotas.
5. Test PostgreSQL optimistic locking/idempotency with concurrent real clients, event/outbox/receipt atomic rollback, audit integrity, tenant privacy and backup/restore. Confirm submitted/acknowledged snapshots cannot be mutated with direct SQL by application writer.
6. Record exact project ref, source commit, role grants, SQL migration ID, PASS/FAIL/NOT TESTED and human release signatures. Do not claim pilot or production without separate authority.

## Unchanged unresolved backlog
`WLE-SEC-002` real RLS, `WLE-E00-DEPLOY-001` Vercel Node20 preview rejection, `CDP-SEC-004` missing legacy MC acknowledge role check, `QS-SEC-001` QS privileged DB access, E01/E01B staging/authority bootstrap, E02 real SQL/signing, E03 durable custody/legal holds. Also root WorkLedger lint/security advisories and Contract Diary legacy test failures remain. No CIPAA statutory or legal compliance assertion follows from a diary record.

**Disposition:** Accept only as a candidate for isolated engineering review; all staging and production holds preserved.
