Week: 09

COMPONENT 1: Newsletter Signup
Type: form
Live: https://lofistack-sayan.netlify.app/components/newsletter-signup
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/newsletter-signup.tsx
Pros: Catches mistyped emails before sending ("Did you mean jane@gmail.com?" for gmial.com or hotmail.con) without "fixing" real domains like .ca. After joining, an "Open Gmail/Outlook/Yahoo" button goes straight to the confirmation email.
Cons: Typo check knows common providers only. Inbox button only for known webmail.

COMPONENT 2: Data Table
Type: table
Live: https://lofistack-sayan.netlify.app/components/data-table
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/data-table.tsx
Pros: The search box filters: role:admin spend>5000 joined<2024 -status:suspended. Each filter becomes a removable chip, a misspelled column gets "Did you mean role?", and a summary row totals the matches (or just the selected rows).
Cons: Filters are AND only (no OR yet). Client-side, so very large data needs paging from a server.

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Research and compare 4 React UI libraries (shadcn/ui, Mantine, Chakra UI, Headless UI) and find ideas none of them offers
Agent: Claude Code (research sub-agent with web search)
Workflow: Compare styling, accessibility, theming and bundle impact from official docs, 3 strong components each, then 5 ideas none offers, checked against all four and my 72 planned components. Cite every page, never guess numbers.
Result: 49 sources read; table + 5 new ideas (Query Builder, Signature Pad, Shortcuts Sheet, Image Hotspots, Scrollytelling). One will replace my Week 14 slider that a teammate already built. Saved ~3 hours.
