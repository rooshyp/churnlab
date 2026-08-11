import { Industry, PriorityTier, RiskLevel, Tier } from "@/lib/data/types";

export interface CommandCenterRow {
  id: string;
  company: string;
  industry: Industry;
  tier: Tier;
  ownerName: string;
  arr: number;
  healthScore: number;
  risk: RiskLevel;
  priorityTier: PriorityTier;
  priorityScore: number;
  daysToRenewal: number;
  renewalDate: string;
  rootCause: string;
  rootCauseKey: string;
  rootCauseCategory: string;
  suggestedAction: string;
}
