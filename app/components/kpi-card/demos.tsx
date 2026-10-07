"use client";

import { useId, useState } from "react";
import { DollarSign, Gauge, UserMinus, Users } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { cn } from "@/lib/utils";

type Range = "7d" | "30d" | "90d";

interface Metric {
  value: number;
  previousValue: number;
  trend: number[];
}

const PERIOD: Record<Range, { label: string; names: string[] }> = {
  "7d": { label: "previous 7 days", names: ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"] },
  "30d": { label: "last month", names: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8", "Wk 9", "Wk 10", "Wk 11", "Wk 12"] },
  "90d": { label: "last quarter", names: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
};

const DATA: Record<Range, Record<"revenue" | "users" | "churn" | "latency", Metric>> = {
  "7d": {
    revenue: { value: 11840, previousValue: 10920, trend: [1420, 1510, 1290, 1180, 1760, 1880, 1990] },
    users: { value: 8420, previousValue: 8610, trend: [8600, 8580, 8390, 8310, 8450, 8470, 8420] },
    churn: { value: 0.021, previousValue: 0.021, trend: [0.022, 0.021, 0.021, 0.02, 0.021, 0.021, 0.021] },
    latency: { value: 212, previousValue: 236, trend: [244, 238, 231, 226, 219, 214, 212] },
  },
  "30d": {
    revenue: { value: 48290, previousValue: 42970, trend: [3100, 3420, 3380, 3710, 3650, 3990, 4120, 3980, 4310, 4460, 4390, 4720] },
    users: { value: 12480, previousValue: 11105, trend: [10900, 11020, 11180, 11090, 11400, 11630, 11720, 11980, 12050, 12210, 12360, 12480] },
    churn: { value: 0.024, previousValue: 0.029, trend: [0.031, 0.03, 0.029, 0.029, 0.028, 0.027, 0.027, 0.026, 0.025, 0.025, 0.024, 0.024] },
    latency: { value: 238, previousValue: 212, trend: [205, 210, 214, 211, 220, 226, 223, 231, 229, 236, 241, 238] },
  },
  "90d": {
    revenue: { value: 139600, previousValue: 151200, trend: [52100, 50400, 48700, 49900, 47300, 46100, 45800, 46900, 46700] },
    users: { value: 1_284_000, previousValue: 986_000, trend: [910e3, 948e3, 986e3, 1032e3, 1088e3, 1121e3, 1174e3, 1236e3, 1284e3] },
    churn: { value: 0.033, previousValue: 0.027, trend: [0.025, 0.026, 0.027, 0.028, 0.029, 0.03, 0.031, 0.032, 0.033] },
    latency: { value: 226, previousValue: 226, trend: [231, 224, 229, 222, 227, 225, 230, 223, 226] },
  },
};

const RANGES: Range[] = ["7d", "30d", "90d"];

export function DashboardDemo() {
  const loadingId = useId();
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(false);
  const d = DATA[range];
  const p = PERIOD[range];

  return (
    <div className="@container flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Date range" className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "h-10 min-w-12 rounded-md px-3 font-mono text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                range === r
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <label htmlFor={loadingId} className="inline-flex h-10 cursor-pointer items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            id={loadingId}
            type="checkbox"
            role="switch"
            checked={loading}
            onChange={(e) => setLoading(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-6 w-10 rounded-full bg-zinc-300 transition-colors peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 motion-reduce:transition-none dark:bg-zinc-700 dark:peer-checked:bg-indigo-500 dark:peer-focus-visible:ring-offset-zinc-900 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4 motion-reduce:after:transition-none"
          />
          Loading state
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @4xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={d.revenue.value}
          previousValue={d.revenue.previousValue}
          format="currency"
          trend={d.revenue.trend}
          trendLabels={p.names}
          period={p.label}
          icon={<DollarSign />}
          loading={loading}
        />
        <KpiCard
          label="Active users"
          value={d.users.value}
          previousValue={d.users.previousValue}
          format={range === "90d" ? "compact" : "number"}
          trend={d.users.trend}
          trendLabels={p.names}
          period={p.label}
          icon={<Users />}
          loading={loading}
        />
        <KpiCard
          label="Churn rate"
          value={d.churn.value}
          previousValue={d.churn.previousValue}
          format="percent"
          invertTrend
          trend={d.churn.trend}
          trendLabels={p.names}
          period={p.label}
          icon={<UserMinus />}
          loading={loading}
        />
        <KpiCard
          label="Avg response time"
          value={d.latency.value}
          previousValue={d.latency.previousValue}
          formatOptions={RESPONSE_TIME}
          invertTrend
          trend={d.latency.trend}
          trendLabels={p.names}
          period={p.label}
          icon={<Gauge />}
          loading={loading}
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Switch ranges to watch values count between periods. Churn and response time use invertTrend, so going down is
        green. Hover a sparkline for each point.
      </p>
    </div>
  );
}

const RESPONSE_TIME: Intl.NumberFormatOptions = { style: "unit", unit: "millisecond", unitDisplay: "short", maximumFractionDigits: 0 };

export function VariantsDemo() {
  return (
    <div className="@container w-full max-w-3xl">
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-3">
        <KpiCard
          label="Monthly recurring revenue"
          value={84210}
          previousValue={79300}
          format="currency"
          currency="EUR"
          locale="de-DE"
          period="Vormonat"
          labels={{ versus: "vs.", up: "Plus", down: "Minus", from: "gegenüber", good: "eine Verbesserung", bad: "eine Verschlechterung" }}
          trend={[61200, 64100, 66300, 70250, 69100, 74300, 77900, 79300, 84210]}
          sparklineTone="neutral"
          href="#props"
        />
        <KpiCard label="Signups today" value={0} previousValue={0} period="yesterday" />
        <KpiCard label="Conversion rate" value={0} format="percent" error="Couldn't load conversions. Try again in a minute." />
      </div>
    </div>
  );
}
