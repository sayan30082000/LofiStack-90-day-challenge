import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { getComponent } from "@/lib/registry";
import { CodeBlock } from "./CodeBlock";
import { PreviewTabs } from "./PreviewTabs";

export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface Example {
  title: string;
  description?: string;
  preview: ReactNode;
  code: string;
  minHeight?: number;
  center?: boolean;
}

interface ComponentPageProps {
  /** Registry slug; title, type and description come from lib/registry.ts. */
  slug: string;
  examples: Example[];
  /** Import + minimal usage snippet. */
  usage: string;
  props: PropDoc[];
  /** Extra type tables, e.g. the shape of a data item. */
  types?: { name: string; props: PropDoc[] }[];
  /** Accessibility notes reviewers can check. */
  accessibility?: string[];
}

export function ComponentPage({ slug, examples, usage, props, types = [], accessibility = [] }: ComponentPageProps) {
  const entry = getComponent(slug);
  if (!entry) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-zinc-500 outline-none hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" aria-hidden /> All components
      </Link>

      <header className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            {entry.type}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">Week {String(entry.week).padStart(2, "0")}</span>
          <span className="font-mono text-zinc-400 dark:text-zinc-500">/components/{entry.slug}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{entry.name}</h1>
        <p className="mt-3 text-base text-zinc-600 sm:text-lg dark:text-zinc-400">{entry.description}</p>
      </header>

      <div className="mt-10 flex flex-col gap-12">
        {examples.map((ex) => (
          <section key={ex.title} aria-labelledby={`ex-${slugify(ex.title)}`} className="flex flex-col gap-3">
            <div>
              <h2 id={`ex-${slugify(ex.title)}`} className="text-lg font-semibold tracking-tight">
                {ex.title}
              </h2>
              {ex.description && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{ex.description}</p>}
            </div>
            <PreviewTabs
              preview={ex.preview}
              code={<CodeBlock code={ex.code} />}
              minHeight={ex.minHeight}
              center={ex.center}
            />
          </section>
        ))}

        <section aria-labelledby="usage" className="flex flex-col gap-3">
          <h2 id="usage" className="text-lg font-semibold tracking-tight">
            Usage
          </h2>
          <CodeBlock code={usage} />
        </section>

        <PropsTable title="Props" id="props" rows={props} />
        {types.map((t) => (
          <PropsTable key={t.name} title={t.name} id={slugify(t.name)} rows={t.props} />
        ))}

        {accessibility.length > 0 && (
          <section aria-labelledby="a11y" className="flex flex-col gap-3">
            <h2 id="a11y" className="text-lg font-semibold tracking-tight">
              Accessibility
            </h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-700 marker:text-zinc-400 dark:text-zinc-300">
              {accessibility.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function PropsTable({ title, id, rows }: { title: string; id: string; rows: PropDoc[] }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Prop</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Default</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.name} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] font-medium text-indigo-700 dark:text-indigo-300">
                  {r.name}
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-zinc-700 dark:text-zinc-300">{r.type}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
                  {r.default ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
