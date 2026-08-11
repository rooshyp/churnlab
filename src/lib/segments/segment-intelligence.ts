import { Account, HealthResult } from "../data/types";

export interface SegmentView {
  account: Account;
  health: HealthResult;
}

export interface SegmentStat {
  key: string;
  label: string;
  count: number;
  arr: number;
  avgHealthScore: number;
  highRiskCount: number;
  highRiskArr: number;
  avgAdoptionRate: number;
}

export type Dimension =
  | "tier"
  | "industry"
  | "arrTier"
  | "sizeBand"
  | "adoptionTier"
  | "ownerName";

function arrTierOf(arr: number): string {
  if (arr < 10_000) return "Under $10K";
  if (arr < 50_000) return "$10K–$50K";
  if (arr < 150_000) return "$50K–$150K";
  return "$150K+";
}

function sizeBandOf(employees: number): string {
  if (employees < 100) return "1–99 employees";
  if (employees < 1000) return "100–999 employees";
  return "1,000+ employees";
}

function adoptionTierOf(account: Account): string {
  const rate = account.current.coreFeaturesTotal > 0 ? account.current.coreFeaturesAdopted / account.current.coreFeaturesTotal : 0;
  if (rate < 0.35) return "Low adoption (<35%)";
  if (rate < 0.65) return "Mid adoption (35–65%)";
  return "High adoption (65%+)";
}

export function dimensionKey(account: Account, dimension: Dimension): string {
  switch (dimension) {
    case "tier":
      return account.tier;
    case "industry":
      return account.industry;
    case "arrTier":
      return arrTierOf(account.arr);
    case "sizeBand":
      return sizeBandOf(account.employees);
    case "adoptionTier":
      return adoptionTierOf(account);
    case "ownerName":
      return account.ownerName;
  }
}

export function segmentBy(views: SegmentView[], dimension: Dimension): SegmentStat[] {
  const groups = new Map<string, SegmentView[]>();
  for (const v of views) {
    const key = dimensionKey(v.account, dimension);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  }

  const stats: SegmentStat[] = [];
  for (const [key, group] of groups) {
    const arr = group.reduce((sum, v) => sum + Math.max(0, v.account.arr), 0);
    const avgHealthScore = group.reduce((sum, v) => sum + v.health.score, 0) / group.length;
    const highRisk = group.filter((v) => v.health.risk === "High");
    const avgAdoptionRate =
      group.reduce((sum, v) => {
        const t = v.account.current.coreFeaturesTotal;
        return sum + (t > 0 ? v.account.current.coreFeaturesAdopted / t : 0);
      }, 0) / group.length;

    stats.push({
      key,
      label: key,
      count: group.length,
      arr,
      avgHealthScore: Math.round(avgHealthScore * 10) / 10,
      highRiskCount: highRisk.length,
      highRiskArr: highRisk.reduce((sum, v) => sum + Math.max(0, v.account.arr), 0),
      avgAdoptionRate: Math.round(avgAdoptionRate * 1000) / 10,
    });
  }

  return stats.sort((a, b) => b.arr - a.arr);
}

/**
 * Produces plain-language findings derived directly from computed segment
 * statistics. Each finding is guarded by a minimum-difference and
 * minimum-sample-size threshold so the product never asserts a pattern the
 * data doesn't actually support — if a comparison doesn't clear the bar,
 * it is simply omitted rather than forced into prose.
 */
export function generateFindings(views: SegmentView[]): string[] {
  const findings: string[] = [];
  const MIN_LOGOS = 5;

  const byTier = segmentBy(views, "tier").filter((s) => s.count >= MIN_LOGOS);
  const enterprise = byTier.find((s) => s.key === "Enterprise");
  const starter = byTier.find((s) => s.key === "Starter");
  if (enterprise && starter) {
    const enterpriseRiskShare = enterprise.arr > 0 ? enterprise.highRiskArr / enterprise.arr : 0;
    const starterRiskShare = starter.arr > 0 ? starter.highRiskArr / starter.arr : 0;
    if (Math.abs(enterpriseRiskShare - starterRiskShare) >= 0.05) {
      const lower = enterpriseRiskShare < starterRiskShare ? "Enterprise" : "Starter";
      const revenuePerLogo = enterprise.count > 0 ? enterprise.arr / enterprise.count : 0;
      findings.push(
        `${lower} accounts carry a smaller share of at-risk revenue relative to their total ARR, but Enterprise logos represent ~$${Math.round(revenuePerLogo).toLocaleString()} ARR each — a single churn event carries far more revenue impact than in the Starter tier.`
      );
    }
  }

  const byAdoption = segmentBy(views, "adoptionTier").filter((s) => s.count >= MIN_LOGOS);
  const low = byAdoption.find((s) => s.key.startsWith("Low"));
  const high = byAdoption.find((s) => s.key.startsWith("High"));
  if (low && high && high.avgHealthScore - low.avgHealthScore >= 10) {
    findings.push(
      `Accounts with low core-feature adoption average a health score of ${low.avgHealthScore}, compared with ${high.avgHealthScore} for accounts with high adoption — a ${Math.round(high.avgHealthScore - low.avgHealthScore)}-point gap.`
    );
  }

  const byIndustry = segmentBy(views, "industry").filter((s) => s.count >= MIN_LOGOS);
  if (byIndustry.length >= 2) {
    const riskiest = [...byIndustry].sort((a, b) => a.avgHealthScore - b.avgHealthScore)[0];
    const healthiest = [...byIndustry].sort((a, b) => b.avgHealthScore - a.avgHealthScore)[0];
    if (riskiest.key !== healthiest.key && healthiest.avgHealthScore - riskiest.avgHealthScore >= 8) {
      findings.push(
        `${riskiest.key} has the lowest average health score among industries with at least ${MIN_LOGOS} accounts (${riskiest.avgHealthScore}), versus ${healthiest.avgHealthScore} for ${healthiest.key}.`
      );
    }
  }

  const bySize = segmentBy(views, "sizeBand").filter((s) => s.count >= MIN_LOGOS);
  const small = bySize.find((s) => s.key.startsWith("1–99"));
  const large = bySize.find((s) => s.key.startsWith("1,000"));
  if (small && large) {
    const smallRiskRate = small.count > 0 ? small.highRiskCount / small.count : 0;
    const largeRiskRate = large.count > 0 ? large.highRiskCount / large.count : 0;
    if (Math.abs(smallRiskRate - largeRiskRate) >= 0.1) {
      const higher = smallRiskRate > largeRiskRate ? "Smaller (1-99 employee)" : "Larger (1,000+ employee)";
      findings.push(`${higher} accounts show a higher rate of High-risk classification (${Math.round(Math.max(smallRiskRate, largeRiskRate) * 100)}% of logos in that band).`);
    }
  }

  return findings;
}
