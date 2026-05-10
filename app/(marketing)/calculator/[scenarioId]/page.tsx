export default async function SharedScenarioPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Shared Scenario</h1>
      <p className="mt-2 text-muted-foreground">Scenario ID: {scenarioId} — wired in Phase 4.</p>
    </section>
  );
}
