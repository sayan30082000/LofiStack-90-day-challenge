"use client";

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
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

/* ---------- Wrapper ---------- */

export interface SkeletonWrapperProps {
  /** Show the fallback instead of the children. */
  loading: boolean;
  /** Skeleton layout shown while loading. Try to match the real layout so nothing jumps. */
  fallback: ReactNode;
  children: ReactNode;
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

/** Shows the fallback while loading, then fades the children in. */
export function SkeletonWrapper({
  loading,
  fallback,
  children,
  label = "Loading content",
  loadedText = "Content loaded",
  animation,
  fadeDuration = 400,
  className,
}: SkeletonWrapperProps) {
  const [prevLoading, setPrevLoading] = useState(loading);
  const [revealed, setRevealed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  if (prevLoading !== loading) {
    setPrevLoading(loading);
    setRevealed(!loading);
    setAnnouncement(loading ? "" : loadedText);
  }

  return (
    <>
      <SkeletonStyles />
      {loading ? (
        <div role="status" aria-busy="true" aria-label={label} className={className}>
          <span className="sr-only">{label}</span>
          <AnimationContext.Provider value={animation ?? null}>
            <div aria-hidden>{fallback}</div>
          </AnimationContext.Provider>
        </div>
      ) : (
        <div
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
