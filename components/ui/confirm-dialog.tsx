"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  /** Whether the dialog is shown (controlled). */
  open: boolean;
  /** Called with false on Esc, backdrop click, Cancel and after a successful confirm. */
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** The exact text the user must type, e.g. the repository name. */
  resourceName: string;
  /** Bullet list of what will happen. */
  consequences?: string[];
  /** Heading above the consequences list. */
  consequencesTitle?: string;
  /** Danger button label. */
  confirmLabel?: string;
  /** Danger button label while onConfirm is pending. */
  loadingLabel?: string;
  cancelLabel?: string;
  /** Runs on confirm. The dialog stays open with a spinner until it settles; a rejection is shown inside it. */
  onConfirm: () => Promise<void>;
  /** Require matching letter case. */
  caseSensitive?: boolean;
  /** Label above the input. Receives the styled resource name. */
  inputLabel?: (name: ReactNode) => ReactNode;
  placeholder?: string;
  /** Screen-reader text once the typed value matches. */
  matchedText?: string;
  /** Shown when onConfirm rejects without an Error message. */
  errorFallback?: string;
  /** Accessible label of the close button. */
  closeLabel?: string;
  /** Where focus goes on close when the element that opened the dialog is gone. */
  finalFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const STYLES = `
@keyframes lofi-confirm-dialog-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes lofi-confirm-dialog-sheet { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes lofi-confirm-dialog-pop { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes lofi-confirm-dialog-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes lofi-confirm-dialog-sheet-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(24px); } }
@keyframes lofi-confirm-dialog-pop-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(4px) scale(0.97); } }
@keyframes lofi-confirm-dialog-armed { 0% { box-shadow: 0 0 0 0 rgb(225 29 72 / 0.45); } 100% { box-shadow: 0 0 0 10px rgb(225 29 72 / 0); } }
.lofi-confirm-dialog-backdrop { animation: lofi-confirm-dialog-fade 200ms ease-out both; }
.lofi-confirm-dialog-panel { animation: lofi-confirm-dialog-sheet 280ms cubic-bezier(0.2, 0.9, 0.25, 1) both; }
.lofi-confirm-dialog-closing .lofi-confirm-dialog-backdrop { animation: lofi-confirm-dialog-fade-out 160ms ease-in both; }
.lofi-confirm-dialog-closing .lofi-confirm-dialog-panel { animation: lofi-confirm-dialog-sheet-out 160ms ease-in both; }
@media (min-width: 640px) {
  .lofi-confirm-dialog-panel { animation-name: lofi-confirm-dialog-pop; }
  .lofi-confirm-dialog-closing .lofi-confirm-dialog-panel { animation-name: lofi-confirm-dialog-pop-out; }
}
.lofi-confirm-dialog-armed { animation: lofi-confirm-dialog-armed 700ms ease-out 1; }
@media (prefers-reduced-motion: reduce) {
  .lofi-confirm-dialog-backdrop, .lofi-confirm-dialog-panel { animation: lofi-confirm-dialog-fade 1ms both !important; }
  .lofi-confirm-dialog-closing .lofi-confirm-dialog-backdrop,
  .lofi-confirm-dialog-closing .lofi-confirm-dialog-panel { animation: lofi-confirm-dialog-fade-out 1ms both !important; }
  .lofi-confirm-dialog-armed { animation: none; }
}
`;

/**
 * Destructive confirmation that stays locked until the user types the resource name.
 * Renders in place with fixed positioning, so it inherits the surrounding light/dark theme.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open } = props;
  // Keep the dialog mounted while the exit animation plays.
  const [rendered, setRendered] = useState(open);
  if (open && !rendered) setRendered(true);
  if (!rendered) return null;
  return <DialogBody {...props} closing={!open} onExited={() => setRendered(false)} />;
}

function DialogBody({
  open,
  onOpenChange,
  title,
  description,
  resourceName,
  consequences = [],
  consequencesTitle = "This will:",
  confirmLabel = "Delete",
  loadingLabel = "Deleting…",
  cancelLabel = "Cancel",
  onConfirm,
  caseSensitive = true,
  inputLabel = (name) => <>Type {name} to confirm</>,
  placeholder,
  matchedText = "Name matches. The delete button is enabled.",
  errorFallback = "Something went wrong. Nothing was deleted.",
  closeLabel = "Close",
  finalFocusRef,
  className,
  closing,
  onExited,
}: ConfirmDialogProps & { closing: boolean; onExited: () => void }) {
  const titleId = useId();
  const descId = useId();
  const hintId = useId();
  const errorId = useId();
  const inputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const norm = (s: string) => (caseSensitive ? s : s.toLowerCase());
  const target = norm(resourceName);
  const value = norm(typed);
  const matches = value === target;
  // Length of the correctly typed prefix, for the per-character highlight.
  let prefix = 0;
  while (prefix < value.length && prefix < target.length && value[prefix] === target[prefix]) prefix++;
  const wrong = value.length > prefix;

  // Focus the input on open, lock page scroll, and return focus on close.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    const root = document.documentElement;
    const scrollbar = window.innerWidth - root.clientWidth;
    const prevOverflow = root.style.overflow;
    const prevPadding = root.style.paddingRight;
    root.style.overflow = "hidden";
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
    const finalFocus = finalFocusRef;
    return () => {
      root.style.overflow = prevOverflow;
      root.style.paddingRight = prevPadding;
      const fallback = finalFocus?.current;
      if (previous?.isConnected) previous.focus();
      else fallback?.focus();
    };
  }, [open, finalFocusRef]);

  const requestClose = () => {
    if (loading || closing) return;
    onOpenChange(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      requestClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!matches || loading || closing) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      setLoading(false);
      onOpenChange(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error && err.message ? err.message : errorFallback);
      // Back to the input so the user can retry or cancel.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const nameChip = (
    <>
      <code
        aria-hidden
        className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700"
      >
        <span className="text-emerald-700 dark:text-emerald-400">{resourceName.slice(0, prefix)}</span>
        {wrong && prefix < resourceName.length ? (
          <span className="rounded-sm bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">{resourceName[prefix]}</span>
        ) : (
          resourceName[prefix]
        )}
        {resourceName.slice(prefix + 1)}
      </code>
      <span className="sr-only">{resourceName}</span>
    </>
  );

  return (
    <div
      className={cn("fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6", closing && "lofi-confirm-dialog-closing")}
      onKeyDown={onKeyDown}
    >
      <style href="lofi-confirm-dialog" precedence="default">
        {STYLES}
      </style>
      <div
        aria-hidden
        className="lofi-confirm-dialog-backdrop absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px] dark:bg-black/70"
        onMouseDown={requestClose}
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        aria-busy={loading || undefined}
        tabIndex={-1}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) onExited();
        }}
        className={cn(
          "lofi-confirm-dialog-panel relative flex outline-none max-h-[calc(100dvh-1rem)] w-full flex-col overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl",
          "sm:max-w-md sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
          className,
        )}
      >
        <div aria-hidden className="h-1 w-full shrink-0 bg-[repeating-linear-gradient(-45deg,var(--color-rose-500)_0_8px,var(--color-rose-600)_8px_16px)] sm:rounded-t-2xl" />
        <form onSubmit={submit} className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-4 ring-rose-50 dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/5">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id={titleId} className="text-base font-semibold leading-6 text-balance">
                {title}
              </h2>
              {description && (
                <div id={descId} className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={requestClose}
              disabled={loading}
              aria-label={closeLabel}
              className="-mr-2 -mt-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          {consequences.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 dark:border-rose-500/20 dark:bg-rose-500/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-300">{consequencesTitle}</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                {consequences.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor={inputId} className="text-sm text-zinc-700 dark:text-zinc-300">
              {inputLabel(nameChip)}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id={inputId}
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  if (error) setError(null);
                }}
                readOnly={loading}
                placeholder={placeholder ?? resourceName}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={wrong || Boolean(error) || undefined}
                aria-describedby={cn(hintId, error && errorId)}
                className={cn(
                  "h-11 w-full rounded-lg border bg-white px-3 pr-10 font-mono text-sm outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 motion-reduce:transition-none dark:bg-zinc-950 dark:placeholder:text-zinc-500",
                  "focus-visible:ring-4",
                  matches
                    ? "border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-emerald-500/70"
                    : wrong
                      ? "border-rose-400 focus-visible:ring-rose-500/20 dark:border-rose-500/60"
                      : "border-zinc-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:border-zinc-700",
                  loading && "cursor-progress opacity-70",
                )}
              />
              <span
                aria-hidden
                className="absolute bottom-0 left-2 right-2 h-0.5 overflow-hidden rounded-full"
              >
                <span
                  className={cn(
                    "block h-full origin-left rounded-full transition-[transform,background-color] duration-200 motion-reduce:transition-none",
                    matches ? "bg-emerald-500" : wrong ? "bg-rose-500" : "bg-indigo-500",
                  )}
                  style={{ transform: `scaleX(${target.length ? prefix / target.length : 0})` }}
                />
              </span>
            </div>
            <p id={hintId} className="sr-only" aria-live="polite">
              {matches ? matchedText : ""}
            </p>
          </div>

          {error && (
            <div
              id={errorId}
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={requestClose}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 outline-none transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              // Stays focusable while loading so focus doesn't fall out of the dialog.
              disabled={!matches}
              aria-disabled={loading || undefined}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-900",
                matches
                  ? "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500"
                  : "cursor-not-allowed bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                matches && !loading && "lofi-confirm-dialog-armed",
                loading && "cursor-progress bg-rose-600 text-white opacity-90",
              )}
            >
              {loading && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />}
              {loading ? loadingLabel : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
