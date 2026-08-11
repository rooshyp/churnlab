"use client";

import { useState } from "react";
import { SegmentStat } from "@/lib/segments/segment-intelligence";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const DIMENSIONS = [
  { key: "tier", label: "Plan Tier" },
  { key: "industry", label: "Industry" },
  { key: "arrTier", label: "ARR Tier" },
  { key: "sizeBand", label: "Company Size" },
  { key: "adoptionTier", label: "Adoption Tier" },
  { key: "ownerName", label: "Account Owner" },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["key"];

export function SegmentsExplorer({ data }: { data: Record<DimensionKey, SegmentStat[]> }) {
  const [dimension, setDimension] = useState<DimensionKey>("tier");
  const rows = data[dimension];
  const totalArr = rows.reduce((sum, r) => sum + r.arr, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {DIMENSIONS.map((d) => (
          <button
            key={d.key}
            onClick={() => setDimension(d.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              dimension === d.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Segment</Th>
            <Th>Accounts</Th>
            <Th>ARR</Th>
            <Th>Share of ARR</Th>
            <Th>Avg Health</Th>
            <Th>High-Risk Accounts</Th>
            <Th>High-Risk ARR</Th>
            <Th>Avg Adoption</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((r) => (
            <Tr key={r.key}>
              <Td className="font-medium text-slate-900">{r.label}</Td>
              <Td className="font-mono tabular-nums">{r.count}</Td>
              <Td className="font-mono tabular-nums">{formatCurrency(r.arr, { compact: true })}</Td>
              <Td className="font-mono tabular-nums">{formatPercent(totalArr > 0 ? (r.arr / totalArr) * 100 : 0)}</Td>
              <Td className={cn("font-mono tabular-nums", r.avgHealthScore < 40 ? "text-red-600" : r.avgHealthScore < 70 ? "text-amber-600" : "text-emerald-600")}>
                {r.avgHealthScore}
              </Td>
              <Td className="font-mono tabular-nums">{r.highRiskCount}</Td>
              <Td className="font-mono tabular-nums">{formatCurrency(r.highRiskArr, { compact: true })}</Td>
              <Td className="font-mono tabular-nums">{formatPercent(r.avgAdoptionRate)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}
