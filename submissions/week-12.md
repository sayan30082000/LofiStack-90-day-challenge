# Week 12 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 12
Type: input
Component: Dual Range Slider
Live: lofistack-90-day-challenge.vercel.app/components/range-slider
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/range-slider.tsx
Prompt:
Build the "Dual Range Slider" component (#10, Type: input) for my LofiStack component gallery.
Route: /components/range-slider

What it does:
- Two thumbs on one track with the selected range highlighted; thumbs cannot cross (minGap).
- Pointer drag with pointer capture; clicking the track moves the nearest thumb.
- Step support, value tooltips while dragging, formatValue for display.
- Optional number inputs synced both ways.
- Optional histogram (array of bar heights) drawn above the track; bars inside the range are highlighted.

Props (export an interface named RangeSliderProps):
min, max, step, value?: [number, number], defaultValue, onChange, onChangeEnd, minGap, formatValue?: (n) => string, showInputs, histogram?: number[], disabled

Accessibility:
Each thumb is role=slider with aria-valuemin/max/now/valuetext; arrows step, PageUp/PageDown move 10 steps, Home/End jump to limits.

Demo page shows:
$0 to $1000 price filter with histogram and inputs, an age range 18 to 65, and a time-of-day range formatted as 9:00 AM.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/range-slider.tsx (split into a folder components/ui/range-slider/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/range-slider/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "range-slider", type "input").

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
Week: 12
Type: section
Component: Vertical Timeline
Live: lofistack-90-day-challenge.vercel.app/components/timeline
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/timeline.tsx
Prompt:
Build the "Vertical Timeline" component (#61, Type: section) for my LofiStack component gallery.
Route: /components/timeline

What it does:
- Events with date, title, description, icon and optional tag.
- Center line with alternating left/right cards on desktop; single left line on mobile.
- The line fills with progress as you scroll.
- Items animate in from a visible resting state; highlighted milestone items.

Props (export an interface named TimelineProps):
items: { id, date, title, description, icon?, tag?, highlight? }[], alternate, animateOnScroll

Accessibility:
ol list; <time dateTime>; no scroll animation with reduced motion.

Demo page shows:
A company history from 2019 to 2026.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/timeline.tsx (split into a folder components/ui/timeline/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/timeline/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "timeline", type "section").

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
