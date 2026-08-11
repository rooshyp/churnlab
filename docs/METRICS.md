# ChurnLab: SaaS Metrics

All formulas below are implemented in [`src/lib/metrics/saas-metrics.ts`](../src/lib/metrics/saas-metrics.ts) and tested in the adjacent `.test.ts` file. This document explains what each metric means and where its limitations are. It isn't a general SaaS-metrics primer.

## MRR and ARR

- **MRR:** sum of `mrr` across accounts.
- **ARR:** sum of `arr` across accounts. In this dataset, `arr = mrr * 12`; a real deployment might instead ingest ARR directly from billing and derive MRR from it, which is why both fields exist independently on the `Account` type rather than one being computed from the other everywhere.

## Churn and retention

Logo churn and revenue churn are both computed over a trailing window using `churnedInWindow`, the set of accounts that churned inside that window.

```
logoChurnRate = churnedInWindow.length / (active.length + churnedInWindow.length)
revenueChurnRate = arr(churnedInWindow) / (arr(active) + arr(churnedInWindow))
```

The denominator, "accounts at the start of the period," is approximated as *currently active + churned during the window*, because the dataset doesn't retain a full historical roster snapshot. This is accurate as long as no account both joined and churned inside the same window, which holds for the trailing-90-day window used throughout the product given the synthetic account ages.

**Gross Revenue Retention (GRR)** = `1 - revenueChurnRate`. This treats all revenue loss as churn; it doesn't separately model contraction (a customer downgrading without fully churning), because the dataset has no seat-level downgrade history independent of churn.

**Net Revenue Retention (NRR)** = `GRR + expansionArr / startingArr`, with `expansionArr` defaulting to `0`. NRR and GRR are therefore identical in this build. This is a real limitation, not an oversight: computing genuine expansion revenue requires historical MRR/seat data per account over time, which this dataset doesn't carry (it has a *current* and a *30-days-ago* operational snapshot per account, not a full billing history). The function signature accepts an `expansionArr` parameter specifically so this can be filled in without changing every call site, if that history is ever added.

## Revenue at risk

There are two different "at risk" numbers in the product, and they answer different questions:

1. **Dashboard headline ("Revenue at Risk"):** a *risk-weighted* exposure figure: `High-risk ARR × 1.0 + Medium-risk ARR × 0.4`. Low-risk ARR doesn't count. This is the number used on the Dashboard and in the Simulator, because it should move when an account's risk improves from High to Medium, not only when it clears risk entirely.
2. **Per-account ARR exposed:** on the Command Center and Customer 360, "ARR" for a given account is its own `arr` (clamped to zero, see below), not weighted. Weighting only makes sense when aggregating across accounts.

The `0.4` weight for Medium risk is a stated assumption, not a fitted probability. See [`docs/DECISIONS.md`](DECISIONS.md).

## Upcoming renewals

`upcomingRenewalArr(accounts, windowDays)` sums ARR for active accounts whose `renewalDate` falls within `[today, today + windowDays]`. The Dashboard uses a 90-day window for the headline stat and a 6-month bucketed view for the renewal chart.

## Handling bad data in the metrics themselves

A handful of accounts in the synthetic dataset intentionally carry negative ARR (to exercise the Data Quality Console; see `docs/SCORING.md` and the ingestion validator). Wherever ARR is displayed as a dollar figure to a user (Command Center, Customer 360, Dashboard's Top Priorities), it's clamped to `max(0, arr)` via the priority engine's `arrExposed` field, so a data-entry error doesn't show up as a literal negative dollar amount outside the one place designed to flag it. The underlying negative value is still what the Data Quality Console surfaces as a Critical issue.

## Prioritization

Priority scoring (risk × revenue × urgency, with percentile-based tiers) is documented in [`docs/SCORING.md`](SCORING.md) alongside health scoring, since both feed the same `Account → score` pipeline.
