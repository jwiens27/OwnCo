"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Comparison, OwnerResult, AcquisitionMode } from "@/lib/calculator/types";
import { formatCurrency } from "@/lib/utils/format";

export function ComparisonChart({
  comparisons,
  ownerResults,
  mode,
}: {
  comparisons: Comparison[];
  ownerResults: OwnerResult[];
  mode: AcquisitionMode;
}) {
  const soloLabel = mode === "inheritance" ? "Buy out heirs" : "Solo (owner-occ.)";
  const showAltHousing = ownerResults.some((r) => r.currentMonthlyRent > 0);
  const showSolo = mode === "purchase" || ownerResults.some((r) => r.currentMonthlyRent > 0);

  const data = comparisons.map((cmp, i) => {
    const owner = ownerResults[i];
    return {
      name: owner?.name ?? `Owner ${i + 1}`,
      "Co-Buy": Math.round(cmp.coBuy.monthlyCost),
      ...(showAltHousing && { "Alt. Housing": Math.round(cmp.keepRenting.monthlyCost) }),
      ...(showSolo && cmp.buySolo.feasible && cmp.buySolo.monthlyCost != null
        ? { [soloLabel]: Math.round(cmp.buySolo.monthlyCost) }
        : {}),
    };
  });

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-4 text-sm font-semibold">Monthly Cost Comparison</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} width={48} />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Co-Buy" fill="#6366f1" radius={[3, 3, 0, 0]} />
          {showAltHousing && (
            <Bar dataKey="Alt. Housing" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          )}
          {showSolo && (
            <Bar dataKey={soloLabel} fill="#10b981" radius={[3, 3, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
