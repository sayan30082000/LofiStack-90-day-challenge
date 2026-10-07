# Week 10 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 10
Type: modal
Component: Toast System
Live: lofistack-90-day-challenge.vercel.app/components/toast
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/toast.tsx
Prompt:
Build the "Toast System" component (#35, Type: modal) for my LofiStack component gallery.
Route: /components/toast

What it does:
- <Toaster /> provider plus an imperative toast() API: toast.success, error, info, loading, promise(p, { loading, success, error }).
- Stacks up to `max` visible; older ones compress behind and expand on hover.
- Auto-dismiss with a progress bar that pauses on hover/focus.
- Swipe to dismiss; optional action button (Undo).
- 6 positions.

Props (export an interface named ToastProps):
Toaster: position, max, duration. toast(message, { description, action: { label, onClick }, duration, id })

Accessibility:
Region with aria-live polite (assertive for errors); labelled dismiss buttons; F8 moves focus to the toast region.

Demo page shows:
Buttons for each toast type, a promise toast, an "Email archived / Undo" toast, and a position switcher.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/toast.tsx (split into a folder components/ui/toast/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/toast/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "toast", type "modal").

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
Week: 10
Type: navbar
Component: Breadcrumbs
Live: lofistack-90-day-challenge.vercel.app/components/breadcrumbs
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/breadcrumbs.tsx
Prompt:
Build the "Breadcrumbs" component (#42, Type: navbar) for my LofiStack component gallery.
Route: /components/breadcrumbs

What it does:
- Items with custom separators (chevron or slash).
- When items exceed maxItems, the middle collapses into a "..." button that opens a dropdown of hidden items.
- Last item is the current page (not a link); long labels truncate with a tooltip.
- Optional home icon on the first item.
- On mobile, optional compact "← Parent" back link.

Props (export an interface named BreadcrumbsProps):
items: { label, href?, icon? }[], maxItems (default 4), separator?, itemsBeforeCollapse (1), itemsAfterCollapse (2), renderLink? (for next/link)

Accessibility:
nav aria-label="Breadcrumb" with an ol; aria-current="page"; the "..." button reads "Show 3 more".

Demo page shows:
A deep file path, a short path, and a custom separator example.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/breadcrumbs.tsx (split into a folder components/ui/breadcrumbs/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/breadcrumbs/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "breadcrumbs", type "navbar").

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
