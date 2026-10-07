"use client";

import { useId, useState } from "react";
import { Archive, Inbox, LoaderCircle, Rocket, RotateCcw } from "lucide-react";
import { Toaster, toast, type ToastPosition } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-800 shadow-xs outline-none transition-colors motion-reduce:transition-none hover:bg-zinc-50 hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:active:bg-zinc-700";

/* ---------- Playground: every type, position and stack size ---------- */

const POSITIONS: { id: ToastPosition; label: string }[] = [
  { id: "top-left", label: "Top left" },
  { id: "top-center", label: "Top center" },
  { id: "top-right", label: "Top right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "bottom-center", label: "Bottom center" },
  { id: "bottom-right", label: "Bottom right" },
];

export function PlaygroundDemo() {
  const [position, setPosition] = useState<ToastPosition>("bottom-right");
  const [max, setMax] = useState(3);
  const [expand, setExpand] = useState(false);
  const uid = useId();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Toaster position={position} max={max} expand={expand} />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Types</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={() => toast("Event saved to your calendar")}>
            Default
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => toast.success("Changes published", { description: "Your site is live at lofistack.dev." })}
          >
            Success
          </button>
          <button
            type="button"
            className={btn}
            onClick={() =>
              toast.error("Payment failed", { description: "The card was declined. Try another payment method." })
            }
          >
            Error
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => toast.info("New version available", { description: "Reload to get v2.4.0." })}
          >
            Info
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => toast.warning("Storage almost full", { description: "You have used 92% of 10 GB." })}
          >
            Warning
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => toast.loading("Syncing contacts…", { description: "Stays open until dismissed." })}
          >
            Loading
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-2">
          <p id={`${uid}-position`} className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Position
          </p>
          {/* A tiny screen: each button sits where its toasts will appear. */}
          <div
            role="group"
            aria-labelledby={`${uid}-position`}
            className="grid h-36 w-56 grid-cols-3 grid-rows-2 rounded-xl border border-zinc-300 bg-white p-1.5 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {POSITIONS.map((p) => {
              const [v, h] = p.id.split("-");
              const active = position === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-label={p.label}
                  aria-pressed={active}
                  onClick={() => setPosition(p.id)}
                  className={cn(
                    "group flex rounded-lg p-1.5 outline-none transition-colors motion-reduce:transition-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800",
                    v === "top" ? "items-start" : "items-end",
                    h === "left" ? "justify-start" : h === "right" ? "justify-end" : "justify-center",
                  )}
                >
                  <span
                    className={cn(
                      "h-3 w-9 rounded-sm transition-colors motion-reduce:transition-none",
                      active
                        ? "bg-indigo-600 dark:bg-indigo-400"
                        : "bg-zinc-200 group-hover:bg-zinc-300 dark:bg-zinc-700 dark:group-hover:bg-zinc-600",
                    )}
                  />
                </button>
              );
            })}
          </div>
          <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{position}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p id={`${uid}-max`} className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Visible at once
            </p>
            <div role="group" aria-labelledby={`${uid}-max`} className="inline-flex w-fit rounded-lg bg-zinc-200/70 p-1 dark:bg-zinc-800">
              {[1, 3, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={max === n}
                  onClick={() => setMax(n)}
                  className={cn(
                    "h-10 min-w-10 rounded-md px-3 text-sm font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    max === n
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <label className="inline-flex min-h-10 w-fit cursor-pointer items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={expand}
              onChange={(e) => setExpand(e.target.checked)}
              className="size-4 accent-indigo-600 dark:accent-indigo-400"
            />
            Always expanded
          </label>
          <button type="button" className={cn(btn, "w-fit")} onClick={() => toast.dismiss()}>
            Dismiss all
          </button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hover the stack to fan it out and pause the timers. Press F8 to jump to the newest toast, Escape to close it,
            or swipe it sideways.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Promise toast ---------- */

function fakeDeploy(fail: boolean) {
  return new Promise<{ seconds: number }>((resolve, reject) => {
    setTimeout(() => (fail ? reject(new Error("Build step exited with code 1")) : resolve({ seconds: 2.1 })), 2100);
  });
}

export function PromiseDemo() {
  const [fail, setFail] = useState(false);
  const [pending, setPending] = useState(false);

  const deploy = () => {
    setPending(true);
    toast
      .promise(fakeDeploy(fail), {
        loading: "Deploying component-gallery…",
        success: (d) => `Deployed in ${d.seconds}s`,
        error: (e) => `Deploy failed: ${e instanceof Error ? e.message : "unknown error"}`,
      })
      .catch(() => undefined)
      .finally(() => setPending(false));
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
      <button
        type="button"
        onClick={deploy}
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm outline-none transition-colors motion-reduce:transition-none hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-900"
      >
        {pending ? (
          <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
        ) : (
          <Rocket className="size-4" aria-hidden />
        )}
        {pending ? "Deploying…" : "Deploy to production"}
      </button>
      <label className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={fail}
          disabled={pending}
          onChange={(e) => setFail(e.target.checked)}
          className="size-4 accent-indigo-600 disabled:cursor-not-allowed dark:accent-indigo-400"
        />
        Make the next deploy fail
      </label>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        One toast goes from loading to success or error in place, and its timer starts only once it settles.
      </p>
    </div>
  );
}

/* ---------- Undo ---------- */

const EMAILS = [
  { id: "1", from: "Maya Chen", subject: "Design review moved to Thursday" },
  { id: "2", from: "Vercel", subject: "Your deployment is ready" },
  { id: "3", from: "Leo Martins", subject: "Invoice #1042 for September" },
  { id: "4", from: "LofiStack", subject: "Week 10 challenge is open" },
];

export function UndoDemo() {
  const [archived, setArchived] = useState<string[]>([]);
  const inbox = EMAILS.filter((e) => !archived.includes(e.id));

  const archive = (email: (typeof EMAILS)[number]) => {
    setArchived((a) => [...a, email.id]);
    toast("Email archived", {
      id: `archive-${email.id}`,
      description: email.subject,
      duration: 6000,
      action: { label: "Undo", onClick: () => setArchived((a) => a.filter((id) => id !== email.id)) },
    });
  };

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <p className="text-sm font-semibold">Inbox</p>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {inbox.length}
        </span>
      </div>
      {inbox.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <Inbox className="size-8 text-zinc-400 dark:text-zinc-500" aria-hidden />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Inbox zero. Nice.</p>
          <button type="button" className={btn} onClick={() => setArchived([])}>
            <RotateCcw className="size-4" aria-hidden /> Restore all
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {inbox.map((email) => (
            <li key={email.id} className="flex items-center gap-3 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{email.from}</p>
                <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">{email.subject}</p>
              </div>
              <button
                type="button"
                aria-label={`Archive "${email.subject}"`}
                title="Archive"
                onClick={() => archive(email)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 outline-none transition-colors motion-reduce:transition-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
              >
                <Archive className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
