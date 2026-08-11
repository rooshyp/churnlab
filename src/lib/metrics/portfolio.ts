import { Account, HealthResult, PriorityResult } from "../data/types";
import { healthForAccount } from "../scoring/account-health";
import { computePortfolioPriority } from "../priority/revenue-priority";

export interface AccountView {
  account: Account;
  health: HealthResult;
  priority: PriorityResult;
}

let cache: { key: string; views: AccountView[] } | null = null;

/**
 * Composes health + priority for a set of accounts. Cached per input
 * array identity so repeated calls within a server render (dashboard,
 * command center, segments) don't recompute scoring for the same dataset.
 */
export function buildPortfolio(accounts: Account[]): AccountView[] {
  const key = accounts.length > 0 ? `${accounts.length}:${accounts[0].id}:${accounts[accounts.length - 1].id}` : "empty";
  if (cache && cache.key === key) return cache.views;

  const healthByAccountId = new Map<string, HealthResult>();
  for (const account of accounts) {
    healthByAccountId.set(account.id, healthForAccount(account));
  }
  const priorityByAccountId = computePortfolioPriority(accounts, healthByAccountId);

  const views: AccountView[] = accounts.map((account) => ({
    account,
    health: healthByAccountId.get(account.id)!,
    priority: priorityByAccountId.get(account.id)!,
  }));

  cache = { key, views };
  return views;
}
