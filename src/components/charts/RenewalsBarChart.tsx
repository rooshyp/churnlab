"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils/format";

export interface RenewalMonthDatum {
  month: string;
  arr: number;
  count: number;
}

export function RenewalsBarChart({ data }: { data: RenewalMonthDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => formatCurrency(v, { compact: true })} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={56} />
        <Tooltip
          formatter={(value, key) => (key === "arr" ? [formatCurrency(Number(value)), "ARR renewing"] : [value, "Accounts"])}
          contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }}
        />
        <Bar dataKey="arr" fill="#334155" radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
