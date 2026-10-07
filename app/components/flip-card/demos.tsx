"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Mail, MapPin, RotateCcw, Ticket } from "lucide-react";
import { FlipCard } from "@/components/ui/flip-card";
import { cn } from "@/lib/utils";

const ghostButton =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700";

/* ---------- Physical postcard ---------- */

export function PostcardDemo() {
  const [flips, setFlips] = useState(0);
  const [peeking, setPeeking] = useState(false);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <FlipCard
        className="aspect-[3/2] w-full"
        label="Turn the postcard over"
        onFlip={() => setFlips((n) => n + 1)}
        onPeek={setPeeking}
        front={
          <div className="relative h-full bg-[linear-gradient(160deg,#0ea5e9_0%,#6366f1_45%,#f59e0b_100%)] p-5 text-white">
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(60%_100%_at_30%_100%,rgb(16_185_129/0.85),transparent_70%),radial-gradient(50%_90%_at_80%_100%,rgb(5_150_105/0.9),transparent_70%)]" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Greetings from</p>
            <p className="relative mt-1 text-3xl font-bold tracking-tight drop-shadow sm:text-4xl">Sajek Valley</p>
            <p className="absolute bottom-4 left-5 rounded-md bg-black/35 px-2 py-1 text-xs font-medium backdrop-blur-sm">
              Press near an edge
            </p>
          </div>
        }
        back={
          <div className="grid h-full grid-cols-[1fr_auto] gap-4 bg-[#fdfaf3] p-5 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            <div className="flex flex-col">
              <p className="font-serif text-base italic leading-relaxed">
                Clouds below us at sunrise. Pressing a card’s edge to turn it feels right, doesn’t it?
              </p>
              <p className="mt-auto font-serif italic">— S.</p>
            </div>
            <div className="flex w-24 flex-col gap-3 border-l border-dashed border-zinc-300 pl-4 pr-10 dark:border-zinc-700 sm:w-32">
              <div aria-hidden className="ml-auto mt-10 grid size-12 place-items-center rounded-sm border-2 border-dotted border-rose-400 text-[10px] font-bold text-rose-500">
                ৳10
              </div>
              <span aria-hidden className="h-px bg-zinc-300 dark:bg-zinc-700" />
              <span aria-hidden className="h-px bg-zinc-300 dark:bg-zinc-700" />
              <span aria-hidden className="h-px bg-zinc-300 dark:bg-zinc-700" />
            </div>
          </div>
        }
      />
      <ul className="grid grid-cols-1 gap-1 text-xs text-zinc-600 sm:grid-cols-3 dark:text-zinc-400">
        <li>
          <b className="font-medium text-zinc-800 dark:text-zinc-200">Press an edge:</b> it turns away from your finger
        </li>
        <li>
          <b className="font-medium text-zinc-800 dark:text-zinc-200">Hover:</b> it leans toward the way it will turn
        </li>
        <li>
          <b className="font-medium text-zinc-800 dark:text-zinc-200">Hold:</b> peek at the back, let go to return
        </li>
      </ul>
      <p aria-live="polite" className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
        flips: {flips} · peeking: {peeking ? "yes" : "no"}
      </p>
    </div>
  );
}

/* ---------- Flashcard deck ---------- */

const WORDS = [
  {
    word: "Serendipity",
    phonetic: "/ˌser.ənˈdɪp.ə.ti/",
    pos: "noun",
    definition: "Finding something good without looking for it.",
    example: "Meeting her co-founder at a bus stop was pure serendipity.",
  },
  {
    word: "Ephemeral",
    phonetic: "/ɪˈfem.ər.əl/",
    pos: "adjective",
    definition: "Lasting for a very short time.",
    example: "The stream felt cosy, but the chat was ephemeral.",
  },
  {
    word: "Petrichor",
    phonetic: "/ˈpet.rɪ.kɔːr/",
    pos: "noun",
    definition: "The earthy smell when rain falls on dry ground.",
    example: "She opened the window to let the petrichor in.",
  },
];

type Mark = "learning" | "known";

export function FlashcardDemo() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [marks, setMarks] = useState<Record<number, Mark>>({});
  const card = WORDS[index];
  const known = Object.values(marks).filter((m) => m === "known").length;

  const go = (next: number) => {
    setIndex(next);
    setFlipped(false);
  };
  const mark = (m: Mark) => {
    setMarks((prev) => ({ ...prev, [index]: m }));
    if (index < WORDS.length - 1) go(index + 1);
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-stretch gap-4">
      <div className="relative">
        {/* Deck edges peeking out behind the top card */}
        <div aria-hidden className="absolute inset-x-4 -bottom-3 h-full rounded-xl border border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/60" />
        <div aria-hidden className="absolute inset-x-2 -bottom-1.5 h-full rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/80" />
        <FlipCard
          key={index}
          className="h-72"
          flipped={flipped}
          onFlip={setFlipped}
          label={`Show the meaning of ${card.word}`}
          front={
            <div className="flex h-full flex-col justify-between bg-[radial-gradient(120%_80%_at_100%_0%,rgb(99_102_241/0.12),transparent_60%)] p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">{card.pos}</span>
              <div>
                <p className="text-3xl font-semibold tracking-tight">{card.word}</p>
                <p className="mt-1 font-mono text-sm text-zinc-600 dark:text-zinc-400">{card.phonetic}</p>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Tap anywhere to flip, or press and hold to peek</p>
            </div>
          }
          back={
            <div className="flex h-full flex-col p-6">
              <p className="pr-10 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{card.word}</p>
              <p className="mt-2 text-lg font-medium leading-snug">{card.definition}</p>
              <p className="mt-2 text-sm italic text-zinc-600 dark:text-zinc-400">“{card.example}”</p>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                <button type="button" aria-pressed={marks[index] === "learning"} onClick={() => mark("learning")} className={ghostButton}>
                  <RotateCcw className="size-4" aria-hidden /> Still learning
                </button>
                <button
                  type="button"
                  aria-pressed={marks[index] === "known"}
                  onClick={() => mark("known")}
                  className={cn(ghostButton, "border-transparent bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 dark:border-transparent dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400 dark:active:bg-indigo-600")}
                >
                  <Check className="size-4" aria-hidden /> Got it
                </button>
              </div>
            </div>
          }
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className={ghostButton}>
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </button>
        <div className="flex flex-col items-center gap-1.5">
          <p aria-live="polite" className="text-sm font-medium tabular-nums">
            Card {index + 1} of {WORDS.length}
          </p>
          <div aria-hidden className="flex gap-1.5">
            {WORDS.map((w, i) => (
              <span
                key={w.word}
                className={cn(
                  "h-1.5 rounded-full transition-all motion-reduce:transition-none",
                  i === index ? "w-5 bg-indigo-600 dark:bg-indigo-400" : "w-1.5",
                  i !== index && (marks[i] === "known" ? "bg-emerald-500" : marks[i] === "learning" ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700"),
                )}
              />
            ))}
          </div>
        </div>
        <button type="button" onClick={() => go(index + 1)} disabled={index === WORDS.length - 1} className={ghostButton}>
          Next <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      <p className="text-center text-xs text-zinc-600 dark:text-zinc-400">
        {known} of {WORDS.length} marked as known
      </p>
    </div>
  );
}

/* ---------- Hover team card ---------- */

function Avatar({ initials }: { initials: string }) {
  return (
    <svg viewBox="0 0 96 96" className="size-24 drop-shadow-sm" aria-hidden>
      <defs>
        <linearGradient id="flip-card-avatar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="48" fill="url(#flip-card-avatar)" />
      <circle cx="74" cy="20" r="14" fill="#fff" opacity=".15" />
      <text x="48" y="58" textAnchor="middle" fontSize="30" fontWeight="600" fill="#fff" fontFamily="inherit">
        {initials}
      </text>
    </svg>
  );
}

export function TeamCardDemo() {
  const [copied, setCopied] = useState(false);
  const email = "maya@example.com";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <FlipCard
      trigger="hover"
      className="h-80 w-full max-w-xs"
      label="Show more about Maya Okafor"
      front={
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <Avatar initials="MO" />
          <div>
            <p className="text-lg font-semibold">Maya Okafor</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Design Engineer</p>
          </div>
          <p className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            <MapPin className="size-3.5" aria-hidden /> Lisbon, remote
          </p>
        </div>
      }
      back={
        <div className="flex h-full flex-col bg-zinc-900 p-6 text-zinc-100 dark:bg-zinc-950">
          <p className="pr-10 text-sm font-semibold">Maya Okafor</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Builds the component library and owns the motion guidelines. Ex-agency, cat person, lo-fi on repeat.
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
            {["React", "Motion", "A11y", "Figma"].map((s) => (
              <li key={s} className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-zinc-100">
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
            <a
              href={`mailto:${email}`}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-white text-sm font-medium text-zinc-900 outline-none hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Mail className="size-4" aria-hidden /> Email
            </a>
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-white/20 text-sm font-medium text-zinc-100 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              <span aria-live="polite">{copied ? "Copied" : "Copy email"}</span>
            </button>
          </div>
        </div>
      }
      backClassName="border-zinc-800"
    />
  );
}

/* ---------- Vertical flip ticket ---------- */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const QR_SIZE = 21;
const QR_CELLS: [number, number][] = (() => {
  const rand = mulberry32(2410);
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8);
  const cells: [number, number][] = [];
  for (let y = 0; y < QR_SIZE; y++)
    for (let x = 0; x < QR_SIZE; x++) if (!inFinder(x, y) && rand() > 0.52) cells.push([x, y]);
  return cells;
})();

function FakeCode() {
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="var(--qr-bg)" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`} className="size-28 text-zinc-900 [--qr-bg:#fff]" aria-hidden shapeRendering="crispEdges">
      <rect x={-1} y={-1} width={QR_SIZE + 2} height={QR_SIZE + 2} fill="var(--qr-bg)" />
      {finder(0, 0)}
      {finder(QR_SIZE - 7, 0)}
      {finder(0, QR_SIZE - 7)}
      {QR_CELLS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}

export function TicketDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <FlipCard
        direction="vertical"
        className="h-56"
        label="Show ticket code"
        controlPosition="bottom-right"
        front={
          <div className="relative flex h-full flex-col justify-between bg-[linear-gradient(135deg,#4338ca,#7c3aed_55%,#db2777)] p-6 text-white">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
                <Ticket className="size-3.5" aria-hidden /> General admission
              </span>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">LofiStack Live</p>
              <p className="mt-1 text-sm text-white/85">Sat 24 Oct · Doors 19:30</p>
              <p className="text-sm text-white/85">Hall B, Lisbon</p>
            </div>
            {/* Perforation */}
            <span aria-hidden className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-zinc-50 dark:bg-zinc-900" />
            <span aria-hidden className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-zinc-50 dark:bg-zinc-900" />
          </div>
        }
        back={
          <div className="flex h-full items-center gap-5 p-6">
            <div className="shrink-0 rounded-lg bg-white p-1.5 ring-1 ring-zinc-200 dark:ring-zinc-700">
              <FakeCode />
            </div>
            <dl className="min-w-0 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-zinc-600 dark:text-zinc-400">Seat</dt>
                <dd className="font-semibold">Row F · 12</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-600 dark:text-zinc-400">Holder</dt>
                <dd className="truncate font-semibold">Sam Rivera</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-600 dark:text-zinc-400">Order</dt>
                <dd className="font-mono text-[13px]">LS-2410-0012</dd>
              </div>
            </dl>
          </div>
        }
        frontClassName="border-transparent dark:border-transparent"
      />
      <p className="text-center text-xs text-zinc-600 dark:text-zinc-400">Rotates around the X axis. Click the ticket or the button.</p>
    </div>
  );
}
