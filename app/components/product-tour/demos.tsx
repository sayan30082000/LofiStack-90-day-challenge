"use client";

import { useId, useState } from "react";
import { FolderKanban, Home, Inbox, Plus, Search, Settings, Sparkles, Users } from "lucide-react";
import { ProductTour, type TourStep } from "@/components/ui/product-tour";
import { cn } from "@/lib/utils";

const STEPS: TourStep[] = [
  {
    target: '[data-tour="demo-sidebar"]',
    title: "Navigate your workspace",
    content: "Projects, your inbox, team and settings live in the sidebar. It collapses to icons on small screens.",
    placement: "right",
  },
  {
    target: '[data-tour="demo-search"]',
    title: "Find anything fast",
    content: "Search across projects, tasks and people. Press / from anywhere to jump here.",
    placement: "bottom",
  },
  {
    target: '[data-tour="demo-new"]',
    title: "Start something new",
    content: "Create a project from scratch or pick a template. You can invite your team right after.",
    placement: "bottom",
  },
  {
    target: '[data-tour="demo-chart"]',
    title: "Track progress",
    content: "Tasks completed per week across every project. Hover a bar for the exact count.",
    placement: "top",
  },
];

const NAV = [
  { label: "Home", icon: Home, active: true },
  { label: "Projects", icon: FolderKanban },
  { label: "Inbox", icon: Inbox },
  { label: "Team", icon: Users },
  { label: "Settings", icon: Settings },
];

const WEEKS = [
  { w: "W1", v: 18 },
  { w: "W2", v: 24 },
  { w: "W3", v: 21 },
  { w: "W4", v: 32 },
  { w: "W5", v: 28 },
  { w: "W6", v: 39 },
  { w: "W7", v: 35 },
  { w: "W8", v: 44 },
];

const PROJECTS = [
  { name: "Website refresh", status: "On track", tone: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10" },
  { name: "Mobile onboarding", status: "At risk", tone: "text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10" },
  { name: "Q4 analytics", status: "On track", tone: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10" },
];

export function DashboardTourDemo() {
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) => setLog((l) => [line, ...l].slice(0, 5));
  const max = Math.max(...WEEKS.map((x) => x.v));

  const start = (at: number) => {
    setStartAt(at);
    setOpen(true);
    add(at === 0 ? "Tour started" : `Tour resumed at step ${at + 1}`);
  };

  return (
    <div className="flex w-full max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => start(0)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm outline-none hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-indigo-800 dark:focus-visible:ring-offset-zinc-900"
        >
          <Sparkles className="size-4" aria-hidden /> Take the tour
        </button>
        <button
          type="button"
          onClick={() => start(2)}
          className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Resume at step 3
        </button>
      </div>

      {/* Fake mini dashboard */}
      <div className="@container overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex min-h-[22rem]">
          <nav
            data-tour="demo-sidebar"
            aria-label="Demo workspace"
            className="flex w-14 shrink-0 flex-col gap-1 border-r border-zinc-200 bg-zinc-50 p-2 @2xl:w-44 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-2 flex h-10 items-center gap-2 px-1.5">
              <span className="size-7 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700" aria-hidden />
              <span className="hidden text-sm font-semibold @2xl:inline">Northwind</span>
            </div>
            {NAV.map(({ label, icon: Icon, active }) => (
              <a
                key={label}
                href="#tour-demo"
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={(e) => e.preventDefault()}
                className={cn(
                  "flex h-10 items-center justify-center gap-2.5 rounded-lg text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 @2xl:justify-start @2xl:px-2.5",
                  active
                    ? "bg-white font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="hidden @2xl:inline">{label}</span>
              </a>
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 @lg:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div data-tour="demo-search" className="relative min-w-0 flex-1 basis-40">
                <label htmlFor={searchId} className="sr-only">
                  Search projects
                </label>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
                <input
                  id={searchId}
                  placeholder="Search projects…"
                  autoComplete="off"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-sm outline-none placeholder:text-zinc-500 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-400"
                />
              </div>
              <button
                type="button"
                data-tour="demo-new"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-semibold text-white outline-none hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:focus-visible:ring-offset-zinc-950"
              >
                <Plus className="size-4" aria-hidden /> New project
              </button>
            </div>

            <section
              data-tour="demo-chart"
              aria-labelledby={`${searchId}-chart`}
              className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 id={`${searchId}-chart`} className="text-sm font-semibold">
                  Tasks completed
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Last 8 weeks</p>
              </div>
              <div className="mt-3 flex h-28 items-end gap-1.5 @lg:gap-2.5">
                {WEEKS.map(({ w, v }, i) => (
                  <div key={w} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <div
                      title={`${w}: ${v} tasks`}
                      className={cn(
                        "w-full rounded-t-md",
                        i === WEEKS.length - 1 ? "bg-indigo-600 dark:bg-indigo-400" : "bg-indigo-200 dark:bg-indigo-500/40",
                      )}
                      style={{ height: `${(v / max) * 100}%` }}
                    />
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{w}</span>
                  </div>
                ))}
              </div>
            </section>

            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
              {PROJECTS.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="truncate">{p.name}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", p.tone)}>{p.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 p-3 text-sm dark:border-zinc-700">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Events</p>
        {log.length === 0 ? (
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Nothing yet. Start the tour, then use Left/Right arrows or Esc.</p>
        ) : (
          <ol className="mt-1 space-y-0.5 font-mono text-xs">
            {log.map((l, i) => (
              <li key={`${l}-${i}`} className={i === 0 ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}>
                {l}
              </li>
            ))}
          </ol>
        )}
      </div>

      <ProductTour
        steps={STEPS}
        open={open}
        onOpenChange={setOpen}
        startAt={startAt}
        onStepChange={(i) => add(`Step ${i + 1}: ${STEPS[i].title}`)}
        onFinish={() => add("onFinish: tour completed")}
        onSkip={(i) => add(`onSkip: skipped at step ${i + 1}`)}
      />
    </div>
  );
}
