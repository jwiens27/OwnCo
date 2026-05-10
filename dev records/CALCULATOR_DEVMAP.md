# CALCULATOR_DEVMAP.md

Engineering roadmap for the **Co-Ownership Calculator** — the free, public-facing tool that serves as the acquisition engine for the platform. Reference aesthetic: **Linear** — fast, monochrome, keyboard-first, minimal but precise.

---

## Purpose

The calculator is not a feature. It is the front door of the business. Every paying customer in Year 1 will likely come through it. It needs to do three things, in this order:

1. **Be genuinely useful** — accurate, clear, and trustworthy enough that someone deciding whether to buy a house with friends can rely on it
2. **Be shareable** — the natural next step after running numbers is sending them to potential co-buyers; that share flow is the viral loop
3. **Capture leads at the right moment** — never gate the basic experience, but gate the artifacts (saved scenarios, PDF, share links) behind email

Everything below is in service of those three goals.

---

## Guiding Principles

**No auth required for basic use.** Anyone hitting the page can run numbers immediately. Email is collected only when the user wants to save, share, or export — at the moment they're already committed enough to want a permanent artifact.

**The live-in-owner math is the headline feature.** It's the most differentiated and emotionally loaded output. Design the UI to surface it prominently when applicable, not bury it.

**Shareable scenarios are first-class objects.** Each saved scenario gets a permanent URL, a custom OG image showing the savings amount, and a clean read-only view that recipients can fork. This is how the calculator spreads.

**Mobile-first.** Most prospective co-buyers will run the numbers on their phone, often while texting with the people they're considering buying with. Mobile UX is not a port of desktop — it's the primary surface.

**Performance is brand.** A slow calculator feels untrustworthy, especially around money. Initial load under 1.5s on 4G, calculation updates instant.

**Linear-feel specifics:**
- Monochrome with a single accent color
- Geist or Inter typography, tight tracking
- Dark mode default, light mode toggle
- Subtle, fast motion (150–250ms ease-out)
- Empty and loading states are designed
- Numbers update live as inputs change — no "Calculate" button

---

## Stack

Lean, modern, Vercel-deployable. Same stack the eventual full product will use, so nothing is throwaway.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Server components for the marketing/SEO surface, client components for the calculator interactivity, single deployment |
| Language | **TypeScript** strict | Catches math errors before they ship |
| Styling | **Tailwind CSS** + **shadcn/ui** | Linear-quality components fast |
| Component primitives | **Radix UI** (via shadcn) | Accessibility and keyboard handling |
| Typography | **Geist** | Free, modern, Linear-adjacent |
| Icons | **Lucide** | Consistent, tree-shakeable |
| Charts | **Recharts** | Equity build-up over time, side-by-side comparison |
| Forms | **React Hook Form** + **Zod** | Schema validation, shared client/server |
| State | **URL state** for scenario, **Zustand** for transient UI state | URL-as-state means every scenario is shareable by default |
| Database | **PostgreSQL on Neon** | Stores saved scenarios and email captures only |
| ORM | **Drizzle ORM** | Type-safe, lightweight |
| Email | **Resend** + **React Email** | PDF delivery, share notifications |
| PDF | **react-pdf** (`@react-pdf/renderer`) | Branded scenario PDFs |
| OG images | **Next.js `ImageResponse`** | Dynamic OG image per shared scenario |
| Hosting | **Vercel** | Edge functions for OG, zero-config |
| Analytics | **PostHog** | Funnel tracking, session replay |
| Error tracking | **Sentry** | Standard |

### Why these specific choices

- **URL as state.** The calculator's scenario lives in the URL (encoded as a compact base64 query param). This means every state of the calculator is already a shareable link — no backend round-trip needed for sharing. Saving a scenario just means writing that URL plus an email to a database row.
- **Recharts over D3.** D3 is overkill for two charts. Recharts is fast, tree-shakeable, and styles cleanly with Tailwind.
- **react-pdf over Puppeteer.** Puppeteer requires a serverless function with a Chromium binary — slow, expensive on Vercel. react-pdf renders at the edge in milliseconds.

---

## Project Structure

```
coown-calculator/                    # Same repo as the eventual full product
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx               # Marketing shell: nav, footer, dark mode
│   │   ├── page.tsx                 # Landing page (calculator embedded)
│   │   ├── calculator/
│   │   │   ├── page.tsx             # Full-page calculator
│   │   │   └── [scenarioId]/
│   │   │       └── page.tsx         # Shared scenario read-only view
│   │   ├── pricing/page.tsx         # Placeholder — points to waitlist
│   │   ├── about/page.tsx
│   │   └── blog/                    # MDX, seeded with SEO posts
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx
│   ├── api/
│   │   └── og/
│   │       └── [scenarioId]/route.tsx   # Dynamic OG image per scenario
│   └── layout.tsx
├── components/
│   ├── calculator/
│   │   ├── CalculatorShell.tsx      # Top-level container, manages URL state
│   │   ├── InputPanel.tsx           # All inputs, mobile stepper / desktop single-screen
│   │   ├── PropertyInputs.tsx       # Price, taxes, insurance, HOA, maintenance
│   │   ├── OwnerInputs.tsx          # Per-owner contribution and current rent
│   │   ├── MortgageInputs.tsx       # Rate, term, down payment
│   │   ├── OccupancyInputs.tsx      # Live-in toggle, fair-market-rent
│   │   ├── ResultsPanel.tsx         # Headline savings, per-owner breakdown
│   │   ├── PerOwnerCard.tsx         # One owner's monthly cost, savings vs rent
│   │   ├── ImputedRentCallout.tsx   # The differentiating output, prominent
│   │   ├── ComparisonChart.tsx      # Buy-solo vs rent vs co-buy
│   │   ├── EquityChart.tsx          # 5/10/30 year equity build-up
│   │   ├── ScenarioActions.tsx      # Save / Share / PDF buttons
│   │   └── EmailGate.tsx            # Modal that captures email before save/share/PDF
│   ├── shared/
│   │   ├── Nav.tsx
│   │   ├── Footer.tsx
│   │   └── ThemeToggle.tsx
│   └── ui/                          # shadcn primitives
├── lib/
│   ├── calculator/
│   │   ├── mortgage.ts              # Amortization, monthly payment, total interest
│   │   ├── scenario.ts              # Scenario type, URL encoding/decoding, validation
│   │   ├── compute.ts               # Top-level: scenario → results
│   │   ├── perOwner.ts              # Per-owner breakdown logic
│   │   ├── imputedRent.ts           # Live-in owner math
│   │   ├── equity.ts                # Equity projection over time
│   │   └── compare.ts               # Buy-solo / rent / co-buy comparison
│   ├── db/
│   │   ├── schema.ts                # Just two tables: scenarios, email_captures
│   │   ├── client.ts
│   │   └── migrations/
│   ├── email/
│   │   ├── ScenarioPdfEmail.tsx     # React Email template
│   │   └── send.ts
│   ├── pdf/
│   │   └── ScenarioPdf.tsx          # react-pdf document
│   ├── og/
│   │   └── ScenarioOgImage.tsx      # Dynamic OG image generator
│   └── utils/
│       ├── format.ts                # Currency, percent, period formatters
│       └── validate.ts              # Input validation
├── content/
│   └── blog/                        # MDX posts seeded for SEO
│       ├── buying-a-house-with-friends.mdx
│       ├── sibling-inherited-house.mdx
│       └── tenants-in-common-explained.mdx
├── public/
│   ├── og-default.png
│   └── fonts/
└── tests/
    └── unit/
        ├── mortgage.test.ts
        ├── perOwner.test.ts
        ├── imputedRent.test.ts
        └── scenario.test.ts         # URL encode/decode round-trip
```

The **`lib/calculator/`** directory is pure — no React, no DOM, no DB, no fetch. Every function takes a `Scenario` and returns a `Results` object. This makes it trivially testable and reusable later in the full product.

---

## The Scenario Object

The single source of truth for what the user is modeling. Lives in the URL, gets persisted on save.

```typescript
type Scenario = {
  // Property
  purchasePrice: number;
  propertyTaxAnnual: number;        // dollars/year
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenanceReserveAnnualPct: number;  // % of property value, default 1%
  
  // Mortgage
  mortgageRate: number;             // APR as decimal (0.07 = 7%)
  mortgageTermYears: number;        // typically 30
  
  // Owners
  owners: Array<{
    name: string;
    downPayment: number;
    currentMonthlyRent: number;     // for "savings vs renting" comparison
  }>;
  
  // Occupancy
  occupancy: 
    | { type: "rented_out" }                                     // pure investment
    | { type: "owner_occupied"; liveInOwnerIndices: number[]; fairMarketRent: number }
    | { type: "mixed"; liveInOwnerIndices: number[]; fairMarketRent: number; remainingRentedAt: number };
  
  // Comparison baseline
  expectedAppreciationPct: number;  // annual, default 3%
};
```

The scenario serializes to a compact base64 URL parameter. `?s=<base64>`. Round-trip tested.

---

## Phase Breakdown

Total duration: **6–8 weeks**. One designer + one engineer. Phases are sequential but the foundation week overlaps with design work.

---

## Phase 1: Foundation

**Duration:** week 1
**Goal:** project skeleton, design system, deployable shell.

### Steps

**1.1 — Repo and tooling**
- Next.js 15 app, TypeScript strict, App Router
- Tailwind, shadcn/ui, Geist font
- ESLint, Prettier, Husky pre-commit hooks
- Vitest for unit tests
- Playwright stub for end-to-end (used in Phase 5)
- GitHub Actions: type-check, lint, test on every PR
- Vercel deployment with preview URLs

**1.2 — Design system**
- Theme tokens (colors, spacing, radii, motion)
- Dark mode default, light mode via `next-themes`
- Single accent color picked with the designer
- Typography scale
- Base components from shadcn: Button, Input, Label, Card, Tabs, Toast, Dialog, Sheet (mobile)

**1.3 — Marketing shell**
- Nav with logo, "Calculator" CTA, "Pricing" (waitlist), theme toggle
- Footer with legal links
- Layout works at 375px (mobile), 768px (tablet), 1280px+ (desktop)

**1.4 — Database**
- Neon Postgres provisioned
- Drizzle setup with two tables:
  ```
  scenarios:        id (cuid), encoded_state (text), email (text, nullable), created_at, view_count
  email_captures:   id, email, scenario_id, source ('save'|'share'|'pdf'), created_at
  ```
- Migration tooling working

**1.5 — Analytics and error tracking**
- PostHog SDK, basic page view tracking
- Sentry integration
- Funnel events stubbed (will populate in Phase 4)

### Deliverables
- A deployed empty marketing site
- Design system documented
- DB ready

---

## Phase 2: Calculator Engine

**Duration:** weeks 2–3
**Goal:** build the math layer, fully tested, before any UI.

This phase is critical. If the math is wrong, the product is worse than useless. We write tests first, ship the engine before the UI it powers.

### Steps

**2.1 — Mortgage math (`lib/calculator/mortgage.ts`)**
- `monthlyPayment(principal, rate, termYears): number`
- `amortizationSchedule(principal, rate, termYears): Array<{ month, principal, interest, balance }>`
- `totalInterest(principal, rate, termYears): number`
- Standard formulas, double-checked against published mortgage calculators

**2.2 — Per-owner breakdown (`lib/calculator/perOwner.ts`)**
- Given a Scenario, compute each owner's:
  - Ownership share (downPayment / total downPayments, or equal if all paid equally)
  - Monthly mortgage share (proportional to ownership)
  - Monthly tax/insurance/HOA/maintenance share
  - Total gross monthly cost
  - Net monthly cost (after rental income share, after imputed rent if applicable)
  - Monthly cost vs. their current rent
- Pure function, scenario in, results out

**2.3 — Imputed rent math (`lib/calculator/imputedRent.ts`)**
- For owner-occupied scenarios, compute:
  - Total fair-market rent
  - Live-in owner's "consumption" of housing (fair-market-rent equivalent)
  - Non-occupying owners' lost opportunity (their share of fair-market rent they're not collecting)
  - Whether the live-in owner pays imputed rent to the partnership (default assumption: yes, prorated to non-occupying owners' shares)
- This is the differentiating math; test it exhaustively

**2.4 — Equity projection (`lib/calculator/equity.ts`)**
- 5/10/30 year equity build-up per owner
- Inputs: ownership share, principal paydown schedule, expected appreciation
- Output: per-owner equity at each milestone

**2.5 — Comparison (`lib/calculator/compare.ts`)**
- For each owner, compute three scenarios:
  - **Buy solo:** could they afford this house alone? At what monthly cost? (Often: no, can't afford the down payment.)
  - **Keep renting:** their current rent + reasonable rent inflation, no equity built
  - **Co-buy (this scenario):** their net monthly cost and equity build-up
- Output: a comparison object the UI renders as a chart

**2.6 — Top-level compute (`lib/calculator/compute.ts`)**
- Single entry point: `compute(scenario): Results`
- Orchestrates the above
- Validates the scenario, returns errors for nonsensical inputs (negative numbers, more live-in owners than total owners, etc.)

**2.7 — Scenario serialization (`lib/calculator/scenario.ts`)**
- `encodeScenario(scenario): string` (base64 of zlib-compressed JSON)
- `decodeScenario(encoded): Scenario | null`
- `validateScenario(scenario): ValidationResult`
- Round-trip tested

**2.8 — Test coverage**
- Vitest, target 100% on `lib/calculator/`
- Test cases: equal-contribution scenario, unequal-contribution, all-owners-live-there, one-owner-lives-there, mixed (some live, some renting out rooms), edge cases (zero down payment from one owner, very high HOA, very low purchase price)

### Deliverables
- Pure, tested calculator engine
- Can be invoked from any UI in the next phase

---

## Phase 3: Calculator UI

**Duration:** weeks 3–5
**Goal:** the actual calculator interface — the thing users will touch.

### Steps

**3.1 — Calculator shell (`CalculatorShell.tsx`)**
- Reads scenario from URL on mount; if missing, loads sensible defaults
- Writes scenario back to URL on every change (debounced 300ms)
- Provides scenario + results to children via context or props
- Manages mobile vs. desktop layout

**3.2 — Mobile layout (priority)**
- Stepper UI: 4 steps (Property → Mortgage → Owners → Occupancy)
- Each step is a full screen
- Bottom-fixed "Continue" button
- After step 4, results screen
- Tabs at the bottom of results to revisit any step
- Swipeable between steps via Radix Tabs

**3.3 — Desktop layout**
- Two-column: inputs on the left (40%), results on the right (60%)
- Inputs grouped in collapsible sections
- Results update live as inputs change
- Sticky results panel as user scrolls inputs

**3.4 — Input components**
- `PropertyInputs`: price, taxes, insurance, HOA, maintenance reserve
- `MortgageInputs`: rate (slider + input), term (30/20/15), down payment % derived from owner inputs
- `OwnerInputs`: dynamic list, add/remove (2–6), per-owner name/down-payment/current-rent
- `OccupancyInputs`: radio for rented/owner-occupied/mixed, then conditional inputs
- All inputs use React Hook Form + Zod
- Currency inputs auto-format ($, commas)
- Percent inputs accept either 7 or 0.07
- Inputs validate on blur; errors shown inline

**3.5 — Results components**
- `ResultsPanel`: orchestrates the rest
- Headline: "You'd save $X/month vs. renting" (largest type, accent color)
- `PerOwnerCard`: one card per owner, showing their monthly cost, savings vs. rent, ownership share, equity at year 5
- `ImputedRentCallout`: shown when scenario is owner-occupied; explains the math in plain language ("Alex lives in the property. Fair-market rent is $X. Alex pays $Y/month to the partnership, distributed to Sam, Jordan, and Casey by ownership share.")
- `ComparisonChart` (Recharts): three bars per owner — buy solo, keep renting, co-buy — showing monthly cost
- `EquityChart` (Recharts): line chart, equity over 30 years, one line per owner

**3.6 — Empty and edge states**
- "Add another owner" empty state when only one owner is configured
- Validation errors displayed without breaking layout
- Loading state when scenario decodes from URL (should be instant; only relevant for slow networks)

**3.7 — Polish**
- Keyboard shortcuts: `?` to show shortcuts, `tab` works through all inputs in order, arrow keys on number inputs
- Live updates animate (number rolls up/down with framer-motion or CSS transitions)
- Toast notifications for non-blocking events ("Scenario URL copied")

### Deliverables
- The calculator works end-to-end
- Mobile and desktop both feel native
- Numbers update instantly as user types

---

## Phase 4: Sharing, Saving, and Lead Capture

**Duration:** weeks 5–6
**Goal:** turn the calculator from a tool into a viral artifact.

### Steps

**4.1 — Save scenario (email-gated)**
- "Save this scenario" button in the results panel
- Opens a Dialog: "Enter your email to save and get a permanent link"
- POST to a Server Action: validates email, creates a `scenarios` row with the encoded state, creates an `email_captures` row with source='save'
- Returns a permanent URL: `coown.com/calculator/abc123`
- That URL is now bookmarkable; the user can come back to the same scenario forever
- Sends a follow-up email: "Here's your saved scenario. Want to share it with your future co-owners?"

**4.2 — Share with co-buyers**
- "Share" button opens a Dialog with three options:
  - Copy permanent link
  - Send via email (collects recipient email, sends them a link with a custom subject)
  - Native mobile share sheet (Web Share API on supported devices)
- Sharing also email-gates if the user hasn't already provided one
- Each share is logged for analytics

**4.3 — Shared scenario view (`/calculator/[scenarioId]`)**
- Read-only by default — recipient sees the same numbers the sender saw
- Banner at top: "Shared with you by [name or anonymous]"
- "Fork this scenario" button — clicks it, recipient becomes the owner of a new scenario, edits freely
- Increments `view_count` on the scenarios row

**4.4 — Dynamic OG images (`/api/og/[scenarioId]`)**
- Next.js `ImageResponse`
- Renders a branded card showing: property price, number of owners, headline savings ("Each owner saves $X/month")
- This is what Reddit/Twitter/Discord previews show when someone pastes a scenario URL
- Critical for virality

**4.5 — PDF export (email-gated)**
- "Download PDF" button
- Email gate if not already provided
- Generates PDF via react-pdf:
  - Cover page: property summary, headline savings
  - Per-owner breakdown
  - Imputed rent explanation if applicable
  - Equity projection chart
  - Comparison chart
  - Soft pitch on last page: "You're going to make this real. Here's how to keep the math fair forever — [link to waitlist]"
- PDF emailed to the user via Resend (also offered as direct download)

**4.6 — Email follow-up sequence**
- Day 0: "Here's your scenario, here's your PDF"
- Day 3: "Talked to your co-owners yet? Here's how others have approached the conversation" — links to a blog post
- Day 7: "When you're ready to make it real, we're building the platform that handles the rest" — waitlist link
- Day 30: "Still thinking about it? Here are 3 stories from people who bought together"
- Standard email best practices: unsubscribe link, plain text version, sender domain authenticated (SPF, DKIM, DMARC)

**4.7 — Analytics events**
- PostHog events for the funnel:
  - `calculator_loaded`
  - `inputs_changed` (debounced)
  - `results_viewed` (when results panel becomes visible)
  - `save_clicked`, `email_submitted_save`, `scenario_saved`
  - `share_clicked`, `share_completed` (with method: link/email/native)
  - `pdf_clicked`, `email_submitted_pdf`, `pdf_downloaded`
  - `shared_scenario_viewed` (when someone hits a /[scenarioId] URL)
  - `scenario_forked`
- Conversion goals: `% of visitors who run a scenario`, `% who save`, `% who share`, `% who download PDF`

### Deliverables
- Scenarios are permanent, shareable, and look great in link previews
- Email list growing with high-intent leads
- Funnel analytics in place to optimize against

---

## Phase 5: Marketing Site, SEO, and Launch

**Duration:** weeks 6–8
**Goal:** drive traffic, capture, iterate.

### Steps

**5.1 — Landing page**
- Above the fold: one-line value prop, calculator embed (smaller version), CTA to full calculator
- Below the fold: how it works, who it's for (sibling-inherited, friend-group buys, multigenerational, unmarried couples), testimonials placeholder, FAQ
- Soft CTA at the bottom: waitlist for the full product

**5.2 — Content seed (5 blog posts for SEO)**
- "How to fairly split ownership when buying a house with friends"
- "What happens when siblings inherit a house and disagree"
- "Tenants in common vs. joint tenancy: which is right for you?"
- "Buying a house with your unmarried partner: the agreement you need"
- "When one co-owner lives in the property: how to keep it fair"
- Each post links to the calculator at a natural moment, not as a banner ad
- MDX-based, indexed by `app/(marketing)/blog/`

**5.3 — Pricing/waitlist page**
- Simple: "We're building the full platform — get on the waitlist"
- Captures email, source-tagged differently from calculator captures

**5.4 — SEO basics**
- Sitemap.xml generated at build time
- robots.txt
- Structured data (Article schema for blog posts, FAQPage schema for FAQ)
- Open Graph defaults for non-scenario pages
- Page titles and meta descriptions per route
- Core Web Vitals: LCP < 1.8s, CLS < 0.1, INP < 200ms — all enforced by Vercel Analytics

**5.5 — Launch checklist**
- Privacy policy and terms of service finalized (calculator collects emails, must be compliant)
- Cookie consent banner (PostHog respects it)
- Email deliverability tested (Resend setup with proper DNS)
- Analytics dashboards ready
- Error tracking ready
- 404 and error pages designed

**5.6 — Go-to-market (week 8)**
- Show HN
- ProductHunt
- Reddit posts in r/personalfinance, r/realestateinvesting, r/firsttimehomebuyer (organic, not spammy — share the calculator as a useful tool with a story behind it)
- Twitter/LinkedIn from the founder's account with a thread on the problem
- Outreach to 5 real estate journalists who cover co-ownership trends

### Deliverables
- Live site driving real traffic
- SEO foundation in place
- Email list growing
- Funnel data accumulating to optimize against

---

## Cross-Phase Concerns

### Testing strategy

| Layer | Tooling | Coverage |
|---|---|---|
| Calculator engine (`lib/calculator/`) | Vitest | 100% — every math function, every edge case |
| Scenario URL encoding | Vitest | 100% round-trip |
| UI components | Storybook (Phase 3) | All states for the input and results components |
| End-to-end | Playwright (Phase 5) | Three flows: run a scenario, save and share, view shared scenario |

### Performance budget

- Initial page load (Calculator route): under 1.5s on 4G
- Scenario URL → results rendered: under 100ms
- Input change → results update: under 50ms
- Bundle size: under 150KB gzipped for the calculator route
- Recharts is the largest dependency; lazy-load it for mobile if needed

### Accessibility

- All inputs have associated labels
- Focus management in the mobile stepper (focus moves to the first input of each step)
- Color contrast at AA minimum, AAA for body text
- Charts have text alternatives (screen readers see a table)
- Keyboard nav works fully

### Privacy and trust

- The calculator never leaves the client until the user explicitly saves or shares
- Email captures explain exactly what we'll send and how to unsubscribe
- No third-party trackers besides PostHog (which respects DNT and our cookie consent)
- Scenarios stored in DB are not associated with the email by default — only the `email_captures` row links the two, and that row can be soft-deleted on unsubscribe request

### What "Linear feel" looks like in the calculator

- The calculator screen is the primary surface; the marketing wrapper is restrained around it
- Numbers update without "Calculate" button presses — that button is dated UX
- Single accent color (TBD with brand) on primary CTAs and key numbers; everything else is monochrome
- Subtle motion when numbers change (count-up over 200ms)
- Loading skeletons match the shape of the result they replace
- Empty states ("Add an owner to get started") have personality, not boilerplate copy
- Mobile feels like an app, not a website — full-screen steps, native-feel transitions

---

## Open Questions to Resolve Before Phase 1

1. **Brand and naming.** Pick before week 1 — affects domain, design tokens, OG images, copy throughout
2. **Default scenario values.** What numbers should the calculator load with on a cold visit? Recommend a "$700k house, 4 friends, 25% down each, 7% mortgage, all live there" default that produces a compelling savings number out of the box, so the first impression has a wow factor
3. **How aggressive on the email gate?** Current plan: zero gate on basic use, gate only on save/share/PDF. Worth A/B testing later: does showing equity charts at year 30 cost a conversion if we ungate them?
4. **Disclaimers.** Calculator math is precise; real-world results depend on lender, credit, etc. Where do disclaimers go without undermining the trust the headline numbers build? Recommend a discreet "How we calculate this →" link that opens a methodology page
5. **Geographic scope.** Defaults assume US (USD, 30-year mortgages, conventional loan structure). International is out of scope for the calculator; explicit US-only at launch

---

## Success Metrics

| Metric | Target by end of Phase 5 (week 8) | Target at month 3 post-launch |
|---|---|---|
| Calculator visitors | n/a (just launched) | 5,000/month |
| Scenario completion rate | n/a | 60% (visitors who reach the results panel) |
| Save rate | n/a | 12% (of completers) |
| Share rate | n/a | 5% (of completers) |
| PDF download rate | n/a | 7% (of completers) |
| Email captures | 200 from soft launch | 1,500 cumulative |
| Shared scenarios viewed by recipients | n/a | 800 |
| Average viewers per shared scenario | n/a | 1.8 (some go viral, most are 1:1) |

These targets are speculative until we have data. Update after the first 30 days of real traffic.

---

*Living document. This calculator is the seed of the entire business — design every detail like it matters, because it does.*
