"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/** A selected range as [low, high]. */
export type RangeValue = [number, number];

export interface RangeSliderProps {
  /** Lowest selectable value. */
  min?: number;
  /** Highest selectable value. */
  max?: number;
  /** Increment between values. PageUp and PageDown move ten steps. */
  step?: number;
  /** Selected range (controlled). */
  value?: RangeValue;
  /** Initial range (uncontrolled). Defaults to [min, max]. */
  defaultValue?: RangeValue;
  /** Fires on every change while dragging, typing or pressing keys. */
  onChange?: (value: RangeValue) => void;
  /** Fires once a change is committed: pointer released, key pressed or input blurred. */
  onChangeEnd?: (value: RangeValue) => void;
  /** Smallest allowed distance between the two thumbs, so they can never cross. */
  minGap?: number;
  /** Formats values for the readout, tooltips, inputs hint and aria-valuetext. */
  formatValue?: (n: number) => string;
  /** Shows two number inputs that stay in sync with the thumbs both ways. */
  showInputs?: boolean;
  /** Bar heights drawn above the track, spread evenly from min to max. Bars inside the range are highlighted. */
  histogram?: number[];
  /** Shows a skeleton in place of the histogram, e.g. while counts load. */
  histogramLoading?: boolean;
  /** Histogram height in pixels. */
  histogramHeight?: number;
  /** Shown when `histogram` is an empty array or all zeros. */
  histogramEmptyText?: string;
  /** Disables dragging, keys and inputs. */
  disabled?: boolean;
  /** Visible label above the slider. Also names the group. */
  label?: ReactNode;
  /** Accessible name when there is no visible label. */
  ariaLabel?: string;
  /** Accessible names of the two thumbs. */
  thumbLabels?: [string, string];
  /** Visible labels of the two inputs. Default to thumbLabels. */
  inputLabels?: [string, string];
  /** Text shown inside the inputs before the number, e.g. "$". */
  inputPrefix?: string;
  /** Text shown inside the inputs after the number, e.g. "yrs". */
  inputSuffix?: string;
  /** Shows the formatted "low – high" readout next to the label. */
  showValue?: boolean;
  /** Text between the two values in the readout. */
  separator?: string;
  /** auto: while hovering, focusing or dragging a thumb. always or never. */
  tooltip?: "auto" | "always" | "never";
  /** Error message below the slider. Marks the thumbs invalid. */
  error?: ReactNode;
  /** Message for an out-of-range number in an input. */
  inputErrorText?: (low: string, high: string) => string;
  /** Names for two hidden inputs so the range posts with a native form. */
  name?: [string, string];
  /** Classes for the root. Override --rs-accent, --rs-bar and --rs-bar-on to recolor. */
  className?: string;
}

type Thumb = 0 | 1;

interface DragState {
  pointerId: number;
  /** null until the first move decides which of two stacked thumbs to drag. */
  thumb: Thumb | null;
  startX: number;
  /** Distance between the pointer and the thumb center when a thumb itself was grabbed. */
  offset: number;
  changed: boolean;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

function decimalsOf(n: number) {
  const s = String(n);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

const defaultInputError = (low: string, high: string) => `Enter a value from ${low} to ${high}`;

export function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value: valueProp,
  defaultValue,
  onChange,
  onChangeEnd,
  minGap = 0,
  formatValue = String,
  showInputs = false,
  histogram,
  histogramLoading = false,
  histogramHeight = 56,
  histogramEmptyText = "No data for this range",
  disabled = false,
  label,
  ariaLabel,
  thumbLabels = ["Minimum", "Maximum"],
  inputLabels,
  inputPrefix,
  inputSuffix,
  showValue = true,
  separator = "–",
  tooltip = "auto",
  error,
  inputErrorText = defaultInputError,
  name,
  className,
}: RangeSliderProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const span = Math.max(max - min, Number.EPSILON);

  const [inner, setInner] = useState<RangeValue>(defaultValue ?? [min, max]);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : inner;
  const [lo, hi] = value;

  const [active, setActive] = useState<Thumb | null>(null);
  const [dragging, setDragging] = useState(false);
  const [top, setTop] = useState<Thumb>(1);
  const [drafts, setDrafts] = useState<[string | null, string | null]>([null, null]);

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<[HTMLDivElement | null, HTMLDivElement | null]>([null, null]);
  const drag = useRef<DragState | null>(null);
  const latest = useRef<RangeValue>(value);

  useEffect(() => {
    latest.current = value;
  }, [value]);

  const snap = useCallback(
    (n: number) => {
      const stepped = min + Math.round((n - min) / step) * step;
      return clamp(Number(stepped.toFixed(decimalsOf(step))), min, max);
    },
    [min, max, step],
  );

  /** Moves one thumb, keeping the other in place and the gap intact. */
  const withThumb = useCallback(
    (base: RangeValue, thumb: Thumb, raw: number): RangeValue => {
      const v = snap(raw);
      return thumb === 0 ? [clamp(v, min, base[1] - minGap), base[1]] : [base[0], clamp(v, base[0] + minGap, max)];
    },
    [snap, min, max, minGap],
  );

  const update = useCallback(
    (next: RangeValue) => {
      const cur = latest.current;
      if (next[0] === cur[0] && next[1] === cur[1]) return false;
      latest.current = next;
      if (!controlled) setInner(next);
      onChange?.(next);
      return true;
    },
    [controlled, onChange],
  );

  const pct = (n: number) => clamp(((n - min) / span) * 100, 0, 100);
  const loPct = pct(lo);
  const hiPct = pct(hi);

  /* ---------- Pointer ---------- */

  const valueAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return min;
    return min + clamp((clientX - rect.left) / rect.width, 0, 1) * span;
  };

  const focusThumb = (thumb: Thumb) => {
    thumbRefs.current[thumb]?.focus({ preventScroll: true });
    setActive(thumb);
    setTop(thumb);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    const raw = valueAt(e.clientX);
    const [a, b] = latest.current;
    const grabbed = (e.target as HTMLElement).closest<HTMLElement>("[data-thumb]")?.dataset.thumb;

    let thumb: Thumb | null;
    if (a === b) thumb = raw < a ? 0 : raw > b ? 1 : null;
    else if (grabbed !== undefined) thumb = Number(grabbed) as Thumb;
    else thumb = Math.abs(raw - a) <= Math.abs(raw - b) ? 0 : 1;

    const offset = grabbed !== undefined && thumb !== null ? raw - latest.current[thumb] : 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, thumb, startX: e.clientX, offset, changed: false };
    setDragging(true);

    if (thumb !== null) {
      focusThumb(thumb);
      if (grabbed === undefined) drag.current.changed = update(withThumb(latest.current, thumb, raw));
    } else {
      thumbRefs.current[top]?.focus({ preventScroll: true });
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (d.thumb === null) {
      // Two thumbs on the same spot: the drag direction picks one.
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) < 2) return;
      d.thumb = dx < 0 ? 0 : 1;
      focusThumb(d.thumb);
    }
    if (update(withThumb(latest.current, d.thumb, valueAt(e.clientX) - d.offset))) d.changed = true;
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(false);
    setActive(null);
    if (d.changed) onChangeEnd?.(latest.current);
  };

  /* ---------- Keyboard ---------- */

  const onThumbKey = (thumb: Thumb, e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const cur = latest.current;
    const v = cur[thumb];
    let target: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        target = v + step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        target = v - step;
        break;
      case "PageUp":
        target = v + step * 10;
        break;
      case "PageDown":
        target = v - step * 10;
        break;
      case "Home":
        target = thumb === 0 ? min : cur[0] + minGap;
        break;
      case "End":
        target = thumb === 0 ? cur[1] - minGap : max;
        break;
      default:
        return;
    }
    e.preventDefault();
    setTop(thumb);
    const next = withThumb(cur, thumb, target);
    if (update(next)) onChangeEnd?.(next);
  };

  /* ---------- Inputs ---------- */

  const bounds = (thumb: Thumb): [number, number] => (thumb === 0 ? [min, hi - minGap] : [lo + minGap, max]);

  const parse = (text: string) => {
    const n = Number(text.replace(/[^\d.\-]/g, ""));
    return text.trim() === "" || Number.isNaN(n) ? null : n;
  };

  const draftInvalid = (thumb: Thumb) => {
    const text = drafts[thumb];
    if (text === null) return false;
    const n = parse(text);
    const [a, b] = bounds(thumb);
    return n === null || n < a || n > b;
  };

  const setDraft = (thumb: Thumb, text: string | null) =>
    setDrafts((d) => (thumb === 0 ? [text, d[1]] : [d[0], text]));

  const onInput = (thumb: Thumb, text: string) => {
    setDraft(thumb, text);
    const n = parse(text);
    const [a, b] = bounds(thumb);
    if (n !== null && n >= a && n <= b) update(withThumb(latest.current, thumb, n));
  };

  const commitInput = (thumb: Thumb) => {
    const text = drafts[thumb];
    setDraft(thumb, null);
    if (text === null) return;
    const n = parse(text);
    if (n !== null) update(withThumb(latest.current, thumb, n));
    onChangeEnd?.(latest.current);
  };

  /* ---------- Rendering ---------- */

  const bars = histogram ?? [];
  const tallest = bars.reduce((m, h) => Math.max(m, h), 0);
  const histogramEmpty = histogram !== undefined && !histogramLoading && tallest <= 0;
  const showHistogram = histogram !== undefined || histogramLoading;
  const invalid = Boolean(error);
  const fieldLabels = inputLabels ?? thumbLabels;
  const anim = !dragging && "transition-[left,width] duration-150 ease-out motion-reduce:transition-none";

  return (
    <div
      role="group"
      aria-labelledby={label ? labelId : undefined}
      aria-label={label ? undefined : ariaLabel}
      aria-disabled={disabled || undefined}
      className={cn(
        "w-full text-sm text-zinc-800 dark:text-zinc-200",
        "[--rs-accent:#4f46e5] [--rs-bar-on:#818cf8] [--rs-bar:#e4e4e7]",
        "dark:[--rs-accent:#818cf8] dark:[--rs-bar-on:#6366f1] dark:[--rs-bar:#3f3f46]",
        invalid && "[--rs-accent:#e11d48] dark:[--rs-accent:#fb7185]",
        disabled && "opacity-55",
        className,
      )}
    >
      {(label || showValue) && (
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {label ? (
            <span id={labelId} className="font-medium text-zinc-900 dark:text-zinc-100">
              {label}
            </span>
          ) : (
            <span />
          )}
          {showValue && (
            <span className="font-medium tabular-nums text-zinc-600 dark:text-zinc-400">
              {formatValue(lo)} {separator} {formatValue(hi)}
            </span>
          )}
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        className={cn("relative touch-none select-none px-5", disabled ? "cursor-not-allowed" : "cursor-pointer")}
      >
        {showHistogram && (
          <div aria-hidden className="relative" style={{ height: histogramHeight }}>
            {histogramLoading ? (
              <div className="flex h-full items-end gap-[2px]">
                {Array.from({ length: 24 }, (_, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-sm bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800"
                    style={{ height: `${30 + ((i * 37) % 60)}%`, animationDelay: `${(i % 6) * 120}ms` }}
                  />
                ))}
              </div>
            ) : histogramEmpty ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                {histogramEmptyText}
              </div>
            ) : (
              <div className="flex h-full items-end gap-[2px]">
                {bars.map((h, i) => {
                  const b0 = (i / bars.length) * 100;
                  const b1 = ((i + 1) / bars.length) * 100;
                  const from = clamp(((loPct - b0) / (b1 - b0)) * 100, 0, 100);
                  const to = clamp(((hiPct - b0) / (b1 - b0)) * 100, 0, 100);
                  return (
                    <span
                      key={i}
                      className="flex-1 rounded-t-[3px]"
                      style={{
                        height: h > 0 ? `${Math.max((h / tallest) * 100, 4)}%` : 2,
                        background: `linear-gradient(to right, var(--rs-bar) ${from}%, var(--rs-bar-on) ${from}% ${to}%, var(--rs-bar) ${to}%)`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div ref={trackRef} className="relative h-10">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div
            className={cn("absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--rs-accent)", anim)}
            style={{ left: `${loPct}%`, width: `${hiPct - loPct}%` }}
          />

          {([0, 1] as const).map((thumb) => {
            const v = value[thumb];
            const p = thumb === 0 ? loPct : hiPct;
            const [vMin, vMax] = bounds(thumb);
            const showTip = tooltip === "always" || (tooltip === "auto" && active === thumb);
            return (
              <div
                key={thumb}
                ref={(el) => {
                  thumbRefs.current[thumb] = el;
                }}
                role="slider"
                data-thumb={thumb}
                tabIndex={disabled ? -1 : 0}
                aria-label={thumbLabels[thumb]}
                aria-valuemin={vMin}
                aria-valuemax={Math.max(vMin, vMax)}
                aria-valuenow={v}
                aria-valuetext={formatValue(v)}
                aria-orientation="horizontal"
                aria-disabled={disabled || undefined}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? errorId : undefined}
                onKeyDown={(e) => onThumbKey(thumb, e)}
                onFocus={() => setTop(thumb)}
                style={{ left: `${p}%`, zIndex: top === thumb ? 3 : 2 } as CSSProperties}
                className={cn(
                  "group/thumb absolute top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none",
                  anim,
                  disabled ? "cursor-not-allowed" : dragging && active === thumb ? "cursor-grabbing" : "cursor-grab",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-5 rounded-full border-2 border-(--rs-accent) bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none dark:bg-zinc-950",
                    "group-focus-visible/thumb:ring-4 group-focus-visible/thumb:ring-indigo-500/35",
                    !disabled && "group-hover/thumb:scale-110",
                    active === thumb && "scale-115 ring-4 ring-indigo-500/20",
                  )}
                />
                {tooltip !== "never" && (
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute bottom-full left-1/2 mb-0.5 transition-[opacity,translate] duration-150 motion-reduce:transition-none",
                      showTip
                        ? "translate-y-0 opacity-100"
                        : "translate-y-1 opacity-0 group-focus-visible/thumb:translate-y-0 group-focus-visible/thumb:opacity-100",
                      tooltip === "auto" && !disabled && "group-hover/thumb:translate-y-0 group-hover/thumb:opacity-100",
                    )}
                  >
                    <span
                      className="block whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold tabular-nums text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
                      style={{ transform: `translateX(-${p}%)` }}
                    >
                      {formatValue(v)}
                    </span>
                    <span className="absolute left-0 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-zinc-900 dark:border-t-zinc-100" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showInputs && (
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
          {renderField(0)}
          <span aria-hidden className="pt-8 text-zinc-500 dark:text-zinc-400">
            {separator}
          </span>
          {renderField(1)}
        </div>
      )}

      {name && (
        <>
          <input type="hidden" name={name[0]} value={lo} />
          <input type="hidden" name={name[1]} value={hi} />
        </>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs font-medium text-rose-700 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );

  function renderField(thumb: Thumb) {
    const bad = draftInvalid(thumb);
    const [a, b] = bounds(thumb);
    const inputId = `${id}-input-${thumb}`;
    const hintId = `${id}-hint-${thumb}`;
    return (
      <div className="min-w-0">
        <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {fieldLabels[thumb]}
        </label>
        <div
          className={cn(
            "flex h-10 items-center gap-1 rounded-lg border bg-white px-3 transition-colors focus-within:ring-2 motion-reduce:transition-none dark:bg-zinc-950",
            bad
              ? "border-rose-500 focus-within:ring-rose-500/30 dark:border-rose-400"
              : "border-zinc-300 hover:border-zinc-400 focus-within:border-indigo-500 focus-within:ring-indigo-500/30 dark:border-zinc-700 dark:hover:border-zinc-600",
            disabled && "pointer-events-none bg-zinc-50 dark:bg-zinc-900",
          )}
        >
          {inputPrefix && (
            <span aria-hidden className="shrink-0 text-zinc-500 dark:text-zinc-400">
              {inputPrefix}
            </span>
          )}
          <input
            id={inputId}
            type="number"
            inputMode="decimal"
            min={a}
            max={Math.max(a, b)}
            step={step}
            disabled={disabled}
            value={drafts[thumb] ?? String(value[thumb])}
            aria-invalid={bad || undefined}
            aria-describedby={bad ? hintId : undefined}
            onChange={(e) => onInput(thumb, e.target.value)}
            onBlur={() => commitInput(thumb)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitInput(thumb);
              if (e.key === "Escape") setDraft(thumb, null);
            }}
            className="h-full w-full min-w-0 bg-transparent tabular-nums outline-none [appearance:textfield] disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {inputSuffix && (
            <span aria-hidden className="shrink-0 text-zinc-500 dark:text-zinc-400">
              {inputSuffix}
            </span>
          )}
        </div>
        <p id={hintId} aria-live="polite" className="mt-1 min-h-4 text-xs text-rose-700 dark:text-rose-400">
          {bad ? inputErrorText(formatValue(a), formatValue(Math.max(a, b))) : ""}
        </p>
      </div>
    );
  }
}
