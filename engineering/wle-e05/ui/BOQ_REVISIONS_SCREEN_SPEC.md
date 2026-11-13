# WLE-E05-05 — BOQ Revision and Work-Package Review UI (DESIGN ONLY)

**Not a running application.** No WorkLedger Standard import, private API, Supabase authentication, file upload, payable amount calculation or server persistence. Enterprise feature flag stays OFF until review.

## Revision roster

Contract selector shows exact tenant/project/contract and BOQ identity. Versions table: Revision No., Source Evidence SHA-short, E02 contract revision, Created/Approved/Locked At and By, status and immutable snapshots. Read-only code and valid reviewed capability are required; a display role is not authority. Pending draft, approved and locked are visually distinct and text-labelled, not solely color-coded.

## Snapshot comparison

Left/right selected revisions show item code, description, section, item_type, unit, quantity/rate/amount strings, stable item_key and change marker. Header total is explicitly labelled **"calculated using unapproved E05 engineering decimal convention"**; no certified valuation. Show items added/removed/changed and revisions' work-package allocations, including unallocated items and 100% oversubscription errors. No auto merge, silent line renumber or edit of locked version.

## Work-package allocation review

Each package has ID, code, title, discipline and linked BOQ line shares as basis points. Inspect coverage totals per line: 0–100%, over-allocation blocked by authoritative server, unallocated visibly tracked. Never render a share as a measured quantity of completed work; do not infer programme duration or cost-based weight.

## Review actions (future guarded Enterprise app)

Create/replace full draft → independent approve → independent lock. Each action re-authenticates and checks the active E01 appointment plus exact capability. Show reasons, expected version, source document proof and idempotent receipt. A reviewer cannot approve or lock own created draft; all prompts deny stale versions and show non-destructive conflict review. Signed contract authority/legal legitimacy remains separate from this BOQ reviewer action.

## Source & diary links

Provide a distinct source crosswalk table with source_system + source_instance_id + source_entity_type + source_record_id + source_revision → exact enterprise revision/item. CDP legacy BOQ item is obtained by `boq_id` scoped through `boq.contract_id`, not by an assumed item `contract_id`. Factual E04 submitted diary can link to a **locked** package; never auto-update earned value or progress claims.

## Accessibility and safety

Use semantic tables, keyboard navigation, focus states, error messages with revision IDs, 44px touch targets, responsive wide-table horizontal scroll, and non-sensitive IDs in UI. Do not show customer data in sample prototype. Do not claim approved release or certified sums. Source SHA and principal/appointment details are controlled visibility fields.
