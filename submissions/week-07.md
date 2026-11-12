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
- A complete command palette: opens with Cmd+K / Ctrl+K and a trigger button showing the shortcut; fuzzy search with highlighted letters; grouped sections; recent commands first; Up/Down, Enter, Esc; nested pages (children) with Backspace on an empty search to go back; shortcut hints; disabled commands; async commands with a spinner and inline error; a polished highlight that glides between rows.
- Commands that take a value: CommandItem.arg is { kind: "choice", options: { value, label, keywords?, icon? }[] } | { kind: "number", min?, max?, unit? } | { kind: "text", validate? }, and onRun(value) receives it. Exported pure matchWithArgument(cmd, query) splits a search like "accent pink" or "font 125%" into leading words that appear in the label or a keyword and a valid value (choices match label, value or keywords, so "pink" picks Rose). Such matches are listed first under "Run with this value" with the value as a chip.
- Choosing a command that needs a value without typing one opens a value step: a chip with the command name, the choices to pick from (fuzzy filtered) or a number/text box. Exported pure parseArgument(arg, text) validates it and its message is shown as the empty state ("Enter a number from 80 to 150%", "No color matches “xyz”"). Backspace on an empty value goes back and restores the search.
- Learning (learn, default on): each run records which command was picked for which search (exported pure rememberRun, last 100 searches). learnedBoost(memory, query, id) adds 40 per pick of the exact search and 20 per pick of a longer or shorter version ("th" and "the" help each other), capped at 160, so a command you always pick for "t" moves to the top and shows a "Your usual pick" badge. Stored in localStorage under storageKey (null = this page view only), wrapped in try/catch.
- Shortcut coaching (tipAfter, default 3): once a command that has a shortcut has been run from the palette 3 times, the next opening shows a one-time note "You've run “Toggle dark mode” from here 3 times. Next time, press ⇧ D" with a Got it button.

Props (export an interface named CommandPaletteProps):
commands: { id, label, group, icon?, description?, shortcut?, keywords?, onRun?(value), arg?, children?, disabled?, keepOpen? }[], open? / defaultOpen / onOpenChange, placeholder, hotkey ('k', null = off), showTrigger, triggerLabel, label, recentLabel, maxRecent, defaultRecent, loading, loadingText, emptyText, backLabel, closeLabel, showFooter, portal, learn, tipAfter, storageKey, quickRunLabel, learnedLabel, tipText, tipDismissLabel

Accessibility:
Dialog with aria-modal and a focus trap, focus restored on close; combobox + listbox with aria-activedescendant; labelled role=group sections; in the value step the combobox is renamed ("Zoom text: zoom level") and number values use inputMode=decimal; the result count, empty or error message and the tip sentence are announced in a polite status region; the tip has a real dismiss button; motion removed with prefers-reduced-motion.

Demo page shows:
1) A docs page whose palette really changes it: "accent pink" (choice with keywords), "zoom 125" (number 80–150%), "rename Hello" (validated text), toggle theme with a working ⇧D shortcut, scroll to sections, copy links, a failing and a disabled command. 2) A project switcher with a different hotkey, skeleton loading and storageKey={null}.

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
- Seamless infinite marquee: the set is rendered twice and shifted by one set width with CSS keyframes; direction left/right/up/down; several rows (columns when vertical) with every other one reversed; edge fade masks; grayscale until hover/focus; pause on hover and while a link has focus; a 40px pause/play button; title or label names the region.
- Optical sizing (normalize, default on): when an image logo loads it is drawn on a small canvas and exported pure analyzeLogoPixels(rgba, w, h) finds its ink box (background = transparency or the corner color) and density. Exported pure opticalLogoHeight(inkAspect, density, logoHeight) gives the ink height: scaled by 1/√aspect relative to a 3:1 wordmark (clamped 0.5–1.6×), nudged by density (heavy logos smaller, thin ones larger), and very long wordmarks capped at 7× logoHeight wide but never thinner than 0.42×. The image is sized so its ink gets that height, with negative margins that cancel the file's empty padding. Cross-origin images that can't be read fall back to their outer shape. Measuring also happens on mount for images loaded before hydration.
- Even speed: pxPerSecond (default 40) sets each row's loop duration from its measured length (ResizeObserver), so rows with different numbers of logos move at the same speed; speed (seconds per loop) is still accepted.
- Drag to scrub (draggable, default on): grab a row and drag it; the row's CSS animations are paused and their currentTime moved by the drag distance, then they resume from there. touch-action keeps page scrolling on the other axis, and a drag that ends on a link doesn't open it.

Props (export an interface named LogoMarqueeProps):
items: { src?, srcDark?, alt, href?, node? }[], pxPerSecond, speed?, direction: 'left' | 'right' | 'up' | 'down', pauseOnHover, draggable, fade, fadeSize, gap, rows, grayscale, logoHeight, normalize, height, title, label, showControls, pauseLabel, playLabel, className, itemClassName

Accessibility:
The duplicate set is aria-hidden and inert; a pause/play button covers WCAG 2.2.2 and dragging is never the only way to control it; with reduced motion the animation stops and logos wrap into a static grid; image logos need alt text; no opacity on the grayscale state.

Demo page shows:
1) Six fictional logos with very different shapes (square icon, 11:1 thin wordmark, heavy block, a file with lots of empty padding, thin outline mark, tall stacked logo) with an Optical sizing switch to compare. 2) "Trusted by" wordmarks with light and dark versions. 3) A two-row tech stack of custom nodes. 4) A vertical two-column marquee.

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
