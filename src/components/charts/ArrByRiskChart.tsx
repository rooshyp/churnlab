"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils/format";

export interface ArrByRiskDatum {
  name: string;
  arr: number;
  color: string;
}

export function ArrByRiskChart({ data }: { data: ArrByRiskDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatCurrency(v, { compact: true })} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }} />
        <Bar dataKey="arr" radius={[0, 4, 4, 0]} barSize={28} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
