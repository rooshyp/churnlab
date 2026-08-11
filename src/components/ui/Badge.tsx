import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { PriorityTier, RiskLevel, Confidence } from "@/lib/data/types";
import { IssueSeverity } from "@/lib/quality/types";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap", className)} {...props} />;
}

function Dot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />;
}

const RISK_COLOR: Record<RiskLevel, string> = { High: "#dc2626", Medium: "#d97706", Low: "#059669" };
const RISK_TEXT: Record<RiskLevel, string> = { High: "text-red-700", Medium: "text-amber-700", Low: "text-emerald-700" };

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <Badge className={RISK_TEXT[risk]}>
      <Dot color={RISK_COLOR[risk]} />
      {risk} risk
    </Badge>
  );
}

const PRIORITY_STYLE: Record<PriorityTier, { text: string; bg?: string }> = {
  Critical: { text: "text-white", bg: "#0f172a" },
  High: { text: "text-orange-700" },
  Medium: { text: "text-amber-700" },
  Low: { text: "text-slate-500" },
};
const PRIORITY_DOT: Record<PriorityTier, string> = { Critical: "#dc2626", High: "#ea580c", Medium: "#d97706", Low: "#94a3b8" };

export function PriorityBadge({ tier }: { tier: PriorityTier }) {
  const style = PRIORITY_STYLE[tier];
  if (style.bg) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-semibold tracking-wide uppercase", style.text)}
        style={{ background: style.bg }}
      >
        {tier}
      </span>
    );
  }
  return (
    <Badge className={cn("font-semibold tracking-wide uppercase", style.text)}>
      <Dot color={PRIORITY_DOT[tier]} />
      {tier}
    </Badge>
  );
}

const CONFIDENCE_TEXT: Record<Confidence, string> = { High: "text-slate-600", Moderate: "text-slate-400", Low: "text-slate-400" };

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return <Badge className={cn("border-b border-dotted border-slate-300 pb-px", CONFIDENCE_TEXT[confidence])}>{confidence} confidence</Badge>;
}

const SEVERITY_COLOR: Record<IssueSeverity, string> = { Critical: "#dc2626", Warning: "#d97706", Informational: "#0284c7" };
const SEVERITY_TEXT: Record<IssueSeverity, string> = { Critical: "text-red-700", Warning: "text-amber-700", Informational: "text-sky-700" };

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return (
    <Badge className={cn("font-semibold tracking-wide uppercase", SEVERITY_TEXT[severity])}>
      <Dot color={SEVERITY_COLOR[severity]} />
      {severity}
    </Badge>
  );
}
