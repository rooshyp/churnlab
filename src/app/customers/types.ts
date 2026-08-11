import { Industry, RiskLevel, Tier } from "@/lib/data/types";

export interface CustomerRow {
  id: string;
  company: string;
  industry: Industry;
  tier: Tier;
  ownerName: string;
  arr: number;
  healthScore: number;
  risk: RiskLevel;
  daysToRenewal: number;
  renewalDate: string;
}
