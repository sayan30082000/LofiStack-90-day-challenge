"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, CircleAlert, LoaderCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export type NewsletterSignupStatus = "idle" | "submitting" | "success" | "error";
export type NewsletterSignupVariant = "inline" | "card";

export interface NewsletterSignupProps {
  /** Called with the trimmed email. Resolve to show the success screen, reject to show the error state. */
  onSubscribe: (email: string) => Promise<void>;
  /** Heading above the form. The card variant shows it large, the inline variant small. */
  title?: ReactNode;
  /** Supporting copy under the title. */
  description?: ReactNode;
  /** Heading element used for the title. */
  titleAs?: "h2" | "h3" | "h4" | "p";
  /** Visually hidden label of the email field. */
  label?: string;
  placeholder?: string;
  buttonText?: string;
  /** Button text while the request is in flight. */
  submittingText?: string;
  /** Button text after a failed request. */
  retryText?: string;
  /** Title of the confirmation that replaces the form. */
  successTitle?: ReactNode;
  /** Confirmation body. A function receives the email that was subscribed. */
  successMessage?: ReactNode | ((email: string) => ReactNode);
  /** Text of the link that brings the form back. */
  resetText?: string;
  /** Shows a consent checkbox that must be ticked before subscribing. */
  requireConsent?: boolean;
  /** Label of the consent checkbox. Can contain links. */
  consentLabel?: ReactNode;
  /** Shown when the email is empty. */
  emptyErrorText?: string;
  /** Shown when the email is not valid. */
  invalidErrorText?: string;
  /** Shown when consent is required but not given. */
  consentErrorText?: string;
  /** Fallback when onSubscribe rejects without an Error message. */
  errorText?: string;
  /** Custom email check. Return true when the value is valid. */
  validate?: (email: string) => boolean;
  /** Small print under the form, e.g. "No spam. Unsubscribe anytime." */
  footnote?: ReactNode;
  /** Icon shown in the card variant's badge. */
  icon?: ReactNode;
  /** card: framed panel with icon and heading. inline: a bare row that fits a footer or sidebar. */
  variant?: NewsletterSignupVariant;
  disabled?: boolean;
  className?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STYLE = `
@keyframes lofi-newsletter-signup-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}
@keyframes lofi-newsletter-signup-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
@keyframes lofi-newsletter-signup-pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); }
}
@keyframes lofi-newsletter-signup-rise {
  from { transform: translateY(6px); opacity: 0; }
  to { transform: none; opacity: 1; }
}
.lofi-newsletter-signup-shake { animation: lofi-newsletter-signup-shake 360ms ease-in-out; }
.lofi-newsletter-signup-pop { animation: lofi-newsletter-signup-pop 420ms cubic-bezier(.2,.9,.3,1.2) both; }
.lofi-newsletter-signup-draw { stroke-dasharray: 1; animation: lofi-newsletter-signup-draw 420ms 220ms ease-out both; }
.lofi-newsletter-signup-rise { animation: lofi-newsletter-signup-rise 320ms 120ms ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .lofi-newsletter-signup-shake, .lofi-newsletter-signup-pop, .lofi-newsletter-signup-draw, .lofi-newsletter-signup-rise { animation: none; }
  .lofi-newsletter-signup-draw { stroke-dasharray: none; }
}
`;

function errorMessageOf(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

export function NewsletterSignup({
  onSubscribe,
  title,
  description,
  titleAs: TitleTag = "h3",
  label = "Email address",
  placeholder = "you@example.com",
  buttonText = "Subscribe",
  submittingText = "Subscribing…",
  retryText = "Try again",
  successTitle = "You're on the list",
  successMessage = (email: string) => (
    <>
      We sent a confirmation link to <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</strong>.
      Click it to start getting issues.
    </>
  ),
  resetText = "Use another email",
  requireConsent = false,
  consentLabel = "I agree to receive emails and accept the privacy policy.",
  emptyErrorText = "Enter your email address.",
  invalidErrorText = "Enter a valid email, like name@example.com.",
  consentErrorText = "Please tick the box to continue.",
  errorText = "Something went wrong. Please try again.",
  validate,
  footnote,
  icon,
  variant = "card",
  disabled = false,
  className,
}: NewsletterSignupProps) {
  const uid = useId();
  const inputId = `${uid}-email`;
  const errorId = `${uid}-error`;
  const consentId = `${uid}-consent`;
  const consentErrorId = `${uid}-consent-error`;
  const serverErrorId = `${uid}-server-error`;
  const titleId = `${uid}-title`;
  const footnoteId = `${uid}-footnote`;

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<NewsletterSignupStatus>("idle");
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [shake, setShake] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const focusAfterReset = useRef(false);

  const isValid = (value: string) => (validate ? validate(value) : EMAIL_RE.test(value));
  const check = (value: string) => {
    const v = value.trim();
    if (!v) return emptyErrorText;
    return isValid(v) ? null : invalidErrorText;
  };

  // Move focus to the confirmation when it appears, and back to the field after "Use another email".
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
    else if (focusAfterReset.current) {
      focusAfterReset.current = false;
      inputRef.current?.focus();
    }
  }, [status]);

  const submitting = status === "submitting";
  const locked = disabled || submitting;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (locked) return;
    setSubmitted(true);
    const err = check(email);
    const consentMissing = requireConsent && !consent;
    setFieldError(err);
    setConsentError(consentMissing);
    if (err || consentMissing) {
      setShake(true);
      if (err) inputRef.current?.focus();
      else document.getElementById(consentId)?.focus();
      return;
    }
    const value = email.trim();
    setServerError(null);
    setStatus("submitting");
    try {
      await onSubscribe(value);
      setSubscribedEmail(value);
      setStatus("success");
    } catch (error) {
      setServerError(errorMessageOf(error, errorText));
      setStatus("error");
      setShake(true);
    }
  };

  const reset = () => {
    focusAfterReset.current = true;
    setEmail("");
    setConsent(false);
    setSubmitted(false);
    setFieldError(null);
    setConsentError(false);
    setServerError(null);
    setStatus("idle");
  };

  const isCard = variant === "card";
  const describedBy = [fieldError && errorId, serverError && serverErrorId, footnote && footnoteId].filter(Boolean).join(" ");
  const hasError = Boolean(fieldError) || status === "error";
  const message = typeof successMessage === "function" ? successMessage(subscribedEmail) : successMessage;

  return (
    <div
      className={cn(
        "@container w-full text-sm text-zinc-700 dark:text-zinc-300",
        isCard &&
          "relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <style href="lofi-newsletter-signup" precedence="default">
        {STYLE}
      </style>
      {isCard && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-indigo-500/10 blur-2xl dark:bg-indigo-400/10"
        />
      )}

      {/* Persistent live region so the confirmation is announced when it appears. */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {status === "success" && (
          <div
            ref={successRef}
            tabIndex={-1}
            className={cn(
              "relative flex gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
              isCard ? "flex-col items-start @md:flex-row" : "items-start",
            )}
          >
            <span
              aria-hidden
              className="lofi-newsletter-signup-pop inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/5"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} className="lofi-newsletter-signup-draw" />
              </svg>
            </span>
            <div className="lofi-newsletter-signup-rise min-w-0">
              <p className={cn("font-semibold text-zinc-900 dark:text-zinc-50", isCard ? "text-lg" : "text-base")}>{successTitle}</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{message}</p>
              <button
                type="button"
                onClick={reset}
                className="-ml-2 mt-1.5 inline-flex min-h-10 items-center rounded-md px-2 font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-4 outline-none hover:text-indigo-900 hover:decoration-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 active:text-indigo-950 dark:text-indigo-300 dark:decoration-indigo-500/50 dark:hover:text-indigo-200 dark:hover:decoration-indigo-300"
              >
                {resetText}
              </button>
            </div>
          </div>
        )}
      </div>

      {status !== "success" && (
        <div className="relative">
          {(title || description) && (
            <div className={cn(isCard ? "mb-5" : "mb-3")}>
              {isCard && (
                <span
                  aria-hidden
                  className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                >
                  {icon ?? <Mail className="size-5" />}
                </span>
              )}
              {title && (
                <TitleTag
                  id={titleId}
                  className={cn(
                    "font-semibold tracking-tight text-zinc-900 dark:text-zinc-50",
                    isCard ? "text-xl text-balance" : "text-base",
                  )}
                >
                  {title}
                </TitleTag>
              )}
              {description && <p className={cn("text-zinc-600 dark:text-zinc-400", title && "mt-1.5")}>{description}</p>}
            </div>
          )}

          <form
            noValidate
            onSubmit={onSubmit}
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : label}
            aria-busy={submitting || undefined}
          >
            <div
              onAnimationEnd={() => setShake(false)}
              className={cn("flex flex-col gap-2 @sm:flex-row", shake && "lofi-newsletter-signup-shake")}
            >
              <label htmlFor={inputId} className="sr-only">
                {label}
              </label>
              <div className="relative min-w-0 flex-1">
                <Mail
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 transition-colors motion-reduce:transition-none",
                    hasError ? "text-rose-500 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400",
                  )}
                />
                <input
                  ref={inputRef}
                  id={inputId}
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  placeholder={placeholder}
                  disabled={disabled}
                  readOnly={submitting}
                  aria-invalid={fieldError ? true : undefined}
                  aria-describedby={describedBy || undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Once a field is flagged, clear the error as soon as the value becomes valid.
                    if (fieldError && !check(e.target.value)) setFieldError(null);
                    if (status === "error") {
                      setStatus("idle");
                      setServerError(null);
                    }
                  }}
                  onBlur={() => {
                    if (submitted) setFieldError(check(email));
                  }}
                  className={cn(
                    "h-11 w-full rounded-lg border bg-white pl-9 pr-3 text-[15px] text-zinc-900 shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-zinc-500 motion-reduce:transition-none sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400",
                    "hover:border-zinc-400 dark:hover:border-zinc-600",
                    "focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/20 dark:focus-visible:border-indigo-400",
                    "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 disabled:hover:border-zinc-300 dark:disabled:bg-zinc-800/60 dark:disabled:hover:border-zinc-700",
                    "read-only:text-zinc-500 dark:read-only:text-zinc-400",
                    hasError
                      ? "border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500/20 dark:border-rose-400 dark:focus-visible:border-rose-400"
                      : "border-zinc-300 dark:border-zinc-700",
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={disabled}
                aria-disabled={submitting || undefined}
                className={cn(
                  "group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm outline-none transition-[background-color,transform] motion-reduce:transition-none",
                  "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
                  "disabled:cursor-not-allowed",
                  status === "error"
                    ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500"
                    : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600",
                  disabled && "bg-zinc-300 text-zinc-600 shadow-none hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700",
                  submitting && "cursor-progress",
                )}
              >
                {submitting ? (
                  <>
                    <LoaderCircle aria-hidden className="size-4 motion-safe:animate-spin" />
                    {submittingText}
                  </>
                ) : (
                  <>
                    {status === "error" ? retryText : buttonText}
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none group-disabled:translate-x-0"
                    />
                  </>
                )}
              </button>
            </div>

            {fieldError && (
              <p id={errorId} className="mt-2 flex items-start gap-1.5 text-[13px] font-medium text-rose-700 dark:text-rose-400">
                <CircleAlert aria-hidden className="mt-px size-4 shrink-0" />
                {fieldError}
              </p>
            )}

            {serverError && (
              <div
                id={serverErrorId}
                role="alert"
                className="mt-3 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
              >
                <CircleAlert aria-hidden className="mt-px size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{serverError}</span>
              </div>
            )}

            {requireConsent && (
              <div className="mt-3">
                <label htmlFor={consentId} className={cn("group flex min-h-10 items-start gap-3 py-1", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
                  <input
                    id={consentId}
                    type="checkbox"
                    checked={consent}
                    disabled={locked}
                    aria-invalid={consentError ? true : undefined}
                    aria-describedby={consentError ? consentErrorId : undefined}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (e.target.checked) setConsentError(false);
                    }}
                    className={cn(
                      "mt-0.5 size-[18px] shrink-0 cursor-[inherit] rounded accent-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:accent-indigo-400 dark:focus-visible:ring-offset-zinc-900",
                      consentError && "outline-2 outline-offset-1 outline-rose-500",
                    )}
                  />
                  <span className="text-[13px] leading-5 text-zinc-600 dark:text-zinc-400">{consentLabel}</span>
                </label>
                {consentError && (
                  <p id={consentErrorId} className="ml-[30px] flex items-start gap-1.5 text-[13px] font-medium text-rose-700 dark:text-rose-400">
                    {consentErrorText}
                  </p>
                )}
              </div>
            )}

            {footnote && (
              <p id={footnoteId} className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {footnote}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
