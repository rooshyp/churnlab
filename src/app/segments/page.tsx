import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getActiveAccounts } from "@/lib/data/dataset";
import { buildPortfolio } from "@/lib/metrics/portfolio";
import { generateFindings, segmentBy, SegmentView } from "@/lib/segments/segment-intelligence";
import { SegmentsExplorer } from "./SegmentsExplorer";

export default function SegmentsPage() {
  const views: SegmentView[] = buildPortfolio(getActiveAccounts());
  const findings = generateFindings(views);

  const data = {
    tier: segmentBy(views, "tier"),
    industry: segmentBy(views, "industry"),
    arrTier: segmentBy(views, "arrTier"),
    sizeBand: segmentBy(views, "sizeBand"),
    adoptionTier: segmentBy(views, "adoptionTier"),
    ownerName: segmentBy(views, "ownerName"),
  };

  return (
    <div>
      <PageHeader title="Segment Intelligence" description="Compare health, risk, and revenue concentration across how the portfolio is sliced." />

      {findings.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <div>
              <CardTitle>Findings</CardTitle>
              <CardDescription>Generated from the current dataset. Each finding is only shown when the underlying comparison clears a minimum threshold.</CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm text-slate-700">
              {findings.map((f, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  {f}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <SegmentsExplorer data={data} />
        </CardBody>
      </Card>
    </div>
  );
}
