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

  const allLiveIn = breakdown.liveInCount === ownerResults.length;
  const perLiveIn = breakdown.perOwner.filter((e) => e.isLiveIn);
  const perNonLiveIn = breakdown.perOwner.filter((e) => !e.isLiveIn);

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
      <p className="font-semibold">Imputed Rent</p>

      {allLiveIn ? (
        <p className="mt-1 text-muted-foreground">
          All owners live in the property. Each pays{" "}
          <strong className="text-foreground">
            {formatCurrency(breakdown.totalFmr / breakdown.liveInCount)}/mo
          </strong>{" "}
          imputed rent and receives the same amount back via their ownership share.{" "}
          <strong className="text-foreground">Net imputed rent: $0.</strong>
        </p>
      ) : (
        <>
          <p className="mt-1 text-muted-foreground">
            Fair market rent for a comparable unit is{" "}
            <strong className="text-foreground">{formatCurrency(breakdown.totalFmr)}/mo</strong>.
            Live-in owners pay into the partnership; all owners receive back by ownership share.
          </p>

          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Live-in owners
            </p>
            <ul className="mt-1 space-y-1">
              {perLiveIn.map((e) => (
                <li key={e.ownerIndex} className="flex justify-between gap-4">
                  <span>{ownerName(e.ownerIndex)}</span>
                  <span className="text-right text-xs text-muted-foreground">
                    pays {formatCurrency(e.monthlyPaid)} · receives back{" "}
                    {formatCurrency(e.monthlyReceived)} ·{" "}
                    <strong className="text-foreground">
                      net {formatCurrency(Math.abs(e.monthlyNet))}/mo rent
                    </strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {perNonLiveIn.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Non-live-in owners receive
              </p>
              <ul className="mt-1 space-y-1">
                {perNonLiveIn.map((e) => (
                  <li key={e.ownerIndex} className="flex justify-between">
                    <span>{ownerName(e.ownerIndex)}</span>
                    <span className="font-medium text-green-500">
                      +{formatCurrency(e.monthlyReceived)}/mo
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
