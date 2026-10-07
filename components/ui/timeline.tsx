"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  /** Unique key. */
  id: string;
  /** Machine-readable date for <time dateTime>, e.g. "2021-03" or "2021-03-14". */
  date: string;
  /** Visible date text. Defaults to `date`. */
  dateLabel?: string;
  title: string;
  description?: ReactNode;
  /** Icon inside the node on the line. Defaults to a dot. */
  icon?: ReactNode;
  /** Small pill next to the date, e.g. "Funding". */
  tag?: string;
  /** Milestone styling: larger node with a glow and an accented card. */
  highlight?: boolean;
  /** Makes the title a link. */
  href?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  /** Cards alternate left and right of a center line on wide containers. Off: one line on the left. */
  alternate?: boolean;
  /** Items glide in from a dimmed, still readable resting state as they scroll into view. */
  animateOnScroll?: boolean;
  /** The line fills with progress as you scroll, lighting up each node it passes. */
  fillOnScroll?: boolean;
  /** Where the fill tip sits, as a fraction of the viewport height from the top. */
  fillAnchor?: number;
  /** Accessible name of the list. */
  label?: string;
  /** Shows skeleton items. */
  loading?: boolean;
  /** Skeleton items shown while loading. */
  skeletonCount?: number;
  /** Screen reader text while loading. */
  loadingText?: string;
  /** Shown when items is empty. */
  emptyText?: ReactNode;
  /** Accessible text for the tag pill's group, read before the tag. */
  tagLabel?: string;
  /** Visible text on highlighted items. Set to "" to hide. */
  milestoneText?: string;
  /** Heading level of each item title. */
  headingLevel?: 2 | 3 | 4;
  /** Classes for the root. Set --timeline-surface to your page background so nodes cut cleanly through the line. */
  className?: string;
}

const STYLE = `
@keyframes lofi-timeline-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgb(99 102 241 / 0.45); }
  50% { box-shadow: 0 0 0 7px rgb(99 102 241 / 0); }
}
.lofi-timeline-glow { animation: lofi-timeline-glow 2.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .lofi-timeline-glow { animation: none; }
}
`;

/**
 * Vertical timeline. Server-rendered fully visible; scroll effects are an enhancement
 * added after mount and turned off for reduced motion.
 */
export function Timeline({
  items,
  alternate = true,
  animateOnScroll = true,
  fillOnScroll = true,
  fillAnchor = 0.6,
  label,
  loading = false,
  skeletonCount = 3,
  loadingText = "Loading timeline…",
  emptyText = "Nothing on the timeline yet.",
  tagLabel = "Category",
  milestoneText = "Milestone",
  headingLevel = 3,
  className,
}: TimelineProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  /** null until scroll effects are set up, so the server render and no-JS view show everything. */
  const [seen, setSeen] = useState<Set<string> | null>(null);
  /** Ids of nodes the fill has passed; null means "all" (no scroll fill). */
  const [lit, setLit] = useState<Set<string> | null>(null);
  const [reduced, setReduced] = useState(false);
  /** Re-run the scroll effects only when the set of items changes, not on every new array. */
  const idsKey = items.map((item) => item.id).join("|");
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  // Reduced motion preference.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    const id = requestAnimationFrame(sync);
    mq.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(id);
      mq.removeEventListener("change", sync);
    };
  }, []);

  // Reveal items as they enter the viewport.
  useEffect(() => {
    const list = listRef.current;
    if (!animateOnScroll || reduced || !list || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        setSeen((prev) => {
          const next = new Set(prev ?? []);
          for (const e of entries) {
            const id = (e.target as HTMLElement).dataset.timelineId;
            // Items already scrolled past count as seen, so they never dim behind you.
            if (id && (e.isIntersecting || e.boundingClientRect.top < 0)) next.add(id);
          }
          return next;
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    list.querySelectorAll<HTMLElement>("[data-timeline-id]").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      setSeen(null);
    };
  }, [animateOnScroll, reduced, loading, idsKey]);

  // Scroll-linked line fill.
  useEffect(() => {
    const list = listRef.current;
    const line = lineRef.current;
    if (!fillOnScroll || reduced || !list || !line || loading) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = line.getBoundingClientRect();
      const anchor = window.innerHeight * fillAnchor;
      const fill = Math.min(Math.max(anchor - rect.top, 0), rect.height);
      line.style.setProperty("--lofi-timeline-fill", `${fill}px`);
      const passed = new Set<string>();
      for (const [id, el] of nodeRefs.current) {
        const r = el.getBoundingClientRect();
        if (r.top + r.height / 2 - rect.top <= fill + 1) passed.add(id);
      }
      setLit((prev) =>
        prev && prev.size === passed.size && [...passed].every((id) => prev.has(id)) ? prev : passed,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    // Capture phase catches scrolling in any ancestor container, not just the window.
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(list);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      line.style.removeProperty("--lofi-timeline-fill");
      setLit(null);
    };
  }, [fillOnScroll, fillAnchor, reduced, loading, idsKey]);

  const scrollFill = fillOnScroll && !reduced && lit !== null;

  const grid = alternate
    ? "grid-cols-[2.5rem_minmax(0,1fr)] @2xl:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)]"
    : "grid-cols-[2.5rem_minmax(0,1fr)] @2xl:grid-cols-[9rem_3rem_minmax(0,1fr)]";
  const lineX = alternate ? "left-5 @2xl:left-1/2" : "left-5 @2xl:left-[calc(9rem+1.5rem+1.5rem)]";

  if (loading) {
    return (
      <div className={cn("@container [--timeline-surface:#fafafa] dark:[--timeline-surface:#18181b]", className)}>
        <div className="relative">
          <p role="status" className="sr-only">{loadingText}</p>
          <div aria-hidden className={cn("absolute inset-y-0 w-0.5 -translate-x-1/2 bg-zinc-200 dark:bg-zinc-800", lineX)} />
          <ol aria-label={label} aria-busy="true" className="flex flex-col gap-8">
            {Array.from({ length: skeletonCount }, (_, i) => {
              const right = !alternate || i % 2 === 1;
              return (
                <li key={i} aria-hidden className={cn("relative grid gap-x-6", grid)}>
                  <span className="col-start-1 row-start-1 mx-auto size-10 rounded-full border-4 border-(--timeline-surface) bg-zinc-200 motion-safe:animate-pulse @2xl:col-start-2 dark:bg-zinc-800" />
                  <div
                    className={cn(
                      "col-start-2 row-start-1 flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900",
                      right ? "@2xl:col-start-3" : "@2xl:col-start-1",
                    )}
                  >
                    <span className="h-3 w-20 rounded bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800" />
                    <span className="h-4 w-2/3 rounded bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800" />
                    <span className="h-3 w-full rounded bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-800/60" />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("@container [--timeline-surface:#fafafa] dark:[--timeline-surface:#18181b]", className)}>
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("@container [--timeline-surface:#fafafa] dark:[--timeline-surface:#18181b]", className)}>
      <style href="lofi-timeline" precedence="default">
        {STYLE}
      </style>
      <div className="relative">
        {/* Line: a muted track with an indigo fill that follows the scroll position. */}
        <div
          ref={lineRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-6 top-5 w-0.5 -translate-x-1/2 rounded-full bg-zinc-200 dark:bg-zinc-800",
            lineX,
          )}
        >
          <div
            className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-indigo-400 via-indigo-500 to-violet-500 dark:from-indigo-500 dark:via-indigo-400 dark:to-violet-400"
            style={{ height: scrollFill ? "var(--lofi-timeline-fill, 0px)" : "100%" } as CSSProperties}
          >
            {scrollFill && (
              <span className="absolute -bottom-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-violet-500 shadow-[0_0_0_4px_rgb(139_92_246/0.2)] dark:bg-violet-400" />
            )}
          </div>
        </div>

        <ol ref={listRef} aria-label={label} className="flex flex-col gap-8 @2xl:gap-6">
          {items.map((item, i) => {
            const onLeft = alternate && i % 2 === 0;
            const isLit = !scrollFill || (lit?.has(item.id) ?? false);
            const resting = seen !== null && !seen.has(item.id);
            const dateText = item.dateLabel ?? item.date;
  
            return (
              <li
                key={item.id}
                data-timeline-id={item.id}
                className={cn(
                  "group/item relative grid gap-x-6 gap-y-1.5",
                  grid,
                  seen !== null &&
                    "transition-[opacity,translate] duration-700 ease-out motion-reduce:translate-none motion-reduce:opacity-100 motion-reduce:transition-none",
                  resting && (onLeft ? "opacity-40 @2xl:-translate-x-4" : "opacity-40 translate-y-4 @2xl:translate-x-4 @2xl:translate-y-0"),
                )}
              >
                {/* Node on the line */}
                <span
                  ref={(el) => {
                    if (el) nodeRefs.current.set(item.id, el);
                    else nodeRefs.current.delete(item.id);
                  }}
                  aria-hidden
                  className={cn(
                    "relative z-10 col-start-1 row-start-1 mx-auto flex items-center justify-center rounded-full border-4 border-(--timeline-surface) transition-colors duration-300 motion-reduce:transition-none @2xl:col-start-2",
                    item.highlight ? "size-11 -mt-0.5" : "size-10",
                    isLit
                      ? item.highlight
                        ? "lofi-timeline-glow bg-indigo-600 text-white dark:bg-indigo-500"
                        : "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                  )}
                >
                  {item.icon ? (
                    <span className="flex size-4 items-center justify-center [&_svg]:size-4">{item.icon}</span>
                  ) : (
                    <span className={cn("size-2 rounded-full", isLit ? "bg-white" : "bg-zinc-400 dark:bg-zinc-500")} />
                  )}
                </span>
  
                {/* Date: above the card on narrow screens, opposite the card on wide alternating layouts. */}
                <div
                  className={cn(
                    "col-start-2 row-start-1 flex min-h-10 flex-wrap items-center gap-2",
                    alternate
                      ? onLeft
                        ? "@2xl:col-start-3 @2xl:justify-start"
                        : "@2xl:col-start-1 @2xl:justify-end"
                      : "@2xl:col-start-1 @2xl:items-start @2xl:justify-end @2xl:pt-2.5 @2xl:text-right",
                  )}
                >
                  <time
                    dateTime={item.date}
                    className={cn(
                      "text-sm font-semibold tabular-nums tracking-tight",
                      isLit ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-600 dark:text-zinc-400",
                      alternate && "@2xl:text-base",
                    )}
                  >
                    {dateText}
                  </time>
                  {item.tag && (
                    <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      <span className="sr-only">{tagLabel}: </span>
                      {item.tag}
                    </span>
                  )}
                </div>
  
                {/* Card */}
                <article
                  className={cn(
                    "relative col-start-2 row-start-2 min-w-0 rounded-xl border p-4 shadow-sm transition-[border-color,box-shadow,translate] duration-200 motion-reduce:transition-none sm:p-5",
                    alternate ? (onLeft ? "@2xl:col-start-1 @2xl:row-start-1" : "@2xl:col-start-3 @2xl:row-start-1") : "@2xl:col-start-3 @2xl:row-start-1",
                    item.highlight
                      ? "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-zinc-900 dark:to-zinc-900"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
                    item.href &&
                      "focus-within:ring-2 focus-within:ring-indigo-500 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-500/50",
                  )}
                >
                  {/* Connector tick toward the line on wide layouts */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-5 hidden h-px w-6 bg-zinc-200 dark:bg-zinc-700",
                      onLeft ? "@2xl:-right-6 @2xl:block" : "@2xl:-left-6 @2xl:block",
                    )}
                  />
                  {item.highlight && milestoneText && (
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      {milestoneText}
                    </p>
                  )}
                  <Heading className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {item.href ? (
                      <a
                        href={item.href}
                        className="inline-flex items-start gap-1 outline-none after:absolute after:inset-0 after:rounded-xl"
                      >
                        {item.title}
                        <ArrowUpRight
                          className="mt-0.5 size-4 shrink-0 text-zinc-400 transition-transform group-hover/item:-translate-y-0.5 group-hover/item:translate-x-0.5 motion-reduce:transition-none"
                          aria-hidden
                        />
                      </a>
                    ) : (
                      item.title
                    )}
                  </Heading>
                  {item.description && (
                    <div className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item.description}</div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
