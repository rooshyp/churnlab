export type IssueSeverity = "Critical" | "Warning" | "Informational";

export type AffectedArea = "churn scoring" | "revenue exposure" | "prioritization" | "confidence";

export interface DataQualityIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
  affects: AffectedArea[];
  /** Row number (1-indexed, excluding header) for ingestion issues */
  row?: number;
  accountId?: string;
  field?: string;
}
