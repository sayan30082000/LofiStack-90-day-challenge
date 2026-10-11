"use client";

import { useState, type FormEvent } from "react";
import { Check, Copy, SendHorizontal } from "lucide-react";
import { BanglaPhoneticInput, transliterateText } from "@/components/ui/bangla-phonetic-input";
import { cn } from "@/lib/utils";

const card = "rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900";
const bn = "[font-family:'Noto_Sans_Bengali','Hind_Siliguri','Nirmala_UI','Vrinda',var(--font-sans),sans-serif]";

/* ---------- Chat ---------- */

export function ChatDemo() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>(["কেমন আছো? কাল দেখা হবে?"]);
  const [words, setWords] = useState(0);

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages((m) => [...m, draft.trim()].slice(-4));
    setDraft("");
  };

  return (
    <form onSubmit={send} className={cn(card, "flex w-full max-w-lg flex-col gap-3")}>
      <ul aria-label="Messages" className="flex min-h-28 flex-col gap-2">
        {messages.map((m, i) => (
          <li
            key={i}
            lang="bn"
            className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2 text-base",
              bn,
              i === 0
                ? "self-start rounded-bl-md bg-zinc-100 dark:bg-zinc-800"
                : "self-end rounded-br-md bg-indigo-600 text-white dark:bg-indigo-500",
            )}
          >
            {m}
          </li>
        ))}
      </ul>
      <BanglaPhoneticInput
        label="Reply in Bangla"
        multiline
        rows={2}
        value={draft}
        onChange={setDraft}
        onCommit={() => setWords((n) => n + 1)}
        placeholder="valo achi, tumi kemon acho?"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-600 dark:text-zinc-400" aria-live="polite">
          {words} {words === 1 ? "word" : "words"} converted
        </p>
        <button
          type="submit"
          disabled={!draft.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white outline-none hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:focus-visible:ring-offset-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
        >
          Send <SendHorizontal className="size-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}

/* ---------- Form with a custom dictionary ---------- */

const BRAND_WORDS = { lofistack: "লফিস্ট্যাক", sayan: "সায়ন", netlify: "নেটলিফাই" };

export function FormDemo() {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  return (
    <div className={cn(card, "grid w-full max-w-lg gap-4")}>
      <BanglaPhoneticInput label="Your name" value={name} onChange={setName} dictionary={BRAND_WORDS} placeholder="sayan das" />
      <BanglaPhoneticInput
        label="Where do you work?"
        value={about}
        onChange={setAbout}
        dictionary={BRAND_WORDS}
        placeholder="ami lofistack e kaj kori"
        hint="Custom words like lofistack and netlify come from the dictionary prop."
      />
    </div>
  );
}

/* ---------- Paste and convert ---------- */

const SAMPLE = "amar sonar bangla, ami tomay bhalobashi. aj dhaka te onek brishti.";

export function ConverterDemo() {
  const [english, setEnglish] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);
  const bangla = transliterateText(english);

  return (
    <div className="grid w-full max-w-3xl gap-4 md:grid-cols-2">
      <div className={card}>
        <label htmlFor="bn-converter-in" className="text-sm font-medium">
          Phonetic English
        </label>
        <textarea
          id="bn-converter-in"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          rows={5}
          spellCheck={false}
          className="mt-1.5 w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-mono text-sm outline-none hover:border-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div className={cn(card, "flex flex-col")}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium" id="bn-converter-out-label">
            Bangla
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(bangla);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                setCopied(false);
              }
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-indigo-700 outline-none hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <output aria-labelledby="bn-converter-out-label" lang="bn" className={cn("mt-1.5 flex-1 rounded-lg bg-zinc-50 p-3 text-lg leading-relaxed dark:bg-zinc-950/50", bn)}>
          {bangla}
        </output>
      </div>
    </div>
  );
}
