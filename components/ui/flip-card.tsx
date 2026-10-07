"use client";

import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlipCardTrigger = "click" | "hover";
export type FlipCardDirection = "horizontal" | "vertical";
export type FlipCardControlPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface FlipCardProps {
  /** Content of the front face. */
  front: ReactNode;
  /** Content of the back face. Can hold buttons, links and inputs. */
  back: ReactNode;
  /**
   * click: clicking the card surface (or the flip button, Enter/Space) flips it.
   * hover: pointer hover flips it; touch taps and the flip button still toggle.
   */
  trigger?: FlipCardTrigger;
  /** horizontal rotates around the Y axis, vertical around the X axis. */
  direction?: FlipCardDirection;
  /** Shows the back face (controlled). */
  flipped?: boolean;
  /** Initial state (uncontrolled). */
  defaultFlipped?: boolean;
  /** Called with the new state whenever the card asks to flip. */
  onFlip?: (flipped: boolean) => void;
  /** Accessible name of the flip button. Its pressed state tells whether the back is showing. */
  label?: string;
  /** Renders the corner flip button. Turn off only if you flip the card from your own control. */
  showControl?: boolean;
  /** Corner of the flip button. */
  controlPosition?: FlipCardControlPosition;
  /** Icon inside the flip button. */
  controlIcon?: ReactNode;
  /** In click mode, clicks on the card surface flip it (clicks on interactive content never do). */
  flipOnSurfaceClick?: boolean;
  /** Flip duration in milliseconds. */
  duration?: number;
  /** Perspective distance in pixels. Smaller is more dramatic. */
  perspective?: number;
  /** Stops flipping and disables the flip button. */
  disabled?: boolean;
  /** Classes for the root (set width or height here). */
  className?: string;
  /** Classes for both faces. Replaces the default card surface. */
  faceClassName?: string;
  frontClassName?: string;
  backClassName?: string;
  controlClassName?: string;
}

const INTERACTIVE = 'a[href],button,input,select,textarea,label,summary,[role="button"],[role="link"],[contenteditable="true"],[tabindex]:not([tabindex="-1"])';

const POSITION: Record<FlipCardControlPosition, string> = {
  "top-left": "left-2 top-2",
  "top-right": "right-2 top-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

const STYLES = `
@media (prefers-reduced-motion: no-preference) {
  .lofi-flip-card-lift-a { animation: lofi-flip-card-lift-a var(--lofi-flip-card-duration) cubic-bezier(.3,.7,.3,1); }
  .lofi-flip-card-lift-b { animation: lofi-flip-card-lift-b var(--lofi-flip-card-duration) cubic-bezier(.3,.7,.3,1); }
}
@keyframes lofi-flip-card-lift-a { 0%, 100% { transform: scale(1); } 45% { transform: scale(.94); } }
@keyframes lofi-flip-card-lift-b { 0%, 100% { transform: scale(1); } 45% { transform: scale(.94); } }
`;

export function FlipCard({
  front,
  back,
  trigger = "click",
  direction = "horizontal",
  flipped: flippedProp,
  defaultFlipped = false,
  onFlip,
  label = "Flip card",
  showControl = true,
  controlPosition = "top-right",
  controlIcon,
  flipOnSurfaceClick = true,
  duration = 700,
  perspective = 1200,
  disabled = false,
  className,
  faceClassName,
  frontClassName,
  backClassName,
  controlClassName,
}: FlipCardProps) {
  const [inner, setInner] = useState(defaultFlipped);
  const flipped = flippedProp ?? inner;
  const lastPointer = useRef<string>("mouse");

  // Restart the "lift" animation on every change of side, without animating on mount.
  const [lift, setLift] = useState<"" | "a" | "b">("");
  const [prevFlipped, setPrevFlipped] = useState(flipped);
  if (prevFlipped !== flipped) {
    setPrevFlipped(flipped);
    setLift(flipped ? "a" : "b");
  }

  const setFlipped = (next: boolean) => {
    if (disabled || next === flipped) return;
    if (flippedProp === undefined) setInner(next);
    onFlip?.(next);
  };

  const onSurfaceClick = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const target = e.target as HTMLElement;
    const hit = target.closest(INTERACTIVE);
    if (hit && e.currentTarget.contains(hit) && hit !== e.currentTarget) return;
    if (window.getSelection()?.toString()) return;
    if (trigger === "click" && flipOnSurfaceClick) setFlipped(!flipped);
    // Hover cards on touch screens: a tap toggles.
    else if (trigger === "hover" && lastPointer.current !== "mouse") setFlipped(!flipped);
  };

  const onPointerEnter = (e: PointerEvent) => {
    lastPointer.current = e.pointerType;
    if (trigger === "hover" && e.pointerType === "mouse") setFlipped(true);
  };
  const onPointerLeave = (e: PointerEvent) => {
    if (trigger === "hover" && e.pointerType === "mouse") setFlipped(false);
  };

  const horizontal = direction === "horizontal";
  const turned = horizontal ? "motion-safe:[transform:rotateY(180deg)]" : "motion-safe:[transform:rotateX(180deg)]";
  const surface =
    faceClassName ??
    "overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100";
  const face =
    "col-start-1 row-start-1 h-full min-w-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] motion-reduce:transition-opacity motion-reduce:duration-300";

  return (
    <div
      onClick={onSurfaceClick}
      onPointerDown={(e) => (lastPointer.current = e.pointerType)}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      data-flipped={flipped || undefined}
      className={cn(
        "group/flip relative isolate",
        !disabled && (trigger === "click" ? flipOnSurfaceClick && "cursor-pointer" : "cursor-default"),
        disabled && "opacity-60",
        className,
      )}
      style={{ "--lofi-flip-card-duration": `${duration}ms` } as CSSProperties}
    >
      <style href="lofi-flip-card" precedence="default">
        {STYLES}
      </style>

      <div className={cn("h-full", lift && `lofi-flip-card-lift-${lift}`)} style={{ perspective: `${perspective}px` }}>
        <div
          className={cn(
            "grid h-full [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:ease-[cubic-bezier(0.3,1.2,0.4,1)]",
            flipped && turned,
          )}
          style={{ transitionDuration: `${duration}ms` }}
        >
          <div
            aria-hidden={flipped || undefined}
            inert={flipped}
            className={cn(face, surface, frontClassName, flipped && "motion-reduce:opacity-0")}
          >
            {front}
          </div>
          <div
            aria-hidden={!flipped || undefined}
            inert={!flipped}
            className={cn(face, turned, surface, backClassName, !flipped && "motion-reduce:opacity-0")}
          >
            {back}
          </div>
        </div>
      </div>

      {showControl && (
        <button
          type="button"
          aria-pressed={flipped}
          aria-label={label}
          disabled={disabled}
          onClick={() => setFlipped(!flipped)}
          className={cn(
            "absolute z-10 inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-600 shadow-sm outline-none backdrop-blur transition-[color,background-color,transform] motion-reduce:transition-none",
            "hover:bg-white hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95 disabled:pointer-events-none",
            "dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-offset-zinc-900",
            POSITION[controlPosition],
            controlClassName,
          )}
        >
          {controlIcon ?? (
            <RefreshCw
              aria-hidden
              className={cn(
                "size-4 transition-transform duration-500 motion-reduce:transition-none",
                flipped && "rotate-180",
              )}
            />
          )}
        </button>
      )}
    </div>
  );
}
