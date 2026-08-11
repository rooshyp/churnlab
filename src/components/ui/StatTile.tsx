import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface StatTileProps {
  label: string;
  value: string;
  helpText?: string;
  trend?: { value: string; direction: "up" | "down" | "flat"; goodDirection?: "up" | "down" };
  icon?: ReactNode;
  emphasis?: boolean;
}

export function StatTile({ label, value, helpText, trend, icon, emphasis }: StatTileProps) {
  let trendColor = "text-slate-500";
  if (trend) {
    const isGood = trend.direction === (trend.goodDirection ?? "up");
    trendColor = trend.direction === "flat" ? "text-slate-500" : isGood ? "text-emerald-600" : "text-red-600";
  }

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4 shadow-sm", emphasis && "ring-1 ring-slate-900/5")}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {trend && (
          <span className={cn("font-medium", trendColor)}>
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.value}
          </span>
        )}
        {helpText && <span className="text-slate-400">{helpText}</span>}
      </div>
    </div>
  );
}
