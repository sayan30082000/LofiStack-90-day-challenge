"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogoMarqueeItem {
  /** Image URL of the logo. */
  src?: string;
  /** Optional image URL used in dark mode, e.g. a light wordmark. Sized like `src`. */
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
  /**
   * Speed in pixels per second. Every row moves at this speed whatever its length, so rows
   * with different numbers of logos stay in step.
   */
  pxPerSecond?: number;
  /** Seconds for one full loop instead of pxPerSecond. Rows of different lengths then move at different speeds. */
  speed?: number;
  /** Direction of the first row. "up" and "down" make a vertical marquee. */
  direction?: LogoMarqueeDirection;
  /** Pause while the pointer is over the marquee. It always pauses while a link inside has keyboard focus. */
  pauseOnHover?: boolean;
  /** Let people grab a row and drag it to scrub through the logos. */
  draggable?: boolean;
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
  /**
   * Height of image logos, in px. With `normalize`, this is the height a typical 3:1 wordmark
   * gets; other shapes are sized to look as big.
   */
  logoHeight?: number;
  /**
   * Optical sizing: measure each image logo's visible ink (trimming transparent or flat padding)
   * and size it so wide, tall, thin and heavy logos all look the same size.
   */
  normalize?: boolean;
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

/* ---------- Optical sizing (pure) ---------- */

/** Where the visible part of a logo sits in its image, in pixels of the analysed bitmap. */
export interface LogoInk {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Share of the ink box that is covered, 0–1. Heavy, filled logos are dense; thin outlines are not. */
  density: number;
}

/**
 * Finds a logo's ink in RGBA pixel data. The background is transparency, or, for opaque images,
 * the top-left corner's color. Returns null for an empty image.
 */
export function analyzeLogoPixels(data: ArrayLike<number>, width: number, height: number): LogoInk | null {
  const transparent = data[3] < 16;
  const [br, bg, bb] = [data[0], data[1], data[2]];
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let ink = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a <= 40) continue;
      if (!transparent && Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb) <= 60) continue;
      ink += transparent ? a / 255 : 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  return { x: minX, y: minY, width: w, height: h, density: ink / (w * h) };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Height to give a logo's ink so it looks as big as the others. Equal heights make wide
 * wordmarks dominate and square marks look tiny, so the height scales with 1/√aspect (keeping
 * the visible area roughly equal), relative to a typical 3:1 wordmark at `base` px. Dense,
 * heavy logos are then nudged smaller and thin, airy ones larger.
 */
export function opticalLogoHeight(inkAspect: number, density: number | null, base: number): number {
  let h = clamp(base * Math.sqrt(3 / inkAspect), base * 0.5, base * 1.6);
  if (density !== null && density > 0) h *= clamp(Math.sqrt(0.3 / density), 0.82, 1.22);
  // Very long wordmarks still dominate a row, so cap their width (without going unreadably thin).
  h = Math.max(Math.min(h, (base * 7) / inkAspect), base * 0.42);
  return Math.round(h * 10) / 10;
}

/** A logo's ink as fractions of its image, plus its density. */
interface Measured {
  aspect: number;
  left: number;
  top: number;
  width: number;
  height: number;
  density: number | null;
}

function measureLogo(img: HTMLImageElement): Measured | null {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return null;
  const plain: Measured = { aspect: nw / nh, left: 0, top: 0, width: 1, height: 1, density: null };
  try {
    // Small SVGs report tiny natural sizes, so draw at a fixed size for a useful sample.
    const scale = 160 / Math.max(nw, nh);
    const w = Math.max(1, Math.round(nw * scale));
    const h = Math.max(1, Math.round(nh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return plain;
    ctx.drawImage(img, 0, 0, w, h);
    const ink = analyzeLogoPixels(ctx.getImageData(0, 0, w, h).data, w, h);
    if (!ink) return plain;
    return { aspect: nw / nh, left: ink.x / w, top: ink.y / h, width: ink.width / w, height: ink.height / h, density: ink.density };
  } catch {
    // A cross-origin image without CORS can't be read: fall back to its outer shape.
    return plain;
  }
}

/** Image size and negative margins that make the ink box, not the padded image, the logo's footprint. */
function opticalStyle(m: Measured, base: number): CSSProperties {
  const inkAspect = (m.width * m.aspect) / m.height;
  const inkHeight = opticalLogoHeight(inkAspect, m.density, base);
  const imgHeight = inkHeight / m.height;
  const imgWidth = imgHeight * m.aspect;
  return {
    height: imgHeight,
    width: imgWidth,
    marginLeft: -m.left * imgWidth,
    marginRight: -(1 - m.left - m.width) * imgWidth,
    marginTop: -m.top * imgHeight,
    marginBottom: -(1 - m.top - m.height) * imgHeight,
  };
}

/* ---------- Component ---------- */

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
.lofi-logo-marquee-row[data-draggable="true"] { cursor: grab; }
.lofi-logo-marquee-row[data-draggable="true"][data-axis="x"] { touch-action: pan-y; }
.lofi-logo-marquee-row[data-draggable="true"][data-axis="y"] { touch-action: pan-x; }
.lofi-logo-marquee-row[data-dragging="true"] { cursor: grabbing; user-select: none; }
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
.lofi-logo-marquee-row[data-dragging="true"] .lofi-logo-marquee-track,
.lofi-logo-marquee-rows:focus-within .lofi-logo-marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .lofi-logo-marquee-row, .lofi-logo-marquee-row[data-axis="y"] { height: auto; -webkit-mask-image: none !important; mask-image: none !important; flex-direction: row; cursor: auto !important; }
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
 * Infinite logo strip: the set is rendered twice and shifted by one set width with CSS
 * keyframes, so the loop is seamless at any width. Image logos are optically sized, every row
 * moves at the same pixel speed, and rows can be dragged.
 */
export function LogoMarquee({
  items,
  pxPerSecond = 40,
  speed,
  direction = "left",
  pauseOnHover = true,
  draggable = true,
  fade = true,
  fadeSize = 64,
  gap = 48,
  rows = 1,
  grayscale = true,
  logoHeight = 28,
  normalize = true,
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
  const [measured, setMeasured] = useState<Record<string, Measured | null>>({});
  const [lengths, setLengths] = useState<number[]>([]);
  const [dragRow, setDragRow] = useState<number | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef<{ row: number; start: number; times: number[]; moved: boolean } | null>(null);

  const vertical = direction === "up" || direction === "down";
  const baseReverse = direction === "right" || direction === "down";
  const groups = chunk(items, Math.max(1, Math.floor(rows)));
  const rowCount = groups.length;

  // Measure each row's length (one copy of its logos) so every row can move at pxPerSecond.
  useEffect(() => {
    if (speed !== undefined || typeof ResizeObserver === "undefined") return;
    const tracks = rowRefs.current.slice(0, rowCount).map((row) => row?.querySelector<HTMLElement>(".lofi-logo-marquee-track") ?? null);
    const update = () =>
      setLengths((prev) => {
        const next = tracks.map((t) => (t ? Math.round(vertical ? t.offsetHeight : t.offsetWidth) : 0));
        return next.length === prev.length && next.every((n, i) => n === prev[i]) ? prev : next;
      });
    const ro = new ResizeObserver(update);
    tracks.forEach((t) => t && ro.observe(t));
    return () => ro.disconnect();
  }, [speed, rowCount, vertical]);

  if (items.length === 0) return null;

  const durationFor = (r: number) => (speed !== undefined ? speed : lengths[r] ? (lengths[r] + gap) / pxPerSecond : 30);

  /* Dragging: pause the row's two tracks and move their animations by the drag distance. */
  const animationsOf = (r: number) => {
    const row = rowRefs.current[r];
    return row && typeof row.getAnimations === "function" ? row.getAnimations({ subtree: true }) : [];
  };
  const onPointerDown = (r: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggable || e.button !== 0) return;
    const anims = animationsOf(r);
    if (!anims.length) return; // reduced motion: nothing moves, nothing to drag
    drag.current = { row: r, start: vertical ? e.clientY : e.clientX, times: anims.map((a) => Number(a.currentTime ?? 0)), moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const delta = (vertical ? e.clientY : e.clientX) - d.start;
    if (!d.moved) {
      if (Math.abs(delta) < 6) return;
      d.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDragRow(d.row);
    }
    const reverse = baseReverse !== (d.row % 2 === 1);
    const cycle = (lengths[d.row] || (vertical ? e.currentTarget.offsetHeight : e.currentTarget.offsetWidth)) + gap;
    const ms = durationFor(d.row) * 1000;
    // Dragging toward the end of the axis moves logos that way: back in time for a normal row.
    const shift = (-delta / cycle) * ms * (reverse ? -1 : 1);
    animationsOf(d.row).forEach((a, i) => {
      a.currentTime = ((((d.times[i] ?? 0) + shift) % ms) + ms) % ms;
    });
  };
  const endDrag = () => {
    if (drag.current?.moved) setDragRow(null);
    // Keep `moved` until the click that follows a drag has been swallowed.
    setTimeout(() => (drag.current = null), 0);
  };

  // Measured even with normalize off, so turning it on later needs no reload.
  const record = (key: string, img: HTMLImageElement) =>
    setMeasured((prev) => (key in prev ? prev : { ...prev, [key]: measureLogo(img) }));

  const renderImage = (item: LogoMarqueeItem, src: string, extra?: string) => {
    const m = normalize ? measured[item.src!] : undefined;
    const own = src === item.src;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logos have arbitrary sizes and may be remote; plain img keeps the component generic
      <img
        src={src}
        alt={item.alt}
        draggable={false}
        // An image that finished loading before hydration never fires onLoad, so check on mount too.
        ref={own ? (el) => void (el?.complete && el.naturalWidth && record(item.src!, el)) : undefined}
        onLoad={own ? (e) => record(item.src!, e.currentTarget) : undefined}
        style={m ? opticalStyle(m, logoHeight) : { height: logoHeight }}
        className={cn("w-auto max-w-none shrink-0", extra)}
      />
    );
  };

  const renderItem = (item: LogoMarqueeItem, key: string) => {
    const content =
      item.node ??
      (item.src ? (
        <>
          {renderImage(item, item.src, item.srcDark ? "dark:hidden" : undefined)}
          {item.srcDark && renderImage(item, item.srcDark, "hidden dark:block")}
        </>
      ) : (
        <span className="whitespace-nowrap text-lg font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">{item.alt}</span>
      ));

    const cell = cn(
      "flex min-h-10 shrink-0 items-center justify-center",
      grayscale &&
        "grayscale transition-[filter] duration-300 hover:grayscale-0 focus-within:grayscale-0 motion-reduce:transition-none",
      itemClassName,
    );

    return (
      <li key={key} className={cell}>
        {item.href ? (
          <a
            href={item.href}
            onClick={(e) => {
              // A drag that ends on a link isn't a click.
              if (drag.current?.moved) e.preventDefault();
            }}
            draggable={false}
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
            ref={(el) => {
              rowRefs.current[r] = el;
            }}
            className="lofi-logo-marquee-row min-w-0 flex-1"
            data-axis={vertical ? "y" : "x"}
            data-reverse={baseReverse !== (r % 2 === 1)}
            data-fade={fade}
            data-draggable={draggable}
            data-dragging={dragRow === r}
            style={{ "--lofi-logo-marquee-duration": `${durationFor(r)}s` } as CSSProperties}
            onPointerDown={onPointerDown(r)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
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
