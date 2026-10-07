# Week 02 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 02
Type: input
Component: Password Strength Input
Live: lofistack-sayan.netlify.app/components/password-strength-input
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/password-strength-input.tsx
Prompt:
Build the "Password Strength Input" component (#9, Type: input) for my LofiStack component gallery.
Route: /components/password-strength-input

What it does:
- Show/hide toggle.
- 4-segment meter (Weak / Fair / Good / Strong) from a pure, exported scorePassword() function (length, lower, upper, number, symbol, common-password list).
- Checklist of rules with check / x icons that update as you type.
- Optional confirm field showing match / no match.
- Caps Lock warning.

Props (export an interface named PasswordStrengthInputProps):
label, value?, onChange, rules?: { id, label, test: (v) => boolean }[] (defaults provided), showChecklist, minStrength, confirm?: boolean, error?, disabled

Accessibility:
Toggle has aria-pressed and label "Show password"; meter uses role=meter with aria-valuetext; checklist is a real list; strength changes announced (debounced).

Demo page shows:
A sign-up form, a version with custom rules (min 12 characters, no spaces), and a compact version without the checklist.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/password-strength-input.tsx (split into a folder components/ui/password-strength-input/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/password-strength-input/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "password-strength-input", type "input").

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
Week: 02
Type: card
Component: Flip Card
Live: lofistack-sayan.netlify.app/components/flip-card
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/flip-card.tsx
Prompt:
Build the "Flip Card" component (#25, Type: card) for my LofiStack component gallery.
Route: /components/flip-card

What it does:
- Front and back faces with a 3D rotate (horizontal or vertical).
- Trigger: click (and Enter/Space) or hover.
- Controlled `flipped` prop plus onFlip.
- Both faces share the same height (stack them in one grid cell).
- The back face can hold interactive content.

Props (export an interface named FlipCardProps):
front: ReactNode, back: ReactNode, trigger: 'click' | 'hover', direction: 'horizontal' | 'vertical', flipped?, onFlip?, className

Accessibility:
Flip control has aria-pressed and a label; the hidden face gets aria-hidden and inert; reduced motion uses a crossfade.

Demo page shows:
A 3-card vocabulary flashcard deck with Next/Previous, a hover team-member card, and a vertical flip example.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/flip-card.tsx (split into a folder components/ui/flip-card/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/flip-card/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "flip-card", type "card").

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
