import { Account, DriverContribution, HealthResult, PriorityResult } from "../data/types";
import { MEANINGFUL_DRIVER_THRESHOLD } from "../scoring/health-score";

export type Urgency = "Now" | "This week" | "This month" | "Monitor";

export interface Recommendation {
  action: string;
  objective: string;
  urgency: Urgency;
  rootCauseKey: string;
  evidence: string[];
}

interface Playbook {
  action: string;
  objective: string;
}

/**
 * Root cause -> recommended action. Multiple driver keys can map to the
 * same playbook entry (e.g. low adoption and low utilization both point to
 * an enablement session) so recommendations stay deduplicated.
 */
export const ACTION_PLAYBOOK: Record<string, Playbook> = {
  usageDecline: { action: "Customer Success outreach", objective: "Understand workflow changes and restore engagement" },
  inactivity: { action: "Customer Success outreach", objective: "Understand workflow changes and restore engagement" },
  seatUtilization: { action: "Schedule enablement session", objective: "Increase adoption of high-value core features" },
  featureAdoption: { action: "Schedule enablement session", objective: "Increase adoption of high-value core features" },
  supportBurden: { action: "Escalate unresolved critical tickets", objective: "Resolve blocking product issues before renewal" },
  sentiment: { action: "Executive relationship review", objective: "Rebuild trust and address satisfaction decline" },
  billing: { action: "Billing intervention", objective: "Resolve failed payment or procurement friction" },
};

function urgencyForTier(tier: PriorityResult["tier"]): Urgency {
  switch (tier) {
    case "Critical":
      return "Now";
    case "High":
      return "This week";
    case "Medium":
      return "This month";
    case "Low":
      return "Monitor";
  }
}

/**
 * Builds recommendations from the account's top health drivers, plus a
 * standing "executive sponsor review" when a high-revenue, high-priority
 * account has a renewal inside 45 days — regardless of root cause, because
 * the commercial stakes alone justify escalation.
 */
export function buildRecommendations(account: Account, health: HealthResult, priority: PriorityResult): Recommendation[] {
  const recs: Recommendation[] = [];
  const seenActions = new Set<string>();
  const urgency = urgencyForTier(priority.tier);

  const meaningfulDrivers = health.drivers.filter((d: DriverContribution) => d.deduction >= MEANINGFUL_DRIVER_THRESHOLD).slice(0, 3);
  for (const driver of meaningfulDrivers) {
    const playbook = ACTION_PLAYBOOK[driver.key];
    if (!playbook || seenActions.has(playbook.action)) continue;
    seenActions.add(playbook.action);
    recs.push({ action: playbook.action, objective: playbook.objective, urgency, rootCauseKey: driver.key, evidence: [driver.label] });
  }

  if ((priority.tier === "Critical" || priority.tier === "High") && priority.daysToRenewal >= 0 && priority.daysToRenewal <= 45 && priority.arrExposed >= 20_000) {
    if (!seenActions.has("Executive sponsor review")) {
      recs.unshift({
        action: "Executive sponsor review",
        objective: "Resolve account risk before commercial renewal",
        urgency: "Now",
        rootCauseKey: "renewal",
        evidence: [`$${Math.round(priority.arrExposed).toLocaleString()} ARR renews in ${priority.daysToRenewal} days`],
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      action: "Continue standard cadence",
      objective: "No material risk drivers detected; maintain regular check-ins",
      urgency: "Monitor",
      rootCauseKey: "none",
      evidence: ["Health score and engagement signals are within normal range"],
    });
  }

  return recs;
}
