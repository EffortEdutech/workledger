# Candidate Deployment and Rollback — NOT FOR PRODUCTION EXECUTION

Source is additive under `engineering/wle-e01b/`. It is not imported by WorkLedger Standard; no existing root package, routes, DB migrations or UI files change. No PR or production deployment is part of this candidate.

In an approved **empty isolated staging** project, a DBA must review E01 baseline presence, actor role attributes, policies, schema privileges, table row-security, extension differences and migration order. Retain a validated snapshot, change ticket and rollback reviewer. Test-role creation file `000_TEST_ONLY_writer_role.sql` is never a managed production migration.

For a **disposable E01B-only test database** with no required records or audit retention, first stop the command adapter and outbox publisher (currently none), then DBA may restore a verified pre-E01B snapshot or carefully reverse approved objects in dependency order. **Do not use blanket `DROP SCHEMA ... CASCADE` on any retained Enterprise records**; E01B alters E01 tables and must be reversed with a reviewed migration, not a single drop.

Failure modes: no identity verification → 401; forbidden capacity → 403; stale version/replay conflict → 409; database outage/rollback → 503. Log only correlation/receipt IDs with redacted user/organisation fields. A failed audit or outbox insertion must abort the whole command.
