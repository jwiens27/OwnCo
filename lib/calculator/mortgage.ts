import type { AmortizationRow } from "./types";

export function monthlyPayment(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0) return 0;
  if (termYears <= 0) return principal;
  const c = annualRate / 12;
  const n = termYears * 12;
  if (c === 0) return principal / n;
  return (principal * c * Math.pow(1 + c, n)) / (Math.pow(1 + c, n) - 1);
}

export function amortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
): AmortizationRow[] {
  const payment = monthlyPayment(principal, annualRate, termYears);
  const c = annualRate / 12;
  const n = termYears * 12;
  const rows: AmortizationRow[] = [];
  let balance = principal;
  for (let month = 1; month <= n; month++) {
    const interest = balance * c;
    const principalPart = payment - interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({ month, principal: principalPart, interest, balance });
  }
  return rows;
}

export function balanceAtMonth(
  principal: number,
  annualRate: number,
  termYears: number,
  month: number,
): number {
  if (month <= 0) return principal;
  const schedule = amortizationSchedule(principal, annualRate, termYears);
  if (month > schedule.length) return 0;
  return schedule[month - 1].balance;
}

export function principalPaidThroughMonth(
  principal: number,
  annualRate: number,
  termYears: number,
  month: number,
): number {
  return principal - balanceAtMonth(principal, annualRate, termYears, month);
}
