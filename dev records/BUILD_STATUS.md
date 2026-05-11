# Build Status Report — OwnCo Co-Ownership Calculator

**Date:** 2026-05-10  
**Reporter:** Claude (session 2 — UI refinements and results display improvements)

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
| Phase 5 — Marketing / SEO / Launch | ❌ Not started |

---

## Unit Test Results

**Test runner:** Vitest 4.1.5  
**Duration:** ~1.45s  
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
- 1 of 4 lives in: that owner pays full FMR; 3 non-live-ins split proportionally (~$1,333/each on equal shares)
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

Zero errors. Zero warnings.

---

## Phase Completion Detail

### Phase 1 — Foundation ✅

All tasks complete. Accepted deviations (documented in prior BUILD_STATUS):
- **Tailwind 4** instead of Tailwind 3.4 (shadcn 4.7 requires it; accepted as baseline)
- **sonner** instead of toast (toast not available in shadcn 4.7 base-nova registry)
- **EISDIR bug** that blocked `pnpm build` on E: drive — **resolved**: project is now at `C:\bin\OwnCo` and build passes cleanly with no patches or workarounds
- `lib/utils/cn.ts` duplication from Phase 1 has been resolved; only `lib/utils.ts` remains (shadcn-canonical path)

### Phase 2 — Calculator Engine ✅

All 7 tasks complete. Files in `lib/calculator/`:
- `types.ts` — Scenario, Owner, Occupancy, Results, OwnerResult, Comparison, ImputedRentBreakdown, AmortizationRow. `Results` now includes `monthlyEquityGain`. `OwnerResult` now includes `monthlyEquityGainShare`, `netGainAtYear5`, `netGainAtYear10`, `netGainAtYear30`.
- `mortgage.ts` — monthlyPayment, amortizationSchedule, balanceAtMonth, principalPaidThroughMonth
- `perOwner.ts` — computeOwnershipShares, computeOwnerResults, totalMonthlyCarryingCost, loanPrincipal, externalRentalIncome. Now computes per-owner monthly equity gain (principal paydown + appreciation share) and net gain at 5/10/30 years (equity minus total cash invested).
- `imputedRent.ts` — computeImputedRent
- `equity.ts` — projectEquity, equityTimeSeries
- `compare.ts` — computeComparisons
- `compute.ts` — validateScenario, compute (top-level orchestrator). Now computes `monthlyEquityGain` = month-1 principal paydown + monthly appreciation.
- `scenario.ts` — encodeScenario, decodeScenario (URL-safe base64)
- `defaults.ts` — DEFAULT_SCENARIO (4-owner, $750k, 7%, all live-in)

### Phase 3 — Calculator UI ✅

All 5 tasks complete, with refinements applied in session 2. Files in `components/calculator/`:
- `calculatorStore.ts` — Zustand store: scenario, setScenario, updateScenario
- `CalculatorShell.tsx` — URL sync (reads `?s=` on mount, writes on change debounced 300ms), computes results via `useMemo`
- `InputPanel.tsx` — four Card sections (Property, Mortgage, Owners, Occupancy)
- `PropertyInputs.tsx` — purchasePrice, propertyTaxAnnual, insuranceAnnual, hoaMonthly, maintenanceReserveAnnualPct
- `MortgageInputs.tsx` — mortgageRate (slider + input), mortgageTermYears (select: 15/20/30)
- `OwnerInputs.tsx` — dynamic owner list (2–6), per-owner name/down payment/"Alt. Housing Cost" (formerly "Current Rent"); add/remove buttons; updates occupancy live-in indices on owner removal
- `OccupancyInputs.tsx` — occupancy type select, conditional live-in checkboxes for owner_occupied/mixed, external rent input for rented_out/mixed
- `ResultsPanel.tsx` — validation error state, "Monthly Summary" hero card (three columns: net vs. alt. housing | monthly equity gain | net gain/loss), owner cards grid, imputed rent callout, charts, actions
- `PerOwnerCard.tsx` — net monthly cost headline; three-column monthly row (vs. alt. housing | equity gain | net gain/loss, colored green/red); three-column net gain row (5Y / 10Y / 30Y net gain = equity minus all cash invested)
- `ImputedRentCallout.tsx` — plain-language explanation of imputed rent flow
- `ComparisonChart.tsx` — Recharts BarChart, 3 bars per owner (Co-Buy | Alt. Housing | Solo (owner-occ.))
- `EquityChart.tsx` — Recharts LineChart, equity over 30 years, one line per owner
- `ScenarioActions.tsx` — Save/Share/PDF buttons (disabled stubs, tooltip "Coming soon")

---

## Known Deficiencies

### D1 — Bundle size above spec target
**Severity: Medium**  
The `/calculator` route first-load JS is **306 kB** (190 kB route chunk + 102 kB shared + remainder). The spec targets "under 150 kB gzipped." Recharts is the likely culprit. Gzip compression will reduce this significantly, but the current uncompressed size suggests the gzipped number may still exceed the 150 kB budget. Needs measurement with Vercel Analytics or `next build --debug`.  
**Suggested fix:** Lazy-load `ComparisonChart` and `EquityChart` with `dynamic(() => import(...), { ssr: false })`. Charts are below the fold and load latency is acceptable.

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

`ScenarioActions.tsx` renders Save/Share/PDF as disabled stubs intentionally. The `calculator/[scenarioId]/page.tsx` is a stub that does not hit the database.

### D3 — Phase 5 not started (Marketing / SEO)
**Severity: Planned — not a defect**  
Not yet built: MDX blog, landing page hero/content, sitemap.xml, robots.txt, per-route generateMetadata, JSON-LD schemas, privacy/terms, cookie consent.

### D4 — Database migrations not generated
**Severity: Low (DB not yet wired)**  
`pnpm db:generate` has not been run. `lib/db/migrations/` is empty. This is expected — no `DATABASE_URL` is set and the DB is deferred to Phase 4 deploy.

### D5 — No Playwright / E2E tests
**Severity: Planned — not a defect**  
Per the spec, Playwright is deferred to Phase 5. Calculator UI has not been tested end-to-end in a browser beyond manual verification. The dev server (`pnpm dev`) is the current manual test surface.

### D6 — CALCULATOR_BUILD.md still references "CoOwn" branding
**Severity: Cosmetic**  
The build spec document still uses "CoOwn" in the Nav spec (Task 1.5). The codebase has been renamed to "OwnCo" as of commit `7c5f465`. The spec doc is for reference only and does not affect the build.

---

## Resolved Issues

| Issue | Resolution |
|---|---|
| `pnpm build` EISDIR error on E: drive | Project moved to `C:\bin\OwnCo`; build passes with zero patches |
| `lib/utils/cn.ts` duplication | Deleted; all imports use `@/lib/utils` (shadcn-canonical) |
| Tailwind 4 compatibility | Accepted; shadcn 4.7 requires it; all styles work correctly |
| Toast → Sonner substitution | Accepted; sonner is the current shadcn recommendation |
| Large number of unstaged files (D5 from session 1) | All Phase 1–3 work committed and pushed to origin/dev and origin/master |

---

## Suggested Next Steps

### Option A — Phase 4 (recommended next phase)
Begin Task 4.1 (server actions), Task 4.2 (EmailGate dialog), Task 4.3 (shared scenario view). This is the lead-capture / viral loop phase and unlocks the core business value of the calculator.

### Option B — Bundle size audit
Verify the `/calculator` route meets the 150 kB gzipped budget before adding more code. Add `dynamic()` lazy loading for the chart components.
