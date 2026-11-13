# WLE-E05-03 — Security, Staging and Release Gate Register

**Classification: ISOLATED SYNTHETIC ENGINEERING CANDIDATE.** No production, `main` merge, data import, Supabase SQL or legal/commercial authority issued.

## Trust boundaries

Authenticated actor must come from server-side verified session; `acting_appointment_id` must refer to a current E01B appointment with exact tenant/project/contract and capability. E05's `verifyAccessToken`, `authorizeCapability`, `verifyContractRevision`, `verifyEvidence` and `verifyDiary` functions are **injected synthetic ports**. They are not Supabase integration and no browser field establishes authorization. All commands recheck capability before receipt lookup, including retries after revocation.

BOQ approval/lock is a governance ledger act, not certification or valuation. New capabilities `construction.boq.revision_create`, `.revision_edit`, `.revision_approve`, `.revision_lock`, `.source_map`, `.diary_link`, `.read` are **not assumed granted** by E01/E01B; no existing viewer right implies write authority. Any role/appointment bootstrap requires independent owner/security review.

## Gate matrix

| Gate | Required evidence | Current status |
|---|---|---|
| E05-A source/authority mapping | E04 SHA, P1B, CDP BOQ source, workpack boundary | CANDIDATE documented |
| E05-B executable synthetic registry | 64 Node negative, version, arithmetic tests | PASS local |
| E05-C previous component regression | E04 58; E03 45; E02 30 separate reruns | PASS isolated only |
| E05-D physical DB SQL and RLS | DBA-approved migration, non-bypass writer, 2 identities × 2 tenants, sibling contract deny | NOT TESTED |
| E05-E verified E02/E03 ports | trusted contract revision, immutable stored source bytes, signer/legal separation | NOT TESTED |
| E05-F reviewed decimal/BOQ convention | QS approval by contract/unit, rate precision, sums, taxes, provisional lines | HOLD |
| E05-G legacy migration crosswalk | `boq_id` / section/item/breakdown exports, duplicate detection, readback | NOT TESTED |
| E05-H real concurrency & immutability | independent DB transactions, source mapping uniqueness, allocation race, immutable snapshots | NOT TESTED |
| E05-I programme/claim adapter | separately approved E06/E07/E09 interfaces and RLS | NOT BUILT |
| E05-J customer pilot, production, legal reliance | owner/DBA/security/QS/legal signatures | HOLD |

## Staging plan (NOT executed)

1. Owner approves an isolated WorkLedger Enterprise staging Supabase project, region, cost and change ticket. Do not touch unrelated Supabase projects.
2. DBA reconciles E01/E01B and E02/E03/E04 physical candidate schemas, then reviews E05 DDL, FKs, `numeric` scales, role grants and RLS. Generate the real migration only through approved CLI workflow. No role/service-key in browser.
3. Seed two genuine tenants, two actors and sibling contracts; include outsider, stale appointment, read-only actor, cross-BOQ revision and same-source-key repoint negatives.
4. Verify source-file bytes against E03 object readback, quarantine/virus-scan policy and orphan reconciliation. For now, E03 durable custody remains HOLD.
5. Exercise database concurrent allocate/share and revision numbering/approval/locking; demonstrate immutable locked rows even under direct writer attempts. Test stage rollback with retained audit data.
6. Test exact decimal arithmetic using representative MYR unit/rate/quantities chosen by an authorised QS; document discrepancies and approved rounding.
7. Reconcile CDP legacy BOQ `boq` / `boq_sections` / `boq_items` / `boq_item_breakdown` and mapping to enterprise `item_key`. Do not assume `boq_items.contract_id` exists.
8. Record actual source commit, test logs, SQL migration ID, staged role/policy outputs, PASS/FAIL/NOT TESTED, controls and human approvals.

## Upstream holds unchanged

E01/E01B staging and bootstrap, E02 real contract signing/version registry, E03 durable evidence/retention and audit trust, E04 encrypted browser persistence and MC reviewer runtime, WLE-SEC-002 RLS, WLE-E00 Vercel preview, CDP-SEC-004 legacy acknowledgment, QS-SEC-001 privileged QS DB access. No claim of PAM/JKR/CIDB/CIPAA legal conformance or certificate is made by E05.
