import { RiskLevel } from "@/lib/data/types";

export const RISK_COLORS: Record<RiskLevel, string> = {
  High: "#dc2626",
  Medium: "#d97706",
  Low: "#059669",
};

export const HEALTH_BUCKET_COLOR = (bucketStart: number): string => {
  if (bucketStart < 40) return "#dc2626";
  if (bucketStart < 70) return "#d97706";
  return "#059669";
};
