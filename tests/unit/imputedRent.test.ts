import { describe, expect, it } from "vitest";
import { computeImputedRent } from "@/lib/calculator/imputedRent";
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
  occupancy: { type: "owner_occupied", liveInOwnerIndices: [0], fairMarketRent: 4000 },
  expectedAppreciationPct: 0.03,
};

describe("computeImputedRent", () => {
  it("returns null for rented_out", () => {
    const s = { ...baseScenario, occupancy: { type: "rented_out", expectedMonthlyRent: 4000 } as const };
    expect(computeImputedRent(s)).toBeNull();
  });

  it("1 of 4 lives in: live-in pays FMR, all owners receive FMR×share", () => {
    // Equal shares (50k each of 200k total = 25% each), FMR=4000, k=1
    // Live-in (owner 0): paid=4000, received=4000×0.25=1000, net=-3000
    // Non-live-ins: paid=0, received=1000 each
    const r = computeImputedRent(baseScenario)!;
    expect(r.totalFmr).toBe(4000);
    expect(r.liveInCount).toBe(1);

    const liveIn = r.perOwner.find((e) => e.ownerIndex === 0)!;
    expect(liveIn.isLiveIn).toBe(true);
    expect(liveIn.monthlyPaid).toBeCloseTo(4000);
    expect(liveIn.monthlyReceived).toBeCloseTo(1000);
    expect(liveIn.monthlyNet).toBeCloseTo(-3000);

    const nonLiveIns = r.perOwner.filter((e) => !e.isLiveIn);
    expect(nonLiveIns).toHaveLength(3);
    nonLiveIns.forEach((e) => {
      expect(e.monthlyPaid).toBe(0);
      expect(e.monthlyReceived).toBeCloseTo(1000);
    });
  });

  it("2 of 4 live in: each pays FMR/2, all owners receive FMR×share", () => {
    // k=2, FMR=4000, equal shares (25%)
    // Live-ins: paid=2000, received=1000, net=-1000
    // Non-live-ins: paid=0, received=1000
    const s = { ...baseScenario, occupancy: { type: "owner_occupied", liveInOwnerIndices: [0, 1], fairMarketRent: 4000 } as const };
    const r = computeImputedRent(s)!;

    const liveIns = r.perOwner.filter((e) => e.isLiveIn);
    liveIns.forEach((e) => {
      expect(e.monthlyPaid).toBeCloseTo(2000);
      expect(e.monthlyReceived).toBeCloseTo(1000);
      expect(e.monthlyNet).toBeCloseTo(-1000);
    });
    const nonLiveIns = r.perOwner.filter((e) => !e.isLiveIn);
    nonLiveIns.forEach((e) => {
      expect(e.monthlyPaid).toBe(0);
      expect(e.monthlyReceived).toBeCloseTo(1000);
    });
  });

  it("all 4 live in: each pays FMR/4 and receives FMR/4 (net 0)", () => {
    const s = { ...baseScenario, occupancy: { type: "owner_occupied", liveInOwnerIndices: [0, 1, 2, 3], fairMarketRent: 4000 } as const };
    const r = computeImputedRent(s)!;
    r.perOwner.forEach((e) => {
      expect(e.isLiveIn).toBe(true);
      expect(e.monthlyPaid).toBeCloseTo(1000);
      expect(e.monthlyReceived).toBeCloseTo(1000);
      expect(e.monthlyNet).toBeCloseTo(0);
    });
  });

  it("unequal ownership: all owners receive amounts proportional to their absolute share", () => {
    // A=100k/200k=50%, B=60k/200k=30%, C=40k/200k=20%, FMR=3000, A lives in (k=1)
    // A: paid=3000, received=3000×0.50=1500, net=-1500
    // B: paid=0, received=3000×0.30=900
    // C: paid=0, received=3000×0.20=600
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
    const a = r.perOwner.find((e) => e.ownerIndex === 0)!;
    const b = r.perOwner.find((e) => e.ownerIndex === 1)!;
    const c = r.perOwner.find((e) => e.ownerIndex === 2)!;
    expect(a.monthlyPaid).toBeCloseTo(3000);
    expect(a.monthlyReceived).toBeCloseTo(1500);
    expect(b.monthlyReceived).toBeCloseTo(900);
    expect(c.monthlyReceived).toBeCloseTo(600);
  });

  it("conservation: sum of monthlyNet is 0 for any scenario", () => {
    const r = computeImputedRent(baseScenario)!;
    const total = r.perOwner.reduce((s, e) => s + e.monthlyNet, 0);
    expect(Math.abs(total)).toBeLessThan(1e-6);
  });

  it("economic sanity: single live-in's rent-only cost equals FMR × (1 − share)", () => {
    // Owner 0 is the only live-in, share=0.25, FMR=4000
    // Net paid = paid - received = 4000 - 1000 = 3000 = 4000 × (1 - 0.25)
    const r = computeImputedRent(baseScenario)!;
    const liveIn = r.perOwner.find((e) => e.isLiveIn)!;
    const expectedNetRent = 4000 * (1 - 0.25);
    expect(-liveIn.monthlyNet).toBeCloseTo(expectedNetRent);
  });
});
