# WLE-E05-02 — Decimal, Revision Diff and Allocation Controls

**Candidate numeric convention ONLY; no replacement of a quantity surveyor's valuation instruction.**

## Input and arithmetic

- Accept quantity and rate as ASCII decimal **strings**, not JavaScript numbers, exponent notation, locale strings, negative values or more than four decimal places.
- Convert quantity to integer units scaled ×10,000 and rate to scaled ×10,000, multiply using `BigInt` and round per line to 2dp MYR using `(quantity_scaled × rate_scaled + 500,000) // 1,000,000` (positive half-up). No floating point.
- `amount` is computed, not accepted as caller-controlled text; `0.0050` rounds to RM0.01 for one unit under **this candidate rule**.
- Totals are sums of individually rounded line amounts, not rounding the overall product. Do not apply taxes, retention, VO, discount, fluctuations, preliminaries or certificates.
- Fixed scale, maximum digits and overflow guard are synthetic engineering limitations. Real item-unit precision and contract rates are **not** approved by this package.

## Revision diff

`diffRevisions(before,after)` requires exact same organization/project/contract/BOQ/currency and matches stable `item_key`. It returns added, removed and changed line records; package identities added/removed/changed; before/after totals; and signed difference. It does not infer whether an item change was approved under a contract, whether a quantity is measurable or whether value is due.

Example: quantity `12.5000` × rate `120.4500` → `1505.63`. A later quantity `15.0000` × same rate → `1806.75`, delta `+301.12`. Different quantity and rate scales or a different valuation convention could give different outcomes; that policy must be ratified before migration.

## Allocation integrity

- Allocation list is part of **one complete revision snapshot**. Revisions are never edited in place after approval.
- Duplicate `item_key` inside one package, unknown item keys, duplicate package code/ID, percentage outside 1..10000 and cumulative item allocation above 10,000 fail closed.
- Unallocated line remains visible for coverage review; not a hidden implicit package.
- E05 does not produce WBS durations, sequencing, earned value, claim amounts or quantity-done; E06/E07/E09 own those in later stages.

## Mandatory future database proofs

1. Transactional item-level allocation sum constraints under concurrent writes.
2. PostgreSQL `numeric` precision/rounding parity with `BigInt` and approved currency/unit policy.
3. Append-only approved/locked snapshots by non-bypass writer, source crosswalk non-repointing and real two-tenant/sibling contract denial.
4. Source document SHA-256 readback through E03 custody and separate provenance authenticity policy.
5. Reconciliation report for each imported legacy BOQ header/section/item/breakdown, including failures and duplicated source IDs.
