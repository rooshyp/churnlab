import { Account } from "../data/types";

/**
 * Deterministic SaaS metric calculations. Every function here is a pure
 * function over an account list so it can be unit tested independently of
 * the synthetic dataset and reused against ingested data.
 */

export function totalMrr(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.mrr, 0);
}

export function totalArr(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.arr, 0);
}

export interface ChurnWindowInput {
  active: Account[];
  /** Accounts that churned within the trailing window */
  churnedInWindow: Account[];
}

/**
 * Logo churn rate = accounts lost / accounts at the start of the period.
 * "Start of period" is approximated as active-now + churned-in-window,
 * since the synthetic dataset does not retain a full historical roster.
 */
export function logoChurnRate({ active, churnedInWindow }: ChurnWindowInput): number {
  const startCount = active.length + churnedInWindow.length;
  if (startCount === 0) return 0;
  return churnedInWindow.length / startCount;
}

/** Revenue churn rate = ARR lost / ARR at the start of the period. */
export function revenueChurnRate({ active, churnedInWindow }: ChurnWindowInput): number {
  const startArr = totalArr(active) + totalArr(churnedInWindow);
  if (startArr === 0) return 0;
  return totalArr(churnedInWindow) / startArr;
}

export function logoRetentionRate(input: ChurnWindowInput): number {
  return 1 - logoChurnRate(input);
}

/**
 * Gross Revenue Retention = (starting ARR - churned ARR - contraction ARR) / starting ARR.
 * The synthetic dataset does not model seat-level downgrades independent of
 * churn, so contraction ARR is 0 and GRR reduces to 1 - revenue churn rate.
 * See docs/METRICS.md for this limitation.
 */
export function grossRevenueRetention(input: ChurnWindowInput): number {
  return 1 - revenueChurnRate(input);
}

/**
 * Net Revenue Retention = (starting ARR - churned ARR - contraction ARR + expansion ARR) / starting ARR.
 * Expansion ARR is not modeled in this dataset (no per-account billing
 * history), so NRR currently equals GRR. Exposed separately so the UI and
 * downstream code do not need to change if expansion modeling is added.
 */
export function netRevenueRetention(input: ChurnWindowInput, expansionArr = 0): number {
  const startArr = totalArr(input.active) + totalArr(input.churnedInWindow);
  if (startArr === 0) return 0;
  return grossRevenueRetention(input) + expansionArr / startArr;
}

export function daysUntil(dateIso: string, from: Date = new Date()): number {
  const target = new Date(dateIso + "T00:00:00");
  const ms = target.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function upcomingRenewals(accounts: Account[], withinDays: number): Account[] {
  return accounts.filter((a) => {
    const d = daysUntil(a.renewalDate);
    return d >= 0 && d <= withinDays;
  });
}

export function upcomingRenewalArr(accounts: Account[], withinDays: number): number {
  return totalArr(upcomingRenewals(accounts, withinDays));
}

/** Convenience for filtering accounts churned within the last N days. */
export function churnedWithinDays(churned: Account[], days: number, from: Date = new Date()): Account[] {
  return churned.filter((a) => {
    if (!a.churnDate) return false;
    const d = new Date(a.churnDate + "T00:00:00");
    const diffDays = (from.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  });
}
