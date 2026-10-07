import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">This component doesn&apos;t exist yet</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Check the link, or browse everything that has been built so far.</p>
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white outline-none hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Back to the gallery
      </Link>
    </main>
  );
}
