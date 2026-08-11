import { Account } from "../data/types";
import { DataQualityIssue } from "./types";

export interface QualityReport {
  issues: DataQualityIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  accountsWithIssues: number;
}

/**
 * Scans the live portfolio for the same class of problems the ingestion
 * validator catches on upload — messy data doesn't only arrive via CSV; it
 * can also drift in over time (a renewal date that slips into the past
 * without being updated, a support ticket system that stops reporting
 * resolution time, and so on).
 */
export function analyzeDatasetQuality(accounts: Account[]): QualityReport {
  const issues: DataQualityIssue[] = [];
  const seenIds = new Map<string, string>(); // id -> first company seen
  let seq = 0;
  const nextId = () => `dq-${++seq}`;
  const today = new Date();

  for (const account of accounts) {
    if (account.arr < 0) {
      issues.push({
        id: nextId(),
        severity: "Critical",
        message: `${account.company} (${account.id}) has negative ARR ($${account.arr.toLocaleString()})`,
        affects: ["revenue exposure", "prioritization"],
        accountId: account.id,
        field: "arr",
      });
    } else if (account.arr === 0) {
      issues.push({
        id: nextId(),
        severity: "Warning",
        message: `${account.company} (${account.id}) has $0 ARR recorded`,
        affects: ["revenue exposure", "prioritization"],
        accountId: account.id,
        field: "arr",
      });
    }

    if (new Date(account.startDate) > today) {
      issues.push({
        id: nextId(),
        severity: "Critical",
        message: `${account.company} (${account.id}) has an account start date in the future (${account.startDate})`,
        affects: ["confidence"],
        accountId: account.id,
        field: "startDate",
      });
    }

    if (new Date(account.renewalDate) < new Date(account.startDate)) {
      issues.push({
        id: nextId(),
        severity: "Critical",
        message: `${account.company} (${account.id}) has a renewal date earlier than its start date`,
        affects: ["prioritization"],
        accountId: account.id,
        field: "renewalDate",
      });
    } else if (new Date(account.renewalDate) < today && account.status === "active") {
      issues.push({
        id: nextId(),
        severity: "Warning",
        message: `${account.company} (${account.id}) has a renewal date in the past — contract data likely needs an update`,
        affects: ["prioritization"],
        accountId: account.id,
        field: "renewalDate",
      });
    }

    if (account.current.activeUsers > account.current.licensedSeats) {
      issues.push({
        id: nextId(),
        severity: "Warning",
        message: `${account.company} (${account.id}) reports more active users (${account.current.activeUsers}) than licensed seats (${account.current.licensedSeats})`,
        affects: ["churn scoring", "confidence"],
        accountId: account.id,
        field: "activeUsers",
      });
    }

    if (seenIds.has(account.id)) {
      issues.push({
        id: nextId(),
        severity: "Critical",
        message: `Duplicate account identifier "${account.id}" shared by ${seenIds.get(account.id)} and ${account.company}`,
        affects: ["prioritization", "confidence"],
        accountId: account.id,
        field: "id",
      });
    } else {
      seenIds.set(account.id, account.company);
    }

    if (account.current.nps === null) {
      issues.push({
        id: nextId(),
        severity: "Informational",
        message: `${account.company} (${account.id}) has no NPS on file — sentiment signal is unavailable`,
        affects: ["confidence"],
        accountId: account.id,
        field: "nps",
      });
    }

    if (account.current.avgResolutionHours === null && (account.current.openTickets > 0 || account.current.ticketsOpenedRecently > 0)) {
      issues.push({
        id: nextId(),
        severity: "Informational",
        message: `${account.company} (${account.id}) has open tickets but no resolution-time data`,
        affects: ["confidence"],
        accountId: account.id,
        field: "avgResolutionHours",
      });
    }

    if (account.current.licensedSeats === 0) {
      issues.push({
        id: nextId(),
        severity: "Warning",
        message: `${account.company} (${account.id}) has 0 licensed seats recorded — utilization cannot be computed`,
        affects: ["churn scoring", "confidence"],
        accountId: account.id,
        field: "licensedSeats",
      });
    }
  }

  const accountsWithIssues = new Set(issues.map((i) => i.accountId)).size;

  return {
    issues,
    criticalCount: issues.filter((i) => i.severity === "Critical").length,
    warningCount: issues.filter((i) => i.severity === "Warning").length,
    infoCount: issues.filter((i) => i.severity === "Informational").length,
    accountsWithIssues,
  };
}
