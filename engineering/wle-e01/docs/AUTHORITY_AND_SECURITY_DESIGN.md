# E01 Authority and Security Design

## Trust boundaries

1. Frontend supplies bearer token and *requested resource IDs* only; neither `user_id`, `role`, `approved_by`, nor `actor_user_id` is accepted as proof of authority.
2. Trusted backend calls Supabase Auth `getUser(token)` (verified remotely) and receives a server-verified UUID. The `createSupabaseVerifier` adapter takes an existing server-side client; the E01 bundle never loads credentials.
3. Backend opens one PostgreSQL transaction with a **dedicated restricted role** `wle_e01_gateway`, `BEGIN READ ONLY`; `SET LOCAL wle_e01.verified_user_id`; invokes `wle_e01.can_act(...)` with parameterised UUIDs and capability; then commits/releases. A denial is `forbidden`, not a leaked contract.
4. SQL enforces tenant containment via composite FKs, FORCE RLS and selection policies. The gateway role has only SELECT/EXECUTE; no mutations, no public schema grants. Domain mutations must be designed as separately reviewed commands with independent authorization and atomic event/outbox writes in E02+.
5. RLS protects against accidental query omission when executing under the restricted role. A malicious party with direct control of that role's DB connection could forge a custom GUC; network/credential isolation and signed identity verification at the gateway are essential. This is *not* a claim that RLS validates the Supabase JWT itself.

## Core membership and appointment rule

Allow `construction.X.Y` only when all of the following are true:
- The organization is active, the user is a current active member and the membership interval covers **database current time**.
- The appointment's `appointee_user_id` equals the verified server actor and its organization/project/contract IDs match the exact requested resource.
- The appointment status is active and its effective interval covers **database current time**; revoked, proposed and expired rows are denied.
- The appointment explicitly includes the capability. Broad organization administrators without an appointed contract capacity are denied contract read and irreversible approvals.
- **Where a state-specific rule is needed** (e.g. completed contract, submission author, approval threshold), E01's generic permission check is insufficient: implement a domain-specific command handler and negative test before use.

## RLS table policy decisions

| Table | Runtime SELECT | Runtime INSERT/UPDATE/DELETE | Constraint |
|---|---|---|---|
| organizations | active membership | denied | UUID PK |
| organization_memberships | actor's active membership only | denied | composite `(org,user)` PK |
| projects | active org member | denied | composite org/project FK |
| construction_contracts | actor has active contract appointment and `construction.contract.read` | denied | triple org/project/contract PK |
| contract_parties | contract readable to actor | denied | quadruple contract/party FK |
| contract_appointments | own appointment + active membership | denied | parent party+membership FKs |
| appointment_capabilities | own appointment only | denied | appointment/capability PK |
| authority_events | denied pending E03 viewer | denied | event append-only plan; no runtime grants |

## Status of privilege mutation

No self-service grant/revoke is shipped. DBA-only synthetic seeding is used in integration tests. The application must later provide reviewed appointment-change commands with actor appointment, delegation evidence, separation-of-duties, event + outbox atomicity, effective-time constraints, and independently verified RLS for the mutation role. Do not expose a table editor for appointments to end users.

## API compatibility

E01 adds no public API and does not change P1B `1.0.0-rc1` DTO required fields. A gateway integration may use the existing command envelope and derive actor from the verified principal; it must not trust a client-specified `acting_appointment_id` as sufficient authorization.
