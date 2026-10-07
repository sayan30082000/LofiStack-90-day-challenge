# Week 07 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 07
Type: modal
Component: Command Palette
Live: lofistack-sayan.netlify.app/components/command-palette
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/command-palette.tsx
Prompt:
Build the "Command Palette" component (#31, Type: modal) for my LofiStack component gallery.
Route: /components/command-palette

What it does:
- Opens with Cmd+K / Ctrl+K and from a trigger button showing the shortcut.
- Fuzzy-filters commands and highlights matched letters.
- Grouped sections (Navigation, Actions, Theme); recent commands shown first.
- Up/Down, Enter runs, Esc closes.
- Nested pages: a command can open a sub-list; Backspace on an empty search goes back.
- Shortcut hints on the right of each row.

Props (export an interface named CommandPaletteProps):
commands: { id, label, group, icon?, shortcut?, keywords?, onRun?, children? }[], open?, onOpenChange, placeholder, hotkey (default 'k')

Accessibility:
Dialog with focus trap; combobox + listbox pattern with aria-activedescendant; focus restored on close.

Demo page shows:
About 12 commands that really change the demo page (toggle theme, scroll to sections, copy link, open a "Change accent color" sub-page).

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/command-palette.tsx (split into a folder components/ui/command-palette/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/command-palette/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "command-palette", type "modal").

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
Week: 07
Type: section
Component: Logo Marquee
Live: lofistack-sayan.netlify.app/components/logo-marquee
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/logo-marquee.tsx
Prompt:
Build the "Logo Marquee" component (#60, Type: section) for my LofiStack component gallery.
Route: /components/logo-marquee

What it does:
- Infinite horizontal scroll by duplicating the content and animating with CSS keyframes.
- Speed and direction props; pause on hover.
- Edge fade masks; grayscale to color on hover.
- Optional second row moving the opposite way; vertical variant.

Props (export an interface named LogoMarqueeProps):
items: { src?, alt, href?, node? }[], speed (seconds per loop), direction: 'left' | 'right' | 'up' | 'down', pauseOnHover, fade, gap, rows?

Accessibility:
Duplicate set is aria-hidden; with reduced motion the animation stops and items wrap into a static grid.

Demo page shows:
"Trusted by" logos (generate simple wordmark SVGs) and a two-row tech stack marquee.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/logo-marquee.tsx (split into a folder components/ui/logo-marquee/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/logo-marquee/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "logo-marquee", type "section").

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
