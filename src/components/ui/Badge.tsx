import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { PriorityTier, RiskLevel, Confidence } from "@/lib/data/types";
import { IssueSeverity } from "@/lib/quality/types";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

const RISK_STYLES: Record<RiskLevel, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <Badge className={RISK_STYLES[risk]}>{risk} risk</Badge>;
}

const PRIORITY_STYLES: Record<PriorityTier, string> = {
  Critical: "bg-red-600 text-white border-red-600",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

export function PriorityBadge({ tier }: { tier: PriorityTier }) {
  return <Badge className={PRIORITY_STYLES[tier]}>{tier}</Badge>;
}

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  High: "bg-slate-100 text-slate-700 border-slate-200",
  Moderate: "bg-slate-100 text-slate-500 border-slate-200",
  Low: "bg-slate-100 text-slate-400 border-slate-200",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return <Badge className={CONFIDENCE_STYLES[confidence]}>{confidence} confidence</Badge>;
}

const SEVERITY_STYLES: Record<IssueSeverity, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  Warning: "bg-amber-50 text-amber-700 border-amber-200",
  Informational: "bg-sky-50 text-sky-700 border-sky-200",
};

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return <Badge className={SEVERITY_STYLES[severity]}>{severity}</Badge>;
}
