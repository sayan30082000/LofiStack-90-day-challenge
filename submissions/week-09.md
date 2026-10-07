# Week 09 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 09
Type: form
Component: Newsletter Signup
Live: lofistack-sayan.netlify.app/components/newsletter-signup
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/newsletter-signup.tsx
Prompt:
Build the "Newsletter Signup" component (#19, Type: form) for my LofiStack component gallery.
Route: /components/newsletter-signup

What it does:
- Email input and button on one row, stacking on mobile.
- Validates on submit, then on blur after the first submit.
- States: idle, submitting, success, error, each visually distinct.
- Success replaces the form with a confirmation and a "Use another email" link.
- Optional consent checkbox; variants inline and card.

Props (export an interface named NewsletterSignupProps):
onSubscribe(email): Promise<void>, title?, description?, placeholder, buttonText, successMessage, requireConsent, consentLabel, variant: 'inline' | 'card'

Accessibility:
Labelled input (visually hidden label OK); aria-invalid; error text by id; success uses role=status.

Demo page shows:
Card variant in a fake blog footer, the inline variant, and a fake API that fails for any email containing "fail".

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/newsletter-signup.tsx (split into a folder components/ui/newsletter-signup/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/newsletter-signup/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "newsletter-signup", type "form").

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
Week: 09
Type: table
Component: Data Table
Live: lofistack-sayan.netlify.app/components/data-table
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/data-table.tsx
Prompt:
Build the "Data Table" component (#46, Type: table) for my LofiStack component gallery.
Route: /components/data-table

What it does:
- Generic column config (accessor, header, cell renderer, sortable, align).
- Header click cycles sort asc / desc / none with an indicator.
- Global search and a status filter.
- Row selection with select-all (indeterminate) and a bulk action bar.
- Pagination, column visibility menu, sticky header, sticky first column on horizontal scroll.
- Loading skeleton rows and an empty state.

Props (export an interface named DataTableProps):
data: T[], columns: ColumnDef<T>[], getRowId, searchable, pageSize, selectable, onSelectionChange, bulkActions?, loading, emptyState

Accessibility:
Real table semantics; aria-sort on headers; checkbox labels like "Select Jane Cooper".

Demo page shows:
50 fake users (name, email, role, status, joined, spend) with a loading toggle.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/data-table.tsx (split into a folder components/ui/data-table/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/data-table/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "data-table", type "table").

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
