import { PageHeader } from "@/components/ui/PageHeader";
import { getActiveAccounts } from "@/lib/data/dataset";
import { analyzeDatasetQuality } from "@/lib/quality/data-quality";
import { IngestionWizard } from "./IngestionWizard";
import { DataQualityConsole } from "./DataQualityConsole";

export default function IngestionPage() {
  const active = getActiveAccounts();
  const report = analyzeDatasetQuality(active);

  return (
    <div>
      <PageHeader
        title="Data Ingestion & Quality"
        description="Upload a CSV of customer accounts, and monitor data quality across the live portfolio. Messy or incomplete data is surfaced, never silently accepted."
      />
      <div className="mb-8">
        <DataQualityConsole report={report} totalAccounts={active.length} />
      </div>
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Import New Data</h2>
      <IngestionWizard />
    </div>
  );
}
