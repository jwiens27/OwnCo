# spec.md — Scenario Guides, Acquisition Modes, and Field Tooltips

**Status:** Proposed
**Targets:** OwnCo Co-Ownership Calculator (post Phase 3, pre Phase 4)
**Owner:** TBD

---

## Summary

Make the calculator coherent for non-purchase scenarios (inheritance, vacation homes) and reduce ambiguity at every input. Four items, the first a hard prerequisite:

0. **[PREREQUISITE] Imputed rent correction** — fix a math bug in `computeImputedRent` that makes live-in owners' net cost exceed market rent. Must ship before Guide 3 is published. See dedicated section below.
1. **Acquisition mode toggle** — `Purchase` | `Inheritance`. Relabels fields; no math changes beyond item 0.
2. **Field tooltips** — info-icon next to every input with hover/tap-expanding copy.
3. **Scenario guides** — 4 written walkthroughs, accessed from a `Guides` button on the calculator page, each loading a preset.

---

## Goals

- Calculator inputs read naturally for purchase and inheritance scenarios.
- Every input has unambiguous, mode-aware help text.
- A first-time visitor can land on a guide, click "Use this scenario," and see populated, sensible numbers in under 2 seconds.
- Existing shared scenario URLs continue to decode correctly.

## Non-goals

- Usage rotation modeling for vacation homes (documented as a known gap).
- Refinance mode (deferred).
- Buyout / partition flows between heirs (deferred).
- Tax modeling: depreciation, interest deduction, step-up basis (deferred).

---

## Phase 0 — Imputed rent correction (prerequisite)

**Severity:** Blocking. The current `computeImputedRent` produces economically incorrect results that would mislead users and undermine the calculator's central value proposition.

### The bug

For owner-occupied scenarios, the current implementation distributes the imputed rent pool **only to non-live-in owners**, prorated by their share of the non-live-in pool. As a result, the live-in owner pays the full FMR into the pool, receives nothing back, and additionally pays their share of carrying costs separately.

Concrete demonstration (Guide 3 inputs: 3 equal heirs, 1 lives in, FMR $3,200, total carrying $1,250/mo):

| Owner | Imputed paid | Imputed received | Carrying share | Net monthly cost |
|---|---|---|---|---|
| Live-in | $3,200.00 | $0.00 | $416.67 | **$3,616.67** |
| Non-live-in × 2 | $0.00 | $1,600.00 | $416.67 | −$1,183.33 each |

The live-in's net cost of **$3,616.67/mo exceeds market rent of $3,200/mo on the same property** — the calculator tells a 1/3 owner they're worse off than renting. This contradicts the calculator's headline framing ("ownership saves vs. renting") and is mathematically wrong: a 1/3 owner should owe rent only to the other 2/3 of ownership, not the full FMR plus their own share of carrying.

### The fix

Each owner participates in the imputed rent pool by their **absolute ownership share**, regardless of whether they live in the property:

```
For each live-in owner i:
  monthlyPaid(i) = FMR / k       // k = number of live-in owners
For non-live-in owners:
  monthlyPaid(i) = 0

For every owner i (live-in or not):
  monthlyReceived(i) = FMR × share(i)

monthlyNet(i) = monthlyReceived(i) − monthlyPaid(i)
```

Same Guide 3 inputs under the corrected rule:

| Owner | Imputed paid | Imputed received | Carrying share | Net monthly cost |
|---|---|---|---|---|
| Live-in | $3,200.00 | $1,066.67 | $416.67 | **$2,550.00** |
| Non-live-in × 2 | $0.00 | $1,066.67 | $416.67 | −$650.00 each |

The live-in now pays $2,550/mo to live in a $3,200/mo property — a $650/mo saving from their 1/3 ownership stake, which is what users expect.

**Conservation invariant** (verify in tests): `sum_of_owner_net_costs === total_carrying_cost` (imputed rent flows cancel in the sum). Old code happens to satisfy this too; the fix preserves it.

### Type change

```typescript
// lib/calculator/types.ts — replaces existing ImputedRentBreakdown
type ImputedRentBreakdown = {
  totalFmr: number;
  liveInCount: number;
  perOwner: Array<{
    ownerIndex: number;
    isLiveIn: boolean;
    monthlyPaid: number;      // FMR/k if live-in, 0 otherwise
    monthlyReceived: number;  // FMR × share for every owner
    monthlyNet: number;       // received − paid (negative = net payer)
  }>;
};
```

Old shape (separate `payers` / `receivers` lists) doesn't model the new flow well — every owner now has both paid and received values worth surfacing. Single per-owner array makes UI rendering and conservation testing straightforward.

### Verification against existing test cases

The existing `imputedRent.test.ts` cases (per `BUILD_STATUS.md`) need their expected values updated:

| Test case | Old expected | New expected |
|---|---|---|
| 1 of 4 lives in (equal shares, FMR=$4,000) | Live-in pays $4,000; 3 non-live-ins each receive $1,333.33 | Live-in pays $4,000 / receives $1,000 (net $3,000); each non-live-in receives $1,000 |
| 2 of 4 live in (equal shares, FMR=$4,000) | Each live-in pays $2,000; 2 non-live-ins each receive $2,000 | Each live-in pays $2,000 / receives $1,000 (net $1,000); each non-live-in receives $1,000 |
| All 4 live in (equal shares) | Each pays FMR/4; no receivers | Each pays FMR/4 / receives FMR/4 (net 0). User-visible behavior unchanged. |
| Unequal ownership | Non-live-in receivers get amounts proportional to (their share / non-live-in pool total) | All owners receive amounts proportional to their absolute share |

### Component update

`ImputedRentCallout.tsx` copy needs revision to show both flows for live-in owners. Old copy mentioned only one-way payment; new copy must show the credit-back. Reference copy:

> "Alex lives in the property. Fair market rent is $3,200/mo. Alex pays $3,200 into the partnership and receives $1,066.67 back (their 1/3 ownership share), for a net rent of $2,133.33 — split between Sam and Jordan ($1,066.67 each). Plus Alex's share of carrying costs ($416.67), Alex's total monthly housing cost is $2,550."

The callout should also be shown for **all-live-in** scenarios (Guide 4) with copy explaining the wash: "All heirs live in. Each pays $X/mo imputed rent and receives the same amount back via their ownership share. Net imputed rent: $0."

### Tests to add or update

In `tests/unit/imputedRent.test.ts`:

- **Update** the 4 existing test cases to the "New expected" values in the table above.
- **Add** a conservation test: for any randomized scenario, `Math.abs(sum(perOwner.monthlyNet)) < 1e-6`.
- **Add** an economic-sanity test: with `FMR > 0`, a single live-in's net rent-only cost (excluding carrying) equals `FMR × (1 − share)`.

In `tests/unit/perOwner.test.ts`:

- **Add** a Guide 3 fixture test: live-in net monthly cost ≈ **$2,550** (not $3,616.67).
- **Add** an all-live-in conservation test: each owner's net cost equals their share of carrying with no imputed-rent residual.

In `tests/unit/compute.test.ts` (new file):

- End-to-end test using `SCENARIO_PRESETS['inheritance-one-lives-in']`: assert all four headline figures (live-in net cost, non-live-in net cost, equity at Y5, appreciation gain at Y5) match the verification fixtures.

### Effort estimate

~2–4 hours: 1 type change, 1 function rewrite in `imputedRent.ts`, 1 downstream update in `perOwner.ts` to consume the new shape, 1 component copy update, 4 test files touched.

---

## Type changes

```typescript
// lib/calculator/types.ts
export type AcquisitionMode = 'purchase' | 'inheritance';

export type Scenario = {
  acquisitionMode: AcquisitionMode;  // NEW. Default: 'purchase'.
  // ... all existing fields unchanged
};
```

The math layer is **untouched by the mode/tooltips/guides work** (items 1–3). The only math change in this spec is the Phase 0 fix to `imputedRent.ts` and the resulting downstream update in `perOwner.ts` to consume the new `ImputedRentBreakdown` shape. `acquisitionMode` itself only drives labels, tooltip copy, default values, and which comparison rows render.

### URL encoding / backward compatibility

- `encodeScenario` includes the new field automatically.
- `decodeScenario` backfills `acquisitionMode = 'purchase'` when missing.
- New round-trip test asserts both directions for both modes.

---

## Field label mapping

Source of truth: `lib/calculator/modes.ts` exports `FIELD_LABELS: Record<AcquisitionMode, Record<FieldKey, string>>`.

| Field | Purchase | Inheritance |
|---|---|---|
| `purchasePrice` | Purchase price | Current fair market value |
| `Owner.downPayment` | Down payment | Inherited equity stake |
| `mortgageRate` | Mortgage rate (APR) | Existing mortgage rate (0 if paid off) |
| `mortgageTermYears` | Loan term | Remaining mortgage term |
| All other fields | (unchanged) | (unchanged) |

Input components read labels via `FIELD_LABELS[scenario.acquisitionMode][fieldKey]` instead of hardcoded strings.

---

## Output / comparison adjustments

| Output element | Purchase | Inheritance |
|---|---|---|
| ComparisonChart "Buy Solo" bar | Shown | Relabeled "Buy out heirs" (rendered only if at least one owner has `currentMonthlyRent > 0`; otherwise hidden) |
| `PerOwnerCard` "Net Gain at Year N" | Label: "Net gain" (equity − cash invested) | Label: "Appreciation gain" (equity − inherited basis) |
| "Savings vs Alt. Housing" column | Shown for all owners | Shown only for owners with `currentMonthlyRent > 0` |
| ImputedRentCallout | Unchanged | Unchanged |

Implementation: `PerOwnerCard` and `ComparisonChart` accept `mode: AcquisitionMode` prop. No `OwnerResult` type changes.

---

## File additions

```
components/calculator/
  AcquisitionModeToggle.tsx       # Segmented control at top of InputPanel
  FieldTooltip.tsx                # Info-icon + popover, reused everywhere
  ScenarioGuideTrigger.tsx        # "Guides" button placed in calculator header
  ScenarioGuideDialog.tsx         # Lists 4 guide cards; on select: load preset + open panel
  ScenarioGuidePanel.tsx          # Side drawer / bottom sheet rendering MDX

lib/calculator/
  modes.ts                        # AcquisitionMode, FIELD_LABELS, TOOLTIP_COPY
  presets.ts                      # SCENARIO_PRESETS keyed by guide id

content/guides/
  investor-purchase.mdx
  inheritance-rent-out.mdx
  inheritance-one-lives-in.mdx
  inheritance-vacation.mdx
```

---

## FieldTooltip component

### Behavior

| Surface | Trigger | Dismiss |
|---|---|---|
| Pointer (hover-capable) | Hover info icon, 200ms delay | Pointer leaves |
| Touch (no hover) | Tap icon | Tap outside, tap another icon, or Esc |
| Keyboard | Focus icon, Enter or Space | Esc, or focus leaves |

### Implementation

- Detect surface via `matchMedia('(hover: hover)')`.
- Pointer surfaces use Radix `HoverCard`.
- Touch surfaces use Radix `Popover`.
- Icon: Lucide `Info`, 14px, `text-muted-foreground`, 4px left margin from label text, vertically centered.
- Popover content: `max-w-[280px]`, `text-sm`, `leading-snug`, body color, 12px padding.
- Only one popover open at a time (close others on open).

### Placement

```tsx
<Label>
  {FIELD_LABELS[mode].purchasePrice}
  <FieldTooltip>{TOOLTIP_COPY[mode].purchasePrice}</FieldTooltip>
</Label>
```

---

## Tooltip copy

Authoritative copy in `lib/calculator/modes.ts`. Inheritance entries override only where wording diverges; all other fields fall back to the purchase string.

### Purchase mode (base)

| Field | Copy |
|---|---|
| `purchasePrice` | Agreed acquisition price before closing fees. Sizes the mortgage and drives appreciation projections. |
| `propertyTaxAnnual` | Annual property tax. Pulled from the listing or county assessor. May reset to a higher figure on transfer. |
| `insuranceAnnual` | Annual homeowner's insurance premium. Landlord policies cost more than owner-occupied. |
| `hoaMonthly` | Monthly HOA, condo, or co-op fee. Enter 0 if none. |
| `maintenanceReserveAnnualPct` | Annual maintenance reserve as a percent of property value. 1% is standard; older homes and rentals run 1.5–2%. |
| `expectedAppreciationPct` | Assumed annual price appreciation. US long-run average is around 3%. |
| `mortgageRate` | APR on the mortgage. The current 30-year average is roughly 6–7%; check live rates with a lender. |
| `mortgageTermYears` | Loan length. 30 years is standard; shorter terms raise monthly cost but cut total interest sharply. |
| `Owner.name` | Display name in results, charts, and any shared link. |
| `Owner.downPayment` | Cash this owner contributes. Determines their ownership share and monthly cost. |
| `occupancy.type` | Rented out = investment property. Owner-occupied = one or more co-owners live in it. Mixed = some space is lived in, the rest is rented. |
| `liveInOwnerIndices` | Which owners live in the property. Each pays imputed rent (FMR ÷ live-in count) into the partnership; the partnership distributes that rent back to all owners by ownership share. Net effect: live-in owners pay only the portion of rent owed to non-occupying co-owners. |
| `fairMarketRent` | What the property would rent for on the open market. Drives imputed rent flows and rental-income comparisons. |
| `remainingRentedAt` | Monthly rent collected from rooms or units leased to non-owners. |

### Inheritance overrides

| Field | Copy |
|---|---|
| `purchasePrice` | Fair market value at the date of inheritance — your stepped-up basis. Use the estate appraisal. |
| `Owner.downPayment` | This owner's inherited equity stake: (FMV − remaining mortgage) ÷ heirs for equal splits, or per the will / agreement. |
| `mortgageRate` | Rate on the existing mortgage. Set to 0 if the home is paid off. |
| `mortgageTermYears` | Years remaining on the existing mortgage. Use any positive number (e.g., 30) if the home is paid off — term has no effect on a $0 loan. |

---

## Guides UX

### Entry point

- Calculator header gets a `Guides` button, left of `Save / Share / PDF`.
- Mobile: same button in the sticky header bar.
- Cold-load (empty/default scenario): `ResultsPanel` shows a dismissible banner: `New to OwnCo? Browse guides →`.

### Selection flow

1. User clicks `Guides` → `ScenarioGuideDialog` opens.
   - Mobile: full-screen `Sheet`.
   - Desktop: centered `Dialog`, 640px wide.
2. Dialog lists 4 cards (icon, title, 1-line subtitle). Tap to select.
3. On select:
   - `setScenario(SCENARIO_PRESETS[guideId])` replaces the current scenario.
   - URL updates via existing debounced sync.
   - `ScenarioGuideDialog` closes.
   - `ScenarioGuidePanel` opens.
4. Panel placement:
   - Mobile: bottom `Sheet`, ~70vh, drag-to-dismiss.
   - Desktop: right-side drawer, 380px wide, calculator remains interactive to the left.
5. Panel includes a `Reset to defaults` link that clears the preset.

### Confirmation guard

If the current scenario has been modified from defaults, selecting a guide first shows a confirmation: `Replace current scenario? Your unsaved values will be lost.` Skipped when current scenario equals `DEFAULT_SCENARIO`.

---

## Presets

```typescript
// lib/calculator/presets.ts
export type GuideId =
  | 'investor-purchase'
  | 'inheritance-rent-out'
  | 'inheritance-one-lives-in'
  | 'inheritance-vacation';

export const SCENARIO_PRESETS: Record<GuideId, Scenario> = {
  'investor-purchase': {
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
  },
  'inheritance-rent-out': {
    acquisitionMode: 'inheritance',
    purchasePrice: 600_000,
    propertyTaxAnnual: 7_200,
    insuranceAnnual: 1_800,
    hoaMonthly: 0,
    maintenanceReserveAnnualPct: 0.015,
    expectedAppreciationPct: 0.03,
    mortgageRate: 0,                // paid off
    mortgageTermYears: 30,
    owners: [
      { name: 'Sibling 1', downPayment: 200_000, currentMonthlyRent: 0 },
      { name: 'Sibling 2', downPayment: 200_000, currentMonthlyRent: 0 },
      { name: 'Sibling 3', downPayment: 200_000, currentMonthlyRent: 0 },
    ],
    occupancy: { type: 'rented_out' /* expectedRent: 3_200 */ },
  },
  'inheritance-one-lives-in': {
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
      { name: 'Live-in sibling', downPayment: 200_000, currentMonthlyRent: 0 },
      { name: 'Sibling 2', downPayment: 200_000, currentMonthlyRent: 0 },
      { name: 'Sibling 3', downPayment: 200_000, currentMonthlyRent: 0 },
    ],
    occupancy: { type: 'owner_occupied', liveInOwnerIndices: [0], fairMarketRent: 3_200 },
  },
  'inheritance-vacation': {
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
    occupancy: {
      type: 'owner_occupied',
      liveInOwnerIndices: [0, 1, 2],   // all heirs, makes imputed rent flows net to zero
      fairMarketRent: 4_500,
    },
  },
};
```

---

## Guide content

Each guide is a short MDX file in `content/guides/`. All four follow the same 5-section structure: **When to use this · What to enter · What to look at · Known gaps · Next steps**.

### Guide 1 — Investor purchase (`investor-purchase.mdx`)

**When to use this.** Two or more investors are pooling cash to buy a property and rent it out for income and appreciation. Nobody lives in it.

**What to enter.**
- Set **Acquisition mode → Purchase**.
- **Current fair market value:** the agreed purchase price.
- **Property tax / insurance / HOA:** from the listing or comparable properties. Use a landlord insurance quote, not homeowner's.
- **Maintenance reserve:** 1.5–2% of value per year for rentals; older buildings on the higher end.
- **Mortgage rate / term:** from a lender pre-approval.
- **Owners:** add 2–6 investors, each with the cash they're contributing as down payment.
- **Occupancy → Rented out.** Enter the expected monthly market rent.

**What to look at.**
- **Net monthly cash flow per owner.** Negative means they contribute each month; positive means they collect. Most leveraged deals start negative and turn positive as rent grows.
- **Equity gain over time.** Per-owner appreciation plus principal paydown.
- **Net gain at Year 5/10/30.** Total return minus total cash invested.

**Known gaps.** No tax modeling — depreciation, interest deduction, and capital-gains treatment are not included; consult an accountant. Rent is assumed collected 12 months a year (no vacancy). Property management fees aren't a separate field — fold them into the maintenance reserve.

**Next steps.** [Buying a property with investors →](/blog/buying-investment-property-with-partners)

---

### Guide 2 — Siblings inherit a home and rent it out (`inheritance-rent-out.mdx`)

**When to use this.** Multiple heirs inherit a property and agree to hold it as a rental rather than sell.

**What to enter.**
- Set **Acquisition mode → Inheritance**.
- **Current fair market value:** the estate appraisal value at the date of inheritance.
- **Inherited equity stake per heir:** for equal heirs, `(FMV − remaining mortgage) ÷ number of heirs`. If splits are unequal, use the figures from the will or settlement.
- **Existing mortgage rate / remaining term:** from the most recent loan statement. If the home is paid off, set rate to 0 and leave term at 30.
- **Property tax:** use the post-transfer assessed figure (some states reassess on inheritance — check yours).
- **Insurance:** landlord policy.
- **Occupancy → Rented out.** Enter the expected market rent.

**What to look at.**
- **Per-heir net monthly cash flow.** Each heir's share of rent minus their share of carrying costs.
- **Equity per heir over time.** Appreciation grows the inherited basis.
- **Whether the property covers itself.** If net cash flow is negative, heirs are subsidizing the property out of pocket.

**Known gaps.** The "Net Gain at Year N" figure subtracts cash invested only; for inherited property, read it as **appreciation gain** rather than total return. Step-up basis tax treatment is not modeled. Buyout flows — one heir wanting out while others keep the property — aren't modeled.

**Next steps.** [What happens when siblings inherit a house →](/blog/sibling-inherited-house)

---

### Guide 3 — Siblings inherit a home; one lives in it (`inheritance-one-lives-in.mdx`)

**When to use this.** Heirs inherit a property and one of them lives in it. To keep things fair, the live-in heir pays rent to the others.

**What to enter.**
- Set **Acquisition mode → Inheritance**.
- **Current fair market value:** estate appraisal.
- **Inherited equity stake per heir:** as in Guide 2.
- **Existing mortgage:** rate and remaining term, or 0% if paid off.
- **Occupancy → Owner-occupied.** Check the live-in heir. Enter **fair market rent** — what the home would rent for on the open market.

**What to look at.**
- **Imputed Rent callout.** The headline: it shows exactly how much the live-in heir pays into the partnership and how much each non-live-in heir receives, prorated by ownership share.
- **Live-in heir's net monthly cost.** Their effective housing cost — usually still well below open-market rent because they're paying rent partly "to themselves" (their own ownership share).
- **Non-live-in heirs' net monthly cash flow.** Often positive: rent income exceeds their share of carrying costs.

**Known gaps.** Below-market or family-rate arrangements aren't a separate field — model them by entering a lower fair market rent. The calculator doesn't track how often non-live-in heirs visit. If visiting time should reduce the live-in heir's rent, handle that in a side agreement.

**Next steps.** [When one co-owner lives in the property →](/blog/co-owner-lives-in-property)

---

### Guide 4 — Siblings inherit a vacation home with usage rotation (`inheritance-vacation.mdx`)

**When to use this.** Heirs inherit a second home and share its use across the year. Nobody lives in it full-time; nobody pays rent.

**What to enter.**
- Set **Acquisition mode → Inheritance**.
- **Current fair market value:** estate appraisal.
- **Inherited equity stake per heir:** as in Guide 2.
- **Existing mortgage:** rate and remaining term, or 0% if paid off.
- **Maintenance reserve:** vacation properties run higher — 1.5–2% — because of seasonal exposure and underuse.
- **Occupancy → Owner-occupied.** Check **all** heirs as live-in. Enter the property's fair market rent.

The all-live-in setup makes imputed rent flows net to zero between heirs — the property is financially neutral to use beyond carrying costs. (Equivalent setup: `Occupancy → Rented out` with expected rent = $0.)

**What to look at.**
- **Per-heir share of carrying costs.** Taxes, insurance, maintenance, and any mortgage payment, split by ownership share. This is the recurring real cost of holding the home.
- **Equity per heir over time.** Appreciation alone, since principal paydown only matters if there's a mortgage.

**Known gaps.** **The calculator does not model usage rotation.** If heirs will use the home asymmetrically — one takes 12 weeks, another takes 4 — the financial fairness needs a separate written usage agreement. Side payments (one heir buying out another's unused weeks) aren't modeled.

**Next steps.** [Inheriting a vacation home together →](/blog/inherited-vacation-home)

---

## Implementation phases

Phase 0 is a hard blocker for Phase D (guides). Phases A–C can run in parallel with Phase 0 if dev resources allow, but no guides ship until Phase 0 is merged and the verification fixtures pass.

### Phase 0 — Imputed rent correction (BLOCKER for Phase D)

- Replace `ImputedRentBreakdown` type in `lib/calculator/types.ts` with the new per-owner shape.
- Rewrite `computeImputedRent` in `lib/calculator/imputedRent.ts` to use absolute-share distribution (see "The fix" section).
- Update `computeOwnerResults` in `lib/calculator/perOwner.ts` to read `monthlyReceived` for **every** owner (previously only non-live-ins had a non-zero received value).
- Update `ImputedRentCallout.tsx` rendering and copy to show paid + received + net for live-in owners, and to render the all-live-in wash case.
- Update 4 cases in `tests/unit/imputedRent.test.ts` with the new expected values per the verification table.
- Add 2 new tests: conservation invariant, economic-sanity (live-in saves vs FMR).
- Add Guide 3 fixture test in `tests/unit/perOwner.test.ts` asserting live-in net cost ≈ $2,550.
- Manually verify against Fixture 3 in `verification-examples.md` after build.

**Exit criteria:** all imputed-rent tests pass with new values; Guide 3 fixture's live-in net cost ≤ FMR; no `NaN` produced for any of the documented edge cases.

### Phase A — Type & math layer (no UI changes)

- Add `acquisitionMode` to `Scenario` (default `'purchase'`).
- Update `DEFAULT_SCENARIO` in `defaults.ts`.
- Update `encodeScenario` / `decodeScenario` (decoder backfills missing field).
- Add tests:
  - Round-trip for both modes.
  - Decoder backward-compat: an old encoded scenario (no `acquisitionMode`) decodes with `'purchase'`.

### Phase B — Labels & tooltips

- Create `lib/calculator/modes.ts` exporting `FIELD_LABELS`, `TOOLTIP_COPY`, `AcquisitionMode`.
- Build `FieldTooltip.tsx` (hover-card + popover, surface-detected).
- Replace hardcoded labels in `PropertyInputs`, `MortgageInputs`, `OwnerInputs`, `OccupancyInputs` with `FIELD_LABELS[mode][key]`.
- Attach `FieldTooltip` to every labeled input (14 fields total).

### Phase C — Mode toggle

- Build `AcquisitionModeToggle.tsx` (Radix `ToggleGroup`).
- Place at top of `InputPanel`, above the four section cards.
- Wire to `updateScenario({ acquisitionMode })`.
- Pass `mode` to `PerOwnerCard` and `ComparisonChart`; adjust copy/visibility per the comparison adjustments table.

### Phase D — Guides

- Create `lib/calculator/presets.ts` with `SCENARIO_PRESETS`.
- Author 4 MDX files in `content/guides/`.
- Build `ScenarioGuideTrigger` (header button), `ScenarioGuideDialog` (4 cards), `ScenarioGuidePanel` (drawer/sheet, MDX renderer).
- Reuse the blog MDX pipeline.
- Add `Replace current scenario?` confirmation when current scenario differs from defaults.
- Add cold-load banner in `ResultsPanel`.

### Phase E — Tests & polish

- `scenario.test.ts`: add backward-compat decode test and round-trip for both modes.
- Vitest component test for `FieldTooltip`: hover open, click open on touch surface, Esc close, focus trap on keyboard.
- Manual mobile QA on tooltip + guide panel.
- Lighthouse pass on `/calculator` — no regression on LCP/CLS/INP.

---

## Test plan

| Layer | Test | Coverage |
|---|---|---|
| Math | `computeImputedRent` per-owner shape: live-ins have non-zero `monthlyReceived` | New / replaces existing |
| Math | Conservation invariant: `sum(monthlyNet) === 0` for any scenario | New |
| Math | Economic sanity: single live-in's rent-only cost = `FMR × (1 − share)` | New |
| Math | Guide 3 fixture: live-in net monthly cost = $2,550 ± rounding | New |
| Math | All-live-in: every owner's `monthlyNet = 0`, no NaN | Update |
| Scenario encoding | `acquisitionMode` round-trip, both values | New |
| Scenario encoding | Decode legacy scenario (no `acquisitionMode`) → `'purchase'` | New |
| Modes module | `FIELD_LABELS` and `TOOLTIP_COPY` cover all field keys for both modes | New |
| FieldTooltip | Open on hover (pointer), open on tap (touch), close on Esc, close on outside click | New |
| AcquisitionModeToggle | Switching mode updates `scenario.acquisitionMode` only; other fields unchanged | New |
| Presets | Each `SCENARIO_PRESETS[id]` passes `validateScenario` | New |
| Guides | Selecting a guide replaces scenario state and opens panel | Manual |

---

## Backward compatibility

- Any shared scenario URL created before this change decodes successfully with `acquisitionMode = 'purchase'`.
- New encoded URLs are not readable by older deployments — acceptable since the calculator is single-deployment on Vercel and rollbacks are full-stack.
- No database migration required. Saved-scenario rows store the encoded blob verbatim; old rows decode the same way new ones do.

---

## Success criteria

- **Phase 0 ships first.** Imputed-rent tests in `tests/unit/imputedRent.test.ts` reflect the new math; conservation invariant holds; live-in's net rent-only cost equals `FMR × (1 − share)` for any single-live-in scenario.
- For the Guide 3 preset: live-in's net monthly cost is **$2,550 ± $1**, not $3,616.67.
- All 34 existing unit tests pass (or are updated with new expected values); ≥6 new tests added (4 math, 2 component).
- Every input field has a tooltip; copy reviewed by founder.
- Mode toggle re-labels fields without altering numeric values.
- Selecting a guide loads its preset and opens the side panel in under 200ms.
- Pre-change shared scenario URLs continue to decode correctly. **Note:** URLs encoded before Phase 0 will produce *different* per-owner numbers when decoded after Phase 0 (because the math changed). This is intentional and correct; document it in the changelog.
- Bundle impact: `<10kb` gzipped added to `/calculator` route (MDX renderer lazy-loaded with guide panel).

---

## Open questions

1. **Mode toggle placement.** Top of `InputPanel`, or in the header next to `Guides`? Recommendation: top of `InputPanel` so it's visually tied to the inputs it relabels.
2. **Default mode for cold load.** `'purchase'` — matches today's behavior.
3. **Confirmation guard sensitivity.** Should opening a guide always confirm, or only when the current scenario diverges from defaults? Recommendation: only when divergent, to keep the first-time experience friction-free.
4. **Vacation guide framing.** Recommend all-live-in over rented-with-$0 because the imputed-rent flows surface as zero — visible reassurance that the math is balanced — versus rented-out with $0, where there's just nothing to see.

---

*Living document. Update as guides ship and feedback comes in.*
