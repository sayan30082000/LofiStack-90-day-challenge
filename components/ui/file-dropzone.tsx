"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Ban,
  CloudUpload,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Every user-facing string, so the dropzone can be translated or reworded. */
export interface FileDropzoneMessages {
  /** Main call to action in the idle drop area. */
  title: string;
  /** Text of the inline "browse" link. */
  browse: string;
  /** Shown while acceptable files are dragged over. */
  dragActive: string;
  /** Shown while files of a type that isn't accepted are dragged over. */
  dragRejectType: string;
  /** Shown while more files than the remaining slots are dragged over. */
  dragRejectCount: (remaining: number) => string;
  /** Rejection reason: type not in `accept`. */
  invalidType: (file: File) => string;
  /** Rejection reason: larger than `maxSize`. */
  tooLarge: (file: File, maxSize: string) => string;
  /** Rejection reason: no slots left. */
  tooMany: (file: File, maxFiles: number) => string;
  /** Rejection reason: the same file is already in the list. */
  duplicate: (file: File) => string;
  /** Heading of the rejection panel. */
  rejectedTitle: (count: number) => string;
  /** Accessible label of a file's remove button. */
  remove: (file: File) => string;
  /** Screen reader announcement after files are added. */
  added: (count: number) => string;
  /** Screen reader announcement after a file is removed. */
  removed: (file: File) => string;
  /** Screen reader announcement after the list is cleared. */
  cleared: string;
  /** Label of the button that removes every file. */
  clearAll: string;
  /** Accessible label of the button that hides the rejection panel. */
  dismiss: string;
  /** Shown under the drop area when no file is selected. */
  empty: string;
  /** Capacity summary, e.g. "2 of 5 files · 3.1 MB". */
  usage: (count: number, maxFiles: number, totalSize: string) => string;
}

export interface FileDropzoneProps {
  /** Accepted types: MIME types ("image/png"), wildcards ("image/*") or extensions (".pdf"). Empty accepts anything. */
  accept?: string[];
  /** Maximum size per file, in bytes. Unlimited when omitted. */
  maxSize?: number;
  /** Maximum number of files kept in the list. Unlimited when omitted. Ignored when `multiple` is false. */
  maxFiles?: number;
  /** Allow several files. When false, a new file replaces the current one. */
  multiple?: boolean;
  /** Called with the full, current list whenever files are added or removed. */
  onFilesChange?: (files: File[]) => void;
  /** Visible label of the field. */
  label?: ReactNode;
  /** Helper text under the call to action. Defaults to a summary of accept, maxSize and maxFiles. */
  hint?: ReactNode;
  /** Prevents picking, dropping and removing files. */
  disabled?: boolean;
  /** Name of the underlying file input, for native form posts. */
  name?: string;
  /** Formats a byte count for display. */
  formatSize?: (bytes: number) => string;
  /** Override any user-facing string. */
  messages?: Partial<FileDropzoneMessages>;
  /** Classes for the outer wrapper. */
  className?: string;
}

interface Entry {
  id: number;
  file: File;
  /** Object URL for image previews. */
  url?: string;
}

interface Rejection {
  id: number;
  name: string;
  reason: string;
}

type DragState = { kind: "accept" } | { kind: "reject"; reason: string } | null;

/** 1536 -> "1.5 KB". Base 1024, one decimal under 10. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? Math.round(v * 10) / 10 : Math.round(v)} ${units[i]}`;
}

const DEFAULT_MESSAGES: FileDropzoneMessages = {
  title: "Drag & drop files here",
  browse: "browse",
  dragActive: "Drop to add",
  dragRejectType: "Some of these files aren't accepted",
  dragRejectCount: (n) => (n <= 0 ? "No more files can be added" : `You can add ${n} more file${n === 1 ? "" : "s"}`),
  invalidType: () => "This file type isn't accepted.",
  tooLarge: (_f, max) => `Larger than the ${max} limit.`,
  tooMany: (_f, max) => `Only ${max} file${max === 1 ? "" : "s"} allowed.`,
  duplicate: () => "Already added.",
  rejectedTitle: (n) => `${n} file${n === 1 ? " wasn't" : "s weren't"} added`,
  remove: (f) => `Remove ${f.name}`,
  added: (n) => `${n} file${n === 1 ? "" : "s"} added.`,
  removed: (f) => `${f.name} removed.`,
  cleared: "All files removed.",
  clearAll: "Clear all",
  dismiss: "Dismiss",
  empty: "No files selected yet.",
  usage: (n, max, total) => `${n} of ${max} files · ${total}`,
};

function ruleMatches(rule: string, name: string, type: string) {
  const r = rule.trim().toLowerCase();
  if (!r) return false;
  if (r.startsWith(".")) return name.endsWith(r);
  if (r.endsWith("/*")) return type.startsWith(r.slice(0, -1));
  return type === r;
}

function isAccepted(file: File, accept: string[]) {
  if (accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((r) => ruleMatches(r, name, type));
}

/** "image/*" -> "Images", ".pdf" -> "PDF", "image/png" -> "PNG". */
function describeAccept(accept: string[]) {
  const out = accept.map((r) => {
    const v = r.trim().toLowerCase();
    if (v.startsWith(".")) return v.slice(1).toUpperCase();
    if (v.endsWith("/*")) {
      const base = v.slice(0, -2);
      return base.charAt(0).toUpperCase() + base.slice(1) + "s";
    }
    const sub = v.split("/")[1] ?? v;
    return sub.replace(/^(x-|vnd\.)/, "").replace("+xml", "").toUpperCase();
  });
  return [...new Set(out)].join(", ");
}

function fileKind(file: File) {
  const t = file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (t === "application/pdf" || ext === "pdf" || t.startsWith("text/") || ["doc", "docx", "md", "txt", "rtf"].includes(ext))
    return "doc";
  if (["zip", "rar", "7z", "gz", "tar"].includes(ext) || t.includes("zip")) return "archive";
  if (["csv", "xls", "xlsx", "numbers"].includes(ext) || t.includes("spreadsheet")) return "sheet";
  if (["js", "ts", "tsx", "jsx", "json", "html", "css", "py", "go", "rs"].includes(ext)) return "code";
  return "other";
}

const KIND_STYLE = {
  image: { icon: FileImage, tile: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  video: { icon: FileVideo, tile: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  audio: { icon: FileAudio, tile: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  doc: { icon: FileText, tile: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  archive: { icon: FileArchive, tile: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  sheet: { icon: FileSpreadsheet, tile: "bg-lime-50 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300" },
  code: { icon: FileCode, tile: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  other: { icon: FileIcon, tile: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" },
} as const;

function extensionLabel(file: File) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  return (ext || file.type.split("/")[1] || "file").toUpperCase();
}

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

const STYLES = `
@keyframes lofi-file-dropzone-ants { to { stroke-dashoffset: -28; } }
@keyframes lofi-file-dropzone-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px) rotate(-3deg); }
  40% { transform: translateX(4px) rotate(3deg); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}
@keyframes lofi-file-dropzone-in {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
.lofi-file-dropzone-ants { animation: lofi-file-dropzone-ants 0.9s linear infinite; }
.lofi-file-dropzone-shake { animation: lofi-file-dropzone-shake 0.45s ease-in-out; }
.lofi-file-dropzone-in { animation: lofi-file-dropzone-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .lofi-file-dropzone-ants, .lofi-file-dropzone-shake, .lofi-file-dropzone-in { animation: none; }
}
`;

/**
 * Drag-and-drop file picker with click-to-browse, per-file validation,
 * image thumbnails and a removable file list.
 */
export function FileDropzone({
  accept = [],
  maxSize,
  maxFiles,
  multiple = true,
  onFilesChange,
  label = "Attachments",
  hint,
  disabled = false,
  name,
  formatSize = formatBytes,
  messages: messagesProp,
  className,
}: FileDropzoneProps) {
  const m = { ...DEFAULT_MESSAGES, ...messagesProp };
  const uid = useId();
  const inputId = `${uid}-input`;
  const labelId = `${uid}-label`;
  const ctaId = `${uid}-cta`;
  const hintId = `${uid}-hint`;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [rejections, setRejections] = useState<Rejection[]>([]);
  const [rejectionKey, setRejectionKey] = useState(0);
  const [drag, setDrag] = useState<DragState>(null);
  const [thumbs, setThumbs] = useState<Record<number, "loaded" | "error">>({});
  const [announcement, setAnnouncement] = useState({ text: "", key: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);
  const nextId = useRef(1);
  const urls = useRef(new Set<string>());

  const limit = multiple ? (maxFiles ?? Infinity) : 1;
  const mimeRules = accept.filter((r) => !r.trim().startsWith("."));

  // Revoke every preview URL still alive when the component unmounts.
  useEffect(() => {
    const live = urls.current;
    return () => {
      live.forEach((u) => URL.revokeObjectURL(u));
      live.clear();
    };
  }, []);

  const revoke = (entry: Entry) => {
    if (!entry.url) return;
    URL.revokeObjectURL(entry.url);
    urls.current.delete(entry.url);
  };

  // A fresh key re-mounts the status text so repeated messages are announced again.
  const announce = (text: string) => setAnnouncement((a) => ({ text, key: a.key + 1 }));

  const commit = (next: Entry[]) => {
    setEntries(next);
    onFilesChange?.(next.map((e) => e.file));
  };

  const addFiles = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return;
    let kept = multiple ? [...entries] : [];
    const replaced = multiple ? [] : [...entries];
    const rejected: Rejection[] = [];
    const accepted: Entry[] = [];

    for (const file of incoming) {
      let reason: string | null = null;
      if ([...kept, ...accepted].some((e) => sameFile(e.file, file))) reason = m.duplicate(file);
      else if (!isAccepted(file, accept)) reason = m.invalidType(file);
      else if (maxSize !== undefined && file.size > maxSize) reason = m.tooLarge(file, formatSize(maxSize));
      else if (kept.length + accepted.length >= limit) reason = m.tooMany(file, limit);

      if (reason) {
        rejected.push({ id: nextId.current++, name: file.name, reason });
        continue;
      }
      const entry: Entry = { id: nextId.current++, file };
      if (file.type.startsWith("image/")) {
        entry.url = URL.createObjectURL(file);
        urls.current.add(entry.url);
      }
      accepted.push(entry);
    }

    // Single mode: a valid new file replaces the old one; otherwise keep the old one.
    if (!multiple) {
      if (accepted.length) replaced.forEach(revoke);
      else kept = replaced;
    }

    setRejections(rejected);
    setRejectionKey((k) => k + 1);
    if (accepted.length) {
      commit([...kept, ...accepted]);
      announce(m.added(accepted.length));
    }
  };

  const removeEntry = (entry: Entry) => {
    if (disabled) return;
    revoke(entry);
    commit(entries.filter((e) => e.id !== entry.id));
    announce(m.removed(entry.file));
    // Keep focus inside the widget after the row disappears.
    dropRef.current?.focus();
  };

  const clearAll = () => {
    if (disabled) return;
    entries.forEach(revoke);
    commit([]);
    setRejections([]);
    announce(m.cleared);
    dropRef.current?.focus();
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    // Allow picking the same file again after removing it.
    e.target.value = "";
  };

  /* ---------- Drag and drop ---------- */

  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  const evaluateDrag = (items: DataTransferItemList): DragState => {
    const files = Array.from(items).filter((i) => i.kind === "file");
    // Only MIME rules can be checked mid-drag; extensions are checked on drop.
    if (mimeRules.length && files.some((i) => i.type && !mimeRules.some((r) => ruleMatches(r, "", i.type.toLowerCase())))) {
      return { kind: "reject", reason: m.dragRejectType };
    }
    const remaining = multiple ? limit - entries.length : 1;
    if (files.length > remaining) return { kind: "reject", reason: m.dragRejectCount(remaining) };
    return { kind: "accept" };
  };

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    if (!disabled && dragDepth.current === 1) setDrag(evaluateDrag(e.dataTransfer.items));
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = disabled ? "none" : "copy";
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDrag(null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDrag(null);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  /* ---------- Rendering ---------- */

  const state = disabled ? "disabled" : drag?.kind ?? "idle";
  const defaultHint = [
    accept.length ? describeAccept(accept) : null,
    maxSize !== undefined ? `up to ${formatSize(maxSize)}${multiple ? " each" : ""}` : null,
    multiple && maxFiles !== undefined ? `max ${maxFiles} files` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const hintText = hint ?? defaultHint;
  const totalSize = entries.reduce((sum, e) => sum + e.file.size, 0);
  const showMeter = multiple && maxFiles !== undefined && Number.isFinite(maxFiles);

  return (
    <div className={cn("flex w-full flex-col gap-3 text-sm", className)}>
      <style href="lofi-file-dropzone" precedence="default">
        {STYLES}
      </style>

      <label
        htmlFor={inputId}
        id={labelId}
        className={cn("w-fit font-medium text-zinc-900 dark:text-zinc-100", disabled && "text-zinc-500 dark:text-zinc-400")}
      >
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        className="sr-only"
        tabIndex={-1}
        accept={accept.length ? accept.join(",") : undefined}
        multiple={multiple}
        disabled={disabled}
        onChange={onInputChange}
        aria-describedby={hintText ? hintId : undefined}
      />

      <div
        ref={dropRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={`${labelId} ${ctaId}`}
        aria-describedby={hintText ? hintId : undefined}
        aria-disabled={disabled || undefined}
        data-state={state}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group relative flex min-h-44 select-none flex-col items-center justify-center gap-3 rounded-xl px-5 py-8 text-center outline-none transition-[background-color,transform] duration-200 motion-reduce:transition-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
          state === "idle" &&
            "cursor-pointer bg-white hover:bg-zinc-50 active:scale-[0.995] motion-reduce:active:scale-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/60",
          state === "accept" && "cursor-copy bg-indigo-50 dark:bg-indigo-500/10",
          state === "reject" && "cursor-no-drop bg-rose-50 dark:bg-rose-500/10",
          state === "disabled" && "cursor-not-allowed bg-zinc-100/70 dark:bg-zinc-900/40",
        )}
      >
        {/* Dashed border drawn in SVG so the dashes can march while dragging. */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <rect
            x="0.75"
            y="0.75"
            rx="11"
            style={{ width: "calc(100% - 1.5px)", height: "calc(100% - 1.5px)" }}
            fill="none"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            className={cn(
              "transition-colors motion-reduce:transition-none",
              state === "idle" && "stroke-zinc-300 group-hover:stroke-zinc-400 dark:stroke-zinc-700 dark:group-hover:stroke-zinc-500",
              state === "accept" && "lofi-file-dropzone-ants stroke-indigo-500 dark:stroke-indigo-400",
              state === "reject" && "lofi-file-dropzone-ants stroke-rose-500 dark:stroke-rose-400",
              state === "disabled" && "stroke-zinc-300 dark:stroke-zinc-700",
            )}
          />
        </svg>

        {/* Fanned stack of tiles that spreads on hover and drag-over. */}
        <span aria-hidden className={cn("relative grid size-14 place-items-center", state === "reject" && "lofi-file-dropzone-shake")}>
          {state !== "reject" && (
            <>
              <span
                className={cn(
                  "absolute inset-1 rounded-xl border border-zinc-200 bg-white shadow-sm transition-transform duration-300 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-800",
                  "-rotate-6 group-hover:-translate-x-1.5 group-hover:-rotate-12",
                  state === "accept" && "-translate-x-3 -rotate-[18deg] group-hover:-translate-x-3 group-hover:-rotate-[18deg]",
                  state === "disabled" && "group-hover:translate-x-0 group-hover:-rotate-6",
                )}
              />
              <span
                className={cn(
                  "absolute inset-1 rounded-xl border border-zinc-200 bg-white shadow-sm transition-transform duration-300 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-800",
                  "rotate-6 group-hover:translate-x-1.5 group-hover:rotate-12",
                  state === "accept" && "translate-x-3 rotate-[18deg] group-hover:translate-x-3 group-hover:rotate-[18deg]",
                  state === "disabled" && "group-hover:translate-x-0 group-hover:rotate-6",
                )}
              />
            </>
          )}
          <span
            className={cn(
              "relative grid size-12 place-items-center rounded-xl border shadow-sm transition-[transform,background-color,color] duration-300 motion-reduce:transition-none",
              state === "idle" &&
                "border-zinc-200 bg-white text-zinc-600 group-hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
              state === "accept" && "-translate-y-1.5 border-indigo-500 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500",
              state === "reject" && "border-rose-300 bg-white text-rose-600 dark:border-rose-500/50 dark:bg-zinc-900 dark:text-rose-400",
              state === "disabled" && "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500",
            )}
          >
            {state === "reject" ? <Ban className="size-5" /> : <CloudUpload className="size-5" />}
          </span>
        </span>

        <span id={ctaId} className="flex flex-col gap-1">
          <span
            className={cn(
              "font-medium",
              state === "idle" && "text-zinc-800 dark:text-zinc-100",
              state === "accept" && "text-indigo-800 dark:text-indigo-200",
              state === "reject" && "text-rose-800 dark:text-rose-200",
              state === "disabled" && "text-zinc-500 dark:text-zinc-400",
            )}
          >
            {state === "accept" ? (
              m.dragActive
            ) : state === "reject" && drag?.kind === "reject" ? (
              drag.reason
            ) : (
              <>
                {m.title}{" "}
                <span className="text-zinc-500 dark:text-zinc-400">or</span>{" "}
                <span
                  className={cn(
                    "underline decoration-2 underline-offset-4",
                    disabled
                      ? "decoration-zinc-300 dark:decoration-zinc-600"
                      : "text-indigo-700 decoration-indigo-300 group-hover:decoration-indigo-600 dark:text-indigo-300 dark:decoration-indigo-500/50 dark:group-hover:decoration-indigo-300",
                  )}
                >
                  {m.browse}
                </span>
              </>
            )}
          </span>
        </span>
        {hintText && (
          <span id={hintId} className="text-xs text-zinc-500 dark:text-zinc-400">
            {hintText}
          </span>
        )}
      </div>

      {showMeter && (
        <div className="flex items-center gap-3" aria-hidden>
          {maxFiles <= 12 ? (
            <span className="flex flex-1 gap-1">
              {Array.from({ length: maxFiles }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
                    i < entries.length ? "bg-indigo-500 dark:bg-indigo-400" : "bg-zinc-200 dark:bg-zinc-800",
                  )}
                />
              ))}
            </span>
          ) : (
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <span
                className="block h-full rounded-full bg-indigo-500 transition-[width] duration-300 motion-reduce:transition-none dark:bg-indigo-400"
                style={{ width: `${(entries.length / maxFiles) * 100}%` }}
              />
            </span>
          )}
          <span className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            {m.usage(entries.length, maxFiles, formatSize(totalSize))}
          </span>
        </div>
      )}

      {/* Rejections: an alert region that stays mounted so each new batch is announced. */}
      <div role="alert" className="empty:absolute">
        {rejections.length > 0 && (
          <div
            key={rejectionKey}
            className="lofi-file-dropzone-in rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"
          >
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{m.rejectedTitle(rejections.length)}</p>
                <ul className="mt-1 space-y-0.5">
                  {rejections.map((r) => (
                    <li key={r.id} className="break-words text-[13px] text-rose-800 dark:text-rose-200">
                      <span className="font-medium">{r.name}</span> — {r.reason}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setRejections([])}
                aria-label={m.dismiss}
                className="-m-1.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-rose-700 outline-none hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-rose-300 dark:hover:bg-rose-500/15"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      <p role="status" className="sr-only">
        <span key={announcement.key}>{announcement.text}</span>
      </p>

      {entries.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-col gap-2" aria-labelledby={labelId}>
            {entries.map((entry) => {
              const kind = fileKind(entry.file);
              const style = KIND_STYLE[kind];
              const Icon = style.icon;
              const thumb = thumbs[entry.id];
              const showImage = entry.url && thumb !== "error";
              return (
                <li
                  key={entry.id}
                  className="lofi-file-dropzone-in flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 pr-1.5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg",
                      showImage
                        ? "bg-[conic-gradient(#e4e4e7_25%,#fafafa_0_50%,#e4e4e7_0_75%,#fafafa_0)] bg-[length:10px_10px] dark:bg-[conic-gradient(#27272a_25%,#18181b_0_50%,#27272a_0_75%,#18181b_0)]"
                        : style.tile,
                    )}
                  >
                    {showImage ? (
                      <>
                        {thumb !== "loaded" && (
                          <span className="absolute inset-0 bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-700" />
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview URLs can't go through next/image */}
                        <img
                          src={entry.url}
                          alt=""
                          onLoad={() => setThumbs((t) => ({ ...t, [entry.id]: "loaded" }))}
                          onError={() => setThumbs((t) => ({ ...t, [entry.id]: "error" }))}
                          className={cn(
                            "size-full object-cover transition-opacity duration-300 motion-reduce:transition-none",
                            thumb === "loaded" ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </>
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-zinc-900 dark:text-zinc-100" title={entry.file.name}>
                      {entry.file.name}
                    </span>
                    <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                      {formatSize(entry.file.size)} · {extensionLabel(entry.file)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry)}
                    disabled={disabled}
                    aria-label={m.remove(entry.file)}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 outline-none transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-indigo-500 active:bg-rose-100 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          {entries.length > 1 && !disabled && (
            <button
              type="button"
              onClick={clearAll}
              className="h-10 self-end rounded-lg px-3 text-[13px] font-medium text-zinc-600 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              {m.clearAll}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
