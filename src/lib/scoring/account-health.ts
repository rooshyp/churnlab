import { Account, HealthResult } from "../data/types";
import { computeHealth } from "./health-score";

/**
 * Convenience wrappers that build a HealthInput from an Account. Billing
 * history is only tracked as a current snapshot in this dataset, so the
 * "past" health calculation reuses today's billing status as an
 * approximation — documented in docs/SCORING.md.
 */
export function healthForAccount(account: Account): HealthResult {
  return computeHealth({
    snapshot: account.current,
    pastNps: account.past.nps,
    paymentStatus: account.billing.paymentStatus,
    overdueInvoiceCount: account.billing.overdueInvoiceCount,
  });
}

export function pastHealthForAccount(account: Account): HealthResult {
  return computeHealth({
    snapshot: account.past,
    pastNps: null,
    paymentStatus: account.billing.paymentStatus,
    overdueInvoiceCount: account.billing.overdueInvoiceCount,
  });
}
