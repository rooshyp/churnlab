# ChurnLab: Health Scoring and Prioritization

Two separate, composable engines:

1. **Health score** ([`src/lib/scoring/health-score.ts`](../src/lib/scoring/health-score.ts)): is this account healthy, and why?
2. **Priority score** ([`src/lib/priority/revenue-priority.ts`](../src/lib/priority/revenue-priority.ts)): given health, revenue, and renewal timing, how urgently does it need attention?

Neither is a machine-learning model. Both are deterministic, weighted formulas over observable account data, chosen so every number on screen can be traced back to a specific data point. See [`docs/DECISIONS.md`](DECISIONS.md) for why.

## Health score

Every account starts at 100 points and loses points for each risk signal present. The score is `100 - sum(deductions)`, clamped to `[0, 100]`.

| Signal | Max deduction | Driven by |
|---|---|---|
| Usage decline | 18 | % drop in weekly active users over 30 days |
| Inactivity | 7 | Days since last recorded activity |
| Seat utilization | 15 | Active users ÷ licensed seats |
| Feature adoption | 15 | Core features adopted ÷ total core features |
| Support burden | 20 | Severe open tickets, open tickets, recent escalation |
| Sentiment | 15 | Current NPS level, and NPS decline vs. 30 days ago |
| Billing | 10 | Payment status, overdue invoices |

Weights are defined in `HEALTH_WEIGHTS` and sum to 100, so an account with every signal maxed out bottoms out at 0. They're intentionally configurable constants, not hardcoded inline: changing the relative importance of, say, support burden vs. sentiment is a one-line change, not a refactor. They have not been calibrated against real outcome data (see Limitations below).

**Risk level** is a direct function of score: `< 40` → High, `< 70` → Medium, otherwise Low (`RISK_THRESHOLDS`).

**Drivers** shown in the UI are the individual deductions ≥ 2 points, sorted descending, capped at 5. Each driver carries a human-readable label generated from the same data used to compute it (e.g. "Usage down 41% over 30 days"); there's no separate copy-writing step that could drift out of sync with the number.

**Confidence** is downgraded when the account is missing data the score depends on: no NPS on file, no support resolution-time data despite open tickets, or a missing seat count. An account can have a *low* health score with *high* confidence (the data is complete and it genuinely looks unhealthy) or a *middling* score with *low* confidence (the data is too sparse to say much). The UI always shows confidence next to risk for this reason.

### What Changed

The "What Changed" view on Customer 360 runs the same health-score function twice, once against the current snapshot and once against the 30-days-ago snapshot, and diffs the resulting driver deductions to find whichever signal deteriorated the most. This means What Changed is guaranteed to use the same logic as the headline score, rather than a separate trend calculation that could disagree with it.

One simplification: billing status isn't tracked historically, so the 30-days-ago health calculation reuses today's billing status. If an account's payment status changed in the last 30 days, that movement won't show up as a billing-driven delta in What Changed, though it will still show up in the current score.

## Priority score

Health alone doesn't tell you who to work on first: a small, healthy-ish account and a large, badly-at-risk one need very different urgency. Priority combines three factors:

- **Risk factor** = `(100 - healthScore) / 100`
- **Revenue factor** = `log10(arr) / log10(MAX_ARR_FOR_SCALE)`, clamped to `[0, 1]`. Log-scaled so a $2M account doesn't completely dominate a $150K one, since both are "large" in a way that a linear scale would exaggerate.
- **Urgency factor** = a step function of days to renewal (`1.0` inside 30 days, down to `0.1` beyond 180).

```
priorityScore = 100 × (0.40 × risk + 0.30 × revenue + 0.15 × urgency + 0.15 × (risk × revenue))
```

The `risk × revenue` interaction term exists specifically to reward the case the product is built around: an account that is *simultaneously* high-risk and high-revenue should outrank one that's merely high on one axis. A pure multiplicative model (`risk × revenue × urgency`) was considered and rejected. See `docs/DECISIONS.md` for why.

**Priority tiers** (Critical / High / Medium / Low) are assigned by *percentile within the current portfolio*, not fixed score thresholds. The top 5% of accounts by priority score are Critical, the next 15% High, the next 30% Medium, the rest Low. This keeps the queue meaningful if the portfolio mix changes (e.g. after importing a different customer base) instead of drifting out of calibration against thresholds tuned for a different distribution.

## Limitations

- **Weights are not calibrated.** They encode a reasonable prior about what matters, not a fitted model against real retained/churned outcomes. A production deployment should recalibrate them, or replace the deterministic model with a supplementary statistical one, against its own historical data.
- **Correlation, not causation.** A high support-ticket count is associated with churn risk in general; it does not mean the tickets are *causing* the account to leave.
- **The interaction term is a design choice, not a derived quantity.** `0.15` was chosen to make the effect visible without letting it dominate the additive terms; it hasn't been tuned against outcomes.
- **Percentile tiers mean "Critical" is relative.** In a portfolio where every account is healthy, some account will still be labeled the (relatively) worst 5%. The label describes rank, not an absolute crisis threshold.
