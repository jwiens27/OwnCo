# Build Status Report — OwnCo Co-Ownership Calculator

**Date:** 2026-05-11
**Reporter:** Claude (session 3 — UI refinements, mobile fix, content)

---

## Current State Summary

| Check | Status |
|---|---|
| `pnpm typecheck` | ✅ PASSES |
| `pnpm test` (34 tests, 6 files) | ✅ ALL PASS |
| `pnpm build` | ✅ PASSES (EISDIR bug resolved) |
| Phase 1 — Foundation | ✅ Complete |
| Phase 2 — Calculator Engine | ✅ Complete |
| Phase 3 — Calculator UI | ✅ Complete |
| Phase 4 — Save / Share / PDF | ❌ Not started |
| Phase 5 — Marketing / SEO / Launch | ⚠️ Partial (about page written; no MDX, sitemap, etc.) |

---

## Unit Test Results

**Test runner:** Vitest 4.1.5
**Duration:** ~1.72s
**Result:** 6 files, 34 tests — all pass

### Per-file breakdown

| File | Tests | Status |
|---|---|---|
| `tests/unit/mortgage.test.ts` | 9 | ✅ All pass |
| `tests/unit/perOwner.test.ts` | 7 | ✅ All pass |
| `tests/unit/imputedRent.test.ts` | 4 | ✅ All pass |
| `tests/unit/equity.test.ts` | 3 | ✅ All pass |
| `tests/unit/compare.test.ts` | 3 | ✅ All pass |
| `tests/unit/scenario.test.ts` | 3 | ✅ All pass |

### What each suite covers

**mortgage.test.ts (9 tests)**
- `monthlyPayment` against 6 known values (300k/7%/30yr, 500k/6%/30yr, 200k/5%/15yr, 100k/4%/30yr, zero principal, zero rate)
- `amortizationSchedule` — 360-row length, first row high interest, last row high principal, balance reaches zero
- `balanceAtMonth` — month 0 returns full principal, month 360 returns ~0

**perOwner.test.ts (7 tests)**
- Equal contributions → equal ownership shares
- Unequal contributions → proportional shares (50/25/25 split)
- All-zero contributions → equal shares fallback
- `loanPrincipal` = price − total down
- 4-owner shares sum to 1.0
- Rental income reduces net monthly cost
- `monthlySavingsVsRenting` = currentRent − netCost
- Equity growth: year 30 > year 10 > year 5
- Carrying cost components (tax, insurance, maintenance, total)

**imputedRent.test.ts (4 tests)**
- Returns null for `rented_out`
- 1 of 4 lives in: that owner pays full FMR; 3 non-live-ins split proportionally
- 2 of 4 live in: each pays half FMR ($2,000)
- All 4 live in: each pays FMR/4; no receivers
- Unequal ownership: non-live-in receivers get amounts proportional to their shares

**equity.test.ts (3 tests)**
- Month 0 equity = total down payment (price minus loan)
- Month 360 equity ≈ fully appreciated property value (loan paid off)
- Per-owner equity values sum to total equity

**compare.test.ts (3 tests)**
- Flags `buySolo.feasible = false` when down payment < 5% of purchase price
- `keepRenting.monthlyCost` matches `owner.currentMonthlyRent`
- `coBuy.monthlyCost` matches `OwnerResult.netMonthlyCost`

**scenario.test.ts (3 tests)**
- DEFAULT_SCENARIO round-trips through `encodeScenario` → `decodeScenario` without loss
- Garbage input returns null
- Encoded output contains no `+`, `/`, or `=` (URL-safe base64url)

---

## Build Output

```
Route (app)                                 Size  First Load JS
┌ ○ /                                      163 B         106 kB
├ ○ /_not-found                             1 kB         103 kB
├ ○ /about                                 137 B         102 kB
├ ○ /blog                                  137 B         102 kB
├ ƒ /blog/[slug]                           137 B         102 kB
├ ƒ /calculator                           190 kB         306 kB
├ ƒ /calculator/[scenarioId]               137 B         102 kB
└ ○ /pricing                               137 B         102 kB
+ First Load JS shared by all             102 kB
```

Zero errors. Zero warnings. (Last full build run: 2026-05-10; no bundle-affecting changes since.)

---

## Phase Completion Detail

### Phase 1 — Foundation ✅

All tasks complete. Accepted deviations:
- **Tailwind 4** instead of Tailwind 3.4 (shadcn 4.7 requires it; accepted as baseline)
- **sonner** instead of toast (toast not available in shadcn 4.7 base-nova registry)
- **EISDIR bug** resolved: project at `C:\bin\OwnCo`, build passes with no patches
- `lib/utils/cn.ts` deleted; only `lib/utils.ts` remains (shadcn-canonical)

### Phase 2 — Calculator Engine ✅

All 7 tasks complete. Files in `lib/calculator/`:
- `types.ts` — Scenario, Owner, Occupancy, Results, OwnerResult, Comparison, ImputedRentBreakdown, AmortizationRow. `Results` includes `monthlyEquityGain`. `OwnerResult` includes `monthlyEquityGainShare`, `netGainAtYear5/10/30`.
- `mortgage.ts` — monthlyPayment, amortizationSchedule, balanceAtMonth, principalPaidThroughMonth
- `perOwner.ts` — computeOwnershipShares, computeOwnerResults, totalMonthlyCarryingCost, loanPrincipal, externalRentalIncome. Computes per-owner monthly equity gain share and net gain at 5/10/30 years (equity minus total cash invested).
- `imputedRent.ts` — computeImputedRent
- `equity.ts` — projectEquity, equityTimeSeries
- `compare.ts` — computeComparisons
- `compute.ts` — validateScenario, compute. Computes `monthlyEquityGain` = month-1 principal paydown + monthly appreciation.
- `scenario.ts` — encodeScenario, decodeScenario (URL-safe base64)
- `defaults.ts` — DEFAULT_SCENARIO (4-owner, $750k, 7%, 30yr, all live-in). `currentMonthlyRent` is 0 for all owners (field retained in type but not exposed in UI).

### Phase 3 — Calculator UI ✅

All 5 tasks complete. Files in `components/calculator/`:
- `calculatorStore.ts` — Zustand store: scenario, setScenario, updateScenario
- `CalculatorShell.tsx` — URL sync (reads `?s=` on mount, writes on change debounced 300ms), computes results via `useMemo`
- `InputPanel.tsx` — four Card sections (Property, Mortgage, Owners, Occupancy)
- `PropertyInputs.tsx` — purchasePrice, propertyTaxAnnual, insuranceAnnual, hoaMonthly, maintenanceReserveAnnualPct, expectedAppreciationPct. All inputs use `type="text" inputMode="decimal"` with local string state (mobile backspace fix).
- `MortgageInputs.tsx` — mortgageRate (slider + text input), mortgageTermYears (select: 15/20/30). Rate input uses same mobile-safe pattern.
- `OwnerInputs.tsx` — dynamic owner list (2–6), per-owner name and down payment only. "Alt. Housing Cost" field removed (currentMonthlyRent zeroed in defaults; field retained in type). Uses `OwnerRow` sub-component to support hooks inside `.map()`.
- `OccupancyInputs.tsx` — occupancy type select, conditional live-in checkboxes, rent/FMR inputs. All numeric inputs use mobile-safe local state pattern.
- `ResultsPanel.tsx` — validation error state; "Monthly Summary" hero card with three columns: net vs. alt. housing | monthly equity gain | net gain/loss (green/red). Owner cards grid, imputed rent callout, charts, actions.
- `PerOwnerCard.tsx` — net monthly cost headline; three-column monthly row (vs. alt. housing | equity gain | net gain/loss, green/red only on net); three-column net gain row (5Y / 10Y / 30Y, equity minus all cash invested).
- `ImputedRentCallout.tsx` — plain-language explanation of imputed rent flow
- `ComparisonChart.tsx` — Recharts BarChart, 3 bars per owner: Co-Buy | Alt. Housing | Solo (owner-occ.)
- `EquityChart.tsx` — Recharts LineChart, equity over 30 years, one line per owner
- `ScenarioActions.tsx` — Save/Share/PDF buttons (disabled stubs, tooltip "Coming soon")

### Marketing pages ⚠️ Partial

- `app/(marketing)/page.tsx` — Home: heading + "Open Calculator" CTA. Placeholder "Calculator coming soon" text removed.
- `app/(marketing)/about/page.tsx` — Full product vision copy added (two paragraphs): co-ownership failure modes, OwnCo's dynamic ownership tracking model, and the roadmap from free calculator to full LLC/operating-agreement platform.
- `app/(marketing)/pricing/page.tsx` — Stub ("Coming soon")
- `app/(marketing)/blog/` — Stub (no MDX content)

---

## Known Deficiencies

### D1 — Bundle size above spec target
**Severity: Medium**
The `/calculator` route first-load JS is **306 kB**. The spec targets "under 150 kB gzipped." Recharts is the likely culprit.
**Suggested fix:** Lazy-load `ComparisonChart` and `EquityChart` with `dynamic(() => import(...), { ssr: false })`.

### D2 — Phase 4 not started (Save / Share / PDF)
**Severity: Planned — not a defect**
The following Phase 4 artifacts do not exist:
- `components/calculator/EmailGate.tsx`
- `server/actions/saveScenario.ts`, `shareScenario.ts`, `requestPdf.ts`
- `lib/pdf/ScenarioPdf.tsx`
- `lib/email/ScenarioPdfEmail.tsx`, `send.ts`
- `lib/og/ScenarioOgImage.tsx`
- `lib/analytics/events.ts`
- `app/api/og/[scenarioId]/route.tsx`
- `lib/utils/cuid.ts`

`ScenarioActions.tsx` renders Save/Share/PDF as disabled stubs intentionally.

### D3 — Phase 5 largely not started (Marketing / SEO)
**Severity: Planned — not a defect**
About page has real copy. Home page has CTA. Everything else is missing: MDX blog, landing page hero/features section, sitemap.xml, robots.txt, per-route generateMetadata, JSON-LD schemas, privacy/terms, cookie consent.

### D4 — Database migrations not generated
**Severity: Low (DB not yet wired)**
`pnpm db:generate` has not been run. `lib/db/migrations/` is empty. Deferred until `DATABASE_URL` is available for Phase 4 deploy.

### D5 — No Playwright / E2E tests
**Severity: Planned — not a defect**
Playwright deferred to Phase 5. Calculator UI verified manually only.

### D6 — CALCULATOR_BUILD.md still references "CoOwn" branding
**Severity: Cosmetic**
Spec doc uses "CoOwn" in the Nav spec (Task 1.5). Codebase is "OwnCo" as of commit `7c5f465`. Spec is reference-only.

---

## Resolved Issues

| Issue | Resolution |
|---|---|
| `pnpm build` EISDIR error on E: drive | Project moved to `C:\bin\OwnCo` |
| `lib/utils/cn.ts` duplication | Deleted; all imports use `@/lib/utils` |
| Tailwind 4 / sonner substitutions | Accepted; both are correct for current shadcn version |
| Large number of unstaged files | All Phase 1–3 work committed and pushed |
| `type="number"` backspace broken on mobile | Replaced with `type="text" inputMode="decimal"` + local state across all 4 input files |
| "Alt. Housing Cost" field causing UX confusion | Field removed from UI; `currentMonthlyRent` zeroed in defaults, retained in type |

---

## Suggested Next Steps

### Option A — Phase 4 (recommended next phase)
Begin Task 4.1 (server actions), Task 4.2 (EmailGate dialog), Task 4.3 (shared scenario view). This is the lead-capture / viral loop phase and unlocks the core business value of the calculator.

### Option B — Bundle size audit
Verify the `/calculator` route meets the 150 kB gzipped budget. Add `dynamic()` lazy loading for chart components.
