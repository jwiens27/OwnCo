import { describe, expect, it } from "vitest";
import { computeComparisons } from "@/lib/calculator/compare";
import { computeOwnerResults } from "@/lib/calculator/perOwner";
import type { Scenario } from "@/lib/calculator/types";

const scenario: Scenario = {
  purchasePrice: 800000,
  propertyTaxAnnual: 9600,
  insuranceAnnual: 1800,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.01,
  mortgageRate: 0.07,
  mortgageTermYears: 30,
  owners: [
    { name: "A", downPayment: 50000, currentMonthlyRent: 2500 },
    { name: "B", downPayment: 50000, currentMonthlyRent: 2500 },
    { name: "C", downPayment: 5000, currentMonthlyRent: 2500 },
    { name: "D", downPayment: 50000, currentMonthlyRent: 2500 },
  ],
  occupancy: { type: "rented_out", expectedMonthlyRent: 4000 },
  expectedAppreciationPct: 0.03,
};

describe("computeComparisons", () => {
  it("flags solo infeasibility for owner C (5k / 800k = 0.6%)", () => {
    const results = computeOwnerResults(scenario);
    const cmps = computeComparisons(scenario, results);
    expect(cmps[2].buySolo.feasible).toBe(false);
    expect(cmps[2].buySolo.monthlyCost).toBeNull();
  });

  it("keepRenting matches owner.currentMonthlyRent", () => {
    const results = computeOwnerResults(scenario);
    const cmps = computeComparisons(scenario, results);
    cmps.forEach((c, i) => {
      expect(c.keepRenting.monthlyCost).toBe(scenario.owners[i].currentMonthlyRent);
    });
  });

  it("coBuy.monthlyCost matches OwnerResult.netMonthlyCost", () => {
    const results = computeOwnerResults(scenario);
    const cmps = computeComparisons(scenario, results);
    cmps.forEach((c, i) => {
      expect(c.coBuy.monthlyCost).toBeCloseTo(results[i].netMonthlyCost);
    });
  });
});
