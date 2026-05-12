# verification-examples.md — Calculator Test Fixtures

**Purpose:** Concrete input/output pairs for verifying calculator correctness across the four guide scenarios plus key edge cases. Use these to: (a) sanity-check the deployed calculator manually, (b) seed automated regression tests, (c) confirm behavior after the acquisition-mode and tooltip work in `spec.md`.

**Scope:** Only the math + UI surfaces that exist today (Phase 1–3). Save/Share/PDF flows excluded.

---

## Conventions

- Currency: USD, rounded to the nearest cent unless otherwise noted.
- Percentages: stored as decimals (`0.07` = 7%) but displayed as percent.
- Mortgage formula: `M = P × [r(1+r)^n] / [(1+r)^n − 1]` where `r = APR/12`, `n = termYears × 12`.
- Appreciation: compounded annually for display, monthly for `monthlyEquityGain` (`price × pct / 12`).
- Equity at month *t*: `propertyValue(t) − loanBalance(t)`. Property value uses annual compounding for clean comparison with published tools.
- `(1.03)^5 = 1.15927`, `(1.03)^10 = 1.34392`, `(1.03)^30 = 2.42726`.
- All numbers below are **expected outputs**, not implementation guarantees — verify against the actual `lib/calculator/compute.ts` output, then update either this doc or the implementation if they diverge.

---

## Imputed rent semantics — corrected (per spec.md Phase 0)

The original `imputedRent.ts` implementation, documented in `BUILD_STATUS.md`, distributes the imputed rent pool **only to non-live-in owners**, producing economically wrong results (live-in's net cost > market rent). `spec.md` Phase 0 fixes this. **The expected outputs below assume the fix is in place.** Running them against the current `main` branch will produce different values for Fixtures 3 and Edge case A.

### Corrected math

- Each live-in owner pays `FMR / k` into the pool (`k` = number of live-ins).
- Each owner — live-in or not — receives `FMR × share`.
- A live-in's net imputed rent paid = `(FMR / k) − (FMR × share)`. For a single live-in, this equals `FMR × (1 − share)` — the portion of FMR owed to other owners.
- All-live-in case: each owner pays `FMR / n` and receives `FMR × (1/n) = FMR / n`, netting to zero.

### Conservation invariant

For any scenario: `sum_over_owners(net_monthly_cost) === total_monthly_carrying_cost`. Imputed rent and rental income are internal transfers that cancel in the sum. This is the single best assertion to wire into tests — if it fails, the math is wrong somewhere.

---

## Fixture 1 — Investor purchase (Guide 1)

### Inputs

```ts
{
  acquisitionMode: 'purchase',
  purchasePrice: 500_000,
  propertyTaxAnnual: 6_000,
  insuranceAnnual: 2_400,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.015,
  expectedAppreciationPct: 0.03,
  mortgageRate: 0.07,
  mortgageTermYears: 30,
  owners: [
    { name: 'Investor 1', downPayment: 50_000, currentMonthlyRent: 0 },
    { name: 'Investor 2', downPayment: 50_000, currentMonthlyRent: 0 },
    { name: 'Investor 3', downPayment: 50_000, currentMonthlyRent: 0 },
  ],
  occupancy: { type: 'rented_out' /* expectedRent: 3_400 */ },
}
```

### Intermediate values

| Quantity | Value |
|---|---|
| Loan principal | $350,000 |
| Monthly mortgage payment | **$2,328.56** |
| Monthly property tax | $500.00 |
| Monthly insurance | $200.00 |
| Monthly maintenance reserve | $625.00 |
| Total monthly carrying costs | **$3,653.56** |
| Monthly rental income | $3,400.00 |
| Monthly appreciation | $1,250.00 |
| Month-1 principal paydown | $286.89 |
| Monthly equity gain (paydown + appreciation) | **$1,536.89** |
| Ownership share per investor | 0.3333 |

### Per-investor expected outputs

| Field | Value | UI location |
|---|---|---|
| Share of carrying cost | $1,217.85 | `PerOwnerCard` → carrying breakdown |
| Share of rental income | $1,133.33 | `PerOwnerCard` |
| Net monthly cost | **$84.52** | `PerOwnerCard` headline |
| Monthly equity gain share | **$512.30** | `PerOwnerCard` middle column |
| Net monthly position | **+$427.78** | `PerOwnerCard` right column (green) |
| Equity at year 5 | **~$83,394** | `EquityChart` (each line) |
| Equity at year 10 | ~$123,862 | `EquityChart` |
| Equity at year 30 | **~$404,544** | `EquityChart` (mortgage paid off) |
| Net gain at year 5 | **~$28,323** | `PerOwnerCard` 5Y column |
| Net gain at year 10 | ~$63,720 | `PerOwnerCard` 10Y column |
| Net gain at year 30 | **~$324,117** | `PerOwnerCard` 30Y column |

### Comparison chart

- **Co-buy bar:** $84.52/mo (positive = cost)
- **Solo bar:** flagged infeasible — $50k down on a $500k property is 10%, above the 5% feasibility threshold, so this should render as feasible at the full $3,653.56/mo carrying cost minus their nothing rent = $3,653.56/mo. (Cross-check the actual feasibility cutoff in `compare.ts`.)
- **Alt. housing bar:** $0 (no `currentMonthlyRent` set; bar may not render per spec rule)

### Behavior to verify

- `ImputedRentCallout` is **not** shown (occupancy is `rented_out`).
- `ComparisonChart` should hide or de-emphasize "Alt. Housing" bars (all owners have `currentMonthlyRent = 0`).

---

## Fixture 2 — Inheritance, rent out (Guide 2)

### Inputs

```ts
{
  acquisitionMode: 'inheritance',
  purchasePrice: 600_000,        // FMV at inheritance
  propertyTaxAnnual: 7_200,
  insuranceAnnual: 1_800,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.015,
  expectedAppreciationPct: 0.03,
  mortgageRate: 0,                // paid off
  mortgageTermYears: 30,          // ignored when rate = 0 and loan = 0
  owners: [
    { name: 'Sibling 1', downPayment: 200_000, currentMonthlyRent: 0 },
    { name: 'Sibling 2', downPayment: 200_000, currentMonthlyRent: 0 },
    { name: 'Sibling 3', downPayment: 200_000, currentMonthlyRent: 0 },
  ],
  occupancy: { type: 'rented_out' /* expectedRent: 3_200 */ },
}
```

### Intermediate values

| Quantity | Value |
|---|---|
| Loan principal | $0 |
| Monthly mortgage payment | $0 |
| Total monthly carrying costs | **$1,500.00** ($600 tax + $150 ins + $750 maint) |
| Monthly rental income | $3,200.00 |
| Monthly appreciation | $1,500.00 |
| Monthly equity gain (no paydown) | **$1,500.00** |
| Ownership share per heir | 0.3333 |

### Per-heir expected outputs

| Field | Value |
|---|---|
| Share of carrying cost | $500.00 |
| Share of rental income | $1,066.67 |
| Net monthly cost | **−$566.67** (collects $566.67) |
| Monthly equity gain share | $500.00 |
| Net monthly position | **+$1,066.67** |
| Equity at year 5 | ~$231,855 |
| Equity at year 10 | ~$268,784 |
| Equity at year 30 | ~$485,452 |

### Mode-specific output behavior

Per `spec.md`:

- "Net Gain at Year N" relabels to **"Appreciation gain"** in inheritance mode.
- Computed as `equity − inherited basis` (downPayment field):
  - Y5: $231,855 − $200,000 = **$31,855**
  - Y10: $268,784 − $200,000 = **$68,784**
  - Y30: $485,452 − $200,000 = **$285,452**
- ComparisonChart "Solo" bar relabels to **"Buy out heirs"** and renders only if any owner has `currentMonthlyRent > 0`. With all rents = 0, the bar should hide.
- "Savings vs Alt. Housing" column hides (all `currentMonthlyRent` = 0).

---

## Fixture 3 — Inheritance, one sibling lives in (Guide 3)

### Inputs

```ts
{
  acquisitionMode: 'inheritance',
  purchasePrice: 600_000,
  propertyTaxAnnual: 7_200,
  insuranceAnnual: 1_800,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.01,
  expectedAppreciationPct: 0.03,
  mortgageRate: 0,
  mortgageTermYears: 30,
  owners: [
    { name: 'Live-in', downPayment: 200_000, currentMonthlyRent: 0 },
    { name: 'Sibling 2', downPayment: 200_000, currentMonthlyRent: 0 },
    { name: 'Sibling 3', downPayment: 200_000, currentMonthlyRent: 0 },
  ],
  occupancy: { type: 'owner_occupied', liveInOwnerIndices: [0], fairMarketRent: 3_200 },
}
```

### Intermediate values

| Quantity | Value |
|---|---|
| Total monthly carrying costs | **$1,250.00** ($600 + $150 + $500) |
| Monthly equity gain (appreciation only) | $1,500.00 |
| Ownership share per heir | 0.3333 |
| Live-ins count `k` | 1 |
| Imputed rent paid by live-in | **$3,200.00** (FMR / k) |
| Imputed rent received per owner | **$1,066.67** (FMR × share, applies to every owner including the live-in) |

### Per-heir expected outputs

| Field | Live-in (owner 1) | Sibling 2 / 3 |
|---|---|---|
| Share of carrying cost | $416.67 | $416.67 |
| Imputed rent paid | $3,200.00 | $0 |
| Imputed rent received | $1,066.67 | $1,066.67 |
| **Net monthly cost** | **$2,550.00** | **−$650.00** (collects) |
| Monthly equity gain share | $500.00 | $500.00 |
| Net monthly position | −$2,050.00 | +$1,150.00 |
| Equity at year 5 | ~$231,855 | ~$231,855 |
| Appreciation gain at Y5 | ~$31,855 | ~$31,855 |
| Appreciation gain at Y30 | ~$285,452 | ~$285,452 |

### Behavior to verify

- `ImputedRentCallout` renders and shows the bidirectional flow per the new spec copy:
  - Live-in pays $3,200 into the partnership.
  - Live-in receives $1,066.67 back as their 1/3 ownership share.
  - Sibling 2 and Sibling 3 each receive $1,066.67.
  - Live-in's effective rent: $3,200 − $1,066.67 = $2,133.33 (the portion owed to others).
- **Conservation:** $2,550 + 2 × (−$650) = $2,550 − $1,300 = $1,250 = total carrying. ✓
- **Live-in saves vs renting:** $3,200 (rent) − $2,550 (co-buy) = **$650/mo savings** from owning 1/3.

### Pre-Phase-0 expected outputs (legacy — for diagnosing the bug)

These were the outputs before the imputed rent fix shipped. Use them only to confirm a deployment is still running the broken code:

| Field | Live-in | Sibling 2 / 3 |
|---|---|---|
| Imputed received | $0 (bug) | $1,600 (bug) |
| Net monthly cost | $3,616.67 (bug) | −$1,183.33 (bug) |

If you see these numbers in the UI after the spec ships, Phase 0 didn't land properly.

---

## Fixture 4 — Inheritance, vacation home, all heirs live-in (Guide 4)

### Inputs

```ts
{
  acquisitionMode: 'inheritance',
  purchasePrice: 800_000,
  propertyTaxAnnual: 9_600,
  insuranceAnnual: 3_000,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.02,
  expectedAppreciationPct: 0.03,
  mortgageRate: 0,
  mortgageTermYears: 30,
  owners: [
    { name: 'Sibling 1', downPayment: 266_667, currentMonthlyRent: 0 },
    { name: 'Sibling 2', downPayment: 266_667, currentMonthlyRent: 0 },
    { name: 'Sibling 3', downPayment: 266_666, currentMonthlyRent: 0 },
  ],
  occupancy: { type: 'owner_occupied', liveInOwnerIndices: [0, 1, 2], fairMarketRent: 4_500 },
}
```

### Intermediate values

| Quantity | Value |
|---|---|
| Total monthly carrying costs | **$2,383.33** ($800 tax + $250 ins + $1,333.33 maint) |
| Monthly equity gain | $2,000.00 |
| Ownership share per heir | ~0.3333 |
| Live-ins count `k` | 3 |
| Imputed rent paid per live-in | $1,500.00 (= 4,500 / 3) |
| Imputed rent received per owner | $1,500.00 (= 4,500 × 0.3333) |
| Net imputed rent per owner | **$0.00** (paid = received) |

### Per-heir expected outputs

| Field | Each heir |
|---|---|
| Share of carrying cost | ~$794.44 |
| Imputed rent paid | $1,500.00 |
| Imputed rent received | $1,500.00 |
| Net imputed rent | **$0.00** |
| **Net monthly cost** | **~$794.44** (just carrying) |
| Monthly equity gain share | ~$666.67 |
| Net monthly position | −$127.78 |
| Equity at year 5 | ~$309,140 |
| Appreciation gain at Y5 | ~$42,473 |
| Appreciation gain at Y30 | ~$380,603 |

### Behavior to verify

- `ImputedRentCallout` renders the all-live-in wash case with explicit copy: "All heirs live in. Each pays $1,500/mo imputed rent and receives the same $1,500/mo back via ownership share. Net imputed rent: $0."
- Equivalent setup (`Occupancy → Rented out` with `expectedRent = 0`) produces the same per-heir numbers within rounding, with no `ImputedRentCallout` rendered.
- `ComparisonChart`: "Buy out heirs" hidden (no `currentMonthlyRent > 0`); "Alt. Housing" hidden (same reason).

---

## Edge case A — Mortgage with 1 of 4 live-in, unequal contributions

Stress-tests imputed rent under unequal ownership shares.

### Inputs

```ts
{
  acquisitionMode: 'purchase',
  purchasePrice: 800_000,
  propertyTaxAnnual: 9_600,
  insuranceAnnual: 2_400,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.01,
  expectedAppreciationPct: 0.03,
  mortgageRate: 0.065,
  mortgageTermYears: 30,
  owners: [
    { name: 'Alex (live-in)', downPayment: 40_000,  currentMonthlyRent: 2_500 },
    { name: 'Sam',            downPayment: 80_000,  currentMonthlyRent: 0 },
    { name: 'Jordan',         downPayment: 40_000,  currentMonthlyRent: 0 },
    { name: 'Casey',          downPayment: 40_000,  currentMonthlyRent: 0 },
  ],
  occupancy: { type: 'owner_occupied', liveInOwnerIndices: [0], fairMarketRent: 3_500 },
}
```

### Key intermediate values

| Quantity | Value |
|---|---|
| Loan principal | $600,000 |
| Monthly mortgage payment ($600k @ 6.5%/30yr) | **~$3,792.41** |
| Total carrying (mortgage + tax $800 + ins $200 + maint $666.67) | **~$5,459.08** |
| Ownership shares (Alex / Sam / Jordan / Casey) | 0.20 / 0.40 / 0.20 / 0.20 |
| Imputed rent paid by Alex (FMR / k, k=1) | $3,500.00 |
| Imputed rent received per owner (FMR × share) | Alex $700 / Sam $1,400 / Jordan $700 / Casey $700 |

### Per-owner net monthly cost (corrected math)

| Owner | Carrying share | Imputed paid | Imputed received | Net cost |
|---|---|---|---|---|
| Alex | $1,091.82 | $3,500 | $700 | **$3,891.82** |
| Sam | $2,183.63 | $0 | $1,400 | **$783.63** |
| Jordan | $1,091.82 | $0 | $700 | **$391.82** |
| Casey | $1,091.82 | $0 | $700 | **$391.82** |

**Conservation check:** $3,891.82 + $783.63 + $391.82 + $391.82 = **$5,459.09** ≈ total carrying $5,459.08. ✓

**Sanity check:** Alex's rent-only cost = $3,500 − $700 = $2,800 = `FMR × (1 − 0.20)`. ✓ Alex saves $700/mo on rent by owning 20%.

### Alt. housing comparison

Only Alex has `currentMonthlyRent = 2_500`. Per `spec.md`:

- "Savings vs Alt. Housing" column renders **only for Alex**, value `$2,500 − $3,891.82 = −$1,391.82` (i.e., the co-buy is still more expensive than Alex's current rent — they're paying more to live in a nicer property; surface as informational, not necessarily as a warning).
- The other 3 owners' Alt. Housing column hides.

---

## Edge case B — Equal contributions, equal shares (sanity)

Smallest possible fixture; verifies share computation.

### Inputs

```ts
{
  acquisitionMode: 'purchase',
  purchasePrice: 500_000,
  propertyTaxAnnual: 0,
  insuranceAnnual: 0,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0,
  expectedAppreciationPct: 0,
  mortgageRate: 0,
  mortgageTermYears: 30,
  owners: [
    { name: 'A', downPayment: 250_000, currentMonthlyRent: 0 },
    { name: 'B', downPayment: 250_000, currentMonthlyRent: 0 },
  ],
  occupancy: { type: 'rented_out' /* expectedRent: 0 */ },
}
```

### Expected

- Each owner's share = **0.5 exactly**.
- Each owner's net monthly cost = **$0** (no carrying, no rent).
- Each owner's monthly equity gain share = **$0** (no appreciation, no paydown).
- Equity at all years = **$250,000 / owner** (no change).
- Net gain at all years = **$0** (purchase mode: equity − cash invested = $250,000 − $250,000).

This is the calculator's "zero point."

---

## Edge case C — Unequal contributions, rental income

### Inputs

```ts
{
  acquisitionMode: 'purchase',
  purchasePrice: 600_000,
  propertyTaxAnnual: 6_000,
  insuranceAnnual: 3_000,
  hoaMonthly: 0,
  maintenanceReserveAnnualPct: 0.01,
  expectedAppreciationPct: 0.03,
  mortgageRate: 0,
  mortgageTermYears: 30,
  owners: [
    { name: 'Big',    downPayment: 300_000, currentMonthlyRent: 0 },  // 50%
    { name: 'Medium', downPayment: 200_000, currentMonthlyRent: 0 },  // 33.33%
    { name: 'Small',  downPayment: 100_000, currentMonthlyRent: 0 },  // 16.67%
  ],
  occupancy: { type: 'rented_out' /* expectedRent: 3_000 */ },
}
```

### Expected

| Quantity | Value |
|---|---|
| Loan principal | $0 |
| Total carrying | $1,250/mo ($500 tax + $250 ins + $500 maint) |
| Rental income | $3,000/mo |

| Owner | Share | Carrying share | Rent share | Net cost |
|---|---|---|---|---|
| Big | 0.5000 | $625.00 | $1,500.00 | **−$875.00** |
| Medium | 0.3333 | $416.67 | $1,000.00 | **−$583.33** |
| Small | 0.1667 | $208.33 | $500.00 | **−$291.67** |

Net collected sums to $1,750.00 = $3,000 − $1,250 ✓

---

## Edge case D — Zero down from one owner (boundary)

Confirms division-by-zero guards and that a zero-contribution owner gets a zero share.

### Inputs

```ts
{
  // ... same as Fixture 1, but owner 3 contributes $0
  owners: [
    { name: 'A', downPayment: 75_000, ... },
    { name: 'B', downPayment: 75_000, ... },
    { name: 'C', downPayment: 0,      ... },
  ],
}
```

### Expected

- Total downs: $150,000
- Shares: A = 0.50, B = 0.50, C = 0.00
- Owner C: 0 share of carrying, 0 share of rent, 0 equity, 0 everything. Their `PerOwnerCard` should render with all zeros, no `NaN`, no crash.
- Loan principal: $500,000 − $150,000 = $350,000.

---

## Edge case E — All-zero contributions (fallback to equal shares)

`BUILD_STATUS.md` documents this rule: "All-zero contributions → equal shares fallback."

### Inputs

```ts
{
  // 4 owners, each downPayment: 0
}
```

### Expected

- Each owner's share = **0.25 exactly** (fallback, not 0/0 → NaN).
- Loan principal = full purchase price.
- All per-owner cost/income calculations behave as for an equal 4-way split.

---

## Mode toggle behavior tests

### Test M1 — Switching modes preserves numeric values

1. Load DEFAULT_SCENARIO (purchase).
2. Modify: set `purchasePrice = 750_000`, owner 1 `downPayment = 100_000`.
3. Toggle to **Inheritance**.
4. **Expected:** `purchasePrice` is still 750,000 (label now reads "Current fair market value"). Owner 1's `downPayment` is still 100,000 (label now reads "Inherited equity stake"). No other field changes. `acquisitionMode` in the URL changes; numeric values do not.

### Test M2 — Toggle round-trip

1. Set mode to **Inheritance**.
2. Toggle to **Purchase**.
3. Toggle back to **Inheritance**.
4. **Expected:** scenario state at step 3 deep-equals state at step 1.

### Test M3 — Comparison chart adapts

1. Load Fixture 2 inputs (inheritance, rented out, no `currentMonthlyRent`).
2. **Expected:**
   - ComparisonChart shows only the "Co-Buy" bar per owner.
   - "Solo" / "Buy out heirs" bar is hidden.
   - "Alt. Housing" bar is hidden.
3. Set one owner's `currentMonthlyRent = 2_000`.
4. **Expected:** that owner's "Alt. Housing" bar appears at $2,000. Other owners still hide it. "Buy out heirs" bar appears for that owner only (or globally — confirm spec choice).

### Test M4 — "Net gain" relabels to "Appreciation gain"

1. Load Fixture 2.
2. **Expected:** PerOwnerCard 5Y/10Y/30Y column header reads "Appreciation gain at Y5" etc. (or equivalent). Numeric values match Fixture 2 table.
3. Toggle to **Purchase** without changing numbers.
4. **Expected:** column header reads "Net gain at Y5". Numeric values **may differ** because cash invested is computed differently (purchase mode subtracts cumulative cash flows; inheritance mode subtracts inherited basis only).

---

## Tooltip behavior tests

| Test | Action | Expected |
|---|---|---|
| T1 | Hover the info icon next to `Purchase price` (pointer device) | Popover appears after ~200ms; copy matches `TOOLTIP_COPY.purchase.purchasePrice` |
| T2 | Tap the info icon (touch device) | Popover toggles open; second tap or outside tap closes it |
| T3 | Focus icon with Tab; press Enter | Popover opens; Esc closes it; focus returns to icon |
| T4 | Toggle mode to Inheritance, hover same icon | Popover copy changes to inheritance variant ("Fair market value at the date of inheritance...") |
| T5 | Open one tooltip; open a second | First closes when second opens (single-popover rule) |
| T6 | Every labeled input | Has exactly one info icon, 4px left of label, vertically centered |

---

## URL encoding tests

### Test U1 — Round-trip preserves all fields

```ts
const s = SCENARIO_PRESETS['inheritance-one-lives-in'];
const encoded = encodeScenario(s);
const decoded = decodeScenario(encoded);
expect(decoded).toEqual(s);
```

### Test U2 — Backward compatibility (no `acquisitionMode`)

Take an encoded string produced by the **pre-feature** version of `encodeScenario` (or simulate by stripping `acquisitionMode` before encoding). Decode it:

```ts
const legacyEncoded = /* a real share URL captured from production */;
const decoded = decodeScenario(legacyEncoded);
expect(decoded.acquisitionMode).toBe('purchase');
// all other fields decode normally
```

### Test U3 — Encoded output remains URL-safe

```ts
const encoded = encodeScenario(SCENARIO_PRESETS['inheritance-vacation']);
expect(encoded).not.toMatch(/[+/=]/);  // base64url, not base64
```

### Test U4 — Garbage input

```ts
expect(decodeScenario('not-a-real-scenario')).toBeNull();
expect(decodeScenario('')).toBeNull();
expect(decodeScenario('AAAA')).toBeNull();  // valid base64, invalid payload
```

---

## Guide selection tests

| Test | Action | Expected |
|---|---|---|
| G1 | Click `Guides` button on calculator page (defaults loaded) | `ScenarioGuideDialog` opens; lists 4 cards |
| G2 | Select "Inheritance — one sibling lives in" | Dialog closes; scenario replaced with `SCENARIO_PRESETS['inheritance-one-lives-in']`; `ScenarioGuidePanel` opens with MDX content for that guide; URL updates to encoded preset |
| G3 | Modify a value, then click `Guides` and select a different one | Confirmation prompt appears ("Replace current scenario?"); on confirm, new preset loads |
| G4 | Click `Guides`, select guide, then click `Reset to defaults` in panel | Scenario returns to `DEFAULT_SCENARIO`; panel closes (or remains open per design choice) |
| G5 | Mobile (`<768px`): click `Guides` | Full-screen `Sheet` opens; cards stacked vertically; after select, panel slides up from bottom |
| G6 | Desktop: panel placement | Right-side drawer 380px wide; calculator remains visible and interactive to the left |

---

## How to use this document

1. **Manual QA pass:** load the deployed calculator, key in Fixture 1 inputs, verify each value in the "Per-investor expected outputs" table matches the UI. Repeat for Fixtures 2–4 and edge cases.
2. **Unit test extension:** turn each fixture into a Vitest case in `tests/unit/compute.test.ts` (a new file) that calls `compute(scenario)` and asserts the headline outputs.
3. **Regression baseline:** after the spec is implemented, archive the actual outputs as snapshot fixtures so future changes are caught.

If any fixture's expected values diverge from the implementation, **investigate before "fixing" either** — the discrepancy may surface a real bug in either the math, this document, or the spec assumptions (especially around imputed rent).
