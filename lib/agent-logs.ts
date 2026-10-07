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
    task: "Write unit tests for the password strength scorer and the OTP input",
    agent: "Claude Code",
    prompt: `In this Next.js project, add Vitest + @testing-library/react and write unit tests for:
1. the exported scorePassword() in components/ui/password-strength-input.tsx: empty, short, common, mixed and very strong passwords, plus every default rule;
2. components/ui/otp-input.tsx: typing auto-advances, Backspace moves back, pasting "123456" fills every box, onComplete fires once.
Add an "npm test" script, run the tests, fix any real bug you find in the components, and list what each test covers.`,
  },
  {
    week: 3,
    kind: "Documentation",
    task: "Generate a docs section for every component in the README",
    agent: "Claude",
    prompt: `Read every file in components/ui/ and write a README section per component: one-line purpose, an install/import line, a minimal usage example, and a props table (name, type, default, description) taken from the TypeScript interface. Keep each section under 25 lines and order them by challenge week.`,
  },
  {
    week: 4,
    kind: "Accessibility audit",
    task: "Audit every component page for accessibility and fix what fails",
    agent: "Claude Code",
    prompt: `Install @axe-core/playwright, start the site, and run axe on the homepage and every /components/<slug> page in light and dark mode at 375px and 1280px. Fix each violation in the component (not the test), re-run until clean, and give me a table: page, issue, WCAG rule, fix.`,
  },
  {
    week: 5,
    kind: "Data cleanup",
    task: "Clean and normalise a messy client spreadsheet",
    agent: "Claude",
    prompt: `Here is a CSV export of client contacts (attached). Remove duplicates, split full names into first/last, standardise phone numbers to E.164 and dates to YYYY-MM-DD, flag rows with invalid emails in a new column, and return the cleaned CSV plus a short summary of every change you made.`,
  },
  {
    week: 6,
    kind: "Email drafting",
    task: "Draft follow-up emails for this week's client conversations",
    agent: "Claude",
    prompt: `Using these call notes (pasted below), draft one follow-up email per client. Each email: a subject line, a 3-sentence recap, the agreed next steps as bullets with owners and dates, and a polite close. Keep each under 150 words and match a friendly, professional tone.`,
  },
  {
    week: 7,
    kind: "Meeting notes to action items",
    task: "Turn the weekly team meeting transcript into decisions and tasks",
    agent: "Claude",
    prompt: `From this meeting transcript (pasted below), produce: 1) decisions made, 2) action items as a table (task, owner, due date, priority), 3) open questions, 4) a 5-line summary I can paste into the team channel. Don't invent owners or dates that aren't in the transcript; mark them "unassigned".`,
  },
  {
    week: 8,
    kind: "Workflow automation",
    task: "Post every new Netlify deploy of the gallery to a Discord channel",
    agent: "n8n (or Zapier)",
    prompt: `Workflow: Netlify "deploy succeeded" outgoing webhook → n8n Webhook node → Set node (site name, deploy URL, commit message, time) → Discord node posting "New gallery deploy: <commit message> · <deploy URL>" to my channel. Add an IF node so failed deploys post a red alert instead.`,
  },
  {
    week: 9,
    kind: "Research summary",
    task: "Compare 4 popular React component libraries for ideas and gaps",
    agent: "Claude (with web search)",
    prompt: `Research shadcn/ui, Mantine, Chakra UI and Headless UI. For each: styling approach, accessibility approach, theming, bundle impact, and 3 components it does especially well. Then list 5 component ideas none of them offer well that I could build next. Cite the pages you used.`,
  },
  {
    week: 10,
    kind: "Debugging",
    task: "Find and fix the cause of a failing build or console error",
    agent: "Claude Code",
    prompt: `The Netlify build log / browser console shows this error (pasted below). Reproduce it locally, find the root cause, fix it with the smallest change, and explain in 3 sentences what was wrong and how the fix prevents it from coming back.`,
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
