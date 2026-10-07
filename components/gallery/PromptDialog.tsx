"use client";

import { useId, useRef, type ReactNode } from "react";
import { FileText, X } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { cn } from "@/lib/utils";

interface PromptDialogProps {
  /** Dialog heading, e.g. "#54 Typing Indicator". */
  title: string;
  subtitle?: string;
  /** Text shown and copied. */
  prompt: string;
  /** Optional ready-made lofidb post, copied by a second button. */
  post?: string;
  postLabel?: string;
  /** Label of the main copy button. */
  copyLabel?: string;
  triggerLabel?: string;
  triggerIcon?: ReactNode;
  className?: string;
}

/** A trigger button plus a native <dialog> (focus trap and Esc come built in). */
export function PromptDialog({
  title,
  subtitle,
  prompt,
  post,
  postLabel = "Copy lofidb post",
  copyLabel = "Copy prompt",
  triggerLabel = "Prompt",
  triggerIcon = <FileText className="size-3.5" aria-hidden />,
  className,
}: PromptDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
          className,
        )}
      >
        {triggerIcon}
        {triggerLabel}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold tracking-tight">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-zinc-500 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words bg-zinc-50 px-5 py-4 font-mono text-[12.5px] leading-relaxed text-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
            {prompt}
          </pre>
          <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
            {post && <CopyButton value={post} label={postLabel} text={postLabel} />}
            <CopyButton value={prompt} label={copyLabel} text={copyLabel} />
          </div>
        </div>
      </dialog>
    </>
  );
}
