"use client";

import { useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import { PricingTable, type Billing, type PlanFinderDimension, type PricingPlan } from "@/components/ui/pricing-cards";
import { cn } from "@/lib/utils";

const PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For side projects and trying things out.",
    monthly: 0,
    yearly: 0,
    features: [
      { label: "3 projects", included: true },
      { label: "Community components", included: true },
      { label: "1 GB asset storage", included: true },
      { label: "Custom domains", included: false },
      { label: "Team roles and permissions", included: false },
    ],
    cta: { label: "Start for free" },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For solo makers shipping to real users.",
    monthly: 15,
    yearly: 144,
    featured: true,
    features: [
      { label: "Unlimited projects", included: true },
      { label: "All premium components", included: true },
      { label: "50 GB asset storage", included: true },
      { label: "Custom domains", included: true },
      { label: "Team roles and permissions", included: false },
    ],
    cta: { label: "Upgrade to Pro" },
  },
  {
    id: "team",
    name: "Team",
    description: "For studios that build together.",
    monthly: 40,
    yearly: 384,
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Up to 10 seats", included: true },
      { label: "500 GB asset storage", included: true },
      { label: "Custom domains", included: true },
      { label: "Team roles and permissions", included: true },
    ],
    cta: { label: "Start a team trial" },
  },
];

/** What buyers need. Limits match each plan's feature list. */
const FINDER: PlanFinderDimension[] = [
  { id: "seats", label: "Team size", unit: "seats", min: 1, max: 25, defaultValue: 1, format: (n) => (n === 1 ? "1 seat" : `${n} seats`), limits: { starter: 1, pro: 1, team: 10 } },
  { id: "storage", label: "Asset storage", unit: "storage", min: 1, max: 600, step: 1, defaultValue: 5, format: (n) => `${n} GB`, limits: { starter: 1, pro: 50, team: 500 } },
];

export function PlansDemo() {
  const [picked, setPicked] = useState<{ id: string; billing: Billing } | null>(null);
  const plan = PLANS.find((p) => p.id === picked?.id);

  return (
    <div className="flex w-full flex-col gap-6">
      <PricingTable
        plans={PLANS}
        finder={FINDER}
        defaultBilling="monthly"
        yearlyDiscountLabel="Save 20%"
        onSelect={(id, billing) =>
          new Promise<void>((resolve) =>
            setTimeout(() => {
              setPicked({ id, billing });
              resolve();
            }, 700),
          )
        }
      />
      <p
        role="status"
        className={cn(
          "mx-auto flex min-h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors motion-reduce:transition-none",
          plan
            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "text-zinc-500 dark:text-zinc-400",
        )}
      >
        {plan ? (
          <>
            <CircleCheck className="size-4" aria-hidden />
            {plan.name} selected, billed {picked?.billing}
          </>
        ) : (
          "Toggle the billing period, then pick a plan."
        )}
      </p>
    </div>
  );
}

const GBP_PLANS: PricingPlan[] = [
  {
    ...PLANS[0],
    cta: { label: "Current plan", disabled: true },
  },
  { ...PLANS[1], monthly: 12, yearly: 115.2, featured: false, cta: { label: "Upgrade to Pro" } },
  { ...PLANS[2], monthly: 32, yearly: 307.2, featured: true, cta: { label: "Upgrade to Team" } },
];

export function StatesDemo() {
  const [empty, setEmpty] = useState(false);
  const attempts = useRef(0);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <button
          type="button"
          aria-pressed={empty}
          onClick={() => setEmpty((v) => !v)}
          className={cn(
            "h-10 rounded-lg border px-4 font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none",
            empty
              ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
              : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
          )}
        >
          Show empty state
        </button>
      </div>
      <PricingTable
        plans={empty ? [] : GBP_PLANS}
        currency="GBP"
        locale="en-GB"
        defaultBilling="yearly"
        yearlyDiscountLabel="-20%"
        labels={{ featured: "Best for teams", empty: "Plans are being updated. Check back soon." }}
        onSelect={(id) =>
          new Promise<void>((resolve, reject) =>
            setTimeout(() => {
              if (id === "team" && attempts.current++ === 0) reject(new Error("Your card was declined. Try another card."));
              else resolve();
            }, 1100),
          )
        }
      />
    </div>
  );
}
