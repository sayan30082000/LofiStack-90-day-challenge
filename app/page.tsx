import Link from "next/link";
import { ArrowUpRight, Bot, Code2, Eye, Rocket } from "lucide-react";
import { PromptDialog } from "@/components/gallery/PromptDialog";
import { ThisWeek } from "@/components/gallery/ThisWeek";
import { agentLogs } from "@/lib/agent-logs";
import {
  WEEKS,
  WEEKS_PER_MONTH,
  agentLogPost,
  agentPlanPost,
  codeUrl,
  componentPost,
  formatRange,
  getMonths,
  getSpares,
  type PlannedComponent,
  type Week,
} from "@/lib/challenge";
import { SETUP_PROMPT } from "@/lib/prompts.generated";
import { registry } from "@/lib/registry";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const LEVELS = {
  1: { label: "Easy", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  2: { label: "Medium", className: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  3: { label: "Hard", className: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
} as const;

const COMPONENTS_PER_MONTH = 10;
const LOGS_PER_MONTH = 4;

export default function Home() {
  const months = getMonths();
  const spares = getSpares();
  const weeks = months.flatMap((m) => m.weeks);
  const built = registry.length;
  const logs = agentLogs.length;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            LofiStack 90 Day Build Challenge
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {siteConfig.ownerName}&apos;s {siteConfig.title}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Every week of the challenge in one place: 2 components with their live demo, code and build prompt, plus the
            week&apos;s agent log. {formatRange(weeks[0].start, weeks[weeks.length - 1].end)}.
          </p>
          <div className="mt-5">
            <PromptDialog
              title="Gallery setup prompt"
              subtitle="Run once before week 1: it scaffolds this site."
              prompt={SETUP_PROMPT}
              triggerLabel="Setup prompt"
              triggerIcon={<Rocket className="size-3.5" aria-hidden />}
            />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:min-w-[22rem]">
          <Stat label="Components (Track A)" value={built} total={siteConfig.target} />
          <Stat label="Agent logs (Track B)" value={logs} total={WEEKS} />
        </dl>
      </header>

      <div className="mt-14 flex flex-col gap-14">
        {months.map((m) => (
          <section key={m.number} aria-labelledby={`month-${m.number}`}>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
              <div>
                <h2 id={`month-${m.number}`} className="text-xl font-semibold tracking-tight">
                  Month {m.number}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Weeks {(m.number - 1) * WEEKS_PER_MONTH + 1}–{m.number * WEEKS_PER_MONTH} ·{" "}
                  {formatRange(m.weeks[0].start, m.weeks[m.weeks.length - 1].end)} · reviewed at month end
                </p>
              </div>
              <div className="flex gap-6">
                <Meter label="Components" value={m.built} total={COMPONENTS_PER_MONTH} />
                <Meter label="Agent logs" value={m.logs} total={LOGS_PER_MONTH} />
              </div>
            </div>
            <ol className="mt-4 flex flex-col gap-3">
              {m.weeks.map((w) => (
                <WeekCard key={w.number} week={w} />
              ))}
            </ol>
          </section>
        ))}

        <section aria-labelledby="spares">
          <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
              <div>
                <h2 id="spares" className="text-lg font-semibold tracking-tight">
                  Spare ideas · {spares.length}
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Swap one in if a teammate already claimed a planned component. Each has its build prompt.
                </p>
              </div>
              <span className="text-sm text-zinc-500 group-open:hidden dark:text-zinc-400">Show</span>
              <span className="hidden text-sm text-zinc-500 group-open:inline dark:text-zinc-400">Hide</span>
            </summary>
            <ul className="grid grid-cols-1 gap-3 border-t border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-800">
              {spares.map((c) => (
                <li key={c.n} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <ComponentTitle c={c} />
                  <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">{c.sum}</p>
                  <div className="flex flex-wrap gap-2">
                    {c.built && <BuiltLinks c={c} />}
                    <PromptDialog title={`#${c.n} ${c.name}`} subtitle={`Spare idea · ${c.type}`} prompt={c.prompt} />
                  </div>
                </li>
              ))}
            </ul>
          </details>
        </section>
      </div>
    </main>
  );
}

function WeekCard({ week }: { week: Week }) {
  const done = week.components.filter((c) => c.built).length;
  const complete = done === week.components.length && Boolean(week.agentLog);
  const started = done > 0 || Boolean(week.agentLog);
  const status = complete ? "Complete" : started ? "In progress" : "Planned";
  const tag = `Week ${String(week.number).padStart(2, "0")}`;

  return (
    <li
      id={`week-${week.number}`}
      className="grid scroll-mt-20 grid-cols-1 gap-4 rounded-xl border border-zinc-200 p-4 md:grid-cols-[10rem_minmax(0,1fr)] dark:border-zinc-800"
    >
      <div className="flex flex-row flex-wrap items-center gap-2 md:flex-col md:items-start">
        <h3 className="font-mono text-sm font-semibold">{tag}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatRange(week.start, week.end)}</p>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              complete
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                : started
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
            )}
          >
            {status}
          </span>
          <ThisWeek start={week.start} end={week.end} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {week.components.map((c) => (
          <div key={c.n} className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <ComponentTitle c={c} />
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.sum}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {c.built && <BuiltLinks c={c} />}
              <PromptDialog
                title={`#${c.n} ${c.name}`}
                subtitle={`${tag} · ${c.type}${c.built ? "" : " · not built yet"}`}
                prompt={c.prompt}
                post={c.built ? componentPost(c, week.number) : undefined}
              />
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-3 py-3 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <Bot className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
            {week.agentLog ? (
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Agent log · <span className="font-normal text-zinc-500 dark:text-zinc-400">{week.agentLog.agent}</span>
                </p>
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{week.agentLog.task}</p>
              </div>
            ) : week.agentPlan ? (
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Agent task · <span className="font-normal text-zinc-500 dark:text-zinc-400">{week.agentPlan.kind}</span>
                </p>
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {week.agentPlan.task} <span className="text-zinc-500 dark:text-zinc-400">· {week.agentPlan.agent}</span>
                </p>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-sm font-medium">Agent log</p>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Not added yet. Add this week&apos;s entry to <code className="font-mono text-xs">lib/agent-logs.ts</code>.
                </p>
              </div>
            )}
          </div>
          {week.agentLog ? (
            <div className="shrink-0">
              <PromptDialog
                title={`${tag} agent log`}
                subtitle={week.agentLog.automated ? "Done with an AI agent" : "Could not be done by an agent"}
                prompt={agentLogPost(week.agentLog)}
                copyLabel="Copy lofidb post"
                triggerLabel="Log"
              />
            </div>
          ) : (
            week.agentPlan && (
              <div className="shrink-0">
                <PromptDialog
                  title={`${tag} agent task: ${week.agentPlan.kind}`}
                  subtitle={`Run it with ${week.agentPlan.agent}, then add the real result to lib/agent-logs.ts`}
                  prompt={week.agentPlan.prompt}
                  post={agentPlanPost(week.agentPlan)}
                  postLabel="Copy draft post"
                />
              </div>
            )
          )}
        </div>
      </div>
    </li>
  );
}

function ComponentTitle({ c }: { c: PlannedComponent }) {
  const level = LEVELS[c.lvl];
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">#{String(c.n).padStart(2, "0")}</span>
      <span className="font-medium">{c.name}</span>
      <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
        {c.type}
      </span>
      <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium", level.className)}>{level.label}</span>
      {c.built && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          Live
        </span>
      )}
    </div>
  );
}

const ACTION =
  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

function BuiltLinks({ c }: { c: PlannedComponent }) {
  if (!c.built) return null;
  return (
    <>
      <Link
        href={`/components/${c.slug}`}
        className={cn(ACTION, "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300")}
      >
        <Eye className="size-3.5" aria-hidden /> Demo
      </Link>
      <a
        href={codeUrl(c.built)}
        target="_blank"
        rel="noreferrer"
        className={cn(
          ACTION,
          "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
        )}
      >
        <Code2 className="size-3.5" aria-hidden /> Code
        <ArrowUpRight className="size-3 opacity-60" aria-hidden />
        <span className="sr-only">(opens GitHub in a new tab)</span>
      </a>
    </>
  );
}

function Stat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">
        {value}
        <span className="text-base font-normal text-zinc-500 dark:text-zinc-400"> / {total}</span>
      </dd>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden>
        <div
          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
          style={{ width: `${Math.min(100, (value / total) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Meter({ label, value, total }: { label: string; value: number; total: number }) {
  const met = value >= total;
  return (
    <div className="min-w-28">
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className={cn("font-semibold tabular-nums", met && "text-emerald-700 dark:text-emerald-400")}>
          {value}/{total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} this month`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          className={cn("h-full rounded-full", met ? "bg-emerald-600 dark:bg-emerald-400" : "bg-indigo-600 dark:bg-indigo-400")}
          style={{ width: `${Math.min(100, (value / total) * 100)}%` }}
        />
      </div>
    </div>
  );
}
