"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { OwnerResult } from "@/lib/calculator/types";
import { equityTimeSeries } from "@/lib/calculator/equity";
import { useCalculatorStore } from "./calculatorStore";
import { formatCurrency } from "@/lib/utils/format";

const OWNER_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

const MONTH_INTERVALS = Array.from({ length: 31 }, (_, i) => i * 12);

export function EquityChart({ ownerResults }: { ownerResults: OwnerResult[] }) {
  const { scenario } = useCalculatorStore();
  const series = equityTimeSeries(scenario, MONTH_INTERVALS);

  const data = series.map((row) => {
    const entry: Record<string, number> = { year: row.month / 12 };
    row.perOwner.forEach((p) => {
      const name = ownerResults[p.ownerIndex]?.name ?? `Owner ${p.ownerIndex + 1}`;
      entry[name] = Math.round(p.equity);
    });
    return entry;
  });

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-4 text-sm font-semibold">Equity Over Time</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis
            dataKey="year"
            tickFormatter={(v: number) => `Yr ${v}`}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            width={56}
          />
          <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => `Year ${l}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {ownerResults.map((r, i) => (
            <Line
              key={r.ownerIndex}
              type="monotone"
              dataKey={r.name}
              stroke={OWNER_COLORS[i % OWNER_COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
