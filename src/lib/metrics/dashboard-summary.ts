import { Account } from "../data/types";
import { AccountView } from "./portfolio";
import {
  churnedWithinDays,
  grossRevenueRetention,
  logoChurnRate,
  netRevenueRetention,
  revenueChurnRate,
  totalArr,
  totalMrr,
  upcomingRenewalArr,
  upcomingRenewals,
} from "./saas-metrics";
import { revenueAtRisk, toSimView } from "../simulator/scenario";

export const TRAILING_CHURN_WINDOW_DAYS = 90;
export const RENEWAL_WINDOW_DAYS = 90;

export interface DashboardSummary {
  totalArr: number;
  totalMrr: number;
  totalAccounts: number;
  weightedRevenueAtRisk: number;
  highRiskCount: number;
  highRiskArr: number;
  renewals90d: number;
  renewalArr90d: number;
  logoChurnRatePct: number;
  revenueChurnRatePct: number;
  grossRevenueRetentionPct: number;
  netRevenueRetentionPct: number;
}

export function buildDashboardSummary(active: Account[], churned: Account[], views: AccountView[]): DashboardSummary {
  const trailingChurned = churnedWithinDays(churned, TRAILING_CHURN_WINDOW_DAYS);
  const churnWindow = { active, churnedInWindow: trailingChurned };

  const simViews = views.map((v) => toSimView(v.account.id, v.account.company, v.account.arr, v.health));
  const highRisk = views.filter((v) => v.health.risk === "High");

  return {
    totalArr: totalArr(active),
    totalMrr: totalMrr(active),
    totalAccounts: active.length,
    weightedRevenueAtRisk: revenueAtRisk(simViews),
    highRiskCount: highRisk.length,
    highRiskArr: highRisk.reduce((sum, v) => sum + Math.max(0, v.account.arr), 0),
    renewals90d: upcomingRenewals(active, RENEWAL_WINDOW_DAYS).length,
    renewalArr90d: upcomingRenewalArr(active, RENEWAL_WINDOW_DAYS),
    logoChurnRatePct: logoChurnRate(churnWindow) * 100,
    revenueChurnRatePct: revenueChurnRate(churnWindow) * 100,
    grossRevenueRetentionPct: grossRevenueRetention(churnWindow) * 100,
    netRevenueRetentionPct: netRevenueRetention(churnWindow) * 100,
  };
}
