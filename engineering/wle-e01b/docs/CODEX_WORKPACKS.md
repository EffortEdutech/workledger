# WLE-E01B — Codex Engineering Work Packages and Open Issues

| ID | Deliverable | Entry dependency | Acceptance |
|---|---|---|---|
| E01B-01 | Server-only request/approve/activate/revoke handlers | E01 `can_act`, frozen `1.0.0-rc1` | Actor derived from verified JWT; negative tests |
| E01B-02 | E01B candidate schema delta, permissions, RLS | Isolated DBA-reviewed database | No browser grants, 11 private RLS tables, active membership tests |
| E01B-03 | Audit/receipt/outbox atomicity | 01/02 | Fault-injection rollback; no silent missing event |
| E01B-04 | Delegation & independent approval | 01/02 | No self grant/approve/revoke, reviewer active at activation |
| E01B-05 | Restricted pool, verified Supabase Auth, real staging | Explicit staging project approval | Two-real-user negative integration and role tests |
| E01B-06 | API adapter and secure session lifecycle | 05 | No browser import/server privilege leakage, telemetry redaction |
| E01B-07 | Idempotent concurrent command processing | 03/05 | Two concurrent same-key requests return one receipt and one event |
| E01B-08 | Outbox delivery, retry, DLQ and signed consumer contracts | 03 | At-least-once publish, deduplication, retry monitoring |
| E01B-09 | Authority bootstrap, evidence, signature and revocation governance | Owner-approved authority policy | Founder/owner sign-off, protected administrative recovery |
| E01B-10 | Release governance, data migration and disaster recovery | 01–09 | Staging sign-off, rollback, incident drill, production approval |

**Separate unchanged backlog:** Vercel Node20 preview failure `WLE-E00-DEPLOY-001`, legacy lint/dependency advisories, Contract Diary role check `CDP-SEC-004`, QS privileged database connection `QS-SEC-001`, live Supabase RLS `WLE-SEC-002`.

**Do not merge** this branch into `main` without full review; do not apply candidate SQL on real project. Non-blocking documentation and isolated coding may continue while runtime acceptance remains on hold.
