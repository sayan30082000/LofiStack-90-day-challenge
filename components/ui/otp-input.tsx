"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { AlertCircle, CheckCircle2, RotateCw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export type OtpType = "numeric" | "alphanumeric";

export interface OtpInputProps {
  /** Number of boxes. */
  length?: number;
  /** Current code (controlled). Characters fill the boxes left to right. */
  value?: string;
  /** Initial code (uncontrolled). */
  defaultValue?: string;
  /** Fired on every change with the code typed so far. */
  onChange?: (value: string) => void;
  /** Fired when every box is filled. */
  onComplete?: (value: string) => void;
  /** numeric accepts 0-9; alphanumeric accepts letters and digits. */
  type?: OtpType;
  /** Show dots instead of characters (uses password inputs). */
  mask?: boolean;
  /** Error message. Turns the boxes red, shakes them and is linked with aria-describedby. */
  error?: string;
  /** Green success state. */
  success?: boolean;
  /** Message shown in the success state. */
  successMessage?: string;
  disabled?: boolean;
  /** Read-only with a shimmer while the code is being verified. */
  loading?: boolean;
  /** Focus the first empty box on mount. */
  autoFocus?: boolean;
  /** Uppercase letters in alphanumeric mode. */
  uppercase?: boolean;
  /** Insert a separator after every n boxes, e.g. 3 for "123-456". 0 turns it off. */
  groupSize?: number;
  /** Accessible name of the whole group. */
  label?: string;
  /** Accessible label of each box. */
  boxLabel?: (index: number, length: number) => string;
  /** Character used for masked boxes. */
  maskChar?: string;
  /** Submitted with forms through a hidden input. */
  name?: string;
  size?: "md" | "lg";
  /** Pull the code out of a pasted SMS or email ("Your code is 482 913…"). */
  smartPaste?: boolean;
  /** On Android Chrome, read the code straight from the SMS with the WebOTP API. */
  webOtp?: boolean;
  /** When the code stops working (epoch ms). Shows a countdown and locks the boxes after. */
  expiresAt?: number;
  /** Called once when expiresAt passes. */
  onExpire?: () => void;
  /** Shows a Resend button after a cooldown. Return a promise to show a spinner. */
  onResend?: () => void | Promise<void>;
  /** Seconds to wait before each resend; the last value repeats. Grows so codes can't be spammed. */
  resendCooldowns?: number[];
  /** Attempts the person has left. Warns at 2 or fewer. */
  attemptsLeft?: number;
  /** Wording for the timer, resend and attempts lines. */
  otpLabels?: Partial<OtpLabels>;
  className?: string;
}

export interface OtpLabels {
  expiresIn: (time: string) => string;
  expired: string;
  resendIn: (time: string) => string;
  resend: string;
  resending: string;
  attemptsLeft: (n: number) => string;
  /** Announced when a code is found in pasted text or read from SMS. */
  filledFrom: (source: "paste" | "sms") => string;
}

export const DEFAULT_OTP_LABELS: OtpLabels = {
  expiresIn: (t) => `Code expires in ${t}`,
  expired: "This code has expired. Request a new one.",
  resendIn: (t) => `Resend code in ${t}`,
  resend: "Resend code",
  resending: "Sending…",
  attemptsLeft: (n) => (n === 1 ? "1 attempt left" : `${n} attempts left`),
  filledFrom: (s) => (s === "sms" ? "Code filled in from your SMS." : "Code found in the pasted message."),
};

const CODE_WORDS = /(code|otp|pin|passcode|verification|verify|one[- ]time|কোড|ওটিপি)/i;

/**
 * Finds a one-time code inside free text, e.g. "Your Lofi code is 482 913. Don't share it."
 * Accepts digits split by a space or dash ("482-913"); prefers the candidate closest to a word like
 * "code" or "OTP", and never picks a longer number (a phone number or amount) by truncating it.
 */
export function extractOtp(text: string, length: number, type: OtpType = "numeric"): string | null {
  const unit = type === "numeric" ? "[0-9]" : "[A-Za-z0-9]";
  // Runs of code characters with optional single space/dash separators.
  const re = new RegExp(`(?<![A-Za-z0-9])${unit}(?:[ -]?${unit})*(?![A-Za-z0-9])`, "g");
  const keyword = text.search(CODE_WORDS);
  let best: { code: string; score: number } | null = null;
  for (const m of text.matchAll(re)) {
    // "482 913" is one code, and "482913 5 min" is a code followed by another number, so take the
    // leading groups that add up to the code length. Never from the middle: in "+880 1712 345678"
    // the last group is part of a phone number, not a code.
    const groups = m[0].split(/[ -]/);
    let code = "";
    for (const g of groups) {
      code += g;
      if (code.length >= length) break;
    }
    if (code.length !== length) continue;
    // Alphanumeric codes still need at least one digit, so plain words don't count.
    if (type === "alphanumeric" && !/\d/.test(code)) continue;
    const score = keyword < 0 ? -m.index : -Math.abs(m.index - keyword);
    if (!best || score > best.score) best = { code, score };
  }
  return best ? (type === "alphanumeric" ? best.code.toUpperCase() : best.code) : null;
}

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

const SIZES = {
  md: { box: "h-12 w-10 text-lg sm:w-11", gap: "gap-1.5 sm:gap-2" },
  lg: { box: "h-14 w-11 text-2xl sm:h-16 sm:w-14", gap: "gap-2 sm:gap-3" },
} as const;

const STYLES = `
@keyframes lofi-otp-input-pop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
@keyframes lofi-otp-input-caret { 0%, 45% { opacity: 1; } 55%, 100% { opacity: 0; } }
@keyframes lofi-otp-input-shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
.lofi-otp-input-pop { animation: lofi-otp-input-pop 220ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }
.lofi-otp-input-caret { animation: lofi-otp-input-caret 1s steps(1) infinite; }
.lofi-otp-input-shimmer { animation: lofi-otp-input-shimmer 1.1s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .lofi-otp-input-pop, .lofi-otp-input-caret { animation: none; }
  .lofi-otp-input-shimmer { animation: none; opacity: 0; }
}
`;

const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-6px)" },
  { transform: "translateX(5px)" },
  { transform: "translateX(-4px)" },
  { transform: "translateX(3px)" },
  { transform: "translateX(0)" },
];

/** One-time code input: one box per character with auto-advance, paste and keyboard navigation. */
export function OtpInput({
  length = 6,
  value: valueProp,
  defaultValue = "",
  onChange,
  onComplete,
  type = "numeric",
  mask = false,
  error,
  success = false,
  successMessage,
  disabled = false,
  loading = false,
  autoFocus = false,
  uppercase = true,
  groupSize = 0,
  label = "One-time code",
  boxLabel = (i, n) => `Digit ${i} of ${n}`,
  maskChar = "•",
  name,
  size = "md",
  smartPaste = true,
  webOtp = true,
  expiresAt,
  onExpire,
  onResend,
  resendCooldowns = [30, 60, 120],
  attemptsLeft,
  otpLabels,
  className,
}: OtpInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const successId = `${id}-success`;
  const metaId = `${id}-meta`;
  const sz = SIZES[size];
  const L = { ...DEFAULT_OTP_LABELS, ...otpLabels };
  const [notice, setNotice] = useState("");

  // One clock for the expiry and resend countdowns, ticking only while one of them runs.
  const [now, setNow] = useState<number | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [resending, setResending] = useState(false);
  useEffect(() => {
    if (expiresAt === undefined && !onResend) return;
    const tick = () => setNow(Date.now());
    const t = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(t);
      clearTimeout(first);
    };
  }, [expiresAt, onResend]);
  // The first cooldown starts when the clock first ticks (the code was just sent).
  const cooldownEnd = resendAt ?? (now !== null && onResend ? now + resendCooldowns[0] * 1000 : null);
  if (onResend && resendAt === null && now !== null) setResendAt(now + resendCooldowns[0] * 1000);
  const secondsLeft = expiresAt !== undefined && now !== null ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : null;
  const expired = secondsLeft === 0;
  const resendWait = cooldownEnd !== null && now !== null ? Math.max(0, Math.ceil((cooldownEnd - now) / 1000)) : null;

  const expiredFired = useRef(false);
  useEffect(() => {
    if (!expired) {
      expiredFired.current = false;
      return;
    }
    if (expiredFired.current) return;
    expiredFired.current = true;
    onExpire?.();
  }, [expired, onExpire]);

  const resend = async () => {
    if (!onResend || resending) return;
    setResending(true);
    try {
      await onResend();
    } finally {
      setResending(false);
      const next = resendCount + 1;
      setResendCount(next);
      setResendAt(Date.now() + resendCooldowns[Math.min(next, resendCooldowns.length - 1)] * 1000);
    }
  };

  const [inner, setInner] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = (controlled ? valueProp : inner).slice(0, length);
  const [focused, setFocused] = useState<number | null>(null);

  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Set while we move focus ourselves, so the "jump to first empty box" redirect doesn't fight it.
  const programmatic = useRef(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const readOnly = loading || disabled || expired;

  const sanitize = useCallback(
    (raw: string) => {
      const re = type === "numeric" ? /[^0-9]/g : /[^a-zA-Z0-9]/g;
      const clean = raw.replace(re, "");
      return type === "alphanumeric" && uppercase ? clean.toUpperCase() : clean;
    },
    [type, uppercase],
  );

  const focusBox = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    programmatic.current = true;
    el?.focus();
    programmatic.current = false;
    el?.select();
  };

  const commit = (next: string) => {
    next = next.slice(0, length);
    if (next === value) return;
    if (!controlled) setInner(next);
    onChange?.(next);
    if (next.length === length) onComplete?.(next);
  };

  // Shake when a new error arrives.
  useEffect(() => {
    if (!error || !groupRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    groupRef.current.animate(SHAKE, { duration: 380, easing: "ease-in-out" });
  }, [error]);

  /** Writes chars starting at index i, replacing what is there. */
  const insertAt = (i: number, chars: string) => {
    const start = Math.min(i, value.length);
    const next = (value.slice(0, start) + chars + value.slice(start + chars.length)).slice(0, length);
    commit(next);
    focusBox(Math.min(start + chars.length, length - 1));
  };

  const onInput = (i: number, raw: string) => {
    if (readOnly) return;
    const current = value[i] ?? "";
    // With the box text selected, raw is just the new char; otherwise drop the old one.
    const typed = raw.length === 2 && current && raw.includes(current) ? raw.replace(current, "") : raw;
    const chars = sanitize(typed);
    if (!chars) return;
    // Autofill (e.g. iOS one-time-code) or a long input: treat a full code as a paste from the start.
    if (chars.length >= length) insertAt(0, chars.slice(0, length));
    else insertAt(i, chars);
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (readOnly) return;
    const text = e.clipboardData.getData("text");
    // A whole message ("Your code is 482 913…"): find the code instead of keeping every digit.
    const looksLikeMessage = sanitize(text).length > length || /[^\sA-Za-z0-9-]|[A-Za-z]{3,}/.test(text);
    if (smartPaste && looksLikeMessage) {
      const found = extractOtp(text, length, type);
      if (found) {
        insertAt(0, found);
        setNotice(L.filledFrom("paste"));
        return;
      }
    }
    const chars = sanitize(text);
    if (!chars) return;
    if (chars.length >= length) insertAt(0, chars.slice(0, length));
    else insertAt(i, chars);
  };

  // Android Chrome can hand over the code from an incoming SMS (WebOTP), no copying needed.
  const fillRef = useRef<(code: string) => void>(() => {});
  useEffect(() => {
    fillRef.current = (code: string) => {
      const clean = sanitize(code).slice(0, length);
      if (clean.length !== length) return;
      commit(clean);
      setNotice(L.filledFrom("sms"));
    };
  });
  useEffect(() => {
    if (!webOtp || disabled || typeof window === "undefined" || !("OTPCredential" in window)) return;
    const ac = new AbortController();
    (navigator.credentials.get({ otp: { transport: ["sms"] }, signal: ac.signal } as CredentialRequestOptions) as Promise<
      (Credential & { code?: string }) | null
    >)
      .then((cred) => cred?.code && fillRef.current(cred.code))
      .catch(() => {
        // Aborted, unsupported or no SMS: typing still works.
      });
    return () => ac.abort();
  }, [webOtp, disabled]);

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Backspace": {
        e.preventDefault();
        if (readOnly) return;
        if (value[i]) {
          // Clear this box and step back.
          commit(value.slice(0, i) + value.slice(i + 1));
          focusBox(i - 1 < 0 ? 0 : i === value.length - 1 ? i - 1 : i);
        } else if (i > 0) {
          commit(value.slice(0, i - 1) + value.slice(i));
          focusBox(i - 1);
        }
        break;
      }
      case "Delete":
        e.preventDefault();
        if (!readOnly && value[i]) commit(value.slice(0, i) + value.slice(i + 1));
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusBox(i - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        focusBox(Math.min(i + 1, value.length));
        break;
      case "Home":
        e.preventDefault();
        focusBox(0);
        break;
      case "End":
        e.preventDefault();
        focusBox(value.length);
        break;
      default:
        // Typing the same character into a filled box: move on without a change event.
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && sanitize(e.key) === value[i] && !readOnly) {
          e.preventDefault();
          focusBox(i + 1);
        }
    }
  };

  const state = error || expired ? "error" : success ? "success" : "idle";
  const showMeta = !success && (secondsLeft !== null || onResend || attemptsLeft !== undefined);
  const describedBy =
    [error ? errorId : success && successMessage ? successId : null, showMeta ? metaId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("inline-flex flex-col gap-2", className)}>
      <style href="lofi-otp-input" precedence="default">
        {STYLES}
      </style>
      <div
        ref={groupRef}
        role="group"
        aria-label={label}
        aria-busy={loading || undefined}
        className={cn("flex items-center", sz.gap)}
      >
        {Array.from({ length }, (_, i) => {
          const char = value[i] ?? "";
          const isActive = focused === i;
          const showCaret = isActive && !char && !readOnly;
          return (
            <Fragment key={i}>
              {groupSize > 0 && i > 0 && i % groupSize === 0 && (
                <span aria-hidden className="h-0.5 w-2.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              )}
              <div
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-lg border bg-white transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none dark:bg-zinc-950",
                  sz.box,
                  state === "error"
                    ? "border-rose-500 dark:border-rose-500/80"
                    : state === "success"
                      ? "border-emerald-500 bg-emerald-50/60 dark:border-emerald-500/70 dark:bg-emerald-500/5"
                      : char
                        ? "border-zinc-400 dark:border-zinc-500"
                        : "border-zinc-300 dark:border-zinc-700",
                  !readOnly && state === "idle" && "hover:border-zinc-400 dark:hover:border-zinc-500",
                  isActive &&
                    (state === "error"
                      ? "ring-4 ring-rose-500/20"
                      : state === "success"
                        ? "ring-4 ring-emerald-500/20"
                        : "border-indigo-500 ring-4 ring-indigo-500/20 dark:border-indigo-400"),
                  disabled && "cursor-not-allowed bg-zinc-100 opacity-60 dark:bg-zinc-900",
                )}
              >
                <input
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type={mask ? "password" : "text"}
                  inputMode={type === "numeric" ? "numeric" : "text"}
                  pattern={type === "numeric" ? "[0-9]*" : undefined}
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  autoCapitalize={type === "alphanumeric" && uppercase ? "characters" : "off"}
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label={boxLabel(i + 1, length)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={describedBy}
                  disabled={disabled}
                  readOnly={loading || expired}
                  autoFocus={autoFocus && i === Math.min(value.length, length - 1)}
                  value={char}
                  onChange={(e) => onInput(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  onPaste={(e) => onPaste(i, e)}
                  onFocus={(e) => {
                    // Boxes fill in order: jump to the first empty box.
                    if (i > value.length && !programmatic.current) {
                      focusBox(value.length);
                      return;
                    }
                    setFocused(i);
                    e.target.select();
                  }}
                  onBlur={() => setFocused((f) => (f === i ? null : f))}
                  className={cn(
                    "absolute inset-0 size-full bg-transparent text-center text-transparent caret-transparent outline-none selection:bg-transparent",
                    disabled ? "cursor-not-allowed" : "cursor-text",
                  )}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  {char && (
                    <span key={char} className="lofi-otp-input-pop">
                      {mask ? maskChar : char}
                    </span>
                  )}
                  {showCaret && <span className="lofi-otp-input-caret h-1/2 w-0.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />}
                </span>
                {loading && (
                  <span
                    aria-hidden
                    className="lofi-otp-input-shimmer pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent dark:via-indigo-400/20"
                    style={{ animationDelay: `${i * 70}ms` }}
                  />
                )}
              </div>
            </Fragment>
          );
        })}
      </div>

      {name && <input type="hidden" name={name} value={value} />}

      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-sm text-rose-700 dark:text-rose-400">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {!error && success && successMessage && (
        <p id={successId} role="status" className="flex items-start gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          {successMessage}
        </p>
      )}

      {showMeta && (
        <div id={metaId} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {secondsLeft !== null &&
            (expired ? (
              <p className="flex items-center gap-1.5 font-medium text-rose-700 dark:text-rose-400">
                <AlertCircle className="size-4 shrink-0" aria-hidden />
                {L.expired}
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <Timer className="size-4 shrink-0" aria-hidden />
                <span className={cn("tabular-nums", secondsLeft <= 30 && "font-medium text-amber-700 dark:text-amber-400")}>
                  {L.expiresIn(fmtClock(secondsLeft))}
                </span>
              </p>
            ))}
          {attemptsLeft !== undefined && attemptsLeft <= 2 && (
            <p className="font-medium text-amber-700 dark:text-amber-400">{L.attemptsLeft(attemptsLeft)}</p>
          )}
          {onResend &&
            (resendWait !== null && resendWait > 0 ? (
              <p className="tabular-nums text-zinc-600 dark:text-zinc-400">{L.resendIn(fmtClock(resendWait))}</p>
            ) : (
              <button
                type="button"
                onClick={resend}
                disabled={resending || resendWait === null}
                className="-mx-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 font-medium text-indigo-700 outline-none hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-progress disabled:opacity-70 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
              >
                <RotateCw className={cn("size-4", resending && "motion-safe:animate-spin")} aria-hidden />
                {resending ? L.resending : L.resend}
              </button>
            ))}
        </div>
      )}

      {/* Announces codes found in a pasted message or read from SMS. */}
      <p role="status" className="sr-only">
        {notice}
      </p>
    </div>
  );
}
