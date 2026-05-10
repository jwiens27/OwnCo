import { describe, expect, it } from "vitest";
import { monthlyPayment, amortizationSchedule, balanceAtMonth } from "@/lib/calculator/mortgage";

describe("monthlyPayment", () => {
  const cases: [number, number, number, number, number][] = [
    [300000, 0.07, 30, 1995.91, 0.5],
    [500000, 0.06, 30, 2997.75, 0.5],
    [200000, 0.05, 15, 1581.59, 0.5],
    [100000, 0.04, 30, 477.42, 0.5],
    [0, 0.07, 30, 0, 0.01],
    [100000, 0, 30, 277.78, 0.5],
  ];
  it.each(cases)(
    "principal=%i rate=%f term=%iy → payment ≈ %f",
    (principal, rate, years, expected, tolerance) => {
      expect(monthlyPayment(principal, rate, years)).toBeCloseTo(expected, -Math.log10(tolerance));
    },
  );
});

describe("amortizationSchedule", () => {
  it("balance reaches zero at term end", () => {
    const schedule = amortizationSchedule(300000, 0.07, 30);
    expect(schedule).toHaveLength(360);
    expect(schedule[359].balance).toBeCloseTo(0, 1);
  });

  it("first row has high interest, low principal", () => {
    const schedule = amortizationSchedule(300000, 0.07, 30);
    expect(schedule[0].interest).toBeGreaterThan(schedule[0].principal);
  });

  it("last row has low interest, high principal", () => {
    const schedule = amortizationSchedule(300000, 0.07, 30);
    expect(schedule[359].interest).toBeLessThan(schedule[359].principal);
  });
});

describe("balanceAtMonth", () => {
  it("returns full principal at month 0", () => {
    expect(balanceAtMonth(300000, 0.07, 30, 0)).toBe(300000);
  });
  it("returns 0 after term end", () => {
    expect(balanceAtMonth(300000, 0.07, 30, 360)).toBeCloseTo(0, 1);
  });
});
