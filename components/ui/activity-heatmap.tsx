"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeatmapDatum {
  /** Calendar date as YYYY-MM-DD. Duplicate dates are summed. */
  date: string;
  count: number;
}

export interface HeatmapDay {
  /** YYYY-MM-DD */
  date: string;
  count: number;
  /** Intensity level from 0 (none) to 4 (most). */
  level: number;
}

/** "rolling" is the 365 days ending at endDate; a number is that calendar year. */
export type HeatmapRange = "rolling" | number;

export interface ActivityHeatmapProps {
  data: HeatmapDatum[];
  /** Last day shown (YYYY-MM-DD). Defaults to the latest date in data, or today. */
  endDate?: string;
  /**
   * Minimum count for levels 1 to 4, e.g. [1, 4, 8, 12].
   * "quantile" (default) splits the non-zero days of the visible range into quartiles.
   */
  levels?: number[] | "quantile";
  /** Five CSS colors from level 0 to level 4. Defaults to an indigo ramp tuned for light and dark. */
  colorScale?: string[];
  /** Fired when a day is clicked, or Enter/Space on a focused day. */
  onDayClick?: (day: HeatmapDay) => void;
  /** Draws a ring around this day (YYYY-MM-DD). */
  selectedDate?: string;
  /** First row of each week column: 0 Sunday, 1 Monday. */
  weekStart?: 0 | 1;
  /** Plural unit, e.g. "contributions". */
  unit?: string;
  /** Singular unit. Defaults to unit without a trailing "s". */
  unitSingular?: string;
  /** Locale for dates and numbers. */
  locale?: string;
  /** Cell size in px. */
  cellSize?: number;
  /** Gap between cells in px. */
  cellGap?: number;
  /** Selected range (controlled). */
  range?: HeatmapRange;
  /** Initial range (uncontrolled). */
  defaultRange?: HeatmapRange;
  onRangeChange?: (range: HeatmapRange) => void;
  /** Show the year buttons above the grid. */
  showYearSelector?: boolean;
  /** Label of the rolling-range button. */
  rollingLabel?: string;
  /** Accessible name of the year selector. */
  yearSelectorLabel?: string;
  /** Header text. */
  formatTotal?: (total: number, range: HeatmapRange) => ReactNode;
  /** Tooltip and cell label. */
  formatDay?: (day: HeatmapDay, formattedDate: string) => string;
  /** Legend end labels. */
  legendLabels?: [string, string];
  /** Make cells focusable with arrow-key movement. When false the SVG is a single role="img". */
  focusableCells?: boolean;
  /** Skeleton grid. */
  loading?: boolean;
  /** Replaces the grid with an error message. */
  error?: ReactNode;
  /** Shown over the grid when the range has no activity. */
  emptyText?: string;
  className?: string;
}

const DAY_MS = 86_400_000;
const DEFAULT_FILL = [
  "fill-zinc-100 dark:fill-zinc-800",
  "fill-indigo-200 dark:fill-indigo-900",
  "fill-indigo-400 dark:fill-indigo-700",
  "fill-indigo-600 dark:fill-indigo-500",
  "fill-indigo-800 dark:fill-indigo-300",
];

/* ---------- Date helpers (UTC day numbers, so time zones never shift a day) ---------- */

function toDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / DAY_MS);
}
function toIso(day: number) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}
function weekday(day: number) {
  // 1970-01-01 was a Thursday.
  return (((day + 4) % 7) + 7) % 7;
}
function yearOf(day: number) {
  return new Date(day * DAY_MS).getUTCFullYear();
}

const noopSubscribe = () => () => {};
const localToday = () => {
  const d = new Date();
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
};
const noToday = () => null;

const STYLES = `
@keyframes lofi-activity-heatmap-in { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: none; } }
.lofi-activity-heatmap-cell { transform-box: fill-box; transform-origin: center; animation: lofi-activity-heatmap-in 320ms cubic-bezier(0.2, 0.9, 0.3, 1.1) backwards; }
@media (prefers-reduced-motion: reduce) { .lofi-activity-heatmap-cell { animation: none; } }
`;

/** GitHub-style calendar heatmap: weeks as columns, weekdays as rows, five intensity levels. */
export function ActivityHeatmap({
  data,
  endDate,
  levels = "quantile",
  colorScale,
  onDayClick,
  selectedDate,
  weekStart = 0,
  unit = "contributions",
  unitSingular,
  locale = "en-US",
  cellSize = 12,
  cellGap = 3,
  range: rangeProp,
  defaultRange = "rolling",
  onRangeChange,
  showYearSelector = true,
  rollingLabel = "Last year",
  yearSelectorLabel = "Year",
  formatTotal,
  formatDay,
  legendLabels = ["Less", "More"],
  focusableCells = true,
  loading = false,
  error,
  emptyText = "No activity in this period yet.",
  className,
}: ActivityHeatmapProps) {
  const id = useId();
  const singular = unitSingular ?? unit.replace(/s$/, "");
  const [innerRange, setInnerRange] = useState<HeatmapRange>(defaultRange);
  const range = rangeProp ?? innerRange;
  const today = useSyncExternalStore(noopSubscribe, localToday, noToday);

  const counts = useMemo(() => {
    const map = new Map<number, number>();
    for (const d of data) {
      const day = toDay(d.date);
      if (Number.isFinite(day)) map.set(day, (map.get(day) ?? 0) + d.count);
    }
    return map;
  }, [data]);

  const lastDataDay = useMemo(() => {
    let max: number | null = null;
    for (const day of counts.keys()) if (max === null || day > max) max = day;
    return max;
  }, [counts]);
  const firstDataDay = useMemo(() => {
    let min: number | null = null;
    for (const day of counts.keys()) if (min === null || day < min) min = day;
    return min;
  }, [counts]);

  const endDay = endDate ? toDay(endDate) : (lastDataDay ?? today);

  const fmt = useMemo(
    () => ({
      date: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }),
      month: new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }),
      num: new Intl.NumberFormat(locale),
    }),
    [locale],
  );

  /* ---------- Layout ---------- */

  const model = useMemo(() => {
    if (endDay === null) return null;
    let start: number;
    let end: number;
    if (range === "rolling") {
      end = endDay;
      start = end - 364;
    } else {
      start = toDay(`${range}-01-01`);
      end = Math.min(toDay(`${range}-12-31`), endDay);
      if (end < start) end = start;
    }
    const gridStart = start - ((weekday(start) - weekStart + 7) % 7);
    const weeks = Math.floor((end - gridStart) / 7) + 1;

    // Levels
    const inRange: number[] = [];
    let total = 0;
    let busiest: { day: number; count: number } | null = null;
    for (let d = start; d <= end; d++) {
      const c = counts.get(d) ?? 0;
      total += c;
      if (c > 0) inRange.push(c);
      if (c > 0 && (!busiest || c > busiest.count)) busiest = { day: d, count: c };
    }
    let levelOf: (c: number) => number;
    if (Array.isArray(levels)) {
      const t = [...levels].sort((a, b) => a - b);
      levelOf = (c) => (c < (t[0] ?? 1) || c <= 0 ? 0 : c >= (t[3] ?? Infinity) ? 4 : c >= (t[2] ?? Infinity) ? 3 : c >= (t[1] ?? Infinity) ? 2 : 1);
    } else {
      const sorted = [...inRange].sort((a, b) => a - b);
      const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))] ?? 0;
      const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
      levelOf = (c) => (c <= 0 ? 0 : 1 + Number(c > q1) + Number(c > q2) + Number(c > q3));
    }

    const cells: { day: number; col: number; row: number; count: number; level: number }[] = [];
    for (let d = start; d <= end; d++) {
      const offset = d - gridStart;
      const count = counts.get(d) ?? 0;
      cells.push({ day: d, col: Math.floor(offset / 7), row: offset % 7, count, level: levelOf(count) });
    }

    // Month labels at the column holding each month's 1st. The partial first month only
    // gets a label when there is room before the next one; labels too close to the end are dropped.
    const months: { col: number; label: string }[] = [];
    for (let d = start; d <= end; d++) {
      const date = new Date(d * DAY_MS);
      const col = Math.floor((d - gridStart) / 7);
      if (date.getUTCDate() === 1 && col <= weeks - 2) months.push({ col, label: fmt.month.format(date) });
    }
    if (!months.length || months[0].col >= 3) months.unshift({ col: 0, label: fmt.month.format(new Date(start * DAY_MS)) });
    return { start, end, weeks, cells, months, total, busiest };
  }, [endDay, range, weekStart, counts, levels, fmt]);

  const years = useMemo(() => {
    if (endDay === null) return [];
    const last = yearOf(endDay);
    const first = firstDataDay !== null ? Math.min(yearOf(firstDataDay), last) : last;
    const out: number[] = [];
    for (let y = last; y >= first; y--) out.push(y);
    return out;
  }, [endDay, firstDataDay]);

  const step = cellSize + cellGap;
  const left = 30;
  const top = 18;
  const width = model ? left + model.weeks * step - cellGap : 0;
  const height = top + 7 * step - cellGap;

  const describe = useCallback(
    (day: HeatmapDay) => {
      const date = fmt.date.format(new Date(toDay(day.date) * DAY_MS));
      if (formatDay) return formatDay(day, date);
      if (day.count === 0) return `No ${unit} on ${date}`;
      return `${fmt.num.format(day.count)} ${day.count === 1 ? singular : unit} on ${date}`;
    },
    [fmt, formatDay, unit, singular],
  );

  const toHeatmapDay = (c: { day: number; count: number; level: number }): HeatmapDay => ({
    date: toIso(c.day),
    count: c.count,
    level: c.level,
  });

  /* ---------- Interaction ---------- */

  const scrollRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<number, SVGRectElement>());
  const [focusDay, setFocusDay] = useState<number | null>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);
  const rangeKey = `${range}-${model?.start}-${model?.end}`;

  // Start scrolled to the latest week whenever the range changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [rangeKey, loading]);

  // Fixed-position tooltip goes stale on scroll; hide it.
  useEffect(() => {
    if (!tip) return;
    const hide = () => setTip(null);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [tip]);

  const showTip = (el: Element, text: string) => {
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 110), window.innerWidth - 110);
    setTip({ text, x, y: r.top - 6 });
  };

  const cellByDay = useMemo(() => new Map(model?.cells.map((c) => [c.day, c]) ?? []), [model]);
  const selectedDay = selectedDate ? toDay(selectedDate) : null;
  const tabbable =
    model && focusDay !== null && cellByDay.has(focusDay)
      ? focusDay
      : selectedDay !== null && cellByDay.has(selectedDay)
        ? selectedDay
        : model?.end ?? null;

  const moveFocus = (day: number) => {
    if (!model) return;
    const target = Math.max(model.start, Math.min(model.end, day));
    setFocusDay(target);
    cellRefs.current.get(target)?.focus();
  };

  const onGridKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!model || tabbable === null) return;
    const map: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    if (e.key in map) {
      e.preventDefault();
      moveFocus(tabbable + map[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      moveFocus(e.ctrlKey ? model.start : tabbable - ((weekday(tabbable) - weekStart + 7) % 7));
    } else if (e.key === "End") {
      e.preventDefault();
      moveFocus(e.ctrlKey ? model.end : tabbable + 6 - ((weekday(tabbable) - weekStart + 7) % 7));
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      moveFocus(tabbable + (e.key === "PageUp" ? -28 : 28));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const c = cellByDay.get(tabbable);
      if (c) onDayClick?.(toHeatmapDay(c));
    }
  };

  const changeRange = (r: HeatmapRange) => {
    if (rangeProp === undefined) setInnerRange(r);
    onRangeChange?.(r);
    setFocusDay(null);
    setTip(null);
  };

  /* ---------- Render ---------- */

  const rangeText = range === "rolling" ? rollingLabel.toLowerCase().replace(/^last/, "the last") : String(range);
  const header =
    model &&
    (formatTotal ? (
      formatTotal(model.total, range)
    ) : (
      <>
        <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">{fmt.num.format(model.total)}</span>{" "}
        {model.total === 1 ? singular : unit} in {rangeText}
      </>
    ));

  const summary = model
    ? `${fmt.num.format(model.total)} ${model.total === 1 ? singular : unit} in ${rangeText}.` +
      (model.busiest
        ? ` Busiest day: ${fmt.date.format(new Date(model.busiest.day * DAY_MS))} with ${fmt.num.format(model.busiest.count)}.`
        : "")
    : "";

  const weekdayRows = Array.from({ length: 7 }, (_, row) => {
    const dow = (weekStart + row) % 7;
    // 1970-01-04 was a Sunday.
    return dow === 1 || dow === 3 || dow === 5 ? { row, label: fmt.weekday.format(new Date((3 + dow) * DAY_MS)) } : null;
  }).filter((x): x is { row: number; label: string } => x !== null);

  const fillFor = (level: number) =>
    colorScale ? { className: "", style: { fill: colorScale[level] } } : { className: DEFAULT_FILL[level], style: undefined };

  const rows = Array.from({ length: 7 }, (_, r) => model?.cells.filter((c) => c.row === r) ?? []);
  const isEmpty = model !== null && model.total === 0 && !loading && !error;

  return (
    <div className={cn("w-full min-w-0 text-sm text-zinc-600 dark:text-zinc-400", className)}>
      <style href="lofi-activity-heatmap" precedence="default">
        {STYLES}
      </style>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="min-h-5" aria-live="polite">
          {loading || error ? " " : header}
        </p>
        {showYearSelector && years.length > 0 && (
          <div role="group" aria-label={yearSelectorLabel} className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 py-0.5">
            {(["rolling", ...years] as HeatmapRange[]).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                disabled={loading}
                onClick={() => changeRange(r)}
                className={cn(
                  "h-10 shrink-0 rounded-lg px-3 text-xs font-medium tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
                  range === r
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700",
                )}
              >
                {r === "rolling" ? rollingLabel : r}
              </button>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div
          role="alert"
          className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-dashed border-rose-300 bg-rose-50/50 px-4 py-8 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/5 dark:text-rose-300"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={() => {
              if (tip) setTip(null);
            }}
            className="overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:thin]"
          >
            {loading || !model ? (
              <svg width={width || left + 53 * step} height={height} aria-busy="true" role="img" aria-label="Loading activity">
                {Array.from({ length: (model?.weeks ?? 53) * 7 }, (_, i) => (
                  <rect
                    key={i}
                    x={left + Math.floor(i / 7) * step}
                    y={top + (i % 7) * step}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    className="fill-zinc-200 motion-safe:animate-pulse dark:fill-zinc-800"
                  />
                ))}
              </svg>
            ) : (
              <svg
                width={width}
                height={height}
                role={focusableCells ? "grid" : "img"}
                aria-label={summary}
                aria-describedby={isEmpty ? `${id}-empty` : undefined}
                onKeyDown={focusableCells ? onGridKeyDown : undefined}
                className="block select-none"
              >
                <g aria-hidden className="fill-zinc-500 text-[10px] dark:fill-zinc-400">
                  {model.months.map((m) => (
                    <text key={`${m.col}-${m.label}`} x={left + m.col * step} y={10}>
                      {m.label}
                    </text>
                  ))}
                  {weekdayRows.map((w) => (
                    <text key={w.row} x={0} y={top + w.row * step + cellSize - 2}>
                      {w.label}
                    </text>
                  ))}
                </g>
                <g key={rangeKey}>
                  {rows.map((cells, r) => (
                    <g key={r} role={focusableCells ? "row" : undefined}>
                      {cells.map((c) => {
                        const day = toHeatmapDay(c);
                        const text = describe(day);
                        const fill = fillFor(c.level);
                        const dim = hoverLevel !== null && hoverLevel !== c.level;
                        return (
                          <rect
                            key={c.day}
                            ref={(el) => {
                              if (el) cellRefs.current.set(c.day, el);
                              else cellRefs.current.delete(c.day);
                            }}
                            x={left + c.col * step}
                            y={top + c.row * step}
                            width={cellSize}
                            height={cellSize}
                            rx={2.5}
                            role={focusableCells ? "gridcell" : undefined}
                            aria-label={focusableCells ? text : undefined}
                            aria-selected={focusableCells ? c.day === selectedDay : undefined}
                            tabIndex={focusableCells ? (c.day === tabbable ? 0 : -1) : undefined}
                            onFocus={(e) => {
                              setFocusDay(c.day);
                              showTip(e.currentTarget, text);
                            }}
                            onBlur={() => setTip(null)}
                            onPointerEnter={(e) => showTip(e.currentTarget, text)}
                            onPointerLeave={(e) => {
                              // Touch taps keep the tooltip until the next tap or scroll.
                              if (e.pointerType !== "touch") setTip(null);
                            }}
                            onClick={() => onDayClick?.(day)}
                            style={{ ...fill.style, animationDelay: `${c.col * 7}ms` }}
                            className={cn(
                              "lofi-activity-heatmap-cell stroke-black/5 outline-none transition-opacity duration-150 dark:stroke-white/5",
                              "hover:stroke-zinc-900/50 focus-visible:stroke-zinc-900 focus-visible:stroke-2 dark:hover:stroke-white/60 dark:focus-visible:stroke-white",
                              onDayClick && "cursor-pointer",
                              fill.className,
                              dim && "opacity-20",
                            )}
                          />
                        );
                      })}
                    </g>
                  ))}
                </g>
                {selectedDay !== null && cellByDay.has(selectedDay) && (
                  <rect
                    aria-hidden
                    x={left + cellByDay.get(selectedDay)!.col * step - 2}
                    y={top + cellByDay.get(selectedDay)!.row * step - 2}
                    width={cellSize + 4}
                    height={cellSize + 4}
                    rx={4}
                    className="pointer-events-none fill-none stroke-indigo-600 stroke-2 dark:stroke-indigo-300"
                  />
                )}
              </svg>
            )}
          </div>
          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p
                id={`${id}-empty`}
                className="rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300"
              >
                {emptyText}
              </p>
            </div>
          )}
        </div>
      )}

      {!error && (
        <div aria-hidden className="mt-2 flex items-center justify-end gap-1.5 text-xs">
          <span>{legendLabels[0]}</span>
          <svg width={5 * step - cellGap} height={cellSize} onPointerLeave={() => setHoverLevel(null)}>
            {[0, 1, 2, 3, 4].map((lvl) => {
              const fill = fillFor(lvl);
              return (
                <rect
                  key={lvl}
                  x={lvl * step}
                  width={cellSize}
                  height={cellSize}
                  rx={2.5}
                  style={fill.style}
                  onPointerEnter={() => setHoverLevel(lvl)}
                  className={cn("stroke-black/5 dark:stroke-white/5", fill.className, hoverLevel === lvl && "stroke-zinc-900/60 dark:stroke-white/70")}
                />
              );
            })}
          </svg>
          <span>{legendLabels[1]}</span>
        </div>
      )}

      {tip && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
        </div>
      )}
    </div>
  );
}
