# WLE-E02-02 — Security, Staging & Gate Register

## Mandatory dependencies

1. **E01/E01B authority:** engineering reference branch `feature/wle-e01b-appointment-governance`, SHA `e5fbb735...`. Do not merge or weaken its checks. E01B auth/issuer bootstrap and real managed Supabase checks are still untested.
2. **Real staging project:** owner selects and approves a specifically identified isolated WorkLedger Enterprise Supabase project, its administrator, region and budget. Previously connected Aircond Care and FireMan are unrelated and must not be modified.
3. **DBA migration:** review E01, E01B and E02 SQL as a coherent migration sequence against discovered live metadata, role topology, RLS, PostgREST exposed schemas, connection pooling, existing identifiers and ORM conventions. Provision separate private E02 writer without bypass-RLS, `service_role`, postgres, public SQL proxy or browser imports. Never execute test-only E01 roles on Supabase.
4. **Trusted gateway:** independently verify user with live Supabase Auth `getUser(access_token)` on server. Inside the same restricted DB transaction set private actor/scope/appointment context, use E01 `can_act`, and recheck at commit/replay. Custom GUCs are not authentication.
5. **Controlled caps:** separately approve, document and execute bootstrap for E02 create/seal/map abilities; E01B's low-risk appointment grant flow cannot issue these automatically. Deny by default until active contract appointment exists.
6. **Real evidence service:** E03 verifies original file SHA against actual bytes, signer evidence, tenant/contract/party scope, retention and protected legal holds. A claimed client digest or synthetic `verified:true` is not sufficient.
7. **SQL tests:** migration dry run/revert and Postgres/RLS positive/negative cases for two actual Supabase Auth users, two tenants, sibling contracts, forged actor, stale capability, revoked appointment, optimistic version, same-source-key conflict, second seal and concurrent retries.
8. **Audit and operation:** database fault injection verifies atomic revision/party/evidence/event/outbox/receipt transactions. Confirm immutable enforcement using actual writer role, backup, restore, operator access, audit retention and outbox publisher not yet built.
9. **Release governance:** owner/DBA/security/legal sign off separately. No production or legal release inferred from 30 synthetic tests.

## SQL review issues explicitly OPEN

- `sql/003...sql` is **DDL design only**, not run against PostgreSQL/PGlite/Supabase. Dedicated writer role and preexisting tables must be inspected first; syntax, RLS visibility and transaction semantics need actual DB execution.
- `wle_e02` proposed private physical schema is **not approved**, and name differs from target logical `wle_construction` pending topology decision.
- Data API schema exposure, default privileges, search paths, grant hierarchy, `SECURITY INVOKER` function calls and row-level policies require real configuration check.
- Some E02 RLS SELECT policy paths require exact active `construction.contract.read` appointment capability. If bootstrap cannot meet that requirement, fail closed; do not weaken RLS for convenience.
- No runtime source for independent verified signatures. External evidence verifier callback is injected for deterministic synthetic tests only.
- Actual PostgreSQL concurrent write handling and distributed idempotency are not demonstrated by the single-process in-memory queue.
- Root WorkLedger legacy lint/advisory backlog and Vercel Node 20 preview rejection remain separate remediation tickets.

## Acceptance matrix

| Gate | Evidence | Current status |
|---|---|---|
| E02-A logical design | Domain, wire candidate, append-only model | Candidate complete |
| E02-B synthetic function tests | Node built-in unit tests, 30/30 PASS | PASS (synthetic only) |
| E02-C physical SQL/RLS | Managed isolated staging + DBA review | NOT TESTED |
| E02-D real Auth and appointments | Verified JWT + non-bypass writer | NOT TESTED |
| E02-E signature/evidence | E03 raw bytes and signer evidence | BLOCKED |
| E02-F end-to-end two-tenant runtime | Negative tests with real role/session | NOT TESTED |
| E02-G main merge / customer pilot / prod | owner and security approval | HOLD |

**Next gate:** controlled E02 integration & review is permitted as a future separately scoped change. WLE-E03 evidence/audit foundation depends on these contracts but does not inherit a release approval.
