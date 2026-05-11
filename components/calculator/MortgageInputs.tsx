"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCalculatorStore } from "./calculatorStore";

export function MortgageInputs() {
  const { scenario, updateScenario } = useCalculatorStore();
  const ratePercent = parseFloat((scenario.mortgageRate * 100).toFixed(3));
  const [rawRate, setRawRate] = useState(String(ratePercent));
  const rateFocused = useRef(false);

  useEffect(() => {
    if (!rateFocused.current) setRawRate(String(ratePercent));
  }, [ratePercent]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Interest Rate</Label>
        <div className="flex items-center gap-3">
          <Slider
            min={0}
            max={10}
            step={0.125}
            value={[ratePercent]}
            onValueChange={(v) => {
              const val = Array.isArray(v) ? v[0] : v;
              updateScenario({ mortgageRate: Number(val) / 100 });
            }}
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            <Input
              type="text"
              inputMode="decimal"
              value={rawRate}
              onFocus={() => { rateFocused.current = true; }}
              onBlur={() => {
                rateFocused.current = false;
                if (isNaN(parseFloat(rawRate))) setRawRate(String(ratePercent));
              }}
              onChange={(e) => {
                setRawRate(e.target.value);
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v >= 0 && v <= 10) {
                  updateScenario({ mortgageRate: v / 100 });
                }
              }}
              className="w-20 min-h-[44px]"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Loan Term</Label>
        <Select
          value={String(scenario.mortgageTermYears)}
          onValueChange={(v) => { if (v !== null) updateScenario({ mortgageTermYears: parseInt(v) }); }}
        >
          <SelectTrigger className="min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 years</SelectItem>
            <SelectItem value="20">20 years</SelectItem>
            <SelectItem value="30">30 years</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
