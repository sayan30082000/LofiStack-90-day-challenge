"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogoMarqueeItem {
  /** Image URL of the logo. */
  src?: string;
  /** Optional image URL used in dark mode, e.g. a light wordmark. */
  srcDark?: string;
  /** Accessible name: the image alt text, or a visible text fallback when there is no src or node. */
  alt: string;
  /** Makes the logo a link. */
  href?: string;
  /** Custom content instead of an image, e.g. an inline SVG or an icon with a label. */
  node?: ReactNode;
}

export type LogoMarqueeDirection = "left" | "right" | "up" | "down";

export interface LogoMarqueeProps {
  /** Logos to scroll. With rows > 1 they are split into that many rows, in order. */
  items: LogoMarqueeItem[];
  /** Seconds for one full loop. Higher is slower. */
  speed?: number;
  /** Direction of the first row. "up" and "down" make a vertical marquee. */
  direction?: LogoMarqueeDirection;
  /** Pause while the pointer is over the marquee. It always pauses while a link inside has keyboard focus. */
  pauseOnHover?: boolean;
  /** Fade the edges with a mask. */
  fade?: boolean;
  /** Width (or height, when vertical) of the fade, in px. */
  fadeSize?: number;
  /** Space between logos, in px. */
  gap?: number;
  /** Number of rows (columns when vertical). Every other row moves the opposite way. */
  rows?: number;
  /** Show logos in grayscale and bring color back on hover or focus. */
  grayscale?: boolean;
  /** Height of image logos, in px. */
  logoHeight?: number;
  /** Height of the marquee when vertical, in px. */
  height?: number;
  /** Optional heading shown above the strip, e.g. "Trusted by teams at". Also names the region. */
  title?: ReactNode;
  /** Accessible name of the region when there is no title. */
  label?: string;
  /** Show a pause/play button (recommended: hover alone doesn't help keyboard or touch users). */
  showControls?: boolean;
  /** Accessible label of the control while playing. */
  pauseLabel?: string;
  /** Accessible label of the control while paused. */
  playLabel?: string;
  /** Classes for the outer section. */
  className?: string;
  /** Classes for each logo cell. */
  itemClassName?: string;
}

const STYLES = `
@keyframes lofi-logo-marquee-x { to { transform: translate3d(calc(-100% - var(--lofi-logo-marquee-gap)), 0, 0); } }
@keyframes lofi-logo-marquee-y { to { transform: translate3d(0, calc(-100% - var(--lofi-logo-marquee-gap)), 0); } }
.lofi-logo-marquee-row { display: flex; overflow: hidden; gap: var(--lofi-logo-marquee-gap); }
.lofi-logo-marquee-row[data-axis="y"] { flex-direction: column; height: 100%; }
.lofi-logo-marquee-row[data-fade="true"][data-axis="x"] {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--lofi-logo-marquee-fade), #000 calc(100% - var(--lofi-logo-marquee-fade)), transparent);
  mask-image: linear-gradient(to right, transparent, #000 var(--lofi-logo-marquee-fade), #000 calc(100% - var(--lofi-logo-marquee-fade)), transparent);
}
.lofi-logo-marquee-row[data-fade="true"][data-axis="y"] {
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--lofi-logo-marquee-fade), #000 calc(100% - var(--lofi-logo-marquee-fade)), transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 var(--lofi-logo-marquee-fade), #000 calc(100% - var(--lofi-logo-marquee-fade)), transparent);
}
.lofi-logo-marquee-track {
  display: flex; flex-shrink: 0; align-items: center; justify-content: space-around;
  gap: var(--lofi-logo-marquee-gap); min-width: 100%;
  animation: lofi-logo-marquee-x var(--lofi-logo-marquee-duration) linear infinite;
}
.lofi-logo-marquee-row[data-axis="y"] .lofi-logo-marquee-track {
  flex-direction: column; min-width: 0; min-height: 100%;
  animation-name: lofi-logo-marquee-y;
}
.lofi-logo-marquee-row[data-reverse="true"] .lofi-logo-marquee-track { animation-direction: reverse; }
.lofi-logo-marquee[data-paused="true"] .lofi-logo-marquee-track,
.lofi-logo-marquee[data-hover-pause="true"] .lofi-logo-marquee-rows:hover .lofi-logo-marquee-track,
.lofi-logo-marquee-rows:focus-within .lofi-logo-marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .lofi-logo-marquee-row, .lofi-logo-marquee-row[data-axis="y"] { height: auto; -webkit-mask-image: none !important; mask-image: none !important; flex-direction: row; }
  .lofi-logo-marquee-rows[data-axis="y"] { height: auto !important; }
  .lofi-logo-marquee-track, .lofi-logo-marquee-row[data-axis="y"] .lofi-logo-marquee-track {
    animation: none; flex-direction: row; flex-wrap: wrap; justify-content: center;
    flex-shrink: 1; min-width: 0; min-height: 0; width: 100%;
    row-gap: calc(var(--lofi-logo-marquee-gap) / 2);
  }
  .lofi-logo-marquee-clone, .lofi-logo-marquee-control { display: none !important; }
}
`;

function chunk<T>(list: T[], parts: number): T[][] {
  const size = Math.ceil(list.length / parts);
  return Array.from({ length: parts }, (_, i) => list.slice(i * size, (i + 1) * size)).filter((r) => r.length > 0);
}

/**
 * Infinite logo strip: the set is rendered twice and shifted by one set width
 * with CSS keyframes, so the loop is seamless at any container width.
 */
export function LogoMarquee({
  items,
  speed = 30,
  direction = "left",
  pauseOnHover = true,
  fade = true,
  fadeSize = 64,
  gap = 48,
  rows = 1,
  grayscale = true,
  logoHeight = 28,
  height = 320,
  title,
  label = "Logos",
  showControls = true,
  pauseLabel = "Pause logo animation",
  playLabel = "Play logo animation",
  className,
  itemClassName,
}: LogoMarqueeProps) {
  const titleId = useId();
  const [paused, setPaused] = useState(false);

  if (items.length === 0) return null;

  const vertical = direction === "up" || direction === "down";
  const baseReverse = direction === "right" || direction === "down";
  const groups = chunk(items, Math.max(1, Math.floor(rows)));

  const renderItem = (item: LogoMarqueeItem, key: string) => {
    const content = item.node ?? (item.src ? (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- logos have arbitrary sizes and may be remote; plain img keeps the component generic */}
        <img
          src={item.src}
          alt={item.alt}
          draggable={false}
          style={{ height: logoHeight }}
          className={cn("w-auto max-w-none", item.srcDark && "dark:hidden")}
        />
        {item.srcDark && (
          // eslint-disable-next-line @next/next/no-img-element -- see above
          <img
            src={item.srcDark}
            alt={item.alt}
            draggable={false}
            style={{ height: logoHeight }}
            className="hidden w-auto max-w-none dark:block"
          />
        )}
      </>
    ) : (
      <span className="whitespace-nowrap text-lg font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">{item.alt}</span>
    ));

    const cell = cn(
      "flex min-h-10 shrink-0 items-center justify-center",
      grayscale &&
        "opacity-70 grayscale transition-[filter,opacity] duration-300 hover:opacity-100 hover:grayscale-0 focus-within:opacity-100 focus-within:grayscale-0 motion-reduce:transition-none",
      itemClassName,
    );

    return (
      <li key={key} className={cell}>
        {item.href ? (
          <a
            href={item.href}
            className="flex min-h-10 items-center rounded-md px-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </li>
    );
  };

  const vars = {
    "--lofi-logo-marquee-gap": `${gap}px`,
    "--lofi-logo-marquee-duration": `${speed}s`,
    "--lofi-logo-marquee-fade": `${fadeSize}px`,
  } as CSSProperties;

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : label}
      data-paused={paused}
      data-hover-pause={pauseOnHover}
      style={vars}
      className={cn("lofi-logo-marquee flex w-full min-w-0 flex-col gap-4", className)}
    >
      <style href="lofi-logo-marquee" precedence="default">
        {STYLES}
      </style>

      {(title || showControls) && (
        <div className="flex min-h-10 items-center justify-between gap-3">
          {title ? (
            <div id={titleId} className="min-w-0 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {title}
            </div>
          ) : (
            <span />
          )}
          {showControls && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? playLabel : pauseLabel}
              title={paused ? playLabel : pauseLabel}
              className="lofi-logo-marquee-control inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:bg-zinc-200 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
            >
              {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            </button>
          )}
        </div>
      )}

      <div
        className={cn("lofi-logo-marquee-rows flex min-w-0", vertical ? "flex-row" : "flex-col")}
        data-axis={vertical ? "y" : "x"}
        style={{ gap: gap / 2, height: vertical ? height : undefined }}
      >
        {groups.map((group, r) => (
          <div
            key={r}
            className="lofi-logo-marquee-row min-w-0 flex-1"
            data-axis={vertical ? "y" : "x"}
            data-reverse={baseReverse !== (r % 2 === 1)}
            data-fade={fade}
          >
            <ul className="lofi-logo-marquee-track">{group.map((item, i) => renderItem(item, `a-${i}`))}</ul>
            {/* Second copy for the seamless loop: hidden from assistive tech and from the tab order. */}
            <ul className="lofi-logo-marquee-track lofi-logo-marquee-clone" aria-hidden inert>
              {group.map((item, i) => renderItem(item, `b-${i}`))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
