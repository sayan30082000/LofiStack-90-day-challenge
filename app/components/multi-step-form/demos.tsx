"use client";

import { useId, useState } from "react";
import { Building2, Check, Rocket, Sparkles, User } from "lucide-react";
import {
  MultiStepForm,
  WizardField,
  wizardInputClass,
  type WizardErrors,
  type WizardStep,
} from "@/components/ui/multi-step-form";
import { cn } from "@/lib/utils";

type WorkspaceValues = {
  fullName: string;
  email: string;
  workspace: string;
  teamSize: string;
  plan: "" | "starter" | "team" | "business";
};

const INITIAL: WorkspaceValues = { fullName: "", email: "", workspace: "", teamSize: "", plan: "" };

const TEAM_SIZES = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2–10 people" },
  { value: "11-50", label: "11–50 people" },
  { value: "51-200", label: "51–200 people" },
  { value: "200+", label: "More than 200" },
];

const PLANS = [
  { id: "starter", name: "Starter", price: "$0", per: "forever", blurb: "3 projects, community support.", icon: User },
  { id: "team", name: "Team", price: "$12", per: "per seat / month", blurb: "Unlimited projects, roles and SSO.", icon: Building2, badge: "Popular" },
  { id: "business", name: "Business", price: "$24", per: "per seat / month", blurb: "Audit logs, SLA and a success manager.", icon: Rocket },
] as const;

const TAKEN = ["acme", "lofistack", "studio"];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const STEPS: WizardStep<WorkspaceValues>[] = [
  {
    id: "account",
    title: "Account",
    description: "Who is setting this workspace up?",
    validate: (v) => {
      const e: WizardErrors<WorkspaceValues> = {};
      if (!v.fullName.trim()) e.fullName = "Enter your full name.";
      if (!v.email.trim()) e.email = "Enter your work email.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Enter a valid email, like jane@example.com.";
      return e;
    },
    summary: (v) => [
      { label: "Name", value: v.fullName },
      { label: "Email", value: v.email },
    ],
    render: ({ values, setValue, errors, field, errorId }) => (
      <div className="grid gap-4">
        <WizardField label="Full name" htmlFor={field("fullName").id} error={errors.fullName} errorId={errorId("fullName")}>
          <input
            {...field("fullName")}
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => setValue("fullName", e.target.value)}
            placeholder="Jane Cooper"
            className={wizardInputClass}
          />
        </WizardField>
        <WizardField
          label="Work email"
          htmlFor={field("email").id}
          error={errors.email}
          errorId={errorId("email")}
          hint="We'll send the workspace invite here."
        >
          <input
            {...field("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValue("email", e.target.value)}
            placeholder="jane@example.com"
            className={wizardInputClass}
          />
        </WizardField>
      </div>
    ),
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Name it and tell us how big the team is.",
    // Async: pretends to check name availability on the server.
    validate: async (v) => {
      const e: WizardErrors<WorkspaceValues> = {};
      if (!v.workspace.trim()) e.workspace = "Give your workspace a name.";
      else if (v.workspace.trim().length < 3) e.workspace = "Use at least 3 characters.";
      else {
        await wait(600);
        if (TAKEN.includes(slugify(v.workspace))) e.workspace = `“${v.workspace.trim()}” is taken. Try another name.`;
      }
      if (!v.teamSize) e.teamSize = "Choose a team size.";
      return e;
    },
    summary: (v) => [
      { label: "Workspace", value: v.workspace },
      { label: "URL", value: <span className="font-mono text-[13px]">example.app/{slugify(v.workspace)}</span> },
      { label: "Team size", value: TEAM_SIZES.find((t) => t.value === v.teamSize)?.label ?? "" },
    ],
    render: ({ values, setValue, errors, field, errorId }) => (
      <div className="grid gap-4">
        <WizardField
          label="Workspace name"
          htmlFor={field("workspace").id}
          error={errors.workspace}
          errorId={errorId("workspace")}
          hint={
            <>
              Your URL: <span className="font-mono">example.app/{slugify(values.workspace) || "your-team"}</span>. “acme” is taken.
            </>
          }
        >
          <input
            {...field("workspace")}
            autoComplete="organization"
            value={values.workspace}
            onChange={(e) => setValue("workspace", e.target.value)}
            placeholder="Northwind Studio"
            className={wizardInputClass}
          />
        </WizardField>
        <WizardField label="Team size" htmlFor={field("teamSize").id} error={errors.teamSize} errorId={errorId("teamSize")}>
          <select
            {...field("teamSize")}
            value={values.teamSize}
            onChange={(e) => setValue("teamSize", e.target.value)}
            className={cn(wizardInputClass, "appearance-auto pr-2", !values.teamSize && "text-zinc-500 dark:text-zinc-400")}
          >
            <option value="" disabled>
              Select a size
            </option>
            {TEAM_SIZES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </WizardField>
      </div>
    ),
  },
  {
    id: "plan",
    title: "Plan",
    description: "You can change plans at any time.",
    validate: (v) => (v.plan ? {} : { plan: "Pick a plan to continue." }),
    summary: (v) => {
      const p = PLANS.find((x) => x.id === v.plan);
      return [{ label: "Plan", value: p ? `${p.name} · ${p.price} ${p.per}` : "" }];
    },
    render: (ctx) => <PlanPicker {...ctx} />,
  },
];

function PlanPicker({
  values,
  setValue,
  errors,
  fieldId,
  errorId,
}: {
  values: WorkspaceValues;
  setValue: <K extends keyof WorkspaceValues>(name: K, value: WorkspaceValues[K]) => void;
  errors: WizardErrors<WorkspaceValues>;
  fieldId: (name: keyof WorkspaceValues & string) => string;
  errorId: (name: keyof WorkspaceValues & string) => string;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">
        Plan
      </legend>
      <div className="grid gap-3 @lg:grid-cols-3">
        {PLANS.map((p, i) => {
          const checked = values.plan === p.id;
          const Icon = p.icon;
          return (
            <label
              key={p.id}
              className={cn(
                "relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-[border-color,box-shadow,background-color] motion-reduce:transition-none",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-white dark:has-[:focus-visible]:ring-offset-zinc-900",
                "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
                checked
                  ? "border-indigo-600 bg-indigo-50/70 shadow-sm dark:border-indigo-400 dark:bg-indigo-500/10"
                  : errors.plan
                    ? "border-rose-400 hover:border-rose-500 dark:border-rose-500/60"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/40",
              )}
            >
              <input
                type="radio"
                name="plan"
                id={i === 0 ? fieldId("plan") : undefined}
                value={p.id}
                checked={checked}
                onChange={() => setValue("plan", p.id)}
                aria-describedby={errors.plan ? errorId("plan") : undefined}
                className="sr-only"
              />
              <span className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-lg",
                    checked ? "bg-indigo-600 text-white dark:bg-indigo-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full border transition-colors motion-reduce:transition-none",
                    checked ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400 dark:text-zinc-950" : "border-zinc-300 dark:border-zinc-600",
                  )}
                >
                  {checked && <Check className="size-3" strokeWidth={3} />}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</span>
                {"badge" in p && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                    <Sparkles aria-hidden className="size-3" />
                    {p.badge}
                  </span>
                )}
              </span>
              <span>
                <span className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{p.price}</span>{" "}
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{p.per}</span>
              </span>
              <span className="text-[13px] text-zinc-600 dark:text-zinc-400">{p.blurb}</span>
            </label>
          );
        })}
      </div>
      {errors.plan && (
        <p id={errorId("plan")} className="mt-3 text-[13px] font-medium text-rose-700 dark:text-rose-400">
          {errors.plan}
        </p>
      )}
    </fieldset>
  );
}

export function CreateWorkspaceDemo() {
  const [failNext, setFailNext] = useState(false);
  const [submissions, setSubmissions] = useState(0);
  const failId = useId();

  const onSubmit = async () => {
    await wait(1400);
    if (failNext) {
      setFailNext(false);
      throw new Error("We couldn't create the workspace (server timeout). Nothing was charged, try again.");
    }
    setSubmissions((n) => n + 1);
  };

  return (
    <div className="grid w-full max-w-4xl gap-4 @container">
      <div className="grid items-start gap-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
        <MultiStepForm
          title="Create workspace"
          steps={STEPS}
          initialValues={INITIAL}
          onSubmit={onSubmit}
          showReview
          labels={{ submit: "Create workspace", submitting: "Creating…", validating: "Checking name…" }}
          successTitle="Your workspace is ready"
          successDescription={(v) => (
            <>
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{v.workspace}</strong> is live at{" "}
              <span className="font-mono text-[13px]">example.app/{slugify(v.workspace)}</span>. We sent the invite to {v.email}.
            </>
          )}
          onRestart={() => undefined}
        />
        <aside className="flex min-w-0 flex-col gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Try it</p>
          <ul className="list-disc space-y-1.5 pl-4 text-[13px] text-zinc-600 marker:text-zinc-400 dark:text-zinc-400">
            <li>Press Continue with empty fields: focus jumps to the first error.</li>
            <li>Name the workspace “acme” to see the async check fail.</li>
            <li>On Review, use Edit, then “Save and review” to jump back.</li>
            <li>Completed steps in the header are clickable.</li>
          </ul>
          <label htmlFor={failId} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[13px] text-zinc-700 dark:text-zinc-300">
            <input
              id={failId}
              type="checkbox"
              checked={failNext}
              onChange={(e) => setFailNext(e.target.checked)}
              className="size-4 accent-indigo-600 dark:accent-indigo-400"
            />
            Make the next submit fail
          </label>
          <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">created: {submissions}</p>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Without a review step ---------- */

type FeedbackValues = { rating: string; comment: string };

const RATINGS = ["Poor", "Okay", "Good", "Great"];

const FEEDBACK_STEPS: WizardStep<FeedbackValues>[] = [
  {
    id: "rating",
    title: "Rating",
    description: "How was the onboarding call?",
    validate: (v) => (v.rating ? {} : { rating: "Choose a rating." }),
    render: ({ values, setValue, errors, fieldId, errorId }) => (
      <fieldset className="min-w-0">
        <legend className="sr-only">Rating</legend>
        <div className="grid grid-cols-2 gap-2 @md:grid-cols-4">
          {RATINGS.map((r, i) => (
            <label
              key={r}
              className={cn(
                "flex h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors motion-reduce:transition-none",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-white dark:has-[:focus-visible]:ring-offset-zinc-900",
                values.rating === r
                  ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400 dark:text-zinc-950"
                  : errors.rating
                    ? "border-rose-400 text-zinc-700 hover:bg-zinc-50 dark:border-rose-500/60 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/40",
              )}
            >
              <input
                type="radio"
                name="rating"
                id={i === 0 ? fieldId("rating") : undefined}
                value={r}
                checked={values.rating === r}
                onChange={() => setValue("rating", r)}
                aria-describedby={errors.rating ? errorId("rating") : undefined}
                className="sr-only"
              />
              {r}
            </label>
          ))}
        </div>
        {errors.rating && (
          <p id={errorId("rating")} className="mt-2 text-[13px] font-medium text-rose-700 dark:text-rose-400">
            {errors.rating}
          </p>
        )}
      </fieldset>
    ),
  },
  {
    id: "comment",
    title: "Comment",
    description: "Optional. Anything we could do better?",
    render: ({ values, setValue, field, errorId, errors }) => (
      <WizardField label="Your comment" htmlFor={field("comment").id} error={errors.comment} errorId={errorId("comment")}>
        <textarea
          {...field("comment")}
          rows={4}
          value={values.comment}
          onChange={(e) => setValue("comment", e.target.value)}
          className={cn(wizardInputClass, "h-auto py-2.5")}
        />
      </WizardField>
    ),
  },
];

export function FeedbackDemo() {
  return (
    <div className="w-full max-w-lg">
      <MultiStepForm
        steps={FEEDBACK_STEPS}
        initialValues={{ rating: "", comment: "" }}
        showReview={false}
        onSubmit={() => wait(900)}
        labels={{ submit: "Send feedback", submitting: "Sending…" }}
        successTitle="Thanks for the feedback"
        successDescription={(v) => `You rated the call “${v.rating}”.`}
        onRestart={() => undefined}
      />
    </div>
  );
}
