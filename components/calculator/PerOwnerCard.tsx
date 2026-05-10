"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OwnerResult } from "@/lib/calculator/types";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

export function PerOwnerCard({ result }: { result: OwnerResult }) {
  const savingsPositive = result.monthlySavingsVsRenting >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{result.name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {formatPercent(result.ownershipShare)} ownership
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Net monthly cost</span>
          <span className="font-medium">{formatCurrency(result.netMonthlyCost)}/mo</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">vs. renting</span>
          <span className={savingsPositive ? "font-medium text-green-500" : "font-medium text-red-500"}>
            {savingsPositive ? "saves " : "costs "}
            {formatCurrency(Math.abs(result.monthlySavingsVsRenting))}/mo
          </span>
        </div>
        <div className="mt-1 border-t pt-2 grid grid-cols-3 gap-1 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">Yr 5</span>
            <span className="font-medium">{formatCurrency(result.equityAtYear5)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">Yr 10</span>
            <span className="font-medium">{formatCurrency(result.equityAtYear10)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">Yr 30</span>
            <span className="font-medium">{formatCurrency(result.equityAtYear30)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
