"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface AnimatedTab {
  /** Unique id, used for value / onChange. */
  id: string;
  label: string;
  /** Icon shown before the label. Hidden from screen readers. */
  icon?: ReactNode;
  /** Count or short text shown in a pill after the label. */
  badge?: number | string;
  /** Screen reader text for the badge, e.g. "3 unread". Defaults to the badge itself. */
  badgeLabel?: string;
  /** Panel content. */
  content: ReactNode;
  /** Shown but can't be selected; skipped by arrow keys. */
  disabled?: boolean;
}

export type AnimatedTabsVariant = "underline" | "pill";
export type AnimatedTabsOrientation = "horizontal" | "vertical";
export type AnimatedTabsActivation = "auto" | "manual";

export interface AnimatedTabsProps {
  tabs: AnimatedTab[];
  /** Selected tab id (controlled). */
  value?: string;
  /** Initially selected tab id (uncontrolled). Defaults to the first enabled tab. */
  defaultValue?: string;
  /** Called with the id of the newly selected tab. */
  onChange?: (id: string) => void;
  /** underline: a sliding bar. pill: a sliding raised chip on a track. */
  variant?: AnimatedTabsVariant;
  /** vertical puts the tabs in a column beside the panel (stacked above it in narrow containers). */
  orientation?: AnimatedTabsOrientation;
  /** auto: arrow keys select as they move. manual: arrows move focus, Enter/Space select. */
  activation?: AnimatedTabsActivation;
  /** Accessible name of the tab list. */
  label?: string;
  /** Horizontal tabs share the full width equally. */
  fullWidth?: boolean;
  /** Keep inactive panels in the DOM (hidden) so their state survives switching. */
  keepMounted?: boolean;
  /** Shown when tabs is empty. */
  emptyText?: string;
  /**
   * How far (0 to 1) the indicator stretches toward a tab the mouse is over, previewing the move.
   * 0 turns it off. Ignored with reduced motion.
   */
  magnet?: number;
  /**
   * Called when someone is about to open a tab: the mouse rests on it for intentDelay ms,
   * keyboard focus lands on it, or a finger touches it. Use it to prefetch the panel's data.
   */
  onIntent?: (id: string) => void;
  /** Hover time before onIntent fires, in ms. */
  intentDelay?: number;
  /** Fire onIntent only the first time for each tab. */
  intentOnce?: boolean;
  /**
   * Keeps the selected tab in the URL hash (#billing), so links open a tab and the back button
   * or a shared link restores it. Pass a string to prefix the hash, e.g. "settings-".
   */
  hashSync?: boolean | string;
  className?: string;
  listClassName?: string;
  panelClassName?: string;
}

const noop = () => () => {};
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHash = () => decodeURIComponent(window.location.hash.slice(1));

const STYLES = `
@media (prefers-reduced-motion: no-preference) {
  .lofi-animated-tabs-in-fade { animation: lofi-animated-tabs-fade 220ms ease-out both; }
  .lofi-animated-tabs-in-x-next { animation: lofi-animated-tabs-x-next 280ms cubic-bezier(.2,.8,.2,1) both; }
  .lofi-animated-tabs-in-x-prev { animation: lofi-animated-tabs-x-prev 280ms cubic-bezier(.2,.8,.2,1) both; }
  .lofi-animated-tabs-in-y-next { animation: lofi-animated-tabs-y-next 280ms cubic-bezier(.2,.8,.2,1) both; }
  .lofi-animated-tabs-in-y-prev { animation: lofi-animated-tabs-y-prev 280ms cubic-bezier(.2,.8,.2,1) both; }
}
@keyframes lofi-animated-tabs-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes lofi-animated-tabs-x-next { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
@keyframes lofi-animated-tabs-x-prev { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@keyframes lofi-animated-tabs-y-next { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes lofi-animated-tabs-y-prev { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
`;

const EASE = "cubic-bezier(0.3, 1, 0.4, 1)";
const LEAD_MS = 220;
const TRAIL_MS = 380;

export function AnimatedTabs({
  tabs,
  value,
  defaultValue,
  onChange,
  variant = "underline",
  orientation = "horizontal",
  activation = "auto",
  label = "Tabs",
  fullWidth = false,
  keepMounted = true,
  emptyText = "Nothing to show yet.",
  magnet = 0.3,
  onIntent,
  intentDelay = 80,
  intentOnce = true,
  hashSync = false,
  className,
  listClassName,
  panelClassName,
}: AnimatedTabsProps) {
  const base = useId();
  const vertical = orientation === "vertical";
  const pill = variant === "pill";
  const hashPrefix = typeof hashSync === "string" ? hashSync : "";

  // The URL hash, read on the client only so server and client markup match.
  const hash = useSyncExternalStore(hashSync !== false ? subscribeHash : noop, () => (hashSync !== false ? readHash() : ""), () => "");
  const hashTab =
    hashSync !== false && hash.startsWith(hashPrefix)
      ? tabs.find((t) => t.id === hash.slice(hashPrefix.length) && !t.disabled)?.id
      : undefined;

  const [inner, setInner] = useState(defaultValue);
  // A tab named in the URL wins over the remembered choice, so shared links open the right tab.
  const requested = value ?? hashTab ?? inner;
  const activeIndex = (() => {
    const i = tabs.findIndex((t) => t.id === requested && !t.disabled);
    return i >= 0 ? i : tabs.findIndex((t) => !t.disabled);
  })();
  const activeId = tabs[activeIndex]?.id;

  // Direction of the last change, for the panel slide. 0 on first render, so nothing animates on load.
  const [prevIndex, setPrevIndex] = useState(activeIndex);
  const [dir, setDir] = useState<-1 | 0 | 1>(0);
  if (prevIndex !== activeIndex) {
    setPrevIndex(activeIndex);
    setDir(activeIndex > prevIndex ? 1 : -1);
  }

  const [fades, setFades] = useState({ start: false, end: false });

  const listRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const lastRect = useRef<{ start: number; end: number } | null>(null);

  // The last id reported through onChange, so a hash we wrote ourselves isn't reported twice.
  const reported = useRef<string | undefined>(undefined);

  const select = useCallback(
    (id: string) => {
      if (value === undefined) setInner(id);
      reported.current = id;
      if (hashSync !== false) {
        // replaceState keeps the back button for real navigation; React re-reads the hash on the next render.
        window.history.replaceState(window.history.state, "", `#${encodeURIComponent(hashPrefix + id)}`);
      }
      if (id !== activeId) onChange?.(id);
    },
    [value, activeId, onChange, hashSync, hashPrefix],
  );

  // Tabs opened from the URL (on load, a link, back/forward) are reported like a click, once.
  useEffect(() => {
    if (!hashTab || hashTab === reported.current) return;
    reported.current = hashTab;
    onChange?.(hashTab);
  }, [hashTab, onChange]);

  /* ---------- Intent ---------- */

  const intentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intended = useRef(new Set<string>());
  const fireIntent = useCallback(
    (id: string) => {
      if (!onIntent || (intentOnce && intended.current.has(id))) return;
      intended.current.add(id);
      onIntent(id);
    },
    [onIntent, intentOnce],
  );
  const cancelIntent = () => {
    if (intentTimer.current) clearTimeout(intentTimer.current);
    intentTimer.current = null;
  };
  useEffect(() => cancelIntent, []);

  /* ---------- Indicator ---------- */

  // The tab under the mouse, which the indicator leans toward.
  const hoverId = useRef<string | null>(null);

  /** Moves the indicator onto the active tab. The leading edge travels faster than the trailing one. */
  const place = useCallback(
    (animate: boolean) => {
      const ind = indicatorRef.current;
      const list = listRef.current;
      const tab = activeId ? tabRefs.current.get(activeId) : undefined;
      if (!ind || !list) return;
      if (!tab) {
        ind.style.opacity = "0";
        lastRect.current = null;
        return;
      }
      const total = vertical ? list.clientHeight : list.clientWidth;
      const span = (el: HTMLElement) => {
        const s = vertical ? el.offsetTop : el.offsetLeft;
        return { start: s, end: total - s - (vertical ? el.offsetHeight : el.offsetWidth) };
      };
      let { start, end } = span(tab);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const hovered = hoverId.current && hoverId.current !== activeId ? tabRefs.current.get(hoverId.current) : undefined;
      if (hovered && magnet > 0 && !reduceMotion) {
        // Stretch only the far edge toward the hovered tab, like a magnet pulling it.
        const h = span(hovered);
        if (h.start > start) end = Math.round(end - (end - h.end) * magnet);
        else start = Math.round(start - (start - h.start) * magnet);
      }
      const [a, b] = vertical ? (["top", "bottom"] as const) : (["left", "right"] as const);

      const prev = lastRect.current;
      // Nothing moved: leave any running transition alone.
      if (prev && prev.start === start && prev.end === end) return;
      if (!animate || reduceMotion || !prev) {
        ind.style.transition = "none";
      } else {
        const forward = start > prev.start;
        const aMs = forward ? TRAIL_MS : LEAD_MS;
        const bMs = forward ? LEAD_MS : TRAIL_MS;
        ind.style.transition = `${a} ${aMs}ms ${EASE}, ${b} ${bMs}ms ${EASE}, opacity 150ms`;
      }
      ind.style[a] = `${start}px`;
      ind.style[b] = `${end}px`;
      ind.style.opacity = "1";
      lastRect.current = { start, end };
    },
    [activeId, vertical, magnet],
  );

  const updateFades = useCallback(() => {
    const s = scrollerRef.current;
    if (!s || vertical) return;
    const start = s.scrollLeft > 1;
    const end = s.scrollLeft + s.clientWidth < s.scrollWidth - 1;
    setFades((f) => (f.start === start && f.end === end ? f : { start, end }));
  }, [vertical]);

  // Indicator follows the active tab.
  useLayoutEffect(() => {
    place(true);
  }, [place, tabs, variant, fullWidth]);

  // Re-measure without animation when anything resizes (fonts, container, labels).
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      place(false);
      updateFades();
    });
    if (listRef.current) ro.observe(listRef.current);
    if (scrollerRef.current) ro.observe(scrollerRef.current);
    tabRefs.current.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [place, updateFades, tabs]);

  // Keep the active tab inside the scroll area.
  useEffect(() => {
    const s = scrollerRef.current;
    const tab = activeId ? tabRefs.current.get(activeId) : undefined;
    if (!s || !tab || vertical) return;
    const pad = 32;
    const left = tab.offsetLeft - pad;
    const right = tab.offsetLeft + tab.offsetWidth + pad;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (left < s.scrollLeft) s.scrollTo({ left, behavior });
    else if (right > s.scrollLeft + s.clientWidth) s.scrollTo({ left: right - s.clientWidth, behavior });
  }, [activeId, vertical]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextKey = vertical ? "ArrowDown" : "ArrowRight";
    const prevKey = vertical ? "ArrowUp" : "ArrowLeft";
    const enabled = tabs.map((t, i) => ({ t, i })).filter(({ t }) => !t.disabled);
    if (enabled.length === 0) return;
    const pos = enabled.findIndex(({ i }) => i === index);
    let target: number | undefined;
    if (e.key === nextKey) target = enabled[(pos + 1) % enabled.length].i;
    else if (e.key === prevKey) target = enabled[(pos - 1 + enabled.length) % enabled.length].i;
    else if (e.key === "Home") target = enabled[0].i;
    else if (e.key === "End") target = enabled[enabled.length - 1].i;
    if (target === undefined) return;
    e.preventDefault();
    const tab = tabs[target];
    tabRefs.current.get(tab.id)?.focus();
    if (activation === "auto") select(tab.id);
  };

  if (tabs.length === 0) {
    return (
      <p role="status" className={cn("rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400", className)}>
        {emptyText}
      </p>
    );
  }

  const mask = (() => {
    if (vertical || (!fades.start && !fades.end)) return undefined;
    const from = fades.start ? "transparent, #000 40px" : "#000";
    const to = fades.end ? "#000 calc(100% - 40px), transparent" : "#000";
    const img = `linear-gradient(to right, ${from}, ${to})`;
    return { maskImage: img, WebkitMaskImage: img } as CSSProperties;
  })();

  const panelAnim =
    dir === 0 ? "" : `lofi-animated-tabs-in-${vertical ? "y" : "x"}-${dir > 0 ? "next" : "prev"}`;

  const list = (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      onPointerLeave={() => {
        hoverId.current = null;
        place(true);
      }}
      className={cn(
        "relative flex",
        vertical ? "flex-col" : "w-max min-w-full",
        pill
          ? "gap-1 rounded-xl bg-zinc-100 p-1 ring-1 ring-inset ring-zinc-200/70 dark:bg-zinc-800/60 dark:ring-zinc-700/60"
          : vertical
            ? "gap-0.5 border-l border-zinc-200 pl-1 dark:border-zinc-800"
            : "gap-1 border-b border-zinc-200 dark:border-zinc-800",
        listClassName,
      )}
    >
      <span
        ref={indicatorRef}
        aria-hidden
        style={{ opacity: 0 }}
        className={cn(
          "pointer-events-none absolute",
          pill
            ? cn(
                "rounded-lg bg-white shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-950 dark:ring-white/10",
                vertical ? "inset-x-1" : "inset-y-1",
              )
            : cn(
                "rounded-full bg-indigo-600 dark:bg-indigo-400",
                vertical ? "-left-px w-0.5" : "-bottom-px h-0.5",
              ),
        )}
      />
      {tabs.map((t, i) => {
        const selected = t.id === activeId;
        return (
          <button
            key={t.id}
            ref={(el) => {
              if (el) tabRefs.current.set(t.id, el);
              else tabRefs.current.delete(t.id);
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${i}`}
            aria-selected={selected}
            aria-controls={`${base}-panel-${i}`}
            tabIndex={selected ? 0 : -1}
            disabled={t.disabled}
            onClick={() => select(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onFocus={() => !t.disabled && fireIntent(t.id)}
            onPointerEnter={(e) => {
              if (t.disabled) return;
              if (e.pointerType !== "mouse") return fireIntent(t.id);
              hoverId.current = t.id;
              place(true);
              cancelIntent();
              intentTimer.current = setTimeout(() => fireIntent(t.id), intentDelay);
            }}
            onPointerLeave={cancelIntent}
            className={cn(
              "group/tab relative z-10 inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium outline-none transition-colors duration-200 motion-reduce:transition-none",
              "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-45",
              vertical ? "w-full justify-start px-3" : cn("justify-center", fullWidth && "flex-1"),
              !vertical && (pill ? "h-10 px-3.5" : "h-11 px-3"),
              selected
                ? pill
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-indigo-700 dark:text-indigo-300"
                : "text-zinc-600 enabled:hover:text-zinc-900 dark:text-zinc-400 dark:enabled:hover:text-zinc-100",
              !selected && pill && "enabled:hover:bg-zinc-200/70 enabled:active:bg-zinc-200 dark:enabled:hover:bg-zinc-700/50 dark:enabled:active:bg-zinc-700",
              !selected && !pill && "enabled:hover:bg-zinc-100 enabled:active:bg-zinc-200/70 dark:enabled:hover:bg-zinc-800/60 dark:enabled:active:bg-zinc-800",
            )}
          >
            {t.icon && (
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-4 shrink-0 items-center justify-center transition-transform duration-200 motion-reduce:transition-none [&>svg]:size-4",
                  selected && "scale-110",
                )}
              >
                {t.icon}
              </span>
            )}
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge !== "" && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-colors motion-reduce:transition-none",
                  vertical && "ml-auto",
                  selected
                    ? "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
                    : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
                )}
              >
                <span className="sr-only">, </span>
                {t.badgeLabel ? (
                  <>
                    <span aria-hidden>{t.badge}</span>
                    <span className="sr-only">{t.badgeLabel}</span>
                  </>
                ) : (
                  t.badge
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn("@container w-full min-w-0", className)}>
      <style href="lofi-animated-tabs" precedence="default">
        {STYLES}
      </style>
      <div className={cn(vertical ? "flex flex-col gap-4 @xl:flex-row @xl:gap-6" : "flex flex-col gap-4")}>
        {vertical ? (
          <div className="shrink-0 @xl:w-56">{list}</div>
        ) : (
          <div
            ref={scrollerRef}
            onScroll={updateFades}
            style={mask}
            className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {list}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {tabs.map((t, i) => {
            const selected = t.id === activeId;
            if (!selected && !keepMounted) return null;
            return (
              <div
                key={t.id}
                role="tabpanel"
                id={`${base}-panel-${i}`}
                aria-labelledby={`${base}-tab-${i}`}
                hidden={!selected}
                tabIndex={0}
                className={cn(
                  "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
                  selected && panelAnim,
                  panelClassName,
                )}
              >
                {t.content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
