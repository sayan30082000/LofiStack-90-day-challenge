Week: 08

COMPONENT 1: Multi-Step Form Wizard
Type: form
Live: https://lofistack-sayan.netlify.app/components/multi-step-form
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/multi-step-form.tsx
Pros: Steps follow your answers: a paid plan adds a Billing step (announced: "Added a step: Billing. 5 steps now."). Saves a draft as you go, so coming back offers Resume or Start fresh (passwords can be kept out). Shows "About 2 min left", adapting to your own pace.
Cons: Draft lives in this browser only (localStorage). The time left is an estimate.

COMPONENT 2: Donut Chart
Type: chart
Live: https://lofistack-sayan.netlify.app/components/donut-chart
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/donut-chart.tsx
Pros: Tiny slices are grouped into one "Other" slice you can open as its own donut. Compare with last month: a faint ring of old shares, ▲/▼ change per category and the biggest rise and drop in words.
Cons: Categories are matched by name between periods. Palette repeats after 8 colors.

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Automate checks on every push with GitHub Actions CI
Agent: Claude Code
Workflow: Asked it to write a workflow that runs type-check, lint, all tests, a docs-up-to-date check, a production build and the full browser accessibility audit on every push and PR, with the report in the run summary and a README badge.
Result: Run #1 failed at the type-check (generated route types missing in a fresh checkout). It reproduced that in a clean clone, fixed it with next typegen, and run #2 passed every step in 4 min 23 s, a11y audit included (136 runs, 0 violations). Every push is now checked automatically. Saves about 20 min per release.
