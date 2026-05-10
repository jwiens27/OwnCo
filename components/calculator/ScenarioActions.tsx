"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function DisabledButton({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button disabled variant="outline">
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  );
}

export function ScenarioActions() {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        <DisabledButton label="Save" />
        <DisabledButton label="Share" />
        <DisabledButton label="PDF" />
      </div>
    </TooltipProvider>
  );
}
