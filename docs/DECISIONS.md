# ChurnLab: Decisions

Notable tradeoffs made while building ChurnLab, and the reasoning behind them. Written so a future change can be evaluated against the original reasoning instead of guessed at.

## Why risk alone doesn't determine priority

A churn-probability score answers "how likely is this account to leave," not "who should I work on today." A 90%-risk account worth $2,000 ARR and a 40%-risk account worth $200,000 ARR are not equally urgent, and a product that ranks purely by risk will send a team to spend a morning on the smaller account. Priority combines risk, revenue, and renewal urgency specifically so the queue reflects where attention actually pays off. See `docs/SCORING.md` for the formula.

## Why priority isn't a simple product of risk × revenue × urgency

A pure multiplicative model was the first thing tried. It has a real problem: an account with high risk and high revenue but a renewal 300 days out gets multiplied by a tiny urgency factor and disappears from the top of the queue, even though it's exactly the kind of account worth knowing about early. A weighted sum keeps every factor visible on its own, with a smaller interaction term (`risk × revenue`) added back in specifically to reward the risk-and-revenue combination the product cares about most, without letting distant urgency zero everything out.

## Why priority tiers are percentile-based, not fixed thresholds

Fixed score thresholds (e.g. "priority score ≥ 65 is Critical") would need to be recalibrated any time the portfolio composition changes: importing a healthier customer base would silently produce zero Critical accounts, and a distressed portfolio would produce mostly Critical ones, either way losing the signal. Percentile-based tiers (top 5% = Critical, next 15% = High, and so on) keep the queue meaningful as a *relative* view of "who needs attention most, right now, in this portfolio," which is what the Command Center is actually for.

## Why explainability is required, not optional

A risk score a user can't interrogate isn't something they can act on with confidence, and it isn't something they can defend in a renewal conversation with their own leadership. Every deduction behind a health score carries a human-readable label generated from the same data used to compute it, and the Churn Investigator is built entirely from those same underlying fields. There's no separate narrative layer that could say something the numbers don't support.

## Why ingestion and data quality are first-class, not an afterthought

Real customer data is inconsistent: mismatched column names, missing fields, impossible values, duplicate identifiers. A product that assumes clean input doesn't survive contact with a real CSV export. Building column mapping, row-level validation, and a live data-quality scanner as core features (rather than a basic file upload) is what makes the rest of the product trustworthy: a health score computed from data that's silently wrong is worse than no score at all.

## Why AI is not used anywhere in the current build

The Churn Investigator and What Changed narratives are template-driven and deterministic, built directly from computed facts. This was a deliberate choice, not a limitation waiting to be lifted: a deterministic explanation is exactly as trustworthy as the underlying calculation, is reproducible, and doesn't require an API key or external dependency to run. If natural-language summarization is added later, the right integration point is to hand an LLM the already-computed structured facts (drivers, deltas, evidence strings) for phrasing, never to let it infer facts on its own. The product must keep working without any AI API key.

## Why recommendations are advisory, not predictive

The action engine maps root-cause drivers to a suggested playbook entry and shows a transparent cost-vs-exposure comparison. It deliberately does not estimate a probability that a given action will retain the account. That number isn't supported by the data available (no historical record of which past interventions worked), and presenting a specific save probability would manufacture a precision the product hasn't earned. The retention economics view answers "is this worth trying," not "will this work."

## Why NRR and GRR are currently identical

Net Revenue Retention requires expansion revenue (customers paying more over time), which requires historical billing or seat data per account. The dataset carries a *current* and a *30-days-ago* snapshot per account for operational metrics, not a full billing history, so there's no real expansion signal to compute from. Rather than fabricate one, `netRevenueRetention()` accepts an explicit `expansionArr` parameter (defaulting to 0) so the two metrics are numerically identical until real expansion data exists, instead of quietly diverging based on an invented number.

## Why the synthetic dataset uses archetypes instead of independent random fields

Randomizing every field independently produces accounts where, say, usage is collapsing but support tickets, sentiment, and billing are all pristine. That's a much less realistic failure mode than the world actually produces. Generating from a small set of weighted archetypes (usage-decline, support-friction, compound-risk, and so on) means correlated signals move together, which is what makes the Churn Investigator's evidence read as coherent rather than as several unrelated facts glued together.
