import { fraction, sum } from "./fraction";
import {
  parcelSchema,
  type Parcel,
  type State,
  type Result,
  type Finding,
  type Holding,
} from "./types";
const state = (rows: Holding[]): State =>
  Object.fromEntries(rows.map((h) => [h.party, h.share]));
export function reconcileMutation(input: Parcel, snapshotId?: string): Result {
  const p = parcelSchema.parse(input),
    snapshot = snapshotId
      ? p.snapshots.find((s) => s.id === snapshotId)
      : p.snapshots.at(-1);
  if (snapshotId && !snapshot) throw new Error("Snapshot not found");
  const findings: Finding[] = [],
    timeline: Result["timeline"] = [];
  let expected = state(p.baseline),
    incomplete = false,
    ambiguous = false;
  const add = (
    code: string,
    explanation: string,
    eventIds: string[] = [],
    party?: string,
    values: Partial<Finding> = {},
  ) =>
    findings.push({
      code,
      explanation,
      eventIds,
      party,
      documentIds: [
        p.baselineDocument,
        ...p.events
          .filter((e) => eventIds.includes(e.id))
          .map((e) => e.documentId),
        ...(snapshot ? [snapshot.documentId] : []),
      ],
      recommendation:
        "Compare the source deed, prior co-owner record and mutation allocation; request missing evidence before deciding.",
      severity: "ATTENTION",
      ...values,
    });
  const missing = (message: string, ids: string[] = []) => {
    incomplete = true;
    add("EVIDENCE_INCOMPLETE", message, ids);
  };
  const hasDoc = (id: string) => p.documents.some((d) => d.id === id);
  if (!p.identityConfirmed) missing("Parcel identity is ambiguous.");
  if (!p.baseline.length || !hasDoc(p.baselineDocument))
    missing("A supported baseline record is missing.");
  if (new Set(p.baseline.map((h) => h.party)).size !== p.baseline.length) {
    incomplete = true;
    add(
      "EVENT_CHAIN_INCONSISTENT",
      "Duplicate baseline holdings cannot be safely interpreted.",
    );
  }
  if (sum(p.baseline.map((h) => h.share)) !== "1") {
    incomplete = true;
    add("TOTAL_SHARE_NOT_CONSERVED", "Baseline shares must total exactly one.");
  }
  if (
    [...p.baseline, ...(snapshot?.holdings ?? [])].some(
      (h) => !p.parties[h.party],
    )
  )
    missing("A holding references an unidentified party.");
  if (snapshot && snapshot.effectiveDate < p.baselineDate)
    missing("Mutation predates the baseline.");
  const events = p.events
    .filter((e) => !snapshot || e.effectiveDate <= snapshot.effectiveDate)
    .sort(
      (a, b) =>
        a.effectiveDate.localeCompare(b.effectiveDate) ||
        a.sequence - b.sequence,
    );
  const seen = new Set<string>(),
    ordering = new Set<string>();
  for (const e of events) {
    const key = `${e.effectiveDate}:${e.sequence}`;
    if (
      seen.has(e.id) ||
      ordering.has(key) ||
      e.effectiveDate < p.baselineDate ||
      e.dependencies.some((d) => !seen.has(d))
    ) {
      incomplete = true;
      add(
        "EVENT_CHAIN_INCONSISTENT",
        "Repeated event, ambiguous order, or missing/late prerequisite. Replay stopped.",
        [e.id],
      );
      break;
    }
    if (!hasDoc(e.documentId)) {
      missing("Event source document is missing. Replay stopped.", [e.id]);
      break;
    }
    if (incomplete) break;
    const before = { ...expected },
      outgoing: State = {},
      incoming: State = {};
    let invalid = false;
    for (const a of e.allocations) {
      if (
        !p.parties[a.from] ||
        !p.parties[a.to] ||
        a.from === a.to ||
        fraction(a.share).compare(fraction("0")) <= 0
      ) {
        missing(
          "Event allocation has unknown parties, identical parties, or zero interest.",
          [e.id],
        );
        invalid = true;
        break;
      }
      outgoing[a.from] = fraction(outgoing[a.from] ?? "0")
        .add(fraction(a.share))
        .toString();
      incoming[a.to] = fraction(incoming[a.to] ?? "0")
        .add(fraction(a.share))
        .toString();
      if (
        a.statedArea &&
        fraction(a.statedArea).compare(
          fraction(a.share).mul(fraction(p.area)),
        ) !== 0
      ) {
        add(
          "AREA_SHARE_MISMATCH",
          "The stated area does not equal the fractional interest times parcel area.",
          [e.id],
          a.from,
        );
        invalid = true;
      }
    }
    for (const [party, share] of Object.entries(outgoing)) {
      if (!before[party] || before[party] === "0") {
        add(
          "TRANSFEROR_INTEREST_UNSUPPORTED",
          "The prior record does not support this transferor’s interest.",
          [e.id],
          party,
        );
        invalid = true;
      } else if (fraction(share).compare(fraction(before[party])) > 0) {
        add(
          "SHARE_OVER_TRANSFERRED",
          "The event transfers more than the sender’s recorded interest.",
          [e.id],
          party,
          { expected: before[party], actual: share, severity: "HIGH" },
        );
        invalid = true;
      }
    }
    if (invalid) {
      ambiguous = true;
      break;
    }
    const next = { ...before };
    for (const party of new Set([
      ...Object.keys(outgoing),
      ...Object.keys(incoming),
    ]))
      next[party] = fraction(before[party] ?? "0")
        .sub(fraction(outgoing[party] ?? "0"))
        .add(fraction(incoming[party] ?? "0"))
        .toString();
    if (sum(Object.values(next)) !== sum(Object.values(before))) {
      add("TOTAL_SHARE_NOT_CONSERVED", "Event failed exact conservation.", [
        e.id,
      ]);
      ambiguous = true;
      break;
    }
    expected = next;
    timeline.push({ event: e, before, after: { ...next } });
    seen.add(e.id);
    ordering.add(key);
  }
  const observed = state(snapshot?.holdings ?? []);
  if (!snapshot) {
    missing("No mutation snapshot was supplied for the recorded events.");
    if (events.length)
      add(
        "EXPECTED_MUTATION_MISSING",
        "No corresponding mutation is in the supplied dataset. No legal deadline is inferred.",
        events.map((e) => e.id),
      );
  } else {
    if (!hasDoc(snapshot.documentId))
      missing("Mutation source document is missing.");
    if (
      new Set(snapshot.holdings.map((h) => h.party)).size !==
      snapshot.holdings.length
    )
      missing("Duplicate owner rows make this snapshot ambiguous.");
    if (new Set(snapshot.eventIds).size !== snapshot.eventIds.length)
      add(
        "DUPLICATE_MUTATION",
        "A transaction is referenced more than once by this snapshot.",
        snapshot.eventIds,
      );
    if (snapshot.eventIds.some((id) => !events.some((e) => e.id === id)))
      missing("Mutation refers to an unknown or future event.");
    for (const e of events)
      if (!snapshot.eventIds.includes(e.id))
        add(
          "EXPECTED_MUTATION_MISSING",
          "The supplied mutation does not reference this documented event; no statutory delay is assumed.",
          [e.id],
        );
    if (!incomplete && !ambiguous) {
      if (
        sum(snapshot.holdings.map((h) => h.share)) !==
        sum(Object.values(expected))
      )
        add(
          "TOTAL_SHARE_NOT_CONSERVED",
          "Mutation total differs from the reconstructed total.",
          events.map((e) => e.id),
        );
      for (const party of new Set([
        ...Object.keys(expected),
        ...Object.keys(observed),
      ])) {
        const ex = expected[party] ?? "0",
          actual = observed[party] ?? "0",
          difference = fraction(actual).sub(fraction(ex)).toString();
        if (difference !== "0")
          add(
            ex === "0" ? "MUTATION_WRONG_PARTY" : "MUTATION_WRONG_SHARE",
            `${p.parties[party] ?? party}: expected ${ex}, mutation ${actual}; exact difference ${difference} of the parcel.`,
            events.map((e) => e.id),
            party,
            { expected: ex, actual, difference, severity: "HIGH" },
          );
      }
    }
  }
  const usedDocuments = new Set([
    p.baselineDocument,
    ...events.map((e) => e.documentId),
    ...(snapshot ? [snapshot.documentId] : []),
  ]);
  const unverified = p.documents.some(
    (d) => usedDocuments.has(d.id) && d.status === "UNVERIFIED",
  );
  return {
    status: incomplete
      ? "INSUFFICIENT_EVIDENCE"
      : ambiguous
        ? "REVIEW_REQUIRED"
        : findings.length
          ? "CONFLICT"
          : unverified
            ? "REVIEW_REQUIRED"
            : "MATCH",
    rulesVersion: "1.0.0",
    expected,
    observed,
    baseline: state(p.baseline),
    expectedTotal: sum(Object.values(expected)),
    observedTotal: sum(snapshot?.holdings.map((h) => h.share) ?? []),
    findings,
    evidenceStatus: incomplete
      ? "INCOMPLETE"
      : unverified
        ? "UNVERIFIED"
        : "COMPLETE_SUPPLIED",
    timeline,
    input: p,
    snapshotId: snapshot?.id ?? null,
  };
}
