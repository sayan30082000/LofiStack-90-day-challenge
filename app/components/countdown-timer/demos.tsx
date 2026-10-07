"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, PartyPopper, RotateCcw, Rocket } from "lucide-react";
import { CountdownTimer, type CountdownStatus, type CountdownTimerHandle } from "@/components/ui/countdown-timer";
import { cn } from "@/lib/utils";

/* ---------- Product launch ---------- */

const LAUNCH = "2027-01-15T17:00:00Z";

export function LaunchDemo() {
  // A preview target is created in a click handler, never during render.
  const [preview, setPreview] = useState<number | null>(null);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Rocket className="size-3.5" aria-hidden /> Fernway 4.0
        </span>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">The calmest calendar yet</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {preview ? "Preview: launching in a few seconds" : "Launches January 15, 2027 at 17:00 UTC"}
        </p>
      </div>

      <CountdownTimer
        key={preview ?? "launch"}
        target={preview ?? LAUNCH}
        size="lg"
        label="Time until launch"
        completedContent={
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
            <PartyPopper className="size-7 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <p className="text-lg font-semibold">We&apos;re live!</p>
            <p className="text-sm text-emerald-800 dark:text-emerald-200">Fernway 4.0 is rolling out to everyone now.</p>
          </div>
        }
      />

      <button
        type="button"
        onClick={() => setPreview(preview ? null : Date.now() + 5000)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium outline-none transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
      >
        {preview ? "Back to the real launch date" : "Preview the launch moment (5 s)"}
      </button>
    </div>
  );
}

/* ---------- 10-second timer ---------- */

export function TenSecondDemo() {
  const timer = useRef<CountdownTimerHandle>(null);
  const [status, setStatus] = useState<CountdownStatus>("idle");
  const [runs, setRuns] = useState(0);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-4 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">Plank break</p>
        <CountdownTimer
          ref={timer}
          duration={10}
          showDays={false}
          size="md"
          label="Plank break timer"
          showControls
          showProgress
          onStatusChange={setStatus}
          onComplete={() => setRuns((n) => n + 1)}
          completedContent={
            <div className="flex flex-col items-center gap-3 py-2">
              <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <p className="text-lg font-semibold">Nice work!</p>
              <button
                type="button"
                onClick={() => timer.current?.restart()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white outline-none transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-indigo-700 motion-reduce:transition-none dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-offset-zinc-900"
              >
                <RotateCcw className="size-4" aria-hidden /> Go again
              </button>
            </div>
          }
        />
      </div>
      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
        status: {status} · completed {runs}×
      </p>
    </div>
  );
}

/* ---------- Resend code ---------- */

export function ResendDemo() {
  const codeId = useId();
  const [round, setRound] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold">Check your email</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">We sent a 6-digit code to sam@example.com.</p>
      <label htmlFor={codeId} className="mt-4 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Verification code
      </label>
      <input
        id={codeId}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-center font-mono text-lg tracking-[0.5em] outline-none placeholder:text-zinc-400 hover:border-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
      />
      <p className="mt-3 flex min-h-10 flex-wrap items-center gap-x-1 text-sm text-zinc-600 dark:text-zinc-400">
        {canResend ? (
          <>
            Didn&apos;t get it?
            <button
              type="button"
              onClick={() => {
                setCanResend(false);
                setSent(true);
                setRound((r) => r + 1);
              }}
              className="inline-flex h-10 items-center rounded-md px-1.5 font-medium text-indigo-700 underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300"
            >
              Resend code
            </button>
          </>
        ) : (
          <>
            <span className={cn(sent && "text-emerald-700 dark:text-emerald-400")}>{sent ? "New code sent." : ""}</span>
            Resend code in
            <CountdownTimer
              key={round}
              duration={30}
              variant="inline"
              inlineFormat="compact"
              label="Time until you can resend the code"
              onComplete={() => setCanResend(true)}
              className="font-semibold text-zinc-900 dark:text-zinc-100"
            />
          </>
        )}
      </p>
    </div>
  );
}

/* ---------- Variants and states ---------- */

const TWO_DAYS = 2 * 86400 + 14 * 3600 + 9 * 60 + 12;

export function VariantsDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
      <Cell title="minimal">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Sale ends in</span>
        <CountdownTimer duration={TWO_DAYS} variant="minimal" label="Time until the sale ends" />
      </Cell>
      <Cell title="inline, clock format">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Next build in{" "}
          <CountdownTimer duration={2 * 3600 + 14 * 60 + 9} variant="inline" label="Time until the next build" className="font-mono font-semibold text-zinc-900 dark:text-zinc-100" />
        </span>
      </Cell>
      <Cell title="flip, small, not started">
        <CountdownTimer duration={90} autoStart={false} showControls size="sm" showDays={false} label="Kitchen timer" />
      </Cell>
      <Cell title="invalid target">
        <CountdownTimer target="sometime soon" invalidText="Couldn't read the launch date." />
      </Cell>
    </div>
  );
}

function Cell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{title}</p>
      {children}
    </div>
  );
}
