"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CustomerRow } from "./types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Select, TextInput } from "@/components/ui/Select";
import { RiskBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, formatRelativeDays } from "@/lib/utils/format";

type SortKey = "company" | "arr" | "health" | "renewal";
const RISK_RANK = { High: 2, Medium: 1, Low: 0 } as const;
const ALL = "All";

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function CustomersTable({ rows }: { rows: CustomerRow[] }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState(ALL);
  const [industryFilter, setIndustryFilter] = useState(ALL);
  const [tierFilter, setTierFilter] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("arr");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const industries = useMemo(() => uniqueSorted(rows.map((r) => r.industry)), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.company.toLowerCase().includes(search.toLowerCase())) return false;
      if (riskFilter !== ALL && r.risk !== riskFilter) return false;
      if (industryFilter !== ALL && r.industry !== industryFilter) return false;
      if (tierFilter !== ALL && r.tier !== tierFilter) return false;
      return true;
    });
  }, [rows, search, riskFilter, industryFilter, tierFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
        case "arr":
          cmp = a.arr - b.arr;
          break;
        case "health":
          cmp = a.healthScore - b.healthScore || RISK_RANK[b.risk] - RISK_RANK[a.risk];
          break;
        case "renewal":
          cmp = a.daysToRenewal - b.daysToRenewal;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function resetFilters() {
    setSearch("");
    setRiskFilter(ALL);
    setIndustryFilter(ALL);
    setTierFilter(ALL);
  }

  const hasActiveFilters = search || riskFilter !== ALL || industryFilter !== ALL || tierFilter !== ALL;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TextInput placeholder="Search accounts…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
        <Select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value={ALL}>All risk levels</option>
          {(["High", "Medium", "Low"] as const).map((r) => (
            <option key={r} value={r}>
              {r} risk
            </option>
          ))}
        </Select>
        <Select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
          <option value={ALL}>All industries</option>
          {industries.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </Select>
        <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value={ALL}>All tiers</option>
          {(["Starter", "Growth", "Enterprise"] as const).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {sorted.length} of {rows.length} accounts
        </span>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No accounts match these filters" description="Try clearing a filter or broadening your search." action={<Button onClick={resetFilters}>Clear filters</Button>} />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th sortable active={sortKey === "company"} direction={sortDir} onClick={() => toggleSort("company")}>
                Account
              </Th>
              <Th>Industry</Th>
              <Th>Tier</Th>
              <Th sortable active={sortKey === "arr"} direction={sortDir} onClick={() => toggleSort("arr")}>
                ARR
              </Th>
              <Th sortable active={sortKey === "health"} direction={sortDir} onClick={() => toggleSort("health")}>
                Health
              </Th>
              <Th sortable active={sortKey === "renewal"} direction={sortDir} onClick={() => toggleSort("renewal")}>
                Renewal
              </Th>
              <Th>Owner</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sorted.map((r) => (
              <Tr key={r.id} className="hover:bg-slate-50">
                <Td>
                  <Link href={`/customers/${r.id}`} className="font-medium text-slate-900 hover:underline">
                    {r.company}
                  </Link>
                </Td>
                <Td className="text-slate-500">{r.industry}</Td>
                <Td className="text-slate-500">{r.tier}</Td>
                <Td className="font-mono tabular-nums">{formatCurrency(r.arr, { compact: true })}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums">{r.healthScore}</span>
                    <RiskBadge risk={r.risk} />
                  </div>
                </Td>
                <Td className="font-mono tabular-nums">
                  {formatRelativeDays(r.daysToRenewal)}
                  <div className="font-sans text-xs text-slate-400">{formatDate(r.renewalDate)}</div>
                </Td>
                <Td className="text-slate-500">{r.ownerName}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
