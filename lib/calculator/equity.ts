import type { Scenario } from "./types";
import { balanceAtMonth } from "./mortgage";
import { computeOwnershipShares, loanPrincipal } from "./perOwner";

export function projectEquity(
  scenario: Scenario,
  monthsElapsed: number,
): { totalEquity: number; perOwner: { ownerIndex: number; equity: number }[] } {
  const principal = loanPrincipal(scenario);
  const yearsElapsed = monthsElapsed / 12;
  const futureValue =
    scenario.purchasePrice * Math.pow(1 + scenario.expectedAppreciationPct, yearsElapsed);
  const remainingLoan = balanceAtMonth(
    principal,
    scenario.mortgageRate,
    scenario.mortgageTermYears,
    monthsElapsed,
  );
  const totalEquity = futureValue - remainingLoan;
  const shares = computeOwnershipShares(scenario);
  return {
    totalEquity,
    perOwner: shares.map((share, i) => ({ ownerIndex: i, equity: totalEquity * share })),
  };
}

export function equityTimeSeries(
  scenario: Scenario,
  monthIntervals: number[],
): { month: number; totalEquity: number; perOwner: { ownerIndex: number; equity: number }[] }[] {
  return monthIntervals.map((month) => ({ month, ...projectEquity(scenario, month) }));
}
