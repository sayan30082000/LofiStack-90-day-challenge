Week: 04

COMPONENT 1: Pricing Cards
Type: card
Live: https://lofistack-sayan.netlify.app/components/pricing-cards
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/pricing-cards.tsx
Pros: Built-in plan finder: slide team size and storage, and the cheapest plan that fits is marked "Best fit for you" while too-small plans say exactly why. Odometer prices, monthly/yearly toggle, AA contrast.
Cons: Limits must be set per plan in the finder config. Only numeric needs (seats, GB) can be compared.

COMPONENT 2: Type-to-Confirm Dialog
Type: modal
Live: https://lofistack-sayan.netlify.app/components/confirm-dialog
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/confirm-dialog.tsx
Pros: Friction matches the damage: shows what will be lost (48 files, 3 collaborators), asks for typing only on big deletes, and gives an 8s undo window that pauses on hover or focus.
Cons: With the undo window the real delete runs a few seconds later, so the app must handle that delay.

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Accessibility audit of every released page, fixing everything that fails
Agent: Claude Code
Workflow: Asked it to run axe-core (WCAG 2.2 AA) in Chrome on every page and interactive state, light and dark, at 375px and 1280px, fix each issue in the component, re-run until clean, and add checks to npm test.
Result: Found 420 violations (low-contrast text, code colours, unreachable scroll areas). All 56 runs now clean; 28 axe tests guard it. Saved about a day.
