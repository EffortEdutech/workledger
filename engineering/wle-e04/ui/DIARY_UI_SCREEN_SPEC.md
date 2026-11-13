# WLE-E04-05 — Enterprise Daily Diary UI / Offline Capture Screen Specification

**Status:** candidate screen design + static HTML sample only; no React component imported into WorkLedger Standard, no real offline PWA. WLE P1B places Enterprise behind a disabled-by-default entitlement, preserving Standard.

## Main screen — diary roster

- Contract selector: exact enterprise `(org/project/contract)` scope, display name as presentation only; permission evaluated by backend. Date/shift filter and status chips `Draft`, `Submitted`, `Acknowledged`.
- Searchable list: diary date, shift, current version, submitter identity, evidence count, last acknowledged event and sync status. Read-only for submitted/acknowledged entries.
- Offline indicator distinguishes **Local draft / Pending sync / Conflict / Synced server draft**. Avoid misleading green success badges for mere offline capture. Network status is informative, not an authority check.

## Diary editor — structured factual capture

1. Diary date in project timezone, shift (day/night candidate), weather and site conditions.
2. Work progress factual description, manpower rows `(trade,count,hours string)`, equipment `(type,count)`, materials delivered `(material,unit,quantity string)`, issues and delays.
3. Evidence panel: local photo/document capture, local SHA256, size, pending preservation, E03 preserved receipt, E04 linked receipt. Do not show `Attached` until both receipts exist.
4. Actions: `Save draft locally` available offline; `Sync draft` requires re-authentication + valid appointment; `Submit` **online only** after all pending evidence resolved; `Acknowledge` only on submitted state for independent MC reviewer.
5. Conflict viewer: server version versus local version, difference review, keep local copy, manual reconciliation and new idempotency key. Never silently overwrite latest server diary.

## Reviewer screen
- Reviewer identity and appointment scope visible for clarity but authority determined server-side. Review an immutable submitted snapshot, evidence receipts and non-editable factual record. Acknowledge with explanatory note.
- Display explicit wording: **“Acknowledgement records receipt of the site diary; it is not a payment certificate or acceptance of claims.”**
- No client button controls contractual determination, EOT entitlement, statutory service or signatory legality.

## Responsive and accessibility
- Mobile-first single column for field workers; landscape/tablet provides two-column facts and evidence; desktop roster/detail split.
- Touch-friendly targets, visible focus, status text not colour alone, keyboard file selection, descriptive error/empty states and locale-friendly date presentation. Store source timestamps in UTC and project-local date separately.
- Photo capture must not force geolocation and must follow privacy/EXIF policy. Do not cache tokens in service worker, IndexedDB or URL.

## Prototype instructions
Open `ui/diary_prototype.html` locally to see a **non-connected screen sketch**. Its controls do not upload or submit data and do not represent server, offline durability or real reviewer authorization. The actual React Enterprise screen is a later feature-flagged integration gate.
