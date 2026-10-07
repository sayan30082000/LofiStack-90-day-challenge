# Week 14 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 14
Type: section
Component: Before/After Slider
Live: lofistack-90-day-challenge.vercel.app/components/before-after-slider
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/before-after-slider.tsx
Prompt:
Build the "Before/After Slider" component (#62, Type: section) for my LofiStack component gallery.
Route: /components/before-after-slider

What it does:
- Two stacked images; a draggable handle reveals before/after via clip-path.
- Drag the handle or click anywhere to jump.
- Before/After labels that fade near the edges.
- Horizontal or vertical orientation; initial position; fixed aspect ratio.

Props (export an interface named BeforeAfterSliderProps):
before: { src, alt }, after: { src, alt }, initial (default 50), orientation, labels?, aspectRatio

Accessibility:
Handle is role=slider with aria-valuenow and label "Comparison position"; arrow keys move it; both images have alt text.

Demo page shows:
A photo edit, a website redesign (two screenshots), and a vertical example.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/before-after-slider.tsx (split into a folder components/ui/before-after-slider/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/before-after-slider/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "before-after-slider", type "section").

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
Week: 14
Type: input
Component: Date Range Picker
Live: lofistack-90-day-challenge.vercel.app/components/date-range-picker
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/date-range-picker.tsx
Prompt:
Build the "Date Range Picker" component (#68, Type: input) for my LofiStack component gallery.
Route: /components/date-range-picker

What it does:
- Field shows "Mar 4 to Mar 18, 2026" and opens a popover.
- Two months side by side (one on mobile); click start, then end, with hover preview of the range.
- Presets sidebar: Today, Last 7 days, Last 30 days, This month, Last month, Custom.
- minDate, maxDate and an isDateDisabled function; month navigation; Apply / Cancel footer.

Props (export an interface named DateRangePickerProps):
value?: { from, to }, onChange, presets?, minDate, maxDate, isDateDisabled?, numberOfMonths, weekStartsOn, locale

Accessibility:
Calendar is a grid; arrow keys between days, PageUp/PageDown between months; aria-selected; full-date aria-labels.

Demo page shows:
An analytics date filter and a hotel booking picker with past dates disabled.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/date-range-picker.tsx (split into a folder components/ui/date-range-picker/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/date-range-picker/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "date-range-picker", type "input").

Rules:
- TypeScript interfaces for every prop, with short JSDoc comments. No `any`.
- Nothing hardcoded inside the component: text, data, sizes and colors come from props with sensible defaults.
- No UI kits (shadcn, MUI, Radix, Headless UI, etc.). Allowed dependencies: date-fns (optional).
- Fully responsive at 375px, 768px and 1280px; touch targets at least 40px.
- Include every state that applies: hover, active, focus-visible, disabled, loading, error, empty.
- Dark mode via Tailwind dark: variants, WCAG AA contrast in both themes.
- Respect prefers-reduced-motion (motion-safe: / motion-reduce:).
- The accessibility points above are required, not optional.
- Complete files only, no placeholders or TODOs. After the code, list 5 quick manual checks I can do to test it.
````
