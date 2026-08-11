"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CommandCenterRow } from "./types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Select, TextInput } from "@/components/ui/Select";
import { RiskBadge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, formatRelativeDays } from "@/lib/utils/format";

type SortKey = "priority" | "arr" | "risk" | "renewal" | "company";

const RISK_RANK = { High: 2, Medium: 1, Low: 0 } as const;
const PRIORITY_RANK = { Critical: 3, High: 2, Medium: 1, Low: 0 } as const;

const ALL = "All";

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function CommandCenterTable({ rows }: { rows: CommandCenterRow[] }) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [riskFilter, setRiskFilter] = useState(ALL);
  const [industryFilter, setIndustryFilter] = useState(ALL);
  const [tierFilter, setTierFilter] = useState(ALL);
  const [ownerFilter, setOwnerFilter] = useState(ALL);
  const [rootCauseFilter, setRootCauseFilter] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const industries = useMemo(() => uniqueSorted(rows.map((r) => r.industry)), [rows]);
  const owners = useMemo(() => uniqueSorted(rows.map((r) => r.ownerName)), [rows]);
  const rootCauses = useMemo(() => uniqueSorted(rows.map((r) => r.rootCauseCategory)), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.company.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter !== ALL && r.priorityTier !== priorityFilter) return false;
      if (riskFilter !== ALL && r.risk !== riskFilter) return false;
      if (industryFilter !== ALL && r.industry !== industryFilter) return false;
      if (tierFilter !== ALL && r.tier !== tierFilter) return false;
      if (ownerFilter !== ALL && r.ownerName !== ownerFilter) return false;
      if (rootCauseFilter !== ALL && r.rootCauseCategory !== rootCauseFilter) return false;
      return true;
    });
  }, [rows, search, priorityFilter, riskFilter, industryFilter, tierFilter, ownerFilter, rootCauseFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "priority":
          cmp = a.priorityScore - b.priorityScore || PRIORITY_RANK[a.priorityTier] - PRIORITY_RANK[b.priorityTier];
          break;
        case "arr":
          cmp = a.arr - b.arr;
          break;
        case "risk":
          cmp = RISK_RANK[a.risk] - RISK_RANK[b.risk];
          break;
        case "renewal":
          cmp = a.daysToRenewal - b.daysToRenewal;
          break;
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function resetFilters() {
    setSearch("");
    setPriorityFilter(ALL);
    setRiskFilter(ALL);
    setIndustryFilter(ALL);
    setTierFilter(ALL);
    setOwnerFilter(ALL);
    setRootCauseFilter(ALL);
  }

  const hasActiveFilters =
    search || priorityFilter !== ALL || riskFilter !== ALL || industryFilter !== ALL || tierFilter !== ALL || ownerFilter !== ALL || rootCauseFilter !== ALL;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TextInput placeholder="Search accounts…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value={ALL}>All priorities</option>
          {(["Critical", "High", "Medium", "Low"] as const).map((p) => (
            <option key={p} value={p}>
              {p} priority
            </option>
          ))}
        </Select>
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
        <Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
          <option value={ALL}>All owners</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
        <Select value={rootCauseFilter} onChange={(e) => setRootCauseFilter(e.target.value)}>
          <option value={ALL}>All root causes</option>
          {rootCauses.map((c) => (
            <option key={c} value={c}>
              {c}
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
              <Th sortable active={sortKey === "priority"} direction={sortDir} onClick={() => toggleSort("priority")}>
                Priority
              </Th>
              <Th sortable active={sortKey === "risk"} direction={sortDir} onClick={() => toggleSort("risk")}>
                Risk
              </Th>
              <Th sortable active={sortKey === "arr"} direction={sortDir} onClick={() => toggleSort("arr")}>
                ARR
              </Th>
              <Th sortable active={sortKey === "renewal"} direction={sortDir} onClick={() => toggleSort("renewal")}>
                Renewal
              </Th>
              <Th>Primary Issue</Th>
              <Th>Suggested Action</Th>
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
                  <div className="text-xs text-slate-400">
                    {r.industry} · {r.tier}
                  </div>
                </Td>
                <Td>
                  <PriorityBadge tier={r.priorityTier} />
                </Td>
                <Td>
                  <RiskBadge risk={r.risk} />
                </Td>
                <Td className="font-mono tabular-nums">{formatCurrency(r.arr, { compact: true })}</Td>
                <Td className="font-mono tabular-nums">
                  {formatRelativeDays(r.daysToRenewal)}
                  <div className="font-sans text-xs text-slate-400">{formatDate(r.renewalDate)}</div>
                </Td>
                <Td className="max-w-[220px] text-slate-600">{r.rootCause}</Td>
                <Td className="max-w-[200px] text-slate-600">{r.suggestedAction}</Td>
                <Td className="text-slate-500">{r.ownerName}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
