# ChurnLab: Roadmap

## Now

- Calibrate health-score weights against real retained/churned outcome data, once a deployment has enough history to calibrate against.
- Persist ingested CSV data into the live portfolio (today, an uploaded file validates and previews but doesn't merge into the accounts the rest of the product reads from).
- Track billing status historically, so What Changed can attribute a billing-driven score delta correctly instead of assuming today's status held 30 days ago.

## Next

- Real expansion/contraction tracking per account (seat count and plan tier over time), so Net Revenue Retention can diverge meaningfully from Gross Revenue Retention instead of being numerically identical.
- Saved views and default filters in the Command Center, so a CSM's "my accounts, sorted by priority" doesn't need to be rebuilt every session.
- Exportable priority queue (CSV/PDF) for teams that run their retention motion partly outside the product.
- User-editable health-score weights from the UI, rather than a code constant, with a preview of how reweighting shifts the current queue before committing to it.

## Later

- Interpretable statistical model (e.g. logistic regression) trained on historical outcomes as a supplement to the deterministic score, with honestly reported evaluation metrics and no claim of certainty beyond what holdout performance supports.
- Multi-user roles and account ownership assignment, so "suggested action" can become "assigned action" with accountability.
- Integration layer for real usage/billing/support data sources, replacing the synthetic generator without changing anything downstream (the architecture already treats the dataset as swappable; see `docs/ARCHITECTURE.md`).
- Historical trend charts beyond the current 30-day comparison, once there's a real time-series store behind the account model.
