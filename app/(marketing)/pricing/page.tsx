export default function PricingPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
      <p className="mt-4 text-muted-foreground">Pricing details coming soon.</p>
      <form className="mt-8 flex flex-col items-center gap-3">
        <input
          type="email"
          placeholder="your@email.com"
          className="w-64 rounded-md border bg-background px-3 py-2 text-sm"
          disabled
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          disabled
        >
          Join waitlist
        </button>
      </form>
    </section>
  );
}
