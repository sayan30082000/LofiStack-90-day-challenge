# Week 03 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 03
Type: navbar
Component: Animated Tabs
Live: lofistack-90-day-challenge.vercel.app/components/animated-tabs
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/animated-tabs.tsx
Prompt:
Build the "Animated Tabs" component (#40, Type: navbar) for my LofiStack component gallery.
Route: /components/animated-tabs

What it does:
- Underline or pill indicator that slides and resizes to the active tab.
- Panels fade between each other.
- Controlled and uncontrolled; icon and count badge per tab; disabled tabs.
- Overflow scrolls with fade edges on mobile; vertical orientation option.

Props (export an interface named AnimatedTabsProps):
tabs: { id, label, icon?, badge?, content, disabled? }[], value?, defaultValue, onChange, variant: 'underline' | 'pill', orientation, activation: 'auto' | 'manual'

Accessibility:
WAI-ARIA tabs: tablist / tab / tabpanel, aria-selected, aria-controls, roving tabindex, arrows + Home/End.

Demo page shows:
Account settings tabs (Profile, Security, Notifications with badge 3, Billing), a pill variant, and a vertical variant.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/animated-tabs.tsx (split into a folder components/ui/animated-tabs/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/animated-tabs/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "animated-tabs", type "navbar").

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
Week: 03
Type: loader
Component: Skeleton Loader Kit
Live: lofistack-90-day-challenge.vercel.app/components/skeleton
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/skeleton.tsx
Prompt:
Build the "Skeleton Loader Kit" component (#51, Type: loader) for my LofiStack component gallery.
Route: /components/skeleton

What it does:
- Primitives: Skeleton (rect), SkeletonText (n lines, last one shorter), SkeletonCircle.
- Shimmer or pulse animation, or none.
- Presets: card, list item, table row, profile.
- A wrapper that shows the skeleton while loading and fades in the children after.

Props (export an interface named SkeletonProps):
Skeleton: width, height, radius, animation: 'shimmer' | 'pulse' | 'none'. SkeletonText: lines, gap. SkeletonWrapper: loading, fallback, children

Accessibility:
Container has aria-busy="true" and aria-label "Loading content"; skeleton shapes aria-hidden; static with reduced motion.

Demo page shows:
A toggle that switches a feed of 3 posts between loading and loaded.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/skeleton.tsx (split into a folder components/ui/skeleton/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/skeleton/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "skeleton", type "loader").

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
