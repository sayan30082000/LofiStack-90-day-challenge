# Week 13 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 13
Type: navbar
Component: Mega Menu Navbar
Live: lofistack-sayan.netlify.app/components/mega-menu-navbar
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/mega-menu-navbar.tsx
Prompt:
Build the "Mega Menu Navbar" component (#38, Type: navbar) for my LofiStack component gallery.
Route: /components/mega-menu-navbar

What it does:
- Sticky header with logo, top-level items and right-side actions.
- Some items open a full-width panel with columns of links (icon, title, description) plus a featured promo card.
- Opens on hover (with a 150ms intent delay) and on click.
- Below 1024px it becomes a hamburger and a full-screen menu with accordions.
- Header gets a blur and shadow after scrolling.

Props (export an interface named MegaMenuNavbarProps):
logo, items: { label, href?, columns?: { title, links: { label, href, description?, icon? }[] }[], featured? }[], actions?: ReactNode, sticky

Accessibility:
Disclosure buttons with aria-expanded; Esc closes and returns focus; arrow keys between top items; mobile menu traps focus.

Demo page shows:
A SaaS header with Products, Solutions, Resources and Pricing, above some page content to scroll.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/mega-menu-navbar.tsx (split into a folder components/ui/mega-menu-navbar/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/mega-menu-navbar/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "mega-menu-navbar", type "navbar").

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
Week: 13
Type: loader
Component: Countdown Timer
Live: lofistack-sayan.netlify.app/components/countdown-timer
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/countdown-timer.tsx
Prompt:
Build the "Countdown Timer" component (#55, Type: loader) for my LofiStack component gallery.
Route: /components/countdown-timer

What it does:
- Counts down to a target date or a duration; recalculates from Date.now() every tick so it never drifts.
- Days / hours / minutes / seconds tiles with a flip animation on change.
- onComplete and a completed-state slot.
- Inline variant (02:14:09) and minimal variant; pause/resume in duration mode; hide days when zero.

Props (export an interface named CountdownTimerProps):
target?: Date | string, duration?: number (seconds), onComplete?, variant: 'flip' | 'inline' | 'minimal', labels?, autoStart, showDays

Accessibility:
role=timer; not announced every second; an sr-only summary updates each minute; no flip with reduced motion.

Demo page shows:
A product launch countdown to a date, a 10-second timer with a completion state, and a "Resend code in 0:30" inline timer.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/countdown-timer.tsx (split into a folder components/ui/countdown-timer/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/countdown-timer/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "countdown-timer", type "loader").

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
