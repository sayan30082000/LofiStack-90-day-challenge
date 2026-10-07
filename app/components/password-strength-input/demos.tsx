"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { CircleCheck, Loader2 } from "lucide-react";
import {
  PasswordStrengthInput,
  type PasswordRule,
  type PasswordStrengthResult,
} from "@/components/ui/password-strength-input";
import { cn } from "@/lib/utils";

const buttonClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 motion-reduce:transition-none dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-offset-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400";

const cardClass =
  "w-full rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900";

/* ---------- Sign-up form ---------- */

export function SignUpDemo() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<PasswordStrengthResult | null>(null);
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = confirm.length > 0 && confirm === password;
  const canSubmit = Boolean(result?.valid) && matches && /\S+@\S+\.\S+/.test(email) && status === "idle";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("done"), 1200);
  };

  const reset = () => {
    setEmail("");
    setPassword("");
    setConfirm("");
    setResult(null);
    setStatus("idle");
  };

  if (status === "done") {
    return (
      <div className={cn(cardClass, "max-w-md text-center")} role="status">
        <CircleCheck className="mx-auto size-10 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <p className="mt-3 text-base font-semibold">Account created</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Nothing was sent anywhere. This is a demo form.
        </p>
        <button type="button" onClick={reset} className={cn(buttonClass, "mt-5")}>
          Start over
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn(cardClass, "max-w-md")} noValidate>
      <h3 className="text-base font-semibold">Create your account</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Free for 14 days. No card needed.</p>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor={emailId} className="block text-sm font-medium">
            Email
          </label>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            placeholder="you@example.com"
            className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 hover:border-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/20 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:disabled:bg-zinc-900"
          />
        </div>

        <PasswordStrengthInput
          label="Password"
          name="password"
          value={password}
          onChange={(v, r) => {
            setPassword(v);
            setResult(r);
          }}
          confirm
          confirmValue={confirm}
          onConfirmChange={setConfirm}
          minStrength={3}
          disabled={status === "loading"}
          required
        />
      </div>

      <button type="submit" disabled={!canSubmit && status !== "loading"} aria-disabled={status === "loading" || undefined} className={cn(buttonClass, "mt-5")}>
        {status === "loading" && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />}
        {status === "loading" ? "Creating account…" : "Create account"}
      </button>
      <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Try <span className="font-mono">Password123!</span>: it passes every rule but is on the leaked list. Or tap Suggest a passphrase.
      </p>
    </form>
  );
}

/* ---------- Custom rules ---------- */

const ADMIN_RULES: PasswordRule[] = [
  { id: "min12", label: "At least 12 characters", test: (v) => [...v].length >= 12 },
  { id: "nospace", label: "No spaces", test: (v) => !/\s/.test(v) },
  { id: "digit", label: "At least 2 numbers", test: (v) => (v.match(/\d/g) ?? []).length >= 2 },
];

export function CustomRulesDemo() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<PasswordStrengthResult | null>(null);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  return (
    <div className={cn(cardClass, "max-w-md")}>
      <h3 className="text-base font-semibold">Admin vault key</h3>
      <div className="mt-4">
        <PasswordStrengthInput
          label="New key"
          description="Admins need a longer key. Spaces are not allowed."
          value={value}
          onChange={(v, r) => {
            setValue(v);
            setResult(r);
            setError(undefined);
            setSaved(false);
          }}
          rules={ADMIN_RULES}
          minStrength={4}
          error={error}
          checklistLabel="Admin key policy"
          strengthLabels={["Weak", "Fair", "Good", "Vault-grade"]}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          if (result?.valid) setSaved(true);
          else setError("This key doesn't meet the admin policy yet.");
        }}
        className={cn(buttonClass, "mt-5")}
      >
        Save key
      </button>
      <p role="status" className="mt-2 min-h-4 text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
        {saved ? "Key saved (demo only)." : ""}
      </p>
    </div>
  );
}

/* ---------- Compact ---------- */

export function CompactDemo() {
  const [a, setA] = useState("");
  const [b, setB] = useState("tr0ub4dor&3horse");

  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
      <div className={cardClass}>
        <PasswordStrengthInput
          label="Wi-Fi password"
          value={a}
          onChange={(v) => setA(v)}
          showChecklist={false}
          showTips={false}
          suggestPassphrase={false}
          minStrength={2}
          placeholder="Type to see the meter"
          autoComplete="off"
        />
      </div>
      <div className={cardClass}>
        <PasswordStrengthInput
          label="Disabled"
          value={b}
          onChange={(v) => setB(v)}
          showChecklist={false}
          disabled
        />
      </div>
    </div>
  );
}
