import type { Scenario, OwnerResult } from "./types";
import { monthlyPayment, balanceAtMonth } from "./mortgage";
import { computeImputedRent } from "./imputedRent";

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

  return scenario.owners.map((owner, i) => {
    const share = shares[i];
    const monthlyMortgageShare = carrying.mortgage * share;
    const monthlyTaxShare = carrying.tax * share;
    const monthlyInsuranceShare = carrying.insurance * share;
    const monthlyHoaShare = carrying.hoa * share;
    const monthlyMaintenanceShare = carrying.maintenance * share;
    const monthlyRentalIncomeShare = rentalIncome * share;

    const paidEntry = imputed?.perLiveInOwnerOwed.find((e) => e.ownerIndex === i);
    const receivedEntry = imputed?.perNonLiveInOwnerReceived.find((e) => e.ownerIndex === i);
    const monthlyImputedRentPaid = paidEntry?.amount ?? 0;
    const monthlyImputedRentReceived = receivedEntry?.amount ?? 0;

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

    const equityAtYear5 = computeEquityAt(scenario, share, principal, 60);
    const equityAtYear10 = computeEquityAt(scenario, share, principal, 120);
    const equityAtYear30 = computeEquityAt(scenario, share, principal, 360);

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
      currentMonthlyRent: owner.currentMonthlyRent,
      monthlySavingsVsRenting: owner.currentMonthlyRent - netMonthlyCost,
      equityAtYear5,
      equityAtYear10,
      equityAtYear30,
    };
  });
}

function computeEquityAt(
  scenario: Scenario,
  share: number,
  principal: number,
  monthsElapsed: number,
): number {
  const yearsElapsed = monthsElapsed / 12;
  const futureValue =
    scenario.purchasePrice * Math.pow(1 + scenario.expectedAppreciationPct, yearsElapsed);
  const remainingLoan = balanceAtMonth(
    principal,
    scenario.mortgageRate,
    scenario.mortgageTermYears,
    monthsElapsed,
  );
  return (futureValue - remainingLoan) * share;
}
