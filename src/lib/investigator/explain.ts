import { Account, HealthResult } from "../data/types";
import { daysUntil } from "../metrics/saas-metrics";
import { MEANINGFUL_DRIVER_THRESHOLD } from "../scoring/health-score";

export type SectionSeverity = "none" | "watch" | "risk";

export interface InvestigatorSection {
  key: string;
  title: string;
  severity: SectionSeverity;
  findings: string[];
}

export interface Investigation {
  sections: InvestigatorSection[];
  summary: string;
}

const DRIVER_SUMMARY_PHRASE: Record<string, string> = {
  usageDecline: "declining product engagement",
  inactivity: "extended account inactivity",
  seatUtilization: "low seat utilization",
  featureAdoption: "shallow feature adoption",
  supportBurden: "unresolved support friction",
  sentiment: "weakening customer sentiment",
  billing: "billing and payment friction",
};

function engagementSection(account: Account): InvestigatorSection {
  const { current } = account;
  const findings: string[] = [];
  if (current.usageTrendPct < 0) {
    findings.push(`Weekly active users decreased ${Math.abs(current.usageTrendPct).toFixed(0)}% over the last 30 days.`);
  } else {
    findings.push(`Weekly active users are up ${current.usageTrendPct.toFixed(0)}% over the last 30 days.`);
  }
  findings.push(`${current.weeklyActiveUsers} weekly active users across ${current.licensedSeats} licensed seats.`);
  if (current.lastActiveDaysAgo > 3) {
    findings.push(`No recorded activity in ${current.lastActiveDaysAgo} days.`);
  }
  const severity: SectionSeverity = current.usageTrendPct < -20 || current.lastActiveDaysAgo > 14 ? "risk" : current.usageTrendPct < 0 ? "watch" : "none";
  return { key: "engagement", title: "Engagement", severity, findings };
}

function adoptionSection(account: Account): InvestigatorSection {
  const { current } = account;
  const findings = [
    `${current.coreFeaturesAdopted} of ${current.coreFeaturesTotal} core features are actively used${
      current.adoptedFeatureNames.length ? ` (${current.adoptedFeatureNames.join(", ")})` : ""
    }.`,
  ];
  const rate = current.coreFeaturesTotal > 0 ? current.coreFeaturesAdopted / current.coreFeaturesTotal : 0;
  const severity: SectionSeverity = rate < 0.35 ? "risk" : rate < 0.6 ? "watch" : "none";
  return { key: "adoption", title: "Adoption", severity, findings };
}

function supportSection(account: Account): InvestigatorSection {
  const { current } = account;
  const findings: string[] = [];
  if (current.openTickets === 0) {
    findings.push("No open support tickets.");
  } else {
    findings.push(
      `${current.openTickets} ticket${current.openTickets === 1 ? " is" : "s are"} currently open, ${current.severeOpenTickets} of them high-severity.`
    );
    if (current.ticketsOpenedRecently > 0) {
      findings.push(`${current.ticketsOpenedRecently} ticket${current.ticketsOpenedRecently === 1 ? " was" : "s were"} opened this month.`);
    }
  }
  if (current.recentEscalation) findings.push("A ticket was recently escalated.");
  if (current.avgResolutionHours !== null) {
    findings.push(`Average resolution time is ${current.avgResolutionHours} hours.`);
  } else if (current.openTickets > 0 || current.ticketsOpenedRecently > 0) {
    findings.push("Resolution time data is incomplete for this account.");
  }
  const severity: SectionSeverity = current.severeOpenTickets > 0 || current.recentEscalation ? "risk" : current.openTickets > 0 ? "watch" : "none";
  return { key: "support", title: "Support", severity, findings };
}

function sentimentSection(account: Account): InvestigatorSection {
  const { current, past } = account;
  const findings: string[] = [];
  if (current.nps === null) {
    findings.push("NPS has not been collected for this account.");
  } else if (past.nps !== null && past.nps !== current.nps) {
    findings.push(`NPS ${current.nps > past.nps ? "improved" : "declined"} from ${past.nps} to ${current.nps}.`);
  } else {
    findings.push(`NPS is currently ${current.nps}.`);
  }
  const severity: SectionSeverity = current.nps !== null && current.nps < 10 ? "risk" : current.nps !== null && current.nps < 30 ? "watch" : "none";
  return { key: "sentiment", title: "Sentiment", severity, findings };
}

function renewalSection(account: Account): InvestigatorSection {
  const days = daysUntil(account.renewalDate);
  const findings = [
    days >= 0
      ? `The account renews in ${days} day${days === 1 ? "" : "s"}.`
      : `The renewal date has passed (${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue) — verify contract data.`,
  ];
  const severity: SectionSeverity = days >= 0 && days <= 45 ? "watch" : days < 0 ? "risk" : "none";
  return { key: "renewal", title: "Renewal", severity, findings };
}

function billingSection(account: Account): InvestigatorSection {
  const { billing } = account;
  const findings: string[] = [];
  if (billing.paymentStatus === "Current" && billing.overdueInvoiceCount === 0) {
    findings.push("Billing is current with no overdue invoices.");
  } else {
    if (billing.paymentStatus !== "Current") findings.push(`Payment status is ${billing.paymentStatus.toLowerCase()}.`);
    if (billing.failedPaymentsLast90d > 0) findings.push(`${billing.failedPaymentsLast90d} failed payment(s) in the last 90 days.`);
    if (billing.overdueInvoiceCount > 0) findings.push(`${billing.overdueInvoiceCount} overdue invoice(s) totaling $${billing.overdueAmount.toLocaleString()}.`);
  }
  const severity: SectionSeverity = billing.paymentStatus === "Failed" ? "risk" : billing.paymentStatus === "Late" ? "watch" : "none";
  return { key: "billing", title: "Billing", severity, findings };
}

function buildSummary(account: Account, health: HealthResult): string {
  const days = daysUntil(account.renewalDate);
  const meaningfulDrivers = health.drivers.filter((d) => d.deduction >= MEANINGFUL_DRIVER_THRESHOLD);
  if (meaningfulDrivers.length === 0) {
    return `${account.company} shows no material risk drivers; account health is strong across engagement, support, and sentiment signals.`;
  }
  const top = meaningfulDrivers.slice(0, 2).map((d) => DRIVER_SUMMARY_PHRASE[d.key] ?? d.label);
  const causeClause = top.length > 1 ? `${top[0]} and ${top[1]}` : top[0];
  const renewalClause = days >= 0 && days <= 60 ? ` ahead of a renewal in ${days} days` : "";
  return `${account.company}'s risk is primarily driven by ${causeClause}${renewalClause}.`;
}

export function investigate(account: Account, health: HealthResult): Investigation {
  const sections = [
    engagementSection(account),
    adoptionSection(account),
    supportSection(account),
    sentimentSection(account),
    renewalSection(account),
    billingSection(account),
  ];
  return { sections, summary: buildSummary(account, health) };
}

export { DRIVER_SUMMARY_PHRASE };
