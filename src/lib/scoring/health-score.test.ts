import { describe, expect, it } from "vitest";
import { computeHealth, HealthInput } from "./health-score";
import { MetricsSnapshot } from "../data/types";

function snapshot(overrides: Partial<MetricsSnapshot> = {}): MetricsSnapshot {
  return {
    asOf: "2026-08-11",
    licensedSeats: 50,
    activeUsers: 45,
    weeklyActiveUsers: 40,
    sessionsPerWeek: 120,
    usageTrendPct: 8,
    coreFeaturesTotal: 9,
    coreFeaturesAdopted: 7,
    adoptedFeatureNames: [],
    lastActiveDaysAgo: 0,
    openTickets: 0,
    severeOpenTickets: 0,
    ticketsOpenedRecently: 0,
    avgResolutionHours: null,
    recentEscalation: false,
    nps: 45,
    ...overrides,
  };
}

function input(overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    snapshot: snapshot(),
    pastNps: 45,
    paymentStatus: "Current",
    overdueInvoiceCount: 0,
    ...overrides,
  };
}

describe("computeHealth", () => {
  it("scores a healthy account near the top of the range with Low risk", () => {
    const result = computeHealth(input());
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.risk).toBe("Low");
  });

  it("scores a severely degraded account as High risk near the bottom", () => {
    const result = computeHealth(
      input({
        snapshot: snapshot({
          usageTrendPct: -55,
          lastActiveDaysAgo: 20,
          activeUsers: 10,
          licensedSeats: 50,
          coreFeaturesAdopted: 1,
          openTickets: 5,
          severeOpenTickets: 3,
          recentEscalation: true,
          nps: -20,
        }),
        pastNps: 30,
        paymentStatus: "Failed",
        overdueInvoiceCount: 2,
      })
    );
    expect(result.score).toBeLessThan(20);
    expect(result.risk).toBe("High");
    expect(result.drivers.length).toBeGreaterThan(0);
    expect(result.drivers[0].deduction).toBeGreaterThanOrEqual(result.drivers[result.drivers.length - 1].deduction);
  });

  it("never exceeds the 0-100 bounds even under maximal deductions", () => {
    const result = computeHealth(
      input({
        snapshot: snapshot({
          usageTrendPct: -100,
          lastActiveDaysAgo: 90,
          activeUsers: 0,
          coreFeaturesAdopted: 0,
          openTickets: 20,
          severeOpenTickets: 10,
          recentEscalation: true,
          nps: -100,
        }),
        pastNps: 90,
        paymentStatus: "Failed",
        overdueInvoiceCount: 5,
      })
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("lowers confidence when NPS is missing", () => {
    const result = computeHealth(input({ snapshot: snapshot({ nps: null }) }));
    expect(result.confidence).not.toBe("High");
    expect(result.confidenceReasons.some((r) => r.toLowerCase().includes("nps"))).toBe(true);
  });

  it("is deterministic for identical input", () => {
    const a = computeHealth(input());
    const b = computeHealth(input());
    expect(a).toEqual(b);
  });
});
