import { describe, it, expect } from "vitest";
import { fraction, area, sum } from "../src/lib/domain/reconciliation/fraction";
import { reconcileMutation } from "../src/lib/domain/reconciliation/engine";
import {
  featured,
  scenarios,
} from "../src/lib/domain/reconciliation/scenarios";
describe("exact arithmetic", () => {
  it("normalizes and rejects invalid numbers", () => {
    expect(fraction("2/6").toString()).toBe("1/3");
    expect(() => fraction("1/0")).toThrow();
    expect(() => fraction("0.5")).toThrow();
    expect(fraction("-1/3").add(fraction("1/3")).toString()).toBe("0");
  });
  it("conserves interest over 1000 rational transfers", () => {
    for (let d = 2; d < 1002; d++) {
      const part = fraction(`1/${d}`);
      expect(fraction("1").sub(part).add(part).toString()).toBe("1");
    }
    expect(sum(["1/2", "1/3", "1/6"])).toBe("1");
  });
});
describe("synthetic reconciliation", () => {
  const cases = scenarios();
  const outcomes = [
    "CONFLICT",
    "MATCH",
    "INSUFFICIENT_EVIDENCE",
    "REVIEW_REQUIRED",
    "CONFLICT",
    "CONFLICT",
    "INSUFFICIENT_EVIDENCE",
    "INSUFFICIENT_EVIDENCE",
    "MATCH",
    "MATCH",
    "CONFLICT",
  ];
  cases.forEach((p, i) =>
    it(`${p.id}: ${p.title}`, () =>
      expect(reconcileMutation(p).status).toBe(outcomes[i])),
  );
  it("detects the hidden 15-decimal error despite balanced totals", () => {
    const r = reconcileMutation(featured());
    expect(r.expectedTotal).toBe("1");
    expect(r.observedTotal).toBe("1");
    expect(
      r.findings.map((f) => [f.party, area(f.difference!, "120")]),
    ).toEqual([
      ["B", "-15"],
      ["D", "15"],
    ]);
  });
  it("corrected snapshot produces a new match without changing historical input", () => {
    const p = featured(),
      old = JSON.stringify(p);
    const r = reconcileMutation(p);
    p.snapshots.push({
      ...p.snapshots[0],
      id: "CORRECTED",
      holdings: Object.entries(r.expected).map(([party, share]) => ({
        party,
        share,
      })),
    });
    expect(reconcileMutation(p).status).toBe("MATCH");
    expect(reconcileMutation(JSON.parse(old)).status).toBe("CONFLICT");
  });
  it("never double counts a repeated event", () => {
    const p = featured();
    p.events.push({ ...p.events[0] });
    const r = reconcileMutation(p);
    expect(r.status).toBe("INSUFFICIENT_EVIDENCE");
    expect(r.timeline).toHaveLength(1);
  });
  it("rejects aggregate overspending in a single event", () => {
    const p = featured();
    p.events[0].allocations = [
      { from: "A", to: "D", share: "1/3" },
      { from: "A", to: "E", share: "1/3" },
    ];
    expect(
      reconcileMutation(p).findings.some(
        (f) => f.code === "SHARE_OVER_TRANSFERRED",
      ),
    ).toBe(true);
  });
  it("detects unsupported sender and stated area mismatch", () => {
    const p = featured();
    p.events[0].allocations[0].from = "E";
    p.events[0].allocations[0].statedArea = "31";
    expect(reconcileMutation(p).findings.map((f) => f.code)).toEqual(
      expect.arrayContaining([
        "TRANSFEROR_INTEREST_UNSUPPORTED",
        "AREA_SHARE_MISMATCH",
      ]),
    );
  });
  it("requires baseline provenance, identity and exact totals", () => {
    const p = featured();
    p.identityConfirmed = false;
    p.baselineDocument = "absent";
    p.baseline[0].share = "1/3";
    const r = reconcileMutation(p);
    expect(r.status).toBe("INSUFFICIENT_EVIDENCE");
    expect(r.findings.some((f) => f.code === "TOTAL_SHARE_NOT_CONSERVED")).toBe(
      true,
    );
  });
  it("handles explicit succession and partition allocations", () => {
    for (const type of [
      "SUCCESSION_ALLOCATION",
      "PARTITION",
      "GIFT",
    ] as const) {
      const p = scenarios()[1];
      p.events[0].type = type;
      expect(reconcileMutation(p).status).toBe("MATCH");
    }
  });
  it("does not label unverified sources as matched", () => {
    const p = scenarios()[1];
    p.documents[0].status = "UNVERIFIED";
    expect(reconcileMutation(p).status).toBe("REVIEW_REQUIRED");
  });
  it("replays deterministically independent of input order", () => {
    const p = scenarios()[9];
    const first = reconcileMutation(p);
    p.events.reverse();
    expect(reconcileMutation(p).expected).toEqual(first.expected);
  });
});

describe("rule catalogue and replay boundaries", () => {
  it("emits the intended rule for each planted scenario", () => {
    const expected: Record<number, string> = {
      0: "MUTATION_WRONG_SHARE",
      2: "EXPECTED_MUTATION_MISSING",
      3: "SHARE_OVER_TRANSFERRED",
      4: "MUTATION_WRONG_PARTY",
      5: "DUPLICATE_MUTATION",
      6: "EVENT_CHAIN_INCONSISTENT",
      7: "EVENT_CHAIN_INCONSISTENT",
      10: "MUTATION_WRONG_SHARE",
    };
    for (const [index, code] of Object.entries(expected))
      expect(
        reconcileMutation(scenarios()[Number(index)]).findings.map(
          (f) => f.code,
        ),
      ).toContain(code);
  });
  it("rejects negative holdings and zero denominators at the input boundary", () => {
    for (const share of ["-1/3", "1/0"]) {
      const p = featured();
      p.baseline[0].share = share;
      expect(() => reconcileMutation(p)).toThrow();
    }
  });
  it("reports mutation total mismatch and ambiguous duplicate rows", () => {
    const p = scenarios()[1];
    p.snapshots[0].holdings[0].share = "1/3";
    expect(reconcileMutation(p).findings.map((f) => f.code)).toContain(
      "TOTAL_SHARE_NOT_CONSERVED",
    );
    p.snapshots[0].holdings.push({ ...p.snapshots[0].holdings[0] });
    expect(reconcileMutation(p).status).toBe("INSUFFICIENT_EVIDENCE");
  });
  it("stops a sale larger than an explicitly inherited interest", () => {
    const p = scenarios()[1];
    p.events[0].type = "SUCCESSION_ALLOCATION";
    p.events[0].allocations = [{ from: "A", to: "D", share: "1/5" }];
    p.events.push({
      ...p.events[0],
      id: "SALE-AFTER-SUCCESSION",
      type: "SALE",
      sequence: 2,
      dependencies: ["SALE-001"],
      allocations: [{ from: "D", to: "E", share: "1/4" }],
    });
    const result = reconcileMutation(p);
    expect(result.timeline).toHaveLength(1);
    expect(result.findings.map((f) => f.code)).toContain(
      "SHARE_OVER_TRANSFERRED",
    );
  });
  it("does not apply future events to an earlier snapshot", () => {
    const p = scenarios()[1];
    p.events.push({
      ...p.events[0],
      id: "FUTURE",
      effectiveDate: "2027-01-01",
    });
    expect(reconcileMutation(p).status).toBe("MATCH");
    expect(reconcileMutation(p).timeline).toHaveLength(1);
  });
});
