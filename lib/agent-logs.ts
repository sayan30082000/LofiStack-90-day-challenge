/** Track B: one agent log per week, each a different kind of task. */
export interface AgentLog {
  week: number;
  /** What the task was. */
  task: string;
  /** Claude, n8n, Zapier… */
  agent: string;
  /** The prompt or workflow you used. */
  workflow: string;
  /** What it produced and what it saved you. */
  result: string;
  /** false when the week's task could not be done by an agent. Then `result` explains why. */
  automated: boolean;
}

/** A planned agent task for a week that hasn't been logged yet. */
export interface AgentLogPlan {
  week: number;
  /** The kind of task. Track B needs a different kind every week. */
  kind: string;
  task: string;
  /** Suggested agent. Use any you like. */
  agent: string;
  /** Ready-to-run prompt or workflow. */
  prompt: string;
}

/**
 * Completed logs. When you finish a week's task, add it here (copy the plan's
 * task and prompt, then write the real result), and push.
 */
export const agentLogs: AgentLog[] = [
  {
    week: 1,
    task: "Set up the component gallery, build Tree View and Typing Indicator, then audit them against the challenge rules and make them original",
    agent: "Claude Code",
    workflow:
      "1) Gave Claude Code the challenge brief and the #49 and #54 prompts from my prompt library. It scaffolded Next.js + TypeScript + Tailwind v4 and built both components with demo pages. 2) Pasted both official challenge posts and asked it to check the project against every rule and make Week 1 the smartest it could be. 3) It turned Tree View into a change-aware tree (git-style A/M/R markers, folder roll-ups, new-since-last-visit dots saved between visits, a changes-only view, Alt+arrow jumps, and a permissions diff before saving) and added a \"changed their mind\" state to the Typing Indicator. 4) It verified with TypeScript, ESLint, a production build and browser tests at desktop and 375px, then updated the build prompts and regenerated the lofidb posts.",
    result:
      "2 tested components that go beyond the usual versions, plus ready-to-post lofidb submissions, across two Claude Code sessions. The audit also caught that Week 1 was due the same day, that the site still had placeholder links, and that generic components risked failing the originality rule. Saved roughly two days of setup and building.",
    automated: true,
  },
  {
    week: 2,
    task: "Add a unit test suite for my components",
    agent: "Claude Code",
    workflow:
      "Asked Claude Code to add Vitest + Testing Library and write unit tests for the password scorer, crack-time estimate, best-fix tip and passphrase generator, the Flip Card's press direction and hold-to-peek, the Tree View's change tracking, and the typing hook's \"changed their mind\" state. Run them, fix real bugs, and explain every failure.",
    result:
      "53 tests in 4 files, all passing (npm test). While writing them it caught a real bug: the crack-time estimate rated \"hello world\" at 48 years and \"correct horse battery staple\" at millions of years because it ignored dictionary words. It now rates them 1 second and centuries, and l33t passwords like Tr0ub4dor&3 as instant. It also fixed a dependency conflict (@types/node 20 to 22, matching Netlify's Node 22). When Week 2 was swapped for the Bangla Phonetic Input and Tear-off Ticket Card, the suite grew to cover them too (Avro rules, conversion, Code 39, .ics, tearing): 156 tests, all passing. Saved about half a day.",
    automated: true,
  },
  {
    week: 3,
    task: "Generate component documentation automatically from the TypeScript source",
    agent: "Claude Code",
    workflow:
      "Asked Claude Code for docs that can't go stale: a script that reads each released component with the TypeScript compiler API, turns every exported Props/Options interface into a table (name, type, default from the function signature, JSDoc description), lists the real exports for the import line, and links the live demo, source and build prompt. Wired it to npm run docs and linked the result from the README.",
    result:
      "docs/ now has a page for each of the 6 released components, 195 props documented, regenerated in about a second with npm run docs. Its first draft built the import line from interface names and invented two exports that don't exist (TypingActivity, MeasureSkeleton); checking the output caught it and it now reads the real exports. Saved about 3 hours of hand-written docs, and every future week is documented for free.",
    automated: true,
  },
  {
    week: 4,
    task: "Accessibility audit of every released page, fixing everything that fails",
    agent: "Claude Code",
    workflow:
      "Asked Claude Code to audit the site with axe-core (WCAG 2.0, 2.1 and 2.2, A and AA) in my installed Chrome via playwright-core: the homepage and every released component page, light and dark, at 375px and 1280px, plus interactive states (open dialog, undo bar, plan finder, passphrase suggestion, changes-only tree). Fix each violation in the component, not the test, re-run until clean, and add a check to npm test so it stays clean.",
    result:
      "The first run found 420 violations (73 unique elements) on every page: faint grey text at 2.6:1 in light and 4.1:1 in dark mode, code-highlighting colours down to 3.3:1, a disabled field that faded its own labels, and scrollable tables, code blocks and prompts that keyboard users couldn't reach. After the fixes all 56 runs report 0 violations. npm run a11y re-runs the audit and writes docs/a11y-report.md, and 28 new axe tests in npm test (116 total) guard every demo. Saved about a day of manual checking.",
    automated: true,
  },
  {
    week: 5,
    task: "Clean and validate the gallery's own data: the prompt library, registry, agent logs and Bangla dictionary",
    agent: "Claude Code",
    workflow: "Treat this project's data like a messy spreadsheet. Check the prompt library (unique numbers, slugs and names; only the challenge's Type labels; 2 per week; no empty fields, stray or invisible characters; kebab-case slugs; every prompt names its route), the registry against the prompts and the files on disk, the agent logs for repeated weeks or task kinds, and the Bangla dictionary for bad keys, unnormalised Unicode and entries the transliteration rules already produce. Snapshot the dictionary before changing anything, clean it, and turn every check into a test so bad data fails the build.",
    result:
      "The prompt library, registry and logs were clean. The Bangla dictionary wasn't: 131 of its 236 entries (56%) did nothing, because the rules already spelled those words exactly right (ami → আমি, kintu → কিন্তু). Removing them left 105 real exceptions. A snapshot test proves all 236 words still give the same first suggestion. 12 data checks now run in npm test, so bad data fails the build before it reaches the site. Saved about 2 hours of manual checking.",
    automated: true,
  },
  {
    week: 6,
    task: "Draft two emails: a progress update to the challenge lead and a note to a teammate about duplicate components",
    agent: "Claude Code",
    workflow: "Draft two emails using only facts from this repo (registry, git history, prompt library), with [placeholders] for anything you don't know. 1) A progress update to the challenge lead: Weeks 1–6 with links, the late Week 5, and why Week 2 was swapped. 2) A note to Muntasir, whose Week 1 Before-After Slider clashes with my planned Week 14, suggesting we share plans ahead. Each under 250 words, friendly and direct. Save them as drafts outside the public repo and don't send anything.",
    result:
      "Two ready-to-edit drafts in about 10 minutes, every claim traceable to the repo. Writing them surfaced a real problem: my Week 14 Before/After Slider has to be replaced before Week 14. The drafts are kept outside the public repo and were not sent; sending them is my decision. Saved about 45 minutes.",
    automated: true,
  },
  {
    week: 7,
    task: "Turn a real team meeting transcript into decisions, action items and open questions, and check the meeting tool's own action items",
    agent: "Claude Code (a sub-agent reading the Fireflies transcript)",
    workflow: "From this meeting transcript (exported from Fireflies), produce: 1) decisions made, with timestamps, 2) action items as a table (task, owner, due date, priority, timestamp), 3) open questions, 4) a 5-line summary I can paste into the team chat. Don't invent owners or dates that aren't in the transcript; mark them \"unassigned\" / \"no date\". Then compare your list with the action items Fireflies generated itself: what did it miss, and which of its items are wrong, duplicated or vague? Quote the line that shows it. Keep the output private, outside the public repo.",
    result:
      "From a 55-minute team meeting: 15 decisions (2 tentative), 28 action items and 14 open questions. Only 5 tasks had a date said aloud and 7 had no clear owner, so it flagged those instead of guessing. Against Fireflies' own list it found 10 tasks Fireflies missed (including the one approval a launch was waiting on) and 15 of Fireflies' 28 items that were wrong, duplicated, vague or already settled later in the meeting, e.g. a task given to the person who asked the question rather than the one who said \"I have to check that\". The transcript stays private; only these counts are public. Saved about an hour of note-taking and checking.",
    automated: true,
  },
  {
    week: 8,
    task: "Automate the checks on every push with a GitHub Actions CI workflow",
    agent: "Claude Code + GitHub Actions",
    workflow: "Write a GitHub Actions workflow for this repo that runs on every push to main and every pull request: install with npm ci, type-check, lint, the Vitest suite, a check that the generated docs/ are up to date, a production build, then start the built site and run the full axe accessibility audit (npm run a11y) in the Chrome the runner already has. Put the audit report in the run summary, keep it as an artifact, and add a CI badge to the README. Then push it, watch the first runs and fix whatever fails.",
    result:
      "Run #1 failed at the type-check after 1 minute: in a fresh checkout the route types (LayoutProps) that next build generates don't exist yet, which never shows up locally. It reproduced the failure in a clean clone, fixed it with next typegen before tsc, and checked lint, the 248 tests and the docs check in that clone before pushing. Run #2 passed every step in 4 min 23 s, including the accessibility audit (136 page/state runs, no violations). Every push is now checked without me running anything. Saves about 20 minutes per release.",
    automated: true,
  },
  {
    week: 9,
    task: "Research and compare 4 React UI libraries (shadcn/ui, Mantine, Chakra UI, Headless UI), then find component ideas none of them offers",
    agent: "Claude Code (a research sub-agent with web search)",
    workflow: "Using web search and the libraries' own docs (official sites, GitHub, npm), compare shadcn/ui, Mantine, Chakra UI and Headless UI on styling, accessibility, theming and install/bundle impact, with 3 components each does especially well. Then propose 5 component ideas none of them offers (check each against all four component lists and against my 72 planned components), each with a challenge Type. Cite every page you read, never guess versions or sizes, and mark anything you couldn't verify.",
    result:
      "A sub-agent read 49 sources (official docs, GitHub, npm, bundlephobia) and wrote research/week-09-library-research.md: a comparison table, a section per library, 5 new ideas (Query Builder, Signature Pad, Keyboard Shortcuts Sheet, Image Hotspot Showcase, Scrollytelling Feature Section) and a not-verified list. Useful finds: shadcn/ui switched its default foundation to Base UI in July 2026 and added React Aria; whole-package sizes (gzip, before tree-shaking) are about 63 KB for Headless UI, 191 KB for Mantine core and 331 KB for Chakra. The two section ideas give me a replacement for my Week 14 Before/After Slider, which a teammate already built. Saved about 3 hours of reading.",
    automated: true,
  },
  {
    week: 10,
    task: "Find and fix real errors on the live site: a hydration error on every page and a crash on the OTP page",
    agent: "Claude Code + Chrome (playwright-core)",
    workflow: "Visit every released page in Chrome (light/dark, 375/1280px), collect console errors, page errors and failed requests, then for each problem reproduce it locally, find the root cause by narrowing it down, fix it with the smallest change, prove the fix with a test that fails on the old code, and add a guard so it can't come back.",
    result:
      "Found two real bugs. 1) Every live page threw React error #418 (hydration mismatch), so React threw away the server HTML and re-rendered each page in the browser. The same build had no error locally, so it compared the live HTML with a local build, ruled out Netlify's HUD script by blocking and removing it, and found Netlify injects an HTML comment into <head>; removing just that comment made the error disappear. Fix: the layout no longer renders its own <head> (the theme script moved to the top of <body>, checked for no flash). 2) The OTP page crashed Chrome in development: each OTP input started a WebOTP request on mount, and any two on one page aborted each other until the tab died; fix: only the focused input asks. Guards: npm run check:hydration (now in CI) and a WebOTP test, both failing on the old code. Saved a day of guessing.",
    automated: true,
  },
];

/** One different kind of task per week. Week 1 is already logged above. */
export const agentLogPlans: AgentLogPlan[] = [
  {
    week: 1,
    kind: "Project setup and coding",
    task: "Scaffold the gallery and build the first two components",
    agent: "Claude Code",
    prompt: "Use the gallery setup prompt, then the #49 and #54 component prompts from the homepage.",
  },
  {
    week: 2,
    kind: "Unit tests",
    task: "Add a unit test suite for the Week 1 and Week 2 components",
    agent: "Claude Code",
    prompt: `In this Next.js project, add Vitest + @testing-library/react and write unit tests for:
1. the exported scorePassword() in components/ui/password-strength-input.tsx: empty, short, common, mixed and very strong passwords, plus every default rule;
2. components/ui/otp-input.tsx: typing auto-advances, Backspace moves back, pasting "123456" fills every box, onComplete fires once.
Add an "npm test" script, run the tests, fix any real bug you find in the components, and list what each test covers.`,
  },
  {
    week: 3,
    kind: "Documentation",
    task: "Generate component documentation automatically from the TypeScript source",
    agent: "Claude",
    prompt: `Read every file in components/ui/ and write a README section per component: one-line purpose, an install/import line, a minimal usage example, and a props table (name, type, default, description) taken from the TypeScript interface. Keep each section under 25 lines and order them by challenge week.`,
  },
  {
    week: 4,
    kind: "Accessibility audit",
    task: "Accessibility audit of every released page, fixing everything that fails",
    agent: "Claude Code",
    prompt: `Install @axe-core/playwright, start the site, and run axe on the homepage and every /components/<slug> page in light and dark mode at 375px and 1280px. Fix each violation in the component (not the test), re-run until clean, and give me a table: page, issue, WCAG rule, fix.`,
  },
  {
    week: 5,
    kind: "Data cleanup",
    task: "Clean and validate the gallery's own data: the prompt library, registry, agent logs and Bangla dictionary",
    agent: "Claude Code",
    prompt: `Treat this project's data like a messy spreadsheet. Check the prompt library (unique numbers, slugs and names; only the challenge's Type labels; 2 per week; no empty fields, stray or invisible characters; kebab-case slugs; every prompt names its route), the registry against the prompts and the files on disk, the agent logs for repeated weeks or task kinds, and the Bangla dictionary for bad keys, unnormalised Unicode and entries the transliteration rules already produce. Snapshot the dictionary before changing anything, clean it, and turn every check into a test so bad data fails the build.`,
  },
  {
    week: 6,
    kind: "Email drafting",
    task: "Draft two emails: a progress update to the challenge lead and a note to a teammate about duplicate components",
    agent: "Claude Code",
    prompt: `Draft two emails using only facts from this repo (registry, git history, prompt library), with [placeholders] for anything you don't know. 1) A progress update to the challenge lead: Weeks 1–6 with links, the late Week 5, and why Week 2 was swapped. 2) A note to Muntasir, whose Week 1 Before-After Slider clashes with my planned Week 14, suggesting we share plans ahead. Each under 250 words, friendly and direct. Save them as drafts outside the public repo and don't send anything.`,
  },
  {
    week: 7,
    kind: "Meeting notes to action items",
    task: "Turn a real team meeting transcript into decisions, action items and open questions, and check the meeting tool's own action items",
    agent: "Claude Code",
    prompt: `From this meeting transcript (exported from Fireflies), produce: 1) decisions made, with timestamps, 2) action items as a table (task, owner, due date, priority, timestamp), 3) open questions, 4) a 5-line summary I can paste into the team chat. Don't invent owners or dates that aren't in the transcript; mark them "unassigned" / "no date". Then compare your list with the action items Fireflies generated itself: what did it miss, and which of its items are wrong, duplicated or vague? Quote the line that shows it. Keep the output private, outside the public repo.`,
  },
  {
    week: 8,
    kind: "Workflow automation",
    task: "Automate the checks on every push with a GitHub Actions CI workflow",
    agent: "Claude Code + GitHub Actions",
    prompt: `Write a GitHub Actions workflow for this repo that runs on every push to main and every pull request: install with npm ci, type-check, lint, the Vitest suite, a check that the generated docs/ are up to date, a production build, then start the built site and run the full axe accessibility audit (npm run a11y) in the Chrome the runner already has. Put the audit report in the run summary, keep it as an artifact, and add a CI badge to the README. Then push it, watch the first runs and fix whatever fails.`,
  },
  {
    week: 9,
    kind: "Research summary",
    task: "Research and compare 4 React UI libraries (shadcn/ui, Mantine, Chakra UI, Headless UI), then find component ideas none of them offers",
    agent: "Claude Code (with web search)",
    prompt: `Using web search and the libraries' own docs (official sites, GitHub, npm), compare shadcn/ui, Mantine, Chakra UI and Headless UI on styling, accessibility, theming and install/bundle impact, with 3 components each does especially well. Then propose 5 component ideas none of them offers (check each against all four component lists and against my 72 planned components), each with a challenge Type. Cite every page you read, never guess versions or sizes, and mark anything you couldn't verify.`,
  },
  {
    week: 10,
    kind: "Debugging",
    task: "Find and fix real errors on the live site: a hydration error on every page and a crash on the OTP page",
    agent: "Claude Code",
    prompt: `Visit every released page in Chrome (light/dark, 375/1280px), collect console errors, page errors and failed requests, then for each problem reproduce it locally, find the root cause by narrowing it down, fix it with the smallest change, prove the fix with a test that fails on the old code, and add a guard so it can't come back.`,
  },
  {
    week: 11,
    kind: "Code review and refactor",
    task: "Review the 10 newest components for duplication and refactor shared logic",
    agent: "Claude Code",
    prompt: `Review components/ui/ for repeated logic (controlled/uncontrolled state, outside-click handling, focus traps, keyboard lists). Propose shared hooks in lib/hooks/, refactor the components to use them without changing behaviour, run lint and the build, and summarise the lines removed per component.`,
  },
  {
    week: 12,
    kind: "Content and copywriting",
    task: "Write launch copy for the gallery: site intro, LinkedIn post and 3 tweets",
    agent: "Claude",
    prompt: `Write launch copy for my component gallery (link and component list below): a 2-sentence homepage intro, a LinkedIn post under 180 words with 3 highlights, and 3 short posts for X, each featuring one component with its direct link. Plain, confident tone, no hype words.`,
  },
  {
    week: 13,
    kind: "Translation and localisation",
    task: "Translate every component's default labels into Bangla",
    agent: "Claude Code",
    prompt: `List every user-facing default string in components/ui/ (labels, placeholders, aria-labels, status text). Add a Bangla translation for each in lib/i18n/bn.ts, add a language toggle to two demos that passes the Bangla strings through the existing props, and flag any component whose text can't be overridden by props.`,
  },
  {
    week: 14,
    kind: "Performance audit",
    task: "Run Lighthouse on the live site and fix the biggest issues",
    agent: "Claude Code",
    prompt: `Run Lighthouse (mobile) on the live homepage and the 5 heaviest component pages. Report performance, LCP, CLS and TBT per page, find the 3 biggest causes, fix them (e.g. code-split heavy demos, lazy-load below-the-fold previews), redeploy and report before/after numbers.`,
  },
  {
    week: 15,
    kind: "Report generation",
    task: "Generate the 90-day challenge report from the git history",
    agent: "Claude Code",
    prompt: `Use git log and lib/registry.ts to write a 90-day report: components shipped per week and month, component types covered, total commits and lines added, the 3 most complex components and why, and lessons learned. Output it as a Markdown file plus a 5-line summary for HR.`,
  },
];
