"use client";

import type { Results } from "@/lib/calculator/types";
import { PerOwnerCard } from "./PerOwnerCard";
import { ImputedRentCallout } from "./ImputedRentCallout";
import { ComparisonChart } from "./ComparisonChart";
import { EquityChart } from "./EquityChart";
import { ScenarioActions } from "./ScenarioActions";
import { formatCurrency } from "@/lib/utils/format";

export function ResultsPanel({ results }: { results: Results }) {
  if (results.validationErrors.length > 0) {
    return (
      <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <h3 className="font-semibold">Please fix these inputs</h3>
        <ul className="list-disc pl-5 text-sm">
          {results.validationErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }

  const totalRentalIncome = results.ownerResults.reduce(
    (s, r) => s + r.monthlyRentalIncomeShare,
    0,
  );
  const monthlyPayment = totalRentalIncome - results.totalMonthlyCarryingCost;
  const netGainLoss = monthlyPayment + results.monthlyEquityGain;
  const netPositive = netGainLoss >= 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-card p-6">
        <p className="mb-4 text-sm font-semibold">Monthly Summary</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Monthly Payment</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {monthlyPayment >= 0 ? "+" : ""}{formatCurrency(monthlyPayment)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">combined, all owners</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly equity gain</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              +{formatCurrency(results.monthlyEquityGain)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">principal + appreciation</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net gain / loss</p>
            <p className={`mt-1 text-2xl font-semibold tracking-tight ${netPositive ? "text-green-500" : "text-red-500"}`}>
              {netPositive ? "+" : ""}{formatCurrency(netGainLoss)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">payment + equity</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {results.ownerResults.map((r) => (
          <PerOwnerCard key={r.ownerIndex} result={r} />
        ))}
      </div>

      {results.imputedRent && (
        <ImputedRentCallout
          breakdown={results.imputedRent}
          ownerResults={results.ownerResults}
        />
      )}

      <ComparisonChart comparisons={results.comparisons} ownerResults={results.ownerResults} />
      <EquityChart ownerResults={results.ownerResults} />

      <ScenarioActions />
    </div>
  );
}
