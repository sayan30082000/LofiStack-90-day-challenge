"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, MailCheck, RotateCcw } from "lucide-react";
import { OtpInput } from "@/components/ui/otp-input";
import { cn } from "@/lib/utils";

const CORRECT = "123456";
const COOLDOWN = 30;

export function VerifyEmailDemo() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [attempts, setAttempts] = useState(3);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const verify = (value: string) => {
    setStatus("checking");
    timer.current = setTimeout(() => {
      if (value === CORRECT) setStatus("success");
      else {
        setStatus("error");
        setAttempts((a) => Math.max(0, a - 1));
      }
    }, 900);
  };

  const resend = () => {
    setCode("");
    setStatus("idle");
    setAttempts(3);
    setSent(true);
    setCooldown(COOLDOWN);
    setResetKey((k) => k + 1);
  };

  const locked = attempts === 0 && status === "error";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <span
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-xl transition-colors motion-reduce:transition-none",
          status === "success"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
        )}
      >
        <MailCheck className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">Verify your email</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        We sent a 6-digit code to <span className="font-medium text-zinc-900 dark:text-zinc-100">maya@example.com</span>.
        Try <span className="font-mono">123456</span>.
      </p>

      <OtpInput
        key={resetKey}
        className="mt-6"
        label="Email verification code"
        value={code}
        onChange={(v) => {
          setCode(v);
          if (status === "error" || status === "success") setStatus("idle");
        }}
        onComplete={verify}
        loading={status === "checking"}
        disabled={locked}
        success={status === "success"}
        successMessage="Email verified. Redirecting to your dashboard…"
        error={
          status === "error"
            ? locked
              ? "Too many attempts. Request a new code."
              : `That code didn't match. ${attempts} ${attempts === 1 ? "attempt" : "attempts"} left.`
            : undefined
        }
        autoFocus={resetKey > 0}
      />

      <div className="mt-6 flex flex-wrap items-center gap-x-1 text-sm text-zinc-600 dark:text-zinc-400">
        Didn&apos;t get it?
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-1.5 font-medium text-indigo-700 underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:text-zinc-500 disabled:no-underline dark:text-indigo-300 dark:disabled:text-zinc-400"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
      <p role="status" className="min-h-5 text-xs text-zinc-500 dark:text-zinc-400">
        {sent ? "A new code is on its way." : ""}
      </p>
    </div>
  );
}

export function PinDemo() {
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const complete = pin.length === 4;

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <Lock className="size-5 text-zinc-500 dark:text-zinc-400" aria-hidden />
      <div>
        <h3 className="font-semibold">Set an app PIN</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Four digits, used to unlock on this device.</p>
      </div>
      <OtpInput
        length={4}
        mask={!show}
        size="lg"
        label="App PIN"
        boxLabel={(i, n) => `PIN digit ${i} of ${n}`}
        value={pin}
        onChange={setPin}
        success={complete}
        successMessage="PIN saved"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-700 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
      >
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        {show ? "Hide PIN" : "Show PIN"}
      </button>
    </div>
  );
}

export function VariantsDemo() {
  const [backup, setBackup] = useState("");
  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Disabled</p>
        <OtpInput label="Disabled code" defaultValue="482" disabled />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Alphanumeric recovery code, grouped 3-3</p>
        <OtpInput
          length={6}
          type="alphanumeric"
          groupSize={3}
          label="Recovery code"
          boxLabel={(i, n) => `Character ${i} of ${n}`}
          value={backup}
          onChange={setBackup}
        />
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">value: {JSON.stringify(backup)} · try pasting &quot;k7p-2mz&quot;</p>
      </div>
    </div>
  );
}
