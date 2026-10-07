"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type CountdownVariant = "flip" | "inline" | "minimal";
export type CountdownStatus = "loading" | "idle" | "running" | "paused" | "done" | "invalid";
export type CountdownUnit = "days" | "hours" | "minutes" | "seconds";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Milliseconds left. */
  total: number;
}

/** Imperative controls, mainly for duration mode. */
export interface CountdownTimerHandle {
  /** Starts or resumes a duration countdown. */
  start: () => void;
  pause: () => void;
  /** Restarts the full duration and runs it. */
  restart: () => void;
  /** Back to the full duration, stopped. */
  reset: () => void;
}

export interface CountdownTimerProps {
  /** Date to count down to. Strings are parsed with Date.parse; numbers are epoch ms. */
  target?: Date | string | number;
  /** Seconds to count down from. Used when there is no target; supports pause and resume. */
  duration?: number;
  /** Fires once when the countdown reaches zero (also when the target is already past on mount). */
  onComplete?: () => void;
  /** Fires when the status changes, e.g. to sync your own pause button. */
  onStatusChange?: (status: CountdownStatus) => void;
  /** flip: split-flap tiles. inline: 02:14:09 text that sits in a sentence. minimal: 2d 14h 09m 12s. */
  variant?: CountdownVariant;
  /** Unit names under the flip tiles and in the screen reader summary. */
  labels?: Partial<Record<CountdownUnit, string>>;
  /** Unit suffixes for the minimal variant. */
  shortLabels?: Partial<Record<CountdownUnit, string>>;
  /** Start a duration countdown on mount. */
  autoStart?: boolean;
  /** "auto" hides the days unit while it is zero. */
  showDays?: boolean | "auto";
  /** inline only. clock: 02:14:09 and 00:00:30. compact: 2:14:09 and 0:30. */
  inlineFormat?: "clock" | "compact";
  /** Pause, resume and restart buttons (duration mode). */
  showControls?: boolean;
  /** Thin progress bar under the timer (duration mode). */
  showProgress?: boolean;
  /** Colons between flip tiles. */
  showSeparators?: boolean;
  /** Flip tile size. */
  size?: "sm" | "md" | "lg";
  /** Replaces the digits once the countdown is done. */
  completedContent?: ReactNode;
  /** Accessible name of the timer, e.g. "Time until launch". */
  label?: string;
  /** Announce the minute summary politely each minute. Off by default: the summary is still readable on demand. */
  announceEachMinute?: boolean;
  /** Builds the screen reader summary. Called with minute precision. */
  formatSummary?: (parts: CountdownParts, status: CountdownStatus) => string;
  /** Screen reader text and live announcement when done. */
  completedText?: string;
  /** Screen reader text before the first tick in target mode. */
  loadingText?: string;
  /** Shown when the target can't be parsed or neither target nor duration is set. */
  invalidText?: string;
  /** Labels of the control buttons. */
  controlLabels?: Partial<Record<"start" | "pause" | "resume" | "restart", string>>;
  /** Imperative handle: start, pause, restart, reset. */
  ref?: Ref<CountdownTimerHandle>;
  /** Classes for the root. For flip tiles, set --cd-top, --cd-bottom and --cd-text to recolor. */
  className?: string;
}

const LABELS: Record<CountdownUnit, string> = { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" };
const SHORT: Record<CountdownUnit, string> = { days: "d", hours: "h", minutes: "m", seconds: "s" };
const CONTROLS = { start: "Start timer", pause: "Pause timer", resume: "Resume timer", restart: "Restart timer" };

const SIZES = {
  sm: { tile: "h-12 min-w-11 px-1.5 text-2xl rounded-md", label: "text-[11px]", sep: "text-xl", gap: "gap-1.5" },
  md: {
    tile: "h-16 min-w-13 px-2 text-3xl rounded-lg @sm:h-20 @sm:min-w-16 @sm:text-4xl",
    label: "text-xs",
    sep: "text-2xl @sm:text-3xl",
    gap: "gap-1.5 @sm:gap-2.5",
  },
  lg: {
    tile: "h-20 min-w-16 px-2 text-4xl rounded-xl @md:h-28 @md:min-w-24 @md:text-6xl",
    label: "text-xs @md:text-sm",
    sep: "text-3xl @md:text-5xl",
    gap: "gap-1.5 @md:gap-3",
  },
} as const;

const STYLE = `
@keyframes lofi-countdown-timer-fold { from { transform: rotateX(0deg); } to { transform: rotateX(-90deg); } }
@keyframes lofi-countdown-timer-land { from { transform: rotateX(90deg); } to { transform: rotateX(0deg); } }
.lofi-countdown-timer-flap-top { z-index: 2; transform-origin: bottom; animation: lofi-countdown-timer-fold 240ms ease-in forwards; }
.lofi-countdown-timer-flap-bottom { z-index: 2; transform-origin: top; animation: lofi-countdown-timer-land 240ms 240ms ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .lofi-countdown-timer-flap-top { display: none; }
  .lofi-countdown-timer-flap-bottom { animation: none; transform: none; }
}
`;

function toParts(ms: number): CountdownParts {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    total: Math.max(0, ms),
  };
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word.replace(/s$/, "") : word}`;

function defaultSummary(p: CountdownParts, status: CountdownStatus, labels: Record<CountdownUnit, string>) {
  if (p.total < 60_000) return `${status === "paused" ? "Paused, l" : "L"}ess than a minute remaining`;
  const units: [number, string][] = [
    [p.days, labels.days.toLowerCase()],
    [p.hours, labels.hours.toLowerCase()],
    [p.minutes, labels.minutes.toLowerCase()],
  ];
  const text = units
    .filter(([n]) => n > 0)
    .map(([n, w]) => plural(n, w))
    .join(", ");
  return `${status === "paused" ? "Paused, " : ""}${text} remaining`;
}

const pad = (n: number) => String(n).padStart(2, "0");

interface RunState {
  phase: "idle" | "running" | "paused" | "done";
  /** Epoch ms when a running duration ends. */
  endAt: number | null;
  /** Ms left when not running. */
  left: number;
}

/**
 * Drift-free countdown: every tick recomputes from Date.now() and schedules the next one
 * on the next whole-second boundary. Renders a stable placeholder on the server.
 */
export function CountdownTimer({
  target,
  duration,
  onComplete,
  onStatusChange,
  variant = "flip",
  labels: labelsProp,
  shortLabels: shortProp,
  autoStart = true,
  showDays = "auto",
  inlineFormat = "clock",
  showControls = false,
  showProgress = false,
  showSeparators = true,
  size = "md",
  completedContent,
  label = "Time remaining",
  announceEachMinute = false,
  formatSummary,
  completedText = "Time's up",
  loadingText = "Calculating time remaining…",
  invalidText = "Invalid countdown date",
  controlLabels: controlProp,
  ref,
  className,
}: CountdownTimerProps) {
  const labels = { ...LABELS, ...labelsProp };
  const short = { ...SHORT, ...shortProp };
  const controlLabels = { ...CONTROLS, ...controlProp };
  const progressId = useId();

  const targetMs =
    target === undefined ? null : target instanceof Date ? target.getTime() : typeof target === "number" ? target : Date.parse(target);
  const isDuration = target === undefined && duration !== undefined;
  const invalid = (target !== undefined && Number.isNaN(targetMs)) || (target === undefined && duration === undefined);
  const totalMs = Math.max(0, (duration ?? 0) * 1000);

  const [now, setNow] = useState<number | null>(null);
  const [run, setRun] = useState<RunState>({ phase: "idle", endAt: null, left: totalMs });

  /* ---------- Controls ---------- */

  const start = useCallback(() => {
    if (!isDuration) return;
    const t = Date.now();
    setNow(t);
    setRun((r) => (r.phase === "running" || r.left <= 0 ? r : { phase: "running", endAt: t + r.left, left: r.left }));
  }, [isDuration]);

  const pause = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setRun((r) => (r.phase !== "running" || r.endAt === null ? r : { phase: "paused", endAt: null, left: Math.max(0, r.endAt - t) }));
  }, []);

  const restart = useCallback(() => {
    if (!isDuration) return;
    const t = Date.now();
    setNow(t);
    setRun({ phase: totalMs > 0 ? "running" : "done", endAt: t + totalMs, left: totalMs });
  }, [isDuration, totalMs]);

  const reset = useCallback(() => setRun({ phase: "idle", endAt: null, left: totalMs }), [totalMs]);

  useImperativeHandle(ref, () => ({ start, pause, restart, reset }), [start, pause, restart, reset]);

  // Auto start after mount, so the server and first client render agree.
  useEffect(() => {
    if (!isDuration || !autoStart) return;
    const id = setTimeout(start, 0);
    return () => clearTimeout(id);
  }, [isDuration, autoStart, start]);

  /* ---------- Ticking ---------- */

  const endAt = isDuration ? (run.phase === "running" ? run.endAt : null) : invalid ? null : targetMs;

  const finish = useEffectEvent(() => {
    if (isDuration) setRun({ phase: "done", endAt: null, left: 0 });
    onComplete?.();
  });

  useEffect(() => {
    if (endAt === null) return;
    let id: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const left = endAt - t;
      if (left <= 0) {
        finish();
        return;
      }
      // Wake just after the displayed second changes.
      id = setTimeout(tick, (left % 1000 || 1000) + 8);
    };
    id = setTimeout(tick, 0);
    // Background tabs throttle timers; catch up as soon as the tab is visible again.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(id);
      tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [endAt]);

  /* ---------- Derived state ---------- */

  let remaining: number | null;
  if (invalid) remaining = null;
  else if (isDuration) remaining = run.phase === "running" && run.endAt !== null && now !== null ? Math.max(0, run.endAt - now) : run.left;
  else remaining = now === null ? null : Math.max(0, (targetMs ?? 0) - now);

  const status: CountdownStatus = invalid
    ? "invalid"
    : remaining === null
      ? "loading"
      : isDuration
        ? run.phase === "running" && remaining <= 0
          ? "done"
          : run.phase
        : remaining <= 0
          ? "done"
          : "running";

  const notifyStatus = useEffectEvent((s: CountdownStatus) => onStatusChange?.(s));
  useEffect(() => {
    notifyStatus(status);
  }, [status]);

  if (invalid) {
    return (
      <span role="alert" className={cn("text-sm font-medium text-rose-700 dark:text-rose-400", className)}>
        {invalidText}
      </span>
    );
  }

  const parts = remaining === null ? null : toParts(remaining);
  const done = status === "done";
  // Before the first tick in target mode the day count is unknown: keep the slot for flip tiles to avoid a jump.
  const daysVisible =
    showDays === true || (showDays === "auto" && (parts ? parts.days > 0 : !isDuration && variant === "flip"));

  // Minute-precision summary, so screen readers never get a per-second stream.
  const minuteParts = parts ? toParts(Math.floor(parts.total / 60_000) * 60_000 + (parts.total < 60_000 ? parts.total : 0)) : null;
  const summary =
    status === "loading"
      ? loadingText
      : done
        ? completedText
        : formatSummary
          ? formatSummary(minuteParts!, status)
          : defaultSummary(minuteParts!, status, labels);

  const units: CountdownUnit[] = daysVisible ? ["days", "hours", "minutes", "seconds"] : ["hours", "minutes", "seconds"];
  const value = (u: CountdownUnit) => (parts ? (u === "days" ? String(parts[u]) : pad(parts[u])) : "--");

  /* ---------- Visuals ---------- */

  let visual: ReactNode;
  if (done && completedContent !== undefined) {
    visual = null;
  } else if (variant === "inline") {
    let text: string;
    if (!parts) text = inlineFormat === "compact" ? "-:--" : "--:--:--";
    else {
      // Without a days unit, hours carry the whole days over (50:00:00).
      const h = daysVisible ? parts.hours : parts.days * 24 + parts.hours;
      const mmss = `${pad(parts.minutes)}:${pad(parts.seconds)}`;
      let clock: string;
      if (daysVisible || inlineFormat === "clock") clock = `${pad(h)}:${mmss}`;
      else clock = h > 0 ? `${h}:${mmss}` : `${parts.minutes}:${pad(parts.seconds)}`;
      text = daysVisible ? `${parts.days}${short.days} ${clock}` : clock;
    }
    visual = <span className={cn("tabular-nums", !parts && "opacity-60")}>{text}</span>;
  } else if (variant === "minimal") {
    visual = (
      <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 tabular-nums", !parts && "motion-safe:animate-pulse")}>
        {units.map((u) => (
          <span key={u} className="inline-flex items-baseline">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{value(u)}</span>
            <span className="ml-0.5 text-[0.75em] text-zinc-500 dark:text-zinc-400">{short[u]}</span>
          </span>
        ))}
      </span>
    );
  } else {
    const sz = SIZES[size];
    visual = (
      <span className={cn("flex items-start justify-center", sz.gap)}>
        {units.map((u, i) => (
          <span key={u} className={cn("flex items-start", sz.gap)}>
            {showSeparators && i > 0 && (
              <span
                className={cn(
                  "flex items-center self-stretch pb-6 font-semibold text-zinc-300 dark:text-zinc-600",
                  sz.sep,
                )}
              >
                :
              </span>
            )}
            <span className="flex flex-col items-center gap-2">
              <FlipTile value={value(u)} className={cn(sz.tile, !parts && "motion-safe:animate-pulse")} />
              <span className={cn("font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400", sz.label)}>
                {labels[u]}
              </span>
            </span>
          </span>
        ))}
      </span>
    );
  }

  const showButtons = showControls && isDuration;
  const progress =
    !parts || totalMs === 0
      ? 1
      : status === "running"
        ? Math.max(0, (Math.ceil(parts.total / 1000) - 1) * 1000) / totalMs
        : parts.total / totalMs;

  const Root = variant === "inline" ? "span" : "div";

  return (
    <Root
      className={cn(
        variant === "flip" && "@container block w-full",
        variant === "flip" && "[--cd-top:#27272a] [--cd-bottom:#1f1f23] [--cd-text:#fafafa]",
        variant === "flip" && "dark:[--cd-top:#3f3f46] dark:[--cd-bottom:#323238] dark:[--cd-text:#fafafa]",
        variant === "minimal" && "inline-flex flex-col gap-2 text-lg",
        variant === "inline" && "inline-flex items-center gap-2",
        className,
      )}
    >
      {variant === "flip" && (
        <style href="lofi-countdown-timer" precedence="default">
          {STYLE}
        </style>
      )}
      <span
        role="timer"
        aria-label={label}
        aria-live={announceEachMinute ? "polite" : "off"}
        aria-atomic="true"
        aria-describedby={showProgress && isDuration ? progressId : undefined}
        className={variant === "inline" ? "inline" : "block"}
      >
        <span className="sr-only">{summary}</span>
        {visual !== null && <span aria-hidden>{visual}</span>}
      </span>

      {done && completedContent !== undefined && completedContent}

      {/* Completion is always announced, even when per-minute announcements are off. */}
      <span className="sr-only" aria-live="polite">
        {done ? completedText : ""}
      </span>

      {showProgress && isDuration && (
        <span
          id={progressId}
          aria-hidden
          className={cn(
            "block h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800",
            variant === "flip" ? "mx-auto mt-4 w-full max-w-xs" : variant === "inline" ? "w-16" : "w-full",
          )}
        >
          <span
            className={cn(
              "block h-full origin-left rounded-full",
              done ? "bg-emerald-500" : status === "paused" ? "bg-amber-500" : "bg-indigo-500",
              status === "running" && "transition-transform duration-1000 ease-linear motion-reduce:transition-none",
            )}
            style={{ transform: `scaleX(${progress})` }}
          />
        </span>
      )}

      {showButtons && (
        <span className={cn("flex items-center gap-2", variant === "flip" && "mt-4 justify-center")}>
          <ControlButton
            label={status === "running" ? controlLabels.pause : status === "paused" ? controlLabels.resume : controlLabels.start}
            onClick={status === "running" ? pause : start}
            disabled={done || status === "loading"}
            primary
          >
            {status === "running" ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          </ControlButton>
          <ControlButton
            label={controlLabels.restart}
            onClick={restart}
            disabled={status === "idle" && run.left === totalMs}
          >
            <RotateCcw className="size-4" aria-hidden />
          </ControlButton>
        </span>
      )}
    </Root>
  );
}

/* ---------- Flip tile ---------- */

/** One split-flap card. Keeps the previous value so the old top half folds down over the new one. */
function FlipTile({ value, className }: { value: string; className?: string }) {
  const [shown, setShown] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== shown) {
    setPrev(shown);
    setShown(value);
  }
  const flipping = prev !== shown;

  return (
    <span
      className={cn(
        "relative block font-semibold tabular-nums leading-none text-(--cd-text) shadow-[0_6px_14px_-6px_rgb(0_0_0/0.45)]",
        className,
      )}
      style={{ perspective: "400px" }}
    >
      {/* Sizer keeps the tile wide enough for its digits. */}
      <span className="invisible flex h-full items-center justify-center">{shown}</span>
      <Half pos="top">{shown}</Half>
      <Half pos="bottom">{prev}</Half>
      {flipping && (
        <>
          <Half key={`t-${shown}`} pos="top" className="lofi-countdown-timer-flap-top">
            {prev}
          </Half>
          <Half key={`b-${shown}`} pos="bottom" className="lofi-countdown-timer-flap-bottom">
            {shown}
          </Half>
        </>
      )}
      <span className="absolute inset-x-0 top-1/2 z-10 h-px -translate-y-px bg-black/50" />
      <span className="absolute -left-px top-1/2 z-10 h-1.5 w-1 -translate-y-1/2 rounded-r-sm bg-black/40" />
      <span className="absolute -right-px top-1/2 z-10 h-1.5 w-1 -translate-y-1/2 rounded-l-sm bg-black/40" />
    </span>
  );
}

function Half({ pos, className, children }: { pos: "top" | "bottom"; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "absolute inset-x-0 h-1/2 overflow-hidden backface-hidden",
        pos === "top" ? "top-0 rounded-t-[inherit] bg-(--cd-top)" : "bottom-0 rounded-b-[inherit] bg-(--cd-bottom)",
        className,
      )}
    >
      <span className={cn("absolute inset-x-0 flex h-[200%] items-center justify-center", pos === "top" ? "top-0" : "bottom-0")}>
        {children}
      </span>
    </span>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  primary,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-900",
        primary
          ? "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
      )}
    >
      {children}
    </button>
  );
}
