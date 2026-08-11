import { describe, expect, it } from "vitest";
import {
  reduceChurnAmongHighValue,
  retainTopNAtRisk,
  revenueAtRisk,
  SimAccountView,
  usageRecoveryImpact,
} from "./scenario";

const views: SimAccountView[] = [
  { id: "A", company: "A", arr: 200000, healthScore: 20, risk: "High" },
  { id: "B", company: "B", arr: 100000, healthScore: 25, risk: "High" },
  { id: "C", company: "C", arr: 50000, healthScore: 55, risk: "Medium" },
  { id: "D", company: "D", arr: 400000, healthScore: 90, risk: "Low" },
  { id: "E", company: "E", arr: 8000, healthScore: 15, risk: "High" },
];

describe("revenueAtRisk", () => {
  it("weights High risk ARR in full and Medium risk ARR partially", () => {
    expect(revenueAtRisk(views)).toBe(200000 + 100000 + 50000 * 0.4 + 8000);
  });
});

describe("reduceChurnAmongHighValue", () => {
  it("applies the reduction percentage to the qualifying ARR pool", () => {
    const result = reduceChurnAmongHighValue(views, 50000, 10);
    expect(result.accountsInPool).toBe(2); // A and B
    expect(result.poolArr).toBe(300000);
    expect(result.arrRetained).toBe(30000);
  });
});

describe("retainTopNAtRisk", () => {
  it("picks the top N at-risk accounts by ARR", () => {
    const result = retainTopNAtRisk(views, 2);
    expect(result.accounts.map((a) => a.id)).toEqual(["A", "B"]);
    expect(result.arrRetained).toBe(300000);
  });

  it("handles n larger than the candidate pool", () => {
    const result = retainTopNAtRisk(views, 50);
    expect(result.accounts.length).toBe(4); // all non-Low accounts
  });
});

describe("usageRecoveryImpact", () => {
  it("reduces revenue at risk when accounts move from High to Medium risk", () => {
    const result = usageRecoveryImpact(views, 2, 20);
    expect(result.before).toBe(200000 + 100000 + 50000 * 0.4 + 8000);
    expect(result.after).toBeLessThan(result.before);
    expect(result.accountsAffected).toBe(2);
  });

  it("is a no-op when k is 0", () => {
    const result = usageRecoveryImpact(views, 0);
    expect(result.arrReduction).toBe(0);
  });
});
