"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type TourPlacement = "top" | "bottom" | "left" | "right";

export interface TourStep {
  /** CSS selector of the element to highlight, e.g. '[data-tour="search"]'. Missing targets center the card. */
  target: string;
  title: string;
  content: ReactNode;
  /** Preferred side for the card. It flips to another side when there is no room. */
  placement?: TourPlacement;
  /** Overrides the tour's spotlightPadding for this step. */
  spotlightPadding?: number;
}

export interface ProductTourLabels {
  next: string;
  back: string;
  skip: string;
  finish: string;
  /** Step counter, e.g. "Step 2 of 4". */
  stepOf: (current: number, total: number) => string;
}

export interface ProductTourProps {
  steps: TourStep[];
  /** Whether the tour is showing. */
  open: boolean;
  /** Called with false on Skip, Escape and Finish. */
  onOpenChange: (open: boolean) => void;
  /** Called when the last step's Finish button is pressed. */
  onFinish?: () => void;
  /** Called with the step index when the tour is skipped or dismissed early. */
  onSkip?: (index: number) => void;
  /** Called with the new index whenever the step changes. */
  onStepChange?: (index: number) => void;
  /** Step index to start from each time the tour opens. */
  startAt?: number;
  /** Space in px between the target and the spotlight edge. */
  spotlightPadding?: number;
  /** Corner radius of the spotlight in px. */
  spotlightRadius?: number;
  /** Gap in px between the spotlight and the card. */
  offset?: number;
  /** Clicking the dimmed area skips the tour. Off by default: the card nudges instead. */
  closeOnOverlayClick?: boolean;
  labels?: Partial<ProductTourLabels>;
  /** Classes for the card. */
  className?: string;
}

const DEFAULT_LABELS: ProductTourLabels = {
  next: "Next",
  back: "Back",
  skip: "Skip tour",
  finish: "Finish",
  stepOf: (c, t) => `Step ${c} of ${t}`,
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Layout {
  hole: Rect | null;
  x: number;
  y: number;
  placement: TourPlacement | null;
  /** Arrow position along the card edge, in px. */
  arrow: number;
  /** False for the first frame so the card doesn't fly in from the corner. */
  animate: boolean;
}

const MARGIN = 12;

const OPPOSITE: Record<TourPlacement, TourPlacement> = { top: "bottom", bottom: "top", left: "right", right: "left" };

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), Math.max(min, max));

/** Picks the first side with room (preferred, opposite, then the rest) and positions the card there. */
function position(hole: Rect, tw: number, th: number, vw: number, vh: number, preferred: TourPlacement, gap: number) {
  const order = [preferred, OPPOSITE[preferred], ...(["bottom", "top", "right", "left"] as const)].filter(
    (p, i, a) => a.indexOf(p) === i,
  );
  const fits: Record<TourPlacement, boolean> = {
    bottom: hole.y + hole.h + gap + th <= vh - MARGIN,
    top: hole.y - gap - th >= MARGIN,
    right: hole.x + hole.w + gap + tw <= vw - MARGIN,
    left: hole.x - gap - tw >= MARGIN,
  };
  const placement = order.find((p) => fits[p]) ?? null;
  const cx = hole.x + hole.w / 2;
  const cy = hole.y + hole.h / 2;

  if (!placement) {
    // Nothing fits (huge target or tiny screen): dock the card at the bottom of the viewport.
    return { placement: null, x: clamp(vw / 2 - tw / 2, MARGIN, vw - tw - MARGIN), y: vh - th - MARGIN, arrow: 0 };
  }
  if (placement === "top" || placement === "bottom") {
    const x = clamp(cx - tw / 2, MARGIN, vw - tw - MARGIN);
    const y = placement === "bottom" ? hole.y + hole.h + gap : hole.y - gap - th;
    return { placement, x, y, arrow: clamp(cx - x, 18, tw - 18) };
  }
  const y = clamp(cy - th / 2, MARGIN, vh - th - MARGIN);
  const x = placement === "right" ? hole.x + hole.w + gap : hole.x - gap - tw;
  return { placement, x, y, arrow: clamp(cy - y, 18, th - 18) };
}

const sameLayout = (a: Layout | null, b: Omit<Layout, "animate">) =>
  !!a &&
  a.x === b.x &&
  a.y === b.y &&
  a.arrow === b.arrow &&
  a.placement === b.placement &&
  (a.hole === b.hole ||
    (!!a.hole && !!b.hole && a.hole.x === b.hole.x && a.hole.y === b.hole.y && a.hole.w === b.hole.w && a.hole.h === b.hole.h));

const KEYFRAMES = `
@keyframes lofi-product-tour-glow {
  0% { box-shadow: 0 0 0 0 rgb(99 102 241 / 0.55); }
  70%, 100% { box-shadow: 0 0 0 12px rgb(99 102 241 / 0); }
}
@keyframes lofi-product-tour-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.lofi-product-tour-glow { animation: lofi-product-tour-glow 1.8s ease-out infinite; }
.lofi-product-tour-fade { animation: lofi-product-tour-in 200ms ease-out; }
@media (prefers-reduced-motion: reduce) {
  .lofi-product-tour-glow, .lofi-product-tour-fade { animation: none; }
}
`;

const ARROW: Record<TourPlacement, string> = {
  // Card below the target: arrow on the card's top edge, and so on.
  bottom: "-top-[7px] border-l border-t",
  top: "-bottom-[7px] border-b border-r",
  right: "-left-[7px] border-b border-l",
  left: "-right-[7px] border-r border-t",
};

/**
 * Guided tour over real UI: an SVG-masked spotlight on each target and a card beside it
 * with Back / Next / Skip, a step counter and progress dots.
 */
export function ProductTour(props: ProductTourProps) {
  if (!props.open || props.steps.length === 0) return null;
  // A fresh session per opening, so it always starts at startAt.
  return <TourSession {...props} />;
}

function TourSession({
  steps,
  onOpenChange,
  onFinish,
  onSkip,
  onStepChange,
  startAt = 0,
  spotlightPadding = 8,
  spotlightRadius = 12,
  offset = 14,
  closeOnOverlayClick = false,
  labels: labelsProp,
  className,
}: ProductTourProps) {
  const L = { ...DEFAULT_LABELS, ...labelsProp };
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `tour-${uid}-title`;
  const bodyId = `tour-${uid}-body`;
  const maskId = `tour-${uid}-mask`;

  const total = steps.length;
  const [index, setIndex] = useState(() => clamp(Math.round(startAt), 0, total - 1));
  const [layout, setLayout] = useState<Layout | null>(null);
  const [announce, setAnnounce] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const step = steps[Math.min(index, total - 1)];
  const pad = step.spotlightPadding ?? spotlightPadding;
  const isLast = index === total - 1;

  const measure = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const tw = card.offsetWidth;
    const th = card.offsetHeight;
    const el = document.querySelector(step.target);
    let next: Omit<Layout, "animate">;
    if (!el) {
      next = { hole: null, placement: null, arrow: 0, x: Math.max(MARGIN, (vw - tw) / 2), y: Math.max(MARGIN, (vh - th) / 2) };
    } else {
      const r = el.getBoundingClientRect();
      const hole = {
        x: Math.round(r.left - pad),
        y: Math.round(r.top - pad),
        w: Math.round(r.width + pad * 2),
        h: Math.round(r.height + pad * 2),
      };
      const p = position(hole, tw, th, vw, vh, step.placement ?? "bottom", offset);
      next = { hole, ...p, x: Math.round(p.x), y: Math.round(p.y), arrow: Math.round(p.arrow) };
    }
    setLayout((prev) => (sameLayout(prev, next) ? prev : { ...next, animate: prev !== null }));
  }, [step.target, step.placement, pad, offset]);

  // Bring the target into view, then keep the spotlight glued to it on scroll, resize and layout changes.
  useEffect(() => {
    const el = document.querySelector(step.target);
    if (el) {
      const r = el.getBoundingClientRect();
      const visible = r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
      if (!visible) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
      }
    }
    let raf = requestAnimationFrame(measure);
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    const ro = new ResizeObserver(schedule);
    if (el) ro.observe(el);
    if (cardRef.current) ro.observe(cardRef.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, { capture: true });
      ro.disconnect();
    };
  }, [step.target, measure]);

  // Move focus into the card on open; give it back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cardRef.current?.focus({ preventScroll: true });
    return () => opener?.focus?.({ preventScroll: true });
  }, []);

  // If the focused button disappears (Back on the first step), keep focus inside the card.
  useEffect(() => {
    const card = cardRef.current;
    if (card && !card.contains(document.activeElement)) (nextRef.current ?? card).focus({ preventScroll: true });
  }, [index]);

  const go = (i: number) => {
    const n = clamp(i, 0, total - 1);
    if (n === index) return;
    setIndex(n);
    onStepChange?.(n);
    setAnnounce(`${L.stepOf(n + 1, total)}: ${steps[n].title}`);
  };

  const skip = () => {
    onSkip?.(index);
    onOpenChange(false);
  };

  const next = () => {
    if (!isLast) return go(index + 1);
    onFinish?.();
    onOpenChange(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const typing = t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      skip();
    } else if (e.key === "ArrowRight" && !typing) {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" && !typing) {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "Tab") {
      // Focus trap: cycle through the card's controls.
      const items = [...(cardRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), [href], input, [tabindex='0']") ?? [])];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === cardRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onOverlayClick = () => {
    if (closeOnOverlayClick) return skip();
    const card = cardRef.current;
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    card.animate(
      [{ scale: "1" }, { scale: "1.035" }, { scale: "0.99" }, { scale: "1" }],
      { duration: 320, easing: "ease-out" },
    );
  };

  const hole = layout?.hole ?? null;
  const placement = layout?.placement ?? null;
  const animate = layout?.animate ?? false;

  return (
    <div className="lofi-product-tour-fade fixed inset-0 z-[100]">
      <style href="lofi-product-tour" precedence="default">
        {KEYFRAMES}
      </style>

      {/* Click catcher; mousedown is prevented so focus stays in the card. */}
      <div aria-hidden className="absolute inset-0" onMouseDown={(e) => e.preventDefault()} onClick={onOverlayClick} />

      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {hole && (
              <rect
                x={hole.x}
                y={hole.y}
                width={hole.w}
                height={hole.h}
                rx={spotlightRadius}
                fill="black"
                className={cn(animate && "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out")}
                style={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h }}
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" mask={`url(#${maskId})`} className="fill-zinc-950/60 dark:fill-black/70" />
      </svg>

      {hole && (
        <div
          aria-hidden
          className={cn(
            "lofi-product-tour-glow pointer-events-none absolute left-0 top-0 ring-2 ring-indigo-400 dark:ring-indigo-300",
            animate && "motion-safe:transition-[transform,width,height] motion-safe:duration-300 motion-safe:ease-out",
          )}
          style={{
            transform: `translate(${hole.x}px, ${hole.y}px)`,
            width: hole.w,
            height: hole.h,
            borderRadius: spotlightRadius,
          }}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={{ transform: `translate(${layout?.x ?? 0}px, ${layout?.y ?? 0}px)`, opacity: layout ? 1 : 0 }}
        className={cn(
          "absolute left-0 top-0 w-[min(21rem,calc(100vw-1.5rem))] rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-2xl shadow-zinc-950/20 outline-none",
          "focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-black/50",
          animate && "motion-safe:transition-[transform,opacity] motion-safe:duration-300 motion-safe:ease-out",
          className,
        )}
      >
        {placement && (
          <span
            aria-hidden
            className={cn(
              "absolute size-3 rotate-45 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
              ARROW[placement],
            )}
            style={
              placement === "top" || placement === "bottom"
                ? { left: (layout?.arrow ?? 0) - 6 }
                : { top: (layout?.arrow ?? 0) - 6 }
            }
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium tabular-nums text-indigo-700 dark:text-indigo-300">{L.stepOf(index + 1, total)}</p>
          <div aria-hidden className="flex items-center gap-1">
            {steps.map((s, i) => (
              <span
                key={`${s.target}-${i}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                  i === index
                    ? "w-4 bg-indigo-600 dark:bg-indigo-400"
                    : i < index
                      ? "w-1.5 bg-indigo-300 dark:bg-indigo-500/60"
                      : "w-1.5 bg-zinc-300 dark:bg-zinc-600",
                )}
              />
            ))}
          </div>
        </div>

        <h2 id={titleId} className="mt-2 text-base font-semibold tracking-tight">
          {step.title}
        </h2>
        <div id={bodyId} className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {step.content}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={skip}
            className="-ml-2 h-10 rounded-lg px-2 text-sm font-medium text-zinc-600 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
          >
            {L.skip}
          </button>
          <div className="ml-auto flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
              >
                <ArrowLeft className="size-4" aria-hidden />
                {L.back}
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm outline-none hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-indigo-800 dark:focus-visible:ring-offset-zinc-900"
            >
              {isLast ? L.finish : L.next}
              {isLast ? <Check className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
            </button>
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      </div>
    </div>
  );
}
