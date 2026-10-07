"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, CircleAlert, CornerDownLeft, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommandItem {
  /** Unique id across the whole tree (used for recents and keys). */
  id: string;
  label: string;
  /** Section heading this command is listed under, e.g. "Navigation". */
  group: string;
  icon?: ReactNode;
  /** Muted text after the label. */
  description?: string;
  /** Key hints shown on the right, e.g. ["⇧", "D"]. Display only: wire the keys up yourself. */
  shortcut?: string[];
  /** Extra search terms that also match this command. */
  keywords?: string[];
  /** Runs the command. Return a promise to show a spinner; a rejection shows its message in the palette. */
  onRun?: () => void | Promise<unknown>;
  /** Sub-commands. Running this command opens them as a nested page. */
  children?: CommandItem[];
  /** Listed but can't be run, and skipped by the arrow keys. */
  disabled?: boolean;
  /** Keep the palette open after the command runs, e.g. for toggles. */
  keepOpen?: boolean;
}

export interface CommandPaletteProps {
  commands: CommandItem[];
  /** Open state (controlled). */
  open?: boolean;
  /** Initial open state (uncontrolled). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Search input placeholder on the root page. */
  placeholder?: string;
  /** Key that opens the palette together with Cmd (macOS) or Ctrl. Pass null to turn the shortcut off. */
  hotkey?: string | null;
  /** Render the built-in trigger button that shows the shortcut. */
  showTrigger?: boolean;
  /** Text of the trigger button. */
  triggerLabel?: string;
  /** Classes for the trigger button. */
  triggerClassName?: string;
  /** Accessible name of the dialog. */
  label?: string;
  /** Heading of the recent commands section. */
  recentLabel?: string;
  /** How many recent commands to remember and show first. 0 turns recents off. */
  maxRecent?: number;
  /** Ids of commands to show as recent before anything has run. */
  defaultRecent?: string[];
  /** Show skeleton rows instead of commands, e.g. while they load. */
  loading?: boolean;
  loadingText?: string;
  /** Text shown when nothing matches. Receives the trimmed query. */
  emptyText?: (query: string) => string;
  /** Accessible label of the back button on nested pages. */
  backLabel?: string;
  /** Accessible label of the close button. */
  closeLabel?: string;
  /** Show the keyboard hint footer (hidden on small screens). */
  showFooter?: boolean;
  /** Portal the dialog to document.body. Turn off to inherit theme classes from where the palette is rendered. */
  portal?: boolean;
}

/* ---------- Helpers ---------- */

const subscribeNoop = () => () => {};

/** Controlled/uncontrolled state helper. */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [current, set] as const;
}

interface Match {
  score: number;
  indices: number[];
}

const isWordStart = (s: string, i: number) => i === 0 || /[\s\-_/.›]/.test(s[i - 1]);

/** Substring match first, then a subsequence match that rewards runs and word starts. */
export function fuzzyMatch(text: string, query: string): Match | null {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return { score: 0, indices: [] };
  const at = t.indexOf(q);
  if (at >= 0) {
    return {
      score: 100 + (at === 0 ? 40 : 0) + (isWordStart(t, at) ? 20 : 0) - t.length * 0.2,
      indices: Array.from({ length: q.length }, (_, i) => at + i),
    };
  }
  const chars = q.replace(/\s+/g, "");
  const indices: number[] = [];
  let score = 0;
  let qi = 0;
  for (let i = 0; i < t.length && qi < chars.length; i++) {
    if (t[i] !== chars[qi]) continue;
    const prev = indices[indices.length - 1];
    score += 1 + (prev === i - 1 ? 6 : 0) + (isWordStart(t, i) ? 8 : 0);
    indices.push(i);
    qi++;
  }
  if (qi < chars.length) return null;
  score -= (indices[indices.length - 1] - indices[0] - indices.length) * 0.4;
  return { score, indices };
}

function Highlight({ text, indices }: { text: string; indices: number[] }) {
  if (!indices.length) return <>{text}</>;
  const set = new Set(indices);
  const parts: ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const hit = set.has(i);
    let j = i;
    while (j < text.length && set.has(j) === hit) j++;
    const chunk = text.slice(i, j);
    parts.push(
      hit ? (
        <mark
          key={i}
          className="rounded-[3px] bg-transparent font-semibold text-indigo-700 underline decoration-indigo-400/70 decoration-2 underline-offset-[3px] dark:text-indigo-300 dark:decoration-indigo-400/60"
        >
          {chunk}
        </mark>
      ) : (
        chunk
      ),
    );
    i = j;
  }
  return <>{parts}</>;
}

function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 font-sans text-[11px] font-medium text-zinc-600 shadow-[inset_0_-1px_0_rgb(0_0_0/0.06)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_-1px_0_rgb(255_255_255/0.06)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

const STYLES = `
@keyframes lofi-command-palette-fade { from { opacity: 0; } }
@keyframes lofi-command-palette-pop { from { opacity: 0; transform: translateY(-8px) scale(0.98); } }
@keyframes lofi-command-palette-in { from { opacity: 0; transform: translateX(14px); } }
@keyframes lofi-command-palette-out { from { opacity: 0; transform: translateX(-14px); } }
.lofi-command-palette-overlay { animation: lofi-command-palette-fade 150ms ease-out; }
.lofi-command-palette-panel { animation: lofi-command-palette-pop 180ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.lofi-command-palette-page-in { animation: lofi-command-palette-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.lofi-command-palette-page-out { animation: lofi-command-palette-out 180ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.lofi-command-palette-glide { transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1), height 160ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 120ms; }
@media (prefers-reduced-motion: reduce) {
  .lofi-command-palette-overlay, .lofi-command-palette-panel,
  .lofi-command-palette-page-in, .lofi-command-palette-page-out { animation: none; }
  .lofi-command-palette-glide { transition: none; }
}
`;

/* ---------- Component ---------- */

/**
 * Cmd/Ctrl+K command launcher: fuzzy search with highlighted matches, grouped
 * sections, recent commands, nested pages and async commands.
 */
export function CommandPalette({
  commands,
  open,
  defaultOpen = false,
  onOpenChange,
  placeholder = "Type a command or search…",
  hotkey = "k",
  showTrigger = true,
  triggerLabel = "Search commands…",
  triggerClassName,
  label = "Command palette",
  recentLabel = "Recent",
  maxRecent = 3,
  defaultRecent = [],
  loading = false,
  loadingText = "Loading commands…",
  emptyText = (q) => (q ? `No commands match “${q}”` : "No commands here yet"),
  backLabel = "Back",
  closeLabel = "Close",
  showFooter = true,
  portal = true,
}: CommandPaletteProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const [recent, setRecent] = useState<string[]>(() => defaultRecent.slice(0, maxRecent));
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const isMac = useSyncExternalStore(
    subscribeNoop,
    () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent),
    () => false,
  );

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== hotkey.toLowerCase()) return;
      e.preventDefault();
      setOpen(!isOpen);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, isOpen, setOpen]);

  const mod = isMac ? "⌘" : "Ctrl";
  const hotkeyLabel = hotkey ? (hotkey.length === 1 ? hotkey.toUpperCase() : hotkey) : null;

  const dialog =
    isOpen && isClient ? (
      <PaletteDialog
        commands={commands}
        placeholder={placeholder}
        label={label}
        recentIds={maxRecent > 0 ? recent : []}
        recentLabel={recentLabel}
        loading={loading}
        loadingText={loadingText}
        emptyText={emptyText}
        backLabel={backLabel}
        closeLabel={closeLabel}
        showFooter={showFooter}
        onRecord={(cmd) => {
          if (maxRecent > 0) setRecent((r) => [cmd.id, ...r.filter((id) => id !== cmd.id)].slice(0, maxRecent));
        }}
        onClose={() => setOpen(false)}
      />
    ) : null;

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-keyshortcuts={hotkeyLabel ? `${isMac ? "Meta" : "Control"}+${hotkeyLabel}` : undefined}
          onClick={() => setOpen(true)}
          className={cn(
            "group inline-flex h-10 w-full max-w-xs items-center gap-2 rounded-lg border border-zinc-200 bg-white pl-3 pr-1.5 text-sm text-zinc-500 shadow-sm outline-none transition-colors",
            "hover:border-zinc-300 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:bg-zinc-50 motion-reduce:transition-none",
            "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200 dark:active:bg-zinc-800",
            triggerClassName,
          )}
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left">{triggerLabel}</span>
          {hotkeyLabel && (
            <span className="flex shrink-0 gap-1" aria-hidden>
              <Kbd>{mod}</Kbd>
              <Kbd>{hotkeyLabel}</Kbd>
            </span>
          )}
        </button>
      )}
      {dialog && (portal ? createPortal(dialog, document.body) : dialog)}
    </>
  );
}

/* ---------- Dialog (mounted only while open, so its state resets on close) ---------- */

interface Option {
  key: string;
  cmd: CommandItem;
  /** Ancestors between the current page and this command, for nested matches and recents. */
  path: CommandItem[];
  indices: number[];
}

interface Section {
  key: string;
  label: string;
  options: Option[];
}

interface DialogProps {
  commands: CommandItem[];
  placeholder: string;
  label: string;
  recentIds: string[];
  recentLabel: string;
  loading: boolean;
  loadingText: string;
  emptyText: (query: string) => string;
  backLabel: string;
  closeLabel: string;
  showFooter: boolean;
  onRecord: (cmd: CommandItem) => void;
  onClose: () => void;
}

function descendants(list: CommandItem[], path: CommandItem[] = []): { cmd: CommandItem; path: CommandItem[] }[] {
  return list.flatMap((cmd) => [{ cmd, path }, ...descendants(cmd.children ?? [], [...path, cmd])]);
}

function groupInOrder(options: Option[]): Section[] {
  const map = new Map<string, Option[]>();
  for (const o of options) {
    const list = map.get(o.cmd.group) ?? [];
    list.push(o);
    map.set(o.cmd.group, list);
  }
  return [...map].map(([group, opts]) => ({ key: `g:${group}`, label: group, options: opts }));
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : typeof e === "string" ? e : "Something went wrong.");

function PaletteDialog({
  commands,
  placeholder,
  label,
  recentIds,
  recentLabel,
  loading,
  loadingText,
  emptyText,
  backLabel,
  closeLabel,
  showFooter,
  onRecord,
  onClose,
}: DialogProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [query, setQuery] = useState("");
  const [stack, setStack] = useState<CommandItem[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState({ dir: "in" as "in" | "out", n: 0 });

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const glideRef = useRef<HTMLDivElement>(null);
  const life = useRef({ alive: true });

  // Focus the input, lock page scroll, and restore focus to the opener on close.
  useEffect(() => {
    const flag = life.current;
    flag.alive = true;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    const body = document.body;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      flag.alive = false;
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
      opener?.focus({ preventScroll: true });
    };
  }, []);

  const q = query.trim();

  const sections = useMemo<Section[]>(() => {
    const current = stack.length ? (stack[stack.length - 1].children ?? []) : commands;
    if (!q) {
      const out: Section[] = [];
      if (stack.length === 0 && recentIds.length) {
        const all = new Map(descendants(commands).map((d) => [d.cmd.id, d]));
        const opts = recentIds
          .map((id) => all.get(id))
          .filter((d): d is NonNullable<typeof d> => Boolean(d))
          .map((d) => ({ key: `recent:${d.cmd.id}`, cmd: d.cmd, path: d.path, indices: [] }));
        if (opts.length) out.push({ key: "recent", label: recentLabel, options: opts });
      }
      return [...out, ...groupInOrder(current.map((cmd) => ({ key: cmd.id, cmd, path: [], indices: [] })))];
    }
    // Search the current page and everything nested below it.
    const scored = descendants(current)
      .map(({ cmd, path }) => {
        const hit = fuzzyMatch(cmd.label, q);
        if (hit) return { cmd, path, indices: hit.indices, score: hit.score - path.length * 5 };
        const kw = [...(cmd.keywords ?? []), ...path.map((p) => p.label)]
          .map((k) => fuzzyMatch(k, q))
          .filter((m): m is Match => m !== null)
          .sort((a, b) => b.score - a.score)[0];
        return kw ? { cmd, path, indices: [] as number[], score: kw.score * 0.6 - path.length * 5 } : null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.score - a.score);
    // Groups follow their best match.
    return groupInOrder(scored.map(({ cmd, path, indices }) => ({ key: cmd.id, cmd, path, indices })));
  }, [q, stack, recentIds, commands, recentLabel]);

  const flat = useMemo(() => sections.flatMap((s) => s.options), [sections]);
  const enabled = flat.filter((o) => !o.cmd.disabled);
  const active = (activeKey ? enabled.find((o) => o.key === activeKey) : undefined) ?? enabled[0] ?? null;
  const optionId = (o: Option) => `${uid}-opt-${flat.indexOf(o)}`;
  const activeDomId = active && !loading ? optionId(active) : undefined;

  // Glide the highlight to the active row and keep it in view.
  useLayoutEffect(() => {
    const glide = glideRef.current;
    if (!glide) return;
    const el = activeDomId ? document.getElementById(activeDomId) : null;
    if (!el) {
      glide.style.opacity = "0";
      return;
    }
    const first = !glide.dataset.ready;
    if (first) glide.style.transition = "none";
    glide.style.opacity = "1";
    glide.style.height = `${el.offsetHeight}px`;
    glide.style.transform = `translateY(${el.offsetTop}px)`;
    if (first) {
      glide.dataset.ready = "1";
      requestAnimationFrame(() => glide.style.removeProperty("transition"));
    }
    el.scrollIntoView({ block: "nearest" });
  }, [activeDomId, sections]);

  const move = (delta: number) => {
    if (!enabled.length) return;
    const i = active ? enabled.indexOf(active) : -1;
    const next = enabled[(i + delta + enabled.length) % enabled.length];
    setActiveKey(next.key);
  };

  const goBack = () => {
    if (!stack.length) return;
    const parent = stack[stack.length - 1];
    setStack(stack.slice(0, -1));
    setQuery("");
    setError(null);
    setActiveKey(parent.id);
    setPage((p) => ({ dir: "out", n: p.n + 1 }));
    inputRef.current?.focus();
  };

  const run = (opt: Option) => {
    const { cmd } = opt;
    if (cmd.disabled || runningKey) return;
    setError(null);
    if (cmd.children) {
      setStack([...stack, ...opt.path, cmd]);
      setQuery("");
      setActiveKey(null);
      setPage((p) => ({ dir: "in", n: p.n + 1 }));
      inputRef.current?.focus();
      return;
    }
    onRecord(cmd);
    let result: void | Promise<unknown>;
    try {
      result = cmd.onRun?.();
    } catch (e) {
      setError(errorMessage(e));
      return;
    }
    if (result instanceof Promise) {
      setRunningKey(opt.key);
      const flag = life.current;
      result.then(
        () => {
          if (!flag.alive) return;
          setRunningKey(null);
          if (!cmd.keepOpen) onClose();
        },
        (e: unknown) => {
          if (!flag.alive) return;
          setRunningKey(null);
          setError(errorMessage(e));
        },
      );
    } else if (!cmd.keepOpen) {
      onClose();
    }
  };

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Enter":
        e.preventDefault();
        if (active && !loading) run(active);
        break;
      case "Backspace":
        if (query === "" && stack.length) {
          e.preventDefault();
          goBack();
        }
        break;
    }
  };

  // Escape closes from anywhere in the dialog; Tab cycles inside it.
  const onPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = [
      ...panelRef.current.querySelectorAll<HTMLElement>("input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])"),
    ];
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const pageLabel = stack[stack.length - 1]?.label;
  const status = loading
    ? loadingText
    : flat.length === 0
      ? emptyText(q)
      : `${enabled.length} command${enabled.length === 1 ? "" : "s"}${pageLabel ? ` in ${pageLabel}` : ""}`;

  return (
    <div
      className="lofi-command-palette-overlay fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 px-4 pt-[8vh] backdrop-blur-[2px] sm:pt-[14vh] dark:bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style href="lofi-command-palette" precedence="default">
        {STYLES}
      </style>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={onPanelKeyDown}
        className="lofi-command-palette-panel flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-sm text-zinc-900 shadow-2xl shadow-zinc-950/20 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-black/50"
      >
        {/* Search row */}
        <div className="flex h-14 shrink-0 items-center gap-1.5 border-b border-zinc-200 pl-2 pr-2 transition-colors focus-within:border-indigo-400 motion-reduce:transition-none dark:border-zinc-800 dark:focus-within:border-indigo-500/70">
          {stack.length ? (
            <>
              <button
                type="button"
                onClick={goBack}
                aria-label={`${backLabel}${stack.length > 1 ? ` to ${stack[stack.length - 2].label}` : ""}`}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-indigo-500 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <span className="inline-flex h-7 max-w-[9rem] shrink-0 items-center gap-1 rounded-md bg-indigo-50 px-2 text-xs font-medium text-indigo-700 sm:max-w-[14rem] dark:bg-indigo-500/15 dark:text-indigo-300">
                <span className="truncate">{pageLabel}</span>
              </span>
            </>
          ) : (
            <span className="grid size-10 shrink-0 place-items-center text-zinc-500 dark:text-zinc-400" aria-hidden>
              <Search className="size-4" />
            </span>
          )}
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeDomId}
            aria-label={pageLabel ? `Search ${pageLabel}` : "Search commands"}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveKey(null);
              setError(null);
            }}
            onKeyDown={onInputKeyDown}
            placeholder={pageLabel ? `Search ${pageLabel.toLowerCase()}…` : placeholder}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent px-1 text-base text-zinc-900 outline-none placeholder:text-zinc-400 sm:text-sm dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-2 outline-none hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-indigo-500 active:bg-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
          >
            <Kbd>Esc</Kbd>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-2 mt-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
            <span className="min-w-0">{error}</span>
          </div>
        )}

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [max-height:min(24rem,60vh)]">
          <div
            key={page.n}
            id={listId}
            role="listbox"
            aria-label={pageLabel ?? label}
            aria-busy={loading || undefined}
            className={cn(
              "relative",
              page.n > 0 && (page.dir === "in" ? "lofi-command-palette-page-in" : "lofi-command-palette-page-out"),
            )}
          >
            <div
              ref={glideRef}
              aria-hidden
              className="lofi-command-palette-glide pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-zinc-100 opacity-0 dark:bg-zinc-800"
            >
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            </div>

            {loading ? (
              <div className="flex flex-col gap-1" aria-hidden>
                {[72, 54, 64, 46].map((w, i) => (
                  <div key={i} className="flex h-11 items-center gap-3 px-3">
                    <span className="size-7 rounded-md bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-800" />
                    <span className="h-3 rounded bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-800" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            ) : flat.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="grid size-10 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" aria-hidden>
                  <Search className="size-4" />
                </span>
                <p className="text-zinc-600 dark:text-zinc-300">{emptyText(q)}</p>
              </div>
            ) : (
              sections.map((section) => {
                const headingId = `${uid}-${section.key.replace(/[^a-z0-9]/gi, "-")}`;
                return (
                  <div key={section.key} role="group" aria-labelledby={headingId} className="pb-1">
                    <div
                      id={headingId}
                      role="presentation"
                      className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                    >
                      {section.label}
                    </div>
                    {section.options.map((opt) => {
                      const { cmd } = opt;
                      const isActive = active?.key === opt.key;
                      const isRunning = runningKey === opt.key;
                      return (
                        <div
                          key={opt.key}
                          id={optionId(opt)}
                          role="option"
                          aria-selected={isActive}
                          aria-disabled={cmd.disabled || undefined}
                          aria-busy={isRunning || undefined}
                          onPointerMove={() => {
                            if (!cmd.disabled && !isActive) setActiveKey(opt.key);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => run(opt)}
                          className={cn(
                            "relative flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-1.5",
                            isActive ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300",
                            cmd.disabled && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-md border transition-colors motion-reduce:transition-none [&_svg]:size-4",
                              isActive
                                ? "border-indigo-200 bg-white text-indigo-600 dark:border-indigo-500/40 dark:bg-zinc-900 dark:text-indigo-300"
                                : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
                            )}
                          >
                            {cmd.icon ?? <span className="size-1.5 rounded-full bg-current" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {opt.path.length > 0 && (
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {opt.path.map((p) => p.label).join(" › ")} ›{" "}
                              </span>
                            )}
                            <Highlight text={cmd.label} indices={opt.indices} />
                            {cmd.description && (
                              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">{cmd.description}</span>
                            )}
                          </span>
                          {isRunning ? (
                            <Loader2 className="size-4 shrink-0 text-indigo-600 motion-safe:animate-spin dark:text-indigo-400" aria-hidden />
                          ) : cmd.children ? (
                            <ChevronRight className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
                          ) : cmd.shortcut?.length ? (
                            <span className="hidden shrink-0 gap-1 sm:flex" aria-hidden>
                              {cmd.shortcut.map((k, i) => (
                                <Kbd key={i}>{k}</Kbd>
                              ))}
                            </span>
                          ) : isActive ? (
                            <CornerDownLeft className="size-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <p role="status" className="sr-only">
          {status}
        </p>

        {showFooter && (
          <div
            aria-hidden
            className="hidden h-10 shrink-0 items-center gap-4 border-t border-zinc-200 bg-zinc-50/80 px-3 text-xs text-zinc-500 sm:flex dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400"
          >
            <span className="inline-flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>↵</Kbd> run
            </span>
            {stack.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Kbd>⌫</Kbd> back
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1.5">
              <Kbd>esc</Kbd> close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
