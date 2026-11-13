Week: 10

COMPONENT 1: Toast System
Type: modal
Live: https://lofistack-sayan.netlify.app/components/toast
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/toast.tsx
Pros: Repeats count up ("Draft saved ×3") and related toasts merge ("3 photos uploaded") instead of piling up. Each toast stays long enough to read its text. toast.undo() only saves when the toast closes; Undo or Ctrl/⌘+Z cancels it.
Cons: An undo that's never closed (tab closed first) never commits, so save on page exit too. One shortcut for the newest undo only.

COMPONENT 2: Breadcrumbs
Type: navbar
Live: https://lofistack-sayan.netlify.app/components/breadcrumbs
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/breadcrumbs.tsx
Pros: A ▾ on each level lists the items beside it (other workspaces, projects, settings pages) with a filter for long lists, so you move sideways without going up. Collapsing, tooltips and a mobile back link too.
Cons: You pass the sibling lists yourself. Very long sibling lists aren't virtualised.

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Find and fix real errors on the live site
Agent: Claude Code + Chrome
Workflow: Scanned every page for console/page errors, reproduced each bug locally, narrowed it to the cause, fixed it with the smallest change, and added a test that fails on the old code.
Result: Every page threw React #418: Netlify injects a comment into <head>, which broke hydration; fixed by not rendering our own <head>. The OTP page crashed Chrome: each input started a WebOTP request; now only the focused one does. New CI hydration check. Saved a day.
