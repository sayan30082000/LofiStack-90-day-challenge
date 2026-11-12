"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Smartphone } from "lucide-react";
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
  /**
   * On phones and tablets, tilt the card by tilting the device. Calibrates to how it's held when
   * motion starts. iOS asks for permission once, through a small "Enable motion" button.
   */
  motion?: boolean;
  /** Label of the button that asks for motion permission on iOS. */
  motionLabel?: string;
  /**
   * Where the light comes from. "pointer": the glare follows the pointer. A point ({ x, y } from -1 to 1,
   * e.g. { x: -0.5, y: -0.8 } for top left) is a fixed lamp: the reflection slides across the card as it
   * tilts and the shadow falls away from the light, like a real card under a light.
   */
  light?: "pointer" | TiltLight;
}

export interface TiltLight {
  /** -1 left … 1 right */
  x: number;
  /** -1 top … 1 bottom */
  y: number;
}

export interface DeviceTilt {
  /** Front-to-back tilt in degrees (DeviceOrientationEvent.beta). */
  beta: number;
  /** Left-to-right tilt in degrees (DeviceOrientationEvent.gamma). */
  gamma: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Card rotation from a device reading, relative to the reading taken when motion started.
 * `range` degrees of phone tilt reach the full `maxTilt`.
 */
export function orientationToTilt(reading: DeviceTilt, base: DeviceTilt, maxTilt: number, range = 25) {
  const front = clamp(reading.beta - base.beta, -range, range) / range;
  const side = clamp(reading.gamma - base.gamma, -range, range) / range;
  return { rx: Math.round(-front * maxTilt * 100) / 100 || 0, ry: Math.round(side * maxTilt * 100) / 100 || 0 };
}

/**
 * Glare centre (in %) and shadow offset (in px) for a fixed light. The reflection moves the opposite
 * way to the tilt, and the shadow falls away from the light.
 */
export function lightFor(rx: number, ry: number, maxTilt: number, light: TiltLight) {
  const tx = maxTilt ? ry / maxTilt : 0;
  const ty = maxTilt ? rx / maxTilt : 0;
  return {
    gx: clamp(50 + light.x * 38 - tx * 32, 0, 100),
    gy: clamp(50 + light.y * 38 + ty * 32, 0, 100),
    sx: Math.round((-light.x * 26 - tx * 8) * 10) / 10,
    sy: Math.round((-light.y * 18 + 12 + ty * 6) * 10) / 10,
  };
}

/** Minimal type for iOS's permission method on DeviceOrientationEvent. */
type OrientationWithPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

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
 * Card that rotates toward the pointer in 3D with a glare and depth layers,
 * lit by the pointer or by a fixed `light`. On phones it follows the phone's
 * tilt (`motion`) instead of touch. Reduced motion gets a flat card.
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
  motion = true,
  motionLabel = "Enable motion",
  light = "pointer",
}: TiltCardProps) {
  const fixedLight = light === "pointer" ? null : light;
  const lightKey = fixedLight ? `${fixedLight.x},${fixedLight.y}` : "pointer";
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
    restUnderLight("var(--lofi-tilt-reset)");
  };

  const canTilt = (e: PointerEvent) =>
    !disabled && e.pointerType !== "touch" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Writes one pose: rotation, glare and shadow. px/py is the pointer position (0–1), when there is one. */
  const apply = (rx: number, ry: number, px: number | null, py: number | null, liftScale: number, dur = "160ms") => {
    const root = rootRef.current;
    const surface = surfaceRef.current;
    if (!root || !surface) return;
    const f = frame.current;
    const lit = fixedLight
      ? lightFor(rx, ry, maxTilt, fixedLight)
      : { gx: (px ?? 0.5) * 100, gy: (py ?? 0.5) * 100, sx: (0.5 - (px ?? 0.5)) * 28, sy: (0.5 - (py ?? 0.5)) * 20 + 14 };
    const st = surface.style;
    st.setProperty("--lofi-tilt-dur", dur);
    st.setProperty("--lofi-tilt-rx", `${rx.toFixed(2)}deg`);
    st.setProperty("--lofi-tilt-ry", `${ry.toFixed(2)}deg`);
    st.setProperty("--lofi-tilt-s", String(f.pressed ? liftScale - 0.025 : liftScale));
    st.setProperty("--lofi-tilt-gx", `${lit.gx.toFixed(1)}%`);
    st.setProperty("--lofi-tilt-gy", `${lit.gy.toFixed(1)}%`);
    st.setProperty("--lofi-tilt-glare", "1");
    st.setProperty("--lofi-tilt-pop", f.pressed ? "0.6" : "1");
    const rs = root.style;
    rs.setProperty("--lofi-tilt-dur", dur);
    rs.setProperty("--lofi-tilt-sx", `${lit.sx.toFixed(1)}px`);
    rs.setProperty("--lofi-tilt-sy", `${lit.sy.toFixed(1)}px`);
  };

  const update = (clientX: number, clientY: number) => {
    const root = rootRef.current;
    if (!root) return;
    const f = frame.current;
    cancelAnimationFrame(f.id);
    f.id = requestAnimationFrame(() => {
      // Measure the untransformed wrapper so the tilt itself doesn't skew the math.
      const rect = root.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      apply((0.5 - py) * 2 * maxTilt, (px - 0.5) * 2 * maxTilt, px, py, scale);
    });
  };

  /* ---------- Device motion ---------- */

  const [motionState, setMotionState] = useState<"off" | "needs-permission" | "on">("off");
  const base = useRef<DeviceTilt | null>(null);

  useEffect(() => {
    if (!motion || disabled || typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
    if (!window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const Orientation = window.DeviceOrientationEvent as OrientationWithPermission;
    // iOS needs a tap before it shares motion; everyone else can start now.
    const t = setTimeout(() => setMotionState(typeof Orientation.requestPermission === "function" ? "needs-permission" : "on"), 0);
    return () => clearTimeout(t);
  }, [motion, disabled]);

  useEffect(() => {
    if (motionState !== "on") return;
    base.current = null;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      const reading = { beta: e.beta, gamma: e.gamma };
      base.current ??= reading;
      const { rx, ry } = orientationToTilt(reading, base.current, maxTilt);
      frame.current.active = true;
      apply(rx, ry, null, null, 1, "120ms");
    };
    // Turning the phone sideways changes the axes: calibrate again.
    const recalibrate = () => {
      base.current = null;
    };
    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("orientationchange", recalibrate);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("orientationchange", recalibrate);
    };
    // apply reads the latest props through its closure on every event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionState, maxTilt, lightKey]);

  const askPermission = async () => {
    const Orientation = window.DeviceOrientationEvent as OrientationWithPermission;
    try {
      const result = await Orientation.requestPermission?.();
      setMotionState(result === "granted" ? "on" : "off");
    } catch {
      setMotionState("off");
    }
  };

  /** With a fixed lamp, the resting card still shows where the light falls. */
  const restUnderLight = (dur: string) => {
    if (!fixedLight || disabled) return;
    apply(0, 0, null, null, 1, dur);
    const st = surfaceRef.current?.style;
    st?.setProperty("--lofi-tilt-glare", "0.45");
    st?.setProperty("--lofi-tilt-pop", "0");
  };
  useEffect(() => {
    if (!frame.current.active) restUnderLight("400ms");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightKey, disabled]);

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
        {motionState === "needs-permission" && (
          <button
            type="button"
            onClick={askPermission}
            className="absolute bottom-2 right-2 z-10 inline-flex h-10 items-center gap-1.5 rounded-full bg-black/70 px-3 text-xs font-semibold text-white outline-none backdrop-blur hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white"
            style={{ transform: "translateZ(60px)" }}
          >
            <Smartphone className="size-4" aria-hidden /> {motionLabel}
          </button>
        )}
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
