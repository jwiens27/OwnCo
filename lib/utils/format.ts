export function formatCurrency(value: number, options?: { decimals?: number }): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 0,
  }).format(value);
}

export function formatPercent(decimal: number, fractionDigits = 2): string {
  return `${(decimal * 100).toFixed(fractionDigits)}%`;
}

export function formatMonthly(value: number): string {
  return `${formatCurrency(value)}/mo`;
}
