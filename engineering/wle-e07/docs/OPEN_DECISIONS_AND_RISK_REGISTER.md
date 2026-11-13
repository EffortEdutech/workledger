# WLE-E07-06 — Open Decisions, Source Assumptions and Risk Register

**Not production-approved.** Refer to WLE-P1B `1.0.0-rc1`, WLE-P1-14 and the E04–E06 evidence/holds. Decisions below require owner/DBA/QS/security approval, not unilateral implementation.

| ID | Decision or risk | Current candidate treatment | Approval required |
|---|---|---|---|
| E07-DEC-01 | Meaning of task-level percentage complete by discipline and contract | integer `completion_bp` after independent review, no automatic physical or financial conversion | QS professional and contract owner |
| E07-DEC-02 | Unit quantity precision, remeasurement and unit conversion | positive decimal string 4dp, BigInt sum per exact unit; no unit normalization | QS, financial policy owner |
| E07-DEC-03 | E05 work package ↔ E06 WBS/task ↔ BOQ line mapping | no automatic mapping; explicit source provenance | QS and technical architect |
| E07-DEC-04 | Treatment of provisional sums, variations, claims and progress certificate | excluded; E09/E10 separate | Commercial/QS/legal |
| E07-DEC-05 | E04 diary acknowledgement vs independent E07 factual verification | two separate decisions; reviewer must differ from E07 author | Contract admin/security |
| E07-DEC-06 | E03 evidence hash/retention and verification of source diary facts | injected trust port only; real-byte readback HOLD | DBA/security/data owner |
| E07-DEC-07 | Accepted/superseded baseline report semantics | no new actuals against superseded baseline; retained historical report views | Programme director/owner |
| E07-DEC-08 | Correction/void authority, nonrepudiation and append-only archive | synthetic serial void event, never delete; physical DB trigger and retention HOLD | Security/audit/legal |
| E07-DEC-09 | Report-as-of timezone, shifts and calendar day comparison | uses project local diary date; simple arithmetic for observed finish date only | Planner/QS/legal |
| E07-DEC-10 | Real E01 appointment roles and `construction.programme.*` capabilities | new proposed capabilities, not granted | Owner/security |
| E07-DEC-11 | E06 source signatures and QS stage validity | E06 separate verified port; no new signing authority in E07 | QS system owner/security |
| E07-DEC-12 | Real RLS and legacy migration reconciliation | unexecuted SQL conceptual sketch, default deny | DBA/security |

## Evidence caveats

The E07 tests exercise an in-memory **synthetic** transaction with an injected clock. They do not prove PostgreSQL locking, row policies, race safety under multi-process deployment, original E03 object retention, external signatures or genuine contractor data. Sample reports use invented source IDs and dates. No legal inference (CIDB levy, PAM/PWD/JKR, CIPAA, EOT or claim) follows from E07 tests.
