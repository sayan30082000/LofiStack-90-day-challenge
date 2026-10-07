"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Archive, BookMarked, Eye, GitFork, RotateCcw, Star, Trash2, UserMinus } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const secondaryBtn =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm font-medium text-zinc-800 outline-none transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

const dangerBtn =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-3.5 text-sm font-medium text-rose-700 outline-none transition-colors hover:border-rose-600 hover:bg-rose-600 hover:text-white focus-visible:ring-2 focus-visible:ring-rose-500 active:bg-rose-700 motion-reduce:transition-none dark:border-rose-500/40 dark:bg-zinc-900 dark:text-rose-400 dark:hover:border-rose-500 dark:hover:bg-rose-600 dark:hover:text-white";

export function DangerZoneDemo() {
  const failId = useId();
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [failNext, setFailNext] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const restoreRef = useRef<HTMLButtonElement>(null);

  const deleteRepo = async () => {
    await wait(1400);
    if (failNext) {
      setFailNext(false);
      throw new Error("GitHub API timed out (504). Nothing was deleted, try again.");
    }
    setDeleted(true);
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          lofistack / repositories
        </div>
        {deleted ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Trash2 className="size-5" aria-hidden />
            </span>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">lofi-ui</span> was deleted.
            </p>
            <button
              ref={restoreRef}
              type="button"
              onClick={() => setDeleted(false)}
              className={secondaryBtn}
            >
              <RotateCcw className="size-4" aria-hidden /> Restore repository
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4">
              <BookMarked className="size-5 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-indigo-700 dark:text-indigo-300">lofi-ui</span>
                  <span className="rounded-full border border-zinc-300 px-2 py-px text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                    {isPublic ? "Public" : "Private"}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
                  Lo-fi React components, one a week for 90 days.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5" aria-hidden /> 1.2k
                </span>
                <span className="inline-flex items-center gap-1">
                  <GitFork className="size-3.5" aria-hidden /> 86
                </span>
              </div>
            </div>

            <section aria-labelledby={`${failId}-dz`} className="m-4 mt-0 rounded-xl border border-rose-300 dark:border-rose-500/40">
              <h3 id={`${failId}-dz`} className="border-b border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:text-rose-400">
                Danger zone
              </h3>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <DangerRow
                  title="Change visibility"
                  body={`This repository is ${isPublic ? "public" : "private"}.`}
                  action={
                    <button type="button" onClick={() => setIsPublic((v) => !v)} className={secondaryBtn}>
                      <Eye className="size-4" aria-hidden /> {isPublic ? "Make private" : "Make public"}
                    </button>
                  }
                />
                <DangerRow title="Archive this repository" body="Mark it read-only. Owners only." action={<button type="button" disabled className={secondaryBtn}><Archive className="size-4" aria-hidden /> Archive</button>} />
                <DangerRow
                  title="Delete this repository"
                  body="Once deleted, it can't be undone."
                  action={
                    <button type="button" onClick={() => setOpen(true)} className={dangerBtn}>
                      <Trash2 className="size-4" aria-hidden /> Delete repository
                    </button>
                  }
                />
              </ul>
            </section>
          </>
        )}
      </div>

      <label htmlFor={failId} className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 self-start text-sm text-zinc-600 dark:text-zinc-400">
        <input
          id={failId}
          type="checkbox"
          checked={failNext}
          onChange={(e) => setFailNext(e.target.checked)}
          className="size-4 rounded border-zinc-300 accent-indigo-600"
        />
        Fail the next delete (shows the in-dialog error)
      </label>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete lofistack/lofi-ui?"
        description="This permanently deletes the repository, its wiki, issues, comments and packages."
        resourceName="lofi-ui"
        consequences={[
          "1,204 stars and 86 forks are removed from the network",
          "The Netlify deploy hook and 3 webhooks stop firing",
          "Open pull requests from collaborators are closed",
        ]}
        confirmLabel="Delete this repository"
        loadingLabel="Deleting repository…"
        onConfirm={deleteRepo}
        finalFocusRef={restoreRef}
      />
    </div>
  );
}

function DangerRow({ title, body, action }: { title: string; body: string; action: ReactNode }) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
      </div>
      {action}
    </li>
  );
}

const MEMBERS = [
  { id: "maya", name: "Maya Chen", handle: "maya.chen" },
  { id: "tom", name: "Tom Okafor", handle: "tom.okafor" },
];

export function CaseInsensitiveDemo() {
  const [members, setMembers] = useState(MEMBERS);
  const [target, setTarget] = useState<(typeof MEMBERS)[number] | null>(null);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul ref={listRef} tabIndex={-1} aria-label="Team members" className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white outline-none dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {members.length === 0 && <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No members left.</li>}
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <span aria-hidden className="inline-flex size-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {m.name.split(" ").map((w) => w[0]).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.name}</p>
              <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">@{m.handle}</p>
            </div>
            <button
              type="button"
              aria-label={`Remove ${m.name}`}
              onClick={() => {
                setTarget(m);
                setOpen(true);
              }}
              className={cn(secondaryBtn, "size-10 px-0 text-zinc-500 hover:text-rose-700 dark:text-zinc-400 dark:hover:text-rose-400")}
            >
              <UserMinus className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setMembers(MEMBERS)} disabled={members.length === MEMBERS.length} className={cn(secondaryBtn, "self-start")}>
        <RotateCcw className="size-4" aria-hidden /> Reset members
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Remove ${target?.name ?? ""} from the team?`}
        description="They lose access to every project immediately. You can invite them again later."
        resourceName={target?.handle ?? ""}
        caseSensitive={false}
        confirmLabel="Remove member"
        loadingLabel="Removing…"
        inputLabel={(name) => <>Type their handle {name} (any case)</>}
        onConfirm={async () => {
          await wait(800);
          setMembers((list) => list.filter((m) => m.id !== target?.id));
        }}
        finalFocusRef={listRef}
      />
    </div>
  );
}
