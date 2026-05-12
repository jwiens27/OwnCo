export function InheritanceVacationGuide() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <section>
        <h3 className="font-semibold text-foreground mb-2">When to use this</h3>
        <p>
          Heirs inherit a second home and share its use across the year. Nobody lives in it
          full-time; nobody pays rent.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">What to enter</h3>
        <ul className="space-y-1.5 list-disc pl-4">
          <li>Set <strong className="text-foreground">Acquisition mode → Inheritance</strong>.</li>
          <li><strong className="text-foreground">Current fair market value:</strong> estate appraisal.</li>
          <li><strong className="text-foreground">Inherited equity stake per heir:</strong> as in Guide 2.</li>
          <li><strong className="text-foreground">Existing mortgage:</strong> rate and remaining term, or 0% if paid off.</li>
          <li><strong className="text-foreground">Maintenance reserve:</strong> vacation properties run higher — 1.5–2% — because of seasonal exposure and underuse.</li>
          <li><strong className="text-foreground">Occupancy → Owner-occupied.</strong> Check <em>all</em> heirs as live-in. Enter the property&apos;s fair market rent.</li>
        </ul>
        <p className="mt-2">
          The all-live-in setup makes imputed rent flows net to zero between heirs — the property is
          financially neutral to use beyond carrying costs.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">What to look at</h3>
        <ul className="space-y-1.5 list-disc pl-4">
          <li><strong className="text-foreground">Per-heir share of carrying costs.</strong> Taxes, insurance, maintenance, and any mortgage payment, split by ownership share.</li>
          <li><strong className="text-foreground">Appreciation gain per heir over time.</strong> Since the property is paid off, all equity gain comes from appreciation alone.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">Known gaps</h3>
        <p>
          <strong className="text-foreground">The calculator does not model usage rotation.</strong> If heirs will use the home asymmetrically, the financial fairness needs a separate written usage agreement. Side payments (one heir buying out another&apos;s unused weeks) aren&apos;t modeled.
        </p>
      </section>
    </div>
  );
}
