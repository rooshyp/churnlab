import { Account, HealthResult, PriorityResult, PriorityTier } from "../data/types";
import { daysUntil } from "../metrics/saas-metrics";

/**
 * ARR at or above this level is treated as maximally "large" for the
 * revenue factor (log-scaled so a $2M account doesn't totally eclipse
 * everything else, while still outranking small accounts decisively).
 * Configurable — see docs/SCORING.md.
 */
export const MAX_ARR_FOR_SCALE = 250_000;

export const PRIORITY_WEIGHTS = {
  risk: 0.4,
  revenue: 0.3,
  urgency: 0.15,
  /** rewards accounts that are simultaneously high-risk AND high-revenue */
  interaction: 0.15,
} as const;

export function riskFactor(health: HealthResult): number {
  return (100 - health.score) / 100;
}

export function revenueFactor(arr: number): number {
  if (arr <= 0) return 0;
  const scaled = Math.log10(arr + 1) / Math.log10(MAX_ARR_FOR_SCALE);
  return Math.min(1, Math.max(0, scaled));
}

export function urgencyFactor(daysToRenewal: number): number {
  if (daysToRenewal <= 30) return 1;
  if (daysToRenewal <= 60) return 0.75;
  if (daysToRenewal <= 90) return 0.5;
  if (daysToRenewal <= 180) return 0.25;
  return 0.1;
}

/**
 * Combines risk, revenue exposure, and renewal urgency into a single 0-100
 * priority score. A pure multiplicative (risk x revenue x urgency) model
 * was considered but rejected: it zeroes out large, high-risk accounts
 * with a distant renewal, which understates real exposure. A weighted sum
 * keeps every factor visible, with a smaller interaction term added back
 * in specifically to reward the risk+revenue combination the product is
 * meant to surface. See docs/DECISIONS.md.
 */
export function rawPriorityScore(risk: number, revenue: number, urgency: number): number {
  const { risk: wRisk, revenue: wRevenue, urgency: wUrgency, interaction } = PRIORITY_WEIGHTS;
  const score = wRisk * risk + wRevenue * revenue + wUrgency * urgency + interaction * (risk * revenue);
  return Math.round(score * 100);
}

/**
 * Priority tiers are assigned by percentile within the current portfolio
 * rather than fixed absolute thresholds, so the queue stays meaningful as
 * the mix of accounts changes (e.g. after a CSV import of a different
 * customer base) instead of silently drifting out of calibration.
 */
export function tierFromPercentile(percentile: number): PriorityTier {
  if (percentile >= 0.95) return "Critical";
  if (percentile >= 0.8) return "High";
  if (percentile >= 0.5) return "Medium";
  return "Low";
}

export interface PortfolioPriorityEntry {
  accountId: string;
  result: PriorityResult;
}

export function computePortfolioPriority(
  accounts: Account[],
  healthByAccountId: Map<string, HealthResult>
): Map<string, PriorityResult> {
  const raw = accounts.map((account) => {
    const health = healthByAccountId.get(account.id);
    const daysToRenewal = daysUntil(account.renewalDate);
    const risk = health ? riskFactor(health) : 0.5;
    const revenue = revenueFactor(Math.max(0, account.arr));
    const urgency = urgencyFactor(daysToRenewal);
    return {
      accountId: account.id,
      score: rawPriorityScore(risk, revenue, urgency),
      risk,
      revenue,
      urgency,
      daysToRenewal,
      arr: account.arr,
      mrr: account.mrr,
    };
  });

  const sorted = [...raw].sort((a, b) => a.score - b.score);
  const rank = new Map<string, number>();
  sorted.forEach((r, i) => rank.set(r.accountId, i));

  const out = new Map<string, PriorityResult>();
  for (const r of raw) {
    const percentile = raw.length > 1 ? rank.get(r.accountId)! / (raw.length - 1) : 1;
    out.set(r.accountId, {
      priorityScore: r.score,
      tier: tierFromPercentile(percentile),
      riskFactor: r.risk,
      revenueFactor: r.revenue,
      urgencyFactor: r.urgency,
      daysToRenewal: r.daysToRenewal,
      arrExposed: Math.max(0, r.arr),
      mrrExposed: Math.max(0, r.mrr),
    });
  }
  return out;
}
