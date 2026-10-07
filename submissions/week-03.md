# Week 03 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 03
Type: navbar
Component: Animated Tabs
Live: lofistack-sayan.netlify.app/components/animated-tabs
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/animated-tabs.tsx
Prompt:
Build the "Animated Tabs" component (#40, Type: navbar) for my LofiStack component gallery.
Route: /components/animated-tabs

What it does:
- Tabs that react to what you're ABOUT to do, not just what you clicked.
- Magnetic indicator (magnet, default 0.3): while the mouse is over another tab, the underline or pill stretches its far edge 30% of the way toward it, previewing the move; it snaps back when the pointer leaves the list. Off with reduced motion. The indicator also moves with a leading edge faster than the trailing one when the selection changes.
- Prefetch on intent (onIntent(id)): fires when the mouse rests on a tab for intentDelay (80ms, so quick passes don't count), when keyboard focus lands on a tab, or on touch. intentOnce (default true) reports each tab once. Use it to start loading the panel's data so the click opens instantly.
- Deep links (hashSync: boolean | prefix): the open tab is written to the URL hash with history.replaceState (no extra history entries); a hash naming an enabled tab opens it on load, from links and on hashchange (back/forward), and is reported through onChange once. Read the hash with useSyncExternalStore so server and client markup match. A string prefixes the hash so several tab sets can share a page.
- Everything a solid tab set needs too: underline or pill variant, panels that slide in from the side you moved to, controlled and uncontrolled, icon and badge (with screen reader badgeLabel) per tab, disabled tabs, overflow scrolling with fade edges that keeps the active tab in view, vertical orientation, auto or manual activation, keepMounted panels.

Props (export an interface named AnimatedTabsProps):
tabs: { id, label, icon?, badge?, badgeLabel?, content, disabled? }[], value?, defaultValue, onChange, variant: 'underline' | 'pill', orientation, activation: 'auto' | 'manual', label, fullWidth, keepMounted, emptyText, magnet, onIntent, intentDelay, intentOnce, hashSync, className, listClassName, panelClassName

Accessibility:
WAI-ARIA tabs: tablist / tab / tabpanel, aria-selected, aria-controls, aria-orientation, roving tabindex, arrows + Home/End skipping disabled tabs. onIntent also fires for keyboard focus and touch so prefetching helps everyone; the magnetic lean never moves focus or selection.

Demo page shows:
1) A project dashboard (Overview, Activity, Deploys, Security) with simulated 900ms fetches: hover to prefetch (with a network log and ✓ badges), a toggle to turn prefetching off and feel the difference, and a #project-deploys link showing the deep link. 2) Account settings tabs with icons and a live badge. 3) A pill variant with counts and a disabled tab. 4) A vertical variant with manual activation.

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
Live: lofistack-sayan.netlify.app/components/skeleton
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/skeleton.tsx
Prompt:
Build the "Skeleton Loader Kit" component (#51, Type: loader) for my LofiStack component gallery.
Route: /components/skeleton

What it does:
- Skeletons that remember the real shape of your content instead of guessing it.
- Shape memory (SkeletonWrapper rememberKey): after content has loaded, measure it with an exported measureSkeletonLayout(el): one block per line of text (Range.getClientRects, drawn at 70% of the line height, centred), one solid block per img/svg/video/canvas/input/button/[data-skeleton-block], round painted elements (avatars) as circles, bordered surfaces (cards) as outlines (border width > 0, since a 1px border can read as 0.8px on zoomed screens). Store x and w as fractions of the width so the shape survives resizes; merge inline pieces of one line into one bar; cap at maxBlocks. Save in memory and localStorage (persistShape), read only after hydration, measure with setTimeout (not requestAnimationFrame, which never fires in a background tab). Next load draws the shape with SkeletonFromLayout instead of the fallback. forgetSkeletonLayout(key) and onMeasure(layout) too.
- Still loading: after slowAfter (4000ms) show and announce "Still loading… thanks for waiting." inside the status container. null turns it off.
- The full kit too: Skeleton (rect), SkeletonText (n lines, the last shorter, varied widths), SkeletonCircle; shimmer (one viewport-fixed gradient so every skeleton on the page shines in sync), pulse or none; presets for card, list item, table row and profile; a wrapper that fades the children in and announces "Content loaded".

Props (export an interface named SkeletonProps):
Skeleton: width, height, radius, animation: 'shimmer' | 'pulse' | 'none'. SkeletonText: lines, gap, lineHeight, lastLineWidth, widths. SkeletonWrapper: loading, fallback, children, rememberKey, persistShape, onMeasure, slowAfter, slowText, label, loadedText, animation, fadeDuration. measureSkeletonLayout(el, { maxBlocks, minSize }). SkeletonFromLayout: layout, animation

Accessibility:
Loading container is role=status with aria-busy="true" and aria-label "Loading content"; every skeleton shape (including remembered ones) is aria-hidden; "Content loaded" and the slow message are announced politely; shimmer and pulse stop with reduced motion.

Demo page shows:
1) A feed of 3 posts: the first load uses a hand-made skeleton, then the real posts are measured and every later load draws their exact shape (block count shown, Forget shape button), with shimmer / pulse / none. 2) The four presets. 3) The primitives and animations.

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
