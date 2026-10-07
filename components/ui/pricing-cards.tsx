"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AlertCircle, ArrowRight, Check, Loader2, Minus, SlidersHorizontal, Sparkles, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Billing = "monthly" | "yearly";

export interface PricingFeature {
  label: string;
  /** False renders a muted dash with a screen-reader "Not included" note. */
  included: boolean;
}

export interface PricingCta {
  label: string;
  /** Renders the CTA as a link. onSelect still fires on click. */
  href?: string;
  /** e.g. for the plan the user is already on. */
  disabled?: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  /** Price per month when billed monthly. */
  monthly: number;
  /** Total price per year when billed yearly. Shown per month, with the yearly total underneath. */
  yearly: number;
  features: PricingFeature[];
  cta: PricingCta;
  /** Highlights the plan, raises it and shows the featured label. */
  featured?: boolean;
}

/** Every piece of text the cards render, so the component can be translated. */
export interface PricingLabels {
  monthly: string;
  yearly: string;
  /** Accessible name of the billing toggle. */
  billingToggle: string;
  /** Period shown after the price. Yearly prices are shown per month. */
  period: string;
  /** Spoken period, e.g. "per month". */
  periodSpoken: string;
  /** Line under a yearly price. Receives the formatted yearly total. */
  billedYearly: (total: string) => string;
  /** Line under a monthly price. */
  billedMonthly: string;
  /** Line under a plan that costs nothing in either period. */
  free: string;
  /** Chip shown on yearly prices. Receives the formatted saving per year. */
  saving: (amount: string) => string;
  featured: string;
  notIncluded: string;
  /** Live-region text after the billing changes. */
  announce: (billing: string, prices: string) => string;
  /** Fallback error when onSelect rejects without a message. */
  error: string;
  empty: string;
  /** Badge on the cheapest plan that fits the finder values. */
  bestFit: string;
  /** Heading of the plan finder. */
  finderTitle: string;
  /** A plan's limit for one finder dimension, e.g. "Up to 10 seats". */
  limit: (formatted: string) => string;
  /** A plan with no limit for one dimension, e.g. "Unlimited seats". */
  unlimited: (label: string) => string;
  /** Screen-reader / visible reason a plan doesn't fit. */
  tooSmall: (needed: string) => string;
  /** Shown when no plan fits the finder values. */
  noFit: string;
  /** Live-region text when the recommendation changes. */
  announceFit: (planName: string, price: string) => string;
}

/** One question of the plan finder, e.g. team size. */
export interface PlanFinderDimension {
  id: string;
  /** Slider label, e.g. "Team size". */
  label: string;
  /** Plural noun used in limits, e.g. "seats". */
  unit: string;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  /** Formats a value for display, e.g. (n) => `${n} GB`. Defaults to `${n} ${unit}`. */
  format?: (value: number) => string;
  /** Highest value each plan supports, by plan id. null or a missing id means unlimited. */
  limits: Record<string, number | null>;
}

/** Plans that cover every finder value, cheapest first (at the given billing), then in plan order. */
export function fittingPlans(
  plans: PricingPlan[],
  billing: Billing,
  finder: PlanFinderDimension[],
  values: Record<string, number>,
): PricingPlan[] {
  const fits = (p: PricingPlan) =>
    finder.every((d) => {
      const limit = d.limits[p.id];
      return limit === null || limit === undefined || (values[d.id] ?? d.min) <= limit;
    });
  return plans
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => fits(p))
    .sort((a, b) => priceFor(a.p, billing) - priceFor(b.p, billing) || a.i - b.i)
    .map(({ p }) => p);
}

/** The cheapest plan that fits, or null when none does. */
export function recommendPlan(
  plans: PricingPlan[],
  billing: Billing,
  finder: PlanFinderDimension[],
  values: Record<string, number>,
): string | null {
  return fittingPlans(plans, billing, finder, values)[0]?.id ?? null;
}

export const defaultPricingLabels: PricingLabels = {
  monthly: "Monthly",
  yearly: "Yearly",
  billingToggle: "Billing period",
  period: "/mo",
  periodSpoken: "per month",
  billedYearly: (total) => `Billed ${total} yearly`,
  billedMonthly: "Billed monthly, cancel anytime",
  free: "Free forever, no card needed",
  saving: (amount) => `Save ${amount}/yr`,
  featured: "Most popular",
  notIncluded: "Not included",
  announce: (billing, prices) => `${billing} billing. ${prices}`,
  error: "Something went wrong. Please try again.",
  empty: "No plans available right now.",
  bestFit: "Best fit for you",
  finderTitle: "Find your plan",
  limit: (v) => `Up to ${v}`,
  unlimited: (label) => `Unlimited ${label}`,
  tooSmall: (needed) => `Too small: you need ${needed}`,
  noFit: "None of these plans is big enough yet. Talk to us about a custom plan.",
  announceFit: (name, price) => `Best fit: ${name}, ${price}.`,
};

export interface PricingCardsProps {
  plans: PricingPlan[];
  /** Initial billing period. */
  defaultBilling?: Billing;
  /** Badge next to the yearly option. Pass an empty string to hide it. */
  yearlyDiscountLabel?: string;
  /** ISO 4217 currency code. */
  currency?: string;
  /** BCP 47 locale used to format prices. */
  locale?: string;
  /**
   * Fired by a plan's CTA. Return a promise to show a loading spinner on that CTA;
   * a rejection shows its message under the button.
   */
  onSelect?: (planId: string, billing: Billing) => void | Promise<void>;
  /** Override any text. Merged with the defaults. */
  labels?: Partial<PricingLabels>;
  /** Fired when the billing toggle changes. */
  onBillingChange?: (billing: Billing) => void;
  /**
   * Plan finder: sliders for what the buyer needs (seats, storage…). The cheapest plan that
   * covers every value is marked "Best fit for you", and plans that are too small say why.
   */
  finder?: PlanFinderDimension[];
  /** Called when the recommended plan changes (null when nothing fits). */
  onRecommend?: (planId: string | null) => void;
  className?: string;
}

/** How a plan relates to the finder values. */
export interface PlanFit {
  recommended: boolean;
  fits: boolean;
  /** One line per finder dimension, e.g. "Up to 10 seats", and whether it covers the value. */
  notes: { text: string; ok: boolean }[];
}

export interface PricingCardProps {
  plan: PricingPlan;
  billing: Billing;
  currency?: string;
  locale?: string;
  onSelect?: (planId: string, billing: Billing) => void | Promise<void>;
  labels?: Partial<PricingLabels>;
  /** Finder result for this plan. Set by PricingTable when it has a finder. */
  fit?: PlanFit;
  className?: string;
}

/* ---------- Price formatting ---------- */

function useFormatter(currency: string, locale: string) {
  return useMemo(() => {
    const whole = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
    const cents = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2 });
    return (n: number) => (Number.isInteger(n) ? whole : cents);
  }, [currency, locale]);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function priceFor(plan: PricingPlan, billing: Billing) {
  return billing === "monthly" ? plan.monthly : round2(plan.yearly / 12);
}

/* ---------- Odometer ---------- */

/** One digit as a vertical 0-9 strip that rolls to its value. */
function RollingDigit({ digit, delay }: { digit: number; delay: number }) {
  return (
    <span className="relative inline-block h-[1.1em] overflow-hidden align-top">
      <span
        className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.2,0.9,0.25,1)] motion-reduce:transition-none"
        style={{ transform: `translateY(-${digit * 10}%)`, transitionDelay: `${delay}ms` }}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} className="block h-[1.1em] leading-[1.1em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/** A formatted price whose digits roll like an odometer when the value changes. */
function RollingPrice({ value, format }: { value: number; format: Intl.NumberFormat }) {
  const parts = format.formatToParts(value);
  const digitCount = parts.reduce((n, p) => (/^\d+$/.test(p.value) ? n + p.value.length : n), 0);
  let seen = 0;
  const out: ReactNode[] = [];
  parts.forEach((part, pi) => {
    if (part.type === "integer" || part.type === "fraction") {
      for (const ch of part.value) {
        const fromRight = digitCount - 1 - seen++;
        out.push(<RollingDigit key={`d${fromRight}`} digit={Number(ch)} delay={(digitCount - 1 - fromRight) * 45} />);
      }
    } else {
      out.push(
        <span
          key={`${part.type}${pi}`}
          className={cn(
            "inline-block h-[1.1em] leading-[1.1em]",
            part.type === "currency" &&
              "mr-0.5 mt-[0.2em] h-auto text-[0.5em] font-medium leading-none text-zinc-500 dark:text-zinc-400",
          )}
        >
          {part.value}
        </span>,
      );
    }
  });
  return (
    <span aria-hidden className="inline-flex items-start tabular-nums">
      {out}
    </span>
  );
}

/* ---------- Card ---------- */

export function PricingCard({
  plan,
  billing,
  currency = "USD",
  locale = "en-US",
  onSelect,
  labels: labelsProp,
  fit,
  className,
}: PricingCardProps) {
  const labels = { ...defaultPricingLabels, ...labelsProp };
  const fmt = useFormatter(currency, locale);
  const errorId = useId();
  const nameId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = priceFor(plan, billing);
  const saving = round2(plan.monthly * 12 - plan.yearly);
  const disabled = plan.cta.disabled || pending;

  const handleSelect = () => {
    if (disabled || !onSelect) return;
    setError(null);
    const result = onSelect(plan.id, billing);
    if (result instanceof Promise) {
      setPending(true);
      result
        .catch((e: unknown) => setError(e instanceof Error && e.message ? e.message : labels.error))
        .finally(() => setPending(false));
    }
  };

  const ctaClass = cn(
    "group/cta inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold outline-none transition",
    "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
    "active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
    plan.featured
      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 dark:bg-indigo-500"
      : "border border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
    disabled
      ? "cursor-not-allowed opacity-60 active:scale-100"
      : plan.featured
        ? "hover:bg-indigo-500 dark:hover:bg-indigo-400"
        : "hover:border-zinc-400 hover:bg-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
  );

  const ctaInner = (
    <>
      {pending && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />}
      {plan.cta.label}
      {!pending && !plan.cta.disabled && (
        <ArrowRight
          className="size-4 transition-transform group-hover/cta:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden
        />
      )}
    </>
  );

  return (
    <article
      aria-labelledby={nameId}
      className={cn(
        "relative flex h-full flex-1 flex-col rounded-2xl border bg-white p-6 transition-[box-shadow,transform,border-color] duration-300 motion-reduce:transition-none",
        "dark:bg-zinc-900",
        fit?.recommended
          ? "border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/50 dark:border-emerald-400/70 dark:shadow-emerald-500/5"
          : plan.featured
            ? "border-indigo-500/70 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/40 dark:border-indigo-400/60 dark:shadow-indigo-500/5"
            : "border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-700",
        // Dimmed with a dashed border, not opacity, so text keeps its contrast.
        fit && !fit.fits && "border-dashed bg-zinc-50 shadow-none hover:shadow-none dark:bg-zinc-900/50",
        className,
      )}
    >
      <style href="lofi-pricing-cards" precedence="default">{`
        @keyframes lofi-pricing-cards-pop {
          from { opacity: 0; transform: translateY(4px) scale(0.9); }
          to { opacity: 1; transform: none; }
        }
        .lofi-pricing-cards-pop { animation: lofi-pricing-cards-pop 380ms cubic-bezier(0.2, 0.9, 0.25, 1.3) both; }
        @media (prefers-reduced-motion: reduce) { .lofi-pricing-cards-pop { animation: none; } }
      `}</style>
      {plan.featured && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-2xl bg-gradient-to-b from-indigo-500/10 to-transparent dark:from-indigo-400/10"
          />
          <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm dark:bg-indigo-500">
            <Sparkles className="size-3" aria-hidden />
            {labels.featured}
          </span>
        </>
      )}
      {fit?.recommended && (
        <span className="lofi-pricing-cards-pop absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950">
          <Target className="size-3" aria-hidden />
          {labels.bestFit}
        </span>
      )}

      <h3 id={nameId} className="relative text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {plan.name}
        {fit?.recommended && <span className="sr-only">, {labels.bestFit}</span>}
      </h3>
      <p className="relative mt-1 min-h-10 text-sm text-zinc-600 dark:text-zinc-400">{plan.description}</p>

      <div className="relative mt-5">
        <p className="flex items-end gap-1.5">
          <span className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <RollingPrice value={price} format={fmt(price)} />
          </span>
          <span aria-hidden className="pb-1 text-sm text-zinc-500 dark:text-zinc-400">
            {labels.period}
          </span>
          <span className="sr-only">
            {fmt(price).format(price)} {labels.periodSpoken}
          </span>
        </p>
        <div className="mt-1.5 flex min-h-6 flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {plan.monthly === 0 && plan.yearly === 0
              ? labels.free
              : billing === "yearly"
                ? labels.billedYearly(fmt(plan.yearly).format(plan.yearly))
                : labels.billedMonthly}
          </span>
          {billing === "yearly" && saving > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-emerald-600/20 lofi-pricing-cards-pop dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20">
              {labels.saving(fmt(saving).format(saving))}
            </span>
          )}
        </div>
      </div>

      {fit && fit.notes.length > 0 && (
        <ul className="relative mt-4 flex flex-col gap-1 text-xs">
          {fit.notes.map((n) => (
            <li
              key={n.text}
              className={cn(
                "flex items-center gap-1.5 font-medium",
                n.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
              )}
            >
              {n.ok ? <Check className="size-3.5 shrink-0" aria-hidden /> : <X className="size-3.5 shrink-0" aria-hidden />}
              {n.text}
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-6">
        {plan.cta.href && !disabled ? (
          <a href={plan.cta.href} onClick={handleSelect} className={ctaClass} aria-describedby={error ? errorId : undefined}>
            {ctaInner}
          </a>
        ) : (
          <button
            type="button"
            onClick={handleSelect}
            disabled={disabled}
            aria-busy={pending || undefined}
            aria-describedby={error ? errorId : undefined}
            className={ctaClass}
          >
            {ctaInner}
          </button>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-rose-700 dark:text-rose-400">
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>

      <ul className="relative mt-6 flex flex-col gap-2.5 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-start gap-2.5">
            {f.included ? (
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full",
                  plan.featured
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
                )}
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
            ) : (
              <span
                aria-hidden
                className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              >
                <Minus className="size-3" strokeWidth={3} />
              </span>
            )}
            <span className={cn(f.included ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-500 line-through decoration-zinc-300 dark:text-zinc-400 dark:decoration-zinc-600")}>
              {f.label}
              {!f.included && <span className="sr-only">, {labels.notIncluded}</span>}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ---------- Billing toggle ---------- */

function BillingToggle({
  value,
  onChange,
  labels,
  badge,
}: {
  value: Billing;
  onChange: (b: Billing) => void;
  labels: PricingLabels;
  badge: string;
}) {
  const refs = useRef<Record<Billing, HTMLButtonElement | null>>({ monthly: null, yearly: null });
  const options: Billing[] = ["monthly", "yearly"];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next: Billing =
      e.key === "Home" ? "monthly" : e.key === "End" ? "yearly" : value === "monthly" ? "yearly" : "monthly";
    onChange(next);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={labels.billingToggle}
      onKeyDown={onKeyDown}
      className="relative grid grid-cols-2 rounded-full border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-800/60"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm ring-1 ring-zinc-900/5 transition-transform duration-300 ease-out motion-reduce:transition-none dark:bg-zinc-950 dark:ring-white/10",
          value === "yearly" && "translate-x-full",
        )}
      />
      {options.map((opt) => (
        <button
          key={opt}
          ref={(el) => {
            refs.current[opt] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === opt}
          tabIndex={value === opt ? 0 : -1}
          onClick={() => onChange(opt)}
          className={cn(
            "relative z-10 inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none sm:px-5",
            value === opt
              ? "text-zinc-900 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          {opt === "monthly" ? labels.monthly : labels.yearly}
          {opt === "yearly" && badge && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Table ---------- */

/** Billing toggle plus a responsive 1 / 2 / 3 column grid of plan cards. Columns follow the container width. */
export function PricingTable({
  plans,
  defaultBilling = "monthly",
  yearlyDiscountLabel = "Save 20%",
  currency = "USD",
  locale = "en-US",
  onSelect,
  labels: labelsProp,
  onBillingChange,
  finder,
  onRecommend,
  className,
}: PricingCardsProps) {
  const labels = { ...defaultPricingLabels, ...labelsProp };
  const fmt = useFormatter(currency, locale);
  const [billing, setBilling] = useState<Billing>(defaultBilling);
  const [announcement, setAnnouncement] = useState("");
  const finderId = useId();

  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries((finder ?? []).map((d) => [d.id, d.defaultValue ?? d.min])),
  );
  const recommended = finder?.length ? recommendPlan(plans, billing, finder, values) : null;
  const formatDim = (d: PlanFinderDimension, v: number) => (d.format ? d.format(v) : `${v} ${d.unit}`);
  const fitFor = (plan: PricingPlan): PlanFit | undefined => {
    if (!finder?.length) return undefined;
    const notes = finder.map((d) => {
      const limit = d.limits[plan.id];
      if (limit === null || limit === undefined) return { text: labels.unlimited(d.unit), ok: true };
      const ok = (values[d.id] ?? d.min) <= limit;
      return { text: ok ? labels.limit(formatDim(d, limit)) : labels.tooSmall(formatDim(d, values[d.id] ?? d.min)), ok };
    });
    return { recommended: plan.id === recommended, fits: notes.every((n) => n.ok), notes };
  };

  // Tell the parent and screen readers about a new recommendation once the slider settles.
  const onRecommendRef = useRef(onRecommend);
  useEffect(() => {
    onRecommendRef.current = onRecommend;
  }, [onRecommend]);
  const lastRecommended = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!finder?.length || recommended === lastRecommended.current) return;
    const first = lastRecommended.current === undefined;
    lastRecommended.current = recommended;
    onRecommendRef.current?.(recommended);
    if (first) return;
    const t = setTimeout(() => {
      const plan = plans.find((p) => p.id === recommended);
      if (!plan) return setAnnouncement(labels.noFit);
      const v = priceFor(plan, billing);
      setAnnouncement(labels.announceFit(plan.name, `${fmt(v).format(v)} ${labels.periodSpoken}`));
    }, 600);
    return () => clearTimeout(t);
    // labels and fmt are rebuilt each render; the recommendation is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommended, finder?.length]);

  const change = (next: Billing) => {
    if (next === billing) return;
    setBilling(next);
    onBillingChange?.(next);
    const prices = plans
      .map((p) => {
        const v = priceFor(p, next);
        return `${p.name} ${fmt(v).format(v)} ${labels.periodSpoken}`;
      })
      .join(", ");
    setAnnouncement(labels.announce(next === "monthly" ? labels.monthly : labels.yearly, prices));
  };

  const odd = plans.length % 2 === 1;

  return (
    <div className={cn("@container w-full", className)}>
      <div className="flex justify-center">
        <BillingToggle value={billing} onChange={change} labels={labels} badge={yearlyDiscountLabel} />
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {finder && finder.length > 0 && plans.length > 0 && (
        <fieldset className="mx-auto mt-6 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <legend className="sr-only">{labels.finderTitle}</legend>
          <p aria-hidden className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <SlidersHorizontal className="size-4 text-emerald-700 dark:text-emerald-400" />
            {labels.finderTitle}
          </p>
          <div className="mt-3 flex flex-col gap-4">
            {finder.map((d) => {
              const v = values[d.id] ?? d.min;
              const id = `${finderId}-${d.id}`;
              return (
                <div key={d.id} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <label htmlFor={id} className="font-medium text-zinc-700 dark:text-zinc-300">
                      {d.label}
                    </label>
                    <output htmlFor={id} className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatDim(d, v)}
                    </output>
                  </div>
                  <input
                    id={id}
                    type="range"
                    min={d.min}
                    max={d.max}
                    step={d.step ?? 1}
                    value={v}
                    aria-valuetext={formatDim(d, v)}
                    onChange={(e) => setValues((prev) => ({ ...prev, [d.id]: Number(e.target.value) }))}
                    className="h-10 w-full cursor-pointer accent-emerald-600 dark:accent-emerald-400"
                  />
                </div>
              );
            })}
          </div>
          {recommended === null && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-300/60 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/30">
              {labels.noFit}
            </p>
          )}
        </fieldset>
      )}

      {plans.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {labels.empty}
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-6 @xl:grid-cols-2 @4xl:grid-cols-3 @4xl:py-4">
          {plans.map((plan, i) => (
            <li
              key={plan.id}
              className={cn(
                "flex flex-col",
                odd && i === plans.length - 1 && "@xl:col-span-2 @xl:mx-auto @xl:w-[calc(50%-0.75rem)] @4xl:col-span-1 @4xl:w-auto",
                plan.featured && "@4xl:-my-4",
              )}
            >
              <PricingCard
                plan={plan}
                billing={billing}
                currency={currency}
                locale={locale}
                onSelect={onSelect}
                labels={labelsProp}
                fit={fitFor(plan)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Alias of PricingTable. */
export const PricingCards = PricingTable;
