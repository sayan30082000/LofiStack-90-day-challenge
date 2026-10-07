"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Mode = "system" | "light" | "dark";
const ORDER: Mode[] = ["system", "light", "dark"];

function readMode(): Mode {
  try {
    const v = localStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(mode: Mode) {
  const dark =
    mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

const subscribeMounted = () => () => {};

/** Cycles the site theme: system → light → dark. */
export function ThemeToggle() {
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const [mode, setMode] = useState<Mode>(() => (typeof window === "undefined" ? "system" : readMode()));

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const next = () => {
    const m = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(m);
    try {
      localStorage.setItem("theme", m);
    } catch {}
    apply(m);
  };

  const shown = mounted ? mode : "system";
  const Icon = shown === "dark" ? Moon : shown === "light" ? Sun : Monitor;

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`Theme: ${shown}. Switch theme`}
      title={`Theme: ${shown}`}
      className="inline-flex size-10 items-center justify-center rounded-md text-zinc-600 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
