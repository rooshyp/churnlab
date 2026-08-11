/**
 * Core domain types for ChurnLab.
 * All records are synthetic demo data unless ingested by the user via CSV.
 */

export type Tier = "Starter" | "Growth" | "Enterprise";
export type ContractType = "Monthly" | "Annual" | "Multi-year";
export type PaymentStatus = "Current" | "Late" | "Failed";
export type Industry =
  | "SaaS & Software"
  | "Financial Services"
  | "Healthcare"
  | "Retail & E-commerce"
  | "Manufacturing"
  | "Media & Entertainment"
  | "Logistics"
  | "Professional Services"
  | "Education"
  | "Nonprofit";

export interface MetricsSnapshot {
  /** ISO date this snapshot represents */
  asOf: string;
  licensedSeats: number;
  activeUsers: number;
  weeklyActiveUsers: number;
  sessionsPerWeek: number;
  /** % change in weekly active users over the prior comparable window */
  usageTrendPct: number;
  coreFeaturesTotal: number;
  coreFeaturesAdopted: number;
  adoptedFeatureNames: string[];
  lastActiveDaysAgo: number;
  openTickets: number;
  severeOpenTickets: number;
  ticketsOpenedRecently: number;
  avgResolutionHours: number | null;
  recentEscalation: boolean;
  /** Net Promoter Score, -100..100. Null if not collected (data quality signal). */
  nps: number | null;
}

export interface BillingInfo {
  paymentStatus: PaymentStatus;
  failedPaymentsLast90d: number;
  overdueInvoiceCount: number;
  overdueAmount: number;
}

export interface Account {
  id: string;
  company: string;
  industry: Industry;
  employees: number;
  tier: Tier;
  contractType: ContractType;
  region: string;
  ownerName: string;
  /** ISO date */
  startDate: string;
  /** ISO date, next contractual renewal */
  renewalDate: string;
  mrr: number;
  arr: number;
  current: MetricsSnapshot;
  /** Snapshot from ~30 days before `current`, used for "What Changed" */
  past: MetricsSnapshot;
  billing: BillingInfo;
  /** Only populated for the closed historical cohort used in trailing churn metrics */
  status: "active" | "churned";
  churnDate?: string;
}

export type RiskLevel = "Low" | "Medium" | "High";
export type Confidence = "High" | "Moderate" | "Low";
export type PriorityTier = "Critical" | "High" | "Medium" | "Low";

export interface DriverContribution {
  key: string;
  label: string;
  /** points deducted from the 100-point baseline */
  deduction: number;
}

export interface HealthResult {
  score: number;
  risk: RiskLevel;
  confidence: Confidence;
  confidenceReasons: string[];
  drivers: DriverContribution[];
}

export interface PriorityResult {
  priorityScore: number;
  tier: PriorityTier;
  riskFactor: number;
  revenueFactor: number;
  urgencyFactor: number;
  daysToRenewal: number;
  arrExposed: number;
  mrrExposed: number;
}

export interface Dataset {
  accounts: Account[];
  generatedAt: string;
}
