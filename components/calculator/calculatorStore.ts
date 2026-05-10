import { create } from "zustand";
import type { Scenario } from "@/lib/calculator/types";
import { DEFAULT_SCENARIO } from "@/lib/calculator/defaults";

type CalculatorState = {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  updateScenario: (patch: Partial<Scenario>) => void;
};

export const useCalculatorStore = create<CalculatorState>((set) => ({
  scenario: DEFAULT_SCENARIO,
  setScenario: (s) => set({ scenario: s }),
  updateScenario: (patch) => set((state) => ({ scenario: { ...state.scenario, ...patch } })),
}));
