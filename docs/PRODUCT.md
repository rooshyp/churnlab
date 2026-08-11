# ChurnLab: Product

## Target users

- **Customer Success:** needs a daily queue of accounts to act on, not a dashboard to interpret.
- **Revenue Operations:** needs revenue exposure and retention metrics tied to pipeline and forecast conversations.
- **Product:** needs to know which product gaps (adoption, engagement) are actually costing revenue.
- **Account Management:** needs a single view of an account's commercial and product health before a renewal conversation.
- **SaaS leadership:** needs a portfolio-level read on where the business is exposed and whether that exposure is improving.

## Jobs to be done

1. **"Tell me which accounts need attention today."** Not a list of everyone, ranked by an arbitrary score. A short, defensible queue.
2. **"Tell me why."** A risk score without a reason isn't actionable. Every account needs a legible explanation.
3. **"Tell me what it's worth."** Risk without revenue context leads to misallocated attention. A 90%-risk, $2K account and a 40%-risk, $200K account are not equally urgent.
4. **"Tell me what changed."** Static state is less useful than movement. Knowing an account fell from a health score of 74 to 39 in a month is what actually triggers action.
5. **"Tell me what to do."** A risk classification without a next step just adds another dashboard to check.
6. **"Let me bring in my own data, and tell me if it's usable."** Real customer data is inconsistent. A product that assumes clean input isn't deployable.

## Major workflows

- **Morning triage**: open the Retention Command Center, work down the priority queue, open Customer 360 for the top few accounts.
- **Renewal prep**: open a specific account, review Churn Investigator and What Changed, decide on an action before the call.
- **Portfolio review**: open the Dashboard and Segments to understand where risk and revenue are concentrated, not account-by-account.
- **Planning a save motion**: open the What-If Simulator to estimate the revenue impact of a proposed intervention before committing resources to it.
- **Bringing in a new data source**: open Data Ingestion, map columns, resolve critical issues, review what landed.

## Value proposition

Churn-risk scores by themselves don't change what a team does on a Monday morning. ChurnLab's premise is that the same underlying signals (usage, adoption, support, sentiment, billing) are more useful once they're turned into an ordered list of who to talk to, why, and what the conversation is worth.

## Product principles

- **Actionable.** Every metric on screen should map to a decision. If it doesn't inform a decision, it doesn't belong on the page.
- **Explainable.** No score without a reason. Risk classification without evidence isn't trustworthy enough to act on.
- **Economically aware.** Risk and revenue are both first-class inputs to prioritization; neither dominates the other by default.
- **Operational.** The product should produce a queue, not just a report.
- **Data-quality conscious.** Real data is messy. Surfacing that is part of the product, not a failure state to hide.
- **Honest.** Confidence is reported, not assumed. Where the data doesn't support a claim, the product says so instead of rounding up.

## Success metrics (for this kind of product, in general)

These are the metrics a real deployment of ChurnLab would be judged on. This demo build doesn't measure them, since there's no live customer base behind it:

- Time from "account becomes risky" to "someone takes action."
- Share of at-risk revenue with an assigned owner and a next step.
- Forecast accuracy of revenue-at-risk against actual churned revenue over a quarter.
- Reduction in surprise churn: accounts that leave without having appeared in the priority queue beforehand.
