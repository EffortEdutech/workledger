# Candidate Command Contract (not an externally published OpenAPI)

**Shared fields:** `command_id`, `idempotency_key`, `organization_id`, `project_id`, `contract_id`, `acting_appointment_id`, `expected_version`, `reason`. Bearer token comes only in the server request header. Actor ID is NOT a client field. No extra keys. Response contains event ID, relevant request/appointment ID, status and version. All IDs are UUIDs; idempotency key is actor- and organisation-scoped.

**request:** `request_id`, `party_id`, `appointee_user_id`, `capacity`, `capabilities[]`, `effective_from`, `effective_until|null`; `expected_version=0`. Returns pending request `version=1`. Requires appointed contract admin with `construction.appointment.request`, target active member and exact contract party; forbid self and elevated capability.

**approve:** `request_id`, `expected_version=1`. Returns approved request `version=2`. Requires distinct appointed contract admin with `construction.appointment.approve`. Approver may not be requester or target; decision recorded in request and audit.

**activate:** `request_id`, `expected_version=2`. Creates active appointment and exact caps. Only original requester with current `construction.appointment.grant` may activate. Independent reviewer must still be an eligible contract admin with approval capability.

**revoke:** `appointment_id`, expected appointment `version`. Revokes active appointment and increments version. Only different appointed contract admin with `construction.appointment.revoke`; cannot self revoke.

**Event:** `appointment.requested.v1|approved.v1|granted.v1|revoked.v1`; each event has `event_id`, actor verified by server, exact tenant/contract, payload, recorded_at. A matching outbox record carries `event_id` and SHA-256 of canonical event payload, with `pending` dispatch state. Neither a cryptographic signature nor receipt of external delivery is claimed.

**Idempotency:** committed command receipt is reused on the same key/same business command (ignores transport `command_id`); same key with different payload returns `idempotency_conflict` 409. Database key uniqueness prevents duplicate rows, but concurrent first-flight retry behaviour requires a separate load test and client retry policy.

Frozen WLE-P1B `1.0.0-rc1` public wire schemas remain unchanged; these private command forms are **candidates** until reviewed and versioned.
