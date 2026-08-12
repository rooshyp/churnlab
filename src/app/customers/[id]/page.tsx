import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccountById, getActiveAccounts } from "@/lib/data/dataset";
import { buildPortfolio } from "@/lib/metrics/portfolio";
import { investigate } from "@/lib/investigator/explain";
import { computeWhatChanged } from "@/lib/investigator/what-changed";
import { buildRecommendations } from "@/lib/actions/action-engine";
import { computeActionValue } from "@/lib/actions/action-value";
import { daysUntil } from "@/lib/metrics/saas-metrics";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskBadge, PriorityBadge, ConfidenceBadge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { DriverBar } from "@/components/customer360/DriverBar";
import { InvestigatorSectionCard } from "@/components/customer360/InvestigatorSection";
import { formatCurrency, formatDate, formatPercent, formatRelativeDays } from "@/lib/utils/format";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = getAccountById(id);
  if (!account || account.status !== "active") notFound();

  // Priority tiers are percentile-based within the portfolio, so this reuses
  // the same cached portfolio computation as the dashboard and command
  // center rather than re-deriving a tier from a single-account view.
  const portfolio = buildPortfolio(getActiveAccounts());
  const view = portfolio.find((v) => v.account.id === account.id)!;
  const { health, priority } = view;

  const investigation = investigate(account, health);
  const whatChanged = computeWhatChanged(account);
  const recommendations = buildRecommendations(account, health, priority);

  const daysToRenewal = daysUntil(account.renewalDate);
  const seatUtilization = account.current.licensedSeats > 0 ? Math.round((account.current.activeUsers / account.current.licensedSeats) * 100) : 0;
  const accountAgeDays = Math.max(0, -daysUntil(account.startDate));
  const accountAgeYears = (accountAgeDays / 365).toFixed(1);

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/customers" className="hover:text-slate-600 hover:underline">
          Customers
        </Link>
        <span>/</span>
        <span>{account.id}</span>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{account.company}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {account.industry} · {account.tier} · {account.contractType} · {account.region} · Owner {account.ownerName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge risk={health.risk} />
          <PriorityBadge tier={priority.tier} />
          <ConfidenceBadge confidence={health.confidence} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatTile label="ARR" value={formatCurrency(priority.arrExposed, { compact: true })} helpText={`${formatCurrency(priority.mrrExposed, { compact: true })}/mo`} />
        <StatTile label="Health Score" value={String(health.score)} helpText="out of 100" />
        <StatTile label="Priority Score" value={String(priority.priorityScore)} helpText={priority.tier} />
        <StatTile label="Seat Utilization" value={formatPercent(seatUtilization)} helpText={`${account.current.activeUsers} / ${account.current.licensedSeats} seats`} />
        <StatTile label="Renewal" value={formatRelativeDays(daysToRenewal)} helpText={formatDate(account.renewalDate)} />
        <StatTile label="Account Age" value={`${accountAgeYears}y`} helpText={`since ${formatDate(account.startDate)}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Churn Investigator</CardTitle>
                <CardDescription>Why {account.company} is classified the way it is, built directly from account data.</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <p className="mb-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{investigation.summary}</p>
              <div>
                {investigation.sections.map((s) => (
                  <InvestigatorSectionCard key={s.key} section={s} />
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recommended Actions</CardTitle>
                <CardDescription>Root-cause-driven playbook, with a transparent cost-vs-exposure comparison. Not a guarantee of outcome.</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {recommendations.map((rec, i) => {
                const value = computeActionValue(rec.action, priority.arrExposed);
                return (
                  <div key={i} className="rounded-lg border border-slate-200 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{rec.action}</h4>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium tracking-wide text-slate-600 uppercase">{rec.urgency}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{rec.objective}</p>
                    <p className="mt-1 text-xs text-slate-400">Evidence: {rec.evidence.join("; ")}</p>
                    {value.estimatedCost > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-4 border-t border-slate-100 pt-2.5 text-xs">
                        <span className="text-slate-500">
                          Est. cost <span className="font-mono font-medium text-slate-800 tabular-nums">{formatCurrency(value.estimatedCost)}</span>
                        </span>
                        <span className="text-slate-500">
                          ARR exposed <span className="font-mono font-medium text-slate-800 tabular-nums">{formatCurrency(value.potentialRevenueExposed, { compact: true })}</span>
                        </span>
                        {value.exposureToCostRatio !== null && (
                          <span className="text-slate-500">
                            Exposure / cost <span className="font-mono font-medium text-slate-800 tabular-nums">{value.exposureToCostRatio}×</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Health Drivers</CardTitle>
                <CardDescription>Deductions from the 100-point baseline</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              {health.drivers.length === 0 ? (
                <p className="text-sm text-slate-500">No material deductions. This account is healthy.</p>
              ) : (
                health.drivers.map((d) => <DriverBar key={d.key} driverKey={d.key} label={d.label} deduction={d.deduction} />)
              )}
              <p className="mt-2 text-xs text-slate-400">{health.confidenceReasons.join("; ")}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>What Changed (30 days)</CardTitle>
                <CardDescription>Current snapshot vs. 30 days ago</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {whatChanged.metrics.map((m) => (
                    <tr key={m.key}>
                      <td className="px-4 py-2 text-xs text-slate-500">{m.label}</td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-slate-400 tabular-nums">{m.before}</td>
                      <td className="px-1 py-2 text-center text-xs text-slate-300">→</td>
                      <td
                        className={
                          "px-2 py-2 text-right font-mono text-xs font-medium tabular-nums " +
                          (m.direction === "worsened" ? "text-red-600" : m.direction === "improved" ? "text-emerald-600" : "text-slate-600")
                        }
                      >
                        {m.after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {whatChanged.biggestDeterioration && <p className="border-t border-slate-100 p-3.5 text-xs text-slate-600">{whatChanged.biggestDeterioration}</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Account Details</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <DetailRow label="Contract" value={account.contractType} />
              <DetailRow label="Plan" value={account.tier} />
              <DetailRow label="Employees" value={account.employees.toLocaleString()} />
              <DetailRow label="Started" value={formatDate(account.startDate)} />
              <DetailRow label="Payment status" value={account.billing.paymentStatus} />
              {account.billing.overdueInvoiceCount > 0 && (
                <DetailRow label="Overdue" value={`${account.billing.overdueInvoiceCount} invoice(s), ${formatCurrency(account.billing.overdueAmount)}`} />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
