"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCalculatorStore } from "./calculatorStore";
import type { Owner, Occupancy } from "@/lib/calculator/types";

function OwnerRow({
  owner,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: {
  owner: Owner;
  index: number;
  canRemove: boolean;
  onUpdate: (field: "name" | "downPayment", value: string | number) => void;
  onRemove: () => void;
}) {
  const [rawDown, setRawDown] = useState(String(owner.downPayment));
  const downFocused = useRef(false);

  useEffect(() => {
    if (!downFocused.current) setRawDown(String(owner.downPayment));
  }, [owner.downPayment]);

  return (
    <div className="rounded-md border p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          value={owner.name}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder={`Owner ${index + 1}`}
          className="min-h-[44px] font-medium"
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={!canRemove}
          onClick={onRemove}
          className="min-h-[44px] min-w-[44px] shrink-0"
        >
          ✕
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Down Payment</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">$</span>
          <Input
            type="text"
            inputMode="decimal"
            value={rawDown}
            onFocus={() => { downFocused.current = true; }}
            onBlur={() => {
              downFocused.current = false;
              if (isNaN(parseFloat(rawDown))) setRawDown(String(owner.downPayment));
            }}
            onChange={(e) => {
              setRawDown(e.target.value);
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onUpdate("downPayment", v);
            }}
            className="min-h-[44px]"
          />
        </div>
      </div>
    </div>
  );
}

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

  function updateOwner(i: number, field: "name" | "downPayment", value: string | number) {
    const newOwners = owners.map((o, idx) =>
      idx === i ? { ...o, [field]: value } : o,
    );
    updateScenario({ owners: newOwners });
  }

  return (
    <div className="flex flex-col gap-4">
      {owners.map((owner, i) => (
        <OwnerRow
          key={i}
          owner={owner}
          index={i}
          canRemove={owners.length > 2}
          onUpdate={(field, value) => updateOwner(i, field, value)}
          onRemove={() => removeOwner(i)}
        />
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
