import type { Scenario, OwnerResult } from "./types";
import { monthlyPayment } from "./mortgage";
import { computeImputedRent } from "./imputedRent";
import { projectEquity } from "./equity";

export function computeOwnershipShares(scenario: Scenario): number[] {
  const total = scenario.owners.reduce((sum, o) => sum + o.downPayment, 0);
  if (total === 0) {
    return scenario.owners.map(() => 1 / scenario.owners.length);
  }
  return scenario.owners.map((o) => o.downPayment / total);
}

export function totalDownPayment(scenario: Scenario): number {
  return scenario.owners.reduce((sum, o) => sum + o.downPayment, 0);
}

export function loanPrincipal(scenario: Scenario): number {
  return Math.max(0, scenario.purchasePrice - totalDownPayment(scenario));
}

export function totalMonthlyCarryingCost(scenario: Scenario): {
  mortgage: number;
  tax: number;
  insurance: number;
  hoa: number;
  maintenance: number;
  total: number;
} {
  const mortgage = monthlyPayment(
    loanPrincipal(scenario),
    scenario.mortgageRate,
    scenario.mortgageTermYears,
  );
  const tax = scenario.propertyTaxAnnual / 12;
  const insurance = scenario.insuranceAnnual / 12;
  const hoa = scenario.hoaMonthly;
  const maintenance = (scenario.purchasePrice * scenario.maintenanceReserveAnnualPct) / 12;
  return { mortgage, tax, insurance, hoa, maintenance, total: mortgage + tax + insurance + hoa + maintenance };
}

export function externalRentalIncome(scenario: Scenario): number {
  switch (scenario.occupancy.type) {
    case "rented_out":
      return scenario.occupancy.expectedMonthlyRent;
    case "mixed":
      return scenario.occupancy.externalMonthlyRent;
    case "owner_occupied":
      return 0;
  }
}

export function computeOwnerResults(scenario: Scenario): OwnerResult[] {
  const shares = computeOwnershipShares(scenario);
  const carrying = totalMonthlyCarryingCost(scenario);
  const rentalIncome = externalRentalIncome(scenario);
  const imputed = computeImputedRent(scenario);
  const principal = loanPrincipal(scenario);

  const monthlyInterest = principal * (scenario.mortgageRate / 12);
  const monthlyEquityGainTotal =
    (carrying.mortgage - monthlyInterest) +
    (scenario.purchasePrice * scenario.expectedAppreciationPct) / 12;

  return scenario.owners.map((owner, i) => {
    const share = shares[i];
    const monthlyMortgageShare = carrying.mortgage * share;
    const monthlyTaxShare = carrying.tax * share;
    const monthlyInsuranceShare = carrying.insurance * share;
    const monthlyHoaShare = carrying.hoa * share;
    const monthlyMaintenanceShare = carrying.maintenance * share;
    const monthlyRentalIncomeShare = rentalIncome * share;

    const ownerImputed = imputed?.perOwner.find((e) => e.ownerIndex === i);
    const monthlyImputedRentPaid = ownerImputed?.monthlyPaid ?? 0;
    const monthlyImputedRentReceived = ownerImputed?.monthlyReceived ?? 0;

    const grossMonthlyCost =
      monthlyMortgageShare +
      monthlyTaxShare +
      monthlyInsuranceShare +
      monthlyHoaShare +
      monthlyMaintenanceShare;

    const netMonthlyCost =
      grossMonthlyCost -
      monthlyRentalIncomeShare -
      monthlyImputedRentReceived +
      monthlyImputedRentPaid;

    const monthlyEquityGainShare = monthlyEquityGainTotal * share;

    const equityAtYear5 = projectEquity(scenario, 60).perOwner[i].equity;
    const equityAtYear10 = projectEquity(scenario, 120).perOwner[i].equity;
    const equityAtYear30 = projectEquity(scenario, 360).perOwner[i].equity;

    // net gain = equity built minus all cash invested (down payment + cumulative net monthly costs)
    const netGainAtYear5 = equityAtYear5 - owner.downPayment - netMonthlyCost * 60;
    const netGainAtYear10 = equityAtYear10 - owner.downPayment - netMonthlyCost * 120;
    const netGainAtYear30 = equityAtYear30 - owner.downPayment - netMonthlyCost * 360;

    return {
      ownerIndex: i,
      name: owner.name,
      ownershipShare: share,
      monthlyMortgageShare,
      monthlyTaxShare,
      monthlyInsuranceShare,
      monthlyHoaShare,
      monthlyMaintenanceShare,
      monthlyRentalIncomeShare,
      monthlyImputedRentPaid,
      monthlyImputedRentReceived,
      grossMonthlyCost,
      netMonthlyCost,
      monthlyEquityGainShare,
      currentMonthlyRent: owner.currentMonthlyRent,
      monthlySavingsVsRenting: owner.currentMonthlyRent - netMonthlyCost,
      equityAtYear5,
      equityAtYear10,
      equityAtYear30,
      netGainAtYear5,
      netGainAtYear10,
      netGainAtYear30,
    };
  });
}

