import type { Scenario, Results } from "./types";
import { computeOwnerResults, totalMonthlyCarryingCost, loanPrincipal } from "./perOwner";
import { computeImputedRent } from "./imputedRent";
import { computeComparisons } from "./compare";

export function validateScenario(scenario: Scenario): string[] {
  const errors: string[] = [];
  if (scenario.purchasePrice <= 0) errors.push("Purchase price must be positive.");
  if (scenario.mortgageRate < 0 || scenario.mortgageRate >= 1) errors.push("Mortgage rate must be between 0 and 1 (decimal APR).");
  if (scenario.mortgageTermYears < 5 || scenario.mortgageTermYears > 50) errors.push("Mortgage term must be between 5 and 50 years.");
  if (scenario.owners.length < 2 || scenario.owners.length > 6) errors.push("Owners must be between 2 and 6.");
  scenario.owners.forEach((o, i) => {
    if (o.downPayment < 0) errors.push(`Owner ${i + 1} down payment must be non-negative.`);
  });
  const totalDown = scenario.owners.reduce((s, o) => s + o.downPayment, 0);
  if (totalDown > scenario.purchasePrice) errors.push("Total down payment exceeds purchase price.");

  if (scenario.occupancy.type === "owner_occupied" || scenario.occupancy.type === "mixed") {
    const idx = scenario.occupancy.liveInOwnerIndices;
    if (idx.length === 0) errors.push("At least one live-in owner required.");
    if (new Set(idx).size !== idx.length) errors.push("Duplicate live-in owner indices.");
    idx.forEach((i) => {
      if (i < 0 || i >= scenario.owners.length) errors.push(`Live-in owner index ${i} out of range.`);
    });
    if (scenario.occupancy.fairMarketRent < 0) errors.push("Fair market rent must be non-negative.");
  }
  if (scenario.expectedAppreciationPct < -0.2 || scenario.expectedAppreciationPct > 0.5) {
    errors.push("Expected appreciation must be between -20% and 50%.");
  }
  return errors;
}

export function compute(scenario: Scenario): Results {
  const validationErrors = validateScenario(scenario);
  if (validationErrors.length > 0) {
    return {
      totalMonthlyMortgage: 0,
      totalMonthlyCarryingCost: 0,
      monthlyEquityGain: 0,
      ownerResults: [],
      imputedRent: null,
      comparisons: [],
      validationErrors,
    };
  }
  const carrying = totalMonthlyCarryingCost(scenario);
  const loan = loanPrincipal(scenario);
  const monthlyInterest = loan * (scenario.mortgageRate / 12);
  const monthlyPrincipal = carrying.mortgage - monthlyInterest;
  const monthlyAppreciation = (scenario.purchasePrice * scenario.expectedAppreciationPct) / 12;
  const monthlyEquityGain = monthlyPrincipal + monthlyAppreciation;

  const ownerResults = computeOwnerResults(scenario);
  const imputed = computeImputedRent(scenario);
  const comparisons = computeComparisons(scenario, ownerResults);
  return {
    totalMonthlyMortgage: carrying.mortgage,
    totalMonthlyCarryingCost: carrying.total,
    monthlyEquityGain,
    ownerResults,
    imputedRent: imputed,
    comparisons,
    validationErrors: [],
  };
}
