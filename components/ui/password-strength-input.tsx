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
import { AlertCircle, ArrowBigUpDash, Check, Eye, EyeOff, Lightbulb, RefreshCw, Sparkles, Timer, X } from "lucide-react";
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

/* ---------- Crack time (pure) ---------- */

export interface CrackTimeOptions extends ScorePasswordOptions {
  /** Attacker speed. Default 1e10: a fast offline attack on a leaked, weakly hashed password. */
  guessesPerSecond?: number;
}

export interface CrackTime {
  /** log10 of the average number of guesses needed. */
  log10Guesses: number;
  /** log10 of the seconds that takes at guessesPerSecond. */
  log10Seconds: number;
  /** Plain-words duration, e.g. "instantly", "3 hours", "centuries". */
  display: string;
}

const SECONDS: [limit: number, unit: string][] = [
  [60, "second"],
  [3600, "minute"],
  [86_400, "hour"],
  [2_629_800, "day"],
  [31_557_600, "month"],
];
const YEAR = 31_557_600;

/** Turns log10(seconds) into plain words, e.g. 4.1 → "3 hours". */
export function formatCrackTime(log10Seconds: number): string {
  if (log10Seconds < 0) return "instantly";
  const s = 10 ** log10Seconds;
  const unitSize = [1, 60, 3600, 86_400, 2_629_800];
  for (let i = 0; i < SECONDS.length; i++) {
    const [limit, unit] = SECONDS[i];
    if (s < limit) {
      const n = Math.max(1, Math.round(s / unitSize[i]));
      return `${n} ${unit}${n === 1 ? "" : "s"}`;
    }
  }
  const years = s / YEAR;
  if (years < 100) {
    const n = Math.max(1, Math.round(years));
    return `${n} year${n === 1 ? "" : "s"}`;
  }
  if (years < 1e6) return "centuries";
  return "millions of years";
}

/** Characters inside runs of 3+ repeated or consecutive characters, beyond the first of each run. */
function patternChars(password: string) {
  const codes = [...password.toLowerCase()].map((c) => c.codePointAt(0) ?? 0);
  let extra = 0;
  let run = 1;
  let step: number | null = null;
  const close = () => {
    if (run >= 3) extra += run - 1;
  };
  for (let i = 1; i < codes.length; i++) {
    const d = codes[i] - codes[i - 1];
    if ((d === 0 || Math.abs(d) === 1) && (step === null || d === step)) {
      step = d;
      run++;
    } else {
      close();
      run = 1;
      step = null;
      if (d === 0 || Math.abs(d) === 1) {
        step = d;
        run = 2;
      }
    }
  }
  close();
  return extra;
}

/** Guesses for one dictionary word: attackers try a list of roughly this many words first. */
const LOG10_WORD = Math.log10(50_000);
/** Guesses for a separator between two words (space, dash, digit…). */
const LOG10_SEPARATOR = 1;

/** A letter run that reads like words: 4+ letters, a natural share of vowels, no 4-consonant clusters. */
function wordlike(run: string) {
  if (run.length < 4 || /[^aeiouy]{4}/.test(run)) return false;
  const vowels = (run.match(/[aeiouy]/g) ?? []).length / run.length;
  return vowels >= 0.2 && vowels <= 0.7;
}

/** Long runs are usually several words glued together, e.g. "correcthorsebattery". */
function wordsIn(run: string) {
  return Math.max(1, Math.round(run.length / 6.5));
}

/**
 * Estimates how long a password takes to crack, the way attackers work: leaked passwords
 * first, then dictionary words (also l33t-spelled, e.g. "Tr0ub4dor"), then brute force over
 * the remaining characters, counting runs like "abc" or "aaa" as one character.
 * A rough, explainable estimate, not a guarantee.
 */
export function estimateCrackTime(password: string, options: CrackTimeOptions = {}): CrackTime {
  const rate = options.guessesPerSecond ?? 1e10;
  const { checks } = scorePassword(password, options);
  let log10Guesses: number;
  if (checks.length === 0) log10Guesses = 0;
  else if (checks.common) log10Guesses = 3;
  else {
    const pool = Math.max(
      10,
      (checks.lower ? 26 : 0) + (checks.upper ? 26 : 0) + (checks.number ? 10 : 0) + (checks.symbol ? 33 : 0),
    );
    const chars = [...password];
    const plain = chars.map((c) => (LEET[c] ?? c).toLowerCase());
    // Split into dictionary-word segments and everything else.
    const segments: { word: boolean; from: number; to: number }[] = [];
    for (let i = 0; i < plain.length; ) {
      let j = i;
      while (j < plain.length && /[a-z]/.test(plain[j])) j++;
      if (j > i && wordlike(plain.slice(i, j).join(""))) {
        segments.push({ word: true, from: i, to: j });
        i = j;
      } else {
        const end = Math.max(j, i + 1);
        const last = segments[segments.length - 1];
        if (last && !last.word) last.to = end;
        else segments.push({ word: false, from: i, to: end });
        i = end;
      }
    }
    let total = 0;
    segments.forEach((seg, k) => {
      const text = chars.slice(seg.from, seg.to);
      if (seg.word) {
        const leet = text.filter((c) => LEET[c]).length;
        const caps = text.filter((c) => /[A-Z]/.test(c)).length;
        // Capitalising the first letter is the first thing tried; other capitals and swaps add a little each.
        total += wordsIn(plain.slice(seg.from, seg.to).join("")) * LOG10_WORD + leet * Math.log10(2) + (caps === 0 ? 0 : /[A-Z]/.test(text[0]) && caps === 1 ? Math.log10(2) : caps * Math.log10(2));
      } else {
        const between = k > 0 && k < segments.length - 1 && segments[k - 1].word && segments[k + 1].word;
        if (between && text.length <= 2) total += text.length * LOG10_SEPARATOR;
        else total += Math.max(1, text.length - patternChars(text.join(""))) * Math.log10(pool);
      }
    });
    log10Guesses = Math.max(0, total - Math.log10(2));
  }
  const log10Seconds = log10Guesses - Math.log10(rate);
  return { log10Guesses, log10Seconds, display: formatCrackTime(log10Seconds) };
}

export type PasswordTipId = "common" | "pattern" | "length" | "upper" | "number" | "symbol";

export interface PasswordTip {
  id: PasswordTipId;
  /** Crack time after following the tip, when it can be estimated. */
  after?: string;
}

/**
 * The single change that helps most, tried on a copy of the password:
 * a leaked password first, then whichever of +4 characters / an uppercase letter /
 * a number / a symbol raises the crack time the most. Returns null when the password
 * already takes centuries or more.
 */
export function bestPasswordTip(password: string, options: CrackTimeOptions = {}): PasswordTip | null {
  if (!password) return null;
  const { checks } = scorePassword(password, options);
  if (checks.common) return { id: "common" };
  const now = estimateCrackTime(password, options);
  if (now.log10Seconds >= Math.log10(100 * YEAR)) return null;
  const tries: [PasswordTipId, string][] = [["length", password + "kqzv"]];
  if (!checks.upper) tries.push(["upper", password + "Q"]);
  if (!checks.number) tries.push(["number", password + "7"]);
  if (!checks.symbol) tries.push(["symbol", password + "#"]);
  let best: PasswordTip | null = null;
  let bestLog = -Infinity;
  for (const [id, candidate] of tries) {
    const t = estimateCrackTime(candidate, options);
    if (t.log10Seconds > bestLog) {
      bestLog = t.log10Seconds;
      best = { id, after: t.display };
    }
  }
  // Repeats and sequences are worth fixing when they cost more than the best single addition gains.
  if (checks.repeated || checks.sequential) {
    const lost = patternChars(password);
    if (lost >= 2) return { id: "pattern" };
  }
  return best;
}

/* ---------- Passphrase generator (pure, uses crypto) ---------- */

/** 546 short, common, easy-to-type words (about 9.1 bits each). */
export const DEFAULT_PASSPHRASE_WORDS: readonly string[] = (
  "acid acorn actor adapt agent alarm album alert alien alley amber angle ankle apple april apron arena armor arrow " +
  "atlas attic audio aunt award bacon badge bagel baker balmy bamboo banjo barn basil basin batch beach beard beast " +
  "bench berry bike birch bison blade blank blaze blend blimp bloom blush board boat bolt bonus booth boots bored brain " +
  "brave bread brick bride brook broom brush bucket buddy bugle bunny cabin cable cactus camel camp candy canoe canyon " +
  "cargo carol carpet cedar chalk charm chart cheek chef cherry chess chief chili chimp choir cider cinema circus civic " +
  "clamp clay cliff climb clock cloud clover coach cobra cocoa comet coral corn couch cousin crane crate crayon cream " +
  "creek crisp crow crown cube cupid curry daisy dance delta denim depot desk diary diner disco dish diver dizzy dodge " +
  "dolphin donut dove dragon drama dream drift drum duck dune eagle easel echo eclipse elbow elder elf elm ember emoji " +
  "engine envoy epic equal error essay ethic event exam fable fairy falcon fancy farm fauna feast fern ferry fever fiber " +
  "field fig film finch flame flask fleet flint flora flute focus foggy forest fork fossil fox frame frog frost fudge " +
  "galaxy gamer garden garlic gauge gecko gem genie ghost giant ginger giraffe glade glass globe glove goat golf goose " +
  "gorilla grape graph gravy grill grove guitar gumbo habit hammer harbor harp hatch hawk hazel heart hedge helmet " +
  "hero hiker hippo hobby honey hoop horse hotel hound humor husky igloo image index inlet iris island ivory jacket " +
  "jaguar jam jazz jeans jelly jewel jockey joker judge juice jumbo jungle karma kayak kettle kiosk kite kitten kiwi " +
  "koala label ladder lagoon lake lamp lance laser latte lava lawn lemon lens lilac lily limbo linen lion llama lobby " +
  "lobster locket lodge logic lotus lucky lunar lunch lyric magic magnet mango manor maple marble march mask meadow " +
  "medal melon mentor merry metal meteor midnight mimic mint mirror mitten mocha model monkey moose mosaic moss motor " +
  "mouse muffin mural museum music nacho napkin navy nectar needle nest ninja noble noodle north novel nugget nutmeg " +
  "oasis ocean octopus olive omega onion opera orbit orchid otter outfit oval owl oyster paddle pagoda palm panda " +
  "panel panther paper parade parrot pasta pastel peach peanut pearl pebble pecan pedal pelican penguin pepper piano " +
  "pickle pilot pinch pine pirate pixel pizza planet plaza plum poem polar pony poppy portal potato prism puffin " +
  "pulse pumpkin puppet puzzle quail quartz quest quilt rabbit radar radio raft rain ranch raven recipe reef relay " +
  "rhino ribbon rider ripple river robin robot rocket rodeo rover ruby rumble saddle saga salad salmon salsa sandal " +
  "satin sauce scarf scout seal season sedan shadow shark shelf shell sherpa shrimp signal silver siren skate sketch " +
  "sloth smile snack snail sonic spark sphinx spice spider spoon sprout squid stable stamp statue steam stereo stork " +
  "storm studio sugar summit sunny swan sweater syrup tablet taco talent tango teapot temple tennis thunder tiger " +
  "timber toast tofu token topaz torch totem tower tractor trail train trophy tulip tundra turtle tuxedo twig ultra " +
  "umbrella unicorn urban valley vanilla velvet venus vessel violet violin visor vivid vortex voyage wafer waffle " +
  "walnut walrus wander wasabi water wave whale wheat whisk willow window winter wizard wombat yacht yeti yogurt yoyo " +
  "zebra zenith zephyr zigzag zinc zipper zodiac zombie"
)
  .trim()
  .split(/\s+/);

export interface PassphraseOptions {
  /** Word list. Each word adds log2(words.length) bits. */
  words?: readonly string[];
  /** Number of words. */
  count?: number;
  /** Characters placed between words, one picked at random each time. */
  separators?: string;
  /** Randomly capitalise each word (adds 1 bit per word). */
  randomCase?: boolean;
  /** Tries again (up to 50 times) until this returns true, e.g. to satisfy a form's rules. */
  accept?: (value: string) => boolean;
}

export interface Passphrase {
  value: string;
  /** Entropy in bits, assuming the attacker knows the word list and the method. */
  bits: number;
}

/** Unbiased random integer in [0, max) from crypto.getRandomValues. */
function randomInt(max: number) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

/** Builds a random, memorable passphrase like "Otter7maple!Rocket2tulip#Canyon". */
export function generatePassphrase({
  words = DEFAULT_PASSPHRASE_WORDS,
  count = 5,
  separators = "23456789!#%&*+=?",
  randomCase = true,
  accept,
}: PassphraseOptions = {}): Passphrase {
  const build = () => {
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      let w = words[randomInt(words.length)];
      if (randomCase && randomInt(2) === 1) w = w[0].toUpperCase() + w.slice(1);
      parts.push(w);
      if (i < count - 1) parts.push(separators[randomInt(separators.length)]);
    }
    return parts.join("");
  };
  let value = build();
  for (let tries = 0; accept && !accept(value) && tries < 50; tries++) value = build();
  const bits =
    count * Math.log2(words.length) + (count - 1) * Math.log2(separators.length) + (randomCase ? count : 0);
  return { value, bits };
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
  /** Shows how long the password would take to crack, in plain words. */
  showCrackTime?: boolean;
  /** Attacker speed used for the crack time. Default 1e10 guesses per second (fast offline attack). */
  guessesPerSecond?: number;
  /** Crack time sentence, e.g. (t) => `About ${t} to crack`. */
  crackTimeText?: (time: string) => string;
  /** Shows the single change that would help most. */
  showTips?: boolean;
  /** Tip wording per tip id. `after` is the crack time once the tip is followed. */
  tipText?: Partial<Record<PasswordTipId, (after?: string) => string>>;
  /** Offers a random, memorable passphrase that already passes the rules. */
  suggestPassphrase?: boolean;
  /** Word list, word count and separators for the suggestion. */
  passphraseOptions?: Omit<PassphraseOptions, "accept">;
  suggestText?: string;
  useSuggestionText?: string;
  anotherSuggestionText?: string;
  dismissSuggestionText?: string;
  /** Strength sentence under the suggestion. */
  suggestionStrengthText?: (time: string) => string;
  /** Announced after a suggestion is filled in. */
  suggestionUsedText?: string;
  className?: string;
}

/** "About 3 hours" but "Would take centuries". */
const aboutOrWould = (t: string) => (/^\d/.test(t) ? "About" : "Would take");

export const DEFAULT_TIP_TEXT: Record<PasswordTipId, (after?: string) => string> = {
  common: () => "This is one of the most leaked passwords. Pick something else.",
  pattern: () => "Avoid runs like abc, 123 or aaa. They are among the first things guessed.",
  length: (after) => `Best fix: add 4 more characters (${after} to crack)`,
  upper: (after) => `Best fix: add an uppercase letter (${after} to crack)`,
  number: (after) => `Best fix: add a number (${after} to crack)`,
  symbol: (after) => `Best fix: add a symbol (${after} to crack)`,
};

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
  showCrackTime = true,
  guessesPerSecond = 1e10,
  crackTimeText = (t) => (t === "instantly" ? "Could be cracked instantly" : `${aboutOrWould(t)} ${t} to crack`),
  showTips = true,
  tipText,
  suggestPassphrase = true,
  passphraseOptions,
  suggestText = "Suggest a passphrase",
  useSuggestionText = "Use it",
  anotherSuggestionText = "Another",
  dismissSuggestionText = "Dismiss suggestion",
  suggestionStrengthText = (t) => `${aboutOrWould(t)} ${t} to crack, even if the attacker knows how it was made.`,
  suggestionUsedText = "Passphrase filled in and shown so you can save it.",
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
  const crackOptions = useMemo(() => ({ ...scoreOptions, guessesPerSecond }), [scoreOptions, guessesPerSecond]);
  // A filled-in suggestion is rated by its real entropy, so both numbers on screen agree.
  const [applied, setApplied] = useState<Passphrase | null>(null);
  const crack = useMemo(() => {
    if (!value) return null;
    if (applied?.value === value) {
      const log10Seconds = applied.bits * Math.log10(2) - Math.log10(2) - Math.log10(guessesPerSecond);
      return { log10Guesses: log10Seconds + Math.log10(guessesPerSecond), log10Seconds, display: formatCrackTime(log10Seconds) };
    }
    return estimateCrackTime(value, crackOptions);
  }, [value, crackOptions, applied, guessesPerSecond]);
  const tip = useMemo(() => (showTips ? bestPasswordTip(value, crackOptions) : null), [showTips, value, crackOptions]);
  const tips = { ...DEFAULT_TIP_TEXT, ...tipText };
  const [suggestion, setSuggestion] = useState<Passphrase | null>(null);
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
    const time = next && showCrackTime ? ` ${crackTimeText(estimateCrackTime(next, crackOptions).display)}.` : "";
    timer.current = setTimeout(() => setAnnouncement(`${meterLabel}: ${result.label}.${time}`), announceDelay);
  };

  const suggest = () =>
    setSuggestion(
      generatePassphrase({
        ...passphraseOptions,
        accept: (v) => rules.every((r) => r.test(v)) && scorePassword(v, scoreOptions).score >= minStrength,
      }),
    );

  const applySuggestion = () => {
    if (!suggestion) return;
    const next = suggestion.value;
    if (valueProp === undefined) setInner(next);
    if (confirm) {
      if (confirmProp === undefined) setInnerConfirm(next);
      onConfirmChange?.(next, true);
    }
    onChange(next, evaluate(next, confirm ? next : confirmValue));
    setVisible(true);
    setApplied(suggestion);
    setSuggestion(null);
    if (timer.current) clearTimeout(timer.current);
    setAnnouncement(suggestionUsedText);
  };

  const suggestionTime = suggestion
    ? formatCrackTime(suggestion.bits * Math.log10(2) - Math.log10(2) - Math.log10(guessesPerSecond))
    : "";

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
    <div className={cn("@container w-full text-sm", className)}>
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
          className={cn("relative grid flex-1 grid-cols-4 gap-1.5", disabled && "opacity-50")}
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

      {showCrackTime && crack && (
        <p className={cn("mt-2 flex items-center gap-1.5 text-[13px] font-medium", level.text)}>
          <Timer className="size-4 shrink-0" aria-hidden />
          {crackTimeText(crack.display)}
        </p>
      )}
      {tip && (
        <p className="mt-1 flex items-start gap-1.5 text-[13px] text-zinc-700 dark:text-zinc-300">
          <Lightbulb className="mt-px size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          {tips[tip.id](tip.after)}
        </p>
      )}

      {suggestPassphrase && !disabled && (
        <div className="mt-2">
          {suggestion ? (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 break-all font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {suggestion.value}
                </p>
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  aria-label={dismissSuggestionText}
                  className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 outline-none hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{suggestionStrengthText(suggestionTime)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[13px] font-medium text-white outline-none hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-indigo-700 dark:focus-visible:ring-offset-zinc-900"
                >
                  <Check className="size-4" aria-hidden /> {useSuggestionText}
                </button>
                <button
                  type="button"
                  onClick={suggest}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 text-[13px] font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <RefreshCw className="size-4" aria-hidden /> {anotherSuggestionText}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={suggest}
              className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-indigo-700 outline-none hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
            >
              <Sparkles className="size-4" aria-hidden /> {suggestText}
            </button>
          )}
        </div>
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
