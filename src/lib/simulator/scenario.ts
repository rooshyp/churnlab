import { HealthResult, RiskLevel } from "../data/types";
import { riskFromScore } from "../scoring/health-score";

export interface SimAccountView {
  id: string;
  company: string;
  arr: number;
  healthScore: number;
  risk: RiskLevel;
}

export function toSimView(id: string, company: string, arr: number, health: HealthResult): SimAccountView {
  return { id, company, arr, healthScore: health.score, risk: health.risk };
}

/**
 * Weighted revenue exposure: High-risk ARR counts in full, Medium-risk ARR
 * counts partially, Low-risk ARR does not count. This makes "Revenue at
 * Risk" move when an account improves from High to Medium, not just when
 * it clears risk entirely — matching how the rest of the product treats
 * risk as a gradient rather than a binary. Weights are a documented
 * assumption, not an observed probability. See docs/METRICS.md.
 */
export const RISK_WEIGHT: Record<RiskLevel, number> = { High: 1, Medium: 0.4, Low: 0 };

export function revenueAtRisk(views: SimAccountView[]): number {
  return views.reduce((sum, v) => sum + Math.max(0, v.arr) * RISK_WEIGHT[v.risk], 0);
}

/**
 * Scenario A: "What if we reduce churn among high-value at-risk accounts by X%?"
 * Assumption: the reduction percentage applies as a direct fraction of the
 * ARR currently exposed by High-risk accounts at or above the value
 * threshold. This is a modeled estimate, not an observed outcome.
 */
export function reduceChurnAmongHighValue(views: SimAccountView[], arrThreshold: number, reductionPct: number) {
  const pool = views.filter((v) => v.risk === "High" && v.arr >= arrThreshold);
  const poolArr = pool.reduce((sum, v) => sum + Math.max(0, v.arr), 0);
  const arrRetained = poolArr * (reductionPct / 100);
  return { accountsInPool: pool.length, poolArr, arrRetained };
}

/**
 * Scenario B: "What if we successfully retain our N highest-value at-risk accounts?"
 * Deterministic: sums ARR for the top-N at-risk accounts ranked by ARR.
 * Labeled as a scenario, contingent on those specific accounts being saved.
 */
export function retainTopNAtRisk(views: SimAccountView[], n: number) {
  const candidates = views
    .filter((v) => v.risk !== "Low")
    .sort((a, b) => b.arr - a.arr)
    .slice(0, Math.max(0, n));
  const arrRetained = candidates.reduce((sum, v) => sum + Math.max(0, v.arr), 0);
  return { accounts: candidates, arrRetained };
}

/**
 * Scenario C: "What if usage recovery moves K accounts from High to Medium risk?"
 * Simulates a fixed health-score recovery (+20 points, capped at 100) for
 * the K worst-scoring High-risk accounts and reports the resulting change
 * in total Revenue at Risk.
 */
export function usageRecoveryImpact(views: SimAccountView[], k: number, scoreBump = 20) {
  const before = revenueAtRisk(views);
  const highRisk = views.filter((v) => v.risk === "High").sort((a, b) => a.healthScore - b.healthScore);
  const affectedIds = new Set(highRisk.slice(0, Math.max(0, k)).map((v) => v.id));
  const simulated = views.map((v) => {
    if (!affectedIds.has(v.id)) return v;
    const newScore = Math.min(100, v.healthScore + scoreBump);
    return { ...v, healthScore: newScore, risk: riskFromScore(newScore) };
  });
  const after = revenueAtRisk(simulated);
  return { before, after, arrReduction: before - after, accountsAffected: affectedIds.size };
}
