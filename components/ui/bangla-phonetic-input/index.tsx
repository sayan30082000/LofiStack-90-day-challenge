"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_BANGLA_DICTIONARY,
  suggestBangla,
  transliterateText,
  type BanglaDictionary,
} from "./transliterate";

export { DEFAULT_BANGLA_DICTIONARY, suggestBangla, transliterate, transliterateText } from "./transliterate";
export type { BanglaDictionary } from "./transliterate";

export interface BanglaPhoneticInputProps {
  /** Visible label. */
  label: string;
  /** Current text (controlled). */
  value?: string;
  /** Initial text (uncontrolled). */
  defaultValue?: string;
  /** Called with the new text after every change. */
  onChange?: (value: string) => void;
  /** Start in Bangla (true) or English (false). Ctrl+M or the toggle switches. */
  defaultBangla?: boolean;
  /** Called when the person switches language. */
  onModeChange?: (bangla: boolean) => void;
  /** Textarea instead of a single line. */
  multiline?: boolean;
  /** Visible rows when multiline. */
  rows?: number;
  /** Extra or overriding words, keyed in lowercase phonetic English, e.g. { lofistack: "লফিস্ট্যাক" }. */
  dictionary?: BanglaDictionary;
  /** Most suggestions shown for a word (the English original is always added). */
  maxSuggestions?: number;
  /** Convert English text pasted while in Bangla mode. */
  convertPaste?: boolean;
  /** Called with the Bangla word whenever a word is converted. */
  onCommit?: (word: string, roman: string) => void;
  placeholder?: string;
  /** Help text under the label. */
  hint?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  /** Labels of the language toggle. */
  banglaLabel?: string;
  englishLabel?: string;
  /** Accessible name of the language toggle. */
  toggleLabel?: string;
  /** Accessible name of the suggestion list. */
  suggestionsLabel?: string;
  /** Prefix for the English original in the suggestion list. */
  keepEnglishLabel?: string;
  className?: string;
  inputClassName?: string;
}

/** Characters that can be part of a phonetic word. Anything else ends the word. */
const WORD_CHAR = /[A-Za-z0-9^`]/;
const BANGLA_FONT = "[font-family:'Noto_Sans_Bengali','Hind_Siliguri','Nirmala_UI','Vrinda',var(--font-sans),sans-serif]";

/** The phonetic word that ends at `caret`: its start index and text, or null. */
function wordBefore(text: string, caret: number): { start: number; roman: string } | null {
  let start = caret;
  while (start > 0 && WORD_CHAR.test(text[start - 1])) start--;
  const roman = text.slice(start, caret);
  return /[A-Za-z0-9]/.test(roman) ? { start, roman } : null;
}

/**
 * Type Bangla with English letters, Avro-style: "ami tomake bhalobashi" becomes
 * "আমি তোমাকে ভালোবাসি". Each word converts when you type a space or punctuation,
 * with a suggestion bar (dictionary words first) while you type it.
 */
export function BanglaPhoneticInput({
  label,
  value: valueProp,
  defaultValue = "",
  onChange,
  defaultBangla = true,
  onModeChange,
  multiline = false,
  rows = 3,
  dictionary,
  maxSuggestions = 4,
  convertPaste = true,
  onCommit,
  placeholder = "ami tomake bhalobashi",
  hint = "Type Bangla in English letters. Space converts a word, ↑ ↓ pick another suggestion, Esc keeps English, Ctrl+M switches language.",
  name,
  id: idProp,
  disabled = false,
  required,
  banglaLabel = "বাংলা",
  englishLabel = "English",
  toggleLabel = "Type in Bangla",
  suggestionsLabel = "Bangla suggestions",
  keepEnglishLabel = "English",
  className,
  inputClassName,
}: BanglaPhoneticInputProps) {
  const autoId = useId();
  const id = idProp ?? `${autoId}-field`;
  const hintId = `${autoId}-hint`;
  const listId = `${autoId}-list`;
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const dict = useMemo(() => ({ ...DEFAULT_BANGLA_DICTIONARY, ...dictionary }), [dictionary]);

  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [bangla, setBangla] = useState(defaultBangla);
  const [caret, setCaret] = useState(value.length);
  const [active, setActive] = useState(0);
  // A word the person chose to keep in English (Esc), identified by where it starts.
  const [keptEnglishAt, setKeptEnglishAt] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const pendingCaret = useRef<number | null>(null);

  const word = bangla && !disabled ? wordBefore(value, caret) : null;
  const composing = word && word.start !== keptEnglishAt ? word : null;
  const candidates = useMemo(
    () => (composing ? suggestBangla(composing.roman, dict, maxSuggestions) : []),
    [composing, dict, maxSuggestions],
  );
  // The English original is always the last choice.
  const options = composing ? [...candidates, composing.roman] : [];
  const selected = Math.min(active, Math.max(0, options.length - 1));
  const open = options.length > 0;

  // Put the caret back where a conversion left it.
  useEffect(() => {
    const at = pendingCaret.current;
    if (at === null || !fieldRef.current) return;
    pendingCaret.current = null;
    fieldRef.current.setSelectionRange(at, at);
  });

  // Tell screen readers the top suggestion once typing pauses.
  const top = composing ? options[selected] : "";
  useEffect(() => {
    if (!top) return;
    const t = setTimeout(() => setAnnouncement(`${top}, ${selected + 1} of ${options.length}`), 700);
    return () => clearTimeout(t);
  }, [top, selected, options.length]);

  const emit = (next: string, at: number) => {
    if (valueProp === undefined) setInner(next);
    onChange?.(next);
    setCaret(at);
    pendingCaret.current = at;
  };

  /** Replaces the word [start, end) with `text` and moves the caret after it. */
  const replaceWord = (source: string, start: number, end: number, text: string, after = "") => {
    const next = source.slice(0, start) + text + after + source.slice(end);
    emit(next, start + text.length + after.length);
  };

  const setMode = (next: boolean) => {
    setBangla(next);
    onModeChange?.(next);
    setAnnouncement(next ? banglaLabel : englishLabel);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = e.target.value;
    const at = e.target.selectionStart ?? next.length;
    const inserted = next.length - value.length;

    if (bangla && inserted === 1 && at > 0) {
      const typed = next[at - 1];
      // A space, newline or punctuation right after a phonetic word converts it.
      if (!WORD_CHAR.test(typed)) {
        const w = wordBefore(next, at - 1);
        if (w && w.start !== keptEnglishAt) {
          const choice = options[selected] ?? suggestBangla(w.roman, dict, 1)[0] ?? w.roman;
          const boundary = typed === "." ? "।" : typed;
          onCommit?.(choice, w.roman);
          setActive(0);
          setKeptEnglishAt(null);
          return replaceWord(next.slice(0, at - 1) + next.slice(at), w.start, at - 1, choice, boundary);
        }
        setKeptEnglishAt(null);
      }
    }

    // Pasting English while in Bangla mode converts every complete word.
    if (bangla && convertPaste && inserted > 1) {
      const start = at - inserted;
      const pasted = next.slice(start, at);
      const tail = pasted.match(/[A-Za-z0-9^`]+$/)?.[0] ?? "";
      const complete = pasted.slice(0, pasted.length - tail.length);
      const converted = transliterateText(complete, dict) + tail;
      if (onCommit) for (const roman of complete.match(/[A-Za-z0-9^`]+/g) ?? []) onCommit(suggestBangla(roman, dict, 1)[0] ?? roman, roman);
      return emit(next.slice(0, start) + converted + next.slice(at), start + converted.length);
    }

    if (valueProp === undefined) setInner(next);
    onChange?.(next);
    setCaret(at);
    setActive(0);
  };

  const commitSelected = () => {
    if (!composing) return;
    const choice = options[selected];
    if (choice !== composing.roman) onCommit?.(choice, composing.roman);
    setActive(0);
    if (choice === composing.roman) setKeptEnglishAt(composing.start);
    replaceWord(value, composing.start, caret, choice);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
      e.preventDefault();
      setMode(!bangla);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = options.length;
      setActive((selected + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      commitSelected();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setKeptEnglishAt(composing!.start);
      setAnnouncement(`${keepEnglishLabel}: ${composing!.roman}`);
    }
  };

  const syncCaret = (e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const at = e.currentTarget.selectionStart ?? 0;
    if (at !== caret) {
      setCaret(at);
      setActive(0);
    }
  };

  const optionId = (i: number) => `${listId}-${i}`;
  const fieldClass = cn(
    "w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none transition-[border-color,box-shadow] motion-reduce:transition-none",
    "placeholder:text-zinc-500 hover:border-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/20",
    "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500",
    "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:hover:border-zinc-600 dark:disabled:bg-zinc-900",
    multiline ? "min-h-24 resize-y py-2.5 leading-relaxed" : "h-11",
    BANGLA_FONT,
    inputClassName,
  );
  const shared = {
    ref: fieldRef,
    id,
    name,
    value,
    disabled,
    required,
    placeholder,
    lang: bangla ? "bn" : "en",
    autoComplete: "off",
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: false,
    "aria-describedby": hint ? hintId : undefined,
    "aria-controls": listId,
    "aria-activedescendant": open ? optionId(selected) : undefined,
    onChange: handleChange,
    onKeyDown,
    onSelect: syncCaret,
    onClick: syncCaret,
    onBlur: () => setActive(0),
    className: fieldClass,
  };

  return (
    <div className={cn("w-full text-sm", className)}>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
        {/* A toggle keeps one label; aria-pressed says on or off. The name starts with the visible text (WCAG 2.5.3). */}
        <button
          type="button"
          aria-pressed={bangla}
          aria-keyshortcuts="Control+M"
          title={`${toggleLabel} (Ctrl+M)`}
          disabled={disabled}
          onClick={() => {
            setMode(!bangla);
            fieldRef.current?.focus();
          }}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
            bangla
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          <Languages className="size-4" aria-hidden />
          <span lang="bn" className={BANGLA_FONT}>
            {banglaLabel}
          </span>
          <span className="sr-only">, {toggleLabel}</span>
        </button>
      </div>
      {hint && (
        <p id={hintId} className="mt-0.5 text-[13px] text-zinc-600 dark:text-zinc-400">
          {hint}
        </p>
      )}

      <div className="mt-1.5">
        {multiline ? (
          <textarea {...shared} rows={rows} />
        ) : (
          <input
            {...shared}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
          />
        )}
      </div>

      {/* Suggestion bar, like a phone keyboard's: Space or Enter takes the highlighted one. */}
      <div className="mt-1.5 min-h-10">
          <div className="flex items-center gap-2">
            {open && (
              <span aria-hidden className="shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {composing!.roman} →
              </span>
            )}
            {/* Always rendered, so the field's aria-controls always points at it. */}
            <ul
              id={listId}
              hidden={!open}
              role="listbox"
              aria-label={suggestionsLabel}
              aria-orientation="horizontal"
              className="flex min-w-0 flex-wrap gap-1.5"
            >
              {options.map((o, i) => {
                const english = i === options.length - 1;
                return (
                  <li
                    key={`${i}-${o}`}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === selected}
                    lang={english ? "en" : "bn"}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setActive(i);
                      if (!composing) return;
                      if (english) setKeptEnglishAt(composing.start);
                      else onCommit?.(o, composing.roman);
                      replaceWord(value, composing.start, caret, o);
                      setActive(0);
                    }}
                    className={cn(
                      "inline-flex h-10 cursor-pointer select-none items-center rounded-lg border px-3 text-base transition-colors motion-reduce:transition-none",
                      i === selected
                        ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500"
                        : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
                      english ? "font-mono text-sm" : BANGLA_FONT,
                    )}
                  >
                    {english ? `${keepEnglishLabel}: ${o}` : o}
                  </li>
                );
              })}
            </ul>
          </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
