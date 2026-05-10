import type { Scenario, OwnerResult, Comparison } from "./types";
import { monthlyPayment } from "./mortgage";

export function computeComparisons(
  scenario: Scenario,
  ownerResults: OwnerResult[],
): Comparison[] {
  const tax = scenario.propertyTaxAnnual / 12;
  const insurance = scenario.insuranceAnnual / 12;
  const hoa = scenario.hoaMonthly;
  const maintenance = (scenario.purchasePrice * scenario.maintenanceReserveAnnualPct) / 12;
  const fixedMonthly = tax + insurance + hoa + maintenance;
  const minDownPctForSolo = 0.05;

  return scenario.owners.map((owner, i) => {
    const result = ownerResults[i];
    const downPctSolo = owner.downPayment / scenario.purchasePrice;
    let buySolo: Comparison["buySolo"];
    if (downPctSolo < minDownPctForSolo) {
      buySolo = { feasible: false, monthlyCost: null, reason: "Down payment below 5% of purchase price" };
    } else {
      const loan = scenario.purchasePrice - owner.downPayment;
      const mortgage = monthlyPayment(loan, scenario.mortgageRate, scenario.mortgageTermYears);
      buySolo = { feasible: true, monthlyCost: mortgage + fixedMonthly };
    }
    return {
      ownerIndex: i,
      buySolo,
      keepRenting: { monthlyCost: owner.currentMonthlyRent },
      coBuy: { monthlyCost: result.netMonthlyCost },
    };
  });
}
