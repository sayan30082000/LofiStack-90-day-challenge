"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Monitor, Moon, Smartphone, Sun, SunMoon, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "preview" | "code";
type Viewport = "mobile" | "tablet" | "full";
type PreviewTheme = "page" | "light" | "dark";

const VIEWPORTS: { id: Viewport; label: string; width: string; icon: typeof Monitor }[] = [
  { id: "mobile", label: "Mobile width (375px)", width: "375px", icon: Smartphone },
  { id: "tablet", label: "Tablet width (768px)", width: "768px", icon: Tablet },
  { id: "full", label: "Full width", width: "100%", icon: Monitor },
];

const THEMES: { id: PreviewTheme; label: string; icon: typeof Sun }[] = [
  { id: "page", label: "Match site theme", icon: SunMoon },
  { id: "light", label: "Light preview", icon: Sun },
  { id: "dark", label: "Dark preview", icon: Moon },
];

interface PreviewTabsProps {
  preview: ReactNode;
  code: ReactNode;
  /** Minimum height of the preview stage. */
  minHeight?: number;
  /** Center the preview content in the stage. */
  center?: boolean;
}

export function PreviewTabs({ preview, code, minHeight = 280, center = true }: PreviewTabsProps) {
  const id = useId();
  const [tab, setTab] = useState<Tab>("preview");
  const [viewport, setViewport] = useState<Viewport>("full");
  const [theme, setTheme] = useState<PreviewTheme>("page");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ preview: null, code: null });

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next: Tab = e.key === "Home" ? "preview" : e.key === "End" ? "code" : tab === "preview" ? "code" : "preview";
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const width = VIEWPORTS.find((v) => v.id === viewport)!.width;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-950">
        <div role="tablist" aria-label="View" className="flex gap-1" onKeyDown={onTabKey}>
          {(["preview", "code"] as Tab[]).map((t) => (
            <button
              key={t}
              ref={(el) => {
                tabRefs.current[t] = el;
              }}
              role="tab"
              type="button"
              id={`${id}-tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`${id}-panel-${t}`}
              tabIndex={tab === t ? 0 : -1}
              onClick={() => setTab(t)}
              className={cn(
                "h-9 rounded-md px-3 text-sm font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                tab === t
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "preview" && (
          <div className="flex items-center gap-2">
            <ToolGroup label="Preview width">
              {VIEWPORTS.map((v) => (
                <ToolButton key={v.id} label={v.label} pressed={viewport === v.id} onClick={() => setViewport(v.id)}>
                  <v.icon className="size-4" aria-hidden />
                </ToolButton>
              ))}
            </ToolGroup>
            <ToolGroup label="Preview theme">
              {THEMES.map((t) => (
                <ToolButton key={t.id} label={t.label} pressed={theme === t.id} onClick={() => setTheme(t.id)}>
                  <t.icon className="size-4" aria-hidden />
                </ToolButton>
              ))}
            </ToolGroup>
          </div>
        )}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel-preview`}
        aria-labelledby={`${id}-tab-preview`}
        hidden={tab !== "preview"}
        className={cn(
          theme === "light" && "light",
          theme === "dark" && "dark",
          "bg-zinc-50 text-zinc-900 [background-image:radial-gradient(circle,rgb(0_0_0/0.07)_1px,transparent_1px)] [background-size:18px_18px] dark:bg-zinc-900 dark:text-zinc-100 dark:[background-image:radial-gradient(circle,rgb(255_255_255/0.07)_1px,transparent_1px)]",
        )}
      >
        <div className="overflow-x-auto px-4 py-8 sm:px-8 sm:py-10">
          <div
            className={cn(
              "mx-auto w-full transition-[max-width] duration-300 motion-reduce:transition-none",
              center && "flex flex-col items-center justify-center",
              viewport !== "full" &&
                "rounded-lg outline outline-1 outline-dashed outline-zinc-300 outline-offset-8 dark:outline-zinc-700",
            )}
            style={{ maxWidth: width, minHeight }}
          >
            {preview}
          </div>
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel-code`}
        aria-labelledby={`${id}-tab-code`}
        hidden={tab !== "code"}
        className="bg-white p-3 dark:bg-zinc-950"
      >
        {code}
      </div>
    </div>
  );
}

function ToolGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-800/70">
      {children}
    </div>
  );
}

function ToolButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        pressed
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
      )}
    >
      {children}
    </button>
  );
}
