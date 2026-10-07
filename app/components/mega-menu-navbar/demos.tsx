"use client";

import { useId, useState, type MouseEvent } from "react";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarClock,
  Code2,
  Database,
  GraduationCap,
  HeartPulse,
  Landmark,
  LifeBuoy,
  Lock,
  Megaphone,
  MessagesSquare,
  Newspaper,
  Plug,
  ShoppingBag,
  Users,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";
import { MegaMenuNavbar, type MegaMenuItem } from "@/components/ui/mega-menu-navbar";

/* ---------- Shared bits ---------- */

function Logo() {
  const gid = useId();
  return (
    <>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill={`url(#${gid})`} />
        <path d="M10 22c2-7 6-11 12-12-1 5-4 9-9 10m-3 2 5-5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Fernway</span>
    </>
  );
}

/** Decorative gradient art for featured cards, drawn inline so there are no network requests. */
function Art({ hue }: { hue: "indigo" | "emerald" | "amber" }) {
  const gid = useId();
  const stops = {
    indigo: ["#6366f1", "#a855f7", "#c7d2fe"],
    emerald: ["#059669", "#14b8a6", "#a7f3d0"],
    amber: ["#f59e0b", "#f43f5e", "#fde68a"],
  }[hue];
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="1" stopColor={stops[1]} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${gid})`} />
      <circle cx="250" cy="40" r="70" fill={stops[2]} opacity="0.35" />
      <circle cx="60" cy="170" r="90" fill="#fff" opacity="0.12" />
      <rect x="40" y="48" width="150" height="88" rx="10" fill="#fff" opacity="0.9" />
      <rect x="54" y="62" width="70" height="8" rx="4" fill={stops[0]} opacity="0.7" />
      <rect x="54" y="80" width="120" height="6" rx="3" fill="#a1a1aa" opacity="0.6" />
      <rect x="54" y="94" width="96" height="6" rx="3" fill="#a1a1aa" opacity="0.6" />
      <rect x="54" y="112" width="44" height="14" rx="7" fill={stops[1]} />
    </svg>
  );
}

const ITEMS: MegaMenuItem[] = [
  {
    label: "Products",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Scheduling", href: "/products/scheduling", description: "Find a time that works for everyone.", icon: <CalendarClock /> },
          { label: "Analytics", href: "/products/analytics", description: "See where your team's week really goes.", icon: <BarChart3 /> },
          { label: "Automations", href: "/products/automations", description: "Hand off busywork to rules that just run.", icon: <Workflow />, badge: "New" },
          { label: "Security", href: "/products/security", description: "SSO, audit logs and data residency.", icon: <Lock /> },
        ],
      },
      {
        title: "Developers",
        links: [
          { label: "API", href: "/developers/api", description: "REST and GraphQL with typed SDKs.", icon: <Code2 /> },
          { label: "Webhooks", href: "/developers/webhooks", description: "Real-time events for every change.", icon: <Webhook /> },
          { label: "Integrations", href: "/developers/integrations", description: "120+ apps, two clicks each.", icon: <Plug /> },
          { label: "Data export", href: "/developers/export", description: "Coming soon to every plan.", icon: <Database />, disabled: true },
        ],
      },
    ],
    featured: {
      eyebrow: "What's new",
      title: "Fernway 4.0 is here",
      description: "Automations, a faster sync engine and a calmer calendar view.",
      href: "/blog/fernway-4",
      cta: "Read the launch post",
      media: <Art hue="indigo" />,
    },
  },
  {
    label: "Solutions",
    columns: [
      {
        title: "By team",
        links: [
          { label: "Engineering", href: "/solutions/engineering", description: "Protect focus time across sprints.", icon: <Zap /> },
          { label: "Marketing", href: "/solutions/marketing", description: "Plan launches without the meeting sprawl.", icon: <Megaphone /> },
          { label: "Sales", href: "/solutions/sales", description: "Book demos straight from your inbox.", icon: <Briefcase /> },
        ],
      },
      {
        title: "By industry",
        links: [
          { label: "Healthcare", href: "/solutions/healthcare", description: "Shift planning with HIPAA safeguards.", icon: <HeartPulse /> },
          { label: "Finance", href: "/solutions/finance", description: "Audit-ready records of every change.", icon: <Landmark /> },
          { label: "Retail", href: "/solutions/retail", description: "Rotas that follow foot traffic.", icon: <ShoppingBag /> },
        ],
      },
    ],
    featured: {
      eyebrow: "Customer story",
      title: "How Northfield Clinic saved 6 hours a week",
      href: "/customers/northfield",
      cta: "Read the story",
      media: <Art hue="emerald" />,
    },
  },
  {
    label: "Resources",
    columns: [
      {
        title: "Learn",
        links: [
          { label: "Documentation", href: "/docs", description: "Guides and API reference.", icon: <BookOpen /> },
          { label: "Academy", href: "/academy", description: "Free courses for admins.", icon: <GraduationCap /> },
          { label: "Blog", href: "/blog", description: "Product news and ideas on calm work.", icon: <Newspaper /> },
        ],
      },
      {
        title: "Community",
        links: [
          { label: "Forum", href: "/community", description: "Ask, answer and share templates.", icon: <MessagesSquare /> },
          { label: "Events", href: "/events", description: "Meetups and live workshops.", icon: <Users /> },
          { label: "Help center", href: "/help", description: "Talk to a human, 24/7.", icon: <LifeBuoy /> },
        ],
      },
    ],
    featured: {
      eyebrow: "Webinar",
      title: "Designing a four-day week",
      description: "Live on October 22 with the Fernway people team.",
      href: "/events/four-day-week",
      cta: "Save a seat",
      media: <Art hue="amber" />,
    },
  },
  { label: "Pricing", href: "/pricing" },
];

const actionBase =
  "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-950";

function Actions({ onNavigate }: { onNavigate: (href: string, e: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <>
      <a
        href="/login"
        onClick={(e) => onNavigate("/login", e)}
        className={`${actionBase} text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700`}
      >
        Sign in
      </a>
      <a
        href="/signup"
        onClick={(e) => onNavigate("/signup", e)}
        className={`${actionBase} bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400`}
      >
        Start free
      </a>
    </>
  );
}

/* ---------- SaaS header demo ---------- */

export function SaasHeaderDemo() {
  const [current, setCurrent] = useState<string>("/products/analytics");
  const [last, setLast] = useState<string | null>(null);

  const navigate = (href: string, e: MouseEvent<HTMLAnchorElement>) => {
    // The demo stays on this page; a real app would route here.
    e.preventDefault();
    setCurrent(href);
    setLast(href);
  };

  return (
    <div className="w-full">
      <div className="relative h-[560px] overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <MegaMenuNavbar
          logo={<Logo />}
          logoLabel="Fernway home"
          items={ITEMS}
          activeHref={current}
          onNavigate={navigate}
          actions={<Actions onNavigate={navigate} />}
        />
        <FakePage />
      </div>
      <p className="mt-3 font-mono text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
        {last ? `onNavigate("${last}")` : "Hover or click Products, Solutions or Resources. Scroll the frame to see the header blur."}
      </p>
    </div>
  );
}

function FakePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="py-16 text-center sm:py-24">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Scheduling for calm teams</p>
        <h3 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Your week, planned before Monday
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
          Fernway finds the meeting times, protects focus hours and keeps everyone in sync, so the calendar works for you.
        </p>
      </section>
      <section className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {["Smart scheduling", "Focus time", "Team insights", "Automations", "Integrations", "Enterprise security"].map((title, i) => (
          <div key={title} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <div
              aria-hidden
              className="mb-4 h-24 rounded-lg"
              style={{
                background: `linear-gradient(135deg, hsl(${235 + i * 18} 80% 70% / 0.35), hsl(${265 + i * 18} 80% 70% / 0.15))`,
              }}
            />
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Placeholder copy so there is enough page to scroll under the sticky header.
            </p>
          </div>
        ))}
      </section>
      <section className="mb-16 rounded-2xl bg-zinc-100 p-8 text-center dark:bg-zinc-900">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Trusted by 40,000 teams</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Keep scrolling: the header stays put, blurred, with a soft shadow.</p>
      </section>
      <div aria-hidden className="h-64" />
    </main>
  );
}

/* ---------- Links only, not sticky ---------- */

const SIMPLE: MegaMenuItem[] = [
  { label: "Overview", href: "/overview" },
  { label: "Changelog", href: "/changelog" },
  { label: "Docs", href: "/docs" },
  { label: "Careers", disabled: true },
];

export function SimpleHeaderDemo() {
  const [current, setCurrent] = useState("/overview");
  return (
    <div className="relative h-[360px] w-full overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <MegaMenuNavbar
        logo={<Logo />}
        logoLabel="Fernway home"
        items={SIMPLE}
        sticky={false}
        activeHref={current}
        onNavigate={(href, e) => {
          e.preventDefault();
          setCurrent(href);
        }}
      />
      <FakePage />
    </div>
  );
}
