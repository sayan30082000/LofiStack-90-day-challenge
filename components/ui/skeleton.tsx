"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type SkeletonAnimation = "shimmer" | "pulse" | "none";
/** A number is pixels; a string is any CSS length, e.g. "60%" or "2rem". */
export type SkeletonSize = number | string;

const css = (v: SkeletonSize | undefined) => (typeof v === "number" ? `${v}px` : v);

/*
  The shimmer uses a viewport-fixed gradient, so every skeleton on the page is lit by
  the same sweep of light instead of each block running its own out-of-sync shine.
*/
const STYLES = `
.lofi-skeleton-shimmer {
  background-image: linear-gradient(100deg, transparent 20%, var(--lofi-skeleton-sheen) 50%, transparent 80%);
  background-size: 60vw 100%;
  background-repeat: no-repeat;
  background-attachment: fixed;
  animation: lofi-skeleton-sweep 2s linear infinite;
}
@keyframes lofi-skeleton-sweep {
  from { background-position: -60vw 0; }
  to { background-position: 160vw 0; }
}
@keyframes lofi-skeleton-reveal {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}
.lofi-skeleton-reveal { animation: lofi-skeleton-reveal 400ms cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) {
  .lofi-skeleton-shimmer { animation: none; background-image: none; }
  .lofi-skeleton-reveal { animation-name: none; }
}
`;

function SkeletonStyles() {
  return (
    <style href="lofi-skeleton" precedence="default">
      {STYLES}
    </style>
  );
}

const AnimationContext = createContext<SkeletonAnimation | null>(null);

function useAnimation(own: SkeletonAnimation | undefined): SkeletonAnimation {
  const inherited = useContext(AnimationContext);
  return own ?? inherited ?? "shimmer";
}

const BASE =
  "block max-w-full shrink-0 bg-zinc-200 dark:bg-zinc-800 [--lofi-skeleton-sheen:rgb(255_255_255/0.75)] dark:[--lofi-skeleton-sheen:rgb(255_255_255/0.07)]";

/* ---------- Primitives ---------- */

export interface SkeletonProps {
  /** Width. Number = px. */
  width?: SkeletonSize;
  /** Height. Number = px. */
  height?: SkeletonSize;
  /** Corner radius. Number = px. */
  radius?: SkeletonSize;
  /** Defaults to the surrounding SkeletonWrapper's animation, then "shimmer". */
  animation?: SkeletonAnimation;
  /** Extra classes, e.g. a different background color. */
  className?: string;
  style?: CSSProperties;
}

/** A rectangle placeholder. */
export function Skeleton({ width = "100%", height = 16, radius = 8, animation, className, style }: SkeletonProps) {
  const anim = useAnimation(animation);
  return (
    <span
      aria-hidden
      data-skeleton=""
      className={cn(
        BASE,
        anim === "shimmer" && "lofi-skeleton-shimmer",
        anim === "pulse" && "motion-safe:animate-pulse",
        className,
      )}
      style={{ width: css(width), height: css(height), borderRadius: css(radius), ...style }}
    >
      <SkeletonStyles />
    </span>
  );
}

export interface SkeletonTextProps extends Omit<SkeletonProps, "height" | "width"> {
  /** Number of lines. */
  lines?: number;
  /** Space between lines. Number = px. */
  gap?: SkeletonSize;
  /** Height of each line. Number = px. */
  lineHeight?: SkeletonSize;
  /** Width of the last line when there is more than one. */
  lastLineWidth?: SkeletonSize;
  /** Widths of the other lines, cycled. Slight variety looks more like real text. */
  widths?: SkeletonSize[];
}

/** A paragraph placeholder: n lines, the last one shorter. */
export function SkeletonText({
  lines = 3,
  gap = 8,
  lineHeight = 12,
  lastLineWidth = "60%",
  widths = ["100%", "96%", "92%", "98%"],
  radius = 6,
  animation,
  className,
  style,
}: SkeletonTextProps) {
  const count = Math.max(1, Math.floor(lines));
  return (
    <span aria-hidden className={cn("flex w-full flex-col", className)} style={{ gap: css(gap), ...style }}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          radius={radius}
          animation={animation}
          width={count > 1 && i === count - 1 ? lastLineWidth : widths[i % widths.length]}
        />
      ))}
    </span>
  );
}

export interface SkeletonCircleProps extends Omit<SkeletonProps, "width" | "height" | "radius"> {
  /** Diameter. Number = px. */
  size?: SkeletonSize;
}

/** A round placeholder for avatars and icons. */
export function SkeletonCircle({ size = 40, ...rest }: SkeletonCircleProps) {
  return <Skeleton width={size} height={size} radius="9999px" {...rest} />;
}

/* ---------- Presets ---------- */

interface PresetBase {
  animation?: SkeletonAnimation;
  className?: string;
}

export interface SkeletonCardProps extends PresetBase {
  /** Show the media block on top. */
  media?: boolean;
  mediaHeight?: SkeletonSize;
  /** Body text lines under the title. */
  lines?: number;
  /** Avatar and meta row at the bottom. */
  footer?: boolean;
  /** Draw the card border and background. */
  bordered?: boolean;
}

export function SkeletonCard({ media = true, mediaHeight = 160, lines = 2, footer = true, bordered = true, animation, className }: SkeletonCardProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex w-full flex-col gap-4",
        bordered && "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      {media && <Skeleton height={mediaHeight} radius={10} animation={animation} />}
      <div className="flex flex-col gap-3">
        <Skeleton height={18} width="70%" animation={animation} />
        <SkeletonText lines={lines} animation={animation} />
      </div>
      {footer && (
        <div className="flex items-center gap-3">
          <SkeletonCircle size={32} animation={animation} />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton height={10} width="40%" animation={animation} />
            <Skeleton height={10} width="25%" animation={animation} />
          </div>
        </div>
      )}
    </div>
  );
}

export interface SkeletonListItemProps extends PresetBase {
  avatarSize?: SkeletonSize;
  lines?: number;
  /** Small block on the right, e.g. a time or a button. */
  trailing?: boolean;
}

export function SkeletonListItem({ avatarSize = 40, lines = 2, trailing = true, animation, className }: SkeletonListItemProps) {
  return (
    <div aria-hidden className={cn("flex w-full items-center gap-3 py-3", className)}>
      <SkeletonCircle size={avatarSize} animation={animation} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton height={12} width="45%" animation={animation} />
        {lines > 1 && <SkeletonText lines={lines - 1} lineHeight={10} lastLineWidth="70%" widths={["80%"]} animation={animation} />}
      </div>
      {trailing && <Skeleton height={24} width={56} radius={6} animation={animation} />}
    </div>
  );
}

export interface SkeletonTableRowProps extends PresetBase {
  columns?: number;
  /** Width of the bar in each column, cycled. */
  widths?: SkeletonSize[];
  /** Avatar circle in the first cell. */
  leadingCircle?: boolean;
  /** Classes for each <td>. */
  cellClassName?: string;
}

/** A <tr> placeholder. Render it inside a <tbody>. */
export function SkeletonTableRow({
  columns = 4,
  widths = ["70%", "50%", "60%", "40%"],
  leadingCircle = false,
  cellClassName,
  animation,
  className,
}: SkeletonTableRowProps) {
  return (
    <tr aria-hidden className={className}>
      {Array.from({ length: Math.max(1, columns) }, (_, i) => (
        <td key={i} className={cn("px-4 py-3", cellClassName)}>
          {i === 0 && leadingCircle ? (
            <span className="flex items-center gap-3">
              <SkeletonCircle size={28} animation={animation} />
              <Skeleton height={12} width={widths[0]} animation={animation} />
            </span>
          ) : (
            <Skeleton height={12} width={widths[i % widths.length]} animation={animation} />
          )}
        </td>
      ))}
    </tr>
  );
}

export interface SkeletonProfileProps extends PresetBase {
  avatarSize?: SkeletonSize;
  /** Number of stat blocks. */
  stats?: number;
  /** Bio lines. */
  lines?: number;
  bordered?: boolean;
}

export function SkeletonProfile({ avatarSize = 72, stats = 3, lines = 3, bordered = true, animation, className }: SkeletonProfileProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex w-full flex-col items-center gap-4 text-center",
        bordered && "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <SkeletonCircle size={avatarSize} animation={animation} />
      <div className="flex w-full flex-col items-center gap-2">
        <Skeleton height={16} width="45%" animation={animation} />
        <Skeleton height={10} width="30%" animation={animation} />
      </div>
      {stats > 0 && (
        <div className="grid w-full gap-3" style={{ gridTemplateColumns: `repeat(${stats}, minmax(0, 1fr))` }}>
          {Array.from({ length: stats }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton height={14} width="60%" animation={animation} />
              <Skeleton height={8} width="80%" animation={animation} />
            </div>
          ))}
        </div>
      )}
      {lines > 0 && <SkeletonText lines={lines} animation={animation} widths={["100%", "92%"]} lastLineWidth="50%" className="items-center" />}
    </div>
  );
}

/* ---------- Shape memory ---------- */

/** One placeholder block. x and w are fractions of the container width, so the shape survives resizes. */
export interface SkeletonBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radius in px. */
  r: number;
  /** A bordered surface (card, panel): drawn as an outline behind the other blocks. */
  frame?: boolean;
}

/** The measured shape of real content: what the skeleton redraws next time. */
export interface SkeletonLayout {
  width: number;
  height: number;
  blocks: SkeletonBlock[];
}

export interface MeasureSkeletonOptions {
  /** Stop after this many blocks. */
  maxBlocks?: number;
  /** Ignore anything smaller than this, in px. */
  minSize?: number;
}

/** Elements drawn as one solid block. Their insides are not measured. */
const SOLID = "img,svg,video,canvas,picture,input,textarea,select,button,iframe,[role='img'],[data-skeleton-block]";

/**
 * Measures the visible shape of rendered content: one block per line of text and one per
 * image, icon, button or field. Feed the result to a SkeletonWrapper (rememberKey does it for you).
 */
export function measureSkeletonLayout(root: HTMLElement, { maxBlocks = 160, minSize = 3 }: MeasureSkeletonOptions = {}): SkeletonLayout {
  const box = root.getBoundingClientRect();
  const blocks: SkeletonBlock[] = [];
  const width = box.width || 1;
  const add = (r: DOMRect | { left: number; top: number; width: number; height: number }, radius: number, frame = false) => {
    if (blocks.length >= maxBlocks || r.width < minSize || r.height < minSize) return;
    blocks.push({
      x: (r.left - box.left) / width,
      y: Math.round(r.top - box.top),
      w: r.width / width,
      h: Math.round(r.height),
      r: radius,
      ...(frame ? { frame } : {}),
    });
  };
  const painted = (s: CSSStyleDeclaration) =>
    s.backgroundImage !== "none" || !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(s.backgroundColor);

  const walk = (el: Element) => {
    for (const node of el.childNodes) {
      if (blocks.length >= maxBlocks) return;
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const line of range.getClientRects()) {
          // Draw text a little slimmer than its line box, centred, so lines read as lines.
          const h = Math.max(minSize, line.height * 0.7);
          add({ left: line.left, top: line.top + (line.height - h) / 2, width: line.width, height: h }, Math.min(6, h / 2));
        }
      } else if (node instanceof HTMLElement || node instanceof SVGElement) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") continue;
        const r = node.getBoundingClientRect();
        const radius = parseFloat(style.borderTopLeftRadius) || 0;
        const round = radius >= Math.min(r.width, r.height) / 2 && r.width > 0;
        if (node.matches(SOLID) || (round && painted(style))) {
          // Media, controls and painted circles (avatars) are one solid block.
          add(r, round ? 9999 : Math.min(radius || 6, 16));
        } else {
          // Bordered surfaces such as cards keep their outline. (> 0: on zoomed screens 1px can read as 0.8px.)
          if (parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== "none" && r.height > 24) add(r, Math.min(radius, 16), true);
          walk(node);
        }
      }
    }
  };
  walk(root);

  // Inline pieces of one line ("Hello <b>world</b>") become one bar.
  blocks.sort((a, b) => a.y - b.y || a.x - b.x);
  const merged: SkeletonBlock[] = [];
  for (const b of blocks) {
    const last = merged[merged.length - 1];
    if (last && !last.frame && !b.frame && last.r !== 9999 && b.r !== 9999 && Math.abs(last.y - b.y) <= 2 && Math.abs(last.h - b.h) <= 3 && (b.x - (last.x + last.w)) * width < 10) {
      last.w = Math.max(last.x + last.w, b.x + b.w) - last.x;
    } else merged.push({ ...b });
  }
  return { width: Math.round(box.width), height: Math.round(box.height), blocks: merged };
}

const memory = new Map<string, SkeletonLayout>();
const storageKey = (key: string) => `lofi-skeleton:${key}`;

function recall(key: string, persist: boolean): SkeletonLayout | undefined {
  const hit = memory.get(key);
  if (hit || !persist) return hit;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    const parsed = raw ? (JSON.parse(raw) as SkeletonLayout) : undefined;
    if (parsed && Array.isArray(parsed.blocks)) {
      memory.set(key, parsed);
      return parsed;
    }
  } catch {
    // Unreadable storage: fall back to the hand-made skeleton.
  }
  return undefined;
}

function remember(key: string, layout: SkeletonLayout, persist: boolean) {
  memory.set(key, layout);
  if (!persist) return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(layout));
  } catch {
    // Full or blocked storage: the shape is still remembered for this visit.
  }
}

/** Forgets a remembered shape, e.g. after a redesign. */
export function forgetSkeletonLayout(key: string) {
  memory.delete(key);
  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    // Nothing stored.
  }
}

/** Redraws a remembered layout as positioned skeleton blocks. */
export function SkeletonFromLayout({ layout, animation, className }: { layout: SkeletonLayout; animation?: SkeletonAnimation; className?: string }) {
  return (
    <span aria-hidden className={cn("relative block w-full", className)} style={{ height: layout.height }}>
      {layout.blocks.map((b, i) =>
        b.frame ? (
          <span
            key={i}
            className="absolute border border-zinc-200 dark:border-zinc-800"
            style={{ left: `${(b.x * 100).toFixed(3)}%`, top: b.y, width: `${(b.w * 100).toFixed(3)}%`, height: b.h, borderRadius: b.r }}
          />
        ) : (
        <Skeleton
          key={i}
          width={`${(b.w * 100).toFixed(3)}%`}
          height={b.h}
          radius={b.r}
          animation={animation}
          style={{ position: "absolute", left: `${(b.x * 100).toFixed(3)}%`, top: b.y }}
        />
        ),
      )}
    </span>
  );
}

/* ---------- Wrapper ---------- */

export interface SkeletonWrapperProps {
  /** Show the fallback instead of the children. */
  loading: boolean;
  /** Skeleton layout shown while loading. Try to match the real layout so nothing jumps. */
  fallback: ReactNode;
  children: ReactNode;
  /**
   * Turns on shape memory: after the content has loaded once, its real shape (every text line,
   * image and button) is measured and saved under this key. The next load draws that exact shape
   * instead of the fallback.
   */
  rememberKey?: string;
  /** Also keep remembered shapes in localStorage, so they survive a reload. */
  persistShape?: boolean;
  /** Called with each new measurement. */
  onMeasure?: (layout: SkeletonLayout) => void;
  /** After this many ms of loading, show slowText. null turns it off. */
  slowAfter?: number | null;
  /** Shown (and announced) when loading takes longer than slowAfter. */
  slowText?: string;
  /** Accessible name of the busy container. */
  label?: string;
  /** Announced politely when loading finishes. Empty string to stay silent. */
  loadedText?: string;
  /** Default animation for every skeleton inside the fallback. */
  animation?: SkeletonAnimation;
  /** Fade-in duration of the children, in ms. */
  fadeDuration?: number;
  className?: string;
}

const noopSubscribe = () => () => {};

/** Shows the fallback (or the remembered shape) while loading, then fades the children in. */
export function SkeletonWrapper({
  loading,
  fallback,
  children,
  rememberKey,
  persistShape = true,
  onMeasure,
  slowAfter = 4000,
  slowText = "Still loading… thanks for waiting.",
  label = "Loading content",
  loadedText = "Content loaded",
  animation,
  fadeDuration = 400,
  className,
}: SkeletonWrapperProps) {
  const [prevLoading, setPrevLoading] = useState(loading);
  const [revealed, setRevealed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [slow, setSlow] = useState(false);
  if (prevLoading !== loading) {
    setPrevLoading(loading);
    setRevealed(!loading);
    setAnnouncement(loading ? "" : loadedText);
    setSlow(false);
  }

  // Remembered shapes live in the browser, so read them only after hydration.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [measured, setMeasured] = useState(0);
  const shape = useMemo(
    () => (mounted && rememberKey && loading ? recall(rememberKey, persistShape) : undefined),
    // measured re-reads memory after a new measurement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mounted, rememberKey, loading, persistShape, measured],
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const onMeasureRef = useRef(onMeasure);
  useEffect(() => {
    onMeasureRef.current = onMeasure;
  }, [onMeasure]);

  // Measure the real content once it has settled after each load. A timeout, not
  // requestAnimationFrame, so it still runs if the person switched to another browser tab.
  useEffect(() => {
    if (loading || !rememberKey) return;
    const t = setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;
      const layout = measureSkeletonLayout(el);
      if (layout.blocks.length === 0) return;
      remember(rememberKey, layout, persistShape);
      onMeasureRef.current?.(layout);
      setMeasured((n) => n + 1);
    }, 60);
    return () => clearTimeout(t);
  }, [loading, rememberKey, persistShape]);

  useEffect(() => {
    if (!loading || slowAfter === null) return;
    const t = setTimeout(() => setSlow(true), slowAfter);
    return () => clearTimeout(t);
  }, [loading, slowAfter]);

  return (
    <>
      <SkeletonStyles />
      {loading ? (
        <div role="status" aria-busy="true" aria-label={label} className={className} data-skeleton-shape={shape ? "remembered" : "fallback"}>
          <span className="sr-only">{label}</span>
          <AnimationContext.Provider value={animation ?? null}>
            <div aria-hidden>{shape ? <SkeletonFromLayout layout={shape} animation={animation} /> : fallback}</div>
          </AnimationContext.Provider>
          {slow && <p className="mt-3 text-center text-xs text-zinc-600 dark:text-zinc-400">{slowText}</p>}
        </div>
      ) : (
        <div
          ref={contentRef}
          aria-busy="false"
          className={cn(revealed && "lofi-skeleton-reveal", className)}
          style={revealed ? { animationDuration: `${fadeDuration}ms` } : undefined}
        >
          {children}
        </div>
      )}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
