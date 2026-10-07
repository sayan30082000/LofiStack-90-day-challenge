"use client";

import { useState } from "react";
import { Dot, FileText, Folder, LoaderCircle } from "lucide-react";
import { Breadcrumbs, type BreadcrumbItem, type BreadcrumbLinkProps } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

/** Demo links stay on the page and report where they would have gone. */
function useDemoLinks() {
  const [visited, setVisited] = useState<string | null>(null);
  const renderLink = ({ href, className, children, item }: BreadcrumbLinkProps) => (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        setVisited(`${item.label} (${href})`);
      }}
    >
      {children}
    </a>
  );
  return { visited, renderLink };
}

function Visited({ value }: { value: string | null }) {
  return (
    <p className="text-xs text-zinc-500 dark:text-zinc-400">
      Last link clicked:{" "}
      <span className="font-mono text-zinc-700 dark:text-zinc-300">{value ?? "none yet"}</span>
    </p>
  );
}

const folder = <Folder className="text-sky-600 dark:text-sky-400" />;

const DEEP_PATH: BreadcrumbItem[] = [
  { label: "lofistack", href: "/files" },
  { label: "component-gallery", href: "/files/component-gallery", icon: folder },
  { label: "app", href: "/files/component-gallery/app", icon: folder },
  { label: "components", href: "/files/component-gallery/app/components", icon: folder },
  { label: "breadcrumbs", href: "/files/component-gallery/app/components/breadcrumbs", icon: folder },
  {
    label: "collapsing-trail-with-truncated-labels-and-tooltips.md",
    icon: <FileText className="text-zinc-500 dark:text-zinc-400" />,
  },
];

export function DeepPathDemo() {
  const { visited, renderLink } = useDemoLinks();
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900">
        <Breadcrumbs
          items={DEEP_PATH}
          maxItems={4}
          showHomeIcon
          homeIconOnly
          mobileBackLink
          maxLabelWidth="14rem"
          renderLink={renderLink}
        />
      </div>
      <Visited value={visited} />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Open the &ldquo;…&rdquo; button to see the 3 hidden folders. Hover or focus the file name to read it in full. Switch
        the preview to 375px to get the compact back link.
      </p>
    </div>
  );
}

const SHORT_PATH: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Settings", href: "/settings" },
  { label: "Notifications" },
];

export function ShortPathDemo() {
  const { visited, renderLink } = useDemoLinks();
  const [loading, setLoading] = useState(false);

  const reload = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1400);
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="min-w-0 flex-1">
          <Breadcrumbs items={SHORT_PATH} showHomeIcon renderLink={renderLink} loading={loading} />
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 outline-none transition-colors motion-reduce:transition-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700",
          )}
        >
          {loading && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}
          {loading ? "Loading…" : "Simulate loading"}
        </button>
      </div>
      <Visited value={visited} />
    </div>
  );
}

const REPO_PATH: BreadcrumbItem[] = [
  { label: "lofistack", href: "/lofistack" },
  { label: "component-gallery", href: "/lofistack/component-gallery" },
  { label: "components", href: "/lofistack/component-gallery/tree/main/components" },
  { label: "ui", href: "/lofistack/component-gallery/tree/main/components/ui" },
  { label: "breadcrumbs.tsx" },
];

const SHOP_PATH: BreadcrumbItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "Audio", href: "/shop/audio" },
  { label: "Archived collection", disabled: true },
  { label: "Studio Monitor Headphones X2" },
];

export function SeparatorDemo() {
  const { visited, renderLink } = useDemoLinks();
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Slash, repository style</p>
        <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1 font-mono dark:border-zinc-800 dark:bg-zinc-900">
          <Breadcrumbs
            items={REPO_PATH}
            separator="slash"
            maxItems={5}
            renderLink={renderLink}
            label="Repository path"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Custom node, with a disabled crumb
        </p>
        <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900">
          <Breadcrumbs
            items={SHOP_PATH}
            separator={<Dot className="size-5 text-indigo-500 dark:text-indigo-400" />}
            renderLink={renderLink}
            label="Product category"
          />
        </div>
      </div>
      <Visited value={visited} />
    </div>
  );
}
