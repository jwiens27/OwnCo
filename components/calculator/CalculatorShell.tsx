"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCalculatorStore } from "./calculatorStore";
import { decodeScenario, encodeScenario } from "@/lib/calculator/scenario";
import { compute } from "@/lib/calculator/compute";
import { DEFAULT_SCENARIO } from "@/lib/calculator/defaults";
import { InputPanel } from "./InputPanel";
import { ResultsPanel } from "./ResultsPanel";

type Props = { searchParamsPromise: Promise<{ s?: string }> };

export function CalculatorShell({ searchParamsPromise }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { scenario, setScenario } = useCalculatorStore();

  // Initialize from URL on mount.
  useEffect(() => {
    searchParamsPromise.then((params) => {
      if (params.s) {
        const decoded = decodeScenario(params.s);
        if (decoded) setScenario(decoded);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write scenario back to URL (debounced).
  useEffect(() => {
    const handle = setTimeout(() => {
      const encoded = encodeScenario(scenario);
      router.replace(`${pathname}?s=${encoded}`, { scroll: false });
    }, 300);
    return () => clearTimeout(handle);
  }, [scenario, router, pathname]);

  const results = useMemo(() => compute(scenario), [scenario]);
  const isDefaultScenario = useMemo(
    () => JSON.stringify(scenario) === JSON.stringify(DEFAULT_SCENARIO),
    [scenario],
  );

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[40fr_60fr]">
      <InputPanel />
      <ResultsPanel
        results={results}
        mode={scenario.acquisitionMode}
        isDefaultScenario={isDefaultScenario}
      />
    </div>
  );
}
