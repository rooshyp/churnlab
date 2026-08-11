import { PageHeader } from "@/components/ui/PageHeader";
import { IngestionWizard } from "./IngestionWizard";

export default function IngestionPage() {
  return (
    <div>
      <PageHeader
        title="Data Ingestion"
        description="Upload a CSV of customer accounts. ChurnLab maps columns to its schema, validates every row, and surfaces data-quality issues before anything is analyzed."
      />
      <IngestionWizard />
    </div>
  );
}
