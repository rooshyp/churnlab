/**
 * Retention economics: a transparent cost-vs-exposure comparison for a
 * recommended action. Deliberately does not estimate a probability of
 * successfully retaining the account — that would fabricate precision the
 * underlying data does not support. See docs/DECISIONS.md.
 */

/** Configurable cost assumptions per action, in USD. Edit to match your org. */
export const INTERVENTION_COST: Record<string, number> = {
  "Customer Success outreach": 500,
  "Schedule enablement session": 1500,
  "Escalate unresolved critical tickets": 800,
  "Executive relationship review": 3000,
  "Executive sponsor review": 4000,
  "Billing intervention": 300,
  "Continue standard cadence": 0,
};

export interface ActionValue {
  action: string;
  estimatedCost: number;
  potentialRevenueExposed: number;
  exposureToCostRatio: number | null;
}

export function computeActionValue(action: string, arrExposed: number): ActionValue {
  const estimatedCost = INTERVENTION_COST[action] ?? 1000;
  return {
    action,
    estimatedCost,
    potentialRevenueExposed: Math.max(0, arrExposed),
    exposureToCostRatio: estimatedCost > 0 ? Math.round((Math.max(0, arrExposed) / estimatedCost) * 10) / 10 : null,
  };
}
