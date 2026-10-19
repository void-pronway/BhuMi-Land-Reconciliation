# Architecture and rules

```text
Public Bangla/English demo ── bundled fictional fixtures + pure exact engine

Private Next.js reviewer UI
  → strict API validation + Origin/session checks + parcel grants
  → domain engine + transactional record services
  → Drizzle SQL
      ├─ hosted PostgreSQL via node-postgres (Render)
      └─ embedded PostgreSQL via PGlite (local development)
```

One Next.js service serves frontend and backend. The hosted database owns records, users, grants, sessions and rate limits; no Render filesystem state is required. Database connection selection and migration execution live in `src/lib/db/connection.ts`; domain logic remains independent in `src/lib/domain/reconciliation/`.

## Exact engine

Normalized BigInt rational arithmetic makes ownership decisions. Strings such as `1/3` safely serialize exact values. Floating-point arithmetic is used only for visual bar widths. Events sort by effective date and explicit sequence. Duplicate IDs, tied ordering or missing prerequisites prevent a confident replay. Multiple outgoing allocations are checked in aggregate against the sender's pre-event interest; incoming interest in the same event cannot finance an outgoing transfer.

The baseline, events and observed mutation snapshots stay separate. Mutations never overwrite expected history. Saved runs capture their full inputs and result. Correction creates a new snapshot and run. Review resolution does not change prior calculations.

Sale, gift, recorded succession allocation, same-parcel partition and reallocating correction events use explicit allocation lists. Heirs are never inferred. Cross-parcel structural changes, physical boundary determination and full inheritance law are unsupported.

## Rule catalogue

| Rule                                | Trigger                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------- |
| R01 SHARE_OVER_TRANSFERRED          | Aggregate outgoing share exceeds prior interest                           |
| R02 TOTAL_SHARE_NOT_CONSERVED       | Baseline/event/observed totals fail the relevant conservation check       |
| R03 AREA_SHARE_MISMATCH             | Stated area differs exactly from share × parcel area                      |
| R04 EXPECTED_MUTATION_MISSING       | No snapshot, or an evaluated event is absent from its references          |
| R05 MUTATION_WRONG_PARTY            | Positive observed share belongs to a party without reconstructed interest |
| R06 MUTATION_WRONG_SHARE            | Expected and observed party interests differ                              |
| R07 DUPLICATE_MUTATION              | A snapshot repeats an event reference                                     |
| R08 TRANSFEROR_INTEREST_UNSUPPORTED | The prior state does not support the sender's interest                    |
| R09 EVENT_CHAIN_INCONSISTENT        | Duplicate event, ambiguous order or broken prerequisite chain             |

`EVIDENCE_INCOMPLETE` separately captures missing sources/baseline, ambiguous identity or holdings, and unsupported linkage. No legal deadline or probability of fraud is inferred. Outcome precedence is missing evidence → INSUFFICIENT_EVIDENCE; invalid/stopped replay → REVIEW_REQUIRED; calculable differences → CONFLICT; unverified source → REVIEW_REQUIRED; otherwise MATCH.

## Persistence and access

Migration 001 defines parcels, parties, documents, baselines, events/allocations, snapshots/holdings, runs, discrepancies, cases and audit entries. Migration 002 adds individual accounts, sessions, parcel grants, rate limits, review versions, indexes and integrity constraints. Migrations are versioned, transactional and protected by a transaction-scoped advisory lock; seeding/bootstrap use a separate lock. Existing version-1 rows are retained.

Review cases group one run's findings. A unique run-to-case relationship makes repeated case opening idempotent. Review updates use row locks/version checks; snapshot appends use a parcel lock and previous-snapshot check. New audit rows identify the authenticated email and parcel scope. Legacy unscoped audit rows remain administrator-only.

Case transitions: NEW → UNDER_REVIEW; UNDER_REVIEW → NEEDS_EVIDENCE / RESOLVED / ESCALATED; NEEDS_EVIDENCE → UNDER_REVIEW / ESCALATED; RESOLVED or ESCALATED → UNDER_REVIEW. Each transition requires a note.

## Internationalization and display

`src/lib/i18n.ts` defines equal English/Bangla key sets, seeded party/scenario names, number formatting and Bangla-input normalization. Display preferences use non-sensitive cookies. Initial language/theme render on the server, and system theme preference is handled by CSS. Fonts are bundled locally. Original source content and user-entered notes are not translated or altered.

See [security boundaries](security.md) and [free deployment instructions](deployment.md).
