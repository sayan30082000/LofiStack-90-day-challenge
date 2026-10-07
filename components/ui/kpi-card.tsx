"use client";

import { useEffect, useId, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiFormat = "number" | "currency" | "percent" | "compact";
/** good / bad already account for invertTrend. */
export type KpiSentiment = "good" | "bad" | "neutral";

/** What the screen reader summary and custom formatters receive. */
export interface KpiDeltaInfo {
  /** Relative change, e.g. 0.124 for +12.4%. null when there is no previous value to compare. */
  change: number | null;
  direction: "up" | "down" | "flat";
  sentiment: KpiSentiment;
  /** Formatted change, e.g. "+12.4%". */
  formatted: string;
}

/** Visible and spoken words. */
export interface KpiCardLabels {
  /** Caption prefix before `period`, e.g. "vs". */
  versus: string;
  up: string;
  down: string;
  flat: string;
  /** Joins the change and the period in the spoken summary, e.g. "from". */
  from: string;
  good: string;
  bad: string;
  loading: string;
}

export interface KpiCardProps {
  /** Metric name, e.g. "Revenue". */
  label: string;
  /** Current value. For format "percent" pass a fraction: 0.024 is 2.4%. */
  value: number;
  format?: KpiFormat;
  /** ISO currency code for format "currency". */
  currency?: string;
  /** BCP 47 locale for all number formatting. */
  locale?: string;
  /** Extra Intl.NumberFormat options, e.g. { style: "unit", unit: "millisecond" }. Wins over format. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Value of the previous period. Enables the delta badge. */
  previousValue?: number;
  /** For metrics where down is good (churn, latency, cost). */
  invertTrend?: boolean;
  /** Recent values, oldest first. Drawn as a sparkline. */
  trend?: number[];
  /** Names for each trend point (shown on hover), e.g. month names. */
  trendLabels?: string[];
  /** Comparison period, e.g. "last month". Shown as "vs last month". */
  period?: string;
  /** Optional icon in the corner. */
  icon?: ReactNode;
  /** Shows a skeleton and sets aria-busy. */
  loading?: boolean;
  /** Replaces the value with an error message. */
  error?: string;
  /** Count-up duration in ms. 0 shows the value at once. Reduced motion always skips it. */
  duration?: number;
  /** Sparkline color: follow the delta sentiment or stay indigo. */
  sparklineTone?: "sentiment" | "neutral";
  /** Turns the whole card into a link, e.g. to a detailed report. */
  href?: string;
  /** Overrides the screen reader summary of the delta. */
  formatSummary?: (info: KpiDeltaInfo, period: string) => string;
  labels?: Partial<KpiCardLabels>;
  className?: string;
}

const DEFAULT_LABELS: KpiCardLabels = {
  versus: "vs",
  up: "Up",
  down: "Down",
  flat: "No change",
  from: "from",
  good: "an improvement",
  bad: "a decline",
  loading: "Loading",
};

const TONE = {
  good: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25",
    stroke: "text-emerald-600 dark:text-emerald-400",
  },
  bad: {
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/25",
    stroke: "text-rose-600 dark:text-rose-400",
  },
  neutral: {
    badge: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-400/20",
    stroke: "text-indigo-600 dark:text-indigo-400",
  },
} as const;

function buildFormatter(format: KpiFormat, locale: string, currency: string, extra?: Intl.NumberFormatOptions) {
  const base: Intl.NumberFormatOptions =
    format === "currency"
      ? { style: "currency", currency, maximumFractionDigits: 0 }
      : format === "percent"
        ? { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }
        : format === "compact"
          ? { notation: "compact", maximumFractionDigits: 1 }
          : { maximumFractionDigits: 0 };
  return new Intl.NumberFormat(locale, { ...base, ...extra });
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Animates from the last shown number to `target` with requestAnimationFrame. */
function useCountUp(target: number, duration: number) {
  const [shown, setShown] = useState(duration > 0 ? 0 : target);
  const shownRef = useRef(shown);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = shownRef.current;
    let raf = 0;
    if (reduce || duration <= 0 || from === target) {
      raf = requestAnimationFrame(() => {
        shownRef.current = target;
        setShown(target);
      });
      return () => cancelAnimationFrame(raf);
    }
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / duration);
      const v = t === 1 ? target : from + (target - from) * easeOutCubic(t);
      shownRef.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return shown;
}

/** Monotone cubic path (no overshoot) through the points. */
function smoothPath(pts: [number, number][]) {
  const n = pts.length;
  if (n < 2) return "";
  const dx = (i: number) => pts[i + 1][0] - pts[i][0];
  const slope = (i: number) => (pts[i + 1][1] - pts[i][1]) / dx(i);
  const m: number[] = new Array(n);
  m[0] = slope(0);
  m[n - 1] = slope(n - 2);
  for (let i = 1; i < n - 1; i++) {
    const a = slope(i - 1);
    const b = slope(i);
    // Harmonic mean of neighbouring slopes (Fritsch–Carlson) keeps the curve monotone; flat at turning points.
    m[i] = a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx(i) / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + m[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - m[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

const VB_W = 200;
const VB_H = 56;
const PAD_Y = 6;

/** Stat tile with a counting value, a trend delta and a sparkline. */
export function KpiCard({
  label,
  value,
  format = "number",
  currency = "USD",
  locale = "en-US",
  formatOptions,
  previousValue,
  invertTrend = false,
  trend,
  trendLabels,
  period = "last period",
  icon,
  loading = false,
  error,
  duration = 1200,
  sparklineTone = "sentiment",
  href,
  formatSummary,
  labels: labelsProp,
  className,
}: KpiCardProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const labelId = `kpi-${uid}-label`;

  const fmt = useMemo(
    () => buildFormatter(format, locale, currency, formatOptions),
    [format, locale, currency, formatOptions],
  );
  const pctFmt = useMemo(
    () => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: "exceptZero" }),
    [locale],
  );

  // While hidden (loading or error) the number resets at once, so it counts up again when it reappears.
  const hidden = loading || Boolean(error);
  const shown = useCountUp(hidden ? 0 : value, hidden ? 0 : duration);

  const delta: KpiDeltaInfo | null = useMemo(() => {
    if (previousValue === undefined) return null;
    const change = previousValue === 0 ? null : (value - previousValue) / Math.abs(previousValue);
    const rounded = change === null ? 0 : Math.round(change * 1000) / 1000;
    const direction = change === null ? (value > 0 ? "up" : "flat") : rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
    const sentiment: KpiSentiment =
      direction === "flat" ? "neutral" : (direction === "up") !== invertTrend ? "good" : "bad";
    return { change, direction, sentiment, formatted: change === null ? "—" : pctFmt.format(rounded) };
  }, [previousValue, value, invertTrend, pctFmt]);

  const summary = delta
    ? formatSummary
      ? formatSummary(delta, period)
      : delta.direction === "flat"
        ? `${labels.flat} ${labels.from} ${period}.`
        : `${delta.direction === "up" ? labels.up : labels.down} ${delta.formatted.replace(/^[+\-−]/, "")} ${labels.from} ${period}, ${
            delta.sentiment === "good" ? labels.good : labels.bad
          }.`
    : null;

  const tone = TONE[delta?.sentiment ?? "neutral"];
  const stroke = sparklineTone === "neutral" ? TONE.neutral.stroke : tone.stroke;
  const DeltaIcon = delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : Minus;

  const Root = href ? "a" : "div";

  return (
    <Root
      {...(href ? { href } : {})}
      role={href ? undefined : "group"}
      aria-labelledby={href ? undefined : labelId}
      aria-busy={loading || undefined}
      className={cn(
        "@container group/kpi relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
        href &&
          "outline-none transition-[border-color,box-shadow,translate] duration-150 hover:border-zinc-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none dark:hover:border-zinc-700 dark:focus-visible:ring-offset-zinc-950",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p id={labelId} className="min-w-0 truncate text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </p>
        {icon && (
          <span
            aria-hidden
            className="-mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20 [&_svg]:size-[18px]"
          >
            {icon}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <div className="h-9 w-2/3 rounded-md bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800" />
          <div className="h-5 w-1/2 rounded-md bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800" />
          <div className="h-14 w-full rounded-md bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-800/60" />
        </div>
      ) : error ? (
        <div className="flex min-h-[7.5rem] items-start gap-2 text-sm text-rose-700 dark:text-rose-400" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5">
            {/* The final value reserves the width so the counting number never shifts the layout. */}
            <p className="grid text-3xl font-semibold tracking-tight tabular-nums @[16rem]:text-[2rem]">
              <span className="invisible col-start-1 row-start-1" aria-hidden>
                {fmt.format(value)}
              </span>
              <span className="col-start-1 row-start-1" aria-hidden>
                {fmt.format(shown)}
              </span>
              <span className="sr-only">{fmt.format(value)}</span>
            </p>
            {delta && (
              <span
                className={cn(
                  "inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-xs font-semibold tabular-nums ring-1 ring-inset",
                  tone.badge,
                )}
                aria-hidden
                title={summary ?? undefined}
              >
                <DeltaIcon className="size-3.5" strokeWidth={2.5} />
                {delta.formatted}
              </span>
            )}
          </div>
          {summary && <p className="sr-only">{summary}</p>}
          <p className="-mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {labels.versus} {period}
            {previousValue !== undefined && (
              <span className="text-zinc-400 dark:text-zinc-500"> · {fmt.format(previousValue)}</span>
            )}
          </p>
          {trend && trend.length > 1 && (
            <Sparkline
              id={uid}
              data={trend}
              names={trendLabels}
              format={(v) => fmt.format(v)}
              className={stroke}
            />
          )}
        </>
      )}
      {loading && <span className="sr-only">{`${labels.loading} ${label}`}</span>}
    </Root>
  );
}

function Sparkline({
  id,
  data,
  names,
  format,
  className,
}: {
  id: string;
  data: number[];
  names?: string[];
  format: (v: number) => string;
  className: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const { pts, line, area } = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const p = data.map(
      (v, i) => [(i / (data.length - 1)) * VB_W, PAD_Y + (1 - (v - min) / span) * (VB_H - PAD_Y * 2)] as [number, number],
    );
    const l = smoothPath(p);
    return { pts: p, line: l, area: `${l} L${VB_W},${VB_H} L0,${VB_H} Z` };
  }, [data]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const active = hover ?? data.length - 1;
  const [x, y] = pts[active];
  const left = `${(x / VB_W) * 100}%`;
  const top = `${(y / VB_H) * 100}%`;

  return (
    <div
      aria-hidden
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
      className={cn("relative -mx-1 mt-auto h-14", className)}
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <linearGradient id={`kpi-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#kpi-fill-${id})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {hover !== null && (
        <span className="pointer-events-none absolute inset-y-0 w-px bg-current opacity-30" style={{ left }} />
      )}
      {/* HTML dot so it stays round however the SVG stretches. */}
      <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
        {hover === null && (
          <span className="absolute inset-0 rounded-full bg-current opacity-40 motion-safe:animate-ping" />
        )}
        <span className="relative block size-2.5 rounded-full border-2 border-white bg-current shadow-sm dark:border-zinc-900" />
      </span>
      {hover !== null && (
        <span
          className={cn(
            "pointer-events-none absolute bottom-full mb-1 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium tabular-nums text-white shadow dark:bg-zinc-100 dark:text-zinc-900",
            hover < data.length * 0.25 ? "" : hover > data.length * 0.75 ? "-translate-x-full" : "-translate-x-1/2",
          )}
          style={{ left }}
        >
          {names?.[hover] ? <span className="opacity-70">{names[hover]} · </span> : null}
          {format(data[hover])}
        </span>
      )}
    </div>
  );
}
