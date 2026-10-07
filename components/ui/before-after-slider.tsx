"use client";

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** One side of the comparison. */
export interface ComparisonImage {
  /** Image URL. Both images should share the same aspect ratio. */
  src: string;
  /** Describes what this version shows, e.g. "Unedited photo, flat grey sky". */
  alt: string;
}

/** Text for the corner labels. */
export interface BeforeAfterLabels {
  before: string;
  after: string;
}

export interface BeforeAfterSliderProps {
  /** Shown on the start side (left, or top when vertical). */
  before: ComparisonImage;
  /** Shown on the end side (right, or bottom when vertical). */
  after: ComparisonImage;
  /** Starting position in percent of the before image that is visible. */
  initial?: number;
  /** Position (controlled), 0 to 100. */
  value?: number;
  /** Called with the new position while dragging, clicking or using the keyboard. */
  onValueChange?: (value: number) => void;
  /** horizontal: the divider moves left and right. vertical: it moves up and down. */
  orientation?: "horizontal" | "vertical";
  /** Corner labels. Pass false to hide them. */
  labels?: BeforeAfterLabels | false;
  /** CSS aspect ratio of the frame, e.g. "16 / 9" or 1.5. */
  aspectRatio?: string | number;
  /** Arrow key step in percent. Shift + arrow and Page Up/Down move 10 steps. */
  step?: number;
  /** Accessible name of the slider handle. */
  handleLabel?: string;
  /** Builds the spoken value, e.g. "62% before, 38% after". */
  formatValueText?: (value: number, labels: BeforeAfterLabels) => string;
  /** Gives the handle a small nudge after mount to hint that it moves. Off with reduced motion. */
  hint?: boolean;
  /** Shown in place of an image that fails to load. */
  errorText?: string;
  /** Classes for the outer frame. */
  className?: string;
}

const DEFAULT_LABELS: BeforeAfterLabels = { before: "Before", after: "After" };

type LoadState = "loading" | "loaded" | "error";

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
/** 0 within `edge` % of an edge, 1 once the label has `edge + fade` % of room. */
const fadeIn = (room: number, edge = 6, fade = 14) => clamp((room - edge) / fade, 0, 1);

const KEYFRAMES = `
@keyframes lofi-before-after-slider-nudge-x {
  0%, 100% { translate: 0 0; }
  25% { translate: -7px 0; }
  60% { translate: 7px 0; }
}
@keyframes lofi-before-after-slider-nudge-y {
  0%, 100% { translate: 0 0; }
  25% { translate: 0 -7px; }
  60% { translate: 0 7px; }
}
.lofi-before-after-slider-hint-x { animation: lofi-before-after-slider-nudge-x 900ms ease-in-out 600ms 2; }
.lofi-before-after-slider-hint-y { animation: lofi-before-after-slider-nudge-y 900ms ease-in-out 600ms 2; }
@media (prefers-reduced-motion: reduce) {
  .lofi-before-after-slider-hint-x, .lofi-before-after-slider-hint-y { animation: none; }
}
`;

/**
 * Image comparison: two stacked images, the top one clipped at a draggable divider.
 * Drag the handle, click anywhere to jump, or focus the handle and use the arrow keys.
 */
export function BeforeAfterSlider({
  before,
  after,
  initial = 50,
  value: valueProp,
  onValueChange,
  orientation = "horizontal",
  labels = DEFAULT_LABELS,
  aspectRatio = "16 / 9",
  step = 1,
  handleLabel = "Comparison position",
  formatValueText = (v, l) => `${v}% ${l.before.toLowerCase()}, ${100 - v}% ${l.after.toLowerCase()}`,
  hint = true,
  errorText = "Image unavailable",
  className,
}: BeforeAfterSliderProps) {
  const vertical = orientation === "vertical";
  const [inner, setInner] = useState(() => clamp(initial));
  const position = clamp(valueProp ?? inner);

  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<{ before: LoadState; after: LoadState }>({ before: "loading", after: "loading" });

  const frameRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const moved = useRef(false);

  const commit = useCallback(
    (next: number) => {
      const v = Math.round(clamp(next) * 10) / 10;
      if (valueProp === undefined) setInner(v);
      onValueChange?.(v);
    },
    [valueProp, onValueChange],
  );

  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r) return position;
    return vertical ? ((e.clientY - r.top) / r.height) * 100 : ((e.clientX - r.left) / r.width) * 100;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    pointerId.current = e.pointerId;
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    handleRef.current?.focus({ preventScroll: true });
    setTouched(true);
    // A click jumps with a short transition; dragging then follows the pointer 1:1.
    commit(fromPointer(e));
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;
    if (!moved.current) {
      moved.current = true;
      setDragging(true);
    }
    commit(fromPointer(e));
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const big = step * 10;
    const s = e.shiftKey ? big : step;
    let next: number | null = null;
    // The handle follows the arrow on screen: Up moves a vertical divider up, Right moves a horizontal one right.
    const up = vertical ? -s : s;
    switch (e.key) {
      case "ArrowLeft":
        next = position - s;
        break;
      case "ArrowRight":
        next = position + s;
        break;
      case "ArrowUp":
        next = position + up;
        break;
      case "ArrowDown":
        next = position - up;
        break;
      case "PageUp":
        next = position - big;
        break;
      case "PageDown":
        next = position + big;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = 100;
        break;
    }
    if (next === null) return;
    e.preventDefault();
    setTouched(true);
    commit(Math.round(next / step) * step);
  };

  const markImage = (side: "before" | "after", state: LoadState) =>
    setStatus((s) => (s[side] === state ? s : { ...s, [side]: state }));

  // Catches images that finished loading before hydration, when onLoad has already fired.
  const imageRef = (side: "before" | "after") => (el: HTMLImageElement | null) => {
    if (el?.complete) markImage(side, el.naturalWidth > 0 ? "loaded" : "error");
  };

  const allLabels = labels === false ? DEFAULT_LABELS : labels;
  const rounded = Math.round(position);
  const loading = status.before === "loading" || status.after === "loading";
  const animate = !dragging;
  const pos = `${position}%`;

  const clip = vertical ? `inset(0 0 calc(100% - ${pos}) 0)` : `inset(0 calc(100% - ${pos}) 0 0)`;
  const transition = animate ? "motion-safe:transition-[clip-path] motion-safe:duration-200 motion-safe:ease-out" : "";
  const moveTransition = animate
    ? "motion-safe:transition-[left,top] motion-safe:duration-200 motion-safe:ease-out"
    : "";

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      style={{ aspectRatio, touchAction: vertical ? "pan-x" : "pan-y" }}
      className={cn(
        "group/bas relative isolate w-full select-none overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        vertical ? "cursor-row-resize" : "cursor-col-resize",
        className,
      )}
    >
      <style href="lofi-before-after-slider" precedence="default">
        {KEYFRAMES}
      </style>

      {/* After: the base layer. */}
      <Layer image={after} state={status.after} errorText={errorText} imgRef={imageRef("after")} onState={(s) => markImage("after", s)} />

      {/* Before: clipped to the start side of the divider. */}
      <div className={cn("absolute inset-0", transition)} style={{ clipPath: clip }}>
        <Layer
          image={before}
          state={status.before}
          errorText={errorText}
          imgRef={imageRef("before")}
          onState={(s) => markImage("before", s)}
        />
      </div>

      {loading && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-zinc-200/80 motion-safe:animate-pulse dark:bg-zinc-800/80"
        />
      )}

      {labels !== false && (
        <>
          <CornerLabel
            text={allLabels.before}
            opacity={fadeIn(position)}
            className="left-3 top-3"
          />
          <CornerLabel
            text={allLabels.after}
            opacity={fadeIn(100 - position)}
            className={vertical ? "bottom-3 left-3" : "right-3 top-3"}
          />
        </>
      )}

      {/* Divider line. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-10 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_0_12px_rgb(0_0_0/0.35)]",
          vertical ? "inset-x-0 h-0.5 -translate-y-1/2" : "inset-y-0 w-0.5 -translate-x-1/2",
          moveTransition,
        )}
        style={vertical ? { top: pos } : { left: pos }}
      />

      {/* Handle. */}
      <div
        className={cn("absolute z-20 -translate-x-1/2 -translate-y-1/2", moveTransition)}
        style={vertical ? { top: pos, left: "50%" } : { left: pos, top: "50%" }}
      >
        <div
          ref={handleRef}
          role="slider"
          tabIndex={0}
          aria-label={handleLabel}
          aria-orientation={orientation}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rounded}
          aria-valuetext={formatValueText(rounded, allLabels)}
          onKeyDown={onKeyDown}
          className={cn(
            "peer flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-zinc-800 shadow-lg ring-1 ring-black/10 backdrop-blur outline-none",
            "transition-[scale,background-color,box-shadow] duration-150 motion-reduce:transition-none",
            "hover:scale-105 hover:bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/70",
            "dark:border-white/20 dark:bg-zinc-900/90 dark:text-zinc-100 dark:ring-white/10 dark:hover:bg-zinc-900",
            dragging && "scale-95 bg-white dark:bg-zinc-900",
            vertical ? "flex-col" : "flex-row",
            hint && !touched && (vertical ? "lofi-before-after-slider-hint-y" : "lofi-before-after-slider-hint-x"),
          )}
        >
          {vertical ? (
            <>
              <ChevronUp className="-mb-1 size-4" aria-hidden />
              <ChevronDown className="-mt-1 size-4" aria-hidden />
            </>
          ) : (
            <>
              <ChevronLeft className="-mr-1 size-4" aria-hidden />
              <ChevronRight className="-ml-1 size-4" aria-hidden />
            </>
          )}
        </div>
        {/* Live readout while dragging or keyboard-focused. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute whitespace-nowrap rounded-md bg-zinc-900/85 px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-white opacity-0 transition-opacity duration-150 motion-reduce:transition-none dark:bg-white/90 dark:text-zinc-900",
            vertical ? "left-full top-1/2 ml-2 -translate-y-1/2" : "bottom-full left-1/2 mb-2 -translate-x-1/2",
            dragging ? "opacity-100" : "peer-focus-visible:opacity-100",
          )}
        >
          {rounded}%
        </span>
      </div>
    </div>
  );
}

function Layer({
  image,
  state,
  errorText,
  imgRef,
  onState,
}: {
  image: ComparisonImage;
  state: LoadState;
  errorText: string;
  imgRef: (el: HTMLImageElement | null) => void;
  onState: (s: LoadState) => void;
}) {
  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={image.src}
        alt={image.alt}
        draggable={false}
        decoding="async"
        onLoad={() => onState("loaded")}
        onError={() => onState("error")}
        className={cn("size-full object-cover", state === "error" && "invisible")}
      />
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-100 p-4 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <ImageOff className="size-6" aria-hidden />
          <span>{errorText}</span>
          <span className="max-w-xs text-xs text-zinc-500 dark:text-zinc-400">{image.alt}</span>
        </div>
      )}
    </div>
  );
}

function CornerLabel({ text, opacity, className }: { text: string; opacity: number; className: string }) {
  return (
    <span
      aria-hidden
      style={{ opacity }}
      className={cn(
        "pointer-events-none absolute z-10 rounded-full bg-zinc-950/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/15 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none",
        className,
      )}
    >
      {text}
    </span>
  );
}
