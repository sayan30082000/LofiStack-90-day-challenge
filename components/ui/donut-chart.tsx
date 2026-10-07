"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DonutDatum {
  /** Category name. Must be unique within the chart; it is also the key for hiding. */
  label: string;
  value: number;
  /** Any CSS color. Defaults to the next slot of `colors`, by position in `data`. */
  color?: string;
}

export interface DonutArc {
  /** Start angle in radians, 0 at 12 o'clock, clockwise. */
  start: number;
  /** End angle in radians. Equal to start for hidden or zero segments. */
  end: number;
  /** Share of the visible total, 0 to 1. */
  fraction: number;
}

export interface DonutChartProps {
  data: DonutDatum[];
  /** Accessible name of the chart and caption of the data table, e.g. "September expenses". */
  label?: string;
  /** Maximum width in px. The chart scales down with its container through its viewBox. */
  size?: number;
  /** Ring thickness in viewBox units (px at full size). */
  thickness?: number;
  /** Gap between segments in px. */
  gap?: number;
  /** Corner rounding of each segment in px. */
  cornerRadius?: number;
  /** How far a hovered or focused segment moves outward, in px. */
  hoverOffset?: number;
  /** Formats values in the center, legend and table. */
  format?: (value: number) => string;
  /** Formats shares (0 to 1). */
  formatPercent?: (fraction: number) => string;
  /** Text under the total in the center, e.g. "Total spend". */
  centerLabel?: ReactNode;
  showLegend?: boolean;
  /** right falls back to bottom when the container is narrower than 32rem. */
  legendPosition?: "right" | "bottom";
  /** Colors assigned to data by position (never by rank, so hiding a segment doesn't repaint the others). */
  colors?: string[];
  /** Labels hidden on first render. */
  defaultHidden?: string[];
  /** Called when a legend item is toggled. */
  onHiddenChange?: (hidden: string[]) => void;
  /** Shows a pulsing skeleton ring instead of data. */
  loading?: boolean;
  loadingText?: string;
  /** Shown in the center when there is no data or every value is 0. */
  emptyText?: string;
  /** Shown in the center when every segment is hidden from the legend. */
  allHiddenText?: string;
  /** Appended to hidden legend items. */
  hiddenText?: string;
  /** Column headers of the screen-reader table. */
  tableHeaders?: [category: string, value: string, share: string];
  /** Duration of the mount and toggle animation in ms. 0 turns it off. Reduced motion always turns it off. */
  animationDuration?: number;
  className?: string;
}

const TAU = Math.PI * 2;
const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Validated categorical palette (8 hues, fixed order), stepped separately for light and dark surfaces. */
const PALETTE_VARS = Array.from({ length: 8 }, (_, i) => `var(--lofi-donut-chart-c${i + 1})`);

const STYLE = `
.lofi-donut-chart {
  --lofi-donut-chart-c1: #2a78d6; --lofi-donut-chart-c2: #eb6834; --lofi-donut-chart-c3: #1baf7a; --lofi-donut-chart-c4: #eda100;
  --lofi-donut-chart-c5: #e87ba4; --lofi-donut-chart-c6: #008300; --lofi-donut-chart-c7: #4a3aa7; --lofi-donut-chart-c8: #e34948;
}
.lofi-donut-chart:where(.dark, .dark *):not(:where(.light, .light *)) {
  --lofi-donut-chart-c1: #3987e5; --lofi-donut-chart-c2: #d95926; --lofi-donut-chart-c3: #199e70; --lofi-donut-chart-c4: #c98500;
  --lofi-donut-chart-c5: #d55181; --lofi-donut-chart-c6: #008300; --lofi-donut-chart-c7: #9085e9; --lofi-donut-chart-c8: #e66767;
}
.lofi-donut-chart-seg { transition: transform 220ms cubic-bezier(.2,.8,.3,1), opacity 180ms ease; }
@media (prefers-reduced-motion: reduce) { .lofi-donut-chart-seg { transition: none; } }
`;

const defaultPercent = (f: number) => `${(f * 100).toFixed(f > 0 && f < 0.1 ? 1 : 0)}%`;

/**
 * Lays out donut segments as angles. Hidden or non-positive values get a zero sweep
 * at their position, so animating between layouts collapses them in place.
 */
export function computeDonutArcs(values: number[], hidden: boolean[] = []): DonutArc[] {
  const shown = values.map((v, i) => (!hidden[i] && v > 0 ? v : 0));
  const total = shown.reduce((a, b) => a + b, 0);
  let cursor = 0;
  return shown.map((v) => {
    const fraction = total > 0 ? v / total : 0;
    const start = cursor;
    cursor += fraction * TAU;
    return { start, end: cursor, fraction };
  });
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function point(c: number, r: number, a: number) {
  return `${r2(c + r * Math.sin(a))} ${r2(c - r * Math.cos(a))}`;
}

/** Annular sector with parallel-edged gaps: the angular pad shrinks with the radius. */
function sectorPath(c: number, rOut: number, rIn: number, a0: number, a1: number, gap: number): string | null {
  const sweep = a1 - a0;
  if (sweep <= 0.0005) return null;
  if (sweep >= TAU - 0.0005) {
    return [
      `M ${point(c, rOut, 0)} A ${rOut} ${rOut} 0 1 1 ${point(c, rOut, Math.PI)} A ${rOut} ${rOut} 0 1 1 ${point(c, rOut, 0)} Z`,
      `M ${point(c, rIn, 0)} A ${rIn} ${rIn} 0 1 0 ${point(c, rIn, Math.PI)} A ${rIn} ${rIn} 0 1 0 ${point(c, rIn, 0)} Z`,
    ].join(" ");
  }
  const pOut = gap / 2 / rOut;
  const pIn = gap / 2 / rIn;
  const o0 = a0 + pOut;
  const o1 = a1 - pOut;
  if (o1 - o0 <= 0.001) return null;
  let i0 = a0 + pIn;
  let i1 = a1 - pIn;
  if (i1 <= i0) i0 = i1 = (a0 + a1) / 2;
  const largeOut = o1 - o0 > Math.PI ? 1 : 0;
  const largeIn = i1 - i0 > Math.PI ? 1 : 0;
  return (
    `M ${point(c, rOut, o0)} A ${rOut} ${rOut} 0 ${largeOut} 1 ${point(c, rOut, o1)} ` +
    `L ${point(c, rIn, i1)} A ${rIn} ${rIn} 0 ${largeIn} 0 ${point(c, rIn, i0)} Z`
  );
}

const ease = (t: number) => 1 - (1 - t) ** 3;

export function DonutChart({
  data,
  label = "Donut chart",
  size = 240,
  thickness = 36,
  gap = 3,
  cornerRadius = 2,
  hoverOffset = 6,
  format = (v) => NUMBER.format(v),
  formatPercent = defaultPercent,
  centerLabel = "Total",
  showLegend = true,
  legendPosition = "right",
  colors = PALETTE_VARS,
  defaultHidden = [],
  onHiddenChange,
  loading = false,
  loadingText = "Loading chart…",
  emptyText = "No data yet",
  allHiddenText = "All categories hidden",
  hiddenText = "hidden",
  tableHeaders = ["Category", "Value", "Share"],
  animationDuration = 700,
  className,
}: DonutChartProps) {
  const [hidden, setHidden] = useState<string[]>(defaultHidden);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const hiddenFlags = useMemo(() => data.map((d) => hidden.includes(d.label)), [data, hidden]);
  const values = useMemo(() => data.map((d) => Math.max(0, d.value)), [data]);
  // While loading, every arc collapses to 12 o'clock so the data sweeps in when it arrives.
  const targets = useMemo(
    () => computeDonutArcs(values, loading ? values.map(() => true) : hiddenFlags),
    [values, hiddenFlags, loading],
  );

  const fullTotal = values.reduce((a, b) => a + b, 0);
  const visibleTotal = values.reduce((a, v, i) => a + (hiddenFlags[i] ? 0 : v), 0);
  const isEmpty = !loading && fullTotal === 0;
  const allHidden = !loading && !isEmpty && visibleTotal === 0;

  // Displayed angles, tweened toward `targets`. Starts collapsed at 12 o'clock for the mount sweep.
  const [arcs, setArcs] = useState<{ start: number; end: number }[]>(() => targets.map(() => ({ start: 0, end: 0 })));
  const arcsRef = useRef(arcs);

  useEffect(() => {
    const from = arcsRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : animationDuration;
    let raf = 0;
    let t0: number | null = null;
    const tick = (now: number) => {
      t0 ??= now;
      const p = duration <= 0 ? 1 : Math.min(1, (now - t0) / duration);
      const e = ease(p);
      const next = targets.map((t, i) => {
        const f = from[i] ?? { start: t.start, end: t.start };
        return { start: f.start + (t.start - f.start) * e, end: f.end + (t.end - f.end) * e };
      });
      arcsRef.current = next;
      setArcs(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targets, animationDuration]);

  const colorOf = (i: number) => data[i]?.color ?? colors[i % colors.length];

  const candidate = hovered ?? pinned;
  const active = candidate !== null && candidate < data.length && !hiddenFlags[candidate] && values[candidate] > 0 ? candidate : null;

  const toggle = (name: string) => {
    const next = hidden.includes(name) ? hidden.filter((h) => h !== name) : [...hidden, name];
    setHidden(next);
    onHiddenChange?.(next);
  };

  // Geometry in viewBox units. Leave room for the hover push.
  const c = size / 2;
  const rOut = c - hoverOffset - 1;
  const rIn = Math.max(4, rOut - thickness);
  const cr = Math.max(0, Math.min(cornerRadius, thickness / 4));
  const rMid = (rOut + rIn) / 2;
  // Gaps only make sense between two or more visible segments.
  const segGap = values.filter((v, i) => !hiddenFlags[i] && v > 0).length > 1 ? gap + 2 * cr : 0;

  const shareOf = (i: number) => targets[i]?.fraction ?? 0;
  const summary = loading
    ? loadingText
    : isEmpty
      ? `${label}. ${emptyText}.`
      : allHidden
        ? `${label}. ${allHiddenText}.`
        : `${label}. Total ${format(visibleTotal)}. ` +
          data
            .map((d, i) => (hiddenFlags[i] || values[i] === 0 ? null : `${d.label} ${format(d.value)}, ${formatPercent(shareOf(i))}`))
            .filter(Boolean)
            .join("; ") +
          ".";

  const right = legendPosition === "right";
  const holePct = (rIn / c) * 100 * 0.92;

  let center: ReactNode;
  if (loading) {
    center = <span className="text-[clamp(0.7rem,5.5cqw,0.875rem)] text-zinc-500 dark:text-zinc-400">{loadingText}</span>;
  } else if (isEmpty || allHidden) {
    center = (
      <span className="text-balance text-[clamp(0.7rem,5.5cqw,0.875rem)] text-zinc-500 dark:text-zinc-400">
        {isEmpty ? emptyText : allHiddenText}
      </span>
    );
  } else if (active !== null) {
    center = (
      <>
        <span className="flex max-w-full items-center gap-1.5 text-[clamp(0.65rem,5cqw,0.8125rem)] font-medium text-zinc-600 dark:text-zinc-300">
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: colorOf(active) }} />
          <span className="truncate">{data[active].label}</span>
        </span>
        <span className="mt-0.5 max-w-full truncate text-[clamp(1rem,11cqw,1.875rem)] font-semibold leading-tight tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
          {format(data[active].value)}
        </span>
        <span className="text-[clamp(0.65rem,5cqw,0.8125rem)] tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatPercent(shareOf(active))}
        </span>
      </>
    );
  } else {
    center = (
      <>
        <span className="max-w-full truncate text-[clamp(1rem,11cqw,1.875rem)] font-semibold leading-tight tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
          {format(visibleTotal)}
        </span>
        {centerLabel && (
          <span className="mt-0.5 max-w-full text-balance text-[clamp(0.65rem,5cqw,0.8125rem)] text-zinc-500 dark:text-zinc-400">
            {centerLabel}
          </span>
        )}
      </>
    );
  }

  return (
    <div className={cn("lofi-donut-chart @container w-full text-sm text-zinc-700 dark:text-zinc-300", className)}>
      <style href="lofi-donut-chart" precedence="default">
        {STYLE}
      </style>
      <div
        className={cn(
          "flex flex-col items-center gap-6",
          right && showLegend && "@lg:flex-row @lg:items-center @lg:justify-center @lg:gap-8",
        )}
      >
        <div
          className={cn("relative aspect-square w-full shrink-0 [container-type:inline-size]", right && showLegend && "@lg:w-1/2")}
          style={{ maxWidth: size }}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as Element).tagName === "svg") setPinned(null);
          }}
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={summary}
            aria-busy={loading || undefined}
            className="block size-full overflow-visible"
          >
            <circle
              cx={c}
              cy={c}
              r={rMid}
              fill="none"
              strokeWidth={rOut - rIn}
              className={cn("stroke-zinc-100 dark:stroke-zinc-800/80", loading && "motion-safe:animate-pulse")}
            />
            {!loading &&
              arcs.map((a, i) => {
                const d = sectorPath(c, rOut - cr, rIn + cr, a.start, a.end, segGap);
                if (!d || !data[i]) return null;
                const mid = (a.start + a.end) / 2;
                const isActive = active === i;
                const dx = isActive ? Math.sin(mid) * hoverOffset : 0;
                const dy = isActive ? -Math.cos(mid) * hoverOffset : 0;
                const color = colorOf(i);
                return (
                  <path
                    key={`${data[i].label}-${i}`}
                    d={d}
                    fill={color}
                    stroke={cr > 0 ? color : undefined}
                    strokeWidth={cr > 0 ? 2 * cr : undefined}
                    strokeLinejoin="round"
                    fillRule="evenodd"
                    className="lofi-donut-chart-seg cursor-pointer"
                    style={{
                      transform: `translate(${r2(dx)}px, ${r2(dy)}px)`,
                      opacity: active !== null && !isActive ? 0.32 : 1,
                    }}
                    onPointerEnter={() => setHovered(i)}
                    onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
                    onClick={() => setPinned((p) => (p === i ? null : i))}
                  />
                );
              })}
          </svg>
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center"
            style={{ width: `${holePct}%` }}
          >
            {center}
          </div>
        </div>

        {showLegend && (
          <ul
            aria-label={`${label} legend`}
            className={cn(
              "grid w-full gap-1",
              right ? "max-w-sm @lg:w-auto @lg:min-w-56 @lg:flex-1" : "max-w-xl grid-cols-1 @sm:grid-cols-2",
            )}
          >
            {loading
              ? Array.from({ length: Math.max(3, Math.min(data.length || 4, 6)) }, (_, i) => (
                  <li key={i} aria-hidden className="flex h-10 items-center gap-3 px-2.5">
                    <span className="size-3 rounded-full bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800" />
                    <span className="h-3 flex-1 rounded bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800" />
                    <span className="h-3 w-10 rounded bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800" />
                  </li>
                ))
              : data.map((d, i) => {
                  const isHidden = hiddenFlags[i];
                  const color = colorOf(i);
                  return (
                    <li key={`${d.label}-${i}`}>
                      <button
                        type="button"
                        aria-pressed={!isHidden}
                        onClick={() => toggle(d.label)}
                        onPointerEnter={() => setHovered(i)}
                        onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
                        onFocus={() => setHovered(i)}
                        onBlur={() => setHovered((h) => (h === i ? null : h))}
                        className={cn(
                          "group flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left outline-none transition-colors motion-reduce:transition-none",
                          "hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200/70 dark:hover:bg-zinc-800/70 dark:active:bg-zinc-800",
                          active === i && "bg-zinc-100 dark:bg-zinc-800/70",
                        )}
                      >
                        <span
                          aria-hidden
                          className="size-3 shrink-0 rounded-full border-2 transition-[background-color] motion-reduce:transition-none"
                          style={{ borderColor: color, backgroundColor: isHidden ? "transparent" : color }}
                        />
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate",
                            isHidden
                              ? "text-zinc-500 line-through decoration-zinc-400 dark:text-zinc-400 dark:decoration-zinc-500"
                              : "text-zinc-800 dark:text-zinc-200",
                          )}
                        >
                          {d.label}
                          {isHidden && <span className="sr-only"> ({hiddenText})</span>}
                        </span>
                        <span className={cn("shrink-0 tabular-nums", isHidden ? "text-zinc-500 dark:text-zinc-400" : "font-medium text-zinc-900 dark:text-zinc-100")}>
                          {format(d.value)}
                        </span>
                        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                          {isHidden || values[i] === 0 ? "–" : formatPercent(shareOf(i))}
                        </span>
                      </button>
                    </li>
                  );
                })}
          </ul>
        )}
      </div>

      {!loading && data.length > 0 && (
        <table className="sr-only">
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{tableHeaders[0]}</th>
              <th scope="col">{tableHeaders[1]}</th>
              <th scope="col">{tableHeaders[2]}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={`${d.label}-${i}`}>
                <th scope="row">{d.label}</th>
                <td>{format(d.value)}</td>
                <td>{hiddenFlags[i] ? hiddenText : formatPercent(shareOf(i))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
