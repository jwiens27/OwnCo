"use client";

import { useCalculatorStore } from "./calculatorStore";
import type { AcquisitionMode } from "@/lib/calculator/types";

const MODES: { value: AcquisitionMode; label: string }[] = [
  { value: "purchase", label: "Purchase" },
  { value: "inheritance", label: "Inheritance" },
];

export function AcquisitionModeToggle() {
  const { scenario, updateScenario } = useCalculatorStore();
  const current = scenario.acquisitionMode;

  return (
    <div className="flex rounded-md border overflow-hidden">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => updateScenario({ acquisitionMode: m.value })}
          className={
            "flex-1 py-2 px-4 text-sm font-medium transition-colors " +
            (current === m.value
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground")
          }
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
