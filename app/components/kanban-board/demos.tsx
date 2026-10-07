"use client";

import { useState } from "react";
import { KanbanBoard, type KanbanCard, type KanbanColumn } from "@/components/ui/kanban-board";
import { cn } from "@/lib/utils";

/** Fixed "today" so overdue badges are the same on every visit. */
const TODAY = "2026-10-15";

const COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To do" },
  { id: "doing", title: "In progress", limit: 3 },
  { id: "review", title: "Review" },
  { id: "done", title: "Done", done: true },
];

const maya = { name: "Maya Chen" };
const leo = { name: "Leo Martins" };
const priya = { name: "Priya Nair" };
const sam = { name: "Sam Okafor" };

const CARDS: KanbanCard[] = [
  { id: "c1", columnId: "todo", title: "Write the Week 11 challenge post", tags: ["Content"], assignee: maya, due: "2026-10-20" },
  { id: "c2", columnId: "todo", title: "Audit color contrast in dark mode", tags: ["A11y", "Design"], assignee: priya, due: "2026-10-12" },
  { id: "c3", columnId: "todo", title: "Add sitemap entries for new components", tags: ["SEO"] },
  { id: "c4", columnId: "doing", title: "Kanban board keyboard dragging", tags: ["Feature", "A11y"], assignee: leo, due: "2026-10-15" },
  { id: "c5", columnId: "doing", title: "Gauge chart spring animation", tags: ["Feature"], assignee: sam, due: "2026-10-18" },
  { id: "c6", columnId: "doing", title: "Fix toast swipe on iOS Safari", tags: ["Bug"], assignee: maya, due: "2026-10-09" },
  { id: "c7", columnId: "review", title: "Breadcrumbs collapse menu", tags: ["Feature"], assignee: priya, due: "2026-10-16" },
  { id: "c8", columnId: "review", title: "Update README component table", tags: ["Docs"], assignee: sam },
  { id: "c9", columnId: "done", title: "Set up Netlify deploy previews", tags: ["Infra"], assignee: leo, due: "2026-10-01" },
  { id: "c10", columnId: "done", title: "Tree view lazy loading", tags: ["Feature"], assignee: maya, due: "2026-10-03", disabled: true },
];

function summarize(cards: KanbanCard[]) {
  return COLUMNS.map((c) => `${c.title}: ${cards.filter((card) => card.columnId === c.id).length}`).join(" · ");
}

export function SprintBoardDemo() {
  const [cards, setCards] = useState(CARDS);
  const [lastChange, setLastChange] = useState<string | null>(null);

  const onChange = (next: KanbanCard[]) => {
    const moved = next.find((card) => cards.find((c) => c.id === card.id)?.columnId !== card.columnId);
    const added = next.find((card) => !cards.some((c) => c.id === card.id));
    if (added) setLastChange(`Added “${added.title}” to ${COLUMNS.find((c) => c.id === added.columnId)?.title}`);
    else if (moved) setLastChange(`Moved “${moved.title}” to ${COLUMNS.find((c) => c.id === moved.columnId)?.title}`);
    else setLastChange("Reordered cards");
    setCards(next);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <KanbanBoard
        columns={COLUMNS}
        cards={cards}
        onChange={onChange}
        today={TODAY}
        labels={{ board: "Sprint 11 board" }}
      />
      <div className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
        <p>
          onChange: <span className="font-medium text-zinc-800 dark:text-zinc-200">{lastChange ?? "nothing yet"}</span>
        </p>
        <p className="font-mono">{summarize(cards)}</p>
        <p>
          Today is fixed to Oct 15 for the demo. Drag a fourth card into In progress to see the limit warning, or focus a
          card and use Space and the arrow keys.
        </p>
      </div>
    </div>
  );
}

/* ---------- States ---------- */

type Mode = "loading" | "empty" | "readonly" | "flaky";
const MODES: { id: Mode; label: string }[] = [
  { id: "loading", label: "Loading" },
  { id: "empty", label: "Empty" },
  { id: "readonly", label: "Read-only" },
  { id: "flaky", label: "Add fails" },
];

const SMALL_COLUMNS: KanbanColumn[] = [
  { id: "backlog", title: "Backlog" },
  { id: "next", title: "Next up", limit: 2 },
  { id: "shipped", title: "Shipped", done: true },
];

const SMALL_CARDS: KanbanCard[] = [
  { id: "s1", columnId: "backlog", title: "Command palette fuzzy search", tags: ["Feature"], assignee: priya },
  { id: "s2", columnId: "next", title: "OTP input paste support", tags: ["Bug"], assignee: leo, due: "2026-10-14" },
  { id: "s3", columnId: "shipped", title: "Logo marquee", tags: ["Feature"], assignee: sam, due: "2026-10-02" },
];

export function StatesDemo() {
  const [mode, setMode] = useState<Mode>("loading");
  const [empty, setEmpty] = useState<KanbanCard[]>([]);
  const [flaky, setFlaky] = useState(SMALL_CARDS);
  const [attempts, setAttempts] = useState(0);

  // Fails the first attempt, then succeeds, so both the error and the recovery can be seen.
  const flakyAdd = (columnId: string, title: string) =>
    new Promise<KanbanCard>((resolve, reject) => {
      const n = attempts;
      setAttempts(n + 1);
      setTimeout(() => {
        if (n % 2 === 0) reject(new Error("Network error"));
        else resolve({ id: `f-${n}`, columnId, title, tags: ["New"] });
      }, 800);
    });

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div role="group" aria-label="Board state" className="flex w-fit flex-wrap gap-1 rounded-lg bg-zinc-200/70 p-1 dark:bg-zinc-800">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "h-10 rounded-md px-3 text-sm font-medium outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              mode === m.id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "loading" && <KanbanBoard columns={SMALL_COLUMNS} cards={[]} loading />}
      {mode === "empty" && (
        <KanbanBoard
          columns={SMALL_COLUMNS}
          cards={empty}
          onChange={setEmpty}
          today={TODAY}
          labels={{ empty: "Nothing here. Add the first card." }}
        />
      )}
      {mode === "readonly" && <KanbanBoard columns={SMALL_COLUMNS} cards={SMALL_CARDS} today={TODAY} disabled />}
      {mode === "flaky" && (
        <KanbanBoard
          columns={SMALL_COLUMNS}
          cards={flaky}
          onChange={setFlaky}
          onAddCard={flakyAdd}
          today={TODAY}
          labels={{ addError: "Couldn't save the card (simulated). Press Add again." }}
        />
      )}
    </div>
  );
}
