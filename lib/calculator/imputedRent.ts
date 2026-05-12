import type { Scenario, ImputedRentBreakdown } from "./types";
import { computeOwnershipShares } from "./perOwner";

export function computeImputedRent(scenario: Scenario): ImputedRentBreakdown | null {
  if (scenario.occupancy.type === "rented_out") return null;

  const fmr = scenario.occupancy.fairMarketRent;
  const liveInIndices = scenario.occupancy.liveInOwnerIndices;

  if (liveInIndices.length === 0) return null;

  const shares = computeOwnershipShares(scenario);
  const k = liveInIndices.length;

  const perOwner = scenario.owners.map((_, i) => {
    const isLiveIn = liveInIndices.includes(i);
    const monthlyPaid = isLiveIn ? fmr / k : 0;
    const monthlyReceived = fmr * shares[i];
    const monthlyNet = monthlyReceived - monthlyPaid;
    return { ownerIndex: i, isLiveIn, monthlyPaid, monthlyReceived, monthlyNet };
  });

  return { totalFmr: fmr, liveInCount: k, perOwner };
}
