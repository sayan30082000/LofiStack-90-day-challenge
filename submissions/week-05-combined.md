Week: 05

COMPONENT 1: OTP Input
Type: input
Live: https://lofistack-sayan.netlify.app/components/otp-input
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/otp-input.tsx
Pros: Paste the whole SMS and it finds the code, ignoring phone numbers and amounts. WebOTP autofill on Android, expiry countdown, resend cooldown that grows (30s, 60s, 120s), attempts-left warning.
Cons: WebOTP only works in Chrome on Android with a specially formatted SMS. The expiry timer trusts the device clock.

COMPONENT 2: Activity Heatmap
Type: chart
Live: https://lofistack-sayan.netlify.app/components/activity-heatmap
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/activity-heatmap.tsx
Pros: Explains itself: insight buttons (longest streak, current streak, busiest weekday, best month) light up exactly those days on the calendar. Hand-built SVG, keyboard navigation, year selector.
Cons: Daily counts only, no hours. Needs horizontal scroll on phones for a full year.

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Clean and validate the site's own data (prompt library, registry, agent logs, Bangla dictionary)
Agent: Claude Code
Workflow: Asked it to treat the project data like a messy spreadsheet: check for duplicates, wrong labels, empty fields, invisible characters and broken links, snapshot before changing anything, clean, and turn every check into a test.
Result: 131 of 236 dictionary entries were useless (the rules already spelled them right) and were removed; a snapshot test proves all 236 words still convert the same. 12 data checks now run in npm test. Saved about 2 hours.
