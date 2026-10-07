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
- Pricing cards that answer "which plan is right for me?" instead of making the buyer compare feature lists.
- Plan finder (finder: PlanFinderDimension[]): one native range slider per need (e.g. Team size in seats, Asset storage in GB), each with min/max/step/defaultValue, a display format and a limit per plan id (null or missing = unlimited). Export pure fittingPlans() and recommendPlan(plans, billing, finder, values): the cheapest plan at the CURRENT billing period that covers every value, ties in plan order.
- The recommended card gets an emerald ring and a "Best fit for you" badge (also read with its heading). Every card lists one line per dimension: "Up to 10 seats", "Unlimited storage", or "Too small: you need 12 seats" in rose. Too-small cards get a dashed border and a pale background, NOT opacity, so text keeps its contrast. If nothing fits, show "None of these plans is big enough yet. Talk to us about a custom plan." onRecommend(planId | null) reports changes; a polite live region announces the new best fit 600ms after the slider settles.
- Also: billing toggle (monthly / yearly radiogroup) with a "Save 20%" badge; prices roll digit by digit like an odometer; yearly shows the per-month rate, billed total and saving chip; featured plan raised with "Most popular"; async onSelect with a spinner and inline error; 1 / 2 / 3 columns by container width; export PricingCard and PricingTable; every string in labels.

Props (export an interface named PricingCardsProps):
plans: { id, name, description, monthly, yearly, features: { label, included }[], cta: { label, href?, disabled? }, featured? }[], defaultBilling, yearlyDiscountLabel, currency, locale, onSelect?(planId, billing), onBillingChange?, finder?: { id, label, unit, min, max, step?, defaultValue?, format?, limits: Record<planId, number | null> }[], onRecommend?, labels?

Accessibility:
Billing toggle is a radiogroup with roving tabindex; price changes announced; excluded features have sr-only "Not included"; the finder is a fieldset of labelled range inputs with aria-valuetext ("12 seats"); best fit is in the card heading's accessible name; contrast stays AA for badges (emerald-700 under white text) and too-small cards.

Demo page shows:
1) Starter / Pro / Team with a finder for team size (1–25 seats) and storage (1–600 GB): watch the best fit move from Pro to Team and past 10 seats to the talk-to-us message. 2) States and currency: pounds with en-GB, a disabled current plan, a failing checkout, and the empty state.

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
- A delete confirmation that scales its friction to the damage and lets people change their mind.
- Impact preview (impact: { value, label }[]): what exactly will be lost as big numbers, e.g. 48 files · 3 collaborators lose access · 1.2 GB of storage.
- Friction (friction: 'type' | 'click' | 'auto', autoTypeAt = 10): type always asks for the exact resource name; click is just the button; auto asks for typing only when the numeric impact values add up to autoTypeAt, otherwise there's no input and initial focus goes to Cancel, the safe choice. Export impactTotal().
- Undo window (undoWindow ms, default 0 = off): on confirm the dialog closes and an undo bar counts down (visual countdown and progress line) with Undo and Delete now, then runs onConfirm and shows done / error. Count against a deadline (performance.now), never with side effects inside a state updater. Hovering the bar or focusing inside it pauses the countdown (WCAG 2.2.1). The bar announces once per state through an sr-only status, not every second. onUndo fires on Undo. All wording in undoLabels.
- Still the classic type-to-confirm: the name chip lights each correct character green and the first wrong one rose, a progress line under the input, case-sensitive or not, async onConfirm with loading state and in-dialog errors, Esc/backdrop close except while loading, mobile bottom-sheet / desktop centred entrance.

Props (export an interface named ConfirmDialogProps):
open, onOpenChange, title, description, resourceName, consequences?, consequencesTitle, impact?, impactTitle, friction, autoTypeAt, undoWindow, onUndo?, undoLabels?, confirmLabel, loadingLabel, cancelLabel, onConfirm: () => Promise<void>, caseSensitive, inputLabel, placeholder, matchedText, errorFallback, closeLabel, finalFocusRef

Accessibility:
role=alertdialog with aria-labelledby / describedby; focus trap; initial focus on the input (or Cancel when no typing is needed); focus returns to the trigger; matched state announced; name chip text at least 4.5:1 (zinc-600 on zinc-100); undo bar pauses on hover/focus and announces once per state.

Demo page shows:
1) A folder list: deleting scratch-notes (2 files) is one click, deleting brand-assets (48 files, 3 collaborators) needs its name typed; both show the impact and get an 8 second undo bar, with a log of what happened. 2) A repository danger zone with a first delete that fails. 3) Removing a team member with case-insensitive matching.

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
