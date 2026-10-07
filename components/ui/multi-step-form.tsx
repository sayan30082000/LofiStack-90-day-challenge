"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, LoaderCircle, Pencil, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Error message per field name. Empty or missing entries count as valid. */
export type WizardErrors<V> = Partial<Record<Extract<keyof V, string>, string>>;

/** Props to spread on a field so it can be focused and linked to its error. */
export interface WizardFieldProps {
  id: string;
  name: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

/** What each step's render function receives. */
export interface WizardStepContext<V> {
  values: V;
  /** Updates one value and clears that field's error. */
  setValue: <K extends keyof V>(name: K, value: V[K]) => void;
  /** Errors from the last validate() of this step. */
  errors: WizardErrors<V>;
  /** id, name, aria-invalid and aria-describedby for a field. Spread it on the input. */
  field: (name: Extract<keyof V, string>) => WizardFieldProps;
  /** Element id of a field; the wizard focuses it when its validation fails. */
  fieldId: (name: Extract<keyof V, string>) => string;
  /** Element id for a field's error text. */
  errorId: (name: Extract<keyof V, string>) => string;
  /** True while the form is submitting. */
  disabled: boolean;
}

export interface WizardSummaryItem {
  label: string;
  value: ReactNode;
}

export interface WizardStep<V> {
  /** Stable id, used as a React key. */
  id: string;
  /** Step name, used in the progress header and as the step heading. */
  title: string;
  description?: string;
  /** Renders the step's fields. */
  render: (ctx: WizardStepContext<V>) => ReactNode;
  /** Runs on Next. Return errors keyed by field name (sync or async); nothing or {} means valid. */
  validate?: (values: V) => WizardErrors<V> | null | undefined | Promise<WizardErrors<V> | null | undefined>;
  /** Rows shown for this step on the review screen. */
  summary?: (values: V) => WizardSummaryItem[];
}

export interface WizardLabels {
  next: string;
  back: string;
  /** Next button on the last step before the review screen. */
  toReview: string;
  submit: string;
  submitting: string;
  validating: string;
  edit: string;
  /** Primary button while editing a step opened from the review screen. */
  returnToReview: string;
  restart: string;
  reviewTitle: string;
  reviewDescription: string;
  /** Accessible name of the step list. */
  progress: string;
  stepOf: (current: number, total: number) => string;
  completed: string;
  /** Fallback when onSubmit rejects without a message. */
  submitError: string;
  /** Review rows when a step has no summary. */
  noSummary: string;
}

export interface MultiStepFormProps<V extends Record<string, unknown>> {
  steps: WizardStep<V>[];
  initialValues: V;
  /** Called with every value after the last step (or the review screen). Reject to show an error. */
  onSubmit: (values: V) => Promise<void>;
  /** Adds a review step that summarizes all values with Edit links. */
  showReview?: boolean;
  /** Heading above the progress header. */
  title?: ReactNode;
  /** Heading of the success screen. */
  successTitle?: ReactNode;
  /** Body of the success screen. The function form receives the submitted values. */
  successDescription?: ReactNode | ((values: V) => ReactNode);
  /** Called when "Start over" is pressed on the success screen. Omit to hide the button. */
  onRestart?: () => void;
  /** Override any button or status text. */
  labels?: Partial<WizardLabels>;
  className?: string;
}

const DEFAULT_LABELS: WizardLabels = {
  next: "Continue",
  back: "Back",
  toReview: "Review",
  submit: "Submit",
  submitting: "Submitting…",
  validating: "Checking…",
  edit: "Edit",
  returnToReview: "Save and review",
  restart: "Start over",
  reviewTitle: "Review",
  reviewDescription: "Check everything before you submit. Use Edit to change a step.",
  progress: "Form progress",
  stepOf: (c, t) => `Step ${c} of ${t}`,
  completed: "completed",
  submitError: "Something went wrong. Please try again.",
  noSummary: "Nothing to show.",
};

const STYLE = `
@keyframes lofi-multi-step-form-from-right { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes lofi-multi-step-form-from-left { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: none; } }
@keyframes lofi-multi-step-form-pop { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
@keyframes lofi-multi-step-form-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.lofi-multi-step-form-next { animation: lofi-multi-step-form-from-right 300ms cubic-bezier(.2,.8,.2,1) both; }
.lofi-multi-step-form-prev { animation: lofi-multi-step-form-from-left 300ms cubic-bezier(.2,.8,.2,1) both; }
.lofi-multi-step-form-pop { animation: lofi-multi-step-form-pop 460ms cubic-bezier(.2,.9,.3,1.2) both; }
.lofi-multi-step-form-draw { stroke-dasharray: 1; animation: lofi-multi-step-form-draw 420ms 260ms ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .lofi-multi-step-form-next, .lofi-multi-step-form-prev, .lofi-multi-step-form-pop, .lofi-multi-step-form-draw { animation: none; }
  .lofi-multi-step-form-draw { stroke-dasharray: none; }
}
`;

const hasErrors = (e: object | null | undefined): boolean => !!e && Object.values(e).some(Boolean);

function messageOf(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

/** Optional label + error wrapper for fields inside a step. */
export function WizardField({
  label,
  htmlFor,
  error,
  errorId,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  /** Error message, rendered with errorId so the field can point to it. */
  error?: string;
  errorId: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-[13px] font-medium text-rose-700 dark:text-rose-400">
          <CircleAlert aria-hidden className="mt-px size-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}

/** Shared input styling that matches the wizard. Use it on your own fields if you like. */
export const wizardInputClass = cn(
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-[15px] text-zinc-900 shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-zinc-500 motion-reduce:transition-none sm:text-sm",
  "hover:border-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/20",
  "aria-invalid:border-rose-500 aria-invalid:focus-visible:ring-rose-500/20",
  "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500",
  "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:hover:border-zinc-600 dark:focus-visible:border-indigo-400 dark:aria-invalid:border-rose-400 dark:disabled:bg-zinc-800/60",
);

type Phase = "form" | "submitting" | "success";

export function MultiStepForm<V extends Record<string, unknown>>({
  steps,
  initialValues,
  onSubmit,
  showReview = true,
  title,
  successTitle = "All done",
  successDescription = "Your details were submitted.",
  onRestart,
  labels: labelsProp,
  className,
}: MultiStepFormProps<V>) {
  const L = { ...DEFAULT_LABELS, ...labelsProp };
  const uid = useId();
  const [values, setValues] = useState<V>(initialValues);
  const [current, setCurrent] = useState(0);
  const [visited, setVisited] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const [errors, setErrors] = useState<WizardErrors<V>>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [validating, setValidating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fromReview, setFromReview] = useState(false);
  const [submitted, setSubmitted] = useState<V | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const lastView = useRef("0|form");

  const total = steps.length + (showReview ? 1 : 0);
  const reviewIndex = showReview ? steps.length : -1;
  const isReview = current === reviewIndex;
  const lastIndex = total - 1;
  const submitting = phase === "submitting";

  const fieldId = (name: string) => `${uid}-f-${name}`;
  const errorId = (name: string) => `${uid}-e-${name}`;

  // Focus the new step's heading (or the field that failed) whenever the step changes.
  // Keyed on step + success so mount (and Strict Mode's double effect) never steals focus.
  const viewKey = `${current}|${phase === "success" ? "success" : "form"}`;
  useEffect(() => {
    if (lastView.current === viewKey) return;
    lastView.current = viewKey;
    if (viewKey.endsWith("success")) {
      successRef.current?.focus();
      return;
    }
    const target = pendingFocus.current ? document.getElementById(pendingFocus.current) : null;
    pendingFocus.current = null;
    (target ?? headingRef.current)?.focus();
  }, [viewKey]);

  const go = (index: number, focusField?: string) => {
    if (index === current) {
      if (focusField) document.getElementById(focusField)?.focus();
      return;
    }
    pendingFocus.current = focusField ?? null;
    setDirection(index > current ? "next" : "prev");
    setCurrent(index);
    setVisited((v) => Math.max(v, index));
    setSubmitError(null);
  };

  const firstErrorField = (errs: WizardErrors<V>) => {
    const key = Object.keys(errs).find((k) => errs[k as Extract<keyof V, string>]);
    return key ? fieldId(key) : undefined;
  };

  /** Validates steps from `from` up to (not including) `to`. Returns the failing index and its errors. */
  const validateRange = async (from: number, to: number) => {
    for (let i = from; i < Math.min(to, steps.length); i++) {
      const result = await steps[i].validate?.(values);
      if (hasErrors(result)) return { index: i, errs: result as WizardErrors<V> };
    }
    return null;
  };

  /** Moves forward to `target`, stopping at the first step that fails validation. */
  const advanceTo = async (target: number) => {
    setValidating(true);
    try {
      const failed = await validateRange(current, target);
      if (failed) {
        setErrors(failed.errs);
        go(failed.index, firstErrorField(failed.errs));
        return false;
      }
      setErrors({});
      if (target !== current) go(target);
      return true;
    } finally {
      setValidating(false);
    }
  };

  const submit = async () => {
    // Re-check every step: header jumps could have skipped one.
    setValidating(true);
    const failed = await validateRange(0, steps.length);
    setValidating(false);
    if (failed) {
      setErrors(failed.errs);
      setFromReview(showReview);
      go(failed.index, firstErrorField(failed.errs));
      return;
    }
    setSubmitError(null);
    setPhase("submitting");
    try {
      await onSubmit(values);
      setSubmitted(values);
      setPhase("success");
    } catch (err) {
      setSubmitError(messageOf(err, L.submitError));
      setPhase("form");
    }
  };

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || validating) return;
    if (current === lastIndex) return submit();
    if (fromReview && showReview) {
      const ok = await advanceTo(reviewIndex);
      if (ok) setFromReview(false);
      return;
    }
    await advanceTo(current + 1);
  };

  const back = () => {
    if (current === 0 || submitting) return;
    setErrors({});
    setFromReview(false);
    go(current - 1);
  };

  const jump = async (index: number) => {
    if (submitting || validating || index === current) return;
    if (index < current) {
      setErrors({});
      setFromReview(false);
      go(index);
    } else await advanceTo(index);
  };

  const edit = (index: number) => {
    setErrors({});
    setFromReview(true);
    go(index);
  };

  const restart = () => {
    setValues(initialValues);
    setErrors({});
    setVisited(0);
    setFromReview(false);
    setSubmitted(null);
    setDirection(null);
    setCurrent(0);
    setPhase("form");
    onRestart?.();
  };

  const setValue = <K extends keyof V>(name: K, value: V[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const key = String(name) as Extract<keyof V, string>;
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const ctx: WizardStepContext<V> = {
    values,
    setValue,
    errors,
    disabled: submitting,
    fieldId,
    errorId,
    field: (name) => ({
      id: fieldId(name),
      name,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? errorId(name) : undefined,
    }),
  };

  const stepTitle = (i: number) => (i === reviewIndex ? L.reviewTitle : steps[i]?.title);
  const headingId = `${uid}-heading`;

  /* ---------- Success ---------- */

  if (phase === "success" && submitted) {
    const body = typeof successDescription === "function" ? successDescription(submitted) : successDescription;
    return (
      <div className={cn("w-full rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900", className)}>
        <style href="lofi-multi-step-form" precedence="default">
          {STYLE}
        </style>
        <div role="status" className="flex flex-col items-center">
          <span
            aria-hidden
            className="lofi-multi-step-form-pop inline-flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/5"
          >
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} className="lofi-multi-step-form-draw" />
            </svg>
          </span>
          <h3
            ref={successRef}
            tabIndex={-1}
            className="mt-5 rounded text-xl font-semibold tracking-tight text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-50"
          >
            {successTitle}
          </h3>
          <div className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">{body}</div>
        </div>
        {onRestart && (
          <button
            type="button"
            onClick={restart}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-800/70"
          >
            <RotateCcw aria-hidden className="size-4" />
            {L.restart}
          </button>
        )}
      </div>
    );
  }

  /* ---------- Form ---------- */

  const step = isReview ? null : steps[current];
  const primaryLabel =
    current === lastIndex
      ? L.submit
      : fromReview && showReview
        ? L.returnToReview
        : current === reviewIndex - 1
          ? L.toReview
          : L.next;

  return (
    <div
      className={cn(
        "@container w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
        className,
      )}
    >
      <style href="lofi-multi-step-form" precedence="default">
        {STYLE}
      </style>

      {/* Progress header */}
      <div className="border-b border-zinc-200 px-5 pb-4 pt-5 @lg:px-7 dark:border-zinc-800">
        {title && <p className="mb-3 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</p>}
        <p className="text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400" aria-hidden>
          {L.stepOf(current + 1, total)}
          <span className="@xl:hidden"> · {stepTitle(current)}</span>
        </p>
        <nav aria-label={L.progress} className="mt-3">
          <ol className="flex gap-1.5">
            {Array.from({ length: total }, (_, i) => {
              const isCurrent = i === current;
              const done = i < current || (i <= visited && i !== current);
              const clickable = !isCurrent && i <= visited && !submitting;
              const content = (
                <>
                  <span
                    aria-hidden
                    className="relative block h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                  >
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full bg-indigo-600 transition-[width] duration-500 ease-out motion-reduce:transition-none dark:bg-indigo-400",
                        i < current || (done && !isCurrent) ? "w-full" : isCurrent ? "w-1/2" : "w-0",
                      )}
                    />
                  </span>
                  <span className="mt-2 flex min-w-0 items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors motion-reduce:transition-none",
                        isCurrent
                          ? "bg-indigo-600 text-white dark:bg-indigo-400 dark:text-zinc-950"
                          : done
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                      )}
                    >
                      {done && !isCurrent ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "hidden truncate text-xs @xl:inline",
                        isCurrent ? "font-semibold text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400",
                        clickable && "group-hover:text-indigo-700 group-hover:underline underline-offset-2 dark:group-hover:text-indigo-300",
                      )}
                    >
                      {stepTitle(i)}
                    </span>
                    <span className="sr-only @xl:hidden">{stepTitle(i)}</span>
                    {done && !isCurrent && <span className="sr-only">, {L.completed}</span>}
                  </span>
                </>
              );
              return (
                <li key={i} className="min-w-0 flex-1" aria-current={isCurrent ? "step" : undefined}>
                  {clickable ? (
                    <button
                      type="button"
                      onClick={() => jump(i)}
                      className="group block min-h-10 w-full rounded-md pb-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                    >
                      {content}
                    </button>
                  ) : (
                    <span className={cn("block min-h-10 pb-1", !isCurrent && "opacity-80")}>{content}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <form noValidate onSubmit={onFormSubmit} aria-labelledby={headingId} aria-busy={submitting || validating || undefined}>
        <div className="overflow-hidden">
          <div
            key={isReview ? "__review" : step!.id}
            className={cn(
              "px-5 py-6 @lg:px-7",
              direction === "next" && "lofi-multi-step-form-next",
              direction === "prev" && "lofi-multi-step-form-prev",
            )}
          >
            <h3
              id={headingId}
              ref={headingRef}
              tabIndex={-1}
              className="w-fit rounded text-lg font-semibold tracking-tight text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-zinc-50 dark:focus-visible:ring-offset-zinc-900"
            >
              <span className="sr-only">{L.stepOf(current + 1, total)}: </span>
              {stepTitle(current)}
            </h3>
            {(isReview ? L.reviewDescription : step?.description) && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{isReview ? L.reviewDescription : step?.description}</p>
            )}

            <fieldset disabled={submitting} className="mt-5 min-w-0 border-0 p-0">
              {isReview ? (
                <ul className="flex flex-col gap-3">
                  {steps.map((s, i) => {
                    const rows = s.summary?.(values) ?? [];
                    return (
                      <li key={s.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</p>
                          <button
                            type="button"
                            onClick={() => edit(i)}
                            aria-label={`${L.edit} ${s.title}`}
                            className="-mr-2 inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-indigo-700 outline-none hover:bg-indigo-50 hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
                          >
                            <Pencil aria-hidden className="size-3.5" />
                            {L.edit}
                          </button>
                        </div>
                        {rows.length > 0 ? (
                          <dl className="mt-2 grid gap-x-6 gap-y-2 @md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
                            {rows.map((r) => (
                              <div key={r.label} className="contents">
                                <dt className="text-zinc-500 dark:text-zinc-400">{r.label}</dt>
                                <dd className="-mt-1.5 break-words font-medium text-zinc-900 @md:mt-0 dark:text-zinc-100">{r.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="mt-2 text-zinc-500 dark:text-zinc-400">{L.noSummary}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                step!.render(ctx)
              )}
            </fieldset>
          </div>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mx-5 mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-800 @lg:mx-7 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          >
            <CircleAlert aria-hidden className="mt-px size-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/70 px-5 py-4 @lg:px-7 dark:border-zinc-800 dark:bg-zinc-950/30">
          {current > 0 ? (
            <button
              type="button"
              onClick={back}
              disabled={submitting}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-zinc-700 outline-none hover:bg-zinc-200/60 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-800/70"
            >
              <ArrowLeft aria-hidden className="size-4" />
              {L.back}
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            aria-disabled={submitting || validating || undefined}
            className={cn(
              "group inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm outline-none transition-[background-color,transform] motion-reduce:transition-none",
              "hover:bg-indigo-700 active:scale-[0.98] active:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600 dark:focus-visible:ring-offset-zinc-900",
              (submitting || validating) && "cursor-progress",
            )}
          >
            {submitting || validating ? (
              <>
                <LoaderCircle aria-hidden className="size-4 motion-safe:animate-spin" />
                {submitting ? L.submitting : L.validating}
              </>
            ) : (
              <>
                {primaryLabel}
                {current === lastIndex ? (
                  <Check aria-hidden className="size-4" />
                ) : (
                  <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                )}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
