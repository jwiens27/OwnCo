"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCalculatorStore } from "./calculatorStore";

function NumericField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          min={min}
          max={max}
          step={step ?? 1}
          value={value}
          onChange={(e) => {
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

  return (
    <div className="flex flex-col gap-4">
      <NumericField
        label="Purchase Price"
        prefix="$"
        value={scenario.purchasePrice}
        onChange={(v) => updateScenario({ purchasePrice: v })}
        min={0}
        step={1000}
      />
      <NumericField
        label="Property Tax (annual)"
        prefix="$"
        value={scenario.propertyTaxAnnual}
        onChange={(v) => updateScenario({ propertyTaxAnnual: v })}
        min={0}
        step={100}
      />
      <NumericField
        label="Insurance (annual)"
        prefix="$"
        value={scenario.insuranceAnnual}
        onChange={(v) => updateScenario({ insuranceAnnual: v })}
        min={0}
        step={100}
      />
      <NumericField
        label="HOA (monthly)"
        prefix="$"
        value={scenario.hoaMonthly}
        onChange={(v) => updateScenario({ hoaMonthly: v })}
        min={0}
        step={50}
      />
      <NumericField
        label="Maintenance Reserve"
        value={parseFloat((scenario.maintenanceReserveAnnualPct * 100).toFixed(2))}
        onChange={(v) => updateScenario({ maintenanceReserveAnnualPct: v / 100 })}
        min={0}
        max={10}
        step={0.1}
        suffix="% /yr"
      />
      {/* TODO(spec): expectedAppreciationPct not assigned to an input panel section */}
      <NumericField
        label="Expected Appreciation"
        value={parseFloat((scenario.expectedAppreciationPct * 100).toFixed(2))}
        onChange={(v) => updateScenario({ expectedAppreciationPct: v / 100 })}
        min={-20}
        max={50}
        step={0.1}
        suffix="% /yr"
      />
    </div>
  );
}
