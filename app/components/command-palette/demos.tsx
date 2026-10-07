"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ALargeSmall,
  Archive,
  ArrowUpToLine,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  FileDown,
  FolderKanban,
  Hash,
  LayoutGrid,
  Link,
  Link2,
  Moon,
  Palette,
  Sun,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { CommandPalette, type CommandItem } from "@/components/ui/command-palette";
import { cn } from "@/lib/utils";

/* ---------- Demo app: commands that change this page ---------- */

const ACCENTS = {
  indigo: { name: "Indigo", dot: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", button: "bg-indigo-600 hover:bg-indigo-500", soft: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
  violet: { name: "Violet", dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", button: "bg-violet-600 hover:bg-violet-500", soft: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  emerald: { name: "Emerald", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", button: "bg-emerald-700 hover:bg-emerald-600", soft: "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
  rose: { name: "Rose", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", button: "bg-rose-600 hover:bg-rose-500", soft: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  amber: { name: "Amber", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", button: "bg-amber-700 hover:bg-amber-600", soft: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
} as const;
type Accent = keyof typeof ACCENTS;

const SIZES = {
  sm: { name: "Small", body: "text-[13px]", title: "text-lg" },
  base: { name: "Default", body: "text-sm", title: "text-xl" },
  lg: { name: "Large", body: "text-base", title: "text-2xl" },
} as const;
type Size = keyof typeof SIZES;

function isEditable(el: EventTarget | null) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Leave room for the sticky site header.
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: reduce ? "auto" : "smooth" });
}

export function DemoAppPalette() {
  const router = useRouter();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [accent, setAccent] = useState<Accent>("indigo");
  const [size, setSize] = useState<Size>("base");
  const [bookmarked, setBookmarked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = toastTimer;
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, []);

  const commands = useMemo<CommandItem[]>(() => {
    const showToast = (msg: string) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2200);
    };
    const copy = async (url: string, msg: string) => {
      await navigator.clipboard.writeText(url).catch(() => {
        throw new Error("Clipboard access was blocked by the browser.");
      });
      showToast(msg);
    };
    const pageUrl = () => window.location.href.split("#")[0];
    // The preview can be forced light or dark, so read the theme that applies right here.
    const toggleTheme = () => {
      const el = surfaceRef.current?.parentElement;
      const darkNow = theme ? theme === "dark" : Boolean(el?.closest(".dark")) && !el?.closest(".light");
      setTheme(darkNow ? "light" : "dark");
    };

    return [
      { id: "go-usage", group: "Navigation", label: "Go to Usage", icon: <Hash />, keywords: ["import", "snippet", "install"], onRun: () => scrollToSection("usage") },
      { id: "go-props", group: "Navigation", label: "Go to Props", icon: <Hash />, keywords: ["api", "table", "options"], onRun: () => scrollToSection("props") },
      { id: "go-a11y", group: "Navigation", label: "Go to Accessibility", icon: <Hash />, keywords: ["a11y", "aria", "keyboard"], onRun: () => scrollToSection("a11y") },
      { id: "go-top", group: "Navigation", label: "Back to top", icon: <ArrowUpToLine />, shortcut: ["⇧", "T"], onRun: () => window.scrollTo({ top: 0 }) },
      { id: "go-home", group: "Navigation", label: "Open the component gallery", icon: <LayoutGrid />, keywords: ["home", "all"], onRun: () => router.push("/") },

      { id: "copy-link", group: "Actions", label: "Copy link to this page", icon: <Link />, shortcut: ["⇧", "C"], keywords: ["share", "url"], onRun: () => copy(pageUrl(), "Page link copied") },
      { id: "copy-props", group: "Actions", label: "Copy link to the props table", icon: <Link2 />, keywords: ["share", "url"], onRun: () => copy(`${pageUrl()}#props`, "Props link copied") },
      {
        id: "bookmark",
        group: "Actions",
        label: bookmarked ? "Remove bookmark" : "Bookmark this component",
        icon: bookmarked ? <BookmarkCheck /> : <Bookmark />,
        keywords: ["favorite", "star", "save"],
        onRun: () => {
          setBookmarked((b) => !b);
          showToast(bookmarked ? "Bookmark removed" : "Bookmarked");
        },
      },
      {
        id: "fail",
        group: "Actions",
        label: "Sync with server",
        description: "fails on purpose",
        icon: <TriangleAlert />,
        onRun: () => new Promise((_, reject) => setTimeout(() => reject(new Error("Couldn't reach the server. Try again in a moment.")), 900)),
      },
      { id: "export", group: "Actions", label: "Export as PDF", description: "Pro plan", icon: <FileDown />, disabled: true },

      {
        id: "theme",
        group: "Theme",
        label: theme === "dark" ? "Switch to light mode" : theme === "light" ? "Switch to dark mode" : "Toggle dark mode",
        icon: theme === "dark" ? <Sun /> : <Moon />,
        shortcut: ["⇧", "D"],
        keywords: ["theme", "dark", "light", "appearance"],
        onRun: toggleTheme,
      },
      {
        id: "accent",
        group: "Theme",
        label: "Change accent color",
        icon: <Palette />,
        keywords: ["color", "brand"],
        children: (Object.keys(ACCENTS) as Accent[]).map((key) => ({
          id: `accent-${key}`,
          group: "Accent color",
          label: ACCENTS[key].name,
          description: key === accent ? "current" : undefined,
          icon: <span className={cn("size-3 rounded-full", ACCENTS[key].dot)} />,
          onRun: () => setAccent(key),
        })),
      },
      {
        id: "size",
        group: "Theme",
        label: "Change text size",
        icon: <ALargeSmall />,
        keywords: ["font", "zoom", "bigger", "smaller"],
        children: (Object.keys(SIZES) as Size[]).map((key) => ({
          id: `size-${key}`,
          group: "Text size",
          label: SIZES[key].name,
          description: key === size ? "current" : undefined,
          onRun: () => setSize(key),
        })),
      },
    ];
  }, [router, theme, accent, size, bookmarked]);

  // Make the shortcut hints real while the palette is closed.
  useEffect(() => {
    if (open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target)) return;
      const id = { d: "theme", c: "copy-link", t: "go-top" }[e.key.toLowerCase()];
      const cmd = id && commands.find((c) => c.id === id);
      if (!cmd) return;
      e.preventDefault();
      Promise.resolve(cmd.onRun?.()).catch(() => undefined);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, commands]);

  const a = ACCENTS[accent];
  const s = SIZES[size];

  return (
    <div ref={surfaceRef} className={cn("w-full max-w-2xl", theme)}>
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <span className="flex items-center gap-2 font-semibold">
            <BookOpen className={cn("size-5", a.text)} aria-hidden />
            Lofi Docs
          </span>
          <div className="ml-auto w-full sm:w-64">
            <CommandPalette
              commands={commands}
              open={open}
              onOpenChange={setOpen}
              portal={false}
              defaultRecent={["go-props"]}
              triggerClassName="max-w-none"
            />
          </div>
        </div>

        <div className={cn("flex flex-col gap-3 px-4 py-5 sm:px-6", s.body)}>
          <p className={cn("text-xs font-semibold uppercase tracking-wider", a.text)}>Getting started</p>
          <h3 className={cn("font-semibold tracking-tight", s.title)}>Everything is one keystroke away</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Press <kbd className="rounded border border-zinc-300 px-1 font-sans text-xs dark:border-zinc-700">Ctrl</kbd> +{" "}
            <kbd className="rounded border border-zinc-300 px-1 font-sans text-xs dark:border-zinc-700">K</kbd> (or ⌘K) anywhere on
            this page. Try “dark”, “acc” or “vio”, open a sub-page, then press Backspace to go back.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={cn("rounded-md px-2 py-1 font-medium", a.soft)}>Accent: {a.name}</span>
            <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Text: {s.name}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Theme: {theme ?? "page"}
            </span>
            {bookmarked && (
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <BookmarkCheck className="size-3.5" aria-hidden /> Bookmarked
              </span>
            )}
          </div>
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                "inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:transition-none",
                a.button,
              )}
            >
              Open the palette
            </button>
          </div>
        </div>

        <p role="status" className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          {toast && (
            <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-white dark:text-zinc-900">
              {toast}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ---------- Loading and empty states ---------- */

const PROJECTS = ["Marketing site", "Mobile app", "Design system", "Billing service", "Data warehouse", "Docs"];

export function LoadingPalette() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState("Marketing site");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = timer;
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, []);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (timer.current) clearTimeout(timer.current);
    if (next) {
      // Pretend the command list comes from the network.
      setLoading(true);
      timer.current = setTimeout(() => setLoading(false), 1200);
    }
  };

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: "switch",
        group: "Projects",
        label: "Switch project",
        icon: <FolderKanban />,
        children: PROJECTS.map((p) => ({
          id: `project-${p}`,
          group: "All projects",
          label: p,
          description: p === project ? "current" : undefined,
          onRun: () => setProject(p),
        })),
      },
      { id: "invite", group: "Projects", label: "Invite a teammate", icon: <UserPlus />, onRun: () => undefined },
      { id: "archive", group: "Projects", label: "Archive project", description: "owners only", icon: <Archive />, disabled: true },
    ],
    [project],
  );

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <CommandPalette
        commands={commands}
        open={open}
        onOpenChange={onOpenChange}
        hotkey="/"
        loading={loading}
        maxRecent={0}
        triggerLabel="Jump to a project…"
        placeholder="Search projects and actions…"
        emptyText={(q) => `Nothing called “${q}”. Try “mob” or “docs”.`}
      />
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Current project: <span className="font-medium text-zinc-800 dark:text-zinc-200">{project}</span>
      </p>
    </div>
  );
}
