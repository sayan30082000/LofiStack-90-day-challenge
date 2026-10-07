"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TiltCardProps {
  /**
   * Card content. Any descendant with a `data-depth` attribute (in px, e.g. `data-depth="40"`)
   * lifts off the surface by that much while the card is active, for a parallax effect.
   */
  children: ReactNode;
  /** Maximum rotation on each axis, in degrees. */
  maxTilt?: number;
  /** Show a highlight that follows the pointer. */
  glare?: boolean;
  /** Any CSS color for the glare highlight's center. */
  glareColor?: string;
  /** Scale while hovered. Pressing shrinks it slightly for an active state. */
  scale?: number;
  /** CSS perspective distance in px. Lower values look more dramatic. */
  perspective?: number;
  /** Soft drop shadow that drifts away from the pointer. */
  shadow?: boolean;
  /** Duration of the ease back to rest when the pointer leaves, in ms. */
  resetDuration?: number;
  /** Turn the effect off; children render as a flat card. */
  disabled?: boolean;
  /** Classes for the tilting surface (background, radius, size, padding). Avoid overflow-hidden here: it flattens depth layers. */
  className?: string;
  /** Classes for the untransformed outer wrapper (layout, width, margins). */
  wrapperClassName?: string;
}

const VARS = [
  "--lofi-tilt-rx",
  "--lofi-tilt-ry",
  "--lofi-tilt-s",
  "--lofi-tilt-gx",
  "--lofi-tilt-gy",
  "--lofi-tilt-glare",
  "--lofi-tilt-pop",
  "--lofi-tilt-sx",
  "--lofi-tilt-sy",
  "--lofi-tilt-dur",
] as const;

/**
 * Card that rotates toward the pointer in 3D with a moving glare and
 * depth layers. Pointer-only: touch input and reduced motion get a flat card.
 */
export function TiltCard({
  children,
  maxTilt = 12,
  glare = true,
  glareColor = "rgb(255 255 255 / 0.55)",
  scale = 1.03,
  perspective = 1000,
  shadow = true,
  resetDuration = 600,
  disabled = false,
  className,
  wrapperClassName,
}: TiltCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const frame = useRef({ id: 0, active: false, pressed: false });

  // Cancel a pending frame on unmount.
  useEffect(() => {
    const f = frame.current;
    return () => cancelAnimationFrame(f.id);
  }, []);

  // Give every [data-depth] layer a translateZ that scales with --lofi-tilt-pop,
  // and keep 3D alive through any wrappers between the layer and the surface.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    let max = 0;
    surface.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
      const depth = Number.parseFloat(el.dataset.depth ?? "0") || 0;
      max = Math.max(max, depth);
      el.style.transform = `translateZ(calc(${depth}px * var(--lofi-tilt-pop, 0)))`;
      el.style.transition = "transform var(--lofi-tilt-dur, 600ms) cubic-bezier(0.2, 0.8, 0.2, 1)";
      for (let p = el.parentElement; p && p !== surface; p = p.parentElement) p.style.transformStyle = "preserve-3d";
    });
    if (glareRef.current) glareRef.current.style.transform = `translateZ(calc(${max + 1}px * var(--lofi-tilt-pop, 0)))`;
  }, [children, glare]);

  const reset = () => {
    const f = frame.current;
    cancelAnimationFrame(f.id);
    f.active = false;
    f.pressed = false;
    const s = surfaceRef.current?.style;
    const r = rootRef.current?.style;
    VARS.forEach((v) => {
      s?.removeProperty(v);
      r?.removeProperty(v);
    });
  };

  const canTilt = (e: PointerEvent) =>
    !disabled && e.pointerType !== "touch" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const update = (clientX: number, clientY: number) => {
    const root = rootRef.current;
    const surface = surfaceRef.current;
    if (!root || !surface) return;
    const f = frame.current;
    cancelAnimationFrame(f.id);
    f.id = requestAnimationFrame(() => {
      // Measure the untransformed wrapper so the tilt itself doesn't skew the math.
      const rect = root.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      const s = surface.style;
      s.setProperty("--lofi-tilt-dur", "160ms");
      s.setProperty("--lofi-tilt-rx", `${((0.5 - py) * 2 * maxTilt).toFixed(2)}deg`);
      s.setProperty("--lofi-tilt-ry", `${((px - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
      s.setProperty("--lofi-tilt-s", String(f.pressed ? scale - 0.025 : scale));
      s.setProperty("--lofi-tilt-gx", `${(px * 100).toFixed(1)}%`);
      s.setProperty("--lofi-tilt-gy", `${(py * 100).toFixed(1)}%`);
      s.setProperty("--lofi-tilt-glare", "1");
      s.setProperty("--lofi-tilt-pop", f.pressed ? "0.6" : "1");
      const r = root.style;
      r.setProperty("--lofi-tilt-dur", "160ms");
      r.setProperty("--lofi-tilt-sx", `${((0.5 - px) * 28).toFixed(1)}px`);
      r.setProperty("--lofi-tilt-sy", `${((0.5 - py) * 20 + 14).toFixed(1)}px`);
    });
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!canTilt(e)) {
      // E.g. disabled mid-hover: settle back to rest.
      if (frame.current.active) reset();
      return;
    }
    frame.current.active = true;
    update(e.clientX, e.clientY);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!frame.current.active) return;
    frame.current.pressed = true;
    update(e.clientX, e.clientY);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!frame.current.pressed) return;
    frame.current.pressed = false;
    update(e.clientX, e.clientY);
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={reset}
      onPointerCancel={reset}
      style={{ perspective: `${perspective}px`, "--lofi-tilt-reset": `${resetDuration}ms` } as CSSProperties}
      className={cn("group/tilt relative isolate", wrapperClassName)}
    >
      {shadow && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-[10%] bottom-[-4%] top-[14%] -z-10 rounded-[2rem] bg-zinc-900/30 opacity-60 blur-2xl dark:bg-black/70",
            "[transform:translate3d(var(--lofi-tilt-sx,0px),var(--lofi-tilt-sy,10px),0)] [transition:transform_var(--lofi-tilt-dur,var(--lofi-tilt-reset))_cubic-bezier(0.2,0.8,0.2,1),opacity_300ms]",
            !disabled && "group-hover/tilt:opacity-90 group-focus-within/tilt:opacity-90",
            "motion-reduce:[transform:translate3d(0,10px,0)] motion-reduce:transition-none",
          )}
        />
      )}
      <div
        ref={surfaceRef}
        className={cn(
          "relative [transform-style:preserve-3d] will-change-transform",
          "[transform:rotateX(var(--lofi-tilt-rx,0deg))_rotateY(var(--lofi-tilt-ry,0deg))_scale3d(var(--lofi-tilt-s,1),var(--lofi-tilt-s,1),1)]",
          "[transition:transform_var(--lofi-tilt-dur,var(--lofi-tilt-reset))_cubic-bezier(0.2,0.8,0.2,1),translate_250ms_ease-out,box-shadow_250ms_ease-out]",
          // Keyboard feedback: a subtle lift, and depth layers rise a little.
          !disabled && "focus-within:-translate-y-1.5 motion-safe:focus-within:[--lofi-tilt-pop:0.5]",
          "motion-reduce:[transform:none] motion-reduce:transition-none",
          disabled && "[transform:none]",
          className,
        )}
      >
        {children}
        {glare && !disabled && (
          <div ref={glareRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div
              className="absolute inset-0 opacity-[var(--lofi-tilt-glare,0)] mix-blend-soft-light transition-opacity duration-300 motion-reduce:hidden"
              style={{
                background: `radial-gradient(circle at var(--lofi-tilt-gx, 50%) var(--lofi-tilt-gy, 50%), ${glareColor}, transparent 62%)`,
              }}
            />
            <div
              className="absolute inset-0 opacity-[calc(var(--lofi-tilt-glare,0)*0.5)] transition-opacity duration-300 motion-reduce:hidden"
              style={{
                background: `radial-gradient(circle at var(--lofi-tilt-gx, 50%) var(--lofi-tilt-gy, 50%), ${glareColor}, transparent 38%)`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
