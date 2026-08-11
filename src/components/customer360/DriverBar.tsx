import { HEALTH_WEIGHTS } from "@/lib/scoring/health-score";

const MAX_WEIGHTS: Record<string, number> = HEALTH_WEIGHTS;

export function DriverBar({ driverKey, label, deduction }: { driverKey: string; label: string; deduction: number }) {
  const max = MAX_WEIGHTS[driverKey] ?? 20;
  const pct = Math.min(100, Math.round((deduction / max) * 100));
  const color = pct >= 60 ? "#dc2626" : pct >= 30 ? "#d97706" : "#94a3b8";

  return (
    <div className="py-1.5">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-mono text-slate-400 tabular-nums">-{deduction.toFixed(1)}pt</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
