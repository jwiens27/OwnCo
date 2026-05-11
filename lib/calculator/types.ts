export type Owner = {
  name: string;
  downPayment: number;
  currentMonthlyRent: number;
};

export type RentedOutOccupancy = {
  type: "rented_out";
  expectedMonthlyRent: number;
};

export type OwnerOccupiedOccupancy = {
  type: "owner_occupied";
  liveInOwnerIndices: readonly number[];
  fairMarketRent: number;
};

export type MixedOccupancy = {
  type: "mixed";
  liveInOwnerIndices: readonly number[];
  fairMarketRent: number;
  externalMonthlyRent: number;
};

export type Occupancy = RentedOutOccupancy | OwnerOccupiedOccupancy | MixedOccupancy;

export type Scenario = {
  purchasePrice: number;
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenanceReserveAnnualPct: number;
  mortgageRate: number;
  mortgageTermYears: number;
  owners: Owner[];
  occupancy: Occupancy;
  expectedAppreciationPct: number;
};

export type AmortizationRow = {
  month: number;
  principal: number;
  interest: number;
  balance: number;
};

export type OwnerResult = {
  ownerIndex: number;
  name: string;
  ownershipShare: number;
  monthlyMortgageShare: number;
  monthlyTaxShare: number;
  monthlyInsuranceShare: number;
  monthlyHoaShare: number;
  monthlyMaintenanceShare: number;
  monthlyRentalIncomeShare: number;
  monthlyImputedRentPaid: number;
  monthlyImputedRentReceived: number;
  grossMonthlyCost: number;
  netMonthlyCost: number;
  monthlyEquityGainShare: number;
  currentMonthlyRent: number;
  monthlySavingsVsRenting: number;
  equityAtYear5: number;
  equityAtYear10: number;
  equityAtYear30: number;
  netGainAtYear5: number;
  netGainAtYear10: number;
  netGainAtYear30: number;
};

export type ImputedRentBreakdown = {
  fairMarketRent: number;
  totalImputedRentPaidByLiveInOwners: number;
  perLiveInOwnerOwed: { ownerIndex: number; amount: number }[];
  perNonLiveInOwnerReceived: { ownerIndex: number; amount: number }[];
};

export type Comparison = {
  ownerIndex: number;
  buySolo: { feasible: boolean; monthlyCost: number | null; reason?: string };
  keepRenting: { monthlyCost: number };
  coBuy: { monthlyCost: number };
};

export type Results = {
  totalMonthlyMortgage: number;
  totalMonthlyCarryingCost: number;
  monthlyEquityGain: number;
  ownerResults: OwnerResult[];
  imputedRent: ImputedRentBreakdown | null;
  comparisons: Comparison[];
  validationErrors: string[];
};
