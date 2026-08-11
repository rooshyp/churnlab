import { describe, expect, it } from "vitest";
import { analyzeDatasetQuality } from "./data-quality";
import { Account } from "../data/types";

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "ACC-1",
    company: "Acme",
    industry: "SaaS & Software",
    employees: 100,
    tier: "Growth",
    contractType: "Annual",
    region: "North America",
    ownerName: "Owner",
    startDate: "2024-01-01",
    renewalDate: "2027-01-01",
    mrr: 1000,
    arr: 12000,
    current: {
      asOf: "2026-08-11",
      licensedSeats: 50,
      activeUsers: 30,
      weeklyActiveUsers: 25,
      sessionsPerWeek: 80,
      usageTrendPct: 3,
      coreFeaturesTotal: 9,
      coreFeaturesAdopted: 5,
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
      activeUsers: 30,
      weeklyActiveUsers: 25,
      sessionsPerWeek: 80,
      usageTrendPct: 3,
      coreFeaturesTotal: 9,
      coreFeaturesAdopted: 5,
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
    ...overrides,
  };
}

describe("analyzeDatasetQuality", () => {
  it("reports no critical issues for a clean account", () => {
    const report = analyzeDatasetQuality([makeAccount()]);
    expect(report.criticalCount).toBe(0);
  });

  it("flags negative ARR as Critical", () => {
    const report = analyzeDatasetQuality([makeAccount({ arr: -1000 })]);
    expect(report.issues.some((i) => i.severity === "Critical" && i.field === "arr")).toBe(true);
  });

  it("flags a future start date as Critical", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const report = analyzeDatasetQuality([makeAccount({ startDate: future.toISOString().slice(0, 10) })]);
    expect(report.issues.some((i) => i.field === "startDate")).toBe(true);
  });

  it("flags active users exceeding licensed seats", () => {
    const acc = makeAccount();
    acc.current = { ...acc.current, activeUsers: 999 };
    const report = analyzeDatasetQuality([acc]);
    expect(report.issues.some((i) => i.field === "activeUsers")).toBe(true);
  });

  it("flags duplicate account IDs", () => {
    const report = analyzeDatasetQuality([makeAccount({ id: "DUP" }), makeAccount({ id: "DUP", company: "Other Co" })]);
    expect(report.issues.some((i) => i.message.includes("Duplicate"))).toBe(true);
    expect(report.criticalCount).toBeGreaterThan(0);
  });

  it("flags missing NPS as Informational only", () => {
    const acc = makeAccount();
    acc.current = { ...acc.current, nps: null };
    const report = analyzeDatasetQuality([acc]);
    const npsIssue = report.issues.find((i) => i.field === "nps");
    expect(npsIssue?.severity).toBe("Informational");
  });

  it("counts distinct accounts with at least one issue", () => {
    const report = analyzeDatasetQuality([makeAccount({ id: "A", arr: -1 }), makeAccount({ id: "B" })]);
    expect(report.accountsWithIssues).toBe(1);
  });
});
