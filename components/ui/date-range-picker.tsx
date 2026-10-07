"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Native date helpers (local time, day precision) ---------- */

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
/** Adds months, clamping the day so Jan 31 + 1 month is Feb 28/29. */
export function addMonths(d: Date, n: number) {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), endOfMonth(first).getDate()));
}
/** Start of the week containing d. weekStartsOn: 0 Sunday … 6 Saturday. */
export const startOfWeek = (d: Date, weekStartsOn = 0) => addDays(d, -((d.getDay() - weekStartsOn + 7) % 7));
/** Whole days from a to b, immune to DST shifts. */
export const differenceInDays = (a: Date, b: Date) => (dayNumber(b) - dayNumber(a)) | 0;
const dayNumber = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5;
const cmp = (a: Date, b: Date) => dayNumber(a) - dayNumber(b);
const same = (a: Date | null | undefined, b: Date | null | undefined) => !!a && !!b && cmp(a, b) === 0;
const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/* ---------- Types ---------- */

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePreset {
  id: string;
  label: string;
  /** Builds the range from today. It is clamped to minDate / maxDate. */
  range: (today: Date) => { from: Date; to: Date };
}

/** Visible and spoken text. */
export interface DateRangePickerLabels {
  placeholder: string;
  /** Word between the two dates, as in "Mar 4 to Mar 18, 2026". */
  to: string;
  apply: string;
  cancel: string;
  clear: string;
  custom: string;
  presets: string;
  dialog: string;
  previousMonth: string;
  nextMonth: string;
  /** Appended to today's spoken label. */
  today: string;
  /** Appended to the spoken label of disabled days. */
  unavailable: string;
  pickStart: string;
  pickEnd: string;
  startSelected: (date: string) => string;
  rangeSelected: (range: string, summary: string) => string;
  /** Spoken when a range would cross a disabled day. */
  crossesDisabled: string;
  /** Spoken when the range is shorter than minSpan. */
  tooShort: (minSpan: number) => string;
}

export interface DateRangePickerProps {
  /** Selected range (controlled). */
  value?: DateRange | null;
  /** Initial range (uncontrolled). */
  defaultValue?: DateRange | null;
  /** Called on Apply and on Clear. */
  onChange?: (range: DateRange) => void;
  /** Quick ranges in the sidebar. false hides the sidebar. A "Custom" entry is always added. */
  presets?: DateRangePreset[] | false;
  minDate?: Date;
  maxDate?: Date;
  /** Marks single days unavailable, e.g. sold-out nights. */
  isDateDisabled?: (date: Date) => boolean;
  /** Whether a range may span disabled days. */
  allowDisabledInRange?: boolean;
  /** Minimum days between start and end (1 = at least one night). */
  minSpan?: number;
  /** Months side by side on wide screens. Always 1 below singleMonthBelow. */
  numberOfMonths?: number;
  /** Viewport width in px under which one month is shown. */
  singleMonthBelow?: number;
  /** 0 Sunday … 6 Saturday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** BCP 47 locale for month names, weekdays and the field text. */
  locale?: string;
  /** Reference date for presets and the today marker. Defaults to the client's date after mount. */
  today?: Date;
  /** Visible field label. */
  label?: string;
  /** Helper text under the field. */
  description?: string;
  /** Error text under the field; also turns the border red. */
  error?: string;
  disabled?: boolean;
  /** Shows a clear button in the field when a range is set. */
  clearable?: boolean;
  /** Popover alignment to the field. It shifts to stay on screen either way. */
  align?: "start" | "end";
  /** Field text for a complete range. Defaults to "Mar 4 to Mar 18, 2026". */
  formatValue?: (range: { from: Date; to: Date }) => string;
  /** Footer summary of the draft range. Defaults to "15 days". */
  formatSummary?: (range: { from: Date; to: Date }) => string;
  labels?: Partial<DateRangePickerLabels>;
  /** Classes for the wrapper (set the field width here). */
  className?: string;
}

const DEFAULT_LABELS: DateRangePickerLabels = {
  placeholder: "Select dates",
  to: "to",
  apply: "Apply",
  cancel: "Cancel",
  clear: "Clear dates",
  custom: "Custom",
  presets: "Quick ranges",
  dialog: "Choose a date range",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  today: "today",
  unavailable: "unavailable",
  pickStart: "Select a start date",
  pickEnd: "Select an end date",
  startSelected: (d) => `Start date ${d}. Now select an end date.`,
  rangeSelected: (r, s) => `${r} selected, ${s}. Press Apply to confirm.`,
  crossesDisabled: "That range includes unavailable dates. Started a new range instead.",
  tooShort: (n) => `Choose an end date at least ${n} ${n === 1 ? "day" : "days"} after the start.`,
};

export const DEFAULT_PRESETS: DateRangePreset[] = [
  { id: "today", label: "Today", range: (t) => ({ from: t, to: t }) },
  { id: "last-7", label: "Last 7 days", range: (t) => ({ from: addDays(t, -6), to: t }) },
  { id: "last-30", label: "Last 30 days", range: (t) => ({ from: addDays(t, -29), to: t }) },
  { id: "this-month", label: "This month", range: (t) => ({ from: startOfMonth(t), to: endOfMonth(t) }) },
  {
    id: "last-month",
    label: "Last month",
    range: (t) => {
      const prev = addMonths(startOfMonth(t), -1);
      return { from: prev, to: endOfMonth(prev) };
    },
  },
];

const EMPTY: DateRange = { from: null, to: null };

const KEYFRAMES = `
@keyframes lofi-date-range-picker-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
.lofi-date-range-picker-pop { animation: lofi-date-range-picker-in 140ms ease-out; }
@media (prefers-reduced-motion: reduce) { .lofi-date-range-picker-pop { animation: none; } }
`;

/* ---------- Client-only values without hydration mismatches ---------- */

const noopSubscribe = () => () => {};
const getTodayKey = () => toKey(new Date());
const getNoKey = () => null;

function useWideViewport(minWidth: number) {
  const query = `(min-width: ${minWidth}px)`;
  const subscribe = useCallback(
    (cb: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => true,
  );
}

/**
 * Date range field with a two-month calendar popover, presets, hover preview and Apply / Cancel.
 * Uses only native Date and Intl.
 */
export function DateRangePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  presets = DEFAULT_PRESETS,
  minDate: minProp,
  maxDate: maxProp,
  isDateDisabled,
  allowDisabledInRange = false,
  minSpan = 0,
  numberOfMonths = 2,
  singleMonthBelow = 800,
  weekStartsOn = 0,
  locale = "en-US",
  today: todayProp,
  label,
  description,
  error,
  disabled = false,
  clearable = true,
  align = "start",
  formatValue,
  formatSummary,
  labels: labelsProp,
  className,
}: DateRangePickerProps) {
  const L = { ...DEFAULT_LABELS, ...labelsProp };
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const helpId = `${id}-help`;
  const dialogId = `${id}-dialog`;

  const [inner, setInner] = useState<DateRange>(defaultValue ?? EMPTY);
  const value = valueProp === undefined ? inner : (valueProp ?? EMPTY);

  const clientTodayKey = useSyncExternalStore(noopSubscribe, getTodayKey, getNoKey);
  const todayKey = todayProp ? toKey(todayProp) : clientTodayKey;
  const today = useMemo(() => (todayKey ? fromKey(todayKey) : null), [todayKey]);
  const minKey = minProp ? toKey(minProp) : null;
  const maxKey = maxProp ? toKey(maxProp) : null;
  const minDate = useMemo(() => (minKey ? fromKey(minKey) : null), [minKey]);
  const maxDate = useMemo(() => (maxKey ? fromKey(maxKey) : null), [maxKey]);

  const wide = useWideViewport(singleMonthBelow);
  const months = Math.max(1, wide ? numberOfMonths : 1);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(EMPTY);
  const [hover, setHover] = useState<Date | null>(null);
  const [view, setView] = useState<Date>(() => startOfMonth(value.from ?? todayProp ?? new Date(2000, 0, 1)));
  const [focused, setFocused] = useState<Date>(() => value.from ?? todayProp ?? new Date(2000, 0, 1));
  const [announce, setAnnounce] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const focusPending = useRef(false);

  /* ---------- Formatting ---------- */

  const fmt = useMemo(
    () => ({
      long: new Intl.DateTimeFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      month: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
      short: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }),
      shortY: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }),
      weekNarrow: new Intl.DateTimeFormat(locale, { weekday: "narrow" }),
      weekLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
    }),
    [locale],
  );

  const formatRange = useCallback(
    (from: Date, to: Date) => {
      if (formatValue) return formatValue({ from, to });
      if (same(from, to)) return fmt.shortY.format(from);
      const head = from.getFullYear() === to.getFullYear() ? fmt.short.format(from) : fmt.shortY.format(from);
      return `${head} ${L.to} ${fmt.shortY.format(to)}`;
    },
    [formatValue, fmt, L.to],
  );

  const summarize = useCallback(
    (from: Date, to: Date) => {
      if (formatSummary) return formatSummary({ from, to });
      const n = differenceInDays(from, to) + 1;
      return `${n} ${n === 1 ? "day" : "days"}`;
    },
    [formatSummary],
  );

  // Sunday-based reference week (Jan 4 2026 is a Sunday) for weekday names.
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(2026, 0, 4 + ((i + weekStartsOn) % 7));
        return { narrow: fmt.weekNarrow.format(d), long: fmt.weekLong.format(d) };
      }),
    [fmt, weekStartsOn],
  );

  /* ---------- Rules ---------- */

  const outOfBounds = useCallback(
    (d: Date) => (minDate ? cmp(d, minDate) < 0 : false) || (maxDate ? cmp(d, maxDate) > 0 : false),
    [minDate, maxDate],
  );
  const isDisabled = useCallback((d: Date) => outOfBounds(d) || !!isDateDisabled?.(d), [outOfBounds, isDateDisabled]);
  const crossesDisabled = useCallback(
    (from: Date, to: Date) => {
      if (allowDisabledInRange) return false;
      const n = Math.min(differenceInDays(from, to), 3700);
      for (let i = 1; i < n; i++) if (isDisabled(addDays(from, i))) return true;
      return false;
    },
    [allowDisabledInRange, isDisabled],
  );
  const clampDay = useCallback(
    (d: Date) => (minDate && cmp(d, minDate) < 0 ? minDate : maxDate && cmp(d, maxDate) > 0 ? maxDate : d),
    [minDate, maxDate],
  );

  const presetList = useMemo(() => {
    if (presets === false) return [];
    return presets.map((p) => {
      if (!today) return { preset: p, range: null };
      const r = p.range(today);
      const from = clampDay(startOfDay(r.from));
      const to = clampDay(startOfDay(r.to));
      const ok = cmp(from, to) <= 0 && !isDisabled(from) && !isDisabled(to) && !crossesDisabled(from, to);
      return { preset: p, range: ok ? { from, to } : null };
    });
  }, [presets, today, clampDay, isDisabled, crossesDisabled]);

  const activePresetId =
    draft.from && draft.to
      ? (presetList.find((p) => p.range && same(p.range.from, draft.from) && same(p.range.to, draft.to))?.preset.id ?? null)
      : null;

  /* ---------- Open / close ---------- */

  const showMonthOf = useCallback(
    (d: Date, anchorEnd = false) => {
      setView(startOfMonth(anchorEnd ? addMonths(d, -(months - 1)) : d));
    },
    [months],
  );

  const openPicker = () => {
    if (disabled) return;
    const start = value.from ?? clampDay(today ?? minDate ?? new Date(2000, 0, 1));
    setDraft(value);
    setHover(null);
    setView(startOfMonth(start));
    setFocused(start);
    setAnnounce("");
    focusPending.current = true;
    setOpen(true);
  };

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setHover(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const apply = () => {
    if (!draft.from || !draft.to) return;
    if (valueProp === undefined) setInner(draft);
    onChange?.(draft);
    setAnnounce(formatRange(draft.from, draft.to));
    close(true);
  };

  const clear = () => {
    if (valueProp === undefined) setInner(EMPTY);
    onChange?.(EMPTY);
    triggerRef.current?.focus();
  };

  // Click outside cancels.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  // Keep the popover inside the viewport horizontally.
  useLayoutEffect(() => {
    const el = popRef.current;
    if (!open || !el) return;
    const place = () => {
      el.style.translate = "";
      const r = el.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const gutter = 12;
      if (r.right > vw - gutter) el.style.translate = `${-Math.min(r.right - (vw - gutter), r.left - gutter)}px 0`;
      else if (r.left < gutter) el.style.translate = `${gutter - r.left}px 0`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, months, align]);

  // Move DOM focus to the focused day after keyboard navigation or opening.
  useEffect(() => {
    if (!open || !focusPending.current) return;
    focusPending.current = false;
    popRef.current?.querySelector<HTMLButtonElement>(`[data-date="${toKey(focused)}"]`)?.focus();
  }, [open, focused, view]);

  /* ---------- Selection ---------- */

  const choosePreset = (range: { from: Date; to: Date }) => {
    setDraft(range);
    setHover(null);
    showMonthOf(range.to, true);
    setFocused(range.to);
    setAnnounce(L.rangeSelected(formatRange(range.from, range.to), summarize(range.from, range.to)));
  };

  const pick = (d: Date) => {
    if (isDisabled(d)) return;
    const startNew = () => {
      setDraft({ from: d, to: null });
      setAnnounce(L.startSelected(fmt.long.format(d)));
    };
    if (!draft.from || draft.to || cmp(d, draft.from) < 0) return startNew();
    if (differenceInDays(draft.from, d) < minSpan) {
      setAnnounce(L.tooShort(minSpan));
      return;
    }
    if (crossesDisabled(draft.from, d)) {
      startNew();
      setAnnounce(L.crossesDisabled);
      return;
    }
    setDraft({ from: draft.from, to: d });
    setHover(null);
    setAnnounce(L.rangeSelected(formatRange(draft.from, d), summarize(draft.from, d)));
  };

  const moveFocus = (next: Date) => {
    const d = clampDay(next);
    setFocused(d);
    const first = monthIndex(view);
    const m = monthIndex(d);
    if (m < first) setView(startOfMonth(d));
    else if (m > first + months - 1) setView(startOfMonth(addMonths(d, -(months - 1))));
    if (draft.from && !draft.to) setHover(d);
    focusPending.current = true;
  };

  const onDayKeyDown = (e: KeyboardEvent<HTMLButtonElement>, d: Date) => {
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft":
        next = addDays(d, -1);
        break;
      case "ArrowRight":
        next = addDays(d, 1);
        break;
      case "ArrowUp":
        next = addDays(d, -7);
        break;
      case "ArrowDown":
        next = addDays(d, 7);
        break;
      case "Home":
        next = startOfWeek(d, weekStartsOn);
        break;
      case "End":
        next = addDays(startOfWeek(d, weekStartsOn), 6);
        break;
      case "PageUp":
        next = addMonths(d, e.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        next = addMonths(d, e.shiftKey ? 12 : 1);
        break;
    }
    if (!next) return;
    e.preventDefault();
    moveFocus(next);
  };

  const stepMonth = (delta: number) => {
    const nextView = addMonths(view, delta);
    setView(nextView);
    // Shift the roving focus too, so a tabbable day stays inside the visible months.
    setFocused(clampDay(addMonths(focused, delta)));
  };

  const canPrev = !minDate || monthIndex(view) > monthIndex(minDate);
  const canNext = !maxDate || monthIndex(view) + months - 1 < monthIndex(maxDate);

  /* ---------- Derived range for painting ---------- */

  const picking = !!draft.from && !draft.to;
  const previewEnd =
    picking && hover && cmp(hover, draft.from!) >= 0 && differenceInDays(draft.from!, hover) >= minSpan && !isDisabled(hover) && !crossesDisabled(draft.from!, hover)
      ? hover
      : null;
  const rangeStart = draft.from;
  const rangeEnd = draft.to ?? previewEnd;

  /* ---------- Render ---------- */

  const hasValue = !!value.from && !!value.to;
  const display = hasValue ? formatRange(value.from!, value.to!) : value.from ? `${fmt.shortY.format(value.from)} ${L.to} …` : L.placeholder;

  const onRootKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    }
  };

  const onRootBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (open && e.relatedTarget && !rootRef.current?.contains(e.relatedTarget as Node)) close(false);
  };

  const renderMonth = (offset: number) => {
    const month = addMonths(view, offset);
    const titleId = `${id}-m${offset}`;
    const gridStart = startOfWeek(startOfMonth(month), weekStartsOn);
    const lastOfMonth = endOfMonth(month);
    const rows = Array.from({ length: 6 }, (_, r) => Array.from({ length: 7 }, (_, c) => addDays(gridStart, r * 7 + c)));
    const isFirst = offset === 0;
    const isLast = offset === months - 1;

    return (
      <div key={offset} className="w-[280px] shrink-0">
        <div className="mb-2 flex h-10 items-center justify-between">
          {isFirst ? (
            <NavButton label={L.previousMonth} disabled={!canPrev} onClick={() => stepMonth(-1)}>
              <ChevronLeft className="size-4" aria-hidden />
            </NavButton>
          ) : (
            <span className="size-10" aria-hidden />
          )}
          <h2 id={titleId} aria-live={isFirst ? "polite" : undefined} className="text-sm font-semibold">
            {fmt.month.format(month)}
          </h2>
          {isLast ? (
            <NavButton label={L.nextMonth} disabled={!canNext} onClick={() => stepMonth(1)}>
              <ChevronRight className="size-4" aria-hidden />
            </NavButton>
          ) : (
            <span className="size-10" aria-hidden />
          )}
        </div>
        <table role="grid" aria-labelledby={titleId} className="w-full border-collapse" onPointerLeave={() => setHover(null)}>
          <thead>
            <tr>
              {weekdays.map((w) => (
                <th key={w.long} scope="col" className="h-8 p-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <span aria-hidden>{w.narrow}</span>
                  <span className="sr-only">{w.long}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((d, c) => {
                  if (d.getMonth() !== month.getMonth()) return <td key={c} role="gridcell" className="h-10 p-0" />;
                  const key = toKey(d);
                  const off = isDisabled(d);
                  const blocked = off && !outOfBounds(d);
                  const isStart = same(d, rangeStart);
                  const isEnd = same(d, rangeEnd);
                  const inside =
                    !!rangeStart && !!rangeEnd && cmp(d, rangeStart) > 0 && cmp(d, rangeEnd) < 0;
                  const isPreview = !draft.to && !!previewEnd;
                  const hasBand = !!rangeStart && !!rangeEnd && !same(rangeStart, rangeEnd) && (inside || isStart || isEnd);
                  const selected = !!draft.from && (isStart || (!!draft.to && (inside || isEnd)));
                  const isToday = same(d, today);
                  const capL = c === 0 || d.getDate() === 1;
                  const capR = c === 6 || same(d, lastOfMonth);
                  const parts = [fmt.long.format(d)];
                  if (isToday) parts.push(L.today);
                  if (off) parts.push(L.unavailable);

                  return (
                    <td key={c} role="gridcell" aria-selected={selected} className="relative h-10 p-0 text-center">
                      {hasBand && (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-y-0",
                            isStart ? "left-1/2 right-0" : isEnd ? "left-0 right-1/2" : "inset-x-0",
                            !isStart && capL && "rounded-l-full",
                            !isEnd && capR && "rounded-r-full",
                            isPreview
                              ? "bg-indigo-50 dark:bg-indigo-500/10"
                              : "bg-indigo-100 dark:bg-indigo-500/20",
                          )}
                        />
                      )}
                      <button
                        type="button"
                        data-date={key}
                        tabIndex={same(d, focused) ? 0 : -1}
                        aria-label={parts.join(", ")}
                        aria-disabled={off || undefined}
                        aria-current={isToday ? "date" : undefined}
                        onClick={() => pick(d)}
                        onKeyDown={(e) => onDayKeyDown(e, d)}
                        onFocus={() => setFocused(d)}
                        onPointerEnter={() => picking && setHover(d)}
                        className={cn(
                          "relative inline-flex size-10 items-center justify-center rounded-full text-sm tabular-nums outline-none transition-colors duration-100 motion-reduce:transition-none",
                          "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
                          isToday &&
                            "after:absolute after:bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-indigo-600 dark:after:bg-indigo-400",
                          off
                            ? cn(
                                "cursor-not-allowed text-zinc-400 dark:text-zinc-600",
                                blocked && "line-through decoration-zinc-400/70 dark:decoration-zinc-600",
                              )
                            : isStart || (isEnd && !isPreview)
                              ? "bg-indigo-600 font-semibold text-white hover:bg-indigo-700 after:bg-white dark:after:bg-white"
                              : isEnd && isPreview
                                ? "border-2 border-dashed border-indigo-500 font-semibold text-indigo-800 dark:border-indigo-400 dark:text-indigo-200"
                                : inside
                                  ? "text-indigo-950 hover:bg-indigo-200/70 dark:text-indigo-50 dark:hover:bg-indigo-500/30"
                                  : "text-zinc-800 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-700",
                        )}
                      >
                        {d.getDate()}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const draftText =
    draft.from && draft.to
      ? `${formatRange(draft.from, draft.to)} · ${summarize(draft.from, draft.to)}`
      : draft.from
        ? `${fmt.shortY.format(draft.from)} ${L.to} … · ${L.pickEnd}`
        : L.pickStart;

  const describedBy = error || description ? helpId : undefined;

  return (
    <div
      ref={rootRef}
      onKeyDown={onRootKeyDown}
      onBlur={onRootBlur}
      className={cn("flex w-full max-w-xs flex-col gap-1.5 text-zinc-900 dark:text-zinc-100", className)}
    >
      <style href="lofi-date-range-picker" precedence="default">
        {KEYFRAMES}
      </style>
      {label && (
        <span id={labelId} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {label}
        </span>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          aria-labelledby={label ? `${labelId} ${valueId}` : valueId}
          aria-describedby={describedBy}
          onClick={() => (open ? close(false) : openPicker())}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border bg-white pl-3 text-left text-sm shadow-sm outline-none transition-[border-color,box-shadow] motion-reduce:transition-none",
            "focus-visible:ring-2 focus-visible:ring-offset-0 dark:bg-zinc-950",
            clearable && hasValue && !disabled ? "pr-[4.5rem]" : "pr-9",
            error
              ? "border-rose-500 focus-visible:ring-rose-500/30 dark:border-rose-500"
              : "border-zinc-300 hover:border-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 dark:border-zinc-700 dark:hover:border-zinc-600",
            open && !error && "border-indigo-500 ring-2 ring-indigo-500/30 dark:border-indigo-500",
            disabled && "cursor-not-allowed bg-zinc-100 text-zinc-500 opacity-70 hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700",
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
          <span id={valueId} className={cn("min-w-0 flex-1 truncate", !hasValue && !value.from && "text-zinc-500 dark:text-zinc-400")}>
            {display}
          </span>
          <ChevronDown
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-transform motion-reduce:transition-none dark:text-zinc-400",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {clearable && hasValue && !disabled && (
          <button
            type="button"
            aria-label={L.clear}
            onClick={clear}
            className="absolute inset-y-0 right-8 inline-flex w-9 items-center justify-center rounded-md text-zinc-500 outline-none hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}

        {open && (
          <div
            ref={popRef}
            id={dialogId}
            role="dialog"
            aria-label={L.dialog}
            className={cn(
              "lofi-date-range-picker-pop absolute top-full z-50 mt-2 max-w-[calc(100vw-1.5rem)] overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40",
              align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            )}
          >
            <div className="flex flex-col sm:flex-row">
              {presetList.length > 0 && (
                <div
                  role="group"
                  aria-label={L.presets}
                  className="flex shrink-0 gap-1 overflow-x-auto border-b border-zinc-200 p-2 sm:w-40 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r dark:border-zinc-800"
                >
                  {presetList.map(({ preset, range }) => (
                    <PresetButton
                      key={preset.id}
                      pressed={activePresetId === preset.id}
                      disabled={!range}
                      onClick={() => range && choosePreset(range)}
                    >
                      {preset.label}
                    </PresetButton>
                  ))}
                  <PresetButton
                    pressed={activePresetId === null && !!draft.from}
                    onClick={() => {
                      focusPending.current = true;
                      setFocused((f) => new Date(f));
                    }}
                  >
                    {L.custom}
                  </PresetButton>
                </div>
              )}
              <div className="flex gap-6 p-3">{Array.from({ length: months }, (_, i) => renderMonth(i))}</div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
              <p className="min-w-0 text-sm text-zinc-600 tabular-nums dark:text-zinc-400">{draftText}</p>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => close(true)}
                  className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
                >
                  {L.cancel}
                </button>
                <button
                  type="button"
                  onClick={apply}
                  disabled={!draft.from || !draft.to}
                  className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm outline-none hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none dark:focus-visible:ring-offset-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                >
                  {L.apply}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(error || description) && (
        <p
          id={helpId}
          className={cn("text-xs", error ? "text-rose-700 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400")}
        >
          {error ?? description}
        </p>
      )}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 disabled:pointer-events-none disabled:opacity-35 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
    >
      {children}
    </button>
  );
}

function PresetButton({
  pressed,
  disabled,
  onClick,
  children,
}: {
  pressed: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 whitespace-nowrap rounded-lg px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40",
        pressed
          ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
          : "text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700",
      )}
    >
      {children}
    </button>
  );
}
