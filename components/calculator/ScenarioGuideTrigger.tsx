"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCalculatorStore } from "./calculatorStore";
import { SCENARIO_PRESETS, type GuideId } from "@/lib/calculator/presets";
import { DEFAULT_SCENARIO } from "@/lib/calculator/defaults";
import { ScenarioGuideDialog } from "./ScenarioGuideDialog";
import { ScenarioGuidePanel } from "./ScenarioGuidePanel";

// sentinel to detect if scenario has been modified from defaults
function isDefault(scenario: ReturnType<typeof useCalculatorStore>["scenario"]) {
  return JSON.stringify(scenario) === JSON.stringify(DEFAULT_SCENARIO);
}

export function ScenarioGuideTrigger() {
  const { scenario, setScenario } = useCalculatorStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [panelGuide, setPanelGuide] = useState<GuideId | null>(null);
  const [pendingGuide, setPendingGuide] = useState<GuideId | null>(null);

  function handleSelect(id: GuideId) {
    setDialogOpen(false);
    if (!isDefault(scenario)) {
      setPendingGuide(id);
    } else {
      loadGuide(id);
    }
  }

  function loadGuide(id: GuideId) {
    setScenario(SCENARIO_PRESETS[id]);
    setPanelGuide(id);
    setPendingGuide(null);
  }

  function handleReset() {
    setScenario(DEFAULT_SCENARIO);
    setPanelGuide(null);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
        Guides
      </Button>

      {dialogOpen && (
        <ScenarioGuideDialog
          onSelect={handleSelect}
          onClose={() => setDialogOpen(false)}
        />
      )}

      {pendingGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
            <p className="font-semibold">Replace current scenario?</p>
            <p className="text-sm text-muted-foreground">
              Your current inputs will be replaced with the guide preset. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPendingGuide(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => loadGuide(pendingGuide)}>
                Replace
              </Button>
            </div>
          </div>
        </div>
      )}

      {panelGuide && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l bg-card shadow-xl lg:w-[380px]">
          <ScenarioGuidePanel
            guideId={panelGuide}
            onReset={handleReset}
            onClose={() => setPanelGuide(null)}
          />
        </div>
      )}
    </>
  );
}
