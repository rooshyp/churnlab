import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { getActiveAccounts } from "@/lib/data/dataset";
import { buildPortfolio } from "@/lib/metrics/portfolio";
import { CustomersTable } from "./CustomersTable";
import { CustomerRow } from "./types";

export default function CustomersPage() {
  const views = buildPortfolio(getActiveAccounts());

  const rows: CustomerRow[] = views.map(({ account, health, priority }) => ({
    id: account.id,
    company: account.company,
    industry: account.industry,
    tier: account.tier,
    ownerName: account.ownerName,
    arr: priority.arrExposed,
    healthScore: health.score,
    risk: health.risk,
    daysToRenewal: priority.daysToRenewal,
    renewalDate: account.renewalDate,
  }));

  return (
    <div>
      <PageHeader title="Customers" description="Every active account in the portfolio. Open one for a full health, risk, and investigation view." />
      <Card>
        <CardBody>
          <CustomersTable rows={rows} />
        </CardBody>
      </Card>
    </div>
  );
}
