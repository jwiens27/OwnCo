"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCalculatorStore } from "./calculatorStore";
import { FieldTooltip } from "./FieldTooltip";
import { FIELD_LABELS, TOOLTIP_COPY } from "@/lib/calculator/modes";
import type { Occupancy } from "@/lib/calculator/types";

export function OccupancyInputs() {
  const { scenario, updateScenario } = useCalculatorStore();
  const { occupancy, owners, acquisitionMode } = scenario;
  const labels = FIELD_LABELS[acquisitionMode];
  const tips = TOOLTIP_COPY[acquisitionMode];

  const rentedOutValue = occupancy.type === "rented_out" ? occupancy.expectedMonthlyRent : 0;
  const fmrValue = (occupancy.type === "owner_occupied" || occupancy.type === "mixed") ? occupancy.fairMarketRent : 0;
  const externalRentValue = occupancy.type === "mixed" ? occupancy.externalMonthlyRent : 0;

  const [rawRentedOut, setRawRentedOut] = useState(String(rentedOutValue));
  const [rawFmr, setRawFmr] = useState(String(fmrValue));
  const [rawExternal, setRawExternal] = useState(String(externalRentValue));
  const rentedOutFocused = useRef(false);
  const fmrFocused = useRef(false);
  const externalFocused = useRef(false);

  useEffect(() => { if (!rentedOutFocused.current) setRawRentedOut(String(rentedOutValue)); }, [rentedOutValue]);
  useEffect(() => { if (!fmrFocused.current) setRawFmr(String(fmrValue)); }, [fmrValue]);
  useEffect(() => { if (!externalFocused.current) setRawExternal(String(externalRentValue)); }, [externalRentValue]);

  function handleTypeChange(type: string | null) {
    if (!type) return;
    let newOccupancy: Occupancy;
    switch (type) {
      case "rented_out":
        newOccupancy = { type: "rented_out", expectedMonthlyRent: 0 };
        break;
      case "owner_occupied":
        newOccupancy = {
          type: "owner_occupied",
          liveInOwnerIndices: owners.map((_, i) => i),
          fairMarketRent: 3500,
        };
        break;
      case "mixed":
        newOccupancy = {
          type: "mixed",
          liveInOwnerIndices: owners.map((_, i) => i),
          fairMarketRent: 3500,
          externalMonthlyRent: 0,
        };
        break;
      default:
        return;
    }
    updateScenario({ occupancy: newOccupancy });
  }

  function toggleLiveIn(ownerIndex: number) {
    if (occupancy.type === "rented_out") return;
    const current = occupancy.liveInOwnerIndices;
    const newIndices = current.includes(ownerIndex)
      ? current.filter((i) => i !== ownerIndex)
      : [...current, ownerIndex].sort((a, b) => a - b);
    updateScenario({ occupancy: { ...occupancy, liveInOwnerIndices: newIndices } });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm flex items-center">
          {labels.occupancyType}
          <FieldTooltip>{tips.occupancyType}</FieldTooltip>
        </Label>
        <Select value={occupancy.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rented_out">Rented Out</SelectItem>
            <SelectItem value="owner_occupied">Owner Occupied</SelectItem>
            <SelectItem value="mixed">Mixed (live-in + rental unit)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {occupancy.type === "rented_out" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm flex items-center">
            {labels.expectedMonthlyRent}
            <FieldTooltip>{tips.expectedMonthlyRent}</FieldTooltip>
          </Label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="text"
              inputMode="decimal"
              value={rawRentedOut}
              onFocus={() => { rentedOutFocused.current = true; }}
              onBlur={() => {
                rentedOutFocused.current = false;
                if (isNaN(parseFloat(rawRentedOut))) setRawRentedOut(String(rentedOutValue));
              }}
              onChange={(e) => {
                setRawRentedOut(e.target.value);
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) updateScenario({ occupancy: { ...occupancy, expectedMonthlyRent: v } });
              }}
              className="min-h-[44px]"
            />
          </div>
        </div>
      )}

      {(occupancy.type === "owner_occupied" || occupancy.type === "mixed") && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm flex items-center">
              {labels.fairMarketRent}
              <FieldTooltip>{tips.fairMarketRent}</FieldTooltip>
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={rawFmr}
                onFocus={() => { fmrFocused.current = true; }}
                onBlur={() => {
                  fmrFocused.current = false;
                  if (isNaN(parseFloat(rawFmr))) setRawFmr(String(fmrValue));
                }}
                onChange={(e) => {
                  setRawFmr(e.target.value);
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) updateScenario({ occupancy: { ...occupancy, fairMarketRent: v } });
                }}
                className="min-h-[44px]"
              />
            </div>
          </div>

          {occupancy.type === "mixed" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm flex items-center">
                {labels.externalMonthlyRent}
                <FieldTooltip>{tips.externalMonthlyRent}</FieldTooltip>
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={rawExternal}
                  onFocus={() => { externalFocused.current = true; }}
                  onBlur={() => {
                    externalFocused.current = false;
                    if (isNaN(parseFloat(rawExternal))) setRawExternal(String(externalRentValue));
                  }}
                  onChange={(e) => {
                    setRawExternal(e.target.value);
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) updateScenario({ occupancy: { ...occupancy, externalMonthlyRent: v } });
                  }}
                  className="min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-sm flex items-center">
              {labels.liveInOwnerIndices}
              <FieldTooltip>{tips.liveInOwnerIndices}</FieldTooltip>
            </Label>
            {owners.map((owner, i) => (
              <label
                key={i}
                className="flex items-center gap-2 cursor-pointer min-h-[44px]"
              >
                <input
                  type="checkbox"
                  checked={occupancy.liveInOwnerIndices.includes(i)}
                  onChange={() => toggleLiveIn(i)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm">{owner.name}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
