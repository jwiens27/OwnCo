import { describe, expect, it } from "vitest";
import { projectEquity } from "@/lib/calculator/equity";
import type { Scenario } from "@/lib/calculator/types";

const scenario: Scenario = {
  acquisitionMode: "purchase",
  purchasePrice: 600000,
  propertyTaxAnnual: 7200,
  insuranceAnnual: 1500,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.01,
  mortgageRate: 0.07,
  mortgageTermYears: 30,
  owners: [
    { name: "A", downPayment: 60000, currentMonthlyRent: 0 },
    { name: "B", downPayment: 60000, currentMonthlyRent: 0 },
  ],
  occupancy: { type: "rented_out", expectedMonthlyRent: 3500 },
  expectedAppreciationPct: 0.03,
};

describe("projectEquity", () => {
  it("month 0: equity = down payment total (price - loan)", () => {
    const { totalEquity } = projectEquity(scenario, 0);
    expect(totalEquity).toBeCloseTo(120000, 0);
  });

  it("month 360: equity = appreciated value (loan paid off)", () => {
    const { totalEquity } = projectEquity(scenario, 360);
    const expected = 600000 * Math.pow(1.03, 30);
    expect(totalEquity).toBeCloseTo(expected, -2);
  });

  it("per-owner equity sums to total equity", () => {
    const { totalEquity, perOwner } = projectEquity(scenario, 120);
    const sum = perOwner.reduce((s, o) => s + o.equity, 0);
    expect(sum).toBeCloseTo(totalEquity);
  });
});
