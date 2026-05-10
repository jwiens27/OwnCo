import type { Scenario, ImputedRentBreakdown } from "./types";
import { computeOwnershipShares } from "./perOwner";

export function computeImputedRent(scenario: Scenario): ImputedRentBreakdown | null {
  if (scenario.occupancy.type === "rented_out") return null;

  const fairMarketRent = scenario.occupancy.fairMarketRent;
  const liveInIndices = scenario.occupancy.liveInOwnerIndices;

  if (liveInIndices.length === 0) return null;

  const shares = computeOwnershipShares(scenario);
  const allLiveIn = liveInIndices.length === scenario.owners.length;

  const perLiveInOwnerOwed = liveInIndices.map((idx) => ({
    ownerIndex: idx,
    amount: fairMarketRent / liveInIndices.length,
  }));

  if (allLiveIn) {
    return {
      fairMarketRent,
      totalImputedRentPaidByLiveInOwners: fairMarketRent,
      perLiveInOwnerOwed,
      perNonLiveInOwnerReceived: [],
    };
  }

  const nonLiveInIndices = scenario.owners
    .map((_, i) => i)
    .filter((i) => !liveInIndices.includes(i));

  const sumOfNonLiveInShares = nonLiveInIndices.reduce((s, i) => s + shares[i], 0);

  const perNonLiveInOwnerReceived = nonLiveInIndices.map((idx) => ({
    ownerIndex: idx,
    amount:
      sumOfNonLiveInShares === 0
        ? 0
        : (shares[idx] / sumOfNonLiveInShares) * fairMarketRent,
  }));

  return {
    fairMarketRent,
    totalImputedRentPaidByLiveInOwners: fairMarketRent,
    perLiveInOwnerOwed,
    perNonLiveInOwnerReceived,
  };
}
