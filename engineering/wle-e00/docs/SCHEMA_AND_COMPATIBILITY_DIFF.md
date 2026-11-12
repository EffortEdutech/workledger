# WLE-E00 — Schema/API/compatibility diff

- **Production database DDL:** NONE.
- **Live RLS policies, grants, JWT settings, storage:** NONE.
- **Existing WorkLedger Standard routes/components/services/build package:** NONE.
- **Existing Contract Diary / QS Service repositories:** NONE.
- **New files only:** `engineering/wle-e00/**`.
- **P1B JSON Schema:** six copied schemas are unchanged; no new API schema claim.
- **P1B OpenAPI:** reference copy is unchanged; endpoints are *not implemented*.
- **Mock behavior:** synthetic command envelopes, server-derived principal passed as trusted test context, appointment-scoped capability checks, idempotent cache of mock receipts, version locks, explicit programme import/accept split.
- **Source-specific risk:** `manifest_sha256` checked for shape only; no cryptographic signature or producer authenticity proof. This is not a verified real QS acceptance artifact.

Future E01+ implementations should replace in-memory maps with transactional command handlers and PostgreSQL RLS, and add tests that prove a physical source crosswalk, event outbox and multi-process repeat safety.
