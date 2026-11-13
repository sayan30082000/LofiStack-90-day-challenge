# Week 09: React UI library research

**Agent log, researched 13 November 2026.** This compares shadcn/ui, Mantine, Chakra UI and Headless UI using their own docs, GitHub repos, the npm registry and the bundlephobia API. Anything I couldn't confirm from a page I read is marked **not verified**.

---

## Comparison at a glance

| Library | Styling | Accessibility | Theming | Install / bundle |
|---|---|---|---|---|
| **shadcn/ui** | Copy-in source code ("hands you the actual component code"), added with the `shadcn` CLI and styled with Tailwind utility classes. The theming page's `@import "tailwindcss"` and `@theme inline` setup implies Tailwind v4; the page doesn't name the version. | Built on a primitive library you pick at init. **Base UI** has been the default since July 2026, **React Aria** was added as a first-class base in July 2026, and **Radix** "remains fully supported". The Accordion page says it "adheres to the WAI-ARIA design pattern". | CSS variables in `oklch()`: semantic pairs such as `background`/`foreground` and `primary`/`primary-foreground`, plus `chart-*`, `sidebar-*` and a single `--radius`. Dark mode overrides the same tokens under `.dark`. The CLI also has presets and eight named styles. | No runtime UI package. Source files are written into your project, so the cost is whatever you add plus the chosen primitive library. The CLI is `shadcn@4.23.0` on npm. There's no package-level size number, and per-component cost is **not verified**. |
| **Mantine** | Ships pre-built CSS (`@mantine/core/styles.css` or per-component CSS) and uses CSS modules internally. Projects are encouraged, not required, to use CSS modules, with PostCSS via `postcss-preset-mantine`. The Styles API (`classNames`) targets inner parts. | Mantine's own implementation. Its help page says components "follow WAI-ARIA accessibility guidelines", are tested with jest-axe and unit tests, and are checked manually with VoiceOver. No third-party a11y primitive is named. `@floating-ui/react` is an npm dependency, presumably for positioning. | A `createTheme` override passed to `MantineProvider` and deep-merged with the defaults. Tokens cover colors (10-shade arrays), `primaryColor`, spacing, radius, fontSizes and breakpoints, and are exposed as `--mantine-*` CSS variables. Dark mode uses `defaultColorScheme` (light, dark or auto), the `data-mantine-color-scheme` attribute, localStorage persistence and `ColorSchemeScript` for SSR. | npm packages. `@mantine/core@9.8.0` measures **637,974 B minified / 191,220 B gzip** for the whole package on bundlephobia, with 5 dependencies and ESM. `sideEffects: ["*.css"]`, so the JS is tree-shakeable. CSS is extra, and tree-shaken real-app size is **not verified**. Requires React 19.2+. |
| **Chakra UI** | CSS-in-JS with style props. The installation page says "Today, Chakra UI uses Emotion at runtime", with a long-term plan to move to a zero-runtime model inspired by Panda CSS. Variants are defined as **recipes** (`cva`) and **slot recipes** (`sva`). Optional CLI "snippets" copy pre-composed wrappers into `components/ui`. | v3 "is a composition of two projects… Ark UI and Zag.js": Zag supplies state-machine logic, and Ark turns it into headless components. The contributing guide says logic and a11y bugs are "most likely a bug in Zag.js". | `createSystem(defaultConfig, defineConfig({...}))`. Raw tokens and semantic tokens become `--chakra-*` CSS variables, with optional `strictTokens` and the `typegen` CLI for type safety. Dark mode uses `next-themes` through a `ColorModeProvider` snippet, the `_dark` condition and semantic tokens. | npm package. `@chakra-ui/react@3.38.0` plus the `@emotion/react` peer. Bundlephobia measures **1,218,382 B minified / 330,721 B gzip** for the whole package (Emotion peer not included), with 7 dependencies and `sideEffects: false`. The v3 announcement says it reduces bundle size but gives no figures. Tree-shaken size is **not verified**. |
| **Headless UI** | Completely unstyled. You style it yourself, usually with Tailwind. State is exposed as `data-*` attributes (`data-open`, `data-focus`, `data-hover`, `data-active`, `data-disabled`, `data-checked`) and render props. Transitions are built in. | Tailwind Labs' own components. The homepage says they are "fully accessible". Each component page has a keyboard table (for example, Menu supports arrows, Home/End, Esc and typeahead). v2 uses **React Aria** hooks for hover, focus and press detection, and **Floating UI** for anchor positioning. | None built in, since there are no tokens. You theme through your own Tailwind or CSS. Anchor spacing is set with the `--anchor-gap`, `--anchor-offset` and `--anchor-padding` CSS variables. | npm package. `@headlessui/react@2.2.10` measures **209,422 B minified / 62,986 B gzip** for the whole package on bundlephobia, with 5 dependencies (`@floating-ui/react`, `@react-aria/focus`, `@react-aria/interactions`, `@tanstack/react-virtual`, `use-sync-external-store`), ESM and `sideEffects: false`. |

> **About the size numbers:** Bundlephobia measures the *whole* package's entry point (with its dependencies, minified). Apps that import only a few components and tree-shake will ship less. None of the four libraries' docs give official per-component sizes.

---

## shadcn/ui

- **What it is:** "This is not a component library. It is how you build your component library." It's a code-distribution system: a flat-file registry schema plus a CLI. `shadcn add accordion` writes the component source into your project, and from then on you own and edit it. The CLI's `--diff` flag merges registry updates with your local changes.
- **Styling:** Tailwind classes inside the copied files. Theming uses CSS variables (`--primary: oklch(0.205 0 0)`), mapped to Tailwind utilities with `@theme inline`. `init --no-css-variables` switches to inline color utilities instead.
- **Accessibility base:** You choose it with `init --base`. Base UI has been the default since July 2026 (the changelog cites Base UI 1.6.0 and more than 6M weekly downloads). React Aria is selected with `--base aria`, and Radix with `-b radix`. Component docs have Base UI, React Aria and Radix tabs. Radix is not deprecated, and new components ship for the bases where possible.
- **Theming:** Uses semantic token pairs, a `--radius` scale and `.dark` overrides. CLI v4 (March 2026) added presets (`init --preset` sets colors, theme, icons, fonts and radius) and `shadcn/create`. There are eight named styles: Vega, Nova, Maia, Lyra, Mira, Luma, Rhea and Sera.
- **Install/bundle:** Run `pnpm dlx shadcn@latest init -t next|vite|start|react-router|astro`. There's no UI runtime package to measure. You ship the code you add plus its primitive library. Since September 2026, `cn` lives in its own package. Primitive-library sizes are **not verified** (I didn't fetch bundlephobia for Base UI, React Aria or Radix).
- **Catalogue:** 66 components on the components page, plus an AI Elements section. The full AI Elements list is **not verified**.
- **3 strong components:**
  1. **Sidebar:** fully composable parts, `offcanvas`/`icon`/`none` collapse modes, Cmd/Ctrl+B toggle, an automatic sheet on mobile, and its own `--sidebar-*` tokens.
  2. **Chart:** a Recharts v3 wrapper with a shared `ChartConfig`, token-driven light and dark colors, and an `accessibilityLayer` prop that adds keyboard and screen-reader support.
  3. **Accordion:** one API across three primitive bases (Base UI, React Aria, Radix), following the WAI-ARIA pattern. This is the clearest example of shadcn's "pick your base" model.
- **Current version:** CLI `shadcn@4.23.0`. GitHub marks it "Latest", released 27 Oct (no year shown), and npm `latest` is also 4.23.0. CLI major v4 dates from March 2026. The docs pages show no page dates. The changelog's newest entry is "October 2026".

## Mantine

- **Styling:** All components use CSS modules internally. "CSS modules are the recommended way of styling Mantine components", but Emotion, styled-components, utility CSS and global CSS also work. Inner parts are styled with `classNames`. CSS is imported globally or per component.
- **Accessibility:** Its own implementation. The FAQ claims WAI-ARIA roles and attributes, "full keyboard support", focus management, jest-axe tests, "more than 10,000 unit tests" and manual VoiceOver checks. The docs name no headless primitive library. `mantine.dev/guides/accessibility/` returned 404.
- **Theming:** One theme object holds colors, `primaryColor`, `primaryShade` (`{ light: 6, dark: 8 }`), spacing, radius and breakpoints. It's deep-merged through `MantineProvider`, and everything is exposed as CSS variables. Color schemes are light, dark or auto, persisted in localStorage, with `ColorSchemeScript` to avoid a flash on SSR. In v9, `defaultRadius` changed to `md` and the medium font weight to 600.
- **Install/bundle:** Modular npm packages: `@mantine/core`, `hooks`, `form`, `dates`, `charts`, `notifications`, `spotlight`, `schedule` and others. Bundlephobia measures the whole of `@mantine/core@9.8.0` at 191,220 B gzip. Its npm `sideEffects` is `["*.css"]`. Requires React 19.2+ as of v9. A bundle-size help page I tried returned 404, so official guidance is **not verified**.
- **Catalogue:** Very broad, with well over 100 core components in the llms.txt list, plus Dates, 22 chart types, Schedule, CodeHighlight/Diff/JsonViewer, an Emoji picker and extensions.
- **3 strong components:**
  1. **Schedule (`@mantine/schedule`, new in 9.0):** day, week, month, year and mobile views with drag-and-drop event rescheduling. None of the other three ship a calendar scheduler.
  2. **Tour:** a guided step-by-step mode *and* a "beacon" mode where pulsing beacons can be opened in any order, with keyboard navigation and compound parts.
  3. **Combobox:** a low-level building block behind Select, MultiSelect and TagsInput, with virtualization added in 9.0 for large option lists.
- **Current version:** **9.8.0**, released November 10, 2026, per the previous-versions changelog page. 9.0.0 was released March 31, 2026.

## Chakra UI

- **Styling:** Style props and recipes, running on Emotion at runtime. v3 replaced theme functions with Panda-inspired recipes to avoid runtime function calls. The announcement says Panda isn't used internally and Emotion is kept "to preserve the dynamic styling benefits". `framer-motion` was removed in favor of CSS animations. Optional snippets (`@chakra-ui/cli`) copy v2-style composed wrappers into `components/ui`.
- **Accessibility:** Delegated to Ark UI (headless components) and Zag.js (state machines). The repo describes "accessible React components". Component pages I read (Color Picker, File Upload) don't document keyboard tables, so per-component keyboard behavior is **not verified** from Chakra's own pages.
- **Theming:** `defineConfig` (with `theme`, `conditions`, `globalCss`, `cssVarsPrefix`, `strictTokens`) feeds `createSystem`, which is passed to `ChakraProvider`. Semantic tokens always resolve to CSS variables. Each color palette gets 7 semantic tokens, and `colorPalette` swaps them. Dark mode runs through next-themes.
- **Install/bundle:** `npm i @chakra-ui/react @emotion/react`, on Node 20+. Bundlephobia measures `@chakra-ui/react@3.38.0` at 330,721 B gzip, the heaviest of the four as a whole package, and its dependencies include `@ark-ui/react` 5.40.0. The v3 announcement claims a smaller bundle but gives no numbers.
- **Catalogue:** Over 100 entries on the components index, including layout primitives (Box, Flex, Stack and so on).
- **3 strong components:**
  1. **Color Picker:** composable parts with an eyedropper, swatches, a channel-format select, and hex, rgb(a) and CSS output.
  2. **File Upload:** dropzone plus file list with `accept`, `maxFiles`, min and max size, custom `validate`, directory selection (WebKit only) and camera `capture`.
  3. **Floating Panel:** a draggable, resizable panel with minimize and maximize stages, boundary limits, Escape to close and focus restore. Rare among component libraries.
- **Current version:** **3.38.0**, shown in the docs header and as npm `latest`. No release date is shown, and the GitHub releases section was empty, so the release date is **not verified**. v3 was announced October 22, 2024.

## Headless UI

- **Styling:** Fully unstyled, made by Tailwind Labs, and the homepage positions it as designed to work with Tailwind CSS. You style it with Tailwind data-attribute variants (for example, `data-focus:bg-blue-100`), plain CSS attribute selectors or render props. The `transition` prop exposes `data-closed`, `data-enter` and `data-leave`.
- **Accessibility:** Its own components, with documented keyboard tables. v2 (May 7, 2024) added React Aria hooks for consistent hover, focus and active detection, Floating UI anchor positioning, and form components that wire up IDs and `aria-*` attributes automatically. Menu's `modal` mode (the default) adds scroll locking, a focus trap and `inert` on the rest of the page.
- **Theming:** None. There are no tokens and no dark-mode system, which is by design. You bring your own.
- **Install/bundle:** `npm install @headlessui/react`. Bundlephobia measures 62,986 B gzip for the whole package, the smallest npm footprint of the three npm libraries. Peers are React 18 or 19.
- **Catalogue:** 16 components: Menu, Disclosure, Dialog, Popover, Tabs, Transition, Button, Checkbox, Combobox, Fieldset, Input, Listbox, Radio Group, Select, Switch and Textarea. The Vue version is still v1.
- **3 strong components:**
  1. **Menu (Dropdown):** the full keyboard model (arrows, Home/End, PageUp/PageDown, Esc, typeahead), grouping semantics, and anchor positioning with CSS-variable gaps.
  2. **Combobox:** anchor positioning plus built-in TanStack Virtual support through a `virtual` prop for very large lists.
  3. **Field / Fieldset:** automatic label, description and `aria-*` wiring, with disabled state cascading like a native `<fieldset>`.
- **Current version:** **2.2.10**. It's the npm `latest`, and GitHub marks it "Latest", dated "07 Apr" with no year shown, so the year is **not verified**. The website's version switcher shows "v2.1", which doesn't match npm. The site footer reads "© 2026 Tailwind Labs Inc."

---

## 5 component ideas none of the four offer

I checked each idea against: the shadcn/ui components page (66 items, plus the visible part of the Blocks page), Mantine's `llms.txt` component index (core, dates, charts, schedule, code-highlight, emoji and extensions), the Chakra UI components index, and Headless UI's 16 components. None of the ideas is on, or a close variation of, the project's existing or planned list.

### 1. Query Builder (type: **form**)
A visual "filter rules" editor where users add conditions (field, operator, value) and nest them into AND/OR groups. It exports the result as JSON or a query string that a back end can run.
- **Why it's useful:** Admin panels, CRMs and analytics views all need saved, shareable filters, and users can't build `(status = active AND plan = pro) OR country = BD` with a single search box.
- **Closest:** **Mantine** comes nearest, with Combobox, Select, MultiSelect, Cascader, Fieldset and `use-form` as building blocks. Chakra (Combobox, Select, Tags Input, Fieldset), Headless UI (Combobox, Listbox, Fieldset) and shadcn (Combobox, Field, Button Group) have similar pieces. **What they lack:** no rule-group component with nesting, no operators that depend on the field's type (text, number or date), no add/remove/reorder of groups, and no serialization. You'd have to build all of it yourself.

### 2. Signature Pad (type: **input**)
A form field where users draw a signature with a mouse, pen or finger, with a "type your name" fallback rendered in a script font. It plugs into forms like any other input and exports SVG or PNG.
- **Why it's useful:** Delivery confirmations, consent forms, quotes and rental agreements need a signature. The typed fallback also makes the field usable for keyboard and screen-reader users, who can't draw.
- **Closest:** **Chakra UI**, indirectly. Its underlying library, Ark UI, ships a Signature Pad primitive (clear button, `getDataUrl`, form-field integration). But Chakra's components index doesn't list it, and `chakra-ui.com/docs/components/signature-pad` returned 404. Ark's page also documents no keyboard interaction. Mantine (FileInput/Dropzone), shadcn and Headless UI have nothing comparable. **What they lack:** a styled, form-ready signature field, and an accessible non-drawing alternative.

### 3. Keyboard Shortcuts Sheet (type: **modal**)
A "?"-triggered dialog that lists every shortcut in the app, grouped by area, with ⌘ or Ctrl chosen automatically for the user's platform and a quick filter box. Shortcuts are registered once in code, and the sheet builds itself from that registry, so it never goes stale.
- **Why it's useful:** Power users find features faster, and the sheet doubles as living documentation for keyboard-heavy apps. It's a reference view, not an action launcher, which makes it different from a command palette.
- **Closest:** **Mantine** has the `use-hotkeys` hook plus Kbd and Modal, but its docs demo uses a custom `Shortcut` component, and no help-sheet component exists. **shadcn** has Kbd/KbdGroup plus Dialog, but no platform-key detection is documented. Chakra has Kbd plus Dialog. Headless UI has only Dialog. **What they lack:** a shortcut registry, auto-generated grouped listing, platform-aware key labels and the "?" trigger convention.

### 4. Image Hotspot Showcase (type: **section**)
A landing-page section with a large product or room image covered in numbered pins. Each pin opens a popover with a title, short copy and a link, and pins are positioned by percentage so they stay put on any screen size. An ordered list version sits underneath for screen readers and small phones.
- **Why it's useful:** It explains a physical product, a dashboard screenshot or a floor plan "in place", which reads far better than a wall of feature bullets. It suits e-commerce and SaaS marketing pages.
- **Closest:** **Mantine Tour** in `mode="beacon"` shows pulsing beacons that can be opened in any order, but beacons attach to DOM elements, not image coordinates, and it's an app-onboarding tool. All four have Popover (Chakra also lists HoverCard and Float). **What they lack:** coordinate-based pins on a responsive image, a numbered keyboard order between pins, and the list fallback.

### 5. Scrollytelling Feature Section (type: **section**)
A two-column section where text "steps" scroll past on one side while a sticky media panel (image, video or demo) on the other side swaps to match the active step. It uses IntersectionObserver for step activation and falls back to plain stacked content when the user prefers reduced motion.
- **Why it's useful:** It's the standard "how it works" pattern on modern product pages and keeps the visual in view while the story moves forward. It's a content showcase, unlike a scroll-spy table of contents, which only highlights navigation links.
- **Closest:** **Mantine** comes nearest with `Scroller`, but that's a horizontal scroll container with chevron controls and isn't scroll-driven. Its TableOfContents is a navigation aid. shadcn and Chakra offer Scroll Area, and Headless UI offers Transition. **What they lack:** viewport-driven step activation, sticky synced media and a reduced-motion fallback. No library provides a section-level component like this.

---

## Not verified / gaps

- Tailwind major version for shadcn is inferred from the `@theme inline` setup. The theming page doesn't state it.
- Primitive-library sizes for shadcn (Base UI, React Aria, Radix) were not fetched.
- Tree-shaken, real-app sizes for every library were not measured.
- Year of the Headless UI 2.2.10 and shadcn 4.23.0 release dates (GitHub showed day and month only).
- Release date of Chakra 3.38.0.
- Per-component keyboard tables for Chakra and Mantine (not read).
- The full shadcn AI Elements list and the full shadcn Blocks list (the Blocks page was truncated to Featured, Sidebar, Login and Signup).
- Pages that returned 404 and were not used: `mantine.dev/guides/accessibility/`, `help.mantine.dev/q/how-to-reduce-bundle-size`, `chakra-ui.com/docs/get-started/overview/about`. The 404 at `chakra-ui.com/docs/components/signature-pad` is cited above only as evidence that the page doesn't exist.

## Sources

**shadcn/ui**
1. https://ui.shadcn.com/docs
2. https://ui.shadcn.com/docs/installation
3. https://ui.shadcn.com/docs/theming
4. https://ui.shadcn.com/docs/components
5. https://ui.shadcn.com/docs/cli
6. https://ui.shadcn.com/docs/changelog
7. https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
8. https://ui.shadcn.com/docs/changelog/2026-07-react-aria
9. https://ui.shadcn.com/docs/changelog/2026-03-cli-v4
10. https://ui.shadcn.com/docs/components/base/accordion
11. https://ui.shadcn.com/docs/components/base/sidebar
12. https://ui.shadcn.com/docs/components/base/chart
13. https://ui.shadcn.com/docs/components/base/kbd
14. https://ui.shadcn.com/blocks
15. https://github.com/shadcn-ui/ui
16. https://github.com/shadcn-ui/ui/releases
17. https://registry.npmjs.org/shadcn/latest

**Mantine**

18. https://mantine.dev/getting-started/
19. https://mantine.dev/styles/css-modules/
20. https://mantine.dev/theming/theme-object/
21. https://mantine.dev/theming/color-schemes/
22. https://mantine.dev/changelog/previous-versions/
23. https://mantine.dev/changelog/9-0-0/
24. https://help.mantine.dev/q/are-mantine-components-accessible
25. https://mantine.dev/llms.txt
26. https://mantine.dev/core/tour/
27. https://mantine.dev/core/scroller/
28. https://mantine.dev/hooks/use-hotkeys/
29. https://registry.npmjs.org/@mantine/core/latest
30. https://bundlephobia.com/api/size?package=@mantine/core@9.8.0

**Chakra UI (and Ark UI)**

31. https://chakra-ui.com/docs/get-started/installation
32. https://chakra-ui.com/docs/get-started/contributing
33. https://chakra-ui.com/docs/theming/overview
34. https://chakra-ui.com/docs/styling/dark-mode
35. https://chakra-ui.com/docs/components/concepts/overview
36. https://chakra-ui.com/docs/components/color-picker
37. https://chakra-ui.com/docs/components/file-upload
38. https://chakra-ui.com/docs/components/floating-panel
39. https://chakra-ui.com/blog/announcing-v3
40. https://github.com/chakra-ui/chakra-ui
41. https://registry.npmjs.org/@chakra-ui/react/latest
42. https://bundlephobia.com/api/size?package=@chakra-ui/react@3.38.0
43. https://ark-ui.com/docs/components/signature-pad

**Headless UI**

44. https://headlessui.com/
45. https://headlessui.com/react/menu
46. https://tailwindcss.com/blog/headless-ui-v2
47. https://github.com/tailwindlabs/headlessui/releases
48. https://registry.npmjs.org/@headlessui/react/latest
49. https://bundlephobia.com/api/size?package=@headlessui/react@2.2.10
