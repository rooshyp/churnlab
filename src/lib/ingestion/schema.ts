export type CanonicalType = "string" | "number" | "date";

export interface CanonicalField {
  key: string;
  label: string;
  required: boolean;
  type: CanonicalType;
  /** Alternate header spellings recognized during automatic column mapping */
  aliases: string[];
}

/**
 * Canonical ChurnLab account schema for CSV ingestion. Deliberately a flat
 * subset of the full internal Account model — ingestion is about getting a
 * usable, validated roster in quickly, not replicating every operational
 * field on day one.
 */
export const CANONICAL_FIELDS: CanonicalField[] = [
  { key: "account_id", label: "Account ID", required: true, type: "string", aliases: ["id", "customer_id", "account_number"] },
  { key: "company", label: "Company Name", required: true, type: "string", aliases: ["company_name", "customer", "customer_name", "name", "account_name"] },
  { key: "arr", label: "ARR", required: true, type: "number", aliases: ["annual_contract_value", "annual_recurring_revenue", "acv", "annual_revenue"] },
  { key: "renewal_date", label: "Renewal Date", required: true, type: "date", aliases: ["renewal", "contract_end", "contract_end_date", "next_renewal"] },
  { key: "industry", label: "Industry", required: false, type: "string", aliases: ["vertical", "sector"] },
  { key: "employees", label: "Employees", required: false, type: "number", aliases: ["company_size", "headcount", "employee_count"] },
  { key: "tier", label: "Plan / Tier", required: false, type: "string", aliases: ["plan", "package", "subscription_tier"] },
  { key: "start_date", label: "Start Date", required: false, type: "date", aliases: ["account_start", "created_at", "signup_date"] },
  { key: "licensed_seats", label: "Licensed Seats", required: false, type: "number", aliases: ["seats", "seat_count", "licenses"] },
  { key: "active_users", label: "Active Users", required: false, type: "number", aliases: ["monthly_active_users", "mau"] },
  { key: "weekly_active_users", label: "Weekly Active Users", required: false, type: "number", aliases: ["weekly_active", "wau"] },
  { key: "nps", label: "NPS", required: false, type: "number", aliases: ["nps_score", "satisfaction", "csat"] },
  { key: "open_tickets", label: "Open Tickets", required: false, type: "number", aliases: ["support_tickets", "open_ticket_count"] },
  { key: "severe_open_tickets", label: "Severe Open Tickets", required: false, type: "number", aliases: ["critical_tickets", "high_severity_tickets"] },
  { key: "payment_status", label: "Payment Status", required: false, type: "string", aliases: ["billing_status"] },
  { key: "owner", label: "Account Owner", required: false, type: "string", aliases: ["csm", "account_manager", "owner_name"] },
];

export const REQUIRED_FIELDS = CANONICAL_FIELDS.filter((f) => f.required).map((f) => f.key);
