"use client";

import { useMemo, useState } from "react";
import { BedDouble, BarChart3 } from "lucide-react";
import {
  DateRangePicker,
  addDays,
  differenceInDays,
  type DateRange,
  type DateRangePreset,
} from "@/components/ui/date-range-picker";

/** Fixed "today" so the server and the browser render the same calendar. */
const TODAY = new Date(2026, 9, 15);

const iso = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "null";

/* ---------- Analytics filter ---------- */

/** Deterministic visits per day, so the chart is the same on every render. */
function visitsOn(d: Date) {
  const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  const weekday = d.getDay();
  const base = weekday === 0 || weekday === 6 ? 820 : 1240;
  return base + ((n * 7919) % 431) + Math.round(Math.sin(n / 5) * 120);
}

export function AnalyticsDemo() {
  const [range, setRange] = useState<DateRange>({ from: addDays(TODAY, -6), to: TODAY });

  const days = useMemo(() => {
    if (!range.from || !range.to) return [];
    const n = differenceInDays(range.from, range.to) + 1;
    return Array.from({ length: n }, (_, i) => {
      const d = addDays(range.from!, i);
      return { d, v: visitsOn(d) };
    });
  }, [range]);
  const total = days.reduce((s, x) => s + x.v, 0);
  const max = Math.max(1, ...days.map((x) => x.v));

  return (
    <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <BarChart3 className="size-[18px]" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Traffic overview</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Unique visitors per day</p>
          </div>
        </div>
        <DateRangePicker
          value={range}
          onChange={setRange}
          today={TODAY}
          maxDate={TODAY}
          minDate={new Date(2025, 0, 1)}
          align="end"
          className="w-full max-w-[17rem] sm:w-[17rem]"
          labels={{ placeholder: "All time" }}
        />
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">
        {total.toLocaleString("en-US")}
        <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
          visitors · {days.length} {days.length === 1 ? "day" : "days"}
        </span>
      </p>
      <div aria-hidden className="mt-4 flex h-28 items-end gap-px overflow-hidden rounded-md">
        {days.map(({ d, v }) => (
          <div
            key={iso(d)}
            className="min-w-px flex-1 rounded-t-sm bg-indigo-500/80 dark:bg-indigo-400/80"
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
        {days.length === 0 && <p className="m-auto text-sm text-zinc-500 dark:text-zinc-400">Pick a range to see traffic.</p>}
      </div>
      <p className="mt-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
        onChange → {"{"} from: {iso(range.from)}, to: {iso(range.to)} {"}"}
      </p>
    </div>
  );
}

/* ---------- Hotel booking ---------- */

const NIGHTLY = 189;
const SOLD_OUT = new Set(["2026-10-27", "2026-10-28", "2026-11-05", "2026-11-06", "2026-11-13"]);

/** Next Friday on or after d. */
const nextFriday = (d: Date) => addDays(d, (5 - d.getDay() + 7) % 7);

const STAY_PRESETS: DateRangePreset[] = [
  { id: "tonight", label: "Tonight", range: (t) => ({ from: t, to: addDays(t, 1) }) },
  { id: "weekend", label: "This weekend", range: (t) => ({ from: nextFriday(t), to: addDays(nextFriday(t), 2) }) },
  { id: "next-weekend", label: "Next weekend", range: (t) => ({ from: addDays(nextFriday(t), 7), to: addDays(nextFriday(t), 9) }) },
  { id: "week", label: "7 nights", range: (t) => ({ from: addDays(t, 1), to: addDays(t, 8) }) },
];

const nights = (r: { from: Date; to: Date }) => {
  const n = differenceInDays(r.from, r.to);
  return `${n} ${n === 1 ? "night" : "nights"}`;
};

export function HotelDemo() {
  const [stay, setStay] = useState<DateRange>({ from: null, to: null });
  const [error, setError] = useState<string | undefined>();
  const [booked, setBooked] = useState<string | null>(null);
  const n = stay.from && stay.to ? differenceInDays(stay.from, stay.to) : 0;

  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">Harbor View Suite</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">${NIGHTLY}</span> / night
        </p>
      </div>
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!stay.from || !stay.to) {
            setError("Choose your check-in and check-out dates.");
            setBooked(null);
            return;
          }
          setBooked(`Held ${nights({ from: stay.from, to: stay.to })} for $${(n * NIGHTLY).toLocaleString("en-US")}.`);
        }}
      >
        <DateRangePicker
          label="Check-in to check-out"
          value={stay}
          onChange={(r) => {
            setStay(r);
            setError(undefined);
            setBooked(null);
          }}
          today={TODAY}
          minDate={TODAY}
          maxDate={new Date(2027, 9, 15)}
          isDateDisabled={(d) => SOLD_OUT.has(iso(d))}
          minSpan={1}
          weekStartsOn={1}
          presets={STAY_PRESETS}
          formatSummary={nights}
          description="Struck-through nights are sold out. Past dates are unavailable."
          error={error}
          className="max-w-none"
          labels={{
            placeholder: "Add dates",
            pickStart: "Select check-in",
            pickEnd: "Select check-out",
            tooShort: () => "Check-out must be at least one night after check-in.",
            crossesDisabled: "Those dates include a sold-out night. Started a new stay from that date.",
          }}
        />
        <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-sm dark:border-zinc-800">
          <span className="text-zinc-600 dark:text-zinc-400">{n > 0 ? `$${NIGHTLY} × ${n} ${n === 1 ? "night" : "nights"}` : "Total"}</span>
          <span className="font-semibold tabular-nums">{n > 0 ? `$${(n * NIGHTLY).toLocaleString("en-US")}` : "—"}</span>
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white outline-none hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-indigo-800 dark:focus-visible:ring-offset-zinc-900"
        >
          <BedDouble className="size-4" aria-hidden /> Reserve
        </button>
        <p role="status" className="min-h-5 text-sm text-emerald-700 dark:text-emerald-400">
          {booked}
        </p>
      </form>
    </div>
  );
}

/* ---------- Locale and states ---------- */

export function LocaleDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 sm:flex-row sm:items-start">
      <DateRangePicker
        label="Zeitraum"
        locale="de-DE"
        weekStartsOn={1}
        numberOfMonths={1}
        today={TODAY}
        defaultValue={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 9) }}
        presets={false}
        formatSummary={(r) => `${differenceInDays(r.from, r.to) + 1} Tage`}
        labels={{
          placeholder: "Datum wählen",
          to: "bis",
          apply: "Übernehmen",
          cancel: "Abbrechen",
          clear: "Auswahl löschen",
          dialog: "Zeitraum wählen",
          previousMonth: "Vorheriger Monat",
          nextMonth: "Nächster Monat",
          today: "heute",
          unavailable: "nicht verfügbar",
          pickStart: "Startdatum wählen",
          pickEnd: "Enddatum wählen",
          startSelected: (d) => `Start ${d}. Jetzt Enddatum wählen.`,
          rangeSelected: (r, s) => `${r} gewählt, ${s}.`,
        }}
      />
      <DateRangePicker
        label="Billing period"
        today={TODAY}
        defaultValue={{ from: new Date(2026, 8, 1), to: new Date(2026, 8, 30) }}
        description="Locked while the invoice is being generated."
        disabled
      />
    </div>
  );
}
