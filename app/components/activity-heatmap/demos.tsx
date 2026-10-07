"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Flame, GitCommitHorizontal, GitPullRequest, MessageSquareCode, RotateCw, Trophy } from "lucide-react";
import {
  ActivityHeatmap,
  type HeatmapDatum,
  type HeatmapDay,
  type HeatmapRange,
} from "@/components/ui/activity-heatmap";
import { cn } from "@/lib/utils";

/* ---------- Seeded demo data (identical on server and client) ---------- */

const END = "2026-09-30";
const DAY_MS = 86_400_000;
const toDay = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);
const toIso = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generate(seed: number, from: string, to: string, opts: { scale: number; zeroChance: number; breaks: [string, number][] }) {
  const rand = mulberry32(seed);
  const out: HeatmapDatum[] = [];
  const breaks = opts.breaks.map(([d, len]) => [toDay(d), toDay(d) + len - 1] as const);
  let momentum = 0.5;
  for (let d = toDay(from); d <= toDay(to); d++) {
    momentum = Math.min(1, Math.max(0.1, momentum + (rand() - 0.5) * 0.25));
    const dow = new Date(d * DAY_MS).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    if (breaks.some(([a, b]) => d >= a && d <= b)) continue;
    if (rand() < opts.zeroChance * (weekend ? 2.2 : 1)) continue;
    const count = Math.round(rand() * rand() * opts.scale * momentum * (weekend ? 0.4 : 1) + 1);
    out.push({ date: toIso(d), count });
  }
  return out;
}

const CONTRIBUTIONS = generate(63, "2024-03-01", END, {
  scale: 28,
  zeroChance: 0.18,
  breaks: [
    ["2024-12-21", 12],
    ["2025-08-04", 14],
    ["2026-04-13", 6],
  ],
});

const READING = generate(7, "2025-10-01", END, { scale: 95, zeroChance: 0.3, breaks: [["2026-02-02", 9]] });

/* ---------- Stats ---------- */

function bounds(range: HeatmapRange) {
  const end = toDay(END);
  if (range === "rolling") return { start: end - 364, end };
  return { start: toDay(`${range}-01-01`), end: Math.min(toDay(`${range}-12-31`), end) };
}

function stats(data: HeatmapDatum[], range: HeatmapRange) {
  const { start, end } = bounds(range);
  const map = new Map(data.map((d) => [toDay(d.date), d.count]));
  let total = 0;
  let best = { day: start, count: 0 };
  let longest = 0;
  let run = 0;
  let active = 0;
  for (let d = start; d <= end; d++) {
    const c = map.get(d) ?? 0;
    total += c;
    if (c > best.count) best = { day: d, count: c };
    run = c > 0 ? run + 1 : 0;
    if (c > 0) active++;
    longest = Math.max(longest, run);
  }
  let current = 0;
  for (let d = end; d >= start && (map.get(d) ?? 0) > 0; d--) current++;
  return { total, best, longest, current, average: active ? total / active : 0 };
}

const longDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const num = new Intl.NumberFormat("en-US");

/** Deterministic split of a day's count into commits / PRs / reviews. */
function breakdown(day: HeatmapDay) {
  const r = mulberry32(toDay(day.date));
  const prs = Math.round(day.count * 0.2 * r());
  const reviews = Math.round((day.count - prs) * 0.3 * r());
  return { commits: day.count - prs - reviews, prs, reviews };
}

/* ---------- Demo 1: contributions ---------- */

export function ContributionsDemo() {
  const [range, setRange] = useState<HeatmapRange>("rolling");
  const [selected, setSelected] = useState<HeatmapDay | null>(null);
  const s = useMemo(() => stats(CONTRIBUTIONS, range), [range]);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<CalendarDays className="size-4" aria-hidden />} label={range === "rolling" ? "Last 365 days" : `Total in ${range}`} value={num.format(s.total)} />
        <Stat icon={<Trophy className="size-4" aria-hidden />} label="Busiest day" value={s.best.count ? `${s.best.count} on ${shortDate.format(new Date(s.best.day * DAY_MS))}` : "—"} />
        <Stat icon={<Flame className="size-4" aria-hidden />} label="Longest streak" value={`${s.longest} days`} />
        <Stat icon={<Flame className="size-4" aria-hidden />} label="Current streak" value={`${s.current} days`} />
      </dl>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <ActivityHeatmap
          data={CONTRIBUTIONS}
          endDate={END}
          range={range}
          onRangeChange={(r) => {
            setRange(r);
            setSelected(null);
          }}
          selectedDate={selected?.date}
          onDayClick={setSelected}
        />
      </div>

      <section
        aria-label="Day details"
        aria-live="polite"
        className="flex min-h-28 flex-col justify-center gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700"
      >
        {selected ? (
          <DayDetails day={selected} average={s.average} />
        ) : (
          <p className="text-center text-zinc-500 dark:text-zinc-400">
            Click a day, or Tab into the grid and use the arrow keys and Enter.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate text-lg font-semibold tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}

function DayDetails({ day, average }: { day: HeatmapDay; average: number }) {
  const b = breakdown(day);
  const ratio = average ? day.count / average : 0;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{longDate.format(new Date(toDay(day.date) * DAY_MS))}</p>
        <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
          {day.count === 0 ? (
            "No contributions this day."
          ) : (
            <>
              <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{day.count}</span> contributions ·
              level {day.level} of 4 · {ratio >= 1 ? `${ratio.toFixed(1)}× ` : `${Math.round(ratio * 100)}% of `}your active-day
              average
            </>
          )}
        </p>
      </div>
      {day.count > 0 && (
        <ul className="flex flex-wrap gap-2">
          <Chip icon={<GitCommitHorizontal className="size-3.5" aria-hidden />} label="commits" value={b.commits} />
          <Chip icon={<GitPullRequest className="size-3.5" aria-hidden />} label="pull requests" value={b.prs} />
          <Chip icon={<MessageSquareCode className="size-3.5" aria-hidden />} label="reviews" value={b.reviews} />
        </ul>
      )}
    </div>
  );
}

function Chip({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {icon}
      <span className="font-semibold tabular-nums">{value}</span> {label}
    </li>
  );
}

/* ---------- Demo 2: custom scale ---------- */

export function ReadingDemo() {
  return (
    <div
      className={cn(
        "w-full max-w-4xl rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900",
        "[--read-0:var(--color-zinc-100)] [--read-1:var(--color-emerald-200)] [--read-2:var(--color-emerald-400)] [--read-3:var(--color-emerald-600)] [--read-4:var(--color-emerald-800)]",
        "dark:[--read-0:var(--color-zinc-800)] dark:[--read-1:var(--color-emerald-900)] dark:[--read-2:var(--color-emerald-700)] dark:[--read-3:var(--color-emerald-500)] dark:[--read-4:var(--color-emerald-300)]",
      )}
    >
      <ActivityHeatmap
        data={READING}
        endDate={END}
        weekStart={1}
        levels={[1, 20, 40, 60]}
        colorScale={["var(--read-0)", "var(--read-1)", "var(--read-2)", "var(--read-3)", "var(--read-4)"]}
        unit="minutes read"
        unitSingular="minute read"
        showYearSelector={false}
        focusableCells={false}
        cellSize={13}
        legendLabels={["0 min", "60+ min"]}
        formatDay={(d, date) => (d.count ? `${d.count} min on ${date}` : `Didn't read on ${date}`)}
      />
    </div>
  );
}

/* ---------- Demo 3: states ---------- */

type DemoState = "loading" | "empty" | "error";

export function StatesDemo() {
  const [state, setState] = useState<DemoState>("loading");
  return (
    <div className="flex w-full max-w-4xl flex-col gap-3">
      <div role="group" aria-label="State" className="inline-flex self-start rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
        {(["loading", "empty", "error"] as DemoState[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={state === s}
            onClick={() => setState(s)}
            className={cn(
              "h-10 rounded-md px-3.5 text-sm font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              state === s
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <ActivityHeatmap
          data={state === "empty" ? [] : CONTRIBUTIONS}
          endDate={END}
          loading={state === "loading"}
          showYearSelector={state !== "empty"}
          emptyText="No contributions yet. Push your first commit!"
          error={
            state === "error" ? (
              <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                Couldn&apos;t load activity.
                <button
                  type="button"
                  onClick={() => setState("loading")}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 text-sm font-medium text-rose-800 outline-none hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-500/40 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <RotateCw className="size-3.5" aria-hidden /> Retry
                </button>
              </span>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
