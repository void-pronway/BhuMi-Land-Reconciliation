import type { Parcel } from "./types";
export function featured(): Parcel {
  return {
    id: "DEMO-P4-001",
    title: "The hidden co-owner discrepancy",
    district: "Fictional district",
    upazila: "Demo upazila",
    mouza: "Sample mouza",
    khatian: "SYN-K-001",
    dag: "SYN-D-001",
    survey: "Synthetic RS",
    area: "120",
    baselineDate: "2026-01-01",
    baselineDocument: "BASE-001",
    identityConfirmed: true,
    parties: {
      A: "Owner A",
      B: "Owner B",
      C: "Owner C",
      D: "Buyer D",
      E: "Buyer E",
    },
    baseline: [
      { party: "A", share: "1/2" },
      { party: "B", share: "1/3" },
      { party: "C", share: "1/6" },
    ],
    documents: [
      {
        id: "BASE-001",
        reference: "SYN-KHATIAN-001",
        type: "Baseline record",
        date: "2026-01-01",
        status: "SUPPLIED",
        notes: "Fictional co-owner record; not proof of legal title.",
      },
      {
        id: "DEED-001",
        reference: "SYN-DEED-001",
        type: "Registered sale simulation",
        date: "2026-02-01",
        status: "SUPPLIED",
        notes: "Owner A transfers 1/4 undivided interest to Buyer D.",
      },
      {
        id: "MUT-001",
        reference: "SYN-MUTATION-001",
        type: "Mutation snapshot",
        date: "2026-03-01",
        status: "SUPPLIED",
        notes: "Intentionally planted share allocation discrepancy.",
      },
    ],
    events: [
      {
        id: "SALE-001",
        type: "SALE",
        effectiveDate: "2026-02-01",
        recordedAt: "2026-02-02",
        sequence: 1,
        documentId: "DEED-001",
        dependencies: [],
        allocations: [{ from: "A", to: "D", share: "1/4", statedArea: "30" }],
        notes: "Partial sale; Owner B and Owner C do not participate.",
      },
    ],
    snapshots: [
      {
        id: "SNAP-001",
        reference: "SYN-MUTATION-001",
        effectiveDate: "2026-03-01",
        documentId: "MUT-001",
        eventIds: ["SALE-001"],
        holdings: [
          { party: "A", share: "1/4" },
          { party: "B", share: "5/24" },
          { party: "C", share: "1/6" },
          { party: "D", share: "3/8" },
        ],
      },
    ],
  };
}
export function scenarios(): Parcel[] {
  const hidden = featured();
  const clean = featured();
  clean.id = "DEMO-P4-002";
  clean.title = "Clean partial sale";
  clean.snapshots[0].holdings = [
    { party: "A", share: "1/4" },
    { party: "B", share: "1/3" },
    { party: "C", share: "1/6" },
    { party: "D", share: "1/4" },
  ];
  const missing = structuredClone(clean);
  missing.id = "DEMO-P4-003";
  missing.title = "Registered sale, missing mutation";
  missing.snapshots = [];
  const excessive = structuredClone(clean);
  excessive.id = "DEMO-P4-004";
  excessive.title = "Transfer beyond recorded interest";
  excessive.events[0].allocations = [{ from: "C", to: "D", share: "1/4" }];
  const wrong = structuredClone(clean);
  wrong.id = "DEMO-P4-005";
  wrong.title = "Incorrect mutation recipient";
  wrong.snapshots[0].holdings[3].party = "E";
  const duplicate = structuredClone(clean);
  duplicate.id = "DEMO-P4-006";
  duplicate.title = "Transaction referenced twice";
  duplicate.snapshots[0].eventIds.push("SALE-001");
  const inheritance = structuredClone(clean);
  inheritance.id = "DEMO-P4-007";
  inheritance.title = "Missing succession evidence";
  inheritance.events[0].dependencies = ["SUCCESSION-MISSING"];
  const order = structuredClone(clean);
  order.id = "DEMO-P4-008";
  order.title = "Out-of-order dependency";
  order.events[0].dependencies = ["LATER-GIFT"];
  order.events.push({
    ...structuredClone(order.events[0]),
    id: "LATER-GIFT",
    effectiveDate: "2026-02-20",
    dependencies: [],
    sequence: 2,
  });
  const exact = structuredClone(clean);
  exact.id = "DEMO-P4-009";
  exact.title = "Exact thirds, sixths and twelfths";
  exact.events[0].allocations = [
    { from: "A", to: "D", share: "1/12" },
    { from: "B", to: "D", share: "1/6" },
  ];
  exact.snapshots[0].holdings = [
    { party: "A", share: "5/12" },
    { party: "B", share: "1/6" },
    { party: "C", share: "1/6" },
    { party: "D", share: "1/4" },
  ];
  const correction = structuredClone(clean);
  correction.id = "DEMO-P4-010";
  correction.title = "Documented correction retained in history";
  correction.events.push({
    ...structuredClone(clean.events[0]),
    id: "CORRECTION-001",
    type: "CORRECTION",
    effectiveDate: "2026-02-15",
    sequence: 2,
    dependencies: ["SALE-001"],
    allocations: [{ from: "D", to: "A", share: "1/12" }],
    notes:
      "Explicitly supported reallocation in synthetic correction document.",
    documentId: "CORR-DOC",
  });
  correction.documents.push({
    ...clean.documents[1],
    id: "CORR-DOC",
    reference: "SYN-CORRECTION",
    type: "Correction",
    notes: "Supported return of 1/12 to Owner A.",
  });
  correction.snapshots[0].eventIds.push("CORRECTION-001");
  correction.snapshots[0].holdings[0].share = "1/3";
  correction.snapshots[0].holdings[3].share = "1/6";
  const concept = featured();
  concept.id = "DEMO-P4-011";
  concept.title = "Concept note: hidden 10-decimal shift";
  concept.area = "100";
  concept.parties = {
    A: "Fictional Rahim",
    B: "Fictional Karim",
    D: "Fictional Nabila",
  };
  concept.baseline = [
    { party: "A", share: "3/5" },
    { party: "B", share: "2/5" },
  ];
  concept.events[0].allocations = [
    { from: "A", to: "D", share: "1/4", statedArea: "25" },
  ];
  concept.snapshots[0].holdings = [
    { party: "A", share: "7/20" },
    { party: "B", share: "3/10" },
    { party: "D", share: "7/20" },
  ];
  return [
    hidden,
    clean,
    missing,
    excessive,
    wrong,
    duplicate,
    inheritance,
    order,
    exact,
    correction,
    concept,
  ];
}
