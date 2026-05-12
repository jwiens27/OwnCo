import type { Scenario } from "./types";

export const DEFAULT_SCENARIO: Scenario = {
  acquisitionMode: "purchase",
  purchasePrice: 750000,
  propertyTaxAnnual: 9000,
  insuranceAnnual: 1800,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.01,
  mortgageRate: 0.07,
  mortgageTermYears: 30,
  owners: [
    { name: "Owner 1", downPayment: 40000, currentMonthlyRent: 0 },
    { name: "Owner 2", downPayment: 40000, currentMonthlyRent: 0 },
    { name: "Owner 3", downPayment: 40000, currentMonthlyRent: 0 },
    { name: "Owner 4", downPayment: 40000, currentMonthlyRent: 0 },
  ],
  occupancy: { type: "owner_occupied", liveInOwnerIndices: [0, 1, 2, 3], fairMarketRent: 3500 },
  expectedAppreciationPct: 0.03,
};
