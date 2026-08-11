import { describe, expect, it } from "vitest";
import { buildRecommendations } from "./action-engine";
import { computeActionValue } from "./action-value";
import { Account, HealthResult, PriorityResult } from "../data/types";

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "ACC-1",
    company: "Acme Corp",
    industry: "SaaS & Software",
    employees: 500,
    tier: "Enterprise",
    contractType: "Annual",
    region: "North America",
    ownerName: "Owner",
    startDate: "2023-01-01",
    renewalDate: "2026-08-30",
    mrr: 15000,
    arr: 180000,
    current: {
      asOf: "2026-08-11",
      licensedSeats: 100,
      activeUsers: 30,
      weeklyActiveUsers: 25,
      sessionsPerWeek: 60,
      usageTrendPct: -40,
      coreFeaturesTotal: 9,
      coreFeaturesAdopted: 2,
      adoptedFeatureNames: [],
      lastActiveDaysAgo: 10,
      openTickets: 3,
      severeOpenTickets: 2,
      ticketsOpenedRecently: 3,
      avgResolutionHours: 40,
      recentEscalation: true,
      nps: 5,
    },
    past: {
      asOf: "2026-07-12",
      licensedSeats: 100,
      activeUsers: 60,
      weeklyActiveUsers: 55,
      sessionsPerWeek: 140,
      usageTrendPct: 5,
      coreFeaturesTotal: 9,
      coreFeaturesAdopted: 4,
      adoptedFeatureNames: [],
      lastActiveDaysAgo: 1,
      openTickets: 0,
      severeOpenTickets: 0,
      ticketsOpenedRecently: 0,
      avgResolutionHours: null,
      recentEscalation: false,
      nps: 30,
    },
    billing: { paymentStatus: "Current", failedPaymentsLast90d: 0, overdueInvoiceCount: 0, overdueAmount: 0 },
    status: "active",
    ...overrides,
  };
}

const highRiskHealth: HealthResult = {
  score: 18,
  risk: "High",
  confidence: "High",
  confidenceReasons: [],
  drivers: [
    { key: "usageDecline", label: "Usage down 40%", deduction: 18 },
    { key: "supportBurden", label: "2 severe tickets", deduction: 20 },
    { key: "sentiment", label: "NPS fell", deduction: 12 },
  ],
};

const criticalPriority: PriorityResult = {
  priorityScore: 90,
  tier: "Critical",
  riskFactor: 0.82,
  revenueFactor: 0.9,
  urgencyFactor: 1,
  daysToRenewal: 19,
  arrExposed: 180000,
  mrrExposed: 15000,
};

describe("buildRecommendations", () => {
  it("produces deduplicated, evidence-backed recommendations from top drivers", () => {
    const recs = buildRecommendations(makeAccount(), highRiskHealth, criticalPriority);
    const actions = recs.map((r) => r.action);
    expect(new Set(actions).size).toBe(actions.length);
    expect(actions).toContain("Escalate unresolved critical tickets");
    expect(recs.every((r) => r.evidence.length > 0)).toBe(true);
  });

  it("adds an executive sponsor review for high-ARR, imminent, high-priority renewals", () => {
    const recs = buildRecommendations(makeAccount(), highRiskHealth, criticalPriority);
    expect(recs[0].action).toBe("Executive sponsor review");
  });

  it("falls back to standard cadence when there are no material drivers", () => {
    const healthyResult: HealthResult = { score: 92, risk: "Low", confidence: "High", confidenceReasons: [], drivers: [] };
    const lowPriority: PriorityResult = { priorityScore: 5, tier: "Low", riskFactor: 0.05, revenueFactor: 0.1, urgencyFactor: 0.1, daysToRenewal: 300, arrExposed: 3000, mrrExposed: 250 };
    const recs = buildRecommendations(makeAccount(), healthyResult, lowPriority);
    expect(recs).toHaveLength(1);
    expect(recs[0].action).toBe("Continue standard cadence");
  });
});

describe("computeActionValue", () => {
  it("computes exposure-to-cost ratio", () => {
    const value = computeActionValue("Executive sponsor review", 180000);
    expect(value.estimatedCost).toBe(4000);
    expect(value.exposureToCostRatio).toBe(45);
  });

  it("handles unknown actions with a sane default cost", () => {
    const value = computeActionValue("Some new action", 10000);
    expect(value.estimatedCost).toBeGreaterThan(0);
  });

  it("never reports negative exposure", () => {
    const value = computeActionValue("Billing intervention", -500);
    expect(value.potentialRevenueExposed).toBe(0);
  });
});
