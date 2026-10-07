"use client";

import { useState } from "react";
import { DonutChart, type DonutDatum } from "@/components/ui/donut-chart";
import { cn } from "@/lib/utils";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/* ---------- Monthly expenses ---------- */

const EXPENSES: DonutDatum[] = [
  { label: "Rent", value: 1650 },
  { label: "Groceries", value: 540 },
  { label: "Savings", value: 600 },
  { label: "Dining out", value: 320 },
  { label: "Transport", value: 210 },
  { label: "Utilities", value: 185 },
  { label: "Health", value: 120 },
  { label: "Subscriptions", value: 64 },
];

export function ExpensesDemo() {
  const [hidden, setHidden] = useState<string[]>([]);
  const spent = EXPENSES.filter((d) => !hidden.includes(d.label)).reduce((a, d) => a + d.value, 0);

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">September expenses</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Click a category to leave it out of the total.</p>
        </div>
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          showing {usd.format(spent)} · hidden: {hidden.length ? hidden.join(", ") : "none"}
        </p>
      </div>
      <DonutChart
        label="September expenses by category"
        data={EXPENSES}
        format={(v) => usd.format(v)}
        centerLabel="spent this month"
        legendPosition="right"
        size={260}
        thickness={34}
        onHiddenChange={setHidden}
      />
    </div>
  );
}

/* ---------- Traffic sources ---------- */

const TRAFFIC: DonutDatum[] = [
  { label: "Organic search", value: 18420 },
  { label: "Direct", value: 9310 },
  { label: "Social", value: 6120 },
  { label: "Referral", value: 3480 },
  { label: "Email", value: 2210 },
];

const RANGES = {
  "7d": [0.24, 0.22, 0.31, 0.2, 0.3],
  "30d": [1, 1, 1, 1, 1],
} as const;

export function TrafficDemo() {
  const [range, setRange] = useState<keyof typeof RANGES>("30d");
  const data = TRAFFIC.map((d, i) => ({ ...d, value: Math.round(d.value * RANGES[range][i]) }));

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Traffic sources</p>
        <div role="group" aria-label="Date range" className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
          {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "h-9 min-w-12 rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                range === r
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              Last {r}
            </button>
          ))}
        </div>
      </div>
      <DonutChart
        label={`Website visits by source, last ${range}`}
        data={data}
        format={(v) => compact.format(v)}
        centerLabel="visits"
        legendPosition="bottom"
        size={220}
        thickness={22}
        gap={4}
        hoverOffset={8}
      />
    </div>
  );
}

/* ---------- States ---------- */

type DemoState = "data" | "loading" | "empty";

const BUDGET: DonutDatum[] = [
  { label: "Design", value: 42, color: "#6366f1" },
  { label: "Engineering", value: 35, color: "#0ea5e9" },
  { label: "Research", value: 23, color: "#14b8a6" },
];

export function StatesDemo() {
  const [state, setState] = useState<DemoState>("loading");

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <div role="group" aria-label="Chart state" className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
        {(["data", "loading", "empty"] as DemoState[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={state === s}
            onClick={() => setState(s)}
            className={cn(
              "h-9 rounded-md px-3 font-mono text-xs capitalize outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              state === s
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <DonutChart
        label="Sprint time by discipline"
        data={state === "empty" ? [] : BUDGET}
        loading={state === "loading"}
        format={(v) => `${v}h`}
        centerLabel="logged"
        legendPosition="bottom"
        size={200}
        thickness={44}
        cornerRadius={4}
        emptyText="No time logged this sprint"
      />
    </div>
  );
}
