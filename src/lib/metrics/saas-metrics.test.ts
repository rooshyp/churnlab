import { describe, expect, it } from "vitest";
import {
  churnedWithinDays,
  daysUntil,
  grossRevenueRetention,
  logoChurnRate,
  netRevenueRetention,
  revenueChurnRate,
  totalArr,
  totalMrr,
  upcomingRenewalArr,
  upcomingRenewals,
} from "./saas-metrics";
import { Account } from "../data/types";

function makeAccount(overrides: Partial<Account> = {}): Account {
  const base: Account = {
    id: "ACC-TEST",
    company: "Test Co",
    industry: "SaaS & Software",
    employees: 100,
    tier: "Growth",
    contractType: "Annual",
    region: "North America",
    ownerName: "Test Owner",
    startDate: "2024-01-01",
    renewalDate: "2026-12-01",
    mrr: 1000,
    arr: 12000,
    current: {
      asOf: "2026-08-11",
      licensedSeats: 50,
      activeUsers: 40,
      weeklyActiveUsers: 35,
      sessionsPerWeek: 100,
      usageTrendPct: 5,
      coreFeaturesTotal: 9,
      coreFeaturesAdopted: 6,
      adoptedFeatureNames: [],
      lastActiveDaysAgo: 1,
      openTickets: 1,
      severeOpenTickets: 0,
      ticketsOpenedRecently: 1,
      avgResolutionHours: 12,
      recentEscalation: false,
      nps: 40,
    },
    past: {
      asOf: "2026-07-12",
      licensedSeats: 50,
      activeUsers: 38,
      weeklyActiveUsers: 33,
      sessionsPerWeek: 95,
      usageTrendPct: 8,
      coreFeaturesTotal: 9,
      coreFeaturesAdopted: 5,
      adoptedFeatureNames: [],
      lastActiveDaysAgo: 1,
      openTickets: 1,
      severeOpenTickets: 0,
      ticketsOpenedRecently: 0,
      avgResolutionHours: 10,
      recentEscalation: false,
      nps: 42,
    },
    billing: { paymentStatus: "Current", failedPaymentsLast90d: 0, overdueInvoiceCount: 0, overdueAmount: 0 },
    status: "active",
  };
  return { ...base, ...overrides };
}

describe("totalMrr / totalArr", () => {
  it("sums correctly", () => {
    const accounts = [makeAccount({ mrr: 1000, arr: 12000 }), makeAccount({ mrr: 2000, arr: 24000 })];
    expect(totalMrr(accounts)).toBe(3000);
    expect(totalArr(accounts)).toBe(36000);
  });
});

describe("logoChurnRate / revenueChurnRate", () => {
  it("computes churn as a fraction of the starting cohort", () => {
    const active = [makeAccount(), makeAccount(), makeAccount()];
    const churned = [makeAccount({ arr: 12000, status: "churned" })];
    expect(logoChurnRate({ active, churnedInWindow: churned })).toBeCloseTo(1 / 4);
    expect(revenueChurnRate({ active, churnedInWindow: churned })).toBeCloseTo(12000 / (36000 + 12000));
  });

  it("returns 0 when there is no starting cohort", () => {
    expect(logoChurnRate({ active: [], churnedInWindow: [] })).toBe(0);
    expect(revenueChurnRate({ active: [], churnedInWindow: [] })).toBe(0);
  });
});

describe("grossRevenueRetention / netRevenueRetention", () => {
  it("GRR is 1 minus revenue churn rate", () => {
    const active = [makeAccount({ arr: 90000 })];
    const churned = [makeAccount({ arr: 10000, status: "churned" })];
    expect(grossRevenueRetention({ active, churnedInWindow: churned })).toBeCloseTo(0.9);
  });

  it("NRR adds expansion ARR over the starting base", () => {
    const active = [makeAccount({ arr: 90000 })];
    const churned = [makeAccount({ arr: 10000, status: "churned" })];
    const nrr = netRevenueRetention({ active, churnedInWindow: churned }, 5000);
    expect(nrr).toBeCloseTo(0.9 + 5000 / 100000);
  });
});

describe("daysUntil / upcomingRenewals", () => {
  it("computes day distance and filters within a window", () => {
    const from = new Date("2026-08-11T00:00:00");
    expect(daysUntil("2026-08-21", from)).toBe(10);
    const accounts = [
      makeAccount({ id: "A", renewalDate: "2026-08-21", arr: 10000 }),
      makeAccount({ id: "B", renewalDate: "2026-12-01", arr: 20000 }),
    ];
    const upcoming = upcomingRenewals(accounts, 30);
    expect(upcoming.map((a) => a.id)).not.toContain("B");
    expect(upcomingRenewalArr(accounts, 400)).toBe(30000);
  });
});

describe("churnedWithinDays", () => {
  it("filters churned accounts by trailing window", () => {
    const from = new Date("2026-08-11T00:00:00");
    const churned = [
      makeAccount({ id: "A", status: "churned", churnDate: "2026-07-20" }),
      makeAccount({ id: "B", status: "churned", churnDate: "2025-01-01" }),
    ];
    const recent = churnedWithinDays(churned, 90, from);
    expect(recent.map((a) => a.id)).toEqual(["A"]);
  });
});
