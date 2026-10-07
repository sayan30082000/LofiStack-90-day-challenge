# Week 15 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 15
Type: card
Component: KPI Stat Card
Live: lofistack-sayan.netlify.app/components/kpi-card
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/kpi-card.tsx
Prompt:
Build the "KPI Stat Card" component (#27, Type: card) for my LofiStack component gallery.
Route: /components/kpi-card

What it does:
- Label, big value that counts up on mount (requestAnimationFrame) formatted with Intl.
- Delta vs previous value (+12.4% green up / red down), with invertTrend for metrics where down is good.
- Inline SVG sparkline with area fill and an emphasized last point.
- Period caption, optional icon, loading skeleton state.

Props (export an interface named KpiCardProps):
label, value: number, format?: 'number' | 'currency' | 'percent' | 'compact', currency?, previousValue?, invertTrend, trend?: number[], period, icon?, loading

Accessibility:
Sparkline aria-hidden with an sr-only summary ("Up 12% from last month"); delta conveyed by text, not only color.

Demo page shows:
A dashboard row: Revenue, Active users, Churn rate (inverted), Avg response time, plus a toggle for the loading state.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/kpi-card.tsx (split into a folder components/ui/kpi-card/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/kpi-card/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "kpi-card", type "card").

Rules:
- TypeScript interfaces for every prop, with short JSDoc comments. No `any`.
- Nothing hardcoded inside the component: text, data, sizes and colors come from props with sensible defaults.
- No UI kits (shadcn, MUI, Radix, Headless UI, etc.). Allowed dependencies: none beyond the project's existing ones.
- Fully responsive at 375px, 768px and 1280px; touch targets at least 40px.
- Include every state that applies: hover, active, focus-visible, disabled, loading, error, empty.
- Dark mode via Tailwind dark: variants, WCAG AA contrast in both themes.
- Respect prefers-reduced-motion (motion-safe: / motion-reduce:).
- The accessibility points above are required, not optional.
- Complete files only, no placeholders or TODOs. After the code, list 5 quick manual checks I can do to test it.
````

## Post 2

````text
Week: 15
Type: modal
Component: Onboarding Tour
Live: lofistack-sayan.netlify.app/components/product-tour
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/product-tour.tsx
Prompt:
Build the "Onboarding Tour" component (#36, Type: modal) for my LofiStack component gallery.
Route: /components/product-tour

What it does:
- Steps target elements by CSS selector.
- Spotlight cut-out overlay highlights the target with padding (SVG mask).
- Tooltip beside the target with auto-flip and an arrow.
- Back / Next / Skip, step counter and progress dots.
- Scrolls the target into view and repositions on resize/scroll; onFinish callback.

Props (export an interface named ProductTourProps):
steps: { target: string, title, content, placement? }[], open, onOpenChange, onFinish?, startAt?, spotlightPadding

Accessibility:
Tooltip is a labelled dialog; focus moves into it; Esc skips; Left/Right arrows go back/next.

Demo page shows:
A fake mini dashboard (sidebar, search, "New project" button, chart) with a "Take the tour" button and 4 steps.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/product-tour.tsx (split into a folder components/ui/product-tour/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/product-tour/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "product-tour", type "modal").

Rules:
- TypeScript interfaces for every prop, with short JSDoc comments. No `any`.
- Nothing hardcoded inside the component: text, data, sizes and colors come from props with sensible defaults.
- No UI kits (shadcn, MUI, Radix, Headless UI, etc.). Allowed dependencies: none beyond the project's existing ones.
- Fully responsive at 375px, 768px and 1280px; touch targets at least 40px.
- Include every state that applies: hover, active, focus-visible, disabled, loading, error, empty.
- Dark mode via Tailwind dark: variants, WCAG AA contrast in both themes.
- Respect prefers-reduced-motion (motion-safe: / motion-reduce:).
- The accessibility points above are required, not optional.
- Complete files only, no placeholders or TODOs. After the code, list 5 quick manual checks I can do to test it.
````
