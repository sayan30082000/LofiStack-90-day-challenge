import { agentLogPlans, agentLogs, type AgentLog, type AgentLogPlan } from "./agent-logs";
import { PROMPTS, type PromptEntry } from "./prompts.generated";
import { registry, type RegistryEntry } from "./registry";
import { siteConfig } from "./site";

export const WEEKS = 15;
export const WEEKS_PER_MONTH = 5;
const DAY = 86_400_000;

export interface PlannedComponent extends PromptEntry {
  /** Present once the component is built and in the registry. */
  built?: RegistryEntry;
}

export interface Week {
  number: number;
  /** Epoch ms, start of the first day (UTC). */
  start: number;
  /** Epoch ms, start of the last day (UTC). */
  end: number;
  components: PlannedComponent[];
  agentLog?: AgentLog;
  /** The planned agent task, shown until the week is logged. */
  agentPlan?: AgentLogPlan;
}

export interface Month {
  number: number;
  weeks: Week[];
  built: number;
  logs: number;
}

const startMs = Date.parse(`${siteConfig.challengeStart}T00:00:00Z`);

function withBuild(p: PromptEntry): PlannedComponent {
  return { ...p, built: registry.find((r) => r.slug === p.slug) };
}

export function getWeeks(): Week[] {
  return Array.from({ length: WEEKS }, (_, i) => {
    const number = i + 1;
    const start = startMs + i * 7 * DAY;
    return {
      number,
      start,
      end: start + 6 * DAY,
      components: PROMPTS.filter((p) => p.week === number).map(withBuild),
      agentLog: agentLogs.find((l) => l.week === number),
      agentPlan: agentLogPlans.find((p) => p.week === number),
    };
  });
}

export function getMonths(): Month[] {
  const weeks = getWeeks();
  return Array.from({ length: WEEKS / WEEKS_PER_MONTH }, (_, i) => {
    const slice = weeks.slice(i * WEEKS_PER_MONTH, (i + 1) * WEEKS_PER_MONTH);
    return {
      number: i + 1,
      weeks: slice,
      built: slice.flatMap((w) => w.components).filter((c) => c.built).length,
      logs: slice.filter((w) => w.agentLog).length,
    };
  });
}

export function getSpares(): PlannedComponent[] {
  return PROMPTS.filter((p) => p.week === null).map(withBuild);
}

export function formatRange(start: number, end: number) {
  const f = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${f.format(start)} – ${f.format(end)}`;
}

const bare = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/+$/, "");

export function codeUrl(entry: RegistryEntry) {
  return `${siteConfig.repoUrl}/blob/main/components/ui/${entry.codePath}`;
}

/** lofidb component post, in the pinned template. */
export function componentPost(c: PlannedComponent, week: number) {
  const codePath = c.built?.codePath ?? `${c.slug}.tsx`;
  return [
    `Week: ${String(week).padStart(2, "0")}`,
    `Type: ${c.type}`,
    `Component: ${c.name}`,
    `Live: ${bare(siteConfig.url)}/components/${c.slug}`,
    `Repo: ${bare(siteConfig.repoUrl)}/blob/main/components/ui/${codePath}`,
    "Prompt:",
    c.prompt,
  ].join("\n");
}

/** lofidb agent log post, in the pinned template. */
export function agentLogPost(log: AgentLog) {
  const week = `Week: ${String(log.week).padStart(2, "0")}`;
  if (!log.automated) {
    return [week, `Task that an agent could not handle: ${log.task}`, `Why it could not: ${log.result}`, `What you tried: ${log.workflow}`].join("\n");
  }
  return [week, `Task: ${log.task}`, `Agent: ${log.agent}`, "Prompt or workflow:", log.workflow, `Result: ${log.result}`].join("\n");
}

/** Draft lofidb agent log post from a plan; the result is filled in after running it. */
export function agentPlanPost(plan: AgentLogPlan) {
  return [
    `Week: ${String(plan.week).padStart(2, "0")}`,
    `Task: ${plan.task}`,
    `Agent: ${plan.agent}`,
    "Prompt or workflow:",
    plan.prompt,
    "Result: [what it produced and what it saved you, after you run it]",
  ].join("\n");
}
