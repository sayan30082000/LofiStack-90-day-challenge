"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { RotateCcw, RefreshCw, Users, Clock } from "lucide-react";
import { RangeSlider, type RangeValue } from "@/components/ui/range-slider";
import { cn } from "@/lib/utils";

/* ---------- Price filter ---------- */

const PRICE_MIN = 0;
const PRICE_MAX = 1000;

/** 40 deterministic buckets of $25: a big cluster of budget items and a smaller premium bump. */
const PRICE_HISTOGRAM = Array.from({ length: 40 }, (_, i) =>
  Math.round(58 * Math.exp(-(((i - 8) / 6) ** 2)) + 22 * Math.exp(-(((i - 26) / 4) ** 2)) + 3 + ((i * 7) % 5)),
);

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const formatPrice = (n: number) => usd.format(n);

/** Counts products in the range, weighting the edge buckets by how much of them is covered. */
function countInRange([lo, hi]: RangeValue) {
  const width = (PRICE_MAX - PRICE_MIN) / PRICE_HISTOGRAM.length;
  return Math.round(
    PRICE_HISTOGRAM.reduce((sum, h, i) => {
      const b0 = PRICE_MIN + i * width;
      const overlap = Math.max(0, Math.min(hi, b0 + width) - Math.max(lo, b0));
      return sum + h * (overlap / width);
    }, 0),
  );
}

export function PriceDemo() {
  const [range, setRange] = useState<RangeValue>([120, 640]);
  const [committed, setCommitted] = useState<RangeValue>([120, 640]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const refetch = () => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 1400);
  };

  const count = countInRange(range);
  const isDefault = range[0] === PRICE_MIN && range[1] === PRICE_MAX;

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Price</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
              {loading ? "Updating counts…" : `${count} of ${countInRange([PRICE_MIN, PRICE_MAX])} products`}
            </p>
          </div>
          <div className="flex gap-1">
            <IconButton label="Refresh counts" onClick={refetch} disabled={loading}>
              <RefreshCw className={cn("size-4", loading && "motion-safe:animate-spin")} aria-hidden />
            </IconButton>
            <IconButton
              label="Reset price"
              disabled={isDefault}
              onClick={() => {
                setRange([PRICE_MIN, PRICE_MAX]);
                setCommitted([PRICE_MIN, PRICE_MAX]);
              }}
            >
              <RotateCcw className="size-4" aria-hidden />
            </IconButton>
          </div>
        </div>
        <RangeSlider
          label="Price range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={10}
          minGap={50}
          value={range}
          onChange={setRange}
          onChangeEnd={setCommitted}
          formatValue={formatPrice}
          histogram={PRICE_HISTOGRAM}
          histogramLoading={loading}
          showInputs
          inputPrefix="$"
          thumbLabels={["Minimum price", "Maximum price"]}
          inputLabels={["Min", "Max"]}
          name={["price_min", "price_max"]}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <Readout label="onChange (live)" value={`${formatPrice(range[0])} – ${formatPrice(range[1])}`} />
        <Readout label="onChangeEnd (committed)" value={`${formatPrice(committed[0])} – ${formatPrice(committed[1])}`} />
        <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-zinc-500 marker:text-zinc-400 dark:text-zinc-400">
          <li>Click the bars or the track to move the nearest thumb.</li>
          <li>Thumbs stay at least $50 apart.</li>
          <li>Type in the inputs: valid numbers move the thumbs as you type.</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------- Age range ---------- */

export function AgeDemo() {
  const [range, setRange] = useState<RangeValue>([25, 34]);
  const [disabled, setDisabled] = useState(false);
  const tooNarrow = range[1] - range[0] < 5;

  return (
    <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Users className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Audience</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Who should see this campaign?</p>
        </div>
      </div>
      <RangeSlider
        label="Age"
        min={18}
        max={65}
        value={range}
        onChange={setRange}
        minGap={1}
        disabled={disabled}
        formatValue={(n) => (n === 65 ? "65+" : String(n))}
        thumbLabels={["Youngest age", "Oldest age"]}
        error={tooNarrow ? "Pick a span of at least 5 years to reach enough people." : undefined}
      />
      <label className="mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={disabled}
          onChange={(e) => setDisabled(e.target.checked)}
          className="size-4 accent-indigo-600"
        />
        Disabled
      </label>
    </div>
  );
}

/* ---------- Time of day ---------- */

function formatTime(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

export function TimeDemo() {
  const [range, setRange] = useState<RangeValue>([540, 1020]);
  const hours = (range[1] - range[0]) / 60;

  return (
    <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-8 flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Clock className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Quiet hours</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Notifications pause for {Number.isInteger(hours) ? hours : hours.toFixed(2).replace(/0$/, "")} hours a day.
          </p>
        </div>
      </div>
      <RangeSlider
        ariaLabel="Quiet hours"
        min={360}
        max={1380}
        step={15}
        minGap={60}
        value={range}
        onChange={setRange}
        formatValue={formatTime}
        tooltip="always"
        showValue={false}
        thumbLabels={["Start time", "End time"]}
        className="[--rs-accent:#0d9488] dark:[--rs-accent:#2dd4bf]"
      />
      <div aria-hidden className="mt-1 flex justify-between px-5 text-xs text-zinc-500 dark:text-zinc-400">
        <span>6 AM</span>
        <span>Noon</span>
        <span>6 PM</span>
        <span>11 PM</span>
      </div>
    </div>
  );
}

/* ---------- Bits ---------- */

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 font-mono text-[13px] tabular-nums">{value}</p>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
    >
      {children}
    </button>
  );
}
