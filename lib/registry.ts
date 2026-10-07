import { siteConfig } from "./site";

export type ComponentType =
  | "button"
  | "form"
  | "card"
  | "modal"
  | "navbar"
  | "table"
  | "loader"
  | "section"
  | "chart"
  | "input";

export interface RegistryEntry {
  /** Number from the 70-idea prompt library. */
  number: number;
  slug: string;
  name: string;
  /** Plain label used in the lofidb submission. */
  type: ComponentType;
  /** Challenge week this was submitted in. */
  week: number;
  description: string;
  /** ISO date (YYYY-MM-DD). */
  addedAt: string;
  /** Main source file, relative to components/ui/. Used for the GitHub code link. */
  codePath: string;
}

/** Every built component, released or not. */
const allComponents: RegistryEntry[] = [
  {
    number: 54,
    slug: "typing-indicator",
    name: "Typing Indicator",
    type: "loader",
    week: 1,
    description:
      "A typing indicator that shows how someone is writing, not just that they are: speed, pauses, rewrites, long drafts, \"changed their mind\" when a draft is erased, voice notes, attachments and AI thinking. Plus a hook that reads it all from any input, sharing only length, never text.",
    addedAt: "2026-10-01",
    codePath: "typing-indicator/index.tsx",
  },
  {
    number: 49,
    slug: "tree-view",
    name: "Tree View",
    type: "table",
    week: 1,
    description:
      "A change-aware tree: git-style added/modified/removed markers, folders that sum up what changed inside them, dots for changes you haven't seen since your last visit, a changes-only view and Alt+arrow jumps between changes. Plus tri-state checkboxes, filtering and lazy loading.",
    addedAt: "2026-10-01",
    codePath: "tree-view.tsx",
  },
  {
    number: 9,
    slug: "password-strength-input",
    name: "Password Strength Input",
    type: "input",
    week: 2,
    description:
      "A password field that explains itself: how long the password would take to crack in plain words, the single change that would help most, and a one-click memorable passphrase that already passes your rules. Plus a strength meter, rules checklist and confirm field.",
    addedAt: "2026-10-02",
    codePath: "password-strength-input.tsx",
  },
  {
    number: 25,
    slug: "flip-card",
    name: "Flip Card",
    type: "card",
    week: 2,
    description:
      "A flip card that behaves like a real card: it turns away from wherever you press, leans toward your cursor to show which way it will go, and lets you press and hold to peek at the back. Keyboard, hover and reduced-motion friendly.",
    addedAt: "2026-10-02",
    codePath: "flip-card.tsx",
  },
  {
    number: 40,
    slug: "animated-tabs",
    name: "Animated Tabs",
    type: "navbar",
    week: 3,
    description:
      "Tabs that act on intent: the indicator leans toward the tab you're about to pick, panels can prefetch before the click, and the open tab lives in the URL so shared links and reloads restore it. WAI-ARIA keyboard support, badges, pill and vertical modes.",
    addedAt: "2026-10-02",
    codePath: "animated-tabs.tsx",
  },
  {
    number: 51,
    slug: "skeleton",
    name: "Skeleton Loader Kit",
    type: "loader",
    week: 3,
    description:
      "Skeletons that remember the real shape: after content loads once, every text line, image and button is measured and the next load draws that exact layout, so nothing jumps. Plus primitives, presets, a page-wide shimmer and a gentle 'still loading' message.",
    addedAt: "2026-10-02",
    codePath: "skeleton.tsx",
  },
  {
    number: 23,
    slug: "pricing-cards",
    name: "Pricing Cards",
    type: "card",
    week: 4,
    description: "Plan cards with monthly/yearly toggle and animated prices.",
    addedAt: "2026-10-02",
    codePath: "pricing-cards.tsx",
  },
  {
    number: 32,
    slug: "confirm-dialog",
    name: "Type-to-Confirm Dialog",
    type: "modal",
    week: 4,
    description: "Destructive confirm that needs the resource name typed in.",
    addedAt: "2026-10-02",
    codePath: "confirm-dialog.tsx",
  },
  {
    number: 7,
    slug: "otp-input",
    name: "OTP Input",
    type: "input",
    week: 5,
    description: "One-time code boxes with auto-advance and paste support.",
    addedAt: "2026-10-02",
    codePath: "otp-input.tsx",
  },
  {
    number: 63,
    slug: "activity-heatmap",
    name: "Activity Heatmap",
    type: "chart",
    week: 5,
    description: "GitHub-style contribution calendar with tooltips.",
    addedAt: "2026-10-02",
    codePath: "activity-heatmap.tsx",
  },
  {
    number: 18,
    slug: "file-dropzone",
    name: "File Dropzone",
    type: "form",
    week: 6,
    description: "Drag-and-drop file picker with validation and previews.",
    addedAt: "2026-10-02",
    codePath: "file-dropzone.tsx",
  },
  {
    number: 24,
    slug: "tilt-card",
    name: "3D Tilt Card",
    type: "card",
    week: 6,
    description: "Card that tilts in 3D toward the pointer with a moving glare.",
    addedAt: "2026-10-02",
    codePath: "tilt-card.tsx",
  },
  {
    number: 31,
    slug: "command-palette",
    name: "Command Palette",
    type: "modal",
    week: 7,
    description: "Cmd/Ctrl+K launcher with fuzzy search and nested pages.",
    addedAt: "2026-10-02",
    codePath: "command-palette.tsx",
  },
  {
    number: 60,
    slug: "logo-marquee",
    name: "Logo Marquee",
    type: "section",
    week: 7,
    description: "Infinite scrolling logo strip with fades and multiple rows.",
    addedAt: "2026-10-02",
    codePath: "logo-marquee.tsx",
  },
  {
    number: 17,
    slug: "multi-step-form",
    name: "Multi-Step Form Wizard",
    type: "form",
    week: 8,
    description: "Config-driven wizard with per-step validation and review screen.",
    addedAt: "2026-10-02",
    codePath: "multi-step-form.tsx",
  },
  {
    number: 64,
    slug: "donut-chart",
    name: "Donut Chart",
    type: "chart",
    week: 8,
    description: "Interactive SVG donut with legend toggles and center total.",
    addedAt: "2026-10-02",
    codePath: "donut-chart.tsx",
  },
  {
    number: 19,
    slug: "newsletter-signup",
    name: "Newsletter Signup",
    type: "form",
    week: 9,
    description: "Email capture with validation, success and error states.",
    addedAt: "2026-10-02",
    codePath: "newsletter-signup.tsx",
  },
  {
    number: 46,
    slug: "data-table",
    name: "Data Table",
    type: "table",
    week: 9,
    description: "Typed table with sort, search, filters, selection and pagination.",
    addedAt: "2026-10-02",
    codePath: "data-table.tsx",
  },
  {
    number: 35,
    slug: "toast",
    name: "Toast System",
    type: "modal",
    week: 10,
    description: "Toaster with stacking, promise toasts and undo actions.",
    addedAt: "2026-10-02",
    codePath: "toast.tsx",
  },
  {
    number: 42,
    slug: "breadcrumbs",
    name: "Breadcrumbs",
    type: "navbar",
    week: 10,
    description: "Breadcrumb trail that collapses long paths into a menu.",
    addedAt: "2026-10-02",
    codePath: "breadcrumbs.tsx",
  },
  {
    number: 48,
    slug: "kanban-board",
    name: "Kanban Board",
    type: "table",
    week: 11,
    description: "Drag cards between columns with WIP limits and quick add.",
    addedAt: "2026-10-02",
    codePath: "kanban-board.tsx",
  },
  {
    number: 66,
    slug: "gauge-chart",
    name: "Gauge Chart",
    type: "chart",
    week: 11,
    description: "Semicircle gauge with colored zones and animated needle.",
    addedAt: "2026-10-02",
    codePath: "gauge-chart.tsx",
  },
  {
    number: 10,
    slug: "range-slider",
    name: "Dual Range Slider",
    type: "input",
    week: 12,
    description: "Min/max slider with histogram, ideal for price filters.",
    addedAt: "2026-10-02",
    codePath: "range-slider.tsx",
  },
  {
    number: 61,
    slug: "timeline",
    name: "Vertical Timeline",
    type: "section",
    week: 12,
    description: "Alternating timeline whose line fills as you scroll.",
    addedAt: "2026-10-02",
    codePath: "timeline.tsx",
  },
  {
    number: 38,
    slug: "mega-menu-navbar",
    name: "Mega Menu Navbar",
    type: "navbar",
    week: 13,
    description: "Site header with multi-column mega panels and mobile menu.",
    addedAt: "2026-10-02",
    codePath: "mega-menu-navbar.tsx",
  },
  {
    number: 55,
    slug: "countdown-timer",
    name: "Countdown Timer",
    type: "loader",
    week: 13,
    description: "Drift-free countdown with flip digits and completion state.",
    addedAt: "2026-10-02",
    codePath: "countdown-timer.tsx",
  },
  {
    number: 62,
    slug: "before-after-slider",
    name: "Before/After Slider",
    type: "section",
    week: 14,
    description: "Draggable image comparison with keyboard support.",
    addedAt: "2026-10-02",
    codePath: "before-after-slider.tsx",
  },
  {
    number: 68,
    slug: "date-range-picker",
    name: "Date Range Picker",
    type: "input",
    week: 14,
    description: "Two-month calendar with presets and disabled dates.",
    addedAt: "2026-10-02",
    codePath: "date-range-picker.tsx",
  },
  {
    number: 27,
    slug: "kpi-card",
    name: "KPI Stat Card",
    type: "card",
    week: 15,
    description: "Metric tile with count-up value, trend delta and sparkline.",
    addedAt: "2026-10-02",
    codePath: "kpi-card.tsx",
  },
  {
    number: 36,
    slug: "product-tour",
    name: "Onboarding Tour",
    type: "modal",
    week: 15,
    description: "Step-by-step spotlight tour over real UI.",
    addedAt: "2026-10-02",
    codePath: "product-tour.tsx",
  },
];

/** Components that are live: weeks up to siteConfig.releasedThroughWeek. Later ones 404 until released. */
export const registry: RegistryEntry[] = allComponents.filter((c) => c.week <= siteConfig.releasedThroughWeek);

export function getComponent(slug: string): RegistryEntry | undefined {
  return registry.find((c) => c.slug === slug);
}
