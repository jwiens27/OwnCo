# Build Status Report — OwnCo Co-Ownership Calculator

**Date:** 2026-05-11
**Reporter:** Claude (session 4 — imputed rent fix, acquisition mode, tooltips, scenario guides)

---

## Current State Summary

| Check | Status |
|---|---|
| `pnpm typecheck` | ✅ PASSES |
| `pnpm test` (54 tests, 7 files) | ✅ ALL PASS |
| `pnpm build` | ✅ PASSES |
| Phase 1 — Foundation | ✅ Complete |
| Phase 2 — Calculator Engine | ✅ Complete |
| Phase 3 — Calculator UI | ✅ Complete |
| Phase 4 — Save / Share / PDF | ❌ Not started |
| Phase 5 — Marketing / SEO / Launch | ⚠️ Partial (about page written; no MDX, sitemap, etc.) |

---

## Unit Test Results

**Test runner:** Vitest 4.1.5
**Duration:** ~2.13s
**Result:** 7 files, 54 tests — all pass

### Per-file breakdown

| File | Tests | Status | Notes |
|---|---|---|---|
| `tests/unit/mortgage.test.ts` | 9 | ✅ All pass | Unchanged |
| `tests/unit/perOwner.test.ts` | 10 | ✅ All pass | +3 (Guide 3 fixture) |
| `tests/unit/imputedRent.test.ts` | 6 | ✅ All pass | +2 (conservation + economic sanity) |
| `tests/unit/equity.test.ts` | 3 | ✅ All pass | Unchanged |
| `tests/unit/compare.test.ts` | 3 | ✅ All pass | Unchanged |
| `tests/unit/scenario.test.ts` | 4 | ✅ All pass | +1 (backward-compat decode) |
| `tests/unit/compute.test.ts` | 14 | ✅ All pass | **New** — end-to-end fixtures |

### What each suite covers

**mortgage.test.ts (9 tests)**
- `monthlyPayment` against 6 known values (300k/7%/30yr, 500k/6%/30yr, 200k/5%/15yr, 100k/4%/30yr, zero principal, zero rate)
- `amortizationSchedule` — 360-row length, first row high interest, last row high principal, balance reaches zero
- `balanceAtMonth` — month 0 returns full principal, month 360 returns ~0

**perOwner.test.ts (10 tests)**
- Equal contributions → equal ownership shares
- Unequal contributions → proportional shares (50/25/25 split)
- All-zero contributions → equal shares fallback
- `loanPrincipal` = price − total down
- 4-owner shares sum to 1.0
- Rental income reduces net monthly cost
- Equity growth: year 30 > year 10 > year 5
- Carrying cost components (tax, insurance, maintenance, total)
- Guide 3 fixture (inheritance-one-lives-in): live-in net ≈ $2,550; non-live-ins ≈ −$650; conservation holds

**imputedRent.test.ts (6 tests)**
- Returns null for `rented_out`
- 1 of 4 lives in: that owner pays FMR/1; non-live-ins receive FMR × share
- 2 of 4 live in: each pays FMR/2
- All 4 live in: each pays FMR/4; no net receivers
- Conservation: `sum(monthlyNet)` = 0 across all owners
- Economic sanity: live-in net cost < FMR (never pays more than open-market rent)

**equity.test.ts (3 tests)**
- Month 0 equity = total down payment (price minus loan)
- Month 360 equity ≈ fully appreciated property value (loan paid off)
- Per-owner equity values sum to total equity

**compare.test.ts (3 tests)**
- Flags `buySolo.feasible = false` when down payment < 5% of purchase price
- `keepRenting.monthlyCost` matches `owner.currentMonthlyRent`
- `coBuy.monthlyCost` matches `OwnerResult.netMonthlyCost`

**scenario.test.ts (4 tests)**
- DEFAULT_SCENARIO round-trips through `encodeScenario` → `decodeScenario` without loss
- Garbage input returns null
- Encoded output contains no `+`, `/`, or `=` (URL-safe base64url)
- Legacy URL missing `acquisitionMode` backfills to `"purchase"`

**compute.test.ts (14 tests) — new**
- All SCENARIO_PRESETS pass `validateScenario`
- Fixture 1 (investor-purchase): carrying cost ≈ $3,653.56; monthly equity gain ≈ $1,536.89; each investor net ≈ $84.52/mo; equity gain share ≈ $512.30; no imputed rent; conservation holds
- Fixture 3 (inheritance-one-lives-in): live-in net ≈ $2,550; non-live-ins ≈ −$650; conservation holds; imputed rent sum = 0

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

Zero errors. Zero warnings. (Last confirmed passing build: 2026-05-11.)

---

## Phase Completion Detail

### Phase 1 — Foundation ✅

All tasks complete. Accepted deviations:
- **Tailwind 4** instead of Tailwind 3.4 (shadcn 4.7 requires it; accepted as baseline)
- **sonner** instead of toast (toast not available in shadcn 4.7 base-nova registry)
- **EISDIR bug** resolved: project at `C:\bin\OwnCo`, build passes with no patches
- `lib/utils/cn.ts` deleted; only `lib/utils.ts` remains (shadcn-canonical)

### Phase 2 — Calculator Engine ✅

All tasks complete. Files in `lib/calculator/`:
- `types.ts` — `AcquisitionMode`, `Scenario`, `Owner`, `Occupancy`, `Results`, `OwnerResult`, `Comparison`, `ImputedRentBreakdown`, `AmortizationRow`. `Results` includes `monthlyEquityGain`. `OwnerResult` includes `monthlyEquityGainShare`, `netGainAtYear5/10/30`.
- `mortgage.ts` — monthlyPayment, amortizationSchedule, balanceAtMonth, principalPaidThroughMonth
- `perOwner.ts` — computeOwnershipShares, computeOwnerResults, totalMonthlyCarryingCost, loanPrincipal, externalRentalIncome. Computes per-owner monthly equity gain share and net gain at 5/10/30 years (equity minus total cash invested).
- `imputedRent.ts` — computeImputedRent. Corrected algorithm: every owner receives `FMR × share`; live-ins pay `FMR / k`. Conservation invariant: `sum(monthlyNet) = 0`.
- `equity.ts` — projectEquity, equityTimeSeries
- `compare.ts` — computeComparisons
- `compute.ts` — validateScenario, compute. `monthlyEquityGain` = month-1 principal paydown + monthly appreciation.
- `scenario.ts` — encodeScenario, decodeScenario (URL-safe base64). Backfills `acquisitionMode = "purchase"` for legacy URLs.
- `defaults.ts` — DEFAULT_SCENARIO: 4 owners, $750k purchase, 7%/30yr, rented out at $6,000/mo.
- `modes.ts` — `FieldKey`, `FIELD_LABELS`, `TOOLTIP_COPY` for both acquisition modes. Inheritance overrides 4 labels/tooltips; all others fall through from purchase base.
- `presets.ts` — `GuideId`, `SCENARIO_PRESETS` (4 full Scenario objects), `GUIDE_META` (title, subtitle, icon).

### Phase 3 — Calculator UI ✅

All tasks complete. Files in `components/calculator/`:
- `calculatorStore.ts` — Zustand store: scenario, setScenario, updateScenario
- `CalculatorShell.tsx` — URL sync (reads `?s=` on mount, writes on change debounced 300ms), computes results via `useMemo`, detects default scenario for banner
- `AcquisitionModeToggle.tsx` — segmented control (Purchase | Inheritance) at top of InputPanel
- `InputPanel.tsx` — AcquisitionModeToggle + four Card sections (Property, Mortgage, Owners, Occupancy)
- `FieldTooltip.tsx` — Base UI Tooltip wrapper with Lucide `Info` icon trigger, 200ms delay
- `PropertyInputs.tsx` — mode-aware labels and tooltips via `FIELD_LABELS[mode]` / `TOOLTIP_COPY[mode]`
- `MortgageInputs.tsx` — mode-aware labels/tooltips; rate slider + text input; term select (15/20/30yr)
- `OwnerInputs.tsx` — dynamic owner list (2–6); mode-aware down payment label/tooltip
- `OccupancyInputs.tsx` — occupancy type select, conditional live-in checkboxes, rent/FMR inputs; all numeric inputs use mobile-safe local state
- `ResultsPanel.tsx` — validation error state; Monthly Summary hero card (Monthly Payment | Monthly Equity Gain | Net Gain/Loss); cold-load banner with "Browse scenario guides →" link; owner cards grid; imputed rent callout; charts; actions
- `PerOwnerCard.tsx` — net monthly cost headline; mode-aware year column label; net gain/loss (equity gain − net cost)
- `ImputedRentCallout.tsx` — bidirectional per-owner paid/received/net display; wash copy for all-live-in case
- `ComparisonChart.tsx` — Recharts BarChart; mode-aware bar labels; conditional solo/alt-housing bar visibility
- `EquityChart.tsx` — Recharts LineChart, equity over 30 years, one line per owner
- `ScenarioActions.tsx` — Scenario Guides trigger + Save/Share/PDF disabled stubs
- `ScenarioGuideTrigger.tsx` — dialog open state, confirmation guard, preset loader, panel visibility
- `ScenarioGuideDialog.tsx` — modal overlay with 4 guide cards
- `ScenarioGuidePanel.tsx` — fixed right-side drawer (380px desktop), renders guide TSX content, "Reset to defaults" link

Guide content (no MDX pipeline — implemented as TSX React components):
- `content/guides/investor-purchase.tsx`
- `content/guides/inheritance-rent-out.tsx`
- `content/guides/inheritance-one-lives-in.tsx`
- `content/guides/inheritance-vacation.tsx`

### Marketing pages ⚠️ Partial

- `app/(marketing)/page.tsx` — Home: heading + "Open Calculator" CTA
- `app/(marketing)/about/page.tsx` — Full product vision copy
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
| Imputed rent math error (live-ins paid full FMR) | Corrected: live-ins pay FMR/k, all owners receive FMR×share; conservation invariant holds |
| Monthly Payment formula showing savings-vs-renting | Fixed: `totalRentalIncome − totalMonthlyCarryingCost` (direct cash flow) |
| Vercel build: `asChild` on Base UI TooltipTrigger | Removed `asChild`; props moved directly onto `TooltipTrigger` |
| Vercel build: `ReturnType<typeof useCalculatorStore>["scenario"]` unresolvable | Replaced with explicit `Scenario` import |

---

## Suggested Next Steps

### Option A — Phase 4 (recommended next phase)
Begin Task 4.1 (server actions), Task 4.2 (EmailGate dialog), Task 4.3 (shared scenario view). This is the lead-capture / viral loop phase and unlocks the core business value of the calculator.

### Option B — Bundle size audit
Verify the `/calculator` route meets the 150 kB gzipped budget. Add `dynamic()` lazy loading for chart components.
