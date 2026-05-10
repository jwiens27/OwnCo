import { CalculatorShell } from "@/components/calculator/CalculatorShell";

export default function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  return <CalculatorShell searchParamsPromise={searchParams} />;
}
