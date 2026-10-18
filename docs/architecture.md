# Architecture, rules and assumptions

## Domain boundaries

`src/lib/domain/reconciliation/` has no React, database or HTTP dependency. Zod validates all parcel inputs; `Fraction` performs normalized BigInt arithmetic. Rational values serialize as canonical strings (`1/3`), avoiding JSON BigInt and floating-point loss. Only chart widths use rounded floating-point display values.

Events sort by effective date then explicit sequence. Recorded-entry date is retained but never substitutes for effective order. Repeated event IDs, identical date/sequence pairs and unsatisfied dependencies stop replay. Baseline provenance, parcel identity, known parties and complete source references are required. A sender's aggregate outgoing allocations cannot exceed its interest before the event, including multi-allocation events. Incoming allocations within the same event cannot finance outgoing transfers.

Event semantics are explicit allocation lists. A partition is limited to shares within the same parcel. Corrections reallocate documented interests and conserve the baseline; structural area changes and cross-parcel splits are unsupported. Succession allocations must be supplied; the engine does not infer heirs.

Snapshots are evaluated as of their effective date. Future events are excluded. Missing or unresolved prerequisites produce insufficient evidence; failed transfers stop replay and require review. A displayed state after a stopped replay is partial, not an authoritative expected state.

## Rules

| Rule                                | Trigger                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| R01 SHARE_OVER_TRANSFERRED          | Aggregate outgoing share exceeds prior recorded interest                         |
| R02 TOTAL_SHARE_NOT_CONSERVED       | Baseline does not total one, event conservation fails, or observed total differs |
| R03 AREA_SHARE_MISMATCH             | Stated equivalent area differs exactly from share × parcel area                  |
| R04 EXPECTED_MUTATION_MISSING       | No snapshot, or an evaluated event is absent from snapshot references            |
| R05 MUTATION_WRONG_PARTY            | Observed positive share belongs to a party with no reconstructed interest        |
| R06 MUTATION_WRONG_SHARE            | Existing party's expected and observed shares differ                             |
| R07 DUPLICATE_MUTATION              | A snapshot references one event more than once                                   |
| R08 TRANSFEROR_INTEREST_UNSUPPORTED | Sender has no supported interest immediately before the event                    |
| R09 EVENT_CHAIN_INCONSISTENT        | Duplicate event, ambiguous order, or missing/out-of-order prerequisite           |

`EVIDENCE_INCOMPLETE` separately identifies missing documents/baseline, unknown party, ambiguous parcel identity, unsupported snapshot references or duplicate owner rows. No legal deadline is inferred. Duplicate-mutation detection covers explicit repeated references; it cannot infer unknown duplicates without linkage evidence. Unverified sources prevent a MATCH even when arithmetic matches.

Outcome precedence: missing evidence → INSUFFICIENT_EVIDENCE; stopped/invalid replay → REVIEW_REQUIRED; calculable discrepancy → CONFLICT; unverified source → REVIEW_REQUIRED; otherwise MATCH. MATCH means only that supplied records reconcile under the stated assumptions.

## Persistence

`migrations/001_initial.sql` creates relational tables for parcels, parties, source documents, baseline holdings, events, allocations, snapshots, snapshot holdings, runs, discrepancies, review cases and audit log. IDs are scoped by parcel where source references repeat across scenarios. Exact rational shares use text; validated writes are through domain/API services. Structured metadata and immutable evidence packets use PostgreSQL JSONB.

The prototype groups a run's discrepancies into one review case. Run creation, case creation, review transitions and snapshot append each use a database transaction. Unique run-to-case constraints make repeated case creation idempotent. No HTTP delete/update endpoints exist for events, old snapshots, old findings or audit entries.

Supported case transitions:

```text
NEW → UNDER_REVIEW → NEEDS_EVIDENCE → UNDER_REVIEW
                  → RESOLVED → UNDER_REVIEW (reopen)
                  → ESCALATED → UNDER_REVIEW
NEEDS_EVIDENCE → ESCALATED
```

Every action requires a note. A resolution changes workflow state, never calculation results. Historical runs store the full input dataset and the chosen snapshot ID. Reports combine immutable calculation evidence with the current review state and its audit history.

## Deployment boundary

PGlite is embedded PostgreSQL suitable for a single Node process with a durable writable directory. It is not a multi-instance or serverless database. For a hosted pilot, add the Drizzle PostgreSQL driver, replace the singleton connection, apply SQL migrations against the hosted database, remove implicit startup seeding, and add institutional identity/authorization, retention, backups and independent security review. Test that adapter separately. No hosted adapter is claimed here.
