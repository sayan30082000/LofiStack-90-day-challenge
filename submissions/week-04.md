# Week 04 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 04
Type: card
Component: Pricing Cards
Live: lofistack-sayan.netlify.app/components/pricing-cards
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/pricing-cards.tsx
Prompt:
Build the "Pricing Cards" component (#23, Type: card) for my LofiStack component gallery.
Route: /components/pricing-cards

What it does:
- Billing toggle (monthly / yearly) with a "Save 20%" badge.
- Prices roll/count to the new value when toggled.
- Each card: name, price, period, description, feature list with included/excluded marks, CTA.
- A featured plan is highlighted, slightly raised, with a "Most popular" label.
- Grid goes 1 / 2 / 3 columns. Export both PricingCard and PricingTable.

Props (export an interface named PricingCardsProps):
plans: { id, name, description, monthly, yearly, features: { label, included }[], cta: { label, href? }, featured? }[], defaultBilling, yearlyDiscountLabel, currency, onSelect?(planId, billing)

Accessibility:
Toggle is role=switch or radiogroup; price change announced; excluded features have sr-only "Not included".

Demo page shows:
Starter / Pro / Team plans.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/pricing-cards.tsx (split into a folder components/ui/pricing-cards/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/pricing-cards/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "pricing-cards", type "card").

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
Week: 04
Type: modal
Component: Type-to-Confirm Dialog
Live: lofistack-sayan.netlify.app/components/confirm-dialog
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/confirm-dialog.tsx
Prompt:
Build the "Type-to-Confirm Dialog" component (#32, Type: modal) for my LofiStack component gallery.
Route: /components/confirm-dialog

What it does:
- The danger button stays disabled until the user types the exact resource name.
- Shows a list of consequences.
- Async onConfirm with loading state; errors shown inside the dialog.
- Esc and backdrop close it, except while loading. Entrance animation.

Props (export an interface named ConfirmDialogProps):
open, onOpenChange, title, description, resourceName, consequences?: string[], confirmLabel, onConfirm: () => Promise<void>, caseSensitive

Accessibility:
role=alertdialog with aria-labelledby / describedby; focus trap; initial focus on the input; focus returns to the trigger.

Demo page shows:
A fake repo settings "Danger zone" for deleting lofi-ui. After deletion the repo row disappears and a Restore button brings it back.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/confirm-dialog.tsx (split into a folder components/ui/confirm-dialog/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/confirm-dialog/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "confirm-dialog", type "modal").

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
