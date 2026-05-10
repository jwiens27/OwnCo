import { describe, expect, it } from "vitest";
import { computeImputedRent } from "@/lib/calculator/imputedRent";
import type { Scenario } from "@/lib/calculator/types";

const baseScenario: Scenario = {
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
  occupancy: { type: "owner_occupied", liveInOwnerIndices: [0], fairMarketRent: 4000 },
  expectedAppreciationPct: 0.03,
};

describe("computeImputedRent", () => {
  it("returns null for rented_out", () => {
    const s = { ...baseScenario, occupancy: { type: "rented_out", expectedMonthlyRent: 4000 } as const };
    expect(computeImputedRent(s)).toBeNull();
  });

  it("1 of 4 lives in: that owner pays full fmr; others receive proportional to their non-live-in shares", () => {
    const r = computeImputedRent(baseScenario)!;
    expect(r.perLiveInOwnerOwed).toEqual([{ ownerIndex: 0, amount: 4000 }]);
    expect(r.perNonLiveInOwnerReceived).toHaveLength(3);
    r.perNonLiveInOwnerReceived.forEach(e => {
      expect(e.amount).toBeCloseTo(4000 / 3);
    });
  });

  it("2 of 4 lives in: each pays half fmr", () => {
    const s = { ...baseScenario, occupancy: { type: "owner_occupied", liveInOwnerIndices: [0, 1], fairMarketRent: 4000 } as const };
    const r = computeImputedRent(s)!;
    r.perLiveInOwnerOwed.forEach(e => expect(e.amount).toBe(2000));
  });

  it("all 4 live in: each pays fmr/4, no one receives", () => {
    const s = { ...baseScenario, occupancy: { type: "owner_occupied", liveInOwnerIndices: [0, 1, 2, 3], fairMarketRent: 4000 } as const };
    const r = computeImputedRent(s)!;
    r.perLiveInOwnerOwed.forEach(e => expect(e.amount).toBe(1000));
    expect(r.perNonLiveInOwnerReceived).toHaveLength(0);
  });

  it("unequal ownership: non-live-in receivers get amounts proportional to their shares", () => {
    const s: Scenario = {
      ...baseScenario,
      owners: [
        { name: "A", downPayment: 100000, currentMonthlyRent: 0 },
        { name: "B", downPayment: 60000, currentMonthlyRent: 0 },
        { name: "C", downPayment: 40000, currentMonthlyRent: 0 },
      ],
      occupancy: { type: "owner_occupied", liveInOwnerIndices: [0], fairMarketRent: 3000 },
    };
    const r = computeImputedRent(s)!;
    const b = r.perNonLiveInOwnerReceived.find(e => e.ownerIndex === 1)!;
    const c = r.perNonLiveInOwnerReceived.find(e => e.ownerIndex === 2)!;
    expect(b.amount).toBeCloseTo(1800);
    expect(c.amount).toBeCloseTo(1200);
  });
});
