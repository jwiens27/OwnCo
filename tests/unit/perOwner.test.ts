import { describe, expect, it } from "vitest";
import {
  computeOwnershipShares,
  computeOwnerResults,
  loanPrincipal,
  totalMonthlyCarryingCost,
} from "@/lib/calculator/perOwner";
import type { Scenario } from "@/lib/calculator/types";

const baseScenario: Scenario = {
  acquisitionMode: "purchase",
  purchasePrice: 800000,
  propertyTaxAnnual: 9600,
  insuranceAnnual: 1800,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.01,
  mortgageRate: 0.07,
  mortgageTermYears: 30,
  owners: [
    { name: "A", downPayment: 50000, currentMonthlyRent: 2000 },
    { name: "B", downPayment: 50000, currentMonthlyRent: 2000 },
    { name: "C", downPayment: 50000, currentMonthlyRent: 2000 },
    { name: "D", downPayment: 50000, currentMonthlyRent: 2000 },
  ],
  occupancy: { type: "rented_out", expectedMonthlyRent: 4000 },
  expectedAppreciationPct: 0.03,
};

describe("computeOwnershipShares", () => {
  it("equal contributions → equal shares", () => {
    const shares = computeOwnershipShares(baseScenario);
    expect(shares).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it("unequal contributions → proportional shares", () => {
    const s = { ...baseScenario, owners: [
      { name: "A", downPayment: 100000, currentMonthlyRent: 0 },
      { name: "B", downPayment: 50000, currentMonthlyRent: 0 },
      { name: "C", downPayment: 50000, currentMonthlyRent: 0 },
    ]};
    const shares = computeOwnershipShares(s);
    expect(shares[0]).toBeCloseTo(0.5);
    expect(shares[1]).toBeCloseTo(0.25);
    expect(shares[2]).toBeCloseTo(0.25);
  });

  it("all zero contributions → equal shares", () => {
    const s = { ...baseScenario, owners: baseScenario.owners.map(o => ({ ...o, downPayment: 0 })) };
    const shares = computeOwnershipShares(s);
    shares.forEach(share => expect(share).toBeCloseTo(0.25));
  });
});

describe("loanPrincipal", () => {
  it("price minus total down payment", () => {
    expect(loanPrincipal(baseScenario)).toBe(600000);
  });
});

describe("computeOwnerResults", () => {
  it("4-owner equal-split rented_out: shares sum to 1", () => {
    const results = computeOwnerResults(baseScenario);
    const total = results.reduce((s, r) => s + r.ownershipShare, 0);
    expect(total).toBeCloseTo(1);
  });

  it("rented_out: rental income reduces net monthly cost", () => {
    const results = computeOwnerResults(baseScenario);
    results.forEach(r => {
      expect(r.netMonthlyCost).toBeLessThan(r.grossMonthlyCost);
      expect(r.monthlyRentalIncomeShare).toBeCloseTo(1000);
    });
  });

  it("monthlySavingsVsRenting = currentRent - netCost", () => {
    const results = computeOwnerResults(baseScenario);
    results.forEach(r => {
      expect(r.monthlySavingsVsRenting).toBeCloseTo(r.currentMonthlyRent - r.netMonthlyCost);
    });
  });

  it("equity at year 30 > year 10 > year 5 (with positive appreciation)", () => {
    const results = computeOwnerResults(baseScenario);
    results.forEach(r => {
      expect(r.equityAtYear30).toBeGreaterThan(r.equityAtYear10);
      expect(r.equityAtYear10).toBeGreaterThan(r.equityAtYear5);
    });
  });
});

describe("Guide 3 fixture — inheritance, one sibling lives in", () => {
  const guide3: Scenario = {
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
  };

  it("live-in net monthly cost ≈ $2,550 (not $3,616.67)", () => {
    const results = computeOwnerResults(guide3);
    expect(results[0].netMonthlyCost).toBeCloseTo(2550, 0);
  });

  it("non-live-in siblings each collect ≈ $650/mo (negative net cost)", () => {
    const results = computeOwnerResults(guide3);
    expect(results[1].netMonthlyCost).toBeCloseTo(-650, 0);
    expect(results[2].netMonthlyCost).toBeCloseTo(-650, 0);
  });

  it("conservation: sum of net costs equals total carrying cost", () => {
    const results = computeOwnerResults(guide3);
    const carrying = totalMonthlyCarryingCost(guide3);
    const sumNet = results.reduce((s, r) => s + r.netMonthlyCost, 0);
    expect(sumNet).toBeCloseTo(carrying.total, 1);
  });
});

describe("totalMonthlyCarryingCost", () => {
  it("sums components correctly", () => {
    const c = totalMonthlyCarryingCost(baseScenario);
    expect(c.tax).toBe(800);
    expect(c.insurance).toBe(150);
    expect(c.maintenance).toBeCloseTo(666.67, 1);
    expect(c.total).toBeCloseTo(c.mortgage + c.tax + c.insurance + c.hoa + c.maintenance);
  });
});
