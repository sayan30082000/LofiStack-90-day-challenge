"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Check, Copy, ExternalLink, Plus } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";
import { cn } from "@/lib/utils";

/* ---------- Membership card ---------- */

const MEMBER_NUMBER = "4096 2187 0042 9918";

export function MembershipDemo() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = timer;
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MEMBER_NUMBER.replaceAll(" ", ""));
    } catch {
      // Clipboard can be blocked; the visual confirmation still helps in the demo.
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <TiltCard
      wrapperClassName="w-full max-w-[22rem]"
      className="aspect-[1.586/1] w-full rounded-2xl bg-[linear-gradient(135deg,#1e1b4b_0%,#3730a3_45%,#6d28d9_100%)] text-white ring-1 ring-white/10"
    >
      {/* Background pattern, flush with the surface */}
      <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className="size-full">
          <defs>
            <radialGradient id="lofi-tilt-demo-orb" cx="0.85" cy="0.1" r="0.7">
              <stop offset="0" stopColor="#a5b4fc" stopOpacity="0.55" />
              <stop offset="1" stopColor="#a5b4fc" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="200" fill="url(#lofi-tilt-demo-orb)" />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx="300" cy="-10" r={40 + i * 26} fill="none" stroke="white" strokeOpacity={0.09 - i * 0.008} />
          ))}
        </svg>
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <p data-depth="30" className="font-mono text-[11px] font-semibold tracking-[0.32em]">
            LOFI MEMBER
          </p>
          {/* Chip */}
          <svg data-depth="45" aria-hidden viewBox="0 0 40 30" className="h-7 w-9 drop-shadow">
            <rect x="0.5" y="0.5" width="39" height="29" rx="6" fill="#fcd34d" stroke="#b45309" strokeOpacity="0.5" />
            <path d="M0 10h13M0 20h13M27 10h13M27 20h13M13 0v30M27 0v30" stroke="#b45309" strokeOpacity="0.55" />
          </svg>
        </div>

        <p data-depth="40" className="font-mono text-lg tracking-[0.14em] tabular-nums drop-shadow-sm sm:text-xl">
          {MEMBER_NUMBER}
        </p>

        <div className="flex items-end justify-between gap-3">
          <div data-depth="25" className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-200">Member since 2026</p>
            <p className="truncate text-base font-semibold">Alex Rivera</p>
          </div>
          <button
            data-depth="35"
            type="button"
            onClick={copy}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-medium outline-none backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:bg-white/30 motion-reduce:transition-none"
          >
            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy number"}
          </button>
          <span role="status" className="sr-only">
            {copied ? "Member number copied" : ""}
          </span>
        </div>
      </div>
    </TiltCard>
  );
}

/* ---------- Game cover ---------- */

export function GameCoverDemo() {
  const [owned, setOwned] = useState(false);

  return (
    <TiltCard
      maxTilt={16}
      perspective={800}
      glareColor="rgb(255 237 213 / 0.7)"
      wrapperClassName="w-full max-w-[15rem]"
      className="aspect-[3/4] w-full rounded-2xl bg-[#140a2e] text-white ring-1 ring-white/10"
    >
      {/* Sky and sun */}
      <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" className="size-full">
          <defs>
            <linearGradient id="lofi-tilt-demo-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#140a2e" />
              <stop offset="0.55" stopColor="#7e22ce" />
              <stop offset="0.8" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="lofi-tilt-demo-sun" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fde047" />
              <stop offset="1" stopColor="#fb7185" />
            </linearGradient>
            <clipPath id="lofi-tilt-demo-stripes">
              <rect x="0" y="0" width="240" height="150" />
              <rect x="0" y="156" width="240" height="7" />
              <rect x="0" y="168" width="240" height="5" />
              <rect x="0" y="177" width="240" height="4" />
            </clipPath>
          </defs>
          <rect width="240" height="320" fill="url(#lofi-tilt-demo-sky)" />
          <circle cx="120" cy="160" r="62" fill="url(#lofi-tilt-demo-sun)" clipPath="url(#lofi-tilt-demo-stripes)" />
        </svg>
      </div>

      {/* Mountains and grid floor, lifted a little */}
      <div data-depth="18" aria-hidden className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" className="size-full">
          <path d="M0 200 L40 160 L70 185 L110 140 L150 182 L185 150 L240 195 L240 210 L0 210 Z" fill="#3b0764" />
          <path d="M0 210 L240 210 L240 320 L0 320 Z" fill="#1a0b3d" />
          <g stroke="#e879f9" strokeOpacity="0.55" strokeWidth="1">
            {[214, 222, 234, 250, 272, 300].map((y) => (
              <line key={y} x1="0" x2="240" y1={y} y2={y} />
            ))}
            {[-160, -100, -50, -15, 15, 50, 100, 160].map((dx) => (
              <line key={dx} x1={120 + dx * 0.15} y1="210" x2={120 + dx * 1.6} y2="320" />
            ))}
          </g>
        </svg>
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div data-depth="40" className="flex items-center justify-between">
          <span className="rounded-md bg-black/45 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.2em]">
            LOFI ARCADE
          </span>
          <span role="img" aria-label="Rated E for everyone" className="grid size-7 place-items-center rounded-md bg-white text-xs font-black text-zinc-900">
            E
          </span>
        </div>

        <div data-depth="65" className="text-center">
          <p className="text-[2.5rem] font-black italic leading-[0.85] tracking-tight text-white drop-shadow-[0_3px_0_#db2777]">
            NEON
            <br />
            DRIFT
          </p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.3em] text-fuchsia-100">Night Circuit</p>
        </div>

        <button
          data-depth="30"
          type="button"
          aria-pressed={owned}
          onClick={() => setOwned((o) => !o)}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none",
            owned
              ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
              : "bg-white text-zinc-900 hover:bg-fuchsia-100 active:bg-fuchsia-200",
          )}
        >
          {owned ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          {owned ? "In your library" : "Add to library"}
        </button>
      </div>
    </TiltCard>
  );
}

/* ---------- Plain image card with controls ---------- */

export function ImageCardDemo() {
  const id = useId();
  const [maxTilt, setMaxTilt] = useState(12);
  const [perspective, setPerspective] = useState(1000);
  const [glare, setGlare] = useState(true);
  const [disabled, setDisabled] = useState(false);

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
      <TiltCard
        maxTilt={maxTilt}
        perspective={perspective}
        glare={glare}
        disabled={disabled}
        wrapperClassName="mx-auto w-full max-w-sm"
        className="rounded-2xl bg-white p-2 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
      >
        <figure>
          <Image
            src="/demo/tilt-card/lake-at-dusk.svg"
            alt="Illustration of a lake at dusk with purple hills and a low sun"
            width={800}
            height={600}
            unoptimized
            className="h-auto w-full rounded-xl"
          />
          <figcaption className="flex items-center justify-between gap-2 px-2 pb-1 pt-2.5">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">Lake at dusk</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">SVG · 800 × 600</span>
            </span>
            <a
              href="/demo/tilt-card/lake-at-dusk.svg"
              target="_blank"
              rel="noreferrer"
              aria-label="Open the full-size image in a new tab"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </figcaption>
        </figure>
      </TiltCard>

      <fieldset className="flex min-w-0 flex-col gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Props</legend>
        <Range id={`${id}-tilt`} label="maxTilt" value={maxTilt} min={0} max={30} unit="°" onChange={setMaxTilt} />
        <Range
          id={`${id}-persp`}
          label="perspective"
          value={perspective}
          min={400}
          max={2000}
          step={100}
          unit="px"
          onChange={setPerspective}
        />
        <Toggle label="glare" checked={glare} onChange={setGlare} />
        <Toggle label="disabled" checked={disabled} onChange={setDisabled} />
      </fieldset>
    </div>
  );
}

function Range({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="font-mono text-[13px]">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 w-full cursor-pointer accent-indigo-600 dark:accent-indigo-400"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex h-10 cursor-pointer items-center justify-between gap-3">
      <span className="font-mono text-[13px]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 cursor-pointer accent-indigo-600 dark:accent-indigo-400"
      />
    </label>
  );
}
