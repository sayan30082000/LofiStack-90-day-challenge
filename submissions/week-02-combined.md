Week: 02

COMPONENT 1: Password Strength Input
Type: input
Live: https://lofistack-sayan.netlify.app/components/password-strength-input
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/password-strength-input.tsx
Pros: Explains itself: crack time in plain words ("About 1 second to crack"), the single best fix, and a one-click memorable passphrase that already passes your rules. Knows dictionary words and l33t tricks, not just character counts.
Cons: The crack time is an estimate, not a guarantee. The built-in word list is English only.

COMPONENT 2: Flip Card
Type: card
Live: https://lofistack-sayan.netlify.app/components/flip-card
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/flip-card.tsx
Pros: Turns like a real card: away from where you press, leans toward your cursor to preview the turn, and press-and-hold peeks at the back. Keyboard button, hover mode and reduced-motion crossfade.
Cons: Press direction, lean and peek are pointer extras; keyboard users flip sideways with the button. Needs a fixed height or aspect ratio.

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Add a unit test suite for my Week 1 and Week 2 components
Agent: Claude Code
Workflow: Asked it to add Vitest + Testing Library, test every component's logic and interactions, run them, fix real bugs and explain each failure.
Result: 53 tests, all passing (npm test). It caught a real bug: "hello world" was rated 48 years to crack; it's now 1 second. Saved about half a day.
