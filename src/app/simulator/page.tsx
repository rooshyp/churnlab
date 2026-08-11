import { PageHeader } from "@/components/ui/PageHeader";
import { getActiveAccounts } from "@/lib/data/dataset";
import { buildPortfolio } from "@/lib/metrics/portfolio";
import { toSimView } from "@/lib/simulator/scenario";
import { SimulatorPanel } from "./SimulatorPanel";

export default function SimulatorPage() {
  const views = buildPortfolio(getActiveAccounts());
  const simViews = views.map((v) => toSimView(v.account.id, v.account.company, v.priority.arrExposed, v.health));

  return (
    <div>
      <PageHeader
        title="What-If Retention Simulator"
        description="Explore hypothetical retention scenarios and their modeled impact on revenue. These are projections, not predictions."
      />
      <SimulatorPanel views={simViews} />
    </div>
  );
}
