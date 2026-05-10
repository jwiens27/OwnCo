"use client";

import type { ImputedRentBreakdown, OwnerResult } from "@/lib/calculator/types";
import { formatCurrency } from "@/lib/utils/format";

export function ImputedRentCallout({
  breakdown,
  ownerResults,
}: {
  breakdown: ImputedRentBreakdown;
  ownerResults: OwnerResult[];
}) {
  function ownerName(idx: number) {
    return ownerResults[idx]?.name ?? `Owner ${idx + 1}`;
  }

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
      <p className="font-semibold">Imputed Rent</p>
      <p className="mt-1 text-muted-foreground">
        Fair market rent for a comparable unit is{" "}
        <strong className="text-foreground">{formatCurrency(breakdown.fairMarketRent)}/mo</strong>.
        Live-in owners compensate non-live-in owners for the right to occupy.
      </p>

      {breakdown.perLiveInOwnerOwed.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live-in owners pay
          </p>
          <ul className="mt-1 space-y-1">
            {breakdown.perLiveInOwnerOwed.map((e) => (
              <li key={e.ownerIndex} className="flex justify-between">
                <span>{ownerName(e.ownerIndex)}</span>
                <span className="font-medium">{formatCurrency(e.amount)}/mo</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.perNonLiveInOwnerReceived.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Non-live-in owners receive
          </p>
          <ul className="mt-1 space-y-1">
            {breakdown.perNonLiveInOwnerReceived.map((e) => (
              <li key={e.ownerIndex} className="flex justify-between">
                <span>{ownerName(e.ownerIndex)}</span>
                <span className="font-medium text-green-500">+{formatCurrency(e.amount)}/mo</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
