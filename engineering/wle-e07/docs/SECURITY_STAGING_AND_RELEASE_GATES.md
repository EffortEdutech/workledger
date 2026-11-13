# WLE-E07-03 — Security & Staging Gate Register

**Classification: isolated synthetic engineering candidate.** No database, production, commercial, legal or customer pilot authority.

| Gate | Evidence | Disposition |
|---|---|---|
| E07-A authority/source pins | E06 head, P1-14/P1B, E04/E05/E06 provenance | PASS source review |
| E07-B executable candidate | 107 Node tests, exact decimals, review, replay, corrected projection | PASS isolated |
| E07-C independent regressions | E06 80; E05 64; E04 58; E03 verified 45; E02 verified 30 | PASS separate source execution |
| E07-D E01 authorization | real JWT getUser, current scoped appointment and capability | NOT TESTED |
| E07-E E04 trusted diary | live submitted/acknowledged receipt, original immutable facts, date and E03 byte hash | NOT TESTED |
| E07-F E06 accepted baseline | real signed source manifest, accepted import, task crosswalk, successor baseline | NOT TESTED |
| E07-G actual RLS/DB | DBA-approved physical SQL, non-bypass writer, 2 tenants × 2 identities and sibling contracts | NOT TESTED |
| E07-H transactional races | real DB events, idempotency, report cut, reviewer separation, review/void races | NOT TESTED |
| E07-I QS measurement governance | task/BOQ mapping, units, progress validation rules, quantity measurement acceptance | HOLD |
| E07-J UX/report QA | actual React feature-flagged app, accessibility, WorkLedger Standard smoke | DESIGN ONLY |
| E07-K legal/commercial | verified claim/EOT/CIPAA boundary and authorised human signoff | HOLD |

## Threats and negative tests

- Forged browser actor or superuser / unverified appointment: **synthetically rejected**, real E01 and RLS unverified.
- Cross tenant / sibling contract baseline, wrong task UUID and changed native source version: **synthetically rejected**. Real E06 import readback unverified.
- Client mislabelled draft/acknowledged diary, altered E04 evidence hash/version or evidence IDs: **synthetically rejected** by trusted proof port; real E03 original-byte retrieval remains unverified.
- Two writers publish same as-of snapshot after new events: sequence compare-and-swap synthetically guards; DB transaction tests required.
- Value inflation by mixing m², m³, number, percentage and currency: explicit type/unit, BigInt unit-specific sums and no price data; separate QS-approved policy required.
- Corrections suppressing adverse evidence: append-only void records and historical report hashes; independent anchoring and object retention not implemented.
- External-source manifest supersession: current baseline controls all new captures. Historical records never reattached to successor programme automatically.

## Staging protocol — NOT EXECUTED

1. Owner approves isolated WorkLedger Enterprise and separately approved QS/CDP staging plus budget, region, PR scope and rollback ticket. Do not touch unrelated Supabase projects or production.
2. DBA reconciles E01–E07 actual physical schema and FKs, then gates server-side writer transactions and RLS with two real tenants, two users, read-only and revoked appointments, and sibling contracts. No bypass owner/service role in app or browser.
3. Implement authoritative E06 `verifyAcceptedBaseline`: independently re-read signed QS source manifest, imported immutable tasks, active version, full source tuple and E05 frozen BOQ hash; deny unknown task, wrong contract and stale baseline.
4. Implement E04 `verifyDiary` with real stored original bytes, original facts hash, exact immutable version/date, E03 evidence object readback and E04 independent acknowledgement. Deny mutation/changed evidence.
5. Run concurrent review, void, report cut and replay against transactional storage; prove historical reports remain immutable with verified hashes and audit/outbox receipts.
6. Obtain authorised QS methodology for unit precision, completion assessment, remeasurements and task/BOQ mapping. A programme task's % is not a QS certificate.
7. Add Enterprise-only flag default OFF, accessibility and Standard regressions; conduct controlled synthetic UAT before any real customer data.
8. Collect actual SQL migration IDs, PR, RLS policy outputs, negative results, log receipts, signed approvals and rollback readback. No green production gate without all approvals.

## Carry-forward HOLD

`QS-SEC-001`, `WLE-INT-001`, `WLE-SEC-002`, `QS-TEST-002`, `QS-MANIFEST-001`, `QS-BOQ-001`, `QS-ACT-001`, `QS-RET-001` and WLE E01–E06 staging/signing/ownership gates all remain open. **No payment/certifier/VO/EOT/CIPAA/CIDB legal conformance** is granted by E07 data.
