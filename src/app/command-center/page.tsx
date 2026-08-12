import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { getActiveAccounts } from "@/lib/data/dataset";
import { buildPortfolio } from "@/lib/metrics/portfolio";
import { buildRecommendations } from "@/lib/actions/action-engine";
import { DRIVER_SUMMARY_PHRASE } from "@/lib/investigator/explain";
import { CommandCenterTable } from "./CommandCenterTable";
import { CommandCenterRow } from "./types";

function rootCauseCategory(key: string): string {
  if (key === "none") return "No material risk driver";
  const phrase = DRIVER_SUMMARY_PHRASE[key] ?? key;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export default function CommandCenterPage() {
  const views = buildPortfolio(getActiveAccounts());

  const rows: CommandCenterRow[] = views.map(({ account, health, priority }) => {
    const topDriver = health.drivers[0];
    const recommendations = buildRecommendations(account, health, priority);
    return {
      id: account.id,
      company: account.company,
      industry: account.industry,
      tier: account.tier,
      ownerName: account.ownerName,
      arr: priority.arrExposed,
      healthScore: health.score,
      risk: health.risk,
      priorityTier: priority.tier,
      priorityScore: priority.priorityScore,
      daysToRenewal: priority.daysToRenewal,
      renewalDate: account.renewalDate,
      rootCause: topDriver ? topDriver.label : "No material risk driver",
      rootCauseKey: topDriver ? topDriver.key : "none",
      rootCauseCategory: rootCauseCategory(topDriver ? topDriver.key : "none"),
      suggestedAction: recommendations[0]?.action ?? "Continue standard cadence",
    };
  });

  return (
    <div>
      <PageHeader
        title="Retention Command Center"
        description="Every active account, ranked by economic priority, not risk alone, so the highest-stakes work surfaces first."
      />
      <Card>
        <CardBody>
          <CommandCenterTable rows={rows} />
        </CardBody>
      </Card>
    </div>
  );
}
