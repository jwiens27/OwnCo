"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCalculatorStore } from "./calculatorStore";
import { FieldTooltip } from "./FieldTooltip";
import { FIELD_LABELS, TOOLTIP_COPY } from "@/lib/calculator/modes";

function NumericField({
  label,
  tooltip,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  const [raw, setRaw] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(String(value));
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm flex items-center">
        {label}
        <FieldTooltip>{tooltip}</FieldTooltip>
      </Label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <Input
          type="text"
          inputMode="decimal"
          value={raw}
          onFocus={() => { focused.current = true; }}
          onBlur={() => {
            focused.current = false;
            if (isNaN(parseFloat(raw))) setRaw(String(value));
          }}
          onChange={(e) => {
            setRaw(e.target.value);
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className="min-h-[44px]"
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

export function PropertyInputs() {
  const { scenario, updateScenario } = useCalculatorStore();
  const mode = scenario.acquisitionMode;
  const labels = FIELD_LABELS[mode];
  const tips = TOOLTIP_COPY[mode];

  return (
    <div className="flex flex-col gap-4">
      <NumericField
        label={labels.purchasePrice}
        tooltip={tips.purchasePrice}
        prefix="$"
        value={scenario.purchasePrice}
        onChange={(v) => updateScenario({ purchasePrice: v })}
      />
      <NumericField
        label={labels.propertyTaxAnnual}
        tooltip={tips.propertyTaxAnnual}
        prefix="$"
        value={scenario.propertyTaxAnnual}
        onChange={(v) => updateScenario({ propertyTaxAnnual: v })}
      />
      <NumericField
        label={labels.insuranceAnnual}
        tooltip={tips.insuranceAnnual}
        prefix="$"
        value={scenario.insuranceAnnual}
        onChange={(v) => updateScenario({ insuranceAnnual: v })}
      />
      <NumericField
        label={labels.hoaMonthly}
        tooltip={tips.hoaMonthly}
        prefix="$"
        value={scenario.hoaMonthly}
        onChange={(v) => updateScenario({ hoaMonthly: v })}
      />
      <NumericField
        label={labels.maintenanceReserveAnnualPct}
        tooltip={tips.maintenanceReserveAnnualPct}
        value={parseFloat((scenario.maintenanceReserveAnnualPct * 100).toFixed(2))}
        onChange={(v) => updateScenario({ maintenanceReserveAnnualPct: v / 100 })}
        suffix="% /yr"
      />
      <NumericField
        label={labels.expectedAppreciationPct}
        tooltip={tips.expectedAppreciationPct}
        value={parseFloat((scenario.expectedAppreciationPct * 100).toFixed(2))}
        onChange={(v) => updateScenario({ expectedAppreciationPct: v / 100 })}
        suffix="% /yr"
      />
    </div>
  );
}
