import { InvestigatorSection as Section } from "@/lib/investigator/explain";
import { cn } from "@/lib/utils/cn";

const SEVERITY_COLOR: Record<Section["severity"], string> = {
  risk: "#dc2626",
  watch: "#d97706",
  none: "#94a3b8",
};

export function InvestigatorSectionCard({ section }: { section: Section }) {
  return (
    <div className="border-b border-slate-100 py-3.5 last:border-b-0">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: SEVERITY_COLOR[section.severity] }} />
        <h4 className="text-xs font-semibold tracking-wide text-slate-700 uppercase">{section.title}</h4>
      </div>
      <ul className={cn("space-y-1 pl-3.5 text-sm text-slate-600")}>
        {section.findings.map((f, i) => (
          <li key={i} className="list-disc marker:text-slate-300">
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
