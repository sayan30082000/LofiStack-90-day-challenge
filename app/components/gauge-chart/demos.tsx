"use client";

import { useId, useRef, useState } from "react";
import { LoaderCircle, Play } from "lucide-react";
import { GaugeChart, type GaugeZone } from "@/components/ui/gauge-chart";
import { cn } from "@/lib/utils";

/* ---------- CPU usage ---------- */

const CPU_ZONES: GaugeZone[] = [
  { from: 0, to: 40, color: "#059669", label: "Normal" },
  { from: 40, to: 75, color: "#d97706", label: "Warning" },
  { from: 75, to: 100, color: "#e11d48", label: "Critical" },
];

type DemoState = "live" | "loading" | "empty" | "error";
const STATES: { id: DemoState; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "loading", label: "Loading" },
  { id: "empty", label: "No data" },
  { id: "error", label: "Error" },
];

export function CpuDemo() {
  const sliderId = useId();
  const [cpu, setCpu] = useState(72);
  const [state, setState] = useState<DemoState>("live");

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <GaugeChart
        label="CPU usage"
        value={state === "empty" ? null : cpu}
        unit="%"
        zones={CPU_ZONES}
        loading={state === "loading"}
        error={state === "error" ? "Agent offline since 14:02" : undefined}
        size={300}
      />

      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor={sliderId} className="font-medium text-zinc-700 dark:text-zinc-300">
            Simulated load
          </label>
          <span className="font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">{cpu}%</span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={100}
          value={cpu}
          disabled={state !== "live"}
          onChange={(e) => setCpu(Number(e.target.value))}
          className="h-10 w-full cursor-pointer accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:accent-indigo-400"
        />
      </div>

      <Segmented label="Gauge state" value={state} options={STATES} onChange={setState} />
    </div>
  );
}

/* ---------- Credit score ---------- */

const CREDIT_ZONES: GaugeZone[] = [
  { from: 300, to: 580, color: "#e11d48", label: "Poor" },
  { from: 580, to: 670, color: "#ea580c", label: "Fair" },
  { from: 670, to: 740, color: "#d97706", label: "Good" },
  { from: 740, to: 800, color: "#65a30d", label: "Very good" },
  { from: 800, to: 850, color: "#059669", label: "Exceptional" },
];

const PROFILES = [
  { id: "a", label: "Jordan", score: 562 },
  { id: "b", label: "Priya", score: 704 },
  { id: "c", label: "Sam", score: 768 },
  { id: "d", label: "Lena", score: 821 },
];

export function CreditDemo() {
  const [profile, setProfile] = useState("c");
  const score = PROFILES.find((p) => p.id === profile)!.score;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <GaugeChart
        label="Credit score"
        value={score}
        min={300}
        max={850}
        zones={CREDIT_ZONES}
        arc={270}
        ticks={22}
        majorTickEvery={4}
        target={740}
        targetLabel="Mortgage minimum"
        size={300}
      />
      <Segmented
        label="Applicant"
        value={profile}
        options={PROFILES.map((p) => ({ id: p.id, label: p.label }))}
        onChange={setProfile}
      />
    </div>
  );
}

/* ---------- Page speed ---------- */

const SPEED_ZONES: GaugeZone[] = [
  { from: 0, to: 50, color: "#e11d48", label: "Poor" },
  { from: 50, to: 90, color: "#d97706", label: "Needs work" },
  { from: 90, to: 100, color: "#059669", label: "Good" },
];

// Deterministic "test runs" so the demo is the same on every load.
const RUNS = [
  { mobile: 63, desktop: 94 },
  { mobile: 78, desktop: 98 },
  { mobile: 41, desktop: 86 },
  { mobile: 91, desktop: 100 },
];

export function PageSpeedDemo() {
  const [run, setRun] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    setRunning(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setRun((r) => (r + 1) % RUNS.length);
      setRunning(false);
    }, 1400);
  };

  const scores = RUNS[run];

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      <div className="grid w-full grid-cols-1 justify-items-center gap-6 sm:grid-cols-2">
        {(["mobile", "desktop"] as const).map((device) => (
          <GaugeChart
            key={device}
            label={device === "mobile" ? "Mobile performance" : "Desktop performance"}
            value={scores[device]}
            zones={SPEED_ZONES}
            arc={270}
            target={90}
            showLegend={false}
            loading={running}
            loadingText="Running Lighthouse…"
            size={220}
            ticks={10}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={start}
        disabled={running}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white outline-none transition-colors motion-reduce:transition-none hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-900"
      >
        {running ? (
          <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
        ) : (
          <Play className="size-4" aria-hidden />
        )}
        {running ? "Testing…" : "Run test again"}
      </button>
    </div>
  );
}

/* ---------- Shared ---------- */

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap justify-center gap-1 rounded-lg bg-zinc-200/70 p-1 dark:bg-zinc-800">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-10 rounded-md px-3 text-sm font-medium outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            value === o.id
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
