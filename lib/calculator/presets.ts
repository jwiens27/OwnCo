import type { Scenario } from "./types";

export type GuideId =
  | "investor-purchase"
  | "inheritance-rent-out"
  | "inheritance-one-lives-in"
  | "inheritance-vacation";

export const SCENARIO_PRESETS: Record<GuideId, Scenario> = {
  "investor-purchase": {
    acquisitionMode: "purchase",
    purchasePrice: 500_000,
    propertyTaxAnnual: 6_000,
    insuranceAnnual: 2_400,
    hoaMonthly: 0,
    maintenanceReserveAnnualPct: 0.015,
    expectedAppreciationPct: 0.03,
    mortgageRate: 0.07,
    mortgageTermYears: 30,
    owners: [
      { name: "Investor 1", downPayment: 50_000, currentMonthlyRent: 0 },
      { name: "Investor 2", downPayment: 50_000, currentMonthlyRent: 0 },
      { name: "Investor 3", downPayment: 50_000, currentMonthlyRent: 0 },
    ],
    occupancy: { type: "rented_out", expectedMonthlyRent: 3_400 },
  },
  "inheritance-rent-out": {
    acquisitionMode: "inheritance",
    purchasePrice: 600_000,
    propertyTaxAnnual: 7_200,
    insuranceAnnual: 1_800,
    hoaMonthly: 0,
    maintenanceReserveAnnualPct: 0.015,
    expectedAppreciationPct: 0.03,
    mortgageRate: 0,
    mortgageTermYears: 30,
    owners: [
      { name: "Sibling 1", downPayment: 200_000, currentMonthlyRent: 0 },
      { name: "Sibling 2", downPayment: 200_000, currentMonthlyRent: 0 },
      { name: "Sibling 3", downPayment: 200_000, currentMonthlyRent: 0 },
    ],
    occupancy: { type: "rented_out", expectedMonthlyRent: 3_200 },
  },
  "inheritance-one-lives-in": {
    acquisitionMode: "inheritance",
    purchasePrice: 600_000,
    propertyTaxAnnual: 7_200,
    insuranceAnnual: 1_800,
    hoaMonthly: 0,
    maintenanceReserveAnnualPct: 0.01,
    expectedAppreciationPct: 0.03,
    mortgageRate: 0,
    mortgageTermYears: 30,
    owners: [
      { name: "Live-in sibling", downPayment: 200_000, currentMonthlyRent: 0 },
      { name: "Sibling 2", downPayment: 200_000, currentMonthlyRent: 0 },
      { name: "Sibling 3", downPayment: 200_000, currentMonthlyRent: 0 },
    ],
    occupancy: { type: "owner_occupied", liveInOwnerIndices: [0], fairMarketRent: 3_200 },
  },
  "inheritance-vacation": {
    acquisitionMode: "inheritance",
    purchasePrice: 800_000,
    propertyTaxAnnual: 9_600,
    insuranceAnnual: 3_000,
    hoaMonthly: 0,
    maintenanceReserveAnnualPct: 0.02,
    expectedAppreciationPct: 0.03,
    mortgageRate: 0,
    mortgageTermYears: 30,
    owners: [
      { name: "Sibling 1", downPayment: 266_667, currentMonthlyRent: 0 },
      { name: "Sibling 2", downPayment: 266_667, currentMonthlyRent: 0 },
      { name: "Sibling 3", downPayment: 266_666, currentMonthlyRent: 0 },
    ],
    occupancy: {
      type: "owner_occupied",
      liveInOwnerIndices: [0, 1, 2],
      fairMarketRent: 4_500,
    },
  },
};

export const GUIDE_META: Record<
  GuideId,
  { title: string; subtitle: string; icon: string }
> = {
  "investor-purchase": {
    title: "Investor Purchase",
    subtitle: "Pool cash to buy a rental property together.",
    icon: "🏢",
  },
  "inheritance-rent-out": {
    title: "Inherited Home — Rent Out",
    subtitle: "Siblings inherit a property and hold it as a rental.",
    icon: "🏠",
  },
  "inheritance-one-lives-in": {
    title: "Inherited Home — One Sibling Lives In",
    subtitle: "One heir occupies the property; others receive rent.",
    icon: "🏡",
  },
  "inheritance-vacation": {
    title: "Inherited Vacation Home",
    subtitle: "Shared second home with usage rotation among heirs.",
    icon: "🏖️",
  },
};
