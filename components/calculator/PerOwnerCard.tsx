"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OwnerResult } from "@/lib/calculator/types";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

export function PerOwnerCard({ result }: { result: OwnerResult }) {
  const netGainLoss = result.monthlyEquityGainShare - result.netMonthlyCost;
  const netPositive = netGainLoss >= 0;

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

        <div className="mt-1 border-t pt-2 grid grid-cols-2 gap-1 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">equity gain</span>
            <span className="font-medium">+{formatCurrency(result.monthlyEquityGainShare)}/mo</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">net gain/loss</span>
            <span className={`font-medium ${netPositive ? "text-green-500" : "text-red-500"}`}>
              {netPositive ? "+" : ""}
              {formatCurrency(netGainLoss)}/mo
            </span>
          </div>
        </div>

        <div className="mt-1 border-t pt-2 grid grid-cols-3 gap-1 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">5Y net gain</span>
            <span className="font-medium">{formatCurrency(result.netGainAtYear5)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">10Y net gain</span>
            <span className="font-medium">{formatCurrency(result.netGainAtYear10)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">30Y net gain</span>
            <span className="font-medium">{formatCurrency(result.netGainAtYear30)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
