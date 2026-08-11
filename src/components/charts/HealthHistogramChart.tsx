"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

export interface HealthBucketDatum {
  bucket: string;
  count: number;
  color: string;
}

export function HealthHistogramChart({ data }: { data: HealthBucketDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
        <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip formatter={(value) => [`${value} accounts`, "Count"]} contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.bucket} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
