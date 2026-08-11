import { Confidence, DriverContribution, HealthResult, MetricsSnapshot, RiskLevel } from "../data/types";

/**
 * Configurable deduction weights. Each represents the maximum number of
 * points a signal can subtract from a 100-point baseline. They sum to 100
 * so a maximally unhealthy account bottoms out at 0. See docs/SCORING.md
 * for rationale and calibration notes.
 */
export const HEALTH_WEIGHTS = {
  usageDecline: 18,
  inactivity: 7,
  seatUtilization: 15,
  featureAdoption: 15,
  supportBurden: 20,
  sentiment: 15,
  billing: 10,
} as const;

export const RISK_THRESHOLDS = { high: 40, medium: 70 } as const;

/**
 * Minimum deduction for a driver to be treated as "material" by the
 * investigator narrative and the action engine. Below this, a signal is
 * present but too small to name as a cause of risk. Shared so the two
 * never disagree about what counts as a real driver.
 */
export const MEANINGFUL_DRIVER_THRESHOLD = 4;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function usageDeclineDeduction(snapshot: MetricsSnapshot): number {
  const declinePct = Math.max(0, -snapshot.usageTrendPct); // e.g. 41 for a 41% drop
  return clamp01(declinePct / 60) * HEALTH_WEIGHTS.usageDecline;
}

function inactivityDeduction(snapshot: MetricsSnapshot): number {
  return clamp01((snapshot.lastActiveDaysAgo - 3) / 21) * HEALTH_WEIGHTS.inactivity;
}

function seatUtilizationDeduction(snapshot: MetricsSnapshot): number {
  if (snapshot.licensedSeats === 0) return 0;
  const utilization = snapshot.activeUsers / snapshot.licensedSeats;
  return clamp01((0.65 - utilization) / 0.65) * HEALTH_WEIGHTS.seatUtilization;
}

function featureAdoptionDeduction(snapshot: MetricsSnapshot): number {
  if (snapshot.coreFeaturesTotal === 0) return 0;
  const adoption = snapshot.coreFeaturesAdopted / snapshot.coreFeaturesTotal;
  return clamp01((0.6 - adoption) / 0.6) * HEALTH_WEIGHTS.featureAdoption;
}

function supportBurdenDeduction(snapshot: MetricsSnapshot): number {
  const raw = snapshot.severeOpenTickets * 7 + snapshot.openTickets * 2 + (snapshot.recentEscalation ? 4 : 0);
  return Math.min(HEALTH_WEIGHTS.supportBurden, raw);
}

function sentimentDeduction(snapshot: MetricsSnapshot, pastNps: number | null): number {
  if (snapshot.nps === null) return HEALTH_WEIGHTS.sentiment * 0.35; // unknown sentiment is itself a risk signal
  const low = clamp01((20 - snapshot.nps) / 70) * (HEALTH_WEIGHTS.sentiment * 0.65);
  const decline = pastNps !== null ? clamp01((pastNps - snapshot.nps) / 30) * (HEALTH_WEIGHTS.sentiment * 0.35) : 0;
  return Math.min(HEALTH_WEIGHTS.sentiment, low + decline);
}

function billingDeduction(paymentStatus: "Current" | "Late" | "Failed", overdueInvoiceCount: number): number {
  let d = 0;
  if (paymentStatus === "Failed") d += 7;
  else if (paymentStatus === "Late") d += 4;
  if (overdueInvoiceCount > 0) d += 3;
  return Math.min(HEALTH_WEIGHTS.billing, d);
}

export interface HealthInput {
  snapshot: MetricsSnapshot;
  /** NPS from the prior snapshot, used to detect sentiment decline */
  pastNps: number | null;
  paymentStatus: "Current" | "Late" | "Failed";
  overdueInvoiceCount: number;
}

export function riskFromScore(score: number): RiskLevel {
  if (score < RISK_THRESHOLDS.high) return "High";
  if (score < RISK_THRESHOLDS.medium) return "Medium";
  return "Low";
}

function computeConfidence(input: HealthInput): { confidence: Confidence; reasons: string[] } {
  const reasons: string[] = [];
  let missing = 0;
  if (input.snapshot.nps === null) {
    missing += 1;
    reasons.push("NPS not collected for this account");
  }
  if (input.snapshot.avgResolutionHours === null && (input.snapshot.openTickets > 0 || input.snapshot.ticketsOpenedRecently > 0)) {
    missing += 1;
    reasons.push("Support resolution time incomplete");
  }
  if (input.snapshot.licensedSeats === 0) {
    missing += 1;
    reasons.push("Licensed seat count missing");
  }
  const confidence: Confidence = missing === 0 ? "High" : missing === 1 ? "Moderate" : "Low";
  if (reasons.length === 0) reasons.push("All core signals present");
  return { confidence, reasons };
}

/**
 * Computes an interpretable 0-100 health score from weighted signal
 * deductions. Every deduction is traceable to a concrete data point so the
 * result can always be explained to a user (see churn investigator).
 */
export function computeHealth(input: HealthInput): HealthResult {
  const { snapshot } = input;
  const contributions: DriverContribution[] = [
    { key: "usageDecline", label: usageLabel(snapshot), deduction: usageDeclineDeduction(snapshot) },
    { key: "inactivity", label: inactivityLabel(snapshot), deduction: inactivityDeduction(snapshot) },
    { key: "seatUtilization", label: utilizationLabel(snapshot), deduction: seatUtilizationDeduction(snapshot) },
    { key: "featureAdoption", label: adoptionLabel(snapshot), deduction: featureAdoptionDeduction(snapshot) },
    { key: "supportBurden", label: supportLabel(snapshot), deduction: supportBurdenDeduction(snapshot) },
    { key: "sentiment", label: sentimentLabel(snapshot, input.pastNps), deduction: sentimentDeduction(snapshot, input.pastNps) },
    { key: "billing", label: billingLabel(input.paymentStatus, input.overdueInvoiceCount), deduction: billingDeduction(input.paymentStatus, input.overdueInvoiceCount) },
  ];

  const totalDeduction = contributions.reduce((sum, c) => sum + c.deduction, 0);
  const score = Math.round(Math.max(0, Math.min(100, 100 - totalDeduction)));
  const { confidence, reasons } = computeConfidence(input);

  const drivers = contributions
    .filter((c) => c.deduction >= 2)
    .sort((a, b) => b.deduction - a.deduction)
    .slice(0, 5);

  return {
    score,
    risk: riskFromScore(score),
    confidence,
    confidenceReasons: reasons,
    drivers,
  };
}

function usageLabel(s: MetricsSnapshot): string {
  if (s.usageTrendPct >= 0) return `Usage up ${s.usageTrendPct.toFixed(0)}% over 30 days`;
  return `Usage down ${Math.abs(s.usageTrendPct).toFixed(0)}% over 30 days`;
}
function inactivityLabel(s: MetricsSnapshot): string {
  return s.lastActiveDaysAgo <= 1 ? "Active in the last day" : `No activity in ${s.lastActiveDaysAgo} days`;
}
function utilizationLabel(s: MetricsSnapshot): string {
  const pct = s.licensedSeats > 0 ? Math.round((s.activeUsers / s.licensedSeats) * 100) : 0;
  return `${pct}% of licensed seats active`;
}
function adoptionLabel(s: MetricsSnapshot): string {
  return `${s.coreFeaturesAdopted} of ${s.coreFeaturesTotal} core features adopted`;
}
function supportLabel(s: MetricsSnapshot): string {
  if (s.severeOpenTickets > 0) return `${s.severeOpenTickets} severe unresolved ticket${s.severeOpenTickets === 1 ? "" : "s"}`;
  if (s.openTickets > 0) return `${s.openTickets} open support ticket${s.openTickets === 1 ? "" : "s"}`;
  return "No open support tickets";
}
function sentimentLabel(s: MetricsSnapshot, pastNps: number | null): string {
  if (s.nps === null) return "NPS not collected";
  if (pastNps !== null && pastNps !== s.nps) return `NPS moved from ${pastNps} to ${s.nps}`;
  return `NPS at ${s.nps}`;
}
function billingLabel(status: "Current" | "Late" | "Failed", overdueInvoiceCount: number): string {
  if (status === "Failed") return "Recent payment failure";
  if (status === "Late") return "Payment currently late";
  if (overdueInvoiceCount > 0) return `${overdueInvoiceCount} overdue invoice${overdueInvoiceCount === 1 ? "" : "s"}`;
  return "Billing current";
}
