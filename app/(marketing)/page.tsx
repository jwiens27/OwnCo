import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Co-Ownership Made Simple</h1>
      <Link
        href="/calculator"
        className="mt-8 inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Open Calculator
      </Link>
    </section>
  );
}
