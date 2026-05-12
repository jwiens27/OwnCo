import { describe, expect, it } from "vitest";
import { compute } from "@/lib/calculator/compute";
import { SCENARIO_PRESETS } from "@/lib/calculator/presets";
import { validateScenario } from "@/lib/calculator/compute";

describe("validateScenario — preset sanity", () => {
  it("every SCENARIO_PRESET passes validation", () => {
    for (const [id, scenario] of Object.entries(SCENARIO_PRESETS)) {
      const errors = validateScenario(scenario);
      expect(errors, `${id} has validation errors: ${errors.join(", ")}`).toHaveLength(0);
    }
  });
});

describe("Fixture 1 — investor purchase (Guide 1)", () => {
  const results = compute(SCENARIO_PRESETS["investor-purchase"]);

  it("has no validation errors", () => {
    expect(results.validationErrors).toHaveLength(0);
  });

  it("total monthly carrying cost ≈ $3,653.56", () => {
    expect(results.totalMonthlyCarryingCost).toBeCloseTo(3653.56, 0);
  });

  it("monthly equity gain ≈ $1,536.89", () => {
    // month-1 principal on $350k@7%/30yr + appreciation ($500k×3%/12)
    expect(results.monthlyEquityGain).toBeCloseTo(1536.89, 0);
  });

  it("each investor net monthly cost ≈ $84.52 (rental income offsets carrying)", () => {
    results.ownerResults.forEach((r) => {
      expect(r.netMonthlyCost).toBeCloseTo(84.52, 0);
    });
  });

  it("each investor monthly equity gain share ≈ $512.30", () => {
    results.ownerResults.forEach((r) => {
      expect(r.monthlyEquityGainShare).toBeCloseTo(512.30, 0);
    });
  });

  it("no imputed rent (rented_out)", () => {
    expect(results.imputedRent).toBeNull();
  });

  it("conservation: sum of net costs = total carrying − total rental income", () => {
    const totalRental = results.ownerResults.reduce((s, r) => s + r.monthlyRentalIncomeShare, 0);
    const sumNet = results.ownerResults.reduce((s, r) => s + r.netMonthlyCost, 0);
    expect(sumNet).toBeCloseTo(results.totalMonthlyCarryingCost - totalRental, 1);
  });
});

describe("Fixture 3 — inheritance, one sibling lives in (Guide 3)", () => {
  const results = compute(SCENARIO_PRESETS["inheritance-one-lives-in"]);

  it("has no validation errors", () => {
    expect(results.validationErrors).toHaveLength(0);
  });

  it("live-in sibling net monthly cost ≈ $2,550 (not $3,616.67)", () => {
    expect(results.ownerResults[0].netMonthlyCost).toBeCloseTo(2550, 0);
  });

  it("non-live-in siblings each net ≈ −$650/mo (collecting)", () => {
    expect(results.ownerResults[1].netMonthlyCost).toBeCloseTo(-650, 0);
    expect(results.ownerResults[2].netMonthlyCost).toBeCloseTo(-650, 0);
  });

  it("conservation: sum of net costs = total carrying ($1,250)", () => {
    const sumNet = results.ownerResults.reduce((s, r) => s + r.netMonthlyCost, 0);
    expect(sumNet).toBeCloseTo(1250, 1);
  });

  it("live-in saves vs open-market rent: net rent cost = FMR × (1 − share)", () => {
    // FMR=3200, share=1/3 → net rent-only = 3200 × 2/3 ≈ 2133.33
    // live-in net cost = carrying share ($416.67) + net rent (2133.33) = $2,550
    const liveIn = results.ownerResults[0];
    const imputedEntry = results.imputedRent!.perOwner[0];
    const netRentOnly = -imputedEntry.monthlyNet; // positive = net payer
    expect(netRentOnly).toBeCloseTo(3200 * (1 - 1 / 3), 1);
  });

  it("imputed rent conservation: sum of monthlyNet ≈ 0", () => {
    const total = results.imputedRent!.perOwner.reduce((s, e) => s + e.monthlyNet, 0);
    expect(Math.abs(total)).toBeLessThan(1e-6);
  });
});
