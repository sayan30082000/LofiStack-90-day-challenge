"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GaugeZone {
  /** Start of the zone, in value units. */
  from: number;
  /** End of the zone, in value units. */
  to: number;
  /** Any CSS color. Pick a step with at least 3:1 contrast on your surface, e.g. #059669, #d97706, #e11d48. */
  color: string;
  /** Name of the zone, e.g. "Warning". Shown under the value and read in aria-valuetext. */
  label?: string;
}

export interface GaugeChartProps {
  /** Current value. null or undefined shows the empty state. */
  value: number | null | undefined;
  /** Lowest value on the scale. */
  min?: number;
  /** Highest value on the scale. */
  max?: number;
  /** Colored bands along the arc. Without zones, a single track fills up to the value. */
  zones?: GaugeZone[];
  /** Unit after the value, e.g. "%", "ms" or "pts". */
  unit?: string;
  /** Name of the measure, shown above the gauge and used as the meter's accessible name. */
  label: string;
  /** Hide the visible label (it stays the accessible name). */
  hideLabel?: boolean;
  /** Optional target marker, in value units. */
  target?: number;
  /** Sweep of the arc in degrees. */
  arc?: 180 | 270;
  /** Maximum width in px. The gauge shrinks to fit narrower containers. */
  size?: number;
  /** Arc thickness in viewBox units (the gauge is 200 wide). */
  thickness?: number;
  /** Number of tick intervals between min and max. 0 hides ticks. */
  ticks?: number;
  /** Every nth tick is a long one. */
  majorTickEvery?: number;
  /** Fill color when there are no zones. Defaults to indigo. */
  color?: string;
  /** Formats numbers on the gauge, in min/max labels and in aria-valuetext. */
  format?: (value: number) => string;
  /** Builds aria-valuetext. Defaults to "72%, Warning". */
  valueText?: (formatted: string, zone: GaugeZone | undefined) => string;
  /** Show the zone legend under the gauge. */
  showLegend?: boolean;
  /** Animate the needle with a spring. Always off when the user prefers reduced motion. */
  animate?: boolean;
  /** Sweep up from min when the gauge first appears. */
  animateOnMount?: boolean;
  /** Spring stiffness. Higher is snappier. */
  stiffness?: number;
  /** Spring damping. Lower wobbles more. */
  damping?: number;
  /** Show a pulsing track while the value loads. */
  loading?: boolean;
  /** Error state. Pass a message, or true to use errorText. Replaces the value. */
  error?: string | boolean;
  /** Message for `error={true}`. */
  errorText?: string;
  loadingText?: string;
  emptyText?: string;
  /** Prefix of the target marker label. */
  targetLabel?: string;
  className?: string;
}

const W = 200;
const R = 80;

const GEOMETRY = {
  180: { start: -90, end: 90, cx: 100, cy: 100, height: 150, valueY: 140, labelY: 118 },
  270: { start: -135, end: 135, cx: 100, cy: 100, height: 186, valueY: 154, labelY: 0 },
} as const;

const f2 = (n: number) => n.toFixed(2);

/** Point on a circle, with 0deg at 12 o'clock going clockwise. */
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)] as const;
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  if (a1 - a0 < 0.01) return "";
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${f2(x0)} ${f2(y0)} A ${r} ${r} 0 ${large} 1 ${f2(x1)} ${f2(y1)}`;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const defaultFormat = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/**
 * SVG gauge with colored zones, ticks, an optional target marker and a needle that
 * springs to the value. Exposed as role="meter" with the zone in aria-valuetext.
 */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  zones,
  unit = "",
  label,
  hideLabel = false,
  target,
  arc = 180,
  size = 260,
  thickness = 14,
  ticks = 10,
  majorTickEvery = 5,
  color,
  format = defaultFormat,
  valueText,
  showLegend = true,
  animate = true,
  animateOnMount = true,
  stiffness = 170,
  damping = 15,
  loading = false,
  error,
  errorText = "Couldn't load this value",
  loadingText = "Loading…",
  emptyText = "No data",
  targetLabel = "Target",
  className,
}: GaugeChartProps) {
  const id = useId();
  const g = GEOMETRY[arc];
  const span = max - min || 1;
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const state: "ready" | "loading" | "error" | "empty" = loading
    ? "loading"
    : error
      ? "error"
      : hasValue
        ? "ready"
        : "empty";
  const v = hasValue ? clamp(value, min, max) : min;
  const frac = (v - min) / span;

  /* ---------- Spring-driven needle ---------- */

  const [shown, setShown] = useState(() => (animate && animateOnMount ? 0 : frac));
  const pos = useRef(animate && animateOnMount ? 0 : frac);
  const vel = useRef(0);

  useEffect(() => {
    const reduce = !animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    const step = (t: number) => {
      if (reduce) {
        pos.current = frac;
        vel.current = 0;
        setShown(frac);
        return;
      }
      const dt = last ? Math.min((t - last) / 1000, 1 / 30) : 1 / 60;
      last = t;
      const accel = -stiffness * (pos.current - frac) - damping * vel.current;
      vel.current += accel * dt;
      pos.current += vel.current * dt;
      if (Math.abs(vel.current) < 0.0004 && Math.abs(pos.current - frac) < 0.0004) {
        pos.current = frac;
        vel.current = 0;
        setShown(frac);
        return;
      }
      setShown(pos.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [frac, animate, stiffness, damping]);

  /* ---------- Derived ---------- */

  const sweep = g.end - g.start;
  const angleOf = (val: number) => g.start + ((clamp(val, min, max) - min) / span) * sweep;
  const needleAngle = g.start + clamp(shown, -0.025, 1.025) * sweep;
  const litTo = min + clamp(shown, 0, 1) * span;

  const sortedZones = (zones ?? []).slice().sort((a, b) => a.from - b.from);
  const zoneOf = (val: number) =>
    sortedZones.find((z, i) => val >= z.from && (val < z.to || (i === sortedZones.length - 1 && val <= z.to)));
  const zone = hasValue ? zoneOf(v) : undefined;

  const unitSep = unit && !/^[%°]/.test(unit) ? " " : "";
  const withUnit = (n: number) => `${format(n)}${unitSep}${unit}`;
  const formatted = withUnit(v);
  const ariaText = valueText
    ? valueText(formatted, zone)
    : [formatted, zone?.label, target !== undefined ? `${targetLabel.toLowerCase()} ${withUnit(target)}` : null]
        .filter(Boolean)
        .join(", ");

  const [hoverZone, setHoverZone] = useState<number | null>(null);

  const trackR = R;
  const inner = R - thickness / 2;
  const outer = R + thickness / 2;
  const muted = state !== "ready";

  const tickEls: ReactNode[] = [];
  if (ticks > 0) {
    for (let i = 0; i <= ticks; i++) {
      const a = g.start + (i / ticks) * sweep;
      const major = i % majorTickEvery === 0;
      const [x0, y0] = polar(g.cx, g.cy, inner - 3, a);
      const [x1, y1] = polar(g.cx, g.cy, inner - (major ? 9 : 5.5), a);
      tickEls.push(
        <line
          key={i}
          x1={f2(x0)}
          y1={f2(y0)}
          x2={f2(x1)}
          y2={f2(y1)}
          strokeWidth={major ? 1.5 : 1}
          strokeLinecap="round"
          className={major ? "stroke-zinc-500 dark:stroke-zinc-400" : "stroke-zinc-300 dark:stroke-zinc-600"}
        />,
      );
    }
  }

  const [minX, minY] = polar(g.cx, g.cy, R, g.start);
  const [maxX] = polar(g.cx, g.cy, R, g.end);
  const labelY = arc === 180 ? g.labelY : minY + thickness / 2 + 14;

  const needleLen = inner - 12;
  const { cx, cy } = g;
  const needlePath = `M ${f2(cx - 0.8)} ${f2(cy - needleLen)} L ${f2(cx + 0.8)} ${f2(cy - needleLen)} L ${f2(cx + 3.2)} ${cy} L ${f2(cx + 2)} ${cy + 12} L ${f2(cx - 2)} ${cy + 12} L ${f2(cx - 3.2)} ${cy} Z`;

  const gap = sortedZones.length > 1 ? 0.9 : 0;

  const hovered = hoverZone !== null ? sortedZones[hoverZone] : undefined;
  const hoverAnchor = hovered ? polar(cx, cy, outer + 6, (angleOf(hovered.from) + angleOf(hovered.to)) / 2) : null;

  const errorMessage = typeof error === "string" ? error : errorText;
  const statusText = state === "loading" ? loadingText : state === "empty" ? emptyText : errorMessage;

  // A meter needs a value, so loading, empty and error states are exposed as a labelled image instead.
  const a11y =
    state === "ready"
      ? {
          role: "meter" as const,
          "aria-valuenow": v,
          "aria-valuemin": min,
          "aria-valuemax": max,
          "aria-valuetext": ariaText,
          "aria-labelledby": hideLabel ? undefined : `${id}-label`,
          "aria-label": hideLabel ? label : undefined,
        }
      : {
          role: "img" as const,
          "aria-busy": state === "loading" || undefined,
          "aria-label": `${label}: ${statusText}`,
        };

  return (
    <div className={cn("flex w-full flex-col items-center gap-2", className)} style={{ maxWidth: size }}>
      {!hideLabel && (
        <span id={`${id}-label`} aria-hidden={state !== "ready" || undefined} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
      )}

      <div
        {...a11y}
        className="relative w-full"
        onPointerLeave={() => setHoverZone(null)}
      >
        <svg viewBox={`0 0 ${W} ${g.height}`} width="100%" aria-hidden className="block overflow-visible">
          <g className={cn(state === "loading" && "motion-safe:animate-pulse")}>
            {sortedZones.length > 0 && state === "ready" ? (
              sortedZones.map((z, i) => {
                const a0 = angleOf(z.from) + (i > 0 ? gap / 2 : 0);
                const a1 = angleOf(z.to) - (i < sortedZones.length - 1 ? gap / 2 : 0);
                const litEnd = Math.min(a1, angleOf(litTo));
                const dimmed = hoverZone !== null && hoverZone !== i;
                return (
                  <g key={`${z.from}-${z.to}`} className="transition-opacity duration-200 motion-reduce:transition-none" opacity={dimmed ? 0.45 : 1}>
                    <path d={arcPath(cx, cy, trackR, a0, a1)} fill="none" stroke={z.color} strokeOpacity={0.22} strokeWidth={thickness} />
                    {litEnd > a0 && (
                      <path d={arcPath(cx, cy, trackR, a0, litEnd)} fill="none" stroke={z.color} strokeWidth={thickness} />
                    )}
                    {/* Wider invisible hit area for the hover tooltip. */}
                    <path
                      d={arcPath(cx, cy, trackR, a0, a1)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={thickness + 12}
                      pointerEvents="stroke"
                      onPointerEnter={() => setHoverZone(i)}
                    />
                  </g>
                );
              })
            ) : (
              <>
                <path
                  d={arcPath(cx, cy, trackR, g.start, g.end)}
                  fill="none"
                  strokeWidth={thickness}
                  strokeLinecap="round"
                  strokeDasharray={state === "empty" || state === "error" ? "3 5" : undefined}
                  className={cn(
                    state === "error" ? "stroke-rose-200 dark:stroke-rose-500/30" : "stroke-zinc-200 dark:stroke-zinc-800",
                    state === "empty" && "stroke-zinc-300 dark:stroke-zinc-700",
                  )}
                />
                {state === "ready" && shown > 0.002 && (
                  <path
                    d={arcPath(cx, cy, trackR, g.start, angleOf(litTo))}
                    fill="none"
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    stroke={color}
                    className={cn(!color && "stroke-indigo-600 dark:stroke-indigo-400")}
                  />
                )}
              </>
            )}
          </g>

          {tickEls}

          {target !== undefined && state === "ready" && (
            <g>
              {(() => {
                const a = angleOf(target);
                const [x0, y0] = polar(cx, cy, inner - 1.5, a);
                const [x1, y1] = polar(cx, cy, outer + 1.5, a);
                const [tx, ty] = polar(cx, cy, outer + 3, a);
                const [lx, ly] = polar(cx, cy, outer + 10, a - 3.2);
                const [rx, ry] = polar(cx, cy, outer + 10, a + 3.2);
                return (
                  <>
                    <line
                      x1={f2(x0)}
                      y1={f2(y0)}
                      x2={f2(x1)}
                      y2={f2(y1)}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      className="stroke-zinc-900 dark:stroke-white"
                    />
                    <path
                      d={`M ${f2(tx)} ${f2(ty)} L ${f2(lx)} ${f2(ly)} L ${f2(rx)} ${f2(ry)} Z`}
                      className="fill-zinc-900 dark:fill-white"
                    />
                  </>
                );
              })()}
            </g>
          )}

          <text
            x={f2(minX)}
            y={f2(labelY)}
            textAnchor="middle"
            fontSize={11}
            className="fill-zinc-600 tabular-nums dark:fill-zinc-400"
          >
            {format(min)}
          </text>
          <text
            x={f2(maxX)}
            y={f2(labelY)}
            textAnchor="middle"
            fontSize={11}
            className="fill-zinc-600 tabular-nums dark:fill-zinc-400"
          >
            {format(max)}
          </text>

          {state === "ready" && (
            <g transform={`rotate(${f2(needleAngle)} ${cx} ${cy})`}>
              <path d={needlePath} className="fill-zinc-800 dark:fill-zinc-100" />
            </g>
          )}
          <circle cx={cx} cy={cy} r={8} className={muted ? "fill-zinc-300 dark:fill-zinc-700" : "fill-zinc-800 dark:fill-zinc-100"} />
          <circle cx={cx} cy={cy} r={3} className="fill-white dark:fill-zinc-900" />

          <text
            x={cx}
            y={g.valueY}
            textAnchor="middle"
            className={cn(
              "tabular-nums",
              state === "ready" ? "fill-zinc-900 dark:fill-zinc-50" : "fill-zinc-400 dark:fill-zinc-500",
            )}
          >
            <tspan fontSize={30} fontWeight={650} letterSpacing={-0.5}>
              {state === "ready" ? format(v) : "—"}
            </tspan>
            {state === "ready" && unit && (
              <tspan fontSize={14} fontWeight={500} dx={unitSep ? 3 : 1} className="fill-zinc-500 dark:fill-zinc-400">
                {unit}
              </tspan>
            )}
          </text>
        </svg>

        {hovered && hoverAnchor && (
          <span
            aria-hidden
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
            style={{ left: `${(hoverAnchor[0] / W) * 100}%`, top: `${(hoverAnchor[1] / g.height) * 100}%` }}
          >
            {hovered.label ? `${hovered.label} · ` : ""}
            {format(hovered.from)}–{withUnit(hovered.to)}
          </span>
        )}
      </div>

      {/* Visual summary only: the same information is in aria-valuetext or the image label. */}
      <div className="flex min-h-7 flex-wrap items-center justify-center" aria-hidden>
        {state === "ready" && zone?.label && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <span className="size-2 rounded-full" style={{ background: zone.color }} />
            {zone.label}
          </span>
        )}
        {state === "ready" && target !== undefined && (
          <span className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">
            {targetLabel} {withUnit(target)}
          </span>
        )}
        {state === "loading" && (
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <LoaderCircle className="size-3.5 motion-safe:animate-spin" aria-hidden /> {loadingText}
          </span>
        )}
        {state === "empty" && <span className="text-xs text-zinc-600 dark:text-zinc-400">{emptyText}</span>}
        {state === "error" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
            <CircleAlert className="size-3.5 shrink-0" aria-hidden /> {errorMessage}
          </span>
        )}
      </div>

      {showLegend && sortedZones.length > 0 && (
        <ul aria-hidden className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          {sortedZones.map((z, i) => (
            <li
              key={`${z.from}-${z.to}`}
              onPointerEnter={() => setHoverZone(i)}
              onPointerLeave={() => setHoverZone(null)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-1 transition-opacity motion-reduce:transition-none",
                hoverZone !== null && hoverZone !== i && "opacity-50",
                state === "ready" && zone === z && "font-semibold text-zinc-900 dark:text-zinc-100",
              )}
            >
              <span className="size-2 rounded-sm" style={{ background: z.color }} />
              {z.label ?? `${format(z.from)}–${format(z.to)}`}
              {z.label && (
                <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                  {format(z.from)}–{format(z.to)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
