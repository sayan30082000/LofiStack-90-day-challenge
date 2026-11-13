# Week 08 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 08
Type: form
Component: Multi-Step Form Wizard
Live: lofistack-sayan.netlify.app/components/multi-step-form
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/multi-step-form.tsx
Prompt:
Build the "Multi-Step Form Wizard" component (#17, Type: form) for my LofiStack component gallery.
Route: /components/multi-step-form

What it does:
- A complete config-driven wizard: steps as { id, title, description?, render(ctx), validate?(values) (sync or async), summary?(values) }; per-step validation on Continue with focus moved to the first invalid field; a segmented progress header whose completed steps are clickable; an optional Review step built from summaries with Edit links and “Save and review”; async submit with spinner, inline error and a success screen with Start over; slide transitions.
- Steps that follow the answers: WizardStep.when?(values) shows a step only when it returns true (e.g. a Billing step only for paid plans). Exported pure activeSteps(steps, values). The header count, the clickable steps and the time left update as soon as an answer changes, and a visible note under the step count says “Added a step: Billing. 5 steps now.” / “Removed a step: Billing. 4 steps now.” (also announced). Steps are tracked by id, so adding or removing one never moves you to a different step.
- Save and resume (persistKey): values and the current step are saved to localStorage as you go (never before the person answers the resume offer, never the untouched starting form, never fields listed in persistExclude such as passwords). On the next visit a banner says “You have a saved draft from 2 hours ago, at “Billing”.” with Resume (restores values, re-checks which steps apply, returns to that step and focuses it) and Start fresh (deletes the draft). The draft is deleted after a successful submit. Storage errors are caught. Exported pure draftAge(ms).
- Time left: “About 2 min left” in the header from the remaining steps' fields (WizardStep.fields, default 2) × seconds per field (secondsPerField, default 12). After each finished step the estimate moves toward the person's own pace with exported pure updatePace(previous, sample) (60/40 running average, clamped 2–60 s); formatTimeLeft(seconds) gives “Less than a minute left” or “About N min left”.

Props (export an interface named MultiStepFormProps):
steps: WizardStep<V>[] ({ id, title, description?, render, validate?, summary?, when?, fields? }), initialValues, onSubmit(values): Promise<void>, showReview, title, successTitle, successDescription, onRestart?, persistKey?, persistExclude?, showTimeLeft, secondsPerField, labels (all text incl. stepAdded, stepRemoved, stepCount, timeLeft, resumeTitle, resume, startFresh, resumed), className. Also exports WizardField and wizardInputClass.

Accessibility:
Each step change focuses the new step heading (with “Step 2 of 4” for screen readers) or the first invalid field; fields get aria-invalid/aria-describedby; the progress list is a nav with aria-current="step"; step additions, removals and “Draft restored” go through a status region that is always present; the resume offer has two real buttons; submit errors use role=alert; motion removed with reduced motion.

Demo page shows:
1) Create a workspace: Account → Workspace (async name check) → Plan → Billing (only for Team/Business) → Review, with persistKey so reloading offers to resume, the time-left estimate, and a switch that makes the next submit fail. 2) A two-step feedback form without a review step.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/multi-step-form.tsx (split into a folder components/ui/multi-step-form/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/multi-step-form/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "multi-step-form", type "form").

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
Week: 08
Type: chart
Component: Donut Chart
Live: lofistack-sayan.netlify.app/components/donut-chart
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/donut-chart.tsx
Prompt:
Build the "Donut Chart" component (#64, Type: chart) for my LofiStack component gallery.
Route: /components/donut-chart

What it does:
- A complete hand-built SVG donut: arcs from exported pure computeDonutArcs(values, hidden), parallel-edged gaps, rounded corners, hover/focus push-out with the others dimmed, a center readout (total, or the active category's value and share), a legend whose items toggle categories with a tweened re-flow, tap to pin on touch, loading skeleton, empty and all-hidden states, a fixed colorblind-checked palette assigned by position so hiding never repaints, legend right or bottom by container width.
- Other slice (groupBelow, e.g. 0.04): exported pure groupSmallSlices(data, threshold, otherLabel) merges every slice under the threshold into one neutral-grey Other slice placed last (only when two or more are small). Clicking Other in the ring or the legend opens its own breakdown: those categories as a full donut with their original colors, an “All categories” back button and “Other: 4 small categories”. Hiding a category inside Other shrinks Other in the main view too. Focus moves to the back button and returns to Other.
- Comparison (previous data matched by label, previousLabel e.g. "August"): exported pure compareDonut(data, previous) gives each category's earlier value (null = new) and relative change; a faint thin ring just inside the main ring shows the earlier shares; every legend row gets a ▲ 33% / ▼ 28% / new column; the center shows “· was $240” for the active category; a line above names the biggest rise and drop (exported pure biggestChanges, never counting Other, which mixes categories); the spoken summary and legend names say “up 33% from August”. Other compares with the earlier total of the same small categories.

Props (export an interface named DonutChartProps):
data: { label, value, color? }[], label, size, thickness, gap, cornerRadius, hoverOffset, format, formatPercent, centerLabel, showLegend, legendPosition: 'right' | 'bottom', colors, defaultHidden, onHiddenChange, loading, loadingText, emptyText, allHiddenText, hiddenText, tableHeaders, animationDuration, groupBelow, otherLabel, backLabel, previous?, previousLabel, className

Accessibility:
The SVG is role=img with a full spoken summary including changes; a visually hidden table lists every category; legend toggles use aria-pressed while Other is a plain button named with its count and change (“Other (4), up 48% from August, show the 4 categories”); changes are words, not just arrows, and never rely on red/green; grey text stays AA on the highlighted row; reduced motion removes the tween.

Demo page shows:
1) September expenses with four small categories grouped into Other and a “Compare with August” switch (Dining out up, Transport down, Gifts new). 2) Traffic sources with a 7/30-day switch that re-animates the arcs. 3) Loading, empty and custom colors.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/donut-chart.tsx (split into a folder components/ui/donut-chart/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/donut-chart/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "donut-chart", type "chart").

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
