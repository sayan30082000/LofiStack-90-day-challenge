"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { CalendarPlus, Check, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Code 39 barcode (pure) ---------- */

/*
  Code 39: every character is 5 bars and 4 spaces, 3 of them wide. The table is built from its
  structure instead of typed out: 10 bar patterns (2 wide of 5) × 4 positions of the one wide space.
*/
const BAR_PATTERNS = ["10001", "01001", "11000", "00101", "10100", "01100", "00011", "10010", "01010", "00110"];
const GROUPS: [string, number][] = [
  ["1234567890", 1],
  ["ABCDEFGHIJ", 2],
  ["KLMNOPQRST", 3],
  ["UVWXYZ-. *", 0],
];
const CODE39 = new Map<string, string>();
for (const [chars, wideSpace] of GROUPS) {
  [...chars].forEach((ch, i) => {
    const bars = BAR_PATTERNS[i];
    let p = "";
    for (let k = 0; k < 5; k++) {
      p += bars[k] === "1" ? "w" : "n";
      if (k < 4) p += k === wideSpace ? "w" : "n";
    }
    CODE39.set(ch, p);
  });
}

/** Characters Code 39 can carry (besides the * start/stop). */
export const CODE39_CHARS = /^[0-9A-Z\-. ]*$/;

/**
 * Bar and space widths (in narrow units) for a Code 39 barcode of `value`, including the
 * * start/stop characters and the narrow gaps between characters. Throws on unsupported characters.
 */
export function code39(value: string, wide = 3): number[] {
  const text = value.toUpperCase();
  if (!CODE39_CHARS.test(text)) throw new Error(`Code 39 can't encode "${value}". Use 0-9, A-Z, space, - and .`);
  const out: number[] = [];
  [..."*" + text + "*"].forEach((ch, i, all) => {
    for (const e of CODE39.get(ch)!) out.push(e === "w" ? wide : 1);
    if (i < all.length - 1) out.push(1); // gap between characters
  });
  return out;
}

export interface TicketBarcodeProps {
  /** Text to encode: 0-9, A-Z, space, - and . */
  value: string;
  /** Bar height in px. */
  height?: number;
  /** Show the value under the bars. */
  showValue?: boolean;
  className?: string;
}

/** A real, scannable Code 39 barcode drawn as SVG. */
export function TicketBarcode({ value, height = 48, showValue = true, className }: TicketBarcodeProps) {
  const widths = code39(value);
  const quiet = 10;
  const total = widths.reduce((a, b) => a + b, 0) + quiet * 2;
  let x = quiet;
  const bars: ReactNode[] = [];
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push(<rect key={i} x={x} y={0} width={w} height={height} />);
    x += w;
  });
  return (
    <figure className={cn("m-0 flex flex-col items-center gap-1", className)}>
      {/* A scanner needs dark bars on a light ground, in both themes. */}
      <svg
        role="img"
        aria-label={`Barcode ${value}`}
        viewBox={`0 0 ${total} ${height}`}
        preserveAspectRatio="none"
        className="h-12 w-full max-w-[16rem] rounded-sm bg-white fill-black"
        style={{ height }}
      >
        {bars}
      </svg>
      {showValue && (
        <figcaption aria-hidden className="font-mono text-xs tracking-[0.3em]">
          {value.toUpperCase()}
        </figcaption>
      )}
    </figure>
  );
}

/* ---------- Calendar (pure) ---------- */

export interface TicketEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  /** Stable id so re-adding updates the same calendar entry. */
  uid?: string;
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** An iCalendar (.ics) file for the event, accepted by Google, Apple and Outlook calendars. */
export function ticketToIcs(event: TicketEvent, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LofiStack//Ticket Card//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.uid ?? `${icsDate(event.start)}-${event.title.replace(/\W+/g, "-").toLowerCase()}@lofistack`}`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(event.start)}`,
    `DTEND:${icsDate(event.end)}`,
    `SUMMARY:${icsText(event.title)}`,
    ...(event.location ? [`LOCATION:${icsText(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${icsText(event.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

export interface AddToCalendarProps {
  event: TicketEvent;
  label?: string;
  /** Downloaded file name. */
  fileName?: string;
  className?: string;
}

/** Downloads the event as an .ics file. */
export function AddToCalendar({ event, label = "Add to calendar", fileName, className }: AddToCalendarProps) {
  const download = () => {
    const blob = new Blob([ticketToIcs(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? `${event.title.replace(/[^\w-]+/g, "-").toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <button
      type="button"
      onClick={download}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-lg border border-current/25 px-3 text-sm font-medium outline-none transition-colors hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none",
        className,
      )}
    >
      <CalendarPlus className="size-4" aria-hidden /> {label}
    </button>
  );
}

/* ---------- Ticket ---------- */

export type TicketOrientation = "auto" | "horizontal" | "vertical";

export interface TicketCardProps {
  /** Accessible name of the ticket, e.g. "Concert ticket, Lofi Nights Live". */
  label: string;
  /** The main part of the ticket. */
  main: ReactNode;
  /** The part that tears off. */
  stub: ReactNode;
  /** auto: stub on the right, or at the bottom when the ticket is narrower than 520px. */
  orientation?: TicketOrientation;
  /** Width of the stub when horizontal (any CSS length). */
  stubSize?: string;
  /** Whether the stub is torn off (controlled). */
  torn?: boolean;
  /** Initial state (uncontrolled). */
  defaultTorn?: boolean;
  /** Called once the stub comes off, by dragging or with the tear button. */
  onTear?: () => void;
  /** Share of the stub's size to drag before letting go tears it (0 to 1). */
  tearThreshold?: number;
  /** A used or expired ticket: stamped, and the stub can't be torn. */
  used?: boolean;
  usedLabel?: string;
  /** Shown where the stub was once it's torn off. */
  tornContent?: ReactNode;
  /** Accessible name of the tear button. */
  tearLabel?: string;
  /** Announced when the stub comes off. */
  tornText?: string;
  /** Notch radius in px. */
  notch?: number;
  className?: string;
  /** Classes for the paper (background, text colour) of both parts. */
  paperClassName?: string;
  mainClassName?: string;
  stubClassName?: string;
}

const INTERACTIVE = 'a[href],button,input,select,textarea,label,[role="button"],[tabindex]:not([tabindex="-1"])';
const FLY_MS = 520;

/**
 * A ticket whose stub tears off along a perforated edge. Drag the stub away (or use the
 * scissors button) and it rips free; let go early and it snaps back.
 */
export function TicketCard({
  label,
  main,
  stub,
  orientation = "auto",
  stubSize = "34%",
  torn: tornProp,
  defaultTorn = false,
  onTear,
  tearThreshold = 0.5,
  used = false,
  usedLabel = "Used",
  tornContent,
  tearLabel = "Tear off stub",
  tornText = "Stub torn off",
  notch = 12,
  className,
  paperClassName = "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
  mainClassName,
  stubClassName,
}: TicketCardProps) {
  const liveId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const stubRef = useRef<HTMLDivElement>(null);
  const [innerTorn, setInnerTorn] = useState(defaultTorn);
  const torn = tornProp ?? innerTorn;
  const [narrow, setNarrow] = useState(false);
  const vertical = orientation === "vertical" || (orientation === "auto" && narrow);
  const [drag, setDrag] = useState<{ d: number; progress: number } | null>(null);
  const [flying, setFlying] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const start = useRef<{ x: number; y: number; size: number; id: number } | null>(null);

  // Stub below the main part when the ticket is narrow.
  useEffect(() => {
    if (orientation !== "auto" || !rootRef.current) return;
    const el = rootRef.current;
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < 520));
    ro.observe(el);
    return () => ro.disconnect();
  }, [orientation]);

  const finish = () => {
    setFlying(false);
    setDrag(null);
    if (tornProp === undefined) setInnerTorn(true);
    onTear?.();
    setAnnouncement(tornText);
    try {
      navigator.vibrate?.(15);
    } catch {
      // Vibration is optional.
    }
  };

  const tear = () => {
    if (used || torn || flying) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    setFlying(true);
    setTimeout(finish, FLY_MS);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (used || torn || flying || e.button !== 0) return;
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    const box = e.currentTarget.getBoundingClientRect();
    start.current = { x: e.clientX, y: e.clientY, size: vertical ? box.height : box.width, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ d: 0, progress: 0 });
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const d = Math.max(0, vertical ? e.clientY - s.y : e.clientX - s.x);
    setDrag({ d, progress: Math.min(1, d / (s.size * 0.8 || 1)) });
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    start.current = null;
    if ((drag?.progress ?? 0) >= tearThreshold) tear();
    else setDrag(null);
  };

  // Where the stub is drawn: following the finger, flying off, or resting.
  const p = drag?.progress ?? 0;
  const stubStyle: CSSProperties = flying
    ? {
        transform: vertical ? "translateY(120%) rotate(-14deg)" : "translateX(120%) translateY(30%) rotate(24deg)",
        opacity: 0,
        transition: `transform ${FLY_MS}ms cubic-bezier(.4,0,.6,1), opacity ${FLY_MS}ms ease-in`,
      }
    : drag
      ? {
          transform: vertical
            ? `translateY(${drag.d * 0.45}px) rotate(${-p * 7}deg)`
            : `translateX(${drag.d * 0.45}px) rotate(${p * 9}deg)`,
          transition: "none",
        }
      : { transform: "none", transition: "transform 380ms cubic-bezier(.3,1.4,.5,1)" };

  // Notches where the perforation meets the edges, cut with masks so any page background shows through.
  const r = `${notch}px`;
  const cut = (at: string) => `radial-gradient(circle ${r} at ${at}, #0000 calc(100% - 0.5px), #000 100%)`;
  const mainMask = vertical
    ? `${cut("0 100%")} left / 51% 100% no-repeat, ${cut("100% 100%")} right / 51% 100% no-repeat`
    : `${cut("100% 0")} top / 100% 51% no-repeat, ${cut("100% 100%")} bottom / 100% 51% no-repeat`;
  const stubMask = vertical
    ? `${cut("0 0")} left / 51% 100% no-repeat, ${cut("100% 0")} right / 51% 100% no-repeat`
    : `${cut("0 0")} top / 100% 51% no-repeat, ${cut("0 100%")} bottom / 100% 51% no-repeat`;

  return (
    <article
      ref={rootRef}
      aria-label={label}
      aria-describedby={liveId}
      className={cn(
        "relative flex w-full [filter:drop-shadow(0_1px_1px_rgb(0_0_0/0.08))_drop-shadow(0_8px_20px_rgb(0_0_0/0.10))] dark:[filter:drop-shadow(0_8px_20px_rgb(0_0_0/0.5))]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      <div
        className={cn("relative min-w-0 flex-1 rounded-2xl p-5 sm:p-6", paperClassName, mainClassName)}
        style={{ mask: mainMask, WebkitMask: mainMask }}
      >
        {main}
        {used && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 -rotate-12 rounded-lg border-4 border-rose-700 px-3 py-1 text-2xl font-black uppercase tracking-widest text-rose-700 opacity-90 dark:border-rose-400 dark:text-rose-400"
          >
            {usedLabel}
          </span>
        )}
      </div>

      <div className={cn("relative shrink-0", vertical ? "w-full" : "")} style={vertical ? undefined : { width: stubSize }}>
        {torn ? (
          <div
            className={cn(
              "flex h-full min-h-24 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
              vertical ? "rounded-t-none border-t-0" : "rounded-l-none border-l-0",
            )}
          >
            {tornContent ?? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Check className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden /> {tornText}
              </span>
            )}
          </div>
        ) : (
          <div
            ref={stubRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              start.current = null;
              setDrag(null);
            }}
            data-tearing={drag ? Math.round(p * 100) : undefined}
            className={cn(
              "relative h-full touch-none select-none rounded-2xl p-5",
              vertical ? "origin-top-right" : "origin-bottom-left",
              !used && "cursor-grab active:cursor-grabbing",
              used && "opacity-60",
              paperClassName,
              stubClassName,
            )}
            style={{ ...stubStyle, mask: stubMask, WebkitMask: stubMask }}
          >
            {/* The perforation. */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute border-zinc-300 dark:border-zinc-600",
                vertical ? "inset-x-4 top-0 border-t-2 border-dashed" : "inset-y-4 left-0 border-l-2 border-dashed",
              )}
            />
            {stub}
            <button
              type="button"
              onClick={tear}
              disabled={used || flying}
              aria-label={tearLabel}
              title={tearLabel}
              className="absolute right-2 top-2 inline-flex size-10 items-center justify-center rounded-full text-current/70 outline-none transition-colors hover:bg-current/10 hover:text-current focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
            >
              <Scissors className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      <p id={liveId} aria-live="polite" className="sr-only">
        {announcement || (used ? usedLabel : "")}
      </p>
    </article>
  );
}
