"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlipCardTrigger = "click" | "hover";
/** auto: flips sideways or up/down depending on which edge you press, like a real card. */
export type FlipCardDirection = "auto" | "horizontal" | "vertical";
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
  /**
   * auto picks the axis from where you press (near the left/right edges: sideways, near top/bottom: up/down).
   * horizontal always turns around the Y axis, vertical around the X axis.
   * In every mode the card turns away from the point you press.
   */
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
  /** Tilts the card a few degrees toward a hovering mouse, previewing which way it will turn. */
  tiltHint?: boolean;
  /** Largest tilt in degrees. */
  tiltAngle?: number;
  /** Press and hold the surface to peek at the other side; letting go turns it back. */
  peekOnHold?: boolean;
  /** Milliseconds of holding before a peek starts. A shorter press is a normal click. */
  peekDelay?: number;
  /** Called when a peek starts (true) and ends (false). */
  onPeek?: (peeking: boolean) => void;
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

type Axis = "x" | "y";
interface Press {
  /** -1 (left) … 1 (right) */
  nx: number;
  /** -1 (top) … 1 (bottom) */
  ny: number;
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

const TILT_MS = 180;

function pressOf(e: { clientX: number; clientY: number; currentTarget: Element }): Press {
  const r = e.currentTarget.getBoundingClientRect();
  const nx = r.width ? ((e.clientX - r.left) / r.width) * 2 - 1 : 0;
  const ny = r.height ? ((e.clientY - r.top) / r.height) * 2 - 1 : 0;
  return { nx: Math.max(-1, Math.min(1, nx)), ny: Math.max(-1, Math.min(1, ny)) };
}

/** Which axis to turn around, and the sign that pushes the pressed edge away from the viewer. */
function turnFor(direction: FlipCardDirection, press: Press | undefined, fallback: Axis): { axis: Axis; sign: 1 | -1 } {
  const axis: Axis =
    direction === "horizontal"
      ? "y"
      : direction === "vertical"
        ? "x"
        : press
          ? Math.abs(press.nx) >= Math.abs(press.ny)
            ? "y"
            : "x"
          : fallback;
  // rotateY(+) moves the right edge back; rotateX(-) moves the bottom edge back.
  if (axis === "y") return { axis, sign: !press || press.nx >= 0 ? 1 : -1 };
  return { axis, sign: !press || press.ny >= 0 ? -1 : 1 };
}

export function FlipCard({
  front,
  back,
  trigger = "click",
  direction = "auto",
  flipped: flippedProp,
  defaultFlipped = false,
  onFlip,
  label = "Flip card",
  showControl = true,
  controlPosition = "top-right",
  controlIcon,
  flipOnSurfaceClick = true,
  tiltHint = true,
  tiltAngle = 7,
  peekOnHold = true,
  peekDelay = 350,
  onPeek,
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
  const [peeking, setPeeking] = useState(false);
  // The side on screen: a peek shows the other side without changing `flipped`.
  const shown = flipped !== peeking;

  const [turn, setTurn] = useState<{ axis: Axis; sign: 1 | -1 }>(() =>
    turnFor(direction, undefined, direction === "vertical" ? "x" : "y"),
  );
  const [tilt, setTilt] = useState<{ axis: Axis; deg: number } | null>(null);
  const [animMs, setAnimMs] = useState(duration);

  const lastPointer = useRef<string>("mouse");
  const flipAt = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peeked = useRef(false);

  useEffect(
    () => () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    },
    [],
  );

  // Restart the "lift" animation on every change of side, without animating on mount.
  const [lift, setLift] = useState<"" | "a" | "b">("");
  const [prevShown, setPrevShown] = useState(shown);
  if (prevShown !== shown) {
    setPrevShown(shown);
    setLift(shown ? "a" : "b");
  }

  /** Picks the turn for the next change of side. The axis can only change while the front is up. */
  const aim = (press?: Press) => {
    // Turning back to the front keeps the axis, so the card returns the way it came.
    if (!shown) setTurn(turnFor(direction, press, turn.axis));
    setTilt(null);
    setAnimMs(duration);
    flipAt.current = performance.now();
  };

  const setFlipped = (next: boolean, press?: Press) => {
    if (disabled || next === flipped) return;
    aim(press);
    if (flippedProp === undefined) setInner(next);
    onFlip?.(next);
  };

  const endPeek = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (peeking) {
      aim();
      setPeeking(false);
      onPeek?.(false);
    }
  };

  const isOnInteractive = (target: EventTarget, root: HTMLElement) => {
    const hit = (target as HTMLElement).closest?.(INTERACTIVE);
    return Boolean(hit && root.contains(hit) && hit !== root);
  };

  const onSurfaceClick = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (peeked.current) {
      // The click that ends a hold-to-peek should not also flip the card.
      peeked.current = false;
      return;
    }
    if (isOnInteractive(e.target, e.currentTarget)) return;
    if (window.getSelection()?.toString()) return;
    const press = pressOf(e);
    if (trigger === "click" && flipOnSurfaceClick) setFlipped(!flipped, press);
    // Hover cards on touch screens: a tap toggles.
    else if (trigger === "hover" && lastPointer.current !== "mouse") setFlipped(!flipped, press);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    lastPointer.current = e.pointerType;
    peeked.current = false;
    if (!peekOnHold || disabled || trigger !== "click" || e.button !== 0) return;
    if (isOnInteractive(e.target, e.currentTarget)) return;
    const press = pressOf(e);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      peeked.current = true;
      aim(press);
      setPeeking(true);
      onPeek?.(true);
    }, peekDelay);
  };

  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    lastPointer.current = e.pointerType;
    if (trigger === "hover" && e.pointerType === "mouse") setFlipped(true, pressOf(e));
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!tiltHint || disabled || shown || trigger !== "click" || e.pointerType !== "mouse") return;
    if (performance.now() - flipAt.current < duration) return;
    const press = pressOf(e);
    const { axis, sign } = turnFor(direction, press, turn.axis);
    const strength = Math.max(Math.abs(press.nx), Math.abs(press.ny));
    const deg = Math.round(sign * tiltAngle * strength * 10) / 10;
    if (tilt && tilt.axis === axis && Math.abs(tilt.deg - deg) < 0.5) return;
    setAnimMs(TILT_MS);
    setTilt({ axis, deg });
  };

  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    endPeek();
    if (tilt) {
      setAnimMs(TILT_MS);
      setTilt(null);
    }
    if (trigger === "hover" && e.pointerType === "mouse") setFlipped(false);
  };

  // Both rotations are always listed so CSS interpolates each angle on its own.
  const half = shown ? turn.sign * 180 : 0;
  const rx = (turn.axis === "x" ? half : 0) + (!shown && tilt?.axis === "x" ? tilt.deg : 0);
  const ry = (turn.axis === "y" ? half : 0) + (!shown && tilt?.axis === "y" ? tilt.deg : 0);
  const backTurn = turn.axis === "x" ? "rotateX(180deg)" : "rotateY(180deg)";

  const surface =
    faceClassName ??
    "overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100";
  const face =
    "col-start-1 row-start-1 h-full min-w-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] motion-reduce:transition-opacity motion-reduce:duration-300";

  return (
    <div
      onClick={onSurfaceClick}
      onPointerDown={onPointerDown}
      onPointerUp={endPeek}
      onPointerCancel={endPeek}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onContextMenu={(e) => peeked.current && e.preventDefault()}
      data-flipped={flipped || undefined}
      data-peeking={peeking || undefined}
      className={cn(
        "group/flip relative isolate touch-manipulation [-webkit-touch-callout:none]",
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
          className="grid h-full [transform-style:preserve-3d] motion-safe:[transform:var(--lofi-flip-rot)] motion-safe:transition-transform motion-safe:ease-[cubic-bezier(0.3,1.2,0.4,1)]"
          style={
            {
              "--lofi-flip-rot": `rotateX(${rx}deg) rotateY(${ry}deg)`,
              transitionDuration: `${animMs}ms`,
            } as CSSProperties
          }
        >
          <div
            aria-hidden={shown || undefined}
            inert={shown}
            className={cn(face, surface, frontClassName, shown && "motion-reduce:opacity-0")}
          >
            {front}
          </div>
          <div
            aria-hidden={!shown || undefined}
            inert={!shown}
            className={cn(face, "motion-safe:[transform:var(--lofi-flip-back)]", surface, backClassName, !shown && "motion-reduce:opacity-0")}
            style={{ "--lofi-flip-back": backTurn } as CSSProperties}
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
              className={cn("size-4 transition-transform duration-500 motion-reduce:transition-none", flipped && "rotate-180")}
            />
          )}
        </button>
      )}
    </div>
  );
}
