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

  const totalMonthlySavings = results.ownerResults.reduce(
    (s, r) => s + Math.max(0, r.monthlySavingsVsRenting),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Combined monthly savings vs. renting</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          {formatCurrency(totalMonthlySavings)}
          <span className="text-base text-muted-foreground">/mo</span>
        </p>
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
