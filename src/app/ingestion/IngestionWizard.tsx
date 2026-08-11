"use client";

import { useMemo, useRef, useState } from "react";
import { parseCsv, ParsedCsv } from "@/lib/ingestion/csv";
import { suggestMapping } from "@/lib/ingestion/mapping";
import { CANONICAL_FIELDS } from "@/lib/ingestion/schema";
import { validateRows, ValidationSummary } from "@/lib/ingestion/validate";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SeverityBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";

type Step = "upload" | "map" | "review" | "done";

const NOT_MAPPED = "";

export function IngestionWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadCsvText(text: string, name: string) {
    const parsed = parseCsv(text);
    if (parsed.headers.length === 0) {
      setLoadError("This file doesn't look like a CSV with a header row. Check the file and try again.");
      return;
    }
    setLoadError(null);
    setFileName(name);
    setCsv(parsed);
    setMapping(suggestMapping(parsed.headers));
    setStep("map");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadCsvText(String(reader.result ?? ""), file.name);
    reader.onerror = () => setLoadError("Could not read that file.");
    reader.readAsText(file);
  }

  async function loadSample() {
    try {
      const res = await fetch("/sample-data/churnlab-sample-messy.csv");
      const text = await res.text();
      loadCsvText(text, "churnlab-sample-messy.csv (synthetic demo file)");
    } catch {
      setLoadError("Could not load the sample file.");
    }
  }

  const validation: ValidationSummary | null = useMemo(() => {
    if (!csv) return null;
    return validateRows(csv.rows, mapping);
  }, [csv, mapping]);

  function reset() {
    setStep("upload");
    setFileName(null);
    setCsv(null);
    setMapping({});
    setLoadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <Steps current={step} />

      {step === "upload" && (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Upload a customer/account CSV</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  Any export works — column names don&apos;t need to match ChurnLab&apos;s schema. You&apos;ll map columns on the next step.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                  Choose CSV file
                </Button>
                <Button variant="secondary" onClick={loadSample}>
                  Load synthetic sample file
                </Button>
              </div>
              {loadError && <p className="text-sm text-red-600">{loadError}</p>}
            </div>
          </CardBody>
        </Card>
      )}

      {step === "map" && csv && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Map columns</CardTitle>
              <CardDescription>
                {fileName} · {csv.rows.length} rows · {csv.headers.length} columns. Confidently-matched fields are pre-filled — review and adjust as needed.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {CANONICAL_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-slate-700">
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  <Select
                    value={mapping[field.key] ?? NOT_MAPPED}
                    onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value === NOT_MAPPED ? null : e.target.value }))}
                    className="w-48"
                  >
                    <option value={NOT_MAPPED}>— Not mapped —</option>
                    {csv.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Preview (first 5 rows, raw)</p>
              <div className="scrollbar-thin overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      {csv.headers.map((h) => (
                        <th key={h} className="px-2.5 py-1.5 text-left font-medium text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csv.rows.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        {csv.headers.map((h) => (
                          <td key={h} className="px-2.5 py-1.5 whitespace-nowrap text-slate-600">
                            {r[h] || <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex justify-between">
              <Button variant="ghost" onClick={reset}>
                Start over
              </Button>
              <Button variant="primary" onClick={() => setStep("review")}>
                Validate {csv.rows.length} rows →
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === "review" && csv && validation && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <IssueCountTile severity="Critical" count={validation.criticalCount} />
            <IssueCountTile severity="Warning" count={validation.warningCount} />
            <IssueCountTile severity="Informational" count={validation.infoCount} />
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Data quality issues</CardTitle>
                <CardDescription>Critical issues must be resolved (fix the source file or remap columns) before you can continue.</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {validation.issues.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">No issues found — this file is clean.</p>
              ) : (
                <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                  {validation.issues.map((issue) => (
                    <li key={issue.id} className="flex items-start justify-between gap-4 px-5 py-2.5 text-sm">
                      <div>
                        <SeverityBadge severity={issue.severity} />
                        <p className="mt-1 text-slate-700">{issue.message}</p>
                      </div>
                      <span className="shrink-0 text-right text-xs text-slate-400">Affects: {issue.affects.join(", ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Parsed rows</CardTitle>
                <CardDescription>{validation.rows.length} rows parsed using the current column mapping</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-medium text-slate-500">Row</th>
                      {CANONICAL_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                        <th key={f.key} className="px-3 py-1.5 text-left font-medium text-slate-500">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validation.rows.map((row) => (
                      <tr key={row.rowIndex} className={cn(row.hasCriticalIssue && "bg-red-50/60")}>
                        <td className="px-3 py-1.5 font-mono text-slate-400 tabular-nums">{row.rowIndex}</td>
                        {CANONICAL_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                          <td key={f.key} className="px-3 py-1.5 whitespace-nowrap text-slate-700">
                            {row.values[f.key] === null ? <span className="text-red-400">missing</span> : String(row.values[f.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("map")}>
              ← Back to mapping
            </Button>
            <Button variant="primary" disabled={!validation.canProceed} onClick={() => setStep("done")}>
              {validation.canProceed ? `Continue with ${validation.rows.length} accounts →` : `Resolve ${validation.criticalCount} critical issue(s) to continue`}
            </Button>
          </div>
        </>
      )}

      {step === "done" && validation && (
        <Card>
          <CardBody>
            <EmptyState
              title="Ready for analysis"
              description={`${validation.rows.length} accounts passed validation${validation.warningCount > 0 ? ` with ${validation.warningCount} warning(s) that may reduce scoring confidence` : ""}. In a connected deployment, this roster would now feed the health scoring and prioritization engines alongside the existing portfolio.`}
              action={
                <Button variant="primary" onClick={reset}>
                  Import another file
                </Button>
              }
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "1. Upload" },
    { key: "map", label: "2. Map columns" },
    { key: "review", label: "3. Validate" },
    { key: "done", label: "4. Analyze" },
  ];
  const order: Step[] = ["upload", "map", "review", "done"];
  const currentIndex = order.indexOf(current);

  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span className={cn("font-medium", i <= currentIndex ? "text-slate-900" : "text-slate-300")}>{s.label}</span>
          {i < steps.length - 1 && <span className="text-slate-200">—</span>}
        </div>
      ))}
    </div>
  );
}

function IssueCountTile({ severity, count }: { severity: "Critical" | "Warning" | "Informational"; count: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <SeverityBadge severity={severity} />
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">{count}</div>
    </div>
  );
}
