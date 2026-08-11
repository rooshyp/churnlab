import { Account, Dataset } from "./types";
import { generateAccounts } from "./generator";

let cached: Dataset | null = null;

/**
 * Synthetic demo dataset, generated once per server process with a fixed
 * seed so numbers stay stable across page navigations within a session.
 */
export function getDataset(): Dataset {
  if (!cached) {
    cached = {
      accounts: generateAccounts(),
      generatedAt: new Date().toISOString(),
    };
  }
  return cached;
}

export function getActiveAccounts(): Account[] {
  return getDataset().accounts.filter((a) => a.status === "active");
}

export function getChurnedAccounts(): Account[] {
  return getDataset().accounts.filter((a) => a.status === "churned");
}

export function getAccountById(id: string): Account | undefined {
  return getDataset().accounts.find((a) => a.id === id);
}
