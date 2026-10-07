import { codeToHtml } from "shiki";
import { CopyButton } from "./CopyButton";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  lang?: string;
  filename?: string;
  className?: string;
}

/** Server-rendered, syntax-highlighted code with a copy button. */
export async function CodeBlock({ code, lang = "tsx", filename, className }: CodeBlockProps) {
  const source = code.trim();
  const html = await codeToHtml(source, {
    lang,
    // High-contrast variants keep every token above 4.5:1 (WCAG 1.4.3).
    themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
    defaultColor: false,
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <span className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">{filename ?? lang}</span>
        <CopyButton value={source} />
      </div>
      {/* Focusable so keyboard users can scroll long lines (WCAG 2.1.1). */}
      <div
        tabIndex={0}
        role="region"
        aria-label={filename ? `${filename} code` : "Code"}
        className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 [&_pre]:outline-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
