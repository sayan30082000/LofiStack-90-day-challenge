"use client";

import { useState } from "react";
import { Feather, Rss } from "lucide-react";
import { NewsletterSignup } from "@/components/ui/newsletter-signup";

/** Fake API: waits a moment, then fails for any email containing "fail". */
export function fakeSubscribe(email: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (email.toLowerCase().includes("fail")) {
        reject(new Error("Our mail server didn't respond. Your email wasn't saved, please try again."));
      } else resolve();
    }, 1100);
  });
}

/* ---------- Card variant in a blog footer ---------- */

const FOOTER_LINKS = [
  { title: "Read", links: ["Latest posts", "Field notes", "Archive"] },
  { title: "About", links: ["The author", "Colophon", "RSS feed"] },
];

export function BlogFooterDemo() {
  return (
    <div className="@container w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Tail end of an article so the footer has context. */}
      <div className="border-b border-zinc-200 px-5 py-6 dark:border-zinc-800 @2xl:px-8">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Thanks for reading</p>
        <p className="mt-1 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          That&apos;s the end of “Slow software for fast teams”. Next week: why your design system needs fewer components.
        </p>
      </div>
      <footer className="grid gap-8 bg-zinc-50 px-5 py-8 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] @2xl:px-8 dark:bg-zinc-900/40">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <Feather className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Quiet Margins</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Essays on calm, durable software</p>
            </div>
          </div>
          <nav aria-label="Blog footer" className="grid grid-cols-2 gap-6 text-sm">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{col.title}</p>
                <ul className="mt-2 space-y-1">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="inline-flex min-h-8 items-center rounded text-zinc-600 outline-none hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">© Quiet Margins. Written by hand, served without trackers.</p>
        </div>

        <NewsletterSignup
          variant="card"
          title="One thoughtful essay, every other Sunday"
          description="Join 4,200 engineers and designers. No listicles, no tracking pixels."
          buttonText="Subscribe"
          footnote="Unsubscribe with one click. Try an email with “fail” in it to see the error state."
          onSubscribe={fakeSubscribe}
        />
      </footer>
    </div>
  );
}

/* ---------- Inline variant ---------- */

export function InlineDemo() {
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-500/25 dark:bg-indigo-500/10">
        <div className="mb-3 flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
          <Rss className="size-4" aria-hidden />
          <p className="text-sm font-semibold">Release notes in your inbox</p>
        </div>
        <NewsletterSignup
          variant="inline"
          label="Email for release notes"
          placeholder="Work email"
          buttonText="Notify me"
          successTitle="Subscribed"
          successMessage={(email) => `We'll email ${email} when a new version ships.`}
          onSubscribe={async (email) => {
            await fakeSubscribe(email);
            setLog((l) => [`${email} subscribed`, ...l].slice(0, 3));
          }}
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <NewsletterSignup
          variant="inline"
          title="Product updates"
          description="Monthly, with a consent checkbox that is required before subscribing."
          titleAs="h4"
          requireConsent
          consentLabel={
            <>
              I agree to receive product emails and accept the{" "}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="font-medium text-indigo-700 underline underline-offset-2 outline-none hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                privacy policy
              </a>
              .
            </>
          }
          onSubscribe={fakeSubscribe}
        />
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
        <NewsletterSignup
          variant="inline"
          title="Disabled"
          titleAs="h4"
          description="Signups are paused while we migrate providers."
          disabled
          onSubscribe={fakeSubscribe}
        />
      </div>

      {log.length > 0 && (
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          onSubscribe: {log.join(" · ")}
        </p>
      )}
    </div>
  );
}

/* ---------- Fake API ---------- */

export function FakeApiDemo() {
  const [calls, setCalls] = useState<{ email: string; ok: boolean }[]>([]);

  const subscribe = async (email: string) => {
    try {
      await fakeSubscribe(email);
      setCalls((c) => [{ email, ok: true }, ...c].slice(0, 5));
    } catch (err) {
      setCalls((c) => [{ email, ok: false }, ...c].slice(0, 5));
      throw err;
    }
  };

  return (
    <div className="grid w-full max-w-3xl gap-4 @container">
      <div className="grid gap-4 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
        <NewsletterSignup
          variant="card"
          title="Try the states"
          description="Submit empty, then a typo like “jane@”, then fail@example.com, then a real-looking address."
          onSubscribe={subscribe}
        />
        <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">API calls</p>
          {calls.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">None yet. Validation errors never reach the API.</p>
          ) : (
            <ul className="space-y-1.5">
              {calls.map((c, i) => (
                <li key={`${c.email}-${i}`} className="flex min-w-0 items-center gap-2 font-mono text-xs">
                  <span
                    className={
                      c.ok
                        ? "rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "rounded bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
                    }
                  >
                    {c.ok ? "200" : "503"}
                  </span>
                  <span className="truncate">{c.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
