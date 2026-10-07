"use client";

import type { LucideIcon } from "lucide-react";
import {
  Atom,
  Boxes,
  Braces,
  Cloud,
  Container,
  Database,
  Drama,
  FlaskConical,
  Hexagon,
  Layers,
  Share2,
  Triangle,
  Wind,
} from "lucide-react";
import { LogoMarquee, type LogoMarqueeItem } from "@/components/ui/logo-marquee";

/* Fictional brands, drawn as simple SVG wordmarks in public/demo/logo-marquee. */
const BRANDS = [
  ["lumaforge", "Lumaforge"],
  ["quillby", "Quillby"],
  ["orbitra", "Orbitra"],
  ["fernhaus", "Fernhaus"],
  ["brightloop", "Brightloop"],
  ["novabloc", "Novabloc"],
  ["tidewell", "Tidewell"],
  ["corvus-grid", "Corvus Grid"],
] as const;

const LOGOS: LogoMarqueeItem[] = BRANDS.map(([slug, name]) => ({
  src: `/demo/logo-marquee/${slug}.svg`,
  srcDark: `/demo/logo-marquee/${slug}-dark.svg`,
  alt: name,
}));

export function TrustedByDemo() {
  return (
    <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white px-4 py-6 sm:px-8 dark:border-zinc-800 dark:bg-zinc-950">
      <LogoMarquee
        items={LOGOS}
        title={
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Trusted by product teams at
          </p>
        }
        speed={36}
        gap={56}
      />
    </div>
  );
}

/* ---------- Tech stack ---------- */

const STACK: [LucideIcon, string, string][] = [
  [Atom, "React 19", "text-sky-600 dark:text-sky-400"],
  [Triangle, "Next.js", "text-zinc-900 dark:text-zinc-100"],
  [Braces, "TypeScript", "text-blue-600 dark:text-blue-400"],
  [Wind, "Tailwind CSS", "text-cyan-600 dark:text-cyan-400"],
  [Layers, "Server Components", "text-violet-600 dark:text-violet-400"],
  [Drama, "Playwright", "text-emerald-600 dark:text-emerald-400"],
  [Hexagon, "Node.js", "text-lime-600 dark:text-lime-400"],
  [Database, "PostgreSQL", "text-indigo-600 dark:text-indigo-400"],
  [Boxes, "Redis", "text-rose-600 dark:text-rose-400"],
  [Share2, "GraphQL", "text-pink-600 dark:text-pink-400"],
  [Container, "Docker", "text-sky-700 dark:text-sky-300"],
  [Cloud, "Edge Functions", "text-amber-600 dark:text-amber-400"],
];

const STACK_ITEMS: LogoMarqueeItem[] = STACK.map(([Icon, name, color]) => ({
  alt: name,
  node: (
    <span className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 bg-white pl-3 pr-4 text-sm font-medium text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <Icon className={`size-4 ${color}`} aria-hidden />
      {name}
    </span>
  ),
}));

export function TechStackDemo() {
  return (
    <div className="w-full max-w-4xl">
      <LogoMarquee
        items={STACK_ITEMS}
        rows={2}
        gap={12}
        speed={40}
        grayscale={false}
        fadeSize={96}
        label="Tech stack"
        title={
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <FlaskConical className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
            Frontend on top, backend below
          </span>
        }
      />
    </div>
  );
}

/* ---------- Vertical ---------- */

export function VerticalDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="max-w-sm">
        <h3 className="text-xl font-semibold tracking-tight">Ship with the teams you already know</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          direction=&quot;up&quot; with two columns. The second column moves down, and both pause on hover.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <LogoMarquee
          items={LOGOS}
          direction="up"
          rows={2}
          height={280}
          gap={36}
          speed={24}
          logoHeight={24}
          label="Customer logos"
        />
      </div>
    </div>
  );
}
