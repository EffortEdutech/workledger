# WLE-E01B Security Architecture and Authority Model

## Trust flow

1. Client submits requested resource IDs, `acting_appointment_id`, operation type, command ID/idempotency key, expected version, reason and operation-specific data. It **must not** provide actor ID, admin role, `approved_by` or trusted claims; unknown fields fail validation.
2. Trusted server verifies Supabase access token via `getUser(token)`; the unit tests use an injected **stub** verifier, not a live JWT.
3. Trusted server acquires one isolated PostgreSQL session as `wle_e01_appointment_writer` (NOLOGIN, NOSUPERUSER, NOBYPASSRLS) and executes one transaction. It sets verified actor/org/contract as transaction-local settings, then re-evaluates E01 `can_act` and **contract_admin capacity**.
4. Request creation validates target's effective active organisation membership, exact contract party, capacity and capability allowlist. It writes request, audit, outbox, receipt atomically.
5. Independent reviewer with `construction.appointment.approve`, also a contract admin, approves a pending request and records their identity and appointment. Activation checks reviewer authority again, creates the appointment/capabilities and ledger atomically.
6. Revocation changes the exact active appointment version and status, with event/outbox/receipt in one transaction. E01's `can_act` denies the revoked appointment immediately when read under its restricted role.
7. Outbox rows remain `pending` until an independently reviewed publisher implements dispatch, retries, signing and dead-letter governance.

## DB permissions / isolation

- E01 baseline tables and E01B tables have `FORCE ROW LEVEL SECURITY` (11 total) in an unexposed private schema.
- New command role can SELECT only prescribed tenant- and contract-scoped rows. It has **column-limited** UPDATE on appointments/requests, INSERT on request, capability, audit, outbox and receipt, and **no DELETE**. Client `anon`/`authenticated` schema privileges remain absent.
- Custom PostgreSQL GUC identity and scope are plain strings. A stolen writer credential can forge them; network isolation, connection privileges, TLS and server-only auth verification are mandatory for production.
- RLS protects against omitted filters in restricted connection queries but is not sufficient for authorization if the application server or connection is compromised. DBA ownership remains powerful; 'append-only' means app-role append-only, **not a cryptographic WORM store**.
- Trigger/cross-table invariants, SQL policy recursion, read/write grants and role inheritance must be re-audited on native managed PostgreSQL/Supabase 17+.

## Separation of duties and bootstrap

- No self-appointment, no self-approval, no approval by target, no self-revocation, no cross-contract approval, no obsolete reviewer approval reused after reviewer revocation.
- Bootstrap contract administrators are **NOT** minted by E01B: an authorised owner/DBA must establish approved initial identities and delegation evidence by a separate reviewed process.
- E01B capabilities cannot mint `construction.appointment.request`, `.approve`, `.grant`, `.revoke`, `construction.payment.*`, `construction.commercial.*` or legal powers; four controlled recipient capacities only.
- Business role ownership (owner/contract client/main contractor) and signature authority require ratification; 'contract_admin' here is software capacity, not automatically contractual or statutory authority.

## Remaining security risks

- E01B-SEC-01: real Supabase Auth/JWT and pooled write-role end-to-end; **NOT TESTED**.
- E01B-SEC-02: direct privileged database access and GUC-forgery under compromised backend; design and restrict private network/credentials.
- E01B-SEC-03: signed proof of appointment authority and explicit owner-review / first-administrator bootstrap; **NOT IMPLEMENTED**.
- E01B-SEC-04: outbox worker and exact-once downstream effects; **NOT IMPLEMENTED**.
- E01B-SEC-05: simultaneous requests, advisory locking and retry semantics beyond unique-key constraints; **NOT LOAD TESTED**.
- E01B-SEC-06: append-only physical retention, database owner attack model and recovery drills; **NOT TESTED**.

No live customer tenant onboarding or money/legal signing authority is authorised by this candidate.
