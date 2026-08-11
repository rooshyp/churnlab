import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskBadge, PriorityBadge } from "@/components/ui/Badge";
import { RiskDonutChart } from "@/components/charts/RiskDonutChart";
import { ArrByRiskChart } from "@/components/charts/ArrByRiskChart";
import { RenewalsBarChart } from "@/components/charts/RenewalsBarChart";
import { HealthHistogramChart } from "@/components/charts/HealthHistogramChart";
import { getActiveAccounts, getChurnedAccounts } from "@/lib/data/dataset";
import { buildPortfolio } from "@/lib/metrics/portfolio";
import { buildDashboardSummary } from "@/lib/metrics/dashboard-summary";
import { daysUntil } from "@/lib/metrics/saas-metrics";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils/format";
import { HEALTH_BUCKET_COLOR, RISK_COLORS } from "@/lib/utils/colors";

export default function DashboardPage() {
  const active = getActiveAccounts();
  const churned = getChurnedAccounts();
  const views = buildPortfolio(active);
  const summary = buildDashboardSummary(active, churned, views);

  const riskCounts = { High: 0, Medium: 0, Low: 0 } as Record<"High" | "Medium" | "Low", number>;
  for (const v of views) riskCounts[v.health.risk]++;
  const riskDonutData = (["High", "Medium", "Low"] as const).map((r) => ({ name: `${r} risk`, value: riskCounts[r], color: RISK_COLORS[r] }));

  const arrByRisk = (["High", "Medium", "Low"] as const).map((r) => ({
    name: r,
    arr: views.filter((v) => v.health.risk === r).reduce((sum, v) => sum + Math.max(0, v.account.arr), 0),
    color: RISK_COLORS[r],
  }));

  const now = new Date();
  const monthBuckets: { month: string; arr: number; count: number }[] = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { month: d.toLocaleDateString("en-US", { month: "short" }), arr: 0, count: 0 };
  });
  for (const account of active) {
    const days = daysUntil(account.renewalDate);
    if (days < 0 || days > 182) continue;
    const renewal = new Date(account.renewalDate + "T00:00:00");
    const idx = (renewal.getFullYear() - now.getFullYear()) * 12 + (renewal.getMonth() - now.getMonth());
    if (idx >= 0 && idx < monthBuckets.length) {
      monthBuckets[idx].arr += Math.max(0, account.arr);
      monthBuckets[idx].count += 1;
    }
  }

  const healthBuckets = [0, 20, 40, 60, 80].map((start) => {
    const end = start + 20;
    const count = views.filter((v) => v.health.score >= start && v.health.score < (end === 100 ? 101 : end)).length;
    return { bucket: `${start}-${end === 100 ? 100 : end - 1}`, count, color: HEALTH_BUCKET_COLOR(start) };
  });

  const topPriority = [...views]
    .filter((v) => v.priority.tier === "Critical" || v.priority.tier === "High")
    .sort((a, b) => b.priority.priorityScore - a.priority.priorityScore)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Portfolio health, revenue exposure, and where attention should go next. Synthetic demo data."
        actions={
          <Link href="/command-center" className="border-b border-slate-300 text-sm font-medium text-slate-700 hover:border-slate-900 hover:text-slate-900">
            Open Retention Command Center →
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total ARR" value={formatCurrency(summary.totalArr, { compact: true })} helpText={`${summary.totalAccounts} active accounts`} />
        <StatTile
          label="Revenue at Risk"
          value={formatCurrency(summary.weightedRevenueAtRisk, { compact: true })}
          helpText="Risk-weighted ARR exposure"
        />
        <StatTile
          label="High-Risk Accounts"
          value={String(summary.highRiskCount)}
          helpText={formatCurrency(summary.highRiskArr, { compact: true }) + " ARR"}
        />
        <StatTile
          label="Renewals (90d)"
          value={String(summary.renewals90d)}
          helpText={formatCurrency(summary.renewalArr90d, { compact: true }) + " ARR"}
        />
        <StatTile
          label="Logo Churn (90d)"
          value={formatPercent(summary.logoChurnRatePct, 1)}
          trend={{ value: "trailing 90 days", direction: "flat" }}
        />
        <StatTile
          label="Revenue Churn (90d)"
          value={formatPercent(summary.revenueChurnRatePct, 1)}
          trend={{ value: "trailing 90 days", direction: "flat" }}
        />
        <StatTile label="Gross Revenue Retention" value={formatPercent(summary.grossRevenueRetentionPct, 1)} />
        <StatTile label="Net Revenue Retention" value={formatPercent(summary.netRevenueRetentionPct, 1)} helpText="No expansion data modeled" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Active accounts by classified risk level</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-6">
              <div className="h-[220px] w-[220px] shrink-0">
                <RiskDonutChart data={riskDonutData} />
              </div>
              <div className="space-y-2 text-sm">
                {(["High", "Medium", "Low"] as const).map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLORS[r] }} />
                    <span className="text-slate-600">{r}</span>
                    <span className="font-medium text-slate-900">{riskCounts[r]}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>ARR by Risk Tier</CardTitle>
              <CardDescription>Where recurring revenue is concentrated</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <ArrByRiskChart data={arrByRisk} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming Renewals</CardTitle>
              <CardDescription>ARR renewing over the next 6 months</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <RenewalsBarChart data={monthBuckets} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Account Health Distribution</CardTitle>
              <CardDescription>Health score (0–100) across the portfolio</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <HealthHistogramChart data={healthBuckets} />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Top Priorities</CardTitle>
            <CardDescription>Highest-priority accounts right now, by economic exposure</CardDescription>
          </div>
          <Link href="/command-center" className="border-b border-slate-300 text-xs font-medium text-slate-600 hover:border-slate-900 hover:text-slate-900">
            View all →
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          <ul className="divide-y divide-slate-100">
            {topPriority.map((v) => (
              <li key={v.account.id}>
                <Link href={`/customers/${v.account.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{v.account.company}</p>
                    <p className="text-xs text-slate-500">
                      {v.account.industry} · Renews {formatDate(v.account.renewalDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(v.account.arr, { compact: true })}</span>
                    <RiskBadge risk={v.health.risk} />
                    <PriorityBadge tier={v.priority.tier} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
