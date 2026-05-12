export function InheritanceRentOutGuide() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <section>
        <h3 className="font-semibold text-foreground mb-2">When to use this</h3>
        <p>
          Multiple heirs inherit a property and agree to hold it as a rental rather than sell.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">What to enter</h3>
        <ul className="space-y-1.5 list-disc pl-4">
          <li>Set <strong className="text-foreground">Acquisition mode → Inheritance</strong>.</li>
          <li><strong className="text-foreground">Current fair market value:</strong> the estate appraisal value at the date of inheritance.</li>
          <li><strong className="text-foreground">Inherited equity stake per heir:</strong> for equal heirs, (FMV − remaining mortgage) ÷ number of heirs. If splits are unequal, use the figures from the will or settlement.</li>
          <li><strong className="text-foreground">Existing mortgage rate / remaining term:</strong> from the most recent loan statement. If paid off, set rate to 0 and leave term at 30.</li>
          <li><strong className="text-foreground">Property tax:</strong> use the post-transfer assessed figure.</li>
          <li><strong className="text-foreground">Insurance:</strong> landlord policy.</li>
          <li><strong className="text-foreground">Occupancy → Rented out.</strong> Enter the expected market rent.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">What to look at</h3>
        <ul className="space-y-1.5 list-disc pl-4">
          <li><strong className="text-foreground">Per-heir net monthly cash flow.</strong> Each heir&apos;s share of rent minus their share of carrying costs.</li>
          <li><strong className="text-foreground">Equity per heir over time.</strong> Appreciation grows the inherited basis.</li>
          <li><strong className="text-foreground">Whether the property covers itself.</strong> If net cash flow is negative, heirs are subsidizing the property out of pocket.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">Known gaps</h3>
        <p>
          The &ldquo;Appreciation gain at Year N&rdquo; figure subtracts the inherited equity stake only. Step-up
          basis tax treatment is not modeled. Buyout flows — one heir wanting out while others keep
          the property — aren&apos;t modeled.
        </p>
      </section>
    </div>
  );
}
