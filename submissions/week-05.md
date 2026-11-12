# Week 05 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 05
Type: input
Component: OTP Input
Live: lofistack-sayan.netlify.app/components/otp-input
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/otp-input.tsx
Prompt:
Build the "OTP Input" component (#7, Type: input) for my LofiStack component gallery.
Route: /components/otp-input

What it does:
- Renders `length` boxes (default 6), optionally grouped (groupSize 3 gives 3 + 3). Typing auto-advances; Backspace clears and moves back; Left/Right move. Numeric or alphanumeric, optional masking, onComplete when every box is filled, and error (shake + message), success, loading and disabled states.
- Smart paste (smartPaste, default on): paste a whole message such as "Your code is 482 913. Help: +880 1712 345678" into any box and only the code is filled in. Exported pure extractOtp(text, length, type): finds runs of code characters with optional spaces or dashes, takes only leading groups that add up to exactly `length` (so a phone number or an amount is never cut down to a code), and when several fit picks the one nearest a code word (code, OTP, PIN, passcode, verification, কোড, ওটিপি). Announces "Code found in the pasted message."
- WebOTP (webOtp, default on): where the browser supports navigator.credentials.get({ otp }) (Android Chrome) the code from the SMS fills in by itself; the request is aborted on unmount and skipped silently elsewhere.
- expiresAt (a timestamp) shows "Code expires in 4:59", amber in the last 30 seconds. At zero it calls onExpire once, makes the boxes read-only and says "This code has expired. Request a new one."
- onResend shows "Resend code in 0:30", then a Resend code button; each resend waits longer (resendCooldowns, default [30, 60, 120] seconds). attemptsLeft of 2 or fewer shows "1 attempt left". Every string can be replaced through otpLabels (DEFAULT_OTP_LABELS).

Props (export an interface named OtpInputProps):
length, value? / defaultValue, onChange, onComplete, type: 'numeric' | 'alphanumeric', mask, error?: string, success, successMessage, loading, disabled, autoFocus, groupSize, label, smartPaste, webOtp, expiresAt?, onExpire?, onResend?, resendCooldowns, attemptsLeft?, otpLabels

Accessibility:
Each box has aria-label "Digit 1 of 6"; inputMode numeric; autocomplete="one-time-code" on the first box; the error is linked with aria-describedby; a polite status announces a code found in a pasted message or read from the SMS; the countdown is plain text, so it is never read out every second.

Demo page shows:
1) A simulated SMS with a Copy the whole message button: paste it into the boxes; 5-minute expiry, attempts left and resend cooldowns of 15/30/60 seconds. 2) A verify-your-email card where 123456 succeeds. 3) A 4-digit masked PIN. 4) Disabled and alphanumeric examples.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/otp-input.tsx (split into a folder components/ui/otp-input/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/otp-input/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "otp-input", type "input").

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
Week: 05
Type: chart
Component: Activity Heatmap
Live: lofistack-sayan.netlify.app/components/activity-heatmap
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/activity-heatmap.tsx
Prompt:
Build the "Activity Heatmap" component (#63, Type: chart) for my LofiStack component gallery.
Route: /components/activity-heatmap

What it does:
- Hand-built SVG grid of the last 365 days (weeks as columns, 7 rows), 5 intensity levels from thresholds or quantiles, month and weekday labels, a Less to More legend, tooltips ("12 contributions on Mar 4, 2026"), onDayClick, a year selector, and horizontal scrolling on mobile that starts at the latest week.
- Exported pure computeHeatmapInsights(data, start, end): total, active days, average per active day, longest streak and current streak with their dates (today may still be empty without breaking the current streak), busiest weekday, best month and busiest day.
- Insights row (insights, default on) of toggle buttons: "Longest streak: 23 days (Mar 2 – Mar 24)", "Current streak: 5 days", "Most active on Tuesdays", "Best month: March (412)". Pressing one fades every other cell and outlines exactly the days behind it; pressing again or changing the year clears it.
- Loading, empty and error states. Labels come from insightLabels (DEFAULT_INSIGHT_LABELS) so they can be translated.

Props (export an interface named ActivityHeatmapProps):
data: { date: string, count: number }[], endDate?, levels?, colorScale?, onDayClick?, selectedDate?, weekStart: 0 | 1, unit, unitSingular?, locale?, range? / defaultRange / onRangeChange, showYearSelector, focusableCells, loading, error?, emptyText, insights, insightLabels

Accessibility:
With focusableCells the calendar is a role=grid of labelled cells with arrow-key movement, otherwise a role=img with a summary; insight buttons use aria-pressed and their visible text is their name; highlighting never relies on colour alone (lit cells get an outline); the scroll area is focusable and labelled.

Demo page shows:
1) Seeded contributions with the insight buttons, the yearly total, active days and a details panel for the clicked day. 2) A reading log with a custom colour scale and thresholds. 3) Loading, empty and error states.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/activity-heatmap.tsx (split into a folder components/ui/activity-heatmap/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/activity-heatmap/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "activity-heatmap", type "chart").

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
