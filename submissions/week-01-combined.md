Week: 01

COMPONENT 1: Change-Aware Tree View
Type: table
Live: https://lofistack-sayan.netlify.app/components/tree-view
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/tree-view.tsx
Pros: Shows what changed since your last visit (A/M/R markers, folder totals, "new" dots, jump to next change). Full keyboard + screen reader support, search, lazy loading, tri-state checkboxes.
Cons: Needs change data from your backend (e.g. git status). "Seen" state is saved per browser, not synced across devices.

COMPONENT 2: Typing Indicator
Type: loader
Live: https://lofistack-sayan.netlify.app/components/typing-indicator
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/typing-indicator/index.tsx
Pros: Shows HOW someone types (speed, pauses, rewriting, "changed their mind", voice note, AI thinking) in 3 original looks. Shares only draft length, never text. Reduced-motion and screen reader friendly.
Cons: Needs your own realtime channel (e.g. WebSocket) to send activity. More detail than simple dots, which may be too much for minimal UIs.

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Set up my gallery, build Week 1, audit it against the challenge rules and deploy
Agent: Claude Code
Workflow: Gave it the challenge rules and my prompts. It built both components, made them original, tested them (TypeScript, ESLint, build, desktop + mobile) and deployed to Netlify.
Result: 2 tested components live. Caught my same-day deadline and placeholder links. Saved about two days.
