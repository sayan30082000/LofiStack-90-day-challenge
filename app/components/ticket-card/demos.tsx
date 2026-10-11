"use client";

import { useState } from "react";
import { MapPin, Plane, RotateCcw, Ticket } from "lucide-react";
import { AddToCalendar, TicketBarcode, TicketCard, type TicketEvent } from "@/components/ui/ticket-card";

const resetBtn =
  "inline-flex h-10 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800";

/* ---------- Concert ---------- */

const CONCERT: TicketEvent = {
  title: "Lofi Nights Live",
  // 21 Nov 2026, 7:30–10:30 PM in Dhaka (UTC+6).
  start: new Date(Date.UTC(2026, 10, 21, 13, 30)),
  end: new Date(Date.UTC(2026, 10, 21, 16, 30)),
  location: "Open Air Stage, Hatirjheel, Dhaka",
  description: "Gate C · Row F · Seat 17",
  uid: "lofi-nights-2026-f17@lofistack",
};

export function ConcertDemo() {
  const [torn, setTorn] = useState(false);
  const [checkedIn, setCheckedIn] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <TicketCard
        label="Concert ticket, Lofi Nights Live"
        torn={torn}
        onTear={() => {
          setTorn(true);
          setCheckedIn(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
        }}
        // One gradient split at the perforation, so the colours meet seamlessly.
        paperClassName="text-white"
        mainClassName="bg-[linear-gradient(to_right,#312e81,#5b21b6)]"
        stubClassName="bg-[linear-gradient(to_right,#5b21b6,#9d174d)]"
        main={
          <div className="flex h-full flex-col gap-4">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              <Ticket className="size-4" aria-hidden /> Admit one
            </p>
            <div>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Lofi Nights Live</h3>
              <p className="mt-1 text-sm text-white/90">Sat, 21 Nov 2026 · Doors 7:30 PM</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-white/90">
                <MapPin className="size-3.5" aria-hidden /> Open Air Stage, Hatirjheel, Dhaka
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              {[
                ["Gate", "C"],
                ["Row", "F"],
                ["Seat", "17"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-white/10 px-3 py-2">
                  <dt className="text-xs text-white/90">{k}</dt>
                  <dd className="text-lg font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <AddToCalendar event={CONCERT} className="self-start border-white/40 text-white hover:bg-white/10" />
          </div>
        }
        stub={
          <div className="flex h-full flex-col items-center justify-center gap-3 pt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Check-in stub</p>
            <TicketBarcode value="LN-F17" height={56} />
            <p className="text-xs text-white/90">Tear here at the gate</p>
          </div>
        }
        tornContent={
          <p className="text-sm">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Checked in</span>
            <br />
            {checkedIn ?? ""}
          </p>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <p>Drag the stub away from the ticket (down on narrow screens), or press the scissors.</p>
        <button
          type="button"
          onClick={() => {
            setTorn(false);
            setCheckedIn(null);
          }}
          disabled={!torn}
          className={resetBtn}
        >
          <RotateCcw className="size-4" aria-hidden /> New ticket
        </button>
      </div>
    </div>
  );
}

/* ---------- Boarding pass (vertical) ---------- */

export function BoardingPassDemo() {
  const [key, setKey] = useState(0);
  const [boarded, setBoarded] = useState(false);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <TicketCard
        key={key}
        label="Boarding pass, Dhaka to Cox's Bazar"
        orientation="vertical"
        onTear={() => setBoarded(true)}
        main={
          <div className="flex flex-col gap-4">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">
              <Plane className="size-4" aria-hidden /> Lofi Air · Boarding pass
            </p>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-3xl font-bold">DAC</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Dhaka</p>
              </div>
              <span aria-hidden className="h-px flex-1 border-t-2 border-dotted border-zinc-300 dark:border-zinc-600" />
              <span className="sr-only">to</span>
              <div className="text-right">
                <p className="text-3xl font-bold">CXB</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Cox&apos;s Bazar</p>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              {[
                ["Flight", "LA 412"],
                ["Gate", "6"],
                ["Seat", "12A"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-zinc-600 dark:text-zinc-400">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        }
        stub={
          <div className="flex flex-col items-center gap-2 pt-4">
            <TicketBarcode value="LA412 12A" height={44} />
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Boarding stub · drag down</p>
          </div>
        }
        tornContent={<span className="font-medium">Boarded. Have a good flight.</span>}
      />
      <button type="button" onClick={() => { setKey((k) => k + 1); setBoarded(false); }} disabled={!boarded} className={resetBtn + " self-start"}>
        <RotateCcw className="size-4" aria-hidden /> Reset pass
      </button>
    </div>
  );
}

/* ---------- Used ---------- */

export function UsedDemo() {
  return (
    <div className="w-full max-w-xl">
      <TicketCard
        label="Cinema ticket, already used"
        used
        usedLabel="Used"
        main={
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">Cinema · Hall 2</p>
            <h3 className="mt-1 text-xl font-bold">The Monsoon Tapes</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Fri, 9 Oct 2026 · 6:15 PM · Seat H8</p>
          </div>
        }
        stub={
          <div className="flex h-full flex-col items-center justify-center gap-2 pt-6">
            <TicketBarcode value="H8-0910" height={40} />
          </div>
        }
      />
    </div>
  );
}
