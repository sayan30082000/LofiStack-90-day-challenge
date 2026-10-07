"use client";

import { useState } from "react";
import { Bug, Building2, Coins, Globe, Package, Rocket, ShieldCheck, Sparkles, Sprout, Trophy, Users, Zap } from "lucide-react";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";
import { cn } from "@/lib/utils";

/* ---------- Company history ---------- */

const HISTORY: TimelineItem[] = [
  {
    id: "founded",
    date: "2019-04",
    dateLabel: "April 2019",
    title: "Two founders, one spare bedroom",
    description: "Fernway starts as a weekend project to make team scheduling feel calm instead of chaotic.",
    icon: <Sprout />,
    tag: "Founding",
  },
  {
    id: "first-100",
    date: "2020-02",
    dateLabel: "February 2020",
    title: "First 100 paying teams",
    description: "Word of mouth from a single design community gets the private beta to its first hundred customers.",
    icon: <Users />,
    tag: "Growth",
  },
  {
    id: "seed",
    date: "2020-11",
    dateLabel: "November 2020",
    title: "$3.2M seed round",
    description: "The round funds the first five hires and a rebuilt sync engine that works offline.",
    icon: <Coins />,
    tag: "Funding",
  },
  {
    id: "v1",
    date: "2021-06-15",
    dateLabel: "June 15, 2021",
    title: "Fernway 1.0 launches publicly",
    description: "Launch day tops the product charts and brings in 12,000 sign-ups in the first week.",
    icon: <Rocket />,
    tag: "Launch",
    highlight: true,
  },
  {
    id: "berlin",
    date: "2022-09",
    dateLabel: "September 2022",
    title: "Berlin office opens",
    description: "A second home for the growing European team, now 40 people across product, support and sales.",
    icon: <Building2 />,
    tag: "Team",
  },
  {
    id: "soc2",
    date: "2023-05",
    dateLabel: "May 2023",
    title: "SOC 2 Type II certified",
    description: "Enterprise customers get audit reports, SSO and data residency in the EU and US.",
    icon: <ShieldCheck />,
    tag: "Security",
  },
  {
    id: "series-a",
    date: "2024-03",
    dateLabel: "March 2024",
    title: "$18M Series A",
    description: "Led by long-time customers turned investors, to expand into 30 languages.",
    icon: <Globe />,
    tag: "Funding",
  },
  {
    id: "assistant",
    date: "2025-01",
    dateLabel: "January 2025",
    title: "Scheduling assistant ships",
    description: "Finds a time that works for everyone across time zones and suggests when to protect focus hours.",
    icon: <Sparkles />,
    tag: "Launch",
  },
  {
    id: "million",
    date: "2026-06",
    dateLabel: "June 2026",
    title: "One million people plan their week on Fernway",
    description: "Seven years after the spare bedroom, teams in 140 countries use Fernway every day.",
    icon: <Trophy />,
    tag: "Milestone",
    highlight: true,
  },
];

export function HistoryDemo() {
  return (
    <div className="w-full max-w-5xl">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Our story</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">From side project to a million weeks planned</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Scroll down: the line fills and each year lights up as you pass it.</p>
      </div>
      <Timeline items={HISTORY} label="Fernway company history, 2019 to 2026" />
    </div>
  );
}

/* ---------- Release notes with states ---------- */

const RELEASES: TimelineItem[] = [
  {
    id: "r3",
    date: "2026-09-24",
    dateLabel: "Sep 24, 2026",
    title: "v3.2: Shared calendars",
    description: "Invite a whole team to a calendar and set who can edit.",
    icon: <Package />,
    tag: "Feature",
    href: "#release-3-2",
    highlight: true,
  },
  {
    id: "r2",
    date: "2026-09-10",
    dateLabel: "Sep 10, 2026",
    title: "v3.1.4: Faster sync",
    description: "Changes now reach other devices in under a second on most connections.",
    icon: <Zap />,
    tag: "Improvement",
    href: "#release-3-1-4",
  },
  {
    id: "r1",
    date: "2026-08-28",
    dateLabel: "Aug 28, 2026",
    title: "v3.1.3: Bug fixes",
    description: "Fixed recurring events that skipped the last day of the month.",
    icon: <Bug />,
    tag: "Fix",
    href: "#release-3-1-3",
  },
];

type DemoState = "loaded" | "loading" | "empty";

export function ReleasesDemo() {
  const [state, setState] = useState<DemoState>("loaded");
  const [alternate, setAlternate] = useState(false);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <div role="group" aria-label="State" className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
          {(["loaded", "loading", "empty"] as const).map((s) => (
            <Toggle key={s} pressed={state === s} onClick={() => setState(s)}>
              {s}
            </Toggle>
          ))}
        </div>
        <div role="group" aria-label="Layout" className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
          <Toggle pressed={!alternate} onClick={() => setAlternate(false)}>
            single line
          </Toggle>
          <Toggle pressed={alternate} onClick={() => setAlternate(true)}>
            alternate
          </Toggle>
        </div>
      </div>
      <Timeline
        items={state === "empty" ? [] : RELEASES}
        loading={state === "loading"}
        alternate={alternate}
        label="Release notes"
        milestoneText="Latest"
        emptyText="No releases yet. Check back after the first ship."
        animateOnScroll={false}
      />
    </div>
  );
}

function Toggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-10 rounded-md px-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        pressed
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
      )}
    >
      {children}
    </button>
  );
}
