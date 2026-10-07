"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { Delete, Eraser, Mic, Paperclip, Pause, PenLine, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export { useTypingActivity } from "./use-typing-activity";
export type { TypingActivityOptions, TypingActivityState } from "./use-typing-activity";

/** What the person is doing right now. "abandoned": they erased their draft instead of sending it. */
export type TypingActivity = "typing" | "paused" | "deleting" | "abandoned" | "recording" | "attaching" | "thinking";
/** How the typing marks look. */
export type TypingIndicatorVariant = "ink" | "keys" | "ghost";
export type TypingIndicatorSize = "sm" | "md" | "lg";
/** Label keys: every activity plus "longDraft" (typing with a long draft). */
export type TypingLabelKey = TypingActivity | "longDraft";

export interface TypingUser {
  /** Stable key; falls back to the name. */
  id?: string;
  name: string;
  avatarUrl?: string;
  /** Defaults to "typing". */
  activity?: TypingActivity;
  /** Typing speed from 0 (slow) to 1 (fast). Sets the animation tempo. */
  intensity?: number;
  /** Characters in their draft. Only the length is shared, never the text. */
  draftLength?: number;
  /** When they started typing (epoch ms). Drives the elapsed timer. */
  startedAt?: number;
}

export interface TypingIndicatorProps {
  /** Shows or hides the indicator with a height and opacity transition. */
  visible?: boolean;
  /** People currently active. Each can have their own activity. */
  users?: TypingUser[];
  variant?: TypingIndicatorVariant;
  size?: TypingIndicatorSize;
  showText?: boolean;
  showAvatars?: boolean;
  /** Small activity icons on each avatar (pen, mic, paperclip…). */
  showActivityBadges?: boolean;
  /** Avatars shown before the rest collapse into a +N chip. */
  maxAvatars?: number;
  /** Use draftLength: the ghost variant grows and long drafts read "writing a long message". */
  draftHint?: boolean;
  /** Draft length that counts as a long message. */
  longDraftAt?: number;
  /** Seconds before an elapsed timer (· 0:42) appears. null turns it off. */
  elapsedAfter?: number | null;
  /** Override wording per activity as [singular, plural], e.g. { typing: ["escribe", "escriben"] }. */
  labels?: Partial<Record<TypingLabelKey, [singular: string, plural: string]>>;
  /** Replace the whole status text. */
  formatText?: (users: TypingUser[]) => string;
  align?: "start" | "end";
  className?: string;
  bubbleClassName?: string;
  /** Color classes for the marks, e.g. "text-indigo-500". Marks draw in currentColor. */
  markClassName?: string;
}

export const DEFAULT_TYPING_LABELS: Record<TypingLabelKey, [string, string]> = {
  typing: ["is typing", "are typing"],
  longDraft: ["is writing a long message", "are writing long messages"],
  paused: ["stopped typing", "stopped typing"],
  deleting: ["is rewriting", "are rewriting"],
  abandoned: ["changed their mind", "changed their minds"],
  recording: ["is recording a voice note", "are recording voice notes"],
  attaching: ["is attaching a file", "are attaching files"],
  thinking: ["is thinking", "are thinking"],
};

// Which activity the shared bubble shows when several people are active.
const PRIORITY: Record<TypingLabelKey, number> = {
  recording: 7,
  attaching: 6,
  longDraft: 5,
  typing: 4,
  deleting: 3,
  thinking: 2,
  paused: 1,
  abandoned: 0,
};

const BADGES: Record<TypingActivity, { icon: LucideIcon; tone: string }> = {
  typing: { icon: PenLine, tone: "text-indigo-600 dark:text-indigo-300" },
  deleting: { icon: Delete, tone: "text-amber-600 dark:text-amber-300" },
  paused: { icon: Pause, tone: "text-zinc-500 dark:text-zinc-400" },
  abandoned: { icon: Eraser, tone: "text-zinc-500 dark:text-zinc-400" },
  recording: { icon: Mic, tone: "text-rose-600 dark:text-rose-400" },
  attaching: { icon: Paperclip, tone: "text-sky-600 dark:text-sky-300" },
  thinking: { icon: Sparkles, tone: "text-violet-600 dark:text-violet-300" },
};

const SIZES = {
  sm: { bubble: "h-8 px-3", gap: "gap-1", key: "size-2.5 rounded-[3px]", keyWide: "h-2.5 w-4 rounded-[3px]", ink: [30, 14], ghost: "h-1", unit: 0.8, bar: "h-3 w-[3px]", caret: "h-3", icon: "size-3.5", track: "h-1 w-8", avatar: "size-6 text-[10px]", badge: "size-3.5", badgeIcon: "size-2", text: "text-xs" },
  md: { bubble: "h-10 px-4", gap: "gap-1.5", key: "size-3 rounded-[4px]", keyWide: "h-3 w-5 rounded-[4px]", ink: [40, 18], ghost: "h-1.5", unit: 1, bar: "h-4 w-1", caret: "h-4", icon: "size-4", track: "h-1.5 w-10", avatar: "size-8 text-xs", badge: "size-4", badgeIcon: "size-2.5", text: "text-xs" },
  lg: { bubble: "h-12 px-5", gap: "gap-2", key: "size-3.5 rounded-[5px]", keyWide: "h-3.5 w-6 rounded-[5px]", ink: [50, 22], ghost: "h-2", unit: 1.25, bar: "h-5 w-[5px]", caret: "h-5", icon: "size-5", track: "h-2 w-12", avatar: "size-10 text-sm", badge: "size-5", badgeIcon: "size-3", text: "text-sm" },
} as const;

type SizeSpec = (typeof SIZES)[TypingIndicatorSize];

// Inline animations are overridden by this class when the user prefers reduced motion.
const REDUCE = "motion-reduce:animate-typing-fade!";

function labelKey(u: TypingUser, draftHint: boolean, longDraftAt: number): TypingLabelKey {
  const a = u.activity ?? "typing";
  if (a === "typing" && draftHint && (u.draftLength ?? 0) >= longDraftAt) return "longDraft";
  return a;
}

function joinNames(list: TypingUser[]) {
  if (list.length === 1) return list[0].name;
  if (list.length === 2) return `${list[0].name} and ${list[1].name}`;
  return `${list[0].name} and ${list.length - 1} others`;
}

/** Tempo multiplier for animation durations: fast typists animate faster. */
function tempoFor(intensity: number | undefined) {
  if (intensity === undefined) return 1;
  if (intensity >= 0.66) return 0.6;
  if (intensity >= 0.33) return 1;
  return 1.5;
}

function toneFor(name: string) {
  const tones = [
    "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
    "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
    "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
    "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/**
 * A typing indicator that shows how someone is writing, not just that they are:
 * typing speed, pauses, rewrites, long drafts, voice notes, attachments and AI thinking.
 */
export function TypingIndicator({
  visible = true,
  users = [],
  variant = "ink",
  size = "md",
  showText = true,
  showAvatars = true,
  showActivityBadges = true,
  maxAvatars = 3,
  draftHint = true,
  longDraftAt = 140,
  elapsedAfter = 10,
  labels,
  formatText,
  align = "start",
  className,
  bubbleClassName,
  markClassName,
}: TypingIndicatorProps) {
  // Keep the last users while collapsing, so the text doesn't change mid-animation.
  const [lastUsers, setLastUsers] = useState(users);
  if (visible && users !== lastUsers) setLastUsers(users);
  const shown = visible ? users : lastUsers;

  const s = SIZES[size];
  const words = { ...DEFAULT_TYPING_LABELS, ...labels };

  const ranked = [...shown].sort(
    (a, b) => PRIORITY[labelKey(b, draftHint, longDraftAt)] - PRIORITY[labelKey(a, draftHint, longDraftAt)],
  );
  const primary: TypingUser = ranked[0] ?? { name: "Someone" };
  const activity = primary.activity ?? "typing";
  const tempo = tempoFor(primary.intensity);

  let text: string;
  if (formatText) text = formatText(shown);
  else if (shown.length === 0) text = `Someone ${words.typing[0]}`;
  else {
    const groups = new Map<TypingLabelKey, TypingUser[]>();
    for (const u of ranked) {
      const k = labelKey(u, draftHint, longDraftAt);
      groups.set(k, [...(groups.get(k) ?? []), u]);
    }
    text = [...groups]
      .map(([k, list]) => `${joinNames(list)} ${words[k][list.length > 1 ? 1 : 0]}`)
      .join(" · ");
  }

  const srText = useDebounced(visible ? text : "", 700);
  const avatars = shown.slice(0, Math.max(0, maxAvatars));
  const overflow = shown.length - avatars.length;
  const hasAvatars = showAvatars && shown.length > 0;
  const ghostWords =
    draftHint && primary.draftLength ? Math.min(6, Math.max(2, Math.round(primary.draftLength / 25) + 1)) : 3;

  return (
    <div
      data-activity={activity}
      data-tempo={tempo}
      className={cn(
        "relative grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
        visible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn("flex items-end gap-2 py-1", align === "end" && "flex-row-reverse")} aria-hidden>
          {hasAvatars && (
            <div className={cn("flex shrink-0", align === "end" ? "flex-row-reverse -space-x-2 space-x-reverse" : "-space-x-2")}>
              {avatars.map((u, i) => {
                const badge = BADGES[u.activity ?? "typing"];
                return (
                  <span key={u.id ?? u.name} className="relative shrink-0" style={{ zIndex: avatars.length - i }} title={u.name}>
                    <span
                      className={cn(
                        "inline-flex items-center justify-center overflow-hidden rounded-full font-semibold ring-2 ring-white dark:ring-zinc-900",
                        s.avatar,
                        !u.avatarUrl && toneFor(u.name),
                      )}
                    >
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        initials(u.name)
                      )}
                    </span>
                    {showActivityBadges && (
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700",
                          s.badge,
                          badge.tone,
                        )}
                      >
                        <badge.icon className={s.badgeIcon} strokeWidth={2.5} />
                      </span>
                    )}
                  </span>
                );
              })}
              {overflow > 0 && (
                <span
                  className={cn(
                    "relative inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-700 ring-2 ring-white dark:bg-zinc-700 dark:text-zinc-200 dark:ring-zinc-900",
                    s.avatar,
                  )}
                >
                  +{overflow}
                </span>
              )}
            </div>
          )}

          <div className={cn("flex min-w-0 flex-col gap-1", align === "end" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "inline-flex w-fit items-center rounded-2xl bg-zinc-100 text-zinc-500 transition-[padding] dark:bg-zinc-800 dark:text-zinc-400",
                align === "end" ? "rounded-br-md" : "rounded-bl-md",
                s.bubble,
                s.gap,
                bubbleClassName,
              )}
            >
              <span className={cn("inline-flex items-center", s.gap, markClassName)}>
                <Marks activity={activity} variant={variant} tempo={tempo} s={s} ghostWords={ghostWords} />
              </span>
            </div>
            {showText && (
              <span className={cn("max-w-full truncate px-1 text-zinc-500 dark:text-zinc-400", s.text)}>
                {text}
                {elapsedAfter !== null && primary.startedAt !== undefined && activity !== "paused" && activity !== "abandoned" && (
                  <Elapsed since={primary.startedAt} after={elapsedAfter} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Outside the aria-hidden visuals, debounced so quick typing/paused flips don't flood screen readers. */}
      <span role="status" aria-live="polite" className="sr-only">
        {srText}
      </span>
    </div>
  );
}

/* ---------- Marks ---------- */

interface MarksProps {
  activity: TypingActivity;
  variant: TypingIndicatorVariant;
  tempo: number;
  s: SizeSpec;
  ghostWords: number;
}

function Marks({ activity, variant, tempo, s, ghostWords }: MarksProps) {
  if (activity === "recording") return <RecordingMarks s={s} />;
  if (activity === "attaching") return <AttachingMarks s={s} />;
  if (activity === "thinking") return <ThinkingMarks s={s} />;
  if (activity === "abandoned") return <AbandonedMarks s={s} />;
  const deleting = activity === "deleting";
  const paused = activity === "paused";
  if (variant === "keys") return <KeysMarks deleting={deleting} paused={paused} tempo={tempo} s={s} />;
  if (variant === "ghost") return <GhostMarks deleting={deleting} paused={paused} tempo={tempo} s={s} count={ghostWords} />;
  return <InkMarks deleting={deleting} paused={paused} tempo={tempo} s={s} />;
}

type MarkState = { deleting: boolean; paused: boolean; tempo: number; s: SizeSpec };

const KEY_CAP =
  "inline-flex items-center justify-center border border-current/40 bg-current/10 shadow-[0_2px_0_0_color-mix(in_oklab,currentColor_45%,transparent)]";

/** Three keycaps tapped in an uneven rhythm; rewriting hammers a backspace key. */
function KeysMarks({ deleting, paused, tempo, s }: MarkState) {
  const durations = [1.05, 1.4, 1.2];
  const delays = [0, 0.35, 0.7];
  return (
    <>
      {[0, 1, 2].map((i) => {
        const backspace = deleting && i === 2;
        const animation = paused
          ? undefined
          : deleting
            ? backspace
              ? `typing-key ${(0.42 * tempo).toFixed(2)}s ease-out infinite`
              : undefined
            : `typing-key ${(durations[i] * tempo).toFixed(2)}s ease-in-out ${(delays[i] * tempo).toFixed(2)}s infinite`;
        return (
          <span
            key={i}
            style={{ animation }}
            className={cn(KEY_CAP, backspace ? s.keyWide : s.key, (paused || (deleting && !backspace)) && "opacity-50", animation && REDUCE)}
          >
            {backspace && <Delete className={s.badgeIcon} strokeWidth={2.5} />}
          </span>
        );
      })}
    </>
  );
}

/** A handwriting stroke that draws itself, then lifts; rewriting plays it backwards like an eraser. */
function InkMarks({ deleting, paused, tempo, s }: MarkState) {
  const [w, h] = s.ink;
  const style: CSSProperties = paused
    ? { strokeDashoffset: 0 }
    : {
        animation: `typing-ink ${(1.8 * tempo).toFixed(2)}s cubic-bezier(.6,0,.4,1) infinite ${deleting ? "reverse" : "normal"}`,
      };
  return (
    <svg width={w} height={h} viewBox="0 0 40 18" fill="none" className={cn("overflow-visible", paused && "opacity-50")}>
      <path
        d="M2 12c2.5-5 5-7 6.5-4.5S7 15 9.5 14 15 4 17.5 5.5 15.5 14 18.5 13.5 24 4.5 26.5 6s-2 7.5 1 7.5 5.5-7 8.5-7 2 4 2 4"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 1"
        style={style}
        className={paused ? undefined : REDUCE}
      />
    </svg>
  );
}

/** Placeholder "words" appear one by one behind a caret; their count follows the draft length. */
function GhostMarks({ deleting, paused, tempo, s, count }: MarkState & { count: number }) {
  const widths = [14, 8, 11, 6, 12, 9];
  const cycle = (1.2 + count * 0.3) * tempo;
  return (
    <>
      {widths.slice(0, count).map((w, i) => {
        const order = deleting ? count - 1 - i : i;
        const animation = paused
          ? undefined
          : deleting
            ? `typing-unghost ${cycle.toFixed(2)}s ease-in ${(order * 0.2 * tempo).toFixed(2)}s infinite`
            : `typing-ghost ${cycle.toFixed(2)}s ease-out ${(order * 0.22 * tempo).toFixed(2)}s infinite backwards`;
        return (
          <span
            key={i}
            style={{ width: w * s.unit, animation }}
            className={cn("block origin-left rounded-full bg-current", s.ghost, paused && "opacity-60", animation && REDUCE)}
          />
        );
      })}
      <span className={cn("block w-[1.5px] rounded-full bg-current motion-safe:animate-typing-caret", s.caret)} />
    </>
  );
}

/** An eraser wipes the draft line away. */
function AbandonedMarks({ s }: { s: SizeSpec }) {
  return (
    <>
      <Eraser className={cn(s.icon, "opacity-70")} strokeWidth={2.2} />
      <span className={cn("relative block overflow-hidden rounded-full", s.track)}>
        <span
          style={{ animation: "typing-unghost 2s ease-in infinite" }}
          className="absolute inset-0 block origin-left rounded-full bg-current/50 motion-reduce:animate-none! motion-reduce:opacity-30"
        />
      </span>
    </>
  );
}

function RecordingMarks({ s }: { s: SizeSpec }) {
  const durations = [0.9, 0.6, 1.1, 0.7, 0.85];
  return (
    <>
      <span className="mr-0.5 block size-2 rounded-full bg-rose-500 motion-safe:animate-typing-fade" />
      {durations.map((d, i) => (
        <span
          key={i}
          style={{ animation: `typing-wave ${d}s ease-in-out ${(i * 0.1).toFixed(1)}s infinite` }}
          className={cn("block origin-center rounded-full bg-current", s.bar, REDUCE)}
        />
      ))}
    </>
  );
}

function AttachingMarks({ s }: { s: SizeSpec }) {
  return (
    <>
      <Paperclip className={s.icon} strokeWidth={2.2} />
      <span className={cn("relative block overflow-hidden rounded-full bg-current/20", s.track)}>
        <span
          style={{ animation: "typing-slide 1.3s ease-in-out infinite" }}
          className={cn("absolute inset-y-0 left-0 block w-2/5 rounded-full bg-current", REDUCE)}
        />
      </span>
    </>
  );
}

function ThinkingMarks({ s }: { s: SizeSpec }) {
  return (
    <>
      <Sparkles style={{ animation: "typing-twinkle 2.2s ease-in-out infinite" }} className={cn(s.icon, REDUCE)} strokeWidth={2.2} />
      <span
        style={{ animation: "typing-shimmer 1.6s linear infinite" }}
        className={cn(
          "block rounded-full bg-[linear-gradient(90deg,color-mix(in_oklab,currentColor_20%,transparent)_0%,currentColor_50%,color-mix(in_oklab,currentColor_20%,transparent)_100%)] [background-size:200%_100%]",
          s.track,
          REDUCE,
        )}
      />
    </>
  );
}

/* ---------- Elapsed timer ---------- */

const clock = {
  listeners: new Set<() => void>(),
  timer: undefined as ReturnType<typeof setInterval> | undefined,
  subscribe(cb: () => void) {
    clock.listeners.add(cb);
    clock.timer ??= setInterval(() => clock.listeners.forEach((l) => l()), 1000);
    return () => {
      clock.listeners.delete(cb);
      if (clock.listeners.size === 0 && clock.timer) {
        clearInterval(clock.timer);
        clock.timer = undefined;
      }
    };
  },
  now: () => Math.floor(Date.now() / 1000),
  server: () => 0,
};

function Elapsed({ since, after }: { since: number; after: number }): ReactNode {
  const now = useSyncExternalStore(clock.subscribe, clock.now, clock.server);
  if (now === 0) return null;
  const secs = Math.max(0, now - Math.floor(since / 1000));
  if (secs < after) return null;
  return (
    <span className="tabular-nums">
      {" · "}
      {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
    </span>
  );
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
