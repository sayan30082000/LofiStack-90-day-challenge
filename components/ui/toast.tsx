"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ========================================================== */

export type ToastType = "default" | "success" | "error" | "info" | "warning" | "loading";

export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface ToastAction {
  /** Button text, e.g. "Undo". */
  label: string;
  /** Runs on click, then the toast closes. Call event.preventDefault() to keep it open. */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

/** Options for toast(message, options) and its variants. */
export interface ToastOptions {
  /** Secondary line under the message. */
  description?: ReactNode;
  /** Optional action button, e.g. Undo. */
  action?: ToastAction;
  /** Milliseconds before it closes on its own. Infinity keeps it open. Defaults to the Toaster's duration. */
  duration?: number;
  /** Pass an existing id to update that toast in place instead of stacking a new one. */
  id?: string;
  /** Show the close button and allow swipe to dismiss. */
  dismissible?: boolean;
  /** Called when the toast is closed by the user (button, swipe, Escape) or by toast.dismiss(). */
  onDismiss?: (id: string) => void;
  /** Called when the toast closes because its timer ran out. */
  onAutoClose?: (id: string) => void;
}

/** Messages for toast.promise. success and error can be functions of the result. */
export interface ToastPromiseMessages<T> {
  loading: ReactNode;
  success: ReactNode | ((data: T) => ReactNode);
  error: ReactNode | ((error: unknown) => ReactNode);
}

/** Props of the <Toaster /> that renders every toast. */
export interface ToastProps {
  /** Corner or edge of the viewport the stack grows from. */
  position?: ToastPosition;
  /** Toasts visible at once. Older ones wait and move up as newer ones close. */
  max?: number;
  /** Default auto-dismiss time in ms. Loading toasts never auto-dismiss. */
  duration?: number;
  /** Always show the stack expanded instead of only on hover or focus. */
  expand?: boolean;
  /** Show a close button on every dismissible toast. */
  closeButton?: boolean;
  /** Show the countdown bar along the bottom edge. */
  showProgress?: boolean;
  /** Gap between expanded toasts, in px. */
  gap?: number;
  /** How much each collapsed toast peeks out behind the front one, in px. */
  peek?: number;
  /** Distance from the viewport edges, in px. */
  offset?: number;
  /** Toast width in px. Capped to the viewport on small screens. */
  width?: number;
  /** Horizontal drag distance in px that dismisses a toast. */
  swipeThreshold?: number;
  /** Key (KeyboardEvent.key) that moves focus to the newest toast. */
  hotkey?: string;
  /** Accessible name of the region. The hotkey is appended. */
  label?: string;
  /** Accessible name prefix of close buttons. The toast message is appended when it is text. */
  dismissLabel?: string;
  /** Text of the button that closes every toast, shown while the stack is expanded. Empty hides it. */
  clearAllLabel?: string;
  /** Replace the icon of any toast type. */
  icons?: Partial<Record<ToastType, ReactNode>>;
  /** Stacking order of the region. */
  zIndex?: number;
  /** Classes for every toast card. */
  toastClassName?: string;
}

interface ToastRecord extends Omit<ToastOptions, "id"> {
  id: string;
  type: ToastType;
  message: ReactNode;
  /** Bumped on every update so the countdown restarts. */
  version: number;
  removing: boolean;
  /** Direction of the swipe that closed it, for the exit animation. */
  swipe: number;
}

interface ToastState {
  toasts: ToastRecord[];
  announcement: { message: ReactNode; description?: ReactNode; assertive: boolean; key: number } | null;
}

/* ============================================================
 * Store (module singleton, read with useSyncExternalStore)
 * ========================================================== */

const EXIT_MS = 220;
const SERVER_STATE: ToastState = { toasts: [], announcement: null };
let store: ToastState = SERVER_STATE;
let counter = 0;
const listeners = new Set<() => void>();

function emit(next: ToastState) {
  store = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function show(type: ToastType, message: ReactNode, options: ToastOptions = {}): string {
  const { id: givenId, ...rest } = options;
  const id = givenId ?? `toast-${++counter}`;
  const existing = store.toasts.find((t) => t.id === id && !t.removing);
  const record: ToastRecord = {
    ...rest,
    id,
    type,
    message,
    version: (existing?.version ?? 0) + 1,
    removing: false,
    swipe: 0,
  };
  const toasts = existing
    ? store.toasts.map((t) => (t.id === id ? record : t))
    : [record, ...store.toasts.filter((t) => t.id !== id)];
  emit({
    toasts,
    announcement: { message, description: rest.description, assertive: type === "error", key: ++counter },
  });
  return id;
}

function close(id: string | undefined, reason: "dismiss" | "auto", swipe = 0) {
  const targets = store.toasts.filter((t) => !t.removing && (id === undefined || t.id === id));
  if (targets.length === 0) return;
  const ids = new Set(targets.map((t) => t.id));
  emit({
    ...store,
    toasts: store.toasts.map((t) => (ids.has(t.id) && !t.removing ? { ...t, removing: true, swipe } : t)),
  });
  for (const t of targets) {
    if (reason === "auto") t.onAutoClose?.(t.id);
    else t.onDismiss?.(t.id);
  }
  setTimeout(() => {
    emit({ ...store, toasts: store.toasts.filter((t) => !(ids.has(t.id) && t.removing)) });
  }, EXIT_MS);
}

function resolveMessage<A>(m: ReactNode | ((arg: A) => ReactNode), arg: A): ReactNode {
  return typeof m === "function" ? (m as (arg: A) => ReactNode)(arg) : m;
}

function baseToast(message: ReactNode, options?: ToastOptions) {
  return show("default", message, options);
}

/**
 * Show a toast from anywhere (event handlers, effects, async code). Needs one <Toaster /> mounted.
 * Returns the toast id.
 */
export const toast = Object.assign(baseToast, {
  success: (message: ReactNode, options?: ToastOptions) => show("success", message, options),
  error: (message: ReactNode, options?: ToastOptions) => show("error", message, options),
  info: (message: ReactNode, options?: ToastOptions) => show("info", message, options),
  warning: (message: ReactNode, options?: ToastOptions) => show("warning", message, options),
  /** A spinner toast that stays until you update it (same id) or dismiss it. */
  loading: (message: ReactNode, options?: ToastOptions) => show("loading", message, { duration: Infinity, ...options }),
  /** Loading toast that turns into a success or error toast when the promise settles. Returns the promise. */
  promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options: ToastOptions = {}) {
    const p = typeof promise === "function" ? promise() : promise;
    const id = show("loading", messages.loading, { ...options, duration: Infinity });
    p.then(
      (data) => show("success", resolveMessage(messages.success, data), { ...options, id }),
      (err: unknown) => show("error", resolveMessage(messages.error, err), { ...options, id }),
    );
    return p;
  },
  /** Close one toast by id, or all of them. */
  dismiss: (id?: string) => close(id, "dismiss"),
});

/* ============================================================
 * Small external stores
 * ========================================================== */

const subscribeVisibility = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
};

/** Re-check the inherited theme whenever any class changes (e.g. a preview's light/dark toggle). */
const subscribeClasses = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
};

/** The portal lives in <body>, so copy the light/dark override from wherever <Toaster /> is mounted. */
function themeOf(el: Element | null): "" | "light" | "dark" {
  if (!el) return "";
  if (el.closest(".light")) return "light";
  if (el.closest(".dark")) return "dark";
  return "";
}

/* ============================================================
 * Toaster
 * ========================================================== */

const TYPE_STYLES: Record<ToastType, { icon: string; bar: string; card?: string }> = {
  default: { icon: "", bar: "bg-zinc-400 dark:bg-zinc-500" },
  success: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  error: {
    icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    bar: "bg-rose-500",
    card: "border-rose-200 dark:border-rose-500/40",
  },
  info: { icon: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300", bar: "bg-indigo-500" },
  warning: { icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400", bar: "bg-amber-500" },
  loading: { icon: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300", bar: "" },
};

const DEFAULT_ICONS: Record<ToastType, ReactNode> = {
  default: null,
  success: <CircleCheck className="size-4" />,
  error: <CircleX className="size-4" />,
  info: <Info className="size-4" />,
  warning: <TriangleAlert className="size-4" />,
  loading: <LoaderCircle className="size-4 motion-safe:animate-spin" />,
};

const FALLBACK_HEIGHT = 64;

interface ToastLayout {
  offset: number;
  scale: number;
  height: number | undefined;
}

function computeLayout(
  visible: ToastRecord[],
  heights: Record<string, number>,
  expanded: boolean,
  gap: number,
  peek: number,
): { layout: ToastLayout[]; listHeight: number } {
  const frontHeight = visible[0] ? (heights[visible[0].id] ?? FALLBACK_HEIGHT) : 0;
  const layout: ToastLayout[] = [];
  let acc = 0;
  visible.forEach((t, i) => {
    const h = heights[t.id] ?? FALLBACK_HEIGHT;
    layout.push({
      offset: expanded ? acc : i * peek,
      scale: expanded ? 1 : Math.max(0.7, 1 - i * 0.05),
      height: heights[t.id] === undefined ? undefined : expanded || i === 0 ? h : frontHeight,
    });
    acc += h + gap;
  });
  const listHeight = visible.length === 0 ? 0 : expanded ? acc - gap : frontHeight + (visible.length - 1) * peek;
  return { layout, listHeight };
}

/**
 * Renders the toast stack in a portal. Mount it once, then call toast() anywhere.
 * Hover or focus expands the stack and pauses every countdown; F8 jumps to the newest toast.
 */
export function Toaster({
  position = "bottom-right",
  max = 3,
  duration = 5000,
  expand = false,
  closeButton = true,
  showProgress = true,
  gap = 10,
  peek = 14,
  offset = 16,
  width = 360,
  swipeThreshold = 64,
  hotkey = "F8",
  label = "Notifications",
  dismissLabel = "Dismiss notification",
  clearAllLabel = "Clear all",
  icons,
  zIndex = 100,
  toastClassName,
}: ToastProps) {
  const { toasts, announcement } = useSyncExternalStore(subscribe, () => store, () => SERVER_STATE);
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const theme = useSyncExternalStore(subscribeClasses, () => themeOf(anchor), () => "");
  const docHidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const listRef = useRef<HTMLOListElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const visible = toasts.slice(0, Math.max(1, max));
  const live = visible.filter((t) => !t.removing);
  const isBottom = position.startsWith("bottom");
  const expanded = live.length > 0 && (expand || hovered || focused);
  const paused = (live.length > 0 && (hovered || focused)) || docHidden;

  const onHeight = useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  // F8 (or the configured key) jumps to the newest toast and remembers where focus came from.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== hotkey) return;
      const first = listRef.current?.querySelector<HTMLElement>("[data-toast]:not([data-removing])");
      if (!first) return;
      e.preventDefault();
      if (!listRef.current?.contains(document.activeElement)) {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      first.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey]);

  /** After a focused toast closes, move focus to its neighbour, or back to where F8 was pressed. */
  const moveFocusFrom = useCallback((li: HTMLElement) => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-toast]:not([data-removing])") ?? []);
    const i = items.indexOf(li);
    const rest = items.filter((el) => el !== li);
    const next = rest[Math.min(Math.max(i, 0), rest.length - 1)];
    if (next) {
      next.focus();
      return;
    }
    const back = returnFocus.current;
    returnFocus.current = null;
    setFocused(false);
    if (back?.isConnected) back.focus();
  }, []);

  // Layout: collapsed = a deck peeking out behind the front toast; expanded = a real list.
  const { layout, listHeight } = computeLayout(visible, heights, expanded, gap, peek);

  const [vert, horiz] = position.split("-") as ["top" | "bottom", "left" | "center" | "right"];
  const regionStyle: CSSProperties = {
    [vert]: offset,
    zIndex,
    width: `min(${width}px, calc(100vw - ${offset * 2}px))`,
    ...(horiz === "left" ? { left: offset } : horiz === "right" ? { right: offset } : { left: "50%", transform: "translateX(-50%)" }),
  };

  const clearAll = clearAllLabel && expanded && live.length > 1 && (
    <div className={cn("flex", horiz === "left" ? "justify-start" : horiz === "right" ? "justify-end" : "justify-center")}>
      <button
        type="button"
        onClick={() => toast.dismiss()}
        className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white/95 px-3 text-xs font-medium text-zinc-700 shadow-sm outline-none backdrop-blur transition-colors motion-reduce:transition-none hover:bg-zinc-50 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        {clearAllLabel}
      </button>
    </div>
  );

  return (
    <>
      <span ref={setAnchor} hidden />
      <style href="lofi-toast" precedence="default">
        {`@keyframes lofi-toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}
      </style>
      {anchor &&
        createPortal(
          <section
            aria-label={`${label} (${hotkey})`}
            tabIndex={-1}
            style={regionStyle}
            className={cn(theme, "fixed flex flex-col gap-2 text-zinc-900 outline-none dark:text-zinc-100")}
            onPointerEnter={(e) => e.pointerType !== "touch" && setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(e: FocusEvent<HTMLElement>) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
            }}
          >
            {/* Announcements live here, so each toast is read once; errors interrupt. */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {announcement && !announcement.assertive && (
                <span key={announcement.key}>
                  {announcement.message}
                  {announcement.description ? <>. {announcement.description}</> : null}
                </span>
              )}
            </div>
            <div className="sr-only" aria-live="assertive" aria-atomic="true">
              {announcement?.assertive && (
                <span key={announcement.key}>
                  {announcement.message}
                  {announcement.description ? <>. {announcement.description}</> : null}
                </span>
              )}
            </div>

            {isBottom && clearAll}
            <ol
              ref={listRef}
              className="relative transition-[height] duration-300 motion-reduce:transition-none"
              style={{ height: listHeight }}
            >
              {visible.map((t, i) => (
                <ToastItem
                  key={t.id}
                  toast={t}
                  index={i}
                  count={visible.length}
                  layout={layout[i]}
                  expanded={expanded}
                  isBottom={isBottom}
                  paused={paused}
                  duration={t.duration ?? (t.type === "loading" ? Infinity : duration)}
                  closeButton={closeButton}
                  showProgress={showProgress}
                  dismissLabel={dismissLabel}
                  swipeThreshold={swipeThreshold}
                  icon={icons?.[t.type] ?? DEFAULT_ICONS[t.type]}
                  className={toastClassName}
                  onHeight={onHeight}
                  moveFocusFrom={moveFocusFrom}
                />
              ))}
            </ol>
            {!isBottom && clearAll}
          </section>,
          document.body,
        )}
    </>
  );
}

/* ============================================================
 * One toast
 * ========================================================== */

interface ToastItemProps {
  toast: ToastRecord;
  index: number;
  count: number;
  layout: ToastLayout;
  expanded: boolean;
  isBottom: boolean;
  paused: boolean;
  duration: number;
  closeButton: boolean;
  showProgress: boolean;
  dismissLabel: string;
  swipeThreshold: number;
  icon: ReactNode;
  className?: string;
  onHeight: (id: string, height: number) => void;
  moveFocusFrom: (li: HTMLElement) => void;
}

function ToastItem({
  toast: t,
  index,
  count,
  layout,
  expanded,
  isBottom,
  paused,
  duration,
  closeButton,
  showProgress,
  dismissLabel,
  swipeThreshold,
  icon,
  className,
  onHeight,
  moveFocusFrom,
}: ToastItemProps) {
  const uid = useId();
  const liRef = useRef<HTMLLIElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const dismissible = t.dismissible ?? true;
  const styles = TYPE_STYLES[t.type];
  const front = index === 0;

  // Enter on the next frame so the transition runs from the off-screen start position.
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  // Report the natural height (offsetHeight ignores the stack's scale transform).
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onHeight(t.id, el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [t.id, onHeight]);

  const dismiss = (swipe = 0) => {
    const li = liRef.current;
    const hadFocus = li?.contains(document.activeElement) ?? false;
    close(t.id, "dismiss", swipe);
    if (hadFocus && li) moveFocusFrom(li);
  };

  const onPointerDown = (e: PointerEvent<HTMLLIElement>) => {
    if (!dismissible || t.removing || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    drag.current = { x: e.clientX, t: e.timeStamp };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLLIElement>) => {
    if (drag.current) setDx(e.clientX - drag.current.x);
  };
  const endDrag = (e: PointerEvent<HTMLLIElement>, cancelled: boolean) => {
    if (!drag.current) return;
    const d = e.clientX - drag.current.x;
    const velocity = Math.abs(d) / Math.max(1, e.timeStamp - drag.current.t);
    drag.current = null;
    setDragging(false);
    if (!cancelled && (Math.abs(d) >= swipeThreshold || (velocity > 0.6 && Math.abs(d) > 24))) {
      dismiss(Math.sign(d));
    } else {
      setDx(0);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.key === "Escape" && dismissible) {
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    }
  };

  const y = isBottom ? -layout.offset : layout.offset;
  let transform: string;
  if (!mounted) transform = `translateY(${isBottom ? "100%" : "-100%"})`;
  else if (t.removing && t.swipe) transform = `translate(${t.swipe * 110}%, ${y}px)`;
  else if (t.removing) transform = `translateY(${y + (isBottom ? 10 : -10)}px) scale(${layout.scale * 0.96})`;
  else transform = `translate(${dx}px, ${y}px) scale(${layout.scale})`;

  const opacity = !mounted || t.removing ? 0 : dragging ? Math.max(0.35, 1 - Math.abs(dx) / 240) : 1;
  const finite = Number.isFinite(duration) && duration > 0;
  const runTimer = mounted && !paused && !dragging && !t.removing;
  const messageText = typeof t.message === "string" || typeof t.message === "number" ? String(t.message) : "";

  return (
    <li
      ref={liRef}
      data-toast=""
      data-removing={t.removing || undefined}
      tabIndex={0}
      aria-labelledby={`${uid}-title`}
      aria-describedby={t.description ? `${uid}-desc` : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      style={{ transform, opacity, height: layout.height, zIndex: count - index }}
      className={cn(
        "absolute inset-x-0 touch-pan-y overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg shadow-zinc-900/10 outline-none select-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-black/40",
        isBottom ? "bottom-0 origin-bottom" : "top-0 origin-top",
        dragging
          ? "cursor-grabbing transition-none"
          : "transition-[transform,opacity,height] duration-[400ms] ease-[cubic-bezier(0.21,1.02,0.73,1)] motion-reduce:transition-opacity motion-reduce:duration-150",
        dismissible && !dragging && "cursor-grab",
        styles.card,
        t.removing && "pointer-events-none",
        className,
      )}
    >
      <div
        ref={contentRef}
        className={cn(
          "flex items-start gap-3 p-3 pr-2 transition-opacity duration-200 motion-reduce:transition-none",
          !front && !expanded && "opacity-0",
        )}
      >
        {icon && (
          <span aria-hidden className={cn("mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full", styles.icon)}>
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1 py-1">
          <p id={`${uid}-title`} className="text-sm font-medium leading-5 break-words">
            {t.message}
          </p>
          {t.description && (
            <p id={`${uid}-desc`} className="mt-0.5 text-sm leading-5 break-words text-zinc-600 dark:text-zinc-400">
              {t.description}
            </p>
          )}
        </div>
        {t.action && (
          <button
            type="button"
            onClick={(e) => {
              t.action?.onClick(e);
              if (!e.defaultPrevented) dismiss();
            }}
            className="inline-flex h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 outline-none transition-colors motion-reduce:transition-none hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-500/15 dark:active:bg-indigo-500/25"
          >
            {t.action.label}
          </button>
        )}
        {dismissible && closeButton && (
          <button
            type="button"
            aria-label={messageText ? `${dismissLabel}: ${messageText}` : dismissLabel}
            onClick={() => dismiss()}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 outline-none transition-colors motion-reduce:transition-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {finite && (
        <div
          // Remounts on every update, which restarts the countdown.
          key={t.version}
          aria-hidden
          onAnimationEnd={() => close(t.id, "auto")}
          className={cn(
            "absolute inset-x-0 bottom-0 h-[3px] origin-left motion-reduce:invisible",
            styles.bar,
            (!showProgress || (!front && !expanded)) && "invisible",
          )}
          style={{
            animation: `lofi-toast-progress ${duration}ms linear forwards`,
            animationPlayState: runTimer ? "running" : "paused",
          }}
        />
      )}
    </li>
  );
}
