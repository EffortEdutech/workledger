# WLE-E06-06 — QS Generation & Programme Baseline Review UI

**STATUS: DESIGN-ONLY.** No React route, query hook, Supabase DB, live API or persisted customer data. The HTML prototype is a static synthetic reviewer sketch.

## Enterprise roster

Show exact organisation/project/contract identifiers, verified QS project crosswalk and source instance, E05 BOQ revision, BOQ snapshot SHA (truncated display only), current QS job state, source stage, last authenticated event/receipt, professional approval status, and Enterprise baseline acceptance state. User-visible IDs must not be treated as authority.

## Generate programme

Only enabled for a currently locked E05 BOQ and an authorised contract appointment. Confirm QS native project and item-by-item source alignment. Show explicit text: **“Generate a QS planning request. This does not approve a programme, certify quantities or activate a contract baseline.”** Provide stable request ID and pending delivery indicators; a network timeout must never be shown as a failed job if QS may have accepted it. Disallow offline submission.

## QS programme progress

Display source stages `discipline_profiling → activity_mapping → wbs_structuring → sequencing → productivity_strategy → cpm_review → programme_review → complete`, each with independently confirmed stage decisions. Clearly distinguish QS internal `confirmed` from Enterprise accepted. Display `reopened`, `failed`, `cancelled` explicitly. Source engine versions, calendars and review record remain provenance—not generic green success badges.

## Manifest review

Preview imported task WBS, start/finish, duration, total float, dependency edges, calendar, external source IDs and stable canonical task UUIDs. Show manifest hash, Ed25519 key fingerprint/ID, professional reviewer and decision reference. Error tray: wrong tenant/crosswalk, source reopened, stale BOQ, invalid signature, mismatch, cycle, duplicate event, retried delivery. Import status `pending_acceptance` must never be presented as contract-approved.

## Enterprise baseline acceptance

Separate independent appointed reviewer checks exact contract scope and version, original BOQ revision and QS confirmed manifest. Require written reason, expected active baseline version, a fresh server authorisation check and single authoritative acceptance receipt. Label expressly: **“Enterprise baseline acceptance records a controlled programme reference; it is not a payment certificate, EOT decision or CIPAA notice.”** An accepted predecessor remains visible in an immutable history view.

## Accessibility + privacy

Responsive tables, keyboard controls, status wording independent of colour, visible focus, 44px touch targets, paginated tasks, no bearer token/keys in browser storage, no service credentials, no sensitive payload in URL or telemetry. Feature flag remains OFF until actual staging security and user acceptance passes.
