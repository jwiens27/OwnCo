"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCalculatorStore } from "./calculatorStore";
import type { Occupancy } from "@/lib/calculator/types";

export function OwnerInputs() {
  const { scenario, updateScenario } = useCalculatorStore();
  const { owners, occupancy } = scenario;

  function addOwner() {
    if (owners.length >= 6) return;
    updateScenario({
      owners: [
        ...owners,
        { name: `Owner ${owners.length + 1}`, downPayment: 0, currentMonthlyRent: 0 },
      ],
    });
  }

  function removeOwner(i: number) {
    if (owners.length <= 2) return;
    const newOwners = owners.filter((_, idx) => idx !== i);
    let newOccupancy: Occupancy = occupancy;
    if (occupancy.type === "owner_occupied" || occupancy.type === "mixed") {
      const newLiveIn = occupancy.liveInOwnerIndices
        .filter((idx) => idx !== i)
        .map((idx) => (idx > i ? idx - 1 : idx));
      newOccupancy = { ...occupancy, liveInOwnerIndices: newLiveIn };
    }
    updateScenario({ owners: newOwners, occupancy: newOccupancy });
  }

  function updateOwner(i: number, field: "name" | "downPayment" | "currentMonthlyRent", value: string | number) {
    const newOwners = owners.map((o, idx) =>
      idx === i ? { ...o, [field]: value } : o,
    );
    updateScenario({ owners: newOwners });
  }

  return (
    <div className="flex flex-col gap-4">
      {owners.map((owner, i) => (
        <div key={i} className="rounded-md border p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Input
              value={owner.name}
              onChange={(e) => updateOwner(i, "name", e.target.value)}
              placeholder={`Owner ${i + 1}`}
              className="min-h-[44px] font-medium"
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={owners.length <= 2}
              onClick={() => removeOwner(i)}
              className="min-h-[44px] min-w-[44px] shrink-0"
            >
              ✕
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Down Payment</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={owner.downPayment}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) updateOwner(i, "downPayment", v);
                  }}
                  className="min-h-[44px]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Alt. Housing Cost</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  step={50}
                  value={owner.currentMonthlyRent}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) updateOwner(i, "currentMonthlyRent", v);
                  }}
                  className="min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        disabled={owners.length >= 6}
        onClick={addOwner}
        className="min-h-[44px]"
      >
        + Add Owner
      </Button>
    </div>
  );
}
