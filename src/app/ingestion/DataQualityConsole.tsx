"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { QualityReport } from "@/lib/quality/data-quality";
import { IssueSeverity } from "@/lib/quality/types";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

const ALL = "All";

export function DataQualityConsole({ report, totalAccounts }: { report: QualityReport; totalAccounts: number }) {
  const [severityFilter, setSeverityFilter] = useState<string>(ALL);

  const filtered = useMemo(
    () => (severityFilter === ALL ? report.issues : report.issues.filter((i) => i.severity === severityFilter)),
    [report.issues, severityFilter]
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Live Portfolio Data Quality</CardTitle>
          <CardDescription>
            {report.accountsWithIssues} of {totalAccounts} active accounts have at least one data-quality issue. These are surfaced, not
            silently accepted — they still flow into scoring, with confidence reduced accordingly.
          </CardDescription>
        </div>
        <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value={ALL}>All severities ({report.issues.length})</option>
          <option value="Critical">Critical ({report.criticalCount})</option>
          <option value="Warning">Warning ({report.warningCount})</option>
          <option value="Informational">Informational ({report.infoCount})</option>
        </Select>
      </CardHeader>
      <CardBody className="p-0">
        {filtered.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No issues at this severity.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {filtered.map((issue) => (
              <li key={issue.id} className="flex items-start justify-between gap-4 px-5 py-2.5 text-sm">
                <div>
                  <SeverityBadge severity={issue.severity as IssueSeverity} />
                  <p className="mt-1 text-slate-700">
                    {issue.accountId ? (
                      <Link href={`/customers/${issue.accountId}`} className="font-medium hover:underline">
                        {issue.message}
                      </Link>
                    ) : (
                      issue.message
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-right text-xs text-slate-400">Affects: {issue.affects.join(", ")}</span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
