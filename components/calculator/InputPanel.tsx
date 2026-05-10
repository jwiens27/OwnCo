"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyInputs } from "./PropertyInputs";
import { MortgageInputs } from "./MortgageInputs";
import { OwnerInputs } from "./OwnerInputs";
import { OccupancyInputs } from "./OccupancyInputs";

export function InputPanel() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Property</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyInputs />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Mortgage</CardTitle>
        </CardHeader>
        <CardContent>
          <MortgageInputs />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Owners</CardTitle>
        </CardHeader>
        <CardContent>
          <OwnerInputs />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <OccupancyInputs />
        </CardContent>
      </Card>
    </div>
  );
}
