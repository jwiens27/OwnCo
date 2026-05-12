export function InheritanceOneLivesInGuide() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <section>
        <h3 className="font-semibold text-foreground mb-2">When to use this</h3>
        <p>
          Heirs inherit a property and one of them lives in it. To keep things fair, the live-in
          heir pays rent to the others.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">What to enter</h3>
        <ul className="space-y-1.5 list-disc pl-4">
          <li>Set <strong className="text-foreground">Acquisition mode → Inheritance</strong>.</li>
          <li><strong className="text-foreground">Current fair market value:</strong> estate appraisal.</li>
          <li><strong className="text-foreground">Inherited equity stake per heir:</strong> as in Guide 2.</li>
          <li><strong className="text-foreground">Existing mortgage:</strong> rate and remaining term, or 0% if paid off.</li>
          <li><strong className="text-foreground">Occupancy → Owner-occupied.</strong> Check the live-in heir. Enter <strong className="text-foreground">fair market rent</strong> — what the home would rent for on the open market.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">What to look at</h3>
        <ul className="space-y-1.5 list-disc pl-4">
          <li><strong className="text-foreground">Imputed Rent callout.</strong> Shows exactly how much the live-in heir pays into the partnership and how much each non-live-in heir receives, prorated by ownership share.</li>
          <li><strong className="text-foreground">Live-in heir&apos;s net monthly cost.</strong> Their effective housing cost — usually well below open-market rent because they&apos;re paying rent partly &ldquo;to themselves&rdquo; (their own ownership share).</li>
          <li><strong className="text-foreground">Non-live-in heirs&apos; net monthly cash flow.</strong> Often positive: rent income exceeds their share of carrying costs.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">Known gaps</h3>
        <p>
          Below-market or family-rate arrangements aren&apos;t a separate field — model them by
          entering a lower fair market rent. The calculator doesn&apos;t track how often non-live-in
          heirs visit. If visiting time should reduce the live-in heir&apos;s rent, handle that in a
          side agreement.
        </p>
      </section>
    </div>
  );
}
