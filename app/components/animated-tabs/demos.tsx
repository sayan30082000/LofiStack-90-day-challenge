"use client";

import { useId, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Check,
  CreditCard,
  Download,
  History,
  Palette,
  Rocket,
  Shield,
  Sparkles,
  User,
  Accessibility,
} from "lucide-react";
import { AnimatedTabs, type AnimatedTab, type AnimatedTabsVariant } from "@/components/ui/animated-tabs";
import { cn } from "@/lib/utils";

const card = "rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900";
const input =
  "mt-1.5 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none hover:border-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600";
const primary =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white outline-none hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-offset-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400";
const secondary =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:active:bg-zinc-700";

/* ---------- Account settings ---------- */

function ProfilePanel() {
  const nameId = useId();
  const handleId = useId();
  const [saved, setSaved] = useState(false);
  return (
    <form
      className={cn(card, "grid gap-4")}
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className="text-sm font-medium">Display name</label>
          <input id={nameId} defaultValue="Sam Rivera" className={input} onChange={() => setSaved(false)} />
        </div>
        <div>
          <label htmlFor={handleId} className="text-sm font-medium">Username</label>
          <input id={handleId} defaultValue="samr" className={input} onChange={() => setSaved(false)} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className={primary}>Save profile</button>
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{saved ? "Saved" : ""}</p>
      </div>
    </form>
  );
}

function SecurityPanel() {
  const [twoFactor, setTwoFactor] = useState(true);
  const labelId = useId();
  return (
    <div className={cn(card, "flex flex-col gap-4")}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p id={labelId} className="text-sm font-medium">Two-factor authentication</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Ask for a code from your authenticator app.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={twoFactor}
          aria-labelledby={labelId}
          onClick={() => setTwoFactor((v) => !v)}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-900",
            twoFactor ? "bg-indigo-600 dark:bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
              twoFactor ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Recent sign-ins</p>
        <ul className="mt-2 divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          {[
            ["MacBook Pro · Lisbon", "Now"],
            ["iPhone 16 · Lisbon", "2 hours ago"],
            ["Firefox · Porto", "3 days ago"],
          ].map(([device, when]) => (
            <li key={device} className="flex justify-between gap-3 py-2">
              <span>{device}</span>
              <span className="text-zinc-600 dark:text-zinc-400">{when}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const NOTIFICATIONS = [
  { id: 1, text: "Ana left a comment on Pricing Cards", when: "5 min" },
  { id: 2, text: "Your weekly build summary is ready", when: "1 h" },
  { id: 3, text: "Deploy to production finished", when: "Yesterday" },
];

function NotificationsPanel({ unread, onReadAll }: { unread: number; onReadAll: () => void }) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
        <button type="button" onClick={onReadAll} disabled={unread === 0} className={secondary}>
          <Check className="size-4" aria-hidden /> Mark all read
        </button>
      </div>
      <ul className="mt-3 flex flex-col gap-1">
        {NOTIFICATIONS.map((n) => (
          <li key={n.id} className="flex items-start gap-3 rounded-lg px-2 py-2 text-sm">
            <span
              aria-hidden
              className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread > 0 ? "bg-indigo-600 dark:bg-indigo-400" : "bg-zinc-300 dark:bg-zinc-700")}
            />
            <span className="flex-1">{n.text}</span>
            <span className="shrink-0 text-xs text-zinc-600 dark:text-zinc-400">{n.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BillingPanel() {
  return (
    <div className={cn(card, "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between")}>
      <div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Current plan</p>
        <p className="mt-0.5 text-lg font-semibold">Pro · $12 / month</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Renews on 1 November</p>
      </div>
      <div className="flex gap-2">
        <button type="button" className={secondary}>
          <Download className="size-4" aria-hidden /> Invoices
        </button>
        <button type="button" className={primary}>Change plan</button>
      </div>
    </div>
  );
}

export function AccountSettingsDemo() {
  const [unread, setUnread] = useState(3);
  const tabs: AnimatedTab[] = [
    { id: "profile", label: "Profile", icon: <User />, content: <ProfilePanel /> },
    { id: "security", label: "Security", icon: <Shield />, content: <SecurityPanel /> },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell />,
      badge: unread > 0 ? unread : undefined,
      badgeLabel: `${unread} unread`,
      content: <NotificationsPanel unread={unread} onReadAll={() => setUnread(0)} />,
    },
    { id: "billing", label: "Billing", icon: <CreditCard />, content: <BillingPanel /> },
  ];
  return (
    <div className="w-full max-w-2xl">
      <AnimatedTabs label="Account settings" tabs={tabs} defaultValue="profile" />
    </div>
  );
}

/* ---------- Pill variant ---------- */

const TEAMS = ["Design", "Engineering", "Marketing", "Sales", "Support"] as const;
const PEOPLE: { name: string; team: (typeof TEAMS)[number] }[] = [
  { name: "Maya Okafor", team: "Design" },
  { name: "Leo Brandt", team: "Engineering" },
  { name: "Ines Duarte", team: "Engineering" },
  { name: "Kai Nakamura", team: "Marketing" },
  { name: "Zoe Laurent", team: "Sales" },
  { name: "Omar Haddad", team: "Support" },
  { name: "Priya Shah", team: "Design" },
  { name: "Tom Becker", team: "Engineering" },
];

function PeopleGrid({ team }: { team?: string }) {
  const shown = PEOPLE.filter((p) => !team || p.team === team);
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {shown.map((p) => (
        <li key={p.name} className={cn(card, "flex items-center gap-3 p-3 sm:p-3")}>
          <span
            aria-hidden
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200"
          >
            {p.name.split(" ").map((s) => s[0]).join("")}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{p.name}</span>
            <span className="block text-xs text-zinc-600 dark:text-zinc-400">{p.team}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PillDemo() {
  const [team, setTeam] = useState("all");
  const tabs: AnimatedTab[] = [
    { id: "all", label: "All", badge: PEOPLE.length, content: <PeopleGrid /> },
    ...TEAMS.map((t) => ({
      id: t.toLowerCase(),
      label: t,
      badge: PEOPLE.filter((p) => p.team === t).length,
      content: <PeopleGrid team={t} />,
    })),
    { id: "alumni", label: "Alumni", disabled: true, content: null },
  ];
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <AnimatedTabs label="Filter people by team" variant="pill" tabs={tabs} value={team} onChange={setTeam} />
      <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">value: &quot;{team}&quot;</p>
    </div>
  );
}

/* ---------- Vertical ---------- */

function Doc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className={card}>
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
    </article>
  );
}

const DOCS: AnimatedTab[] = [
  {
    id: "start",
    label: "Getting started",
    icon: <Rocket />,
    content: (
      <Doc title="Getting started">
        <p>Copy the component file into components/ui and import it. There is nothing else to install.</p>
        <p>Every component works controlled or uncontrolled.</p>
      </Doc>
    ),
  },
  {
    id: "theming",
    label: "Theming",
    icon: <Palette />,
    content: (
      <Doc title="Theming">
        <p>Colors come from Tailwind classes, so dark mode follows the dark: variant automatically.</p>
      </Doc>
    ),
  },
  {
    id: "a11y",
    label: "Accessibility",
    icon: <Accessibility />,
    badge: "New",
    badgeLabel: "new section",
    content: (
      <Doc title="Accessibility">
        <p>This list uses manual activation: arrows only move focus, Enter or Space opens the section.</p>
        <p>That suits panels that are slow to render or fetch data.</p>
      </Doc>
    ),
  },
  {
    id: "recipes",
    label: "Recipes",
    icon: <Sparkles />,
    content: (
      <Doc title="Recipes">
        <p>Small patterns built from several components, like a settings page or a pricing table.</p>
      </Doc>
    ),
  },
  { id: "api", label: "API reference", icon: <BookOpen />, disabled: true, content: null },
  {
    id: "changelog",
    label: "Changelog",
    icon: <History />,
    content: (
      <Doc title="Changelog">
        <p>Week 03: Animated Tabs and the Skeleton Loader Kit.</p>
      </Doc>
    ),
  },
];

export function VerticalDemo() {
  const [variant, setVariant] = useState<AnimatedTabsVariant>("underline");
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div role="group" aria-label="Indicator style" className="inline-flex self-start rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
        {(["underline", "pill"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={variant === v}
            onClick={() => setVariant(v)}
            className={cn(
              "h-9 rounded-md px-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              variant === v
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <AnimatedTabs
        label="Documentation"
        tabs={DOCS}
        orientation="vertical"
        activation="manual"
        variant={variant}
      />
    </div>
  );
}
