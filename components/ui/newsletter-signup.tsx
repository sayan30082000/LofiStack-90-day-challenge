"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, CircleAlert, ExternalLink, LoaderCircle, Mail, Sparkles } from "lucide-react";
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
  /**
   * Catch typos in the email domain ("gmial.com", "hotmail.con") and offer the fix. Pass your own
   * list of domains, or false to turn it off.
   */
  suggestDomains?: string[] | false;
  /** Sender of the confirmation email, used to search for it in Gmail. */
  senderEmail?: string;
  /** On success, link to the subscriber's webmail (Gmail, Outlook, Yahoo, iCloud, Proton…) when it's known. */
  showInboxLink?: boolean;
  /** "Did you mean …?" text. */
  suggestionText?: (suggestion: string) => ReactNode;
  /** Button that accepts the suggestion. */
  acceptSuggestionText?: string;
  /** Button that keeps what was typed. */
  keepTypedText?: string;
  /** Text of the webmail link, e.g. "Open Gmail". */
  openInboxText?: (provider: string) => string;
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

/* ---------- Typo suggestions and inbox links (pure) ---------- */

/** Email providers most sign-ups use; typos of these get a suggestion. */
export const COMMON_EMAIL_DOMAINS = [
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com", "outlook.com", "live.com", "msn.com",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "zoho.com", "yandex.com", "gmx.com",
  "mail.com", "yahoo.co.uk", "hotmail.co.uk",
];
/** Known slips on common endings. Only these are fixed: .ca, .bb or .cm are real country domains. */
const TLD_TYPOS: Record<string, string> = {
  con: "com", cmo: "com", ocm: "com", cpm: "com", cim: "com", vom: "com", xom: "com", comm: "com", coom: "com",
  ner: "net", nte: "net", bet: "net", met: "net", nett: "net",
  ogr: "org", rog: "org", prg: "org", orgg: "org",
};

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

/**
 * Suggests a fix for a mistyped email domain: "jane@gmial.com" → "jane@gmail.com",
 * "jane@hotmail.con" → "jane@hotmail.com", "jane@gmailcom" → "jane@gmail.com". Returns null
 * when the domain looks right (or nothing is close enough to be sure).
 */
export function suggestEmail(email: string, domains: string[] = COMMON_EMAIL_DOMAINS): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at).trim();
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain || domains.includes(domain)) return null;
  // A known provider, one or two keystrokes away (shorter domains get less slack).
  let best: { d: string; dist: number } | null = null;
  for (const d of domains) {
    const dist = editDistance(domain, d);
    if (dist > 0 && dist <= (d.length > 6 ? 2 : 1) && (!best || dist < best.dist)) best = { d, dist };
  }
  if (best) return `${local}@${best.d}`;
  // Any domain with a known slip in its ending: example.con → example.com.
  const dot = domain.lastIndexOf(".");
  const fix = dot > 0 ? TLD_TYPOS[domain.slice(dot + 1)] : undefined;
  return fix ? `${local}@${domain.slice(0, dot)}.${fix}` : null;
}

/** Webmail for the address's provider, so the success screen can open the confirmation email. */
export function inboxFor(email: string, sender?: string): { name: string; url: string } | null {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  if (/^(gmail|googlemail)\.com$/.test(domain)) {
    const search = sender ? `#search/${encodeURIComponent(`from:${sender} in:anywhere`)}` : "#inbox";
    return { name: "Gmail", url: `https://mail.google.com/mail/u/0/${search}` };
  }
  if (/^(outlook|hotmail|live|msn)\.[a-z.]+$/.test(domain)) return { name: "Outlook", url: "https://outlook.live.com/mail/0/" };
  if (/^(yahoo\.[a-z.]+|ymail\.com)$/.test(domain)) return { name: "Yahoo Mail", url: "https://mail.yahoo.com/" };
  if (/^(icloud|me|mac)\.com$/.test(domain)) return { name: "iCloud Mail", url: "https://www.icloud.com/mail" };
  if (/^(proton\.me|protonmail\.com|pm\.me)$/.test(domain)) return { name: "Proton Mail", url: "https://mail.proton.me/" };
  if (domain === "aol.com") return { name: "AOL Mail", url: "https://mail.aol.com/" };
  if (/^zoho\.[a-z.]+$/.test(domain)) return { name: "Zoho Mail", url: "https://mail.zoho.com/" };
  if (/^yandex\.[a-z.]+$/.test(domain)) return { name: "Yandex Mail", url: "https://mail.yandex.com/" };
  return null;
}

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
  suggestDomains = COMMON_EMAIL_DOMAINS,
  senderEmail,
  showInboxLink = true,
  suggestionText = (sug) => (
    <>
      Did you mean <strong className="font-semibold">{sug}</strong>?
    </>
  ),
  acceptSuggestionText = "Yes, fix it",
  keepTypedText = "No, keep mine",
  openInboxText = (provider) => `Open ${provider}`,
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
  // The address the person chose to keep despite a suggestion, so it isn't offered again.
  const [keptEmail, setKeptEmail] = useState<string | null>(null);
  const [checkedTypo, setCheckedTypo] = useState(false);
  const suggestionId = `${uid}-suggestion`;
  const acceptRef = useRef<HTMLButtonElement>(null);

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

  const trimmed = email.trim();
  const suggestion = suggestDomains && trimmed && isValid(trimmed) && trimmed !== keptEmail ? suggestEmail(trimmed, suggestDomains) : null;
  // Shown once the person leaves the field or tries to submit, not while they're still typing.
  const showSuggestion = Boolean(suggestion && checkedTypo && status !== "success");
  const inbox = showInboxLink && subscribedEmail ? inboxFor(subscribedEmail, senderEmail) : null;

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
    if (suggestion) {
      // Ask before sending to an address that is probably mistyped.
      setCheckedTypo(true);
      setTimeout(() => acceptRef.current?.focus(), 0);
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
    setKeptEmail(null);
    setCheckedTypo(false);
    setEmail("");
    setConsent(false);
    setSubmitted(false);
    setFieldError(null);
    setConsentError(false);
    setServerError(null);
    setStatus("idle");
  };

  const isCard = variant === "card";
  const describedBy = [fieldError && errorId, showSuggestion && suggestionId, serverError && serverErrorId, footnote && footnoteId]
    .filter(Boolean)
    .join(" ");
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
              {inbox && (
                <a
                  href={inbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex h-10 w-fit items-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm outline-none hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:ring-offset-zinc-900"
                >
                  {openInboxText(inbox.name)}
                  <ExternalLink aria-hidden className="size-4" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              <button
                type="button"
                onClick={reset}
                className="-ml-2 mt-1.5 flex min-h-10 w-fit items-center rounded-md px-2 font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-4 outline-none hover:text-indigo-900 hover:decoration-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 active:text-indigo-950 dark:text-indigo-300 dark:decoration-indigo-500/50 dark:hover:text-indigo-200 dark:hover:decoration-indigo-300"
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
                    setCheckedTypo(false);
                    // Once a field is flagged, clear the error as soon as the value becomes valid.
                    if (fieldError && !check(e.target.value)) setFieldError(null);
                    if (status === "error") {
                      setStatus("idle");
                      setServerError(null);
                    }
                  }}
                  onBlur={() => {
                    if (submitted) setFieldError(check(email));
                    setCheckedTypo(true);
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
                    : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:active:bg-indigo-600",
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

            {/* Always present, so the suggestion is announced when it appears. */}
            <div role="status">
              {showSuggestion && suggestion && (
                <div
                  id={suggestionId}
                  className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-400/10 dark:text-amber-100"
                >
                  <Sparkles aria-hidden className="size-4 shrink-0" />
                  <span className="min-w-0">{suggestionText(suggestion)}</span>
                  <span className="flex gap-1">
                    <button
                      ref={acceptRef}
                      type="button"
                      onClick={() => {
                        setEmail(suggestion);
                        setFieldError(null);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex min-h-8 items-center rounded-md bg-amber-900 px-2.5 font-semibold text-white outline-none hover:bg-amber-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:bg-amber-300 dark:text-amber-950 dark:hover:bg-amber-200"
                    >
                      {acceptSuggestionText}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKeptEmail(trimmed);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex min-h-8 items-center rounded-md px-2 font-medium text-amber-900 underline underline-offset-2 outline-none hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-amber-100 dark:hover:bg-amber-400/15"
                    >
                      {keepTypedText}
                    </button>
                  </span>
                </div>
              )}
            </div>

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
