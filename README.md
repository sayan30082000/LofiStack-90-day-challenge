# Component Gallery

Reusable React + Tailwind components built for the LofiStack 90 Day Build Challenge.

The homepage is the whole challenge on one page: 15 weeks grouped into the 3 monthly reviews, each week with its 2 components (live demo, GitHub code link, build prompt and a ready lofidb post) and its agent log. Every component also has its own page with live previews, code, a props table and accessibility notes.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · lucide-react · shiki

## Components

All 30 components of the 90 day plan, 2 per week.

| Week | # | Name | Type | Live |
|---|---|---|---|---|
| 01 | 49 | Tree View | table | [/components/tree-view](https://lofistack-sayan.netlify.app/components/tree-view) |
| 01 | 54 | Typing Indicator | loader | [/components/typing-indicator](https://lofistack-sayan.netlify.app/components/typing-indicator) |
| 02 | 9 | Password Strength Input | input | [/components/password-strength-input](https://lofistack-sayan.netlify.app/components/password-strength-input) |
| 02 | 25 | Flip Card | card | [/components/flip-card](https://lofistack-sayan.netlify.app/components/flip-card) |
| 03 | 40 | Animated Tabs | navbar | [/components/animated-tabs](https://lofistack-sayan.netlify.app/components/animated-tabs) |
| 03 | 51 | Skeleton Loader Kit | loader | [/components/skeleton](https://lofistack-sayan.netlify.app/components/skeleton) |
| 04 | 23 | Pricing Cards | card | [/components/pricing-cards](https://lofistack-sayan.netlify.app/components/pricing-cards) |
| 04 | 32 | Type-to-Confirm Dialog | modal | [/components/confirm-dialog](https://lofistack-sayan.netlify.app/components/confirm-dialog) |
| 05 | 7 | OTP Input | input | [/components/otp-input](https://lofistack-sayan.netlify.app/components/otp-input) |
| 05 | 63 | Activity Heatmap | chart | [/components/activity-heatmap](https://lofistack-sayan.netlify.app/components/activity-heatmap) |
| 06 | 18 | File Dropzone | form | [/components/file-dropzone](https://lofistack-sayan.netlify.app/components/file-dropzone) |
| 06 | 24 | 3D Tilt Card | card | [/components/tilt-card](https://lofistack-sayan.netlify.app/components/tilt-card) |
| 07 | 31 | Command Palette | modal | [/components/command-palette](https://lofistack-sayan.netlify.app/components/command-palette) |
| 07 | 60 | Logo Marquee | section | [/components/logo-marquee](https://lofistack-sayan.netlify.app/components/logo-marquee) |
| 08 | 17 | Multi-Step Form Wizard | form | [/components/multi-step-form](https://lofistack-sayan.netlify.app/components/multi-step-form) |
| 08 | 64 | Donut Chart | chart | [/components/donut-chart](https://lofistack-sayan.netlify.app/components/donut-chart) |
| 09 | 19 | Newsletter Signup | form | [/components/newsletter-signup](https://lofistack-sayan.netlify.app/components/newsletter-signup) |
| 09 | 46 | Data Table | table | [/components/data-table](https://lofistack-sayan.netlify.app/components/data-table) |
| 10 | 35 | Toast System | modal | [/components/toast](https://lofistack-sayan.netlify.app/components/toast) |
| 10 | 42 | Breadcrumbs | navbar | [/components/breadcrumbs](https://lofistack-sayan.netlify.app/components/breadcrumbs) |
| 11 | 48 | Kanban Board | table | [/components/kanban-board](https://lofistack-sayan.netlify.app/components/kanban-board) |
| 11 | 66 | Gauge Chart | chart | [/components/gauge-chart](https://lofistack-sayan.netlify.app/components/gauge-chart) |
| 12 | 10 | Dual Range Slider | input | [/components/range-slider](https://lofistack-sayan.netlify.app/components/range-slider) |
| 12 | 61 | Vertical Timeline | section | [/components/timeline](https://lofistack-sayan.netlify.app/components/timeline) |
| 13 | 38 | Mega Menu Navbar | navbar | [/components/mega-menu-navbar](https://lofistack-sayan.netlify.app/components/mega-menu-navbar) |
| 13 | 55 | Countdown Timer | loader | [/components/countdown-timer](https://lofistack-sayan.netlify.app/components/countdown-timer) |
| 14 | 62 | Before/After Slider | section | [/components/before-after-slider](https://lofistack-sayan.netlify.app/components/before-after-slider) |
| 14 | 68 | Date Range Picker | input | [/components/date-range-picker](https://lofistack-sayan.netlify.app/components/date-range-picker) |
| 15 | 27 | KPI Stat Card | card | [/components/kpi-card](https://lofistack-sayan.netlify.app/components/kpi-card) |
| 15 | 36 | Onboarding Tour | modal | [/components/product-tour](https://lofistack-sayan.netlify.app/components/product-tour) |

## Docs and tests

- **Docs:** [docs/](docs/README.md) has one page per released component, generated from the TypeScript props (types, defaults, JSDoc) by `npm run docs`.
- **Tests:** `npm test` runs the Vitest + Testing Library suite in `tests/`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project layout

```
app/
  page.tsx                      gallery homepage
  components/<slug>/page.tsx    one static route per component
  components/<slug>/demos.tsx   client-side demo examples
components/
  ui/                           the components themselves
  gallery/                      ComponentPage, PreviewTabs, CodeBlock, ThemeToggle
lib/
  registry.ts                   built components (feeds the homepage and sitemap)
  agent-logs.ts                 Track B: one agent log per week
  challenge.ts                  weeks, months and lofidb post builders
  prompts.generated.ts          all 70 build prompts + the 15-week plan (generated)
  site.ts                       your name, site URL and repo URL
submissions/                    ready-to-post lofidb submissions per week
```

## Each week

1. Open the homepage, find this week, and copy each component's **Prompt**.
2. Build it: `components/ui/<slug>.tsx` plus `app/components/<slug>/page.tsx` (and `demos.tsx`) using `<ComponentPage slug="<slug>" ... />`.
3. Add it to `lib/registry.ts` with its `codePath`, and raise `releasedThroughWeek` in `lib/site.ts` to this week. Components from later weeks stay hidden (404) until then. The homepage then shows the new Demo and Code links and marks them Live.
4. Add the week's entry to `lib/agent-logs.ts`, then run `npm test` and `npm run docs`.
5. Commit, tag it (`git tag week-02`) and push with tags. Netlify deploys on every push. Then copy the **lofidb posts** from the homepage dialogs or `submissions/week-XX.md`.

To change the plan or a prompt, edit `prompts-data.js` in the parent folder and run `node build.js`; it regenerates `lib/prompts.generated.ts`.

## Before you deploy

`lib/site.ts` holds your name, the Netlify URL and the GitHub repo URL. If the Netlify URL changes, update it there and in the table above, then run `node build.js` in the parent folder to refresh the submission posts.

## Deploy to Netlify

Push this folder to a public GitHub repo, then import it in Netlify (**Add new project** → **Import an existing project**). `netlify.toml` already holds the build settings. Vercel works too: import the repo at vercel.com/new.

## GitHub Pages (alternative)

Add to `next.config.ts`:

```ts
const nextConfig = {
  output: "export",
  basePath: "/<repo-name>",
  images: { unoptimized: true },
};
```

Then `npm run build` and publish the `out/` folder (for example with the `actions/deploy-pages` GitHub Action).

## Note on dependencies

`package.json` pins `baseline-browser-mapping` to 2.11.26 through `overrides` because the 2.11.27 tarball was missing from the npm registry when this project was created. You can remove the override once a newer version installs cleanly.
