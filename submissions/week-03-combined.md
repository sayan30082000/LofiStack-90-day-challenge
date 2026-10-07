Week: 03

COMPONENT 1: Animated Tabs
Type: navbar
Live: https://lofistack-sayan.netlify.app/components/animated-tabs
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/animated-tabs.tsx
Pros: Acts on intent: the indicator leans toward the tab you're about to pick, panels prefetch before you click (hover, keyboard focus or touch), and the open tab lives in the URL so shared links and reloads restore it. Full WAI-ARIA keyboard support.
Cons: Prefetching needs your own data layer behind onIntent. The magnetic lean is mouse-only.

COMPONENT 2: Skeleton Loader Kit
Type: loader
Live: https://lofistack-sayan.netlify.app/components/skeleton
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/skeleton.tsx
Pros: Remembers the real shape: after content loads once it measures every text line, image, avatar and card, and the next load draws that exact layout, so nothing jumps. Shows "Still loading…" after 4s.
Cons: The very first load still needs a hand-made fallback. Shapes are remembered per browser.

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Generate component documentation automatically from the TypeScript source
Agent: Claude Code
Workflow: Asked it for docs that can't go stale: a script that reads each component with the TypeScript compiler and writes a props table (type, default, description), wired to npm run docs.
Result: 6 doc pages, 195 props documented, regenerated in a second. It caught its own mistake (two invented exports) before shipping. Saved about 3 hours.
