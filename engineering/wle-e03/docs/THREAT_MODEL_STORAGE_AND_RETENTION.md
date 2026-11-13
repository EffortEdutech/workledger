# WLE-E03-02 — Threat Model, Storage Custody & Hold Controls

## Threat actors / expected denies
- An authenticated user from a different organisation, project, sibling contract or expired appointment tries to read/change an asset: **deny**, with composite-scope checks and a server-only appointment gate.
- An attacker supplies `actor_user_id`, raw Supabase token in body, chosen `storage_object_key`, altered SHA, an external HTTP URL or a filename traversal: **deny**, never treat client claims as custody evidence.
- The blob is truncated or overwritten after original receipt: **rehash bytes at access/export** and reject with integrity failure; keep incident evidence and notify operators in the future monitoring layer.
- A revoked appointee replays a previously committed command: **reauthorise before receipt readback**. No stale token/appointment may reveal a protected receipt.
- A duplicate offline request or network timeout repeats an operation: use persistent scoped idempotency and strict transaction order. The current mutex is one-process only.
- Release a legal hold without independent reviewer, backdate/rewrite the origin or purge data while hold active: fail closed. No purge/deletion exists in candidate.
- Unauthorized external dissemination via a signed URL or public bucket: **not implemented**. No public bucket, URL generator or browser delivery permission.

## Candidate storage workflow (not implemented physically)
1. Validate authenticated actor, contract appointment, input type, size, MIME and security scanning policy; set upload quarantine with synthetic opaque key and strict privacy.
2. Receive all bytes using a bounded streaming byte-counter and SHA-256 hasher; compare the declared byte digest; reject short upload, reused key or changed content.
3. Write immutable/private object with conditional create and provider version/ETag checks; verify byte readback or trusted object checksum semantics. Do not overwrite original or deduplicate between tenants.
4. In a bounded DB transaction verify contract, appointment and source context, insert `evidence_assets` + event + pending outbox + idempotency receipt. If the DB transaction fails, quarantine any previously stored orphaned object. Never garbage-collect until reviewed grace period and hold checks.
5. Periodic integrity scanner reads private bytes and checks SHA; alerts on mismatch. Reconciliation of object metadata and DB rows is essential because object stores and PostgreSQL do not share an atomic transaction.

The synthetic test store deliberately clones both objects and tables in one transaction. **That is not a safe claim about real Supabase Storage**.

## Governance of holds and redactions
- Retention classes are labels without prefilled years or statutory deletion schedules. Legal/commercial records require formal owner/legal policy for `retention_class`, retention event time origin, suspension, region, backups and lawful disposal.
- Hold events include case reference, reason, evidence ID, issuing authority and issuer. A different authorised reviewer must approve release with recorded source review; prior history remains. Active hold checks should block deletion of the original and any necessary derivatives or dependent exports. Candidate has no deletion API.
- A redaction remains attached as a derivative with a new digest. Confidential originals are accessible only through privileged, audited server reads, never by publishing the redacted version as replacement.
- Need legal counsel review for CIPAA notice/service evidence, personal information, document privilege, Malaysian data protection, preservation requirements, and any statutory duration. No claim of CIPAA certification or admissibility.

## Supabase considerations to verify before integration
Private buckets are access-controlled, not inherently immutable. Data API exposure depends on explicit schema/grants and differs from RLS. Restrict storage operations using server-side policy and verify `storage.objects` RLS, bucket upload configuration, signed URL lifetime, service-role exposure and infrastructure backups. Never use `service_role` or `postgres` in browser code. SQL in this package creates a private custom schema, never alters `storage` or `auth` schemas, and grants no runtime privileges.

Official references reviewed: https://supabase.com/docs/guides/storage/buckets/fundamentals ; https://supabase.com/docs/guides/storage/security/access-control ; https://supabase.com/changelog?types=breaking-change . These inform *future review*, not a claim that a real storage bucket exists.
