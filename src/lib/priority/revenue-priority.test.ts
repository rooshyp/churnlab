import { describe, expect, it } from "vitest";
import {
  computePortfolioPriority,
  revenueFactor,
  riskFactor,
  urgencyFactor,
} from "./revenue-priority";
import { Account, HealthResult } from "../data/types";

function makeAccount(id: string, arr: number, renewalDate: string): Account {
  return {
    id,
    company: id,
    industry: "SaaS & Software",
    employees: 100,
    tier: "Growth",
    contractType: "Annual",
    region: "North America",
    ownerName: "Owner",
    startDate: "2024-01-01",
    renewalDate,
    mrr: arr / 12,
    arr,
    current: {
      asOf: "2026-08-11",
      licensedSeats: 50,
      activeUsers: 40,
      weeklyActiveUsers: 35,
      sessionsPerWeek: 100,
      usageTrendPct: 0,
      coreFeaturesTotal: 9,
      coreFeaturesAdopted: 6,
      adoptedFeatureNames: [],
      lastActiveDaysAgo: 1,
      openTickets: 0,
      severeOpenTickets: 0,
      ticketsOpenedRecently: 0,
      avgResolutionHours: null,
      recentEscalation: false,
      nps: 40,
    },
    past: {
      asOf: "2026-07-12",
      licensedSeats: 50,
      activeUsers: 40,
      weeklyActiveUsers: 35,
      sessionsPerWeek: 100,
      usageTrendPct: 0,
      coreFeaturesTotal: 9,
      coreFeaturesAdopted: 6,
      adoptedFeatureNames: [],
      lastActiveDaysAgo: 1,
      openTickets: 0,
      severeOpenTickets: 0,
      ticketsOpenedRecently: 0,
      avgResolutionHours: null,
      recentEscalation: false,
      nps: 40,
    },
    billing: { paymentStatus: "Current", failedPaymentsLast90d: 0, overdueInvoiceCount: 0, overdueAmount: 0 },
    status: "active",
  };
}

function health(score: number): HealthResult {
  return { score, risk: score < 40 ? "High" : score < 70 ? "Medium" : "Low", confidence: "High", confidenceReasons: [], drivers: [] };
}

describe("factor functions", () => {
  it("riskFactor is inverse of health score", () => {
    expect(riskFactor(health(80))).toBeCloseTo(0.2);
    expect(riskFactor(health(0))).toBeCloseTo(1);
  });

  it("revenueFactor increases with ARR but caps at 1", () => {
    expect(revenueFactor(0)).toBe(0);
    expect(revenueFactor(250_000)).toBeCloseTo(1, 2);
    expect(revenueFactor(2_000_000)).toBeLessThanOrEqual(1);
    expect(revenueFactor(10_000)).toBeGreaterThan(0);
    expect(revenueFactor(10_000)).toBeLessThan(revenueFactor(100_000));
  });

  it("urgencyFactor decreases with days to renewal", () => {
    expect(urgencyFactor(10)).toBe(1);
    expect(urgencyFactor(45)).toBe(0.75);
    expect(urgencyFactor(400)).toBe(0.1);
  });
});

describe("computePortfolioPriority", () => {
  it("ranks a high-risk, high-ARR, imminent-renewal account above a healthy low-ARR one", () => {
    const risky = makeAccount("RISKY", 175_000, "2026-09-04"); // ~24 days out
    const healthy = makeAccount("SAFE", 3_000, "2027-06-01");
    const healths = new Map([
      ["RISKY", health(20)],
      ["SAFE", health(90)],
    ]);
    const results = computePortfolioPriority([risky, healthy], healths);
    expect(results.get("RISKY")!.priorityScore).toBeGreaterThan(results.get("SAFE")!.priorityScore);
    expect(results.get("RISKY")!.tier).toBe("Critical");
    expect(results.get("SAFE")!.tier).toBe("Low");
  });

  it("exposes arrExposed and mrrExposed as non-negative", () => {
    const acc = makeAccount("A", -5000, "2026-12-01"); // dirty data: negative ARR
    const results = computePortfolioPriority([acc], new Map([["A", health(50)]]));
    expect(results.get("A")!.arrExposed).toBeGreaterThanOrEqual(0);
    expect(results.get("A")!.mrrExposed).toBeGreaterThanOrEqual(0);
  });
});
