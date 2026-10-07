# Week 08 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 08
Type: form
Component: Multi-Step Form Wizard
Live: lofistack-sayan.netlify.app/components/multi-step-form
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/multi-step-form.tsx
Prompt:
Build the "Multi-Step Form Wizard" component (#17, Type: form) for my LofiStack component gallery.
Route: /components/multi-step-form

What it does:
- Steps defined as config; each step renders its fields through a render function (values, setValue, errors).
- Progress header: "Step 2 of 4", progress bar, completed steps are clickable.
- Next runs that step's validate(); Back keeps data.
- Optional review step summarizing all values with "Edit" links that jump to a step.
- Async submit with loading, then a success screen. Steps slide between each other.

Props (export an interface named MultiStepFormProps):
steps: { id, title, description?, render, validate? }[], initialValues, onSubmit(values): Promise<void>, showReview

Accessibility:
Focus moves to the new step heading on change; errors linked to their fields; progress uses aria-current="step".

Demo page shows:
"Create workspace": Account (name, email) → Workspace (name, team size select) → Plan (radio cards) → Review.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/multi-step-form.tsx (split into a folder components/ui/multi-step-form/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/multi-step-form/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "multi-step-form", type "form").

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
Week: 08
Type: chart
Component: Donut Chart
Live: lofistack-sayan.netlify.app/components/donut-chart
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/donut-chart.tsx
Prompt:
Build the "Donut Chart" component (#64, Type: chart) for my LofiStack component gallery.
Route: /components/donut-chart

What it does:
- Arcs computed by a small util from data segments, with small gaps between them.
- Hover/focus pushes a segment outward and dims the others.
- Center shows the total, or the hovered segment's value and percent.
- Legend with values and percentages; clicking a legend item hides/shows its segment and re-animates.
- Mount animation; responsive viewBox. No chart library.

Props (export an interface named DonutChartProps):
data: { label, value, color? }[], size, thickness, format?, centerLabel?, showLegend, legendPosition: 'right' | 'bottom'

Accessibility:
role=img with a summary plus an sr-only table of values; legend buttons use aria-pressed.

Demo page shows:
A monthly expense breakdown and a traffic sources chart.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/donut-chart.tsx (split into a folder components/ui/donut-chart/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/donut-chart/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "donut-chart", type "chart").

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
