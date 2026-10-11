Week: 02

COMPONENT 1: Bangla Phonetic Input
Type: input
Live: https://lofistack-sayan.netlify.app/components/bangla-phonetic-input
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/bangla-phonetic-input/index.tsx
Pros: Type Bangla with English letters, Avro-style: "ami tomake bhalobashi" becomes আমি তোমাকে ভালোবাসি as you type. Suggestion bar, 230-word dictionary, paste-to-convert, Ctrl+M to switch. Works with phone keyboards and screen readers.
Cons: Rule-based with a small dictionary, so rare words may need picking from the suggestions.

COMPONENT 2: Tear-off Ticket Card
Type: card
Live: https://lofistack-sayan.netlify.app/components/ticket-card
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/ticket-card.tsx
Pros: Drag the stub and it tears off the perforation like real paper (or snaps back). Real scannable Code 39 barcode, Add to calendar (.ics), used-ticket stamp, keyboard scissors button.
Cons: The barcode is Code 39 (letters, numbers, - . space), not a QR code.

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Add a unit test suite for my components
Agent: Claude Code
Workflow: Asked it to add Vitest + Testing Library, test every component's logic and interactions, run them, fix real bugs and explain each failure.
Result: The suite now covers both Week 2 components (Avro rules, conversion, Code 39, .ics, tearing): 156 tests, all passing. It caught real bugs along the way. Saved about half a day.
