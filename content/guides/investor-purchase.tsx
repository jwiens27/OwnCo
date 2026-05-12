export function InvestorPurchaseGuide() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <section>
        <h3 className="font-semibold text-foreground mb-2">When to use this</h3>
        <p>
          Two or more investors are pooling cash to buy a property and rent it out for income and
          appreciation. Nobody lives in it.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">What to enter</h3>
        <ul className="space-y-1.5 list-disc pl-4">
          <li>Set <strong className="text-foreground">Acquisition mode → Purchase</strong>.</li>
          <li><strong className="text-foreground">Purchase price:</strong> the agreed acquisition price.</li>
          <li><strong className="text-foreground">Property tax / insurance / HOA:</strong> from the listing or comparable properties. Use a landlord insurance quote, not homeowner&apos;s.</li>
          <li><strong className="text-foreground">Maintenance reserve:</strong> 1.5–2% of value per year for rentals; older buildings on the higher end.</li>
          <li><strong className="text-foreground">Mortgage rate / term:</strong> from a lender pre-approval.</li>
          <li><strong className="text-foreground">Owners:</strong> add 2–6 investors with the cash each is contributing.</li>
          <li><strong className="text-foreground">Occupancy → Rented out.</strong> Enter the expected monthly market rent.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">What to look at</h3>
        <ul className="space-y-1.5 list-disc pl-4">
          <li><strong className="text-foreground">Net monthly cash flow per owner.</strong> Negative means contributing each month; positive means collecting.</li>
          <li><strong className="text-foreground">Equity gain over time.</strong> Per-owner appreciation plus principal paydown.</li>
          <li><strong className="text-foreground">Net gain at Year 5/10/30.</strong> Total return minus total cash invested.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">Known gaps</h3>
        <p>
          No tax modeling — depreciation, interest deduction, and capital-gains treatment are not
          included; consult an accountant. Rent is assumed collected 12 months a year (no vacancy).
          Property management fees aren&apos;t a separate field — fold them into the maintenance reserve.
        </p>
      </section>
    </div>
  );
}
