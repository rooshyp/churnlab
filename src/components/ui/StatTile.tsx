import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface StatTileProps {
  label: string;
  value: string;
  helpText?: string;
  trend?: { value: string; direction: "up" | "down" | "flat"; goodDirection?: "up" | "down" };
  icon?: ReactNode;
}

export function StatTile({ label, value, helpText, trend, icon }: StatTileProps) {
  let trendColor = "text-slate-400";
  if (trend && trend.direction !== "flat") {
    const isGood = trend.direction === (trend.goodDirection ?? "up");
    trendColor = isGood ? "text-emerald-600" : "text-red-600";
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">{label}</span>
        {icon}
      </div>
      <div className="mt-1.5 font-mono text-[1.65rem] leading-none font-semibold tracking-tight text-slate-900 tabular-nums">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {trend && <span className={cn("font-medium tabular-nums", trendColor)}>{trend.value}</span>}
        {helpText && <span className="text-slate-400">{helpText}</span>}
      </div>
    </div>
  );
}
