"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { AlertCircle, ArrowBigUpDash, Check, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Scoring (pure, framework free) ---------- */

/** 0 = empty, 1 Weak, 2 Fair, 3 Good, 4 Strong. */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export interface PasswordChecks {
  /** Length in characters (code points, so emoji count once). */
  length: number;
  lower: boolean;
  upper: boolean;
  number: boolean;
  /** Anything that is not a letter or digit, including spaces in passphrases. */
  symbol: boolean;
  /** Matches the common-password list, also after stripping trailing digits/symbols and undoing l33t swaps. */
  common: boolean;
  /** Three or more of the same character in a row, e.g. "aaa". */
  repeated: boolean;
  /** Three or more consecutive characters, e.g. "abc" or "321". */
  sequential: boolean;
}

export interface PasswordScore {
  score: PasswordStrength;
  checks: PasswordChecks;
}

export interface ScorePasswordOptions {
  /** Passwords that are always scored Weak. Compared case-insensitively. */
  commonPasswords?: readonly string[];
}

/** A short list of the most leaked passwords. Pass your own list for stricter checks. */
export const DEFAULT_COMMON_PASSWORDS: readonly string[] = [
  "password", "123456", "123456789", "12345678", "12345", "1234567", "qwerty", "qwerty123", "abc123",
  "password1", "111111", "123123", "000000", "654321", "iloveyou", "admin", "welcome", "letmein",
  "monkey", "dragon", "football", "baseball", "sunshine", "princess", "trustno1", "superman",
  "master", "hello", "freedom", "whatever", "login", "starwars", "shadow", "michael", "1q2w3e4r",
  "zaq12wsx", "qwertyuiop", "asdfghjkl", "changeme", "secret", "summer", "winter", "access",
];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i" };

function hasSequence(value: string) {
  const codes = [...value.toLowerCase()].map((c) => c.codePointAt(0) ?? 0);
  for (let i = 2; i < codes.length; i++) {
    const a = codes[i - 2];
    const b = codes[i - 1];
    const c = codes[i];
    const alnum = [a, b, c].every((x) => (x >= 48 && x <= 57) || (x >= 97 && x <= 122));
    if (alnum && b - a === c - b && Math.abs(b - a) === 1) return true;
  }
  return false;
}

/**
 * Scores a password from 0 (empty) to 4 (Strong) using length, character variety,
 * repeats, sequences and a common-password list. Pure: same input, same output.
 */
export function scorePassword(password: string, options: ScorePasswordOptions = {}): PasswordScore {
  const list = options.commonPasswords ?? DEFAULT_COMMON_PASSWORDS;
  const common = new Set(list.map((p) => p.toLowerCase()));
  const length = [...password].length;
  const lowered = password.toLowerCase();
  const stripped = lowered.replace(/[^a-z]+$/, "");
  const unleet = (s: string) => s.replace(/[013457@$!]/g, (c) => LEET[c] ?? c);
  const candidates = [lowered, stripped, unleet(lowered), unleet(lowered).replace(/[^a-z]+$/, "")];

  const checks: PasswordChecks = {
    length,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    common: length > 0 && candidates.some((c) => c.length >= 4 && common.has(c)),
    repeated: /(.)\1\1/.test(password),
    sequential: hasSequence(password),
  };

  if (length === 0) return { score: 0, checks };

  const lengthPoints = length >= 20 ? 4 : length >= 16 ? 3 : length >= 12 ? 2 : length >= 8 ? 1 : 0;
  const classes = [checks.lower, checks.upper, checks.number, checks.symbol].filter(Boolean).length;
  const total = lengthPoints + Math.max(0, classes - 1) - (checks.repeated ? 1 : 0) - (checks.sequential ? 1 : 0);

  let score: PasswordStrength = total >= 5 ? 4 : total >= 4 ? 3 : total >= 2 ? 2 : 1;
  if (length < 6) score = 1;
  else if (length < 8) score = Math.min(score, 2) as PasswordStrength;
  if (checks.common) score = 1;
  return { score, checks };
}

/* ---------- Component ---------- */

export interface PasswordRule {
  id: string;
  /** Shown in the checklist, e.g. "At least 8 characters". */
  label: string;
  /** Returns true when the password satisfies the rule. */
  test: (value: string) => boolean;
}

export interface PasswordStrengthResult {
  score: PasswordStrength;
  /** Strength label for the score, or the empty text. */
  label: string;
  /** Every rule passes and the score reaches minStrength (and the confirm field matches, when shown). */
  valid: boolean;
  /** Ids of rules that pass. */
  passedRules: string[];
}

/** Default checklist: 8+ characters, lower and upper case, a number and a symbol. */
export const DEFAULT_PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "At least 8 characters", test: (v) => [...v].length >= 8 },
  { id: "lower", label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "A number", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "A symbol, e.g. ! ? #", test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

export interface PasswordStrengthInputProps {
  /** Visible field label. */
  label: string;
  /** Current password (controlled). */
  value?: string;
  /** Initial password (uncontrolled). */
  defaultValue?: string;
  /** Called on every change with the new value and its strength result. */
  onChange: (value: string, result: PasswordStrengthResult) => void;
  /** Checklist rules. Defaults to DEFAULT_PASSWORD_RULES. */
  rules?: PasswordRule[];
  /** Show the rules checklist under the meter. */
  showChecklist?: boolean;
  /** Lowest acceptable score (1 Weak … 4 Strong). Marked on the meter. */
  minStrength?: 1 | 2 | 3 | 4;
  /** Adds a confirm field that shows match / no match. */
  confirm?: boolean;
  /** Confirm value (controlled). */
  confirmValue?: string;
  /** Initial confirm value (uncontrolled). */
  defaultConfirmValue?: string;
  /** Called when the confirm field changes. */
  onConfirmChange?: (value: string, matches: boolean) => void;
  /** Error message, e.g. from the server. Marks the field invalid. */
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /** Hint under the label. */
  description?: string;
  /** Input id. Generated when omitted. */
  id?: string;
  name?: string;
  confirmName?: string;
  placeholder?: string;
  autoComplete?: string;
  /** Options passed to scorePassword, e.g. a bigger commonPasswords list. */
  scoreOptions?: ScorePasswordOptions;
  /** Labels for scores 1 to 4. */
  strengthLabels?: [weak: string, fair: string, good: string, strong: string];
  /** Accessible name of the meter. */
  meterLabel?: string;
  /** Meter text while the field is empty. */
  emptyText?: string;
  /** Hint shown while the score is below minStrength. */
  minStrengthText?: (requiredLabel: string) => string;
  /** Accessible name of the show/hide toggle. Its pressed state says whether the password is visible. */
  toggleLabel?: string;
  capsLockText?: string;
  confirmLabel?: string;
  matchText?: string;
  mismatchText?: string;
  /** Heading above the checklist. */
  checklistLabel?: string;
  /** Screen reader suffixes for checklist items. */
  ruleMetText?: string;
  ruleUnmetText?: string;
  /** Milliseconds of quiet typing before the strength is announced. */
  announceDelay?: number;
  className?: string;
}

const LEVELS = [
  { bar: "", text: "text-zinc-500 dark:text-zinc-400" },
  { bar: "bg-rose-500 dark:bg-rose-400", text: "text-rose-700 dark:text-rose-300" },
  { bar: "bg-amber-500 dark:bg-amber-400", text: "text-amber-700 dark:text-amber-300" },
  { bar: "bg-sky-500 dark:bg-sky-400", text: "text-sky-700 dark:text-sky-300" },
  { bar: "bg-emerald-500 dark:bg-emerald-400", text: "text-emerald-700 dark:text-emerald-300" },
] as const;

const fieldClass = (invalid: boolean) =>
  cn(
    "h-11 w-full rounded-lg border bg-white pl-3 pr-12 text-sm text-zinc-900 outline-none transition-[border-color,box-shadow] motion-reduce:transition-none",
    "placeholder:text-zinc-400 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500",
    "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:disabled:bg-zinc-900",
    invalid
      ? "border-rose-500 focus-visible:ring-4 focus-visible:ring-rose-500/20 dark:border-rose-400"
      : "border-zinc-300 hover:border-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/20 dark:border-zinc-700 dark:hover:border-zinc-600 dark:focus-visible:border-indigo-400",
  );

export function PasswordStrengthInput({
  label,
  value: valueProp,
  defaultValue = "",
  onChange,
  rules = DEFAULT_PASSWORD_RULES,
  showChecklist = true,
  minStrength = 3,
  confirm = false,
  confirmValue: confirmProp,
  defaultConfirmValue = "",
  onConfirmChange,
  error,
  disabled = false,
  required,
  description,
  id: idProp,
  name,
  confirmName,
  placeholder,
  autoComplete = "new-password",
  scoreOptions,
  strengthLabels = ["Weak", "Fair", "Good", "Strong"],
  meterLabel = "Password strength",
  emptyText = "Not set",
  minStrengthText = (l) => `${l} or stronger required`,
  toggleLabel = "Show password",
  capsLockText = "Caps Lock is on",
  confirmLabel = "Confirm password",
  matchText = "Passwords match",
  mismatchText = "Passwords don't match",
  checklistLabel = "Your password needs",
  ruleMetText = "done",
  ruleUnmetText = "missing",
  announceDelay = 800,
  className,
}: PasswordStrengthInputProps) {
  const autoId = useId();
  const id = idProp ?? `${autoId}-pw`;
  const confirmId = `${autoId}-confirm`;
  const descId = `${autoId}-desc`;
  const errorId = `${autoId}-error`;
  const capsId = `${autoId}-caps`;
  const hintId = `${autoId}-hint`;
  const listHeadingId = `${autoId}-rules`;
  const matchId = `${autoId}-match`;

  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [innerConfirm, setInnerConfirm] = useState(defaultConfirmValue);
  const confirmValue = confirmProp ?? innerConfirm;

  const [visible, setVisible] = useState(false);
  const [capsField, setCapsField] = useState<"main" | "confirm" | null>(null);
  const [confirmBlurred, setConfirmBlurred] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const { score } = useMemo(() => scorePassword(value, scoreOptions), [value, scoreOptions]);
  const results = useMemo(() => rules.map((r) => ({ rule: r, ok: value.length > 0 && r.test(value) })), [rules, value]);
  const strengthText = score === 0 ? emptyText : strengthLabels[score - 1];
  const belowMin = value.length > 0 && score < minStrength;
  const matches = confirmValue.length > 0 && confirmValue === value;
  const showMismatch =
    confirm && confirmValue.length > 0 && !matches && (confirmBlurred || !value.startsWith(confirmValue));

  const evaluate = useCallback(
    (next: string, nextConfirm: string): PasswordStrengthResult => {
      const s = scorePassword(next, scoreOptions).score;
      const passedRules = rules.filter((r) => r.test(next)).map((r) => r.id);
      return {
        score: s,
        label: s === 0 ? emptyText : strengthLabels[s - 1],
        passedRules,
        valid: s >= minStrength && passedRules.length === rules.length && (!confirm || nextConfirm === next),
      };
    },
    [scoreOptions, rules, emptyText, strengthLabels, minStrength, confirm],
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (valueProp === undefined) setInner(next);
    const result = evaluate(next, confirmValue);
    onChange(next, result);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAnnouncement(`${meterLabel}: ${result.label}`), announceDelay);
  };

  const handleConfirm = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (confirmProp === undefined) setInnerConfirm(next);
    onConfirmChange?.(next, next.length > 0 && next === value);
  };

  const trackCaps = (field: "main" | "confirm") => (e: KeyboardEvent<HTMLInputElement>) => {
    const on = e.getModifierState("CapsLock");
    setCapsField(on ? field : null);
  };

  const describedBy = (extra: (string | false | undefined)[]) =>
    extra.filter(Boolean).join(" ") || undefined;

  const level = LEVELS[score];

  return (
    <div className={cn("@container w-full text-sm", disabled && "opacity-70", className)}>
      <label htmlFor={id} className="block font-medium text-zinc-900 dark:text-zinc-100">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-rose-600 dark:text-rose-400">
            *
          </span>
        )}
      </label>
      {description && (
        <p id={descId} className="mt-0.5 text-[13px] text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      )}

      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={handleChange}
          onKeyDown={trackCaps("main")}
          onKeyUp={trackCaps("main")}
          onBlur={() => setCapsField((f) => (f === "main" ? null : f))}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy([
            description && descId,
            error && errorId,
            capsField === "main" && capsId,
            belowMin && hintId,
            showChecklist && rules.length > 0 && listHeadingId,
          ])}
          className={fieldClass(Boolean(error))}
        />
        <button
          type="button"
          aria-pressed={visible}
          aria-label={toggleLabel}
          aria-controls={confirm ? `${id} ${confirmId}` : id}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-0.5 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 disabled:pointer-events-none motion-reduce:transition-none dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
        >
          {visible ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
        </button>
      </div>

      {capsField === "main" && <CapsWarning id={capsId} text={capsLockText} />}

      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-1.5 text-[13px] font-medium text-rose-700 dark:text-rose-300">
          <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {/* Strength meter */}
      <div className="mt-3 flex items-center gap-3">
        <div
          role="meter"
          aria-label={meterLabel}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={score}
          aria-valuetext={`${strengthText}${belowMin ? `. ${minStrengthText(strengthLabels[minStrength - 1])}` : ""}`}
          className="relative grid flex-1 grid-cols-4 gap-1.5"
        >
          {[1, 2, 3, 4].map((seg) => (
            <span key={seg} className="relative h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <span
                className={cn(
                  "absolute inset-0 origin-left rounded-full transition-[transform,background-color] duration-300 ease-out motion-reduce:transition-none",
                  score >= seg ? "scale-x-100" : "scale-x-0",
                  level.bar,
                )}
                style={{ transitionDelay: score >= seg ? `${(seg - 1) * 45}ms` : "0ms" }}
              />
            </span>
          ))}
          {/* Minimum-strength notch */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full transition-colors motion-reduce:transition-none",
              score >= minStrength ? "bg-emerald-600 dark:bg-emerald-400" : "bg-zinc-400 dark:bg-zinc-500",
              minStrength === 4 && "hidden",
            )}
            style={{ left: `calc(${minStrength * 25}% + ${1.5 * minStrength - 3}px)` }}
          />
        </div>
        <span aria-hidden className={cn("w-16 shrink-0 text-right text-xs font-semibold transition-colors", level.text)}>
          {strengthText}
        </span>
      </div>
      {belowMin && (
        <p id={hintId} className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          {minStrengthText(strengthLabels[minStrength - 1])}
        </p>
      )}

      {showChecklist && rules.length > 0 && (
        <div className="mt-3">
          <p id={listHeadingId} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {checklistLabel}
          </p>
          <ul aria-labelledby={listHeadingId} className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-1 @sm:grid-cols-2">
            {results.map(({ rule, ok }) => (
              <li
                key={rule.id}
                className={cn(
                  "flex items-center gap-2 text-[13px] transition-colors motion-reduce:transition-none",
                  ok ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-200 motion-reduce:transition-none",
                    ok
                      ? "scale-100 bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950"
                      : "scale-90 bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                  )}
                >
                  {ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={2.5} />}
                </span>
                <span>
                  {rule.label}
                  <span className="sr-only">, {ok ? ruleMetText : ruleUnmetText}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirm && (
        <div className="mt-4">
          <label htmlFor={confirmId} className="block font-medium text-zinc-900 dark:text-zinc-100">
            {confirmLabel}
            {required && (
              <span aria-hidden className="ml-0.5 text-rose-600 dark:text-rose-400">
                *
              </span>
            )}
          </label>
          <div className="relative mt-1.5">
            <input
              id={confirmId}
              name={confirmName}
              type={visible ? "text" : "password"}
              value={confirmValue}
              onChange={handleConfirm}
              onKeyDown={trackCaps("confirm")}
              onKeyUp={trackCaps("confirm")}
              onBlur={() => {
                setConfirmBlurred(true);
                setCapsField((f) => (f === "confirm" ? null : f));
              }}
              disabled={disabled}
              required={required}
              autoComplete={autoComplete}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={showMismatch || undefined}
              aria-describedby={describedBy([matchId, capsField === "confirm" && capsId])}
              className={cn(fieldClass(showMismatch), "pr-11")}
            />
            {matches && (
              <Check
                aria-hidden
                className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
              />
            )}
          </div>
          {capsField === "confirm" && <CapsWarning id={capsId} text={capsLockText} />}
          <p id={matchId} aria-live="polite" className="mt-1.5 min-h-5 text-[13px] font-medium">
            {matches && <span className="text-emerald-700 dark:text-emerald-300">{matchText}</span>}
            {showMismatch && <span className="text-rose-700 dark:text-rose-300">{mismatchText}</span>}
          </p>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function CapsWarning({ id, text }: { id: string; text: string }) {
  return (
    <p
      id={id}
      role="status"
      className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-300/70 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/30"
    >
      <ArrowBigUpDash className="size-3.5" aria-hidden />
      {text}
    </p>
  );
}
