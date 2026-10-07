# Week 05 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 05
Type: input
Component: OTP Input
Live: lofistack-sayan.netlify.app/components/otp-input
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/otp-input.tsx
Prompt:
Build the "OTP Input" component (#7, Type: input) for my LofiStack component gallery.
Route: /components/otp-input

What it does:
- Renders `length` boxes (default 6). Typing auto-advances; Backspace clears and moves back; Left/Right arrows move.
- Pasting a full code into any box fills all boxes.
- Numeric or alphanumeric mode; optional masking (dots).
- onComplete fires when every box is filled.
- Error state (red border + shake + message), success state, disabled state.

Props (export an interface named OtpInputProps):
length, value?, onChange, onComplete, type: 'numeric' | 'alphanumeric', mask, error?: string, success, disabled, autoFocus

Accessibility:
Each box has aria-label "Digit 1 of 6"; inputMode numeric; autocomplete="one-time-code" on the first box; error text linked with aria-describedby.

Demo page shows:
A verify-your-email card where 123456 succeeds and anything else errors (with a "Resend code" link), a 4-digit masked PIN, and a disabled example.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/otp-input.tsx (split into a folder components/ui/otp-input/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/otp-input/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "otp-input", type "input").

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
Week: 05
Type: chart
Component: Activity Heatmap
Live: lofistack-sayan.netlify.app/components/activity-heatmap
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/activity-heatmap.tsx
Prompt:
Build the "Activity Heatmap" component (#63, Type: chart) for my LofiStack component gallery.
Route: /components/activity-heatmap

What it does:
- SVG grid of the last 365 days: weeks as columns, 7 rows.
- 5 intensity levels from thresholds or quantiles.
- Month labels on top, weekday labels on the left, Less to More legend.
- Tooltip: "12 contributions on Mar 4, 2026"; onDayClick.
- Scrolls horizontally on mobile, starting at the latest week; year selector.

Props (export an interface named ActivityHeatmapProps):
data: { date: string, count: number }[], endDate?, levels?, colorScale?, onDayClick?, weekStart: 0 | 1, unit (e.g. 'contributions')

Accessibility:
SVG role=img with a summary; cells optionally focusable with aria-label and arrow-key movement.

Demo page shows:
Seeded random data, the yearly total, and a details panel for the clicked day.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/activity-heatmap.tsx (split into a folder components/ui/activity-heatmap/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/activity-heatmap/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "activity-heatmap", type "chart").

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
