# Calculator Math Guide

Reference for understanding, verifying, and modifying the OwnCo calculator engine. Written for someone comfortable reading TypeScript who wants to know exactly what each number means and how it is produced.

---

## Quick answer: mortgage term and monthly cost

Before diving into the full guide, this addresses an observation from initial testing:

**Switching from a 30-year to a 15-year term correctly increases monthly cost.** The math is right. On the default scenario ($590,000 loan at 7%):

| Term | Monthly payment |
|---|---|
| 30 years | $3,925 |
| 15 years | $5,303 |

You're paying the same principal in half the time, so each payment is larger. The trade-off is total interest paid: the 30-year loan costs roughly $822,000 in total interest; the 15-year costs roughly $364,000. The scale on the comparison chart changes because the underlying numbers genuinely change — the chart is not mislabeled. The equity chart will also slope upward more steeply with a 15-year term because principal is paid down faster each month.

---

## Architecture overview

The engine is a chain of pure functions. No React. No database. No network. Given a `Scenario` object as input, it produces a `Results` object as output. The UI just reads that output and renders it.

```
Scenario
  │
  ├── validateScenario()        → string[]        (errors if inputs are bad)
  ├── loanPrincipal()           → number          (price minus total down)
  ├── monthlyPayment()          → number          (standard amortization formula)
  ├── totalMonthlyCarryingCost() → { mortgage, tax, insurance, hoa, maintenance, total }
  ├── computeOwnershipShares()  → number[]        (each owner's % of total down payment)
  ├── computeImputedRent()      → ImputedRentBreakdown | null
  ├── computeOwnerResults()     → OwnerResult[]   (per-owner monthly costs and equity)
  ├── computeComparisons()      → Comparison[]    (co-buy vs. solo vs. rent)
  └── projectEquity()           → equity per owner at a given month
```

**Source files:**

| File | What it does |
|---|---|
| `lib/calculator/types.ts` | All TypeScript types — `Scenario`, `Results`, `OwnerResult`, etc. |
| `lib/calculator/defaults.ts` | The scenario the calculator loads on a cold visit |
| `lib/calculator/mortgage.ts` | Monthly payment formula, amortization schedule |
| `lib/calculator/perOwner.ts` | Carrying costs, ownership shares, per-owner breakdown |
| `lib/calculator/imputedRent.ts` | Live-in owner compensation logic |
| `lib/calculator/equity.ts` | Equity projection over time |
| `lib/calculator/compare.ts` | Buy-solo vs. keep-renting vs. co-buy comparison |
| `lib/calculator/compute.ts` | Top-level orchestrator; validation |
| `lib/calculator/scenario.ts` | URL encode/decode for the `?s=` query param |

---

## Input fields

These are the values the user enters. They map directly to fields in the `Scenario` type in `lib/calculator/types.ts`. The UI components that render them are in `components/calculator/`.

### Property section (`PropertyInputs.tsx`)

**Purchase price** (`purchasePrice: number`)
The full purchase price of the property in dollars. This is the baseline for calculating the loan, maintenance reserve, and equity projections.
- Validation: must be > 0
- Used by: loan principal, maintenance reserve, equity projection, solo-buy feasibility

**Annual property tax** (`propertyTaxAnnual: number`)
Total property tax for the year in dollars. The calculator divides by 12 to get the monthly figure. Does not vary by ownership — the full tax applies regardless of how many owners there are.
- Divided by 12 in: `totalMonthlyCarryingCost()` → `tax`

**Annual insurance** (`insuranceAnnual: number`)
Home/hazard insurance for the year in dollars. Same treatment as property tax — divided by 12, split proportionally by ownership share.
- Divided by 12 in: `totalMonthlyCarryingCost()` → `insurance`

**HOA (monthly)** (`hoaMonthly: number`)
Monthly homeowners association fee. Already monthly, so no conversion. Enter $0 if there is no HOA.
- Used directly in: `totalMonthlyCarryingCost()` → `hoa`

**Maintenance reserve** (`maintenanceReserveAnnualPct: number`)
Annual maintenance budget as a percentage of the purchase price, stored as a decimal (1% = `0.01`). The UI should show it as a percentage and convert before storing. Formula: `purchasePrice × rate / 12`.
- Default: 1% (`0.01`), which on a $750k property is $625/month
- File: `totalMonthlyCarryingCost()` → `maintenance`

---

### Mortgage section (`MortgageInputs.tsx`)

**Mortgage rate** (`mortgageRate: number`)
Annual percentage rate (APR) stored as a decimal — 7% is stored as `0.07`. The formula divides this by 12 to get the monthly rate.
- Validation: must be ≥ 0 and < 1
- Used in: `monthlyPayment()`, `amortizationSchedule()`, `balanceAtMonth()`

**Mortgage term** (`mortgageTermYears: number`)
Loan term in years (typically 15, 20, or 30). The formula multiplies by 12 to get total payment count.
- Validation: must be between 5 and 50
- Changing this changes the monthly payment significantly (see top of this guide)

**Note on down payment:** There is no single "down payment" field in the mortgage section. The loan amount is derived from the sum of all owners' individual down payments:

```typescript
// lib/calculator/perOwner.ts
loanPrincipal = Math.max(0, purchasePrice - sum(owner.downPayment))
```

---

### Owners section (`OwnerInputs.tsx`)

Each owner has three fields. The calculator supports 2–6 owners.

**Name** (`owner.name: string`)
Display only — appears on cards, chart labels, and the imputed rent callout. Does not affect any calculation.

**Down payment** (`owner.downPayment: number`)
Each owner's contribution toward the purchase price in dollars. This is the single most important field per owner:
1. It determines the loan principal (`purchasePrice - totalDownPayment`)
2. It determines each owner's **ownership share** (`owner.downPayment / totalDownPayment`)
3. Ownership share then determines each owner's proportion of every monthly cost

If all owners enter $0 as their down payment, the calculator falls back to equal shares (1/n each).

- Validation: must be ≥ 0; sum of all down payments must not exceed purchase price
- 5% of purchase price minimum required to be eligible for solo-buy comparison

**Current monthly rent** (`owner.currentMonthlyRent: number`)
What this owner currently pays in rent, in dollars per month. This is used only for the "savings vs. renting" calculation and the Comparison Chart — it has no effect on the co-buy cost math.
- Used in: `monthlySavingsVsRenting = currentMonthlyRent - netMonthlyCost`

---

### Occupancy section (`OccupancyInputs.tsx`)

**Occupancy type** (`occupancy.type`)
Three options that fundamentally change how costs and imputed rent are calculated:

| Type | Meaning | Imputed rent |
|---|---|---|
| `owner_occupied` | One or more owners live in the property | Yes — live-in owners pay non-live-in owners |
| `rented_out` | All space rented to outside tenants | None — external rent income instead |
| `mixed` | Some owners live in, some space rented externally | Both |

**Live-in owner checkboxes** (`occupancy.liveInOwnerIndices: number[]`)
Available when type is `owner_occupied` or `mixed`. Each checked owner is marked as living in the property, which triggers the imputed rent calculation. Indices are positions in the owners array (Owner 1 = index 0, etc.).

**Fair market rent** (`occupancy.fairMarketRent: number`)
Available when type is `owner_occupied` or `mixed`. What a comparable unit would rent for on the open market per month. This is the basis for the imputed rent calculation. The live-in owner is charged this amount as if they were renting from the partnership.

**Expected monthly rent** (`occupancy.expectedMonthlyRent: number`)
Available when type is `rented_out`. Income from outside tenants per month. Reduces each owner's net monthly cost proportionally to their ownership share.

**External monthly rent** (`occupancy.externalMonthlyRent: number`)
Available when type is `mixed`. Income from the rented portion (e.g., a basement apartment). Works the same as expected monthly rent.

---

### Appreciation (advanced)

**Expected appreciation** (`expectedAppreciationPct: number`)
Annual property value growth as a decimal (3% = `0.03`). Used only for equity projections. Does not affect monthly costs.
- Validation: must be between -20% and 50%
- Default: 3%

---

## The math, step by step

### Step 1 — Loan principal

```typescript
// lib/calculator/perOwner.ts
loanPrincipal = Math.max(0, purchasePrice - sum(all owner.downPayment))
```

Example (default scenario): $750,000 − (4 × $40,000) = **$590,000**

---

### Step 2 — Monthly mortgage payment

Standard amortization formula (`lib/calculator/mortgage.ts`):

```
monthly payment = L × c × (1+c)^n / [(1+c)^n − 1]

where:
  L = loan principal
  c = mortgageRate / 12    (monthly rate)
  n = mortgageTermYears × 12  (total months)
```

Special cases:
- If `principal ≤ 0`: payment is $0
- If `annualRate = 0`: payment is `principal / n` (divide evenly, no interest)

Example: $590,000 at 7% for 30 years  
`c = 0.07/12 = 0.005833`, `n = 360`  
Payment = **$3,925/month**

Same loan for 15 years: payment = **$5,303/month**

This is correct — you borrow the same amount but pay it off in half the time, so each payment is larger. Total interest on the 30-year is ≈$822,000; on the 15-year ≈$364,000.

---

### Step 3 — Monthly carrying costs

All fixed costs for the property, broken out by component (`lib/calculator/perOwner.ts`):

```typescript
mortgage    = monthlyPayment(loanPrincipal, mortgageRate, mortgageTermYears)
tax         = propertyTaxAnnual / 12
insurance   = insuranceAnnual / 12
hoa         = hoaMonthly                                        // already monthly
maintenance = purchasePrice × maintenanceReserveAnnualPct / 12

total       = mortgage + tax + insurance + hoa + maintenance
```

Example (default):
| Component | Monthly |
|---|---|
| Mortgage | $3,925 |
| Tax ($9,000/yr) | $750 |
| Insurance ($1,800/yr) | $150 |
| HOA | $0 |
| Maintenance (1% × $750k) | $625 |
| **Total** | **$5,450** |

---

### Step 4 — Ownership shares

Each owner's share of costs is proportional to their down payment relative to the total (`lib/calculator/perOwner.ts`):

```typescript
ownershipShare[i] = owner[i].downPayment / sum(all downPayments)
```

If all down payments are zero: `ownershipShare[i] = 1 / numberOfOwners`

Example (default — 4 owners, $40k each):
Each share = $40,000 / $160,000 = **25%**

Unequal example — Owner A: $100k, Owner B: $50k, Owner C: $50k:
- A = 100/200 = 50%
- B = 50/200 = 25%
- C = 50/200 = 25%

---

### Step 5 — Per-owner gross monthly cost

Each carrying cost component is multiplied by the owner's ownership share:

```typescript
grossMonthlyCost[i] =
  (mortgage × share[i]) +
  (tax × share[i]) +
  (insurance × share[i]) +
  (hoa × share[i]) +
  (maintenance × share[i])
```

This is equivalent to `total carrying cost × ownership share`.

Example (default — each owner at 25%):  
$5,450 × 0.25 = **$1,362.50 gross/month per owner**

---

### Step 6 — Imputed rent (the differentiating feature)

This is the most novel part of the calculator and the feature that makes the math interesting for mixed-occupancy scenarios. Full implementation: `lib/calculator/imputedRent.ts`.

**The concept:** When some owners live in the property and others do not, the live-in owners are consuming housing that the non-live-in owners are effectively providing free of charge. Imputed rent is the mechanism that compensates non-live-in owners for this.

**Rules:**

1. **Rented out** → imputed rent is null. There are no live-in owners. External rent income goes into `monthlyRentalIncomeShare` instead.

2. **Owner-occupied or mixed with only some owners living in:**

   - Each live-in owner pays an equal share of the fair market rent:
     ```
     amountPaid = fairMarketRent / numberOfLiveInOwners
     ```
   - That money is distributed to non-live-in owners proportional to their ownership shares **relative to each other** (not relative to all owners):
     ```
     nonLiveInOwnerPool = sum(ownershipShare for non-live-in owners)
     amountReceived[i] = (ownershipShare[i] / nonLiveInOwnerPool) × fairMarketRent
     ```

3. **All owners live in:**
   - Each owner pays `fairMarketRent / numberOfOwners`
   - `perNonLiveInOwnerReceived` is empty (no non-live-in owners)
   - The paid amount still appears in `netMonthlyCost` — this represents the "housing consumption value" each owner is receiving

**Example — 1 of 4 owners lives in (equal shares):**
- FMR: $4,000/month
- Live-in owner (Owner A, 25% share): pays **$4,000**
- Non-live-in owners (B, C, D — combined 75% share):
  - Each has 25/75 = 33.3% of the non-live-in pool
  - Each receives: (0.25/0.75) × $4,000 = **$1,333/month**

**Example — unequal ownership (A=50%, B=30%, C=20%), A lives in:**
- FMR: $3,000
- A pays: $3,000
- Non-live-in pool = B (30%) + C (20%) = 50%
- B receives: (0.30/0.50) × $3,000 = **$1,800**
- C receives: (0.20/0.50) × $3,000 = **$1,200**

---

### Step 7 — Net monthly cost

The full calculation per owner (`lib/calculator/perOwner.ts`):

```typescript
netMonthlyCost =
  grossMonthlyCost
  - monthlyRentalIncomeShare       // income from outside tenants (positive = reduces cost)
  - monthlyImputedRentReceived     // imputed rent coming IN from live-in owners
  + monthlyImputedRentPaid         // imputed rent going OUT to non-live-in owners
```

The net monthly cost is what each owner actually pays out of pocket each month, after all income flows.

**Example — default scenario (all 4 live in, equal shares, FMR $3,500):**
- Gross: $1,362.50
- Rental income share: $0 (no outside tenants)
- Imputed rent received: $0 (no non-live-in owners to receive from)
- Imputed rent paid: $3,500 / 4 = **$875** (each live-in owner pays their FMR share)
- Net = $1,362.50 − $0 − $0 + $875 = **$2,237.50/month**

**Example — 1 of 4 owners lives in (A), equal shares, FMR $4,000:**

*Owner A (lives in):*
- Gross: $1,362.50
- Imputed rent paid: $4,000 (full FMR — only live-in owner)
- Imputed rent received: $0
- Net = $1,362.50 + $4,000 = **$5,362.50**

*Owner B, C, D (don't live in):*
- Gross: $1,362.50
- Imputed rent received: $4,000/3 = **$1,333.33**
- Imputed rent paid: $0
- Net = $1,362.50 − $1,333.33 = **$29.17**

This is the core business insight the calculator surfaces: when one person lives in and three people invest, the investor cost is dramatically low because the live-in owner compensates them.

---

### Step 8 — Savings vs. renting

Simple subtraction:

```typescript
monthlySavingsVsRenting = owner.currentMonthlyRent - netMonthlyCost
```

Positive means co-buying is cheaper than what they currently pay in rent. Negative means it costs more.

**Headline savings number** (top of results panel):  
Sum of `Math.max(0, monthlySavingsVsRenting)` across all owners. Owners who pay more in the co-buy than their current rent are not subtracted from the headline — they are ignored. This is intentional: the headline shows the total benefit, not the net benefit.

---

### Step 9 — Equity projection

`lib/calculator/equity.ts`:

```typescript
futureValue    = purchasePrice × (1 + expectedAppreciationPct)^yearsElapsed
remainingLoan  = balance at that month from the amortization schedule
totalEquity    = futureValue − remainingLoan
perOwnerEquity = totalEquity × ownershipShare
```

The equity shown on the per-owner cards (Yr 5 / Yr 10 / Yr 30) and the equity line chart both use this formula. Note that equity at Year 0 is not zero — it equals the total down payment (current value minus loan equals the cash already put in).

**Example — default scenario, Year 5:**
- Future value: $750,000 × (1.03)^5 = $869,450
- Remaining loan at month 60: ≈$555,400
- Total equity: ≈$314,050
- Per owner (25%): ≈**$78,500**

**Year 30:**
- Future value: $750,000 × (1.03)^30 = $1,820,490
- Remaining loan: ≈$0 (paid off)
- Per owner: ≈**$455,000**

---

### Step 10 — Solo buy comparison

`lib/calculator/compare.ts`:

For each owner, the calculator asks: "Could this owner buy the same property alone?"

**Feasibility check:** The owner must have a down payment ≥ 5% of the purchase price.
```typescript
downPctSolo = owner.downPayment / scenario.purchasePrice
if (downPctSolo < 0.05) → infeasible
```

**If feasible:**
```typescript
soloLoan    = purchasePrice − owner.downPayment
soloMonthly = monthlyPayment(soloLoan, mortgageRate, mortgageTermYears) 
            + tax/12 + insurance/12 + hoaMonthly + maintenance/12
```

Note: the solo buyer pays the full carrying costs alone — no splitting. This number typically dwarfs the co-buy cost, which is the point.

---

## Output fields

### Headline — "Combined monthly savings vs. renting"

Displayed at the top of the results panel. Formula:

```typescript
sum(Math.max(0, owner.monthlySavingsVsRenting) for each owner)
```

Owners who pay more than their current rent are floored at $0 contribution to this number.

---

### Per-owner card (`PerOwnerCard.tsx`)

| Label | Field | Formula |
|---|---|---|
| Ownership % | `ownershipShare` | `downPayment / totalDownPayment` |
| Net monthly cost | `netMonthlyCost` | gross − rental income − imputed received + imputed paid |
| vs. renting | `monthlySavingsVsRenting` | `currentMonthlyRent − netMonthlyCost` |
| Yr 5 / Yr 10 / Yr 30 | `equityAtYear5/10/30` | `(appreciatedValue − remainingLoan) × share` |

---

### Imputed rent callout (`ImputedRentCallout.tsx`)

Shown only when occupancy is `owner_occupied` or `mixed`. Displays:
- The fair market rent input value
- Each live-in owner and how much they pay
- Each non-live-in owner and how much they receive

If all owners live in, the "non-live-in owners receive" section is empty (no receivers).

---

### Comparison chart (`ComparisonChart.tsx`)

Three bars per owner:
| Bar | Value | Source |
|---|---|---|
| Co-Buy | `netMonthlyCost` | from `OwnerResult` |
| Keep Renting | `currentMonthlyRent` | raw input, no calculation |
| Buy Solo | `soloMonthlyCost` | or "N/A" if down payment < 5% |

**Why the scale shifts when you change mortgage term:** All three bars are on the same Y axis. If the co-buy monthly cost rises (e.g., shorter term), the axis auto-scales to fit. This is correct — the chart isn't broken, the cost genuinely went up.

---

### Equity chart (`EquityChart.tsx`)

Line chart, one line per owner, from Year 0 to Year 30 in 1-year steps. Y axis is per-owner equity in dollars. All owners have the same line shape; the lines differ only in vertical scale if ownership shares differ.

---

## How to edit the math

### Change how ownership shares are computed

**File:** `lib/calculator/perOwner.ts`, function `computeOwnershipShares()`

Current behavior: shares are proportional to down payment amounts. To change to equal shares regardless of contribution:

```typescript
// Current
return scenario.owners.map((o) => o.downPayment / total);

// Equal-shares alternative
return scenario.owners.map(() => 1 / scenario.owners.length);
```

**Test to verify:** Set Owner A to $100k down, Owner B to $50k down. With the current formula, A gets 66.7% and B gets 33.3%. If you switch to equal shares, both should show 50%.

---

### Change the maintenance reserve formula

**File:** `lib/calculator/perOwner.ts`, function `totalMonthlyCarryingCost()`

```typescript
// Current: % of purchase price annually
maintenance = (scenario.purchasePrice * scenario.maintenanceReserveAnnualPct) / 12;

// Alternative: flat dollar per month stored directly in the Scenario
// (would require adding a maintenanceMonthly field to types.ts)
maintenance = scenario.maintenanceMonthly;
```

---

### Change how imputed rent is distributed

**File:** `lib/calculator/imputedRent.ts`

Current: live-in owners pay equal shares of FMR; non-live-in owners receive in proportion to their relative ownership.

To make live-in owners pay proportional to their ownership share instead of equally:

```typescript
// Current
amount: fairMarketRent / liveInIndices.length,

// Proportional-to-ownership alternative
// (need to compute live-in share pool first)
const liveInSharePool = liveInIndices.reduce((s, i) => s + shares[i], 0);
amount: (shares[idx] / liveInSharePool) * fairMarketRent,
```

---

### Change the solo-buy feasibility threshold

**File:** `lib/calculator/compare.ts`

```typescript
// Current: 5% minimum
const minDownPctForSolo = 0.05;

// To require 20% (conventional loan threshold):
const minDownPctForSolo = 0.20;
```

---

### Change default scenario values

**File:** `lib/calculator/defaults.ts`

Edit `DEFAULT_SCENARIO` directly. This is what new visitors see. The URL `?s=` param overrides defaults once the user has changed anything.

---

### Change validation rules

**File:** `lib/calculator/compute.ts`, function `validateScenario()`

Add or remove rules in the `errors.push(...)` block. Each rule is a plain if-statement. Return an error string and the results panel shows it instead of numbers.

---

### Add a new field to the Scenario

1. Add the field to the `Scenario` type in `lib/calculator/types.ts`
2. Add a default value in `lib/calculator/defaults.ts`
3. Use it in the relevant calculation function (`mortgage.ts`, `perOwner.ts`, etc.)
4. Add a validation rule in `compute.ts` if needed
5. Add a UI input in the appropriate component (`PropertyInputs.tsx`, etc.) reading from and writing to `useCalculatorStore`
6. Add a test case to the relevant test file in `tests/unit/`

---

## Manual test scenarios

Use these to verify the calculator is working correctly after any changes. All numbers are computed from the formulas in this document and verified against the unit tests.

Run the app with `pnpm dev` and navigate to `http://localhost:3000/calculator`. The calculator loads the default scenario. Use these exact input values.

---

### Test 1 — Default scenario verification (baseline)

**Setup:** Load the calculator fresh (no `?s=` param). Do not change any inputs.

**Default inputs:**
- Purchase price: $750,000
- Tax: $9,000/yr, Insurance: $1,800/yr, HOA: $0, Maintenance: 1%
- Rate: 7%, Term: 30 years
- 4 owners, each $40,000 down, each $2,500/month current rent
- Occupancy: owner-occupied, all 4 live in, FMR: $3,500
- Appreciation: 3%

**Expected results:**

| Output | Expected value |
|---|---|
| Loan principal | $590,000 |
| Monthly mortgage | ~$3,925 |
| Monthly tax | $750 |
| Monthly insurance | $150 |
| Monthly maintenance | $625 |
| Total carrying cost | ~$5,450 |
| Each owner's ownership share | 25.00% |
| Each owner's gross monthly cost | ~$1,362 |
| Imputed rent paid per live-in owner | $875 (= $3,500 / 4) |
| Each owner's net monthly cost | ~$2,237 |
| Each owner's savings vs. renting | ~$263/mo |
| Headline combined savings | ~$1,050/mo |
| Per-owner equity, Year 5 | ~$78,500 |
| Per-owner equity, Year 10 | ~$125,400 |
| Per-owner equity, Year 30 | ~$455,000 |

**What to check:** The headline savings number, the net monthly cost on any owner card, and the equity values at Year 5.

---

### Test 2 — Mortgage term change (15 vs 30 years)

**Setup:** Start from the default scenario. Change Term from 30 to 15 years.

**Expected changes:**

| Output | 30 years | 15 years | Direction |
|---|---|---|---|
| Monthly mortgage payment | ~$3,925 | ~$5,303 | ↑ Higher |
| Total carrying cost | ~$5,450 | ~$6,828 | ↑ Higher |
| Each owner's gross monthly cost | ~$1,362 | ~$1,707 | ↑ Higher |
| Each owner's net monthly cost | ~$2,237 | ~$2,582 | ↑ Higher |
| Headline savings | ~$1,050 | ~−$330 | Goes negative |
| Per-owner equity, Year 5 | ~$78,500 | ~$174,000 | ↑ Much higher |
| Per-owner equity, Year 10 | ~$125,400 | ~$304,000 | ↑ Much higher |

**Key check:** Monthly costs go UP, equity goes UP faster. Both directions are correct. The headline savings may go negative — this means co-buying is more expensive per month than renting at the 15-year term, which is expected for most scenarios.

---

### Test 3 — Unequal ownership shares

**Setup:** Start from default. Change Owner 1's down payment to $100,000. Leave owners 2, 3, 4 at $40,000 each.

**Total down:** $100k + $40k + $40k + $40k = $220,000  
**Loan principal:** $750,000 − $220,000 = $530,000

**Expected ownership shares:**
| Owner | Down | Share |
|---|---|---|
| Owner 1 | $100,000 | 45.45% |
| Owner 2 | $40,000 | 18.18% |
| Owner 3 | $40,000 | 18.18% |
| Owner 4 | $40,000 | 18.18% |

**Monthly mortgage on $530,000 at 7%/30yr:** ≈$3,526

**Expected gross monthly cost:**
- Owner 1: $3,526 + $750 + $150 + $625 = $5,051 total × 45.45% ≈ **$2,296**
- Owners 2-4: $5,051 × 18.18% ≈ **$918** each

**Check:** Owner 1's gross cost should be roughly 2.5× that of each other owner.

---

### Test 4 — Imputed rent with one live-in owner

**Setup:** Change occupancy to "owner-occupied", uncheck owners 2, 3, and 4 (only Owner 1 lives in). FMR: $3,500. Keep equal $40,000 down payments.

**Imputed rent:**
- Owner 1 (lives in) pays: $3,500 (full FMR)
- Owners 2, 3, 4 (non-live-in, equal shares = 33.3% of non-live-in pool each) receive: $3,500 / 3 ≈ **$1,167/month each**

**Expected net monthly costs:**
| Owner | Gross | + Imputed paid | − Imputed received | Net |
|---|---|---|---|---|
| Owner 1 | ~$1,362 | +$3,500 | $0 | ~**$4,862** |
| Owner 2 | ~$1,362 | $0 | −$1,167 | ~**$195** |
| Owner 3 | ~$1,362 | $0 | −$1,167 | ~**$195** |
| Owner 4 | ~$1,362 | $0 | −$1,167 | ~**$195** |

**Key check:** Owners 2-4 should show costs close to $195/month — they're near breakeven because the live-in owner is subsidizing them. The ImputedRentCallout should show Owner 1 paying $3,500 and each of owners 2-4 receiving ~$1,167.

---

### Test 5 — Rented out scenario

**Setup:** Change occupancy to "rented out". Set expected monthly rent: $5,000.

**Expected changes:**
- Imputed rent callout disappears
- Each owner receives: $5,000 × 25% = $1,250/month rental income share
- Net monthly cost = gross − $1,250 ≈ $1,362 − $1,250 = **~$112/month per owner**

**Key check:** This is a pure investment scenario. The very low net cost reflects that outside rental income is covering most of the carrying cost.

---

### Test 6 — Solo buy feasibility

**Setup:** Use 2 owners. Owner A: $100,000 down. Owner B: $5,000 down.  
Purchase price: $750,000.

**Expected Comparison Chart:**
- Owner A: $5,000/750,000 = 0.67% → below 5% solo threshold → **"N/A"** for Buy Solo
  - Wait, $100,000/750,000 = 13.3% → Owner A IS feasible
  - Owner B: $5,000/750,000 = 0.67% → Owner B is NOT feasible

**Correction — to get one feasible and one not:**
- Owner A ($100k down): feasible. Solo loan = $650,000. Monthly = monthlyPayment($650k, 0.07, 30) + $750 + $150 + $625 ≈ $4,325 + $1,525 ≈ **$5,850/month**
- Owner B ($5k down): infeasible. Bar labeled "N/A" or bar absent.

**Key check:** Only Owner A should show a "Buy Solo" bar. Owner B should not. This confirms the 5% floor is working.

---

### Test 7 — Zero HOA baseline then non-zero

**Setup:** Default scenario (HOA = 0). Note monthly costs. Then set HOA = $500/month.

**Expected change:**
- Each owner's gross monthly cost increases by $500 × 25% = **$125/month**
- Net monthly cost increases by the same $125
- Headline savings decreases by $500 (4 owners × $125)

**Key check:** The HOA field should have a direct, linear, proportional impact. If adding $500 HOA doesn't increase each owner's net cost by exactly $125 (on equal shares), something is wrong.

---

### Test 8 — Appreciation sensitivity on equity

**Setup:** Default scenario. Compare equity at Year 30 for:
- Appreciation = 0% (`0.00`)
- Appreciation = 3% (`0.03`, default)
- Appreciation = 6% (`0.06`)

**Expected equity at Year 30:**
| Appreciation | Home value at Year 30 | Per-owner equity (25%) |
|---|---|---|
| 0% | $750,000 | ~$187,500 |
| 3% | ~$1,820,000 | ~$455,000 |
| 6% | ~$4,292,000 | ~$1,073,000 |

*Note: at 0%, all equity comes from principal paydown. Total interest paid ≈$822k, total principal paid = $590k. Value stays at $750k. Per-owner equity at Year 30 ≈ $750k/4 = $187,500.*

**Key check:** Appreciation has zero effect on monthly costs. Only the equity chart and Year 5/10/30 numbers on the owner cards should change.

---

## Common "is this a bug?" questions

**Q: Monthly cost went up when I switched from 30 to 15 years.**  
A: Correct. You're paying the same loan in half the time. See Test 2 above.

**Q: The Y-axis scale on the Comparison Chart changed when I changed an input.**  
A: Recharts auto-scales the Y axis to fit the data. If costs went up, the axis goes up. Not a bug.

**Q: When all 4 owners live in, each owner's net monthly cost includes imputed rent they're "paying" but nobody is "receiving."**  
A: This is intentional. When all owners live in, imputed rent represents the housing consumption value each owner is getting — the opportunity cost of living there rather than renting it out. The money is paid by each owner to the partnership notionally. There are no non-live-in owners to receive it, so it adds to cost without a corresponding credit. This is a design decision worth reconsidering if you want the all-live-in case to show pure carrying cost only.

**Q: The headline savings number didn't go negative even though some owners are paying more than their rent.**  
A: The headline uses `Math.max(0, savings)` per owner — owners who pay more than their rent don't subtract from the headline. The individual owner cards do show negative savings (displayed in red). This is a product decision: the headline shows aggregate benefit, not net benefit.

**Q: Equity at Year 0 is not zero.**  
A: Correct. At month 0, the remaining loan equals the loan principal, but the property value equals the purchase price. Total equity = purchase price − loan = total down payment. If 4 owners put in $40k each, they each start with $40k equity (their own down payment, by definition).
