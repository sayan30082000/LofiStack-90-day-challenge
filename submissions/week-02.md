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
- A password field that explains WHY a password is weak and HOW to fix it, not just a coloured bar.
- Crack time in plain words ("About 3 hours to crack", "centuries") from a pure, exported estimateCrackTime(): leaked passwords are instant, dictionary words (also l33t-spelled like Tr0ub4dor) count as one guess each, long glued runs count as several words, separators between words are cheap, and only the rest is brute-forced over its character pool; runs like abc/123/aaa count as one character. guessesPerSecond defaults to 1e10 (fast offline attack). Export formatCrackTime(log10Seconds) too.
- Best fix: a pure bestPasswordTip() tries +4 characters / an uppercase letter / a number / a symbol on a copy and shows the one with the biggest gain and its new crack time ("Best fix: add 4 more characters (centuries to crack)"); leaked passwords and abc/123/aaa runs get their own tips first; nothing once it takes centuries.
- Suggest a passphrase: generatePassphrase() picks 5 words from a built-in ~550-word list with random digit/symbol separators and random capitals using crypto.getRandomValues with rejection sampling (never Math.random), retries until it passes the field's rules and minStrength, and reports its real entropy in bits. The suggestion card shows the passphrase, "About N to crack, even if the attacker knows how it was made", Use it (fills password + confirm, switches to visible so it can be saved) and Another. Once used, the crack time line uses the passphrase's real entropy so the two numbers agree.
- Everything a good password field needs too: show/hide toggle, 4-segment meter (Weak / Fair / Good / Strong) from a pure scorePassword() (length, classes, repeats, sequences, a common-password list that also catches trailing digits and l33t), a minimum-strength notch, a rules checklist, an optional confirm field with match / no match, and a Caps Lock warning.

Props (export an interface named PasswordStrengthInputProps):
label, value? / defaultValue, onChange(value, result), rules?, showChecklist, minStrength, confirm, confirmValue? / onConfirmChange, error?, disabled, required, description, scoreOptions, strengthLabels, showCrackTime, guessesPerSecond, crackTimeText, showTips, tipText, suggestPassphrase, passphraseOptions, suggestText, useSuggestionText, anotherSuggestionText, suggestionStrengthText, suggestionUsedText and every other visible string

Accessibility:
Toggle has aria-pressed and label "Show password"; meter uses role=meter with aria-valuetext; checklist is a real list with met/missing screen reader text; strength and crack time are announced after typing pauses (debounced live region); filling a suggestion is announced; tips and buttons are real text and buttons with 40px targets.

Demo page shows:
1) A sign-up form with confirm field, crack time, best fix and Suggest a passphrase. 2) A stricter admin policy (12+ characters, no spaces, 2 numbers, Strong minimum) where suggestions still pass. 3) A compact version with no checklist, tips or suggestions, plus a disabled state.

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
- A flip card that behaves like a real card, not just a 180° spin.
- Turns away from where you press: in direction="auto" (default) pressing near the left/right edge turns it sideways and near the top/bottom turns it up or down; in every mode the pressed edge goes away from the viewer (rotateY + for the right edge, rotateX − for the bottom edge) and the card returns the way it came. Keep both rotateX() and rotateY() in the transform at all times so CSS interpolates each angle on its own, and pre-rotate the back face on the same axis.
- Lean preview (tiltHint): while a mouse hovers the front, the card leans up to tiltAngle (7°) toward the side it would turn, strongest at the edges, with a quick 180ms transition and no lean right after a flip.
- Hold to peek (peekOnHold): press and hold the surface for peekDelay (350ms) to show the other side; letting go turns it back, the release never counts as a flip, and onPeek(peeking) reports it. A shorter press is a normal click.
- Still a complete flip card: click (and Enter/Space on the corner button) or hover trigger, controlled flipped + onFlip, both faces in one grid cell so the card is as tall as its taller face, interactive content on the back never flips it, text selection never flips it, touch taps toggle hover cards, and a short dip animation while turning.

Props (export an interface named FlipCardProps):
front, back, trigger: 'click' | 'hover', direction: 'auto' | 'horizontal' | 'vertical', flipped? / defaultFlipped / onFlip, label, showControl, controlPosition, controlIcon, flipOnSurfaceClick, tiltHint, tiltAngle, peekOnHold, peekDelay, onPeek, duration, perspective, disabled, className, faceClassName, frontClassName, backClassName, controlClassName

Accessibility:
Flip control is a real button with aria-pressed and a specific label; the hidden face gets aria-hidden and inert (also during a peek); pressing, leaning and peeking are pointer extras while keyboard users get the same content through the button; reduced motion replaces the rotation and lean with a crossfade.

Demo page shows:
1) A postcard that shows the physical behaviour (press any edge, hover to see the lean, hold to peek) with a flips/peeking readout. 2) A 3-card vocabulary flashcard deck with Next/Previous and Got it / Still learning on the back. 3) A hover team-member card. 4) A vertical ticket flip.

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
