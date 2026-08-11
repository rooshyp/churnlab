import { describe, expect, it } from "vitest";
import { suggestMapping } from "./mapping";
import { validateRows } from "./validate";

describe("suggestMapping", () => {
  it("maps aliased headers to canonical fields", () => {
    const headers = ["account_number", "customer_name", "annual_contract_value", "next_renewal", "weekly_active"];
    const mapping = suggestMapping(headers);
    expect(mapping.account_id).toBe("account_number");
    expect(mapping.company).toBe("customer_name");
    expect(mapping.arr).toBe("annual_contract_value");
    expect(mapping.renewal_date).toBe("next_renewal");
    expect(mapping.weekly_active_users).toBe("weekly_active");
  });

  it("leaves unmatched canonical fields unmapped rather than guessing", () => {
    const mapping = suggestMapping(["totally_unrelated_column"]);
    expect(mapping.arr).toBeNull();
    expect(mapping.company).toBeNull();
  });
});

const baseMapping = {
  account_id: "id",
  company: "name",
  arr: "arr",
  renewal_date: "renewal",
  industry: null,
  employees: null,
  tier: null,
  start_date: null,
  licensed_seats: "seats",
  active_users: "active",
  weekly_active_users: null,
  nps: "nps",
  open_tickets: null,
  severe_open_tickets: null,
  payment_status: null,
  owner: null,
};

describe("validateRows", () => {
  it("passes clean rows with no critical issues", () => {
    const rows = [{ id: "A1", name: "Acme", arr: "12000", renewal: "2026-12-01", seats: "20", active: "15", nps: "40" }];
    const result = validateRows(rows, baseMapping);
    expect(result.criticalCount).toBe(0);
    expect(result.canProceed).toBe(true);
    expect(result.rows[0].values.arr).toBe(12000);
  });

  it("flags missing required fields as Critical and blocks proceeding", () => {
    const rows = [{ id: "", name: "Acme", arr: "12000", renewal: "2026-12-01" }];
    const result = validateRows(rows, baseMapping);
    expect(result.criticalCount).toBeGreaterThan(0);
    expect(result.canProceed).toBe(false);
  });

  it("flags malformed numeric and date values", () => {
    const rows = [{ id: "A1", name: "Acme", arr: "not-a-number", renewal: "never" }];
    const result = validateRows(rows, baseMapping);
    expect(result.criticalCount).toBeGreaterThanOrEqual(2);
  });

  it("flags negative ARR as Critical", () => {
    const rows = [{ id: "A1", name: "Acme", arr: "-5000", renewal: "2026-12-01" }];
    const result = validateRows(rows, baseMapping);
    expect(result.issues.some((i) => i.message.includes("negative"))).toBe(true);
    expect(result.canProceed).toBe(false);
  });

  it("flags active users exceeding licensed seats as a Warning, not blocking", () => {
    const rows = [{ id: "A1", name: "Acme", arr: "12000", renewal: "2026-12-01", seats: "10", active: "25" }];
    const result = validateRows(rows, baseMapping);
    expect(result.issues.some((i) => i.message.includes("exceeds licensed seats"))).toBe(true);
    expect(result.canProceed).toBe(true);
  });

  it("flags duplicate account IDs as Critical", () => {
    const rows = [
      { id: "A1", name: "Acme", arr: "12000", renewal: "2026-12-01" },
      { id: "A1", name: "Acme Duplicate", arr: "8000", renewal: "2026-11-01" },
    ];
    const result = validateRows(rows, baseMapping);
    expect(result.issues.some((i) => i.message.includes("duplicate"))).toBe(true);
    expect(result.canProceed).toBe(false);
  });
});
