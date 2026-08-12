"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  reduceChurnAmongHighValue,
  retainTopNAtRisk,
  revenueAtRisk,
  SimAccountView,
  usageRecoveryImpact,
} from "@/lib/simulator/scenario";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { formatCurrency } from "@/lib/utils/format";

const ARR_THRESHOLDS = [10_000, 50_000, 100_000, 150_000];

export function SimulatorPanel({ views }: { views: SimAccountView[] }) {
  const baselineRevenueAtRisk = useMemo(() => revenueAtRisk(views), [views]);
  const highRiskCount = useMemo(() => views.filter((v) => v.risk === "High").length, [views]);

  const [threshold, setThreshold] = useState(50_000);
  const [reductionPct, setReductionPct] = useState(20);
  const scenarioA = useMemo(() => reduceChurnAmongHighValue(views, threshold, reductionPct), [views, threshold, reductionPct]);

  const [topN, setTopN] = useState(5);
  const scenarioB = useMemo(() => retainTopNAtRisk(views, topN), [views, topN]);

  const [recoveredAccounts, setRecoveredAccounts] = useState(Math.min(10, highRiskCount));
  const scenarioC = useMemo(() => usageRecoveryImpact(views, recoveredAccounts), [views, recoveredAccounts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Scenario: Reduce churn among high-value at-risk accounts</CardTitle>
              <CardDescription>
                Models the effect of cutting churn incidence by a given percentage among High-risk accounts at or above an ARR threshold.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                ARR threshold
                <Select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}>
                  {ARR_THRESHOLDS.map((t) => (
                    <option key={t} value={t}>
                      {formatCurrency(t, { compact: true })}+
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-1 items-center gap-3 text-sm text-slate-600">
                Churn reduction
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={reductionPct}
                  onChange={(e) => setReductionPct(Number(e.target.value))}
                  className="flex-1 accent-slate-800"
                />
                <span className="w-10 font-mono text-slate-900 tabular-nums">{reductionPct}%</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <ResultTile label="Accounts in pool" value={String(scenarioA.accountsInPool)} />
              <ResultTile label="Pool ARR at risk" value={formatCurrency(scenarioA.poolArr, { compact: true })} />
              <ResultTile label="Est. ARR retained" value={formatCurrency(scenarioA.arrRetained, { compact: true })} emphasize />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Scenario: Retain the N highest-value at-risk accounts</CardTitle>
              <CardDescription>Deterministic: sums ARR for the top N accounts by ARR among Medium and High risk, contingent on all N being saved.</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <div className="mb-4 flex items-center gap-3 text-sm text-slate-600">
              Number of accounts (N)
              <input
                type="range"
                min={1}
                max={20}
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="flex-1 accent-slate-800"
              />
              <span className="w-8 font-mono text-slate-900 tabular-nums">{topN}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <ResultTile label="Accounts selected" value={String(scenarioB.accounts.length)} />
              <ResultTile label="Est. ARR retained" value={formatCurrency(scenarioB.arrRetained, { compact: true })} emphasize />
            </div>
            {scenarioB.accounts.length > 0 && (
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto border-t border-slate-100 pt-3 text-xs text-slate-600">
                {scenarioB.accounts.map((a) => (
                  <li key={a.id} className="flex justify-between">
                    <Link href={`/customers/${a.id}`} className="hover:underline">
                      {a.company}
                    </Link>
                    <span className="font-mono tabular-nums">{formatCurrency(a.arr, { compact: true })}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Scenario: Usage recovery moves accounts from High to Medium risk</CardTitle>
            <CardDescription>
              Simulates a +20 point health-score recovery for the worst-scoring High-risk accounts and shows the resulting change in
              risk-weighted Revenue at Risk (High counts in full, Medium at 40%).
            </CardDescription>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mb-4 flex items-center gap-3 text-sm text-slate-600">
            Accounts recovering ({highRiskCount} currently High risk)
            <input
              type="range"
              min={0}
              max={Math.max(1, highRiskCount)}
              value={recoveredAccounts}
              onChange={(e) => setRecoveredAccounts(Number(e.target.value))}
              className="flex-1 accent-slate-800"
            />
            <span className="w-8 font-mono text-slate-900 tabular-nums">{recoveredAccounts}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <ResultTile label="Revenue at risk (before)" value={formatCurrency(scenarioC.before, { compact: true })} />
            <ResultTile label="Revenue at risk (after)" value={formatCurrency(scenarioC.after, { compact: true })} />
            <ResultTile label="Reduction" value={formatCurrency(scenarioC.arrReduction, { compact: true })} emphasize />
          </div>
        </CardBody>
      </Card>

      <p className="text-xs text-slate-400">
        Baseline risk-weighted Revenue at Risk today: {formatCurrency(baselineRevenueAtRisk, { compact: true })}. All figures above are modeled
        scenario estimates based on documented assumptions (see docs/METRICS.md), not observed outcomes or guarantees.
      </p>
    </div>
  );
}

function ResultTile({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={"rounded-md border border-slate-200 py-3" + (emphasize ? " bg-slate-50" : "")}>
      <div className="font-mono text-lg font-semibold tabular-nums text-slate-900">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
