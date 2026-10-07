"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { SendHorizontal } from "lucide-react";
import {
  TypingIndicator,
  useTypingActivity,
  type TypingActivity,
  type TypingIndicatorVariant,
  type TypingUser,
} from "@/components/ui/typing-indicator";
import { cn } from "@/lib/utils";

const VARIANTS: TypingIndicatorVariant[] = ["ink", "keys", "ghost"];

/* ---------- Live mirror ---------- */

export function MirrorDemo() {
  const inputId = useId();
  const [variant, setVariant] = useState<TypingIndicatorVariant>("ink");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const typing = useTypingActivity({ pauseAfter: 1500, idleAfter: 8000 });

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSent((s) => [...s, draft.trim()].slice(-2));
    setDraft("");
    typing.reset();
  };

  const speed = typing.intensity >= 0.66 ? "fast" : typing.intensity >= 0.33 ? "steady" : "slow";

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <Segmented label="Look" options={VARIANTS} value={variant} onChange={setVariant} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form
          onSubmit={send}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <label htmlFor={inputId} className="text-sm font-semibold">
            You (Sam) are typing
          </label>
          <textarea
            id={inputId}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              typing.track(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) send(e);
            }}
            rows={4}
            placeholder="Type fast, slow down, stop, hold Backspace, or erase it all…"
            className="min-h-28 resize-none rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none placeholder:text-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Chip label="state" value={typing.activity ?? "idle"} />
            <Chip label="speed" value={typing.activity === "typing" ? speed : "—"} />
            <Chip label="draft" value={`${typing.draftLength} chars`} />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white outline-none hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-zinc-900"
            >
              Send <SendHorizontal className="size-3.5" aria-hidden />
            </button>
          </div>
        </form>

        <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold">What Maya sees</p>
          <div className="mt-3 flex flex-1 flex-col justify-end gap-2">
            {sent.length === 0 && !typing.activity && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Start typing on the left.</p>
            )}
            {sent.map((m, i) => (
              <p key={i} className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-2 text-sm dark:bg-zinc-800">
                {m}
              </p>
            ))}
            <TypingIndicator
              visible={typing.activity !== null}
              users={[typing.asUser({ name: "Sam" })]}
              variant={variant}
              elapsedAfter={5}
              longDraftAt={80}
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Only the activity, speed and draft length are shared, never the text. Past 80 characters it reads &quot;writing a long
        message&quot;, after 5 seconds a timer appears, and erasing a draft of 15+ characters reads &quot;changed their mind&quot;.
      </p>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-md bg-zinc-100 px-2 font-mono dark:bg-zinc-800">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="font-medium" aria-live="off">
        {value}
      </span>
    </span>
  );
}

/* ---------- Activities ---------- */

const ACTIVITIES: { activity: TypingActivity; note: string; extra?: Partial<TypingUser> }[] = [
  { activity: "typing", note: "Tempo follows typing speed", extra: { intensity: 0.5 } },
  { activity: "deleting", note: "Holding Backspace" },
  { activity: "paused", note: "Stopped for a moment" },
  { activity: "abandoned", note: "Erased the draft instead of sending" },
  { activity: "recording", note: "Voice note" },
  { activity: "attaching", note: "Uploading a file" },
  { activity: "thinking", note: "AI assistants" },
];

export function ActivitiesDemo() {
  const [variant, setVariant] = useState<TypingIndicatorVariant>("ink");
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <Segmented label="Look" options={VARIANTS} value={variant} onChange={setVariant} />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIVITIES.map(({ activity, note, extra }) => (
          <li key={activity} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-xs font-medium">{activity}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{note}</span>
            </div>
            <TypingIndicator users={[{ name: "Alex", activity, ...extra }]} variant={variant} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Looks x states ---------- */

export function LooksDemo() {
  const states: { label: string; activity: TypingActivity; intensity?: number }[] = [
    { label: "slow", activity: "typing", intensity: 0.1 },
    { label: "fast", activity: "typing", intensity: 0.9 },
    { label: "rewriting", activity: "deleting" },
    { label: "paused", activity: "paused" },
  ];
  return (
    <div tabIndex={0} role="region" aria-label="Looks and states" className="w-full max-w-3xl overflow-x-auto rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
      <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr className="text-xs text-zinc-500 dark:text-zinc-400">
            <th scope="col" className="px-3 font-medium">
              variant
            </th>
            {states.map((s) => (
              <th key={s.label} scope="col" className="px-3 font-medium">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map((v) => (
            <tr key={v}>
              <th scope="row" className="rounded-l-xl bg-white px-3 py-2 font-mono text-xs font-medium dark:bg-zinc-900">
                {v}
              </th>
              {states.map((s, i) => (
                <td key={s.label} className={cn("bg-white px-3 py-2 dark:bg-zinc-900", i === states.length - 1 && "rounded-r-xl")}>
                  <TypingIndicator
                    variant={v}
                    showText={false}
                    users={[{ name: "Alex", activity: s.activity, intensity: s.intensity, draftLength: 60 }]}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex flex-wrap items-end gap-6">
        {(["sm", "md", "lg"] as const).map((size) => (
          <div key={size} className="flex flex-col gap-1">
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">size=&quot;{size}&quot;</span>
            <TypingIndicator size={size} variant="keys" showText={false} users={[{ name: "Alex" }]} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Group chat ---------- */

const TEAM: (TypingUser & { id: string })[] = [
  { id: "sam", name: "Sam Chen", activity: "typing", intensity: 0.9 },
  { id: "priya", name: "Priya Nair", activity: "recording" },
  { id: "jordan", name: "Jordan Lee", activity: "typing", draftLength: 320 },
  { id: "mia", name: "Mia Torres", activity: "attaching" },
  { id: "ken", name: "Kenji Ito", activity: "paused" },
];

export function GroupDemo() {
  const [on, setOn] = useState<string[]>(["sam", "priya", "jordan"]);
  const users = TEAM.filter((u) => on.includes(u.id));

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Who is active</legend>
        {TEAM.map((u) => {
          const checked = on.includes(u.id);
          return (
            <label
              key={u.id}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500",
                checked
                  ? "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-100"
                  : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => setOn((s) => (checked ? s.filter((x) => x !== u.id) : [...s, u.id]))}
              />
              <span className="font-medium">{u.name.split(" ")[0]}</span>
              <span className="font-mono opacity-70">{u.draftLength ? "long draft" : u.activity}</span>
            </label>
          );
        })}
      </fieldset>
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-2 text-sm dark:bg-zinc-800">
          Final call for launch notes. Drop them here.
        </p>
        <TypingIndicator className="mt-2" visible={users.length > 0} users={users} variant="ghost" maxAvatars={3} />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Each avatar carries its own activity badge. The text groups people by what they&apos;re doing, and the bubble shows
        the most important activity.
      </p>
    </div>
  );
}

/* ---------- Scripted chat ---------- */

interface Message {
  id: number;
  from: "me" | "alex";
  text: string;
}

const ALEX = { id: "alex", name: "Alex Rivera" };

const REPLIES = [
  "Found it! Your September invoice is in Billing → History. I've also re-sent it to your email.",
  "Yes, you can switch to yearly anytime. You'd save 20% and the change applies from your next cycle.",
  "Sure. I've flagged this for the team and you'll hear back within a day.",
];

// Alex types quickly, hesitates, rewrites, then writes a longer reply.
const SCRIPT: { at: number; state: Partial<TypingUser> | null }[] = [
  { at: 300, state: { activity: "typing", intensity: 0.9, draftLength: 20 } },
  { at: 1600, state: { activity: "paused", draftLength: 34 } },
  { at: 2800, state: { activity: "deleting", draftLength: 12 } },
  { at: 3800, state: { activity: "typing", intensity: 0.3, draftLength: 90 } },
  { at: 5400, state: { activity: "typing", intensity: 0.5, draftLength: 160 } },
  { at: 7000, state: null },
];

export function ChatDemo() {
  const inputId = useId();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: "alex", text: "Hi! I'm Alex from support. How can I help?" },
    { id: 2, from: "me", text: "I can't find last month's invoice." },
  ]);
  const [draft, setDraft] = useState("");
  const [alex, setAlex] = useState<TypingUser | null>(null);
  const nextId = useRef(3);
  const replyIndex = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, alex]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: nextId.current++, from: "me", text }]);
    setDraft("");
    timers.current.forEach(clearTimeout);
    const startedAt = Date.now() + SCRIPT[0].at;
    timers.current = SCRIPT.map(({ at, state }) =>
      setTimeout(() => {
        if (state) setAlex({ ...ALEX, startedAt, ...state });
        else {
          setAlex(null);
          const reply = REPLIES[replyIndex.current++ % REPLIES.length];
          setMessages((m) => [...m, { id: nextId.current++, from: "alex", text: reply }]);
        }
      }, at),
    );
  };

  return (
    <div className="flex h-[26rem] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800 dark:bg-sky-500/20 dark:text-sky-200">
          AR
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Alex Rivera</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Online · Support</p>
        </div>
      </div>
      <div ref={scroller} role="log" aria-label="Messages" className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <p
            key={m.id}
            className={cn(
              "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
              m.from === "me"
                ? "self-end rounded-br-md bg-indigo-600 text-white dark:bg-indigo-500"
                : "self-start rounded-bl-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
            )}
          >
            <span className="sr-only">{m.from === "me" ? "You: " : "Alex: "}</span>
            {m.text}
          </p>
        ))}
        <TypingIndicator visible={alex !== null} users={alex ? [alex] : []} variant="ink" showAvatars={false} longDraftAt={120} elapsedAfter={4} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <label htmlFor={inputId} className="sr-only">
          Message
        </label>
        <input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Send a message to watch Alex reply"
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white outline-none hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-zinc-900"
        >
          <SendHorizontal className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}

/* ---------- Custom styling and wording ---------- */

export function BrandDemo() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <TypingIndicator
        users={[{ name: "Lofi Bot", activity: "thinking" }]}
        size="lg"
        bubbleClassName="bg-indigo-600 dark:bg-indigo-500"
        markClassName="text-white"
        showActivityBadges={false}
      />
      <TypingIndicator
        users={[{ name: "Ana Souza", activity: "typing", intensity: 0.8 }]}
        variant="keys"
        bubbleClassName="bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30"
        markClassName="text-emerald-700 dark:text-emerald-300"
        labels={{ typing: ["está escribiendo", "están escribiendo"] }}
      />
      <TypingIndicator
        users={[{ name: "Rahim", activity: "deleting" }]}
        variant="ghost"
        align="end"
        markClassName="text-amber-600 dark:text-amber-300"
        labels={{ deleting: ["is choosing their words", "are choosing their words"] }}
      />
    </div>
  );
}

/* ---------- Demo control ---------- */

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex w-fit rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "h-8 rounded-md px-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            value === o
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
