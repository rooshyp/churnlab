import { DataQualityIssue } from "../quality/types";
import { CANONICAL_FIELDS } from "./schema";

export type CanonicalValue = string | number | null;

export interface ValidatedRow {
  rowIndex: number; // 1-indexed, matches the row's position in the uploaded file (excluding header)
  values: Record<string, CanonicalValue>;
  hasCriticalIssue: boolean;
}

export interface ValidationSummary {
  rows: ValidatedRow[];
  issues: DataQualityIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  canProceed: boolean;
}

function isBlank(v: string | undefined): boolean {
  return v === undefined || v.trim() === "";
}

function parseNumberLoose(v: string): number | null {
  const cleaned = v.replace(/[$,%,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDateLoose(v: string): string | null {
  const t = Date.parse(v);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

export function validateRows(rawRows: Record<string, string>[], mapping: Record<string, string | null>): ValidationSummary {
  const issues: DataQualityIssue[] = [];
  const rows: ValidatedRow[] = [];
  const seenIds = new Map<string, number>(); // account_id -> first row index
  let issueSeq = 0;
  const nextId = () => `issue-${++issueSeq}`;

  rawRows.forEach((raw, i) => {
    const rowIndex = i + 1;
    const values: Record<string, CanonicalValue> = {};
    let hasCriticalIssue = false;

    for (const field of CANONICAL_FIELDS) {
      const header = mapping[field.key];
      const rawValue = header ? raw[header] : undefined;
      const blank = isBlank(rawValue);

      if (blank) {
        values[field.key] = null;
        if (field.required) {
          hasCriticalIssue = true;
          issues.push({
            id: nextId(),
            severity: "Critical",
            message: `Row ${rowIndex}: missing required field "${field.label}"`,
            affects: ["churn scoring", "revenue exposure", "prioritization"],
            row: rowIndex,
            field: field.key,
          });
        }
        continue;
      }

      if (field.type === "number") {
        const n = parseNumberLoose(rawValue!);
        if (n === null) {
          hasCriticalIssue = field.required;
          issues.push({
            id: nextId(),
            severity: field.required ? "Critical" : "Warning",
            message: `Row ${rowIndex}: "${field.label}" value "${rawValue}" is not a valid number`,
            affects: field.key === "arr" ? ["revenue exposure", "prioritization"] : ["churn scoring", "confidence"],
            row: rowIndex,
            field: field.key,
          });
          values[field.key] = null;
        } else {
          values[field.key] = n;
          if (field.key === "arr" && n < 0) {
            hasCriticalIssue = true;
            issues.push({
              id: nextId(),
              severity: "Critical",
              message: `Row ${rowIndex}: ARR is negative ($${n.toLocaleString()}) — revenue cannot be negative`,
              affects: ["revenue exposure", "prioritization"],
              row: rowIndex,
              field: "arr",
            });
          }
          if (field.key === "nps" && (n < -100 || n > 100)) {
            issues.push({
              id: nextId(),
              severity: "Warning",
              message: `Row ${rowIndex}: NPS of ${n} is outside the valid -100 to 100 range`,
              affects: ["churn scoring", "confidence"],
              row: rowIndex,
              field: "nps",
            });
          }
          if ((field.key === "employees" || field.key === "licensed_seats") && n < 0) {
            issues.push({
              id: nextId(),
              severity: "Warning",
              message: `Row ${rowIndex}: "${field.label}" cannot be negative`,
              affects: ["confidence"],
              row: rowIndex,
              field: field.key,
            });
          }
        }
      } else if (field.type === "date") {
        const d = parseDateLoose(rawValue!);
        if (d === null) {
          hasCriticalIssue = field.required;
          issues.push({
            id: nextId(),
            severity: field.required ? "Critical" : "Warning",
            message: `Row ${rowIndex}: "${field.label}" value "${rawValue}" is not a recognizable date`,
            affects: ["prioritization", "confidence"],
            row: rowIndex,
            field: field.key,
          });
          values[field.key] = null;
        } else {
          values[field.key] = d;
          if (field.key === "start_date" && new Date(d) > new Date()) {
            issues.push({
              id: nextId(),
              severity: "Warning",
              message: `Row ${rowIndex}: account start date "${d}" is in the future`,
              affects: ["confidence"],
              row: rowIndex,
              field: "start_date",
            });
          }
          if (field.key === "renewal_date" && new Date(d) < new Date()) {
            issues.push({
              id: nextId(),
              severity: "Warning",
              message: `Row ${rowIndex}: renewal date "${d}" is in the past — confirm this account isn't already closed`,
              affects: ["prioritization"],
              row: rowIndex,
              field: "renewal_date",
            });
          }
        }
      } else {
        values[field.key] = rawValue!.trim();
      }
    }

    const activeUsers = values["active_users"];
    const seats = values["licensed_seats"];
    if (typeof activeUsers === "number" && typeof seats === "number" && activeUsers > seats) {
      issues.push({
        id: nextId(),
        severity: "Warning",
        message: `Row ${rowIndex}: active users (${activeUsers}) exceeds licensed seats (${seats})`,
        affects: ["churn scoring", "confidence"],
        row: rowIndex,
        field: "active_users",
      });
    }

    const accountId = values["account_id"];
    if (typeof accountId === "string" && accountId.length > 0) {
      if (seenIds.has(accountId)) {
        hasCriticalIssue = true;
        issues.push({
          id: nextId(),
          severity: "Critical",
          message: `Row ${rowIndex}: duplicate Account ID "${accountId}" (first seen at row ${seenIds.get(accountId)})`,
          affects: ["prioritization", "confidence"],
          row: rowIndex,
          field: "account_id",
        });
      } else {
        seenIds.set(accountId, rowIndex);
      }
    }

    rows.push({ rowIndex, values, hasCriticalIssue });
  });

  const criticalCount = issues.filter((i) => i.severity === "Critical").length;
  const warningCount = issues.filter((i) => i.severity === "Warning").length;
  const infoCount = issues.filter((i) => i.severity === "Informational").length;

  return { rows, issues, criticalCount, warningCount, infoCount, canProceed: criticalCount === 0 };
}
