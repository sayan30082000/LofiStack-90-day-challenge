"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, CircleAlert, LoaderCircle, Lock, Plus, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ========================================================== */

export interface KanbanColumn {
  id: string;
  title: string;
  /** Work-in-progress limit. The column warns when it holds more cards than this. */
  limit?: number;
  /** Cards here are finished, so their due dates are never flagged as overdue. */
  done?: boolean;
}

export interface KanbanAssignee {
  name: string;
  /** Optional avatar image. Initials are shown otherwise. */
  avatarUrl?: string;
}

export interface KanbanCard {
  id: string;
  /** Column the card is in. Order within a column follows the order of the cards array. */
  columnId: string;
  title: string;
  tags?: string[];
  assignee?: KanbanAssignee;
  /** Due date as YYYY-MM-DD. */
  due?: string;
  /** Locked cards can't be dragged. */
  disabled?: boolean;
}

export type KanbanTagTone = "zinc" | "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";

export interface KanbanCardRenderState {
  /** True for the copy that follows the pointer while dragging. */
  isOverlay: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
}

export interface KanbanLabels {
  /** Accessible name of the board region. */
  board: string;
  addCard: string;
  addCardPlaceholder: string;
  add: string;
  cancel: string;
  /** Shown when onAddCard rejects. */
  addError: string;
  empty: string;
  dropHere: string;
  /** e.g. "2 over limit". */
  overLimit: (over: number, limit: number) => string;
  atLimit: string;
  /** Shown on the column being dragged into when the drop would break its limit. */
  wouldExceed: (limit: number) => string;
  overdue: string;
  dueToday: string;
  /** Prefix read before the due date. */
  due: string;
  /** Prefix read before the assignee's name. */
  assignedTo: string;
  /** Screen reader name for a card's role, replacing dnd-kit's "sortable". */
  cardRole: string;
  /** Read when a card gets focus. */
  instructions: string;
  loading: string;
  locked: string;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  /** Cards (controlled). Pair with onChange. */
  cards?: KanbanCard[];
  /** Initial cards when uncontrolled. */
  defaultCards?: KanbanCard[];
  /** Called with the full new card array after a drop or an added card. */
  onChange?: (cards: KanbanCard[]) => void;
  /**
   * Called by the inline "Add card" form. Return (or resolve) a card to have the board insert it,
   * or return nothing and update `cards` yourself. A rejected promise shows the error state.
   * Without it, the board creates the card itself.
   */
  onAddCard?: (columnId: string, title: string) => KanbanCard | void | Promise<KanbanCard | void>;
  /** Replace the inside of a card. Dragging, focus and placeholders still work. */
  renderCard?: (card: KanbanCard, state: KanbanCardRenderState) => ReactNode;
  /** Show the inline "Add card" form in every column. */
  allowAdd?: boolean;
  /** Today's date (YYYY-MM-DD) for overdue checks. Defaults to the viewer's local date after hydration. */
  today?: string;
  /** Locale for due dates. */
  locale?: string;
  /** Force a tone for specific tags. Others get a stable tone from their name. */
  tagTones?: Record<string, KanbanTagTone>;
  /** Refuse drops into a column that is already at its limit. */
  blockOverLimit?: boolean;
  /** Read-only board: no dragging, no adding. */
  disabled?: boolean;
  /** Show skeleton columns. */
  loading?: boolean;
  labels?: Partial<KanbanLabels>;
  /** Override dnd-kit's screen reader announcements. */
  announcements?: Announcements;
  /** Column width on wide screens. Columns shrink to 85% of the board on narrow ones. Any CSS length. */
  columnWidth?: string;
  className?: string;
}

const DEFAULT_LABELS: KanbanLabels = {
  board: "Kanban board",
  addCard: "Add card",
  addCardPlaceholder: "Card title",
  add: "Add",
  cancel: "Cancel",
  addError: "Couldn't add the card. Try again.",
  empty: "No cards yet",
  dropHere: "Drop here",
  overLimit: (over) => `${over} over limit`,
  atLimit: "At limit",
  wouldExceed: (limit) => `Exceeds the limit of ${limit}`,
  overdue: "Overdue",
  dueToday: "Today",
  due: "Due",
  assignedTo: "Assigned to",
  cardRole: "draggable card",
  instructions:
    "To pick up a card, press Space or Enter. Use the arrow keys to move it within a column or to another column. Press Space or Enter again to drop it, or Escape to cancel.",
  loading: "Loading board",
  locked: "Locked",
};

const TAG_TONES: Record<KanbanTagTone, string> = {
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};
const AUTO_TONES: KanbanTagTone[] = ["indigo", "emerald", "amber", "rose", "sky", "violet"];

const AVATAR_TONES = [
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/25 dark:text-indigo-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200",
  "bg-amber-100 text-amber-900 dark:bg-amber-500/25 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-500/25 dark:text-rose-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-500/25 dark:text-sky-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-500/25 dark:text-violet-200",
];

/* ============================================================
 * Helpers
 * ========================================================== */

const COLUMN_PREFIX = "kanban-column:";
const colKey = (id: string) => `${COLUMN_PREFIX}${id}`;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "")).toUpperCase();
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatDue(due: string, locale: string) {
  let f = formatters.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
    formatters.set(locale, f);
  }
  const [y, m, d] = due.split("-").map(Number);
  if (!y || !m || !d) return due;
  return f.format(Date.UTC(y, m - 1, d));
}

/** Move a card to `index` within `columnId`, keeping the global order of everything else. */
function moveCard(list: KanbanCard[], id: string, columnId: string, index: number): KanbanCard[] {
  const card = list.find((c) => c.id === id);
  if (!card) return list;
  const rest = list.filter((c) => c.id !== id);
  const moved = card.columnId === columnId ? card : { ...card, columnId };
  const inColumn = rest.filter((c) => c.columnId === columnId);
  if (index < inColumn.length) rest.splice(rest.indexOf(inColumn[Math.max(0, index)]), 0, moved);
  else if (inColumn.length > 0) rest.splice(rest.indexOf(inColumn[inColumn.length - 1]) + 1, 0, moved);
  else rest.push(moved);
  return rest;
}

const sameOrder = (a: KanbanCard[], b: KanbanCard[]) =>
  a.length === b.length && a.every((c, i) => c.id === b[i].id && c.columnId === b[i].columnId);

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [current, set] as const;
}

const noopSubscribe = () => () => {};
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const subscribeReducedMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

type DragData = { type: "column"; columnId: string } | { type: "card"; columnId: string };

/* ============================================================
 * Board
 * ========================================================== */

/**
 * Kanban board built on dnd-kit: drag cards within and between columns with the mouse,
 * touch or keyboard, with WIP limits, inline quick add and due-date warnings.
 */
export function KanbanBoard({
  columns,
  cards: cardsProp,
  defaultCards,
  onChange,
  onAddCard,
  renderCard,
  allowAdd = true,
  today: todayProp,
  locale = "en-US",
  tagTones,
  blockOverLimit = false,
  disabled = false,
  loading = false,
  labels: labelsProp,
  announcements: announcementsProp,
  columnWidth = "16.5rem",
  className,
}: KanbanBoardProps) {
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelsProp }), [labelsProp]);
  const dndId = useId();
  const [cards, setCards] = useControllable(cardsProp, defaultCards ?? [], onChange);
  const [draft, setDraft] = useState<KanbanCard[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const clientToday = useSyncExternalStore(noopSubscribe, localToday, () => null);
  const today = todayProp ?? clientToday;
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  // Latest cards for async quick add, which resolves after later renders.
  const latestCards = useRef(cards);
  useEffect(() => {
    latestCards.current = cards;
  }, [cards]);

  const items = draft ?? cards;
  const byColumn = useMemo(() => {
    const map = new Map<string, KanbanCard[]>(columns.map((c) => [c.id, []]));
    for (const card of items) map.get(card.columnId)?.push(card);
    return map;
  }, [items, columns]);

  const columnTitle = (key: string | undefined) => {
    const id = key?.startsWith(COLUMN_PREFIX) ? key.slice(COLUMN_PREFIX.length) : key;
    return columns.find((c) => c.id === id)?.title ?? "";
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // A short press-and-hold on touch, so horizontal swipes still scroll the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /* ---------- Drag handlers ---------- */

  const targetOf = (list: KanbanCard[], over: Over) => {
    const data = over.data.current as DragData | undefined;
    if (data?.type === "column") return { columnId: data.columnId, overCard: null };
    const overCard = list.find((c) => c.id === over.id) ?? null;
    return { columnId: overCard?.columnId, overCard };
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setDraft(cards);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const list = draft ?? cards;
    const card = list.find((c) => c.id === active.id);
    const { columnId, overCard } = targetOf(list, over);
    if (!card || !columnId || columnId === card.columnId) return;
    const column = columns.find((c) => c.id === columnId);
    const inTarget = list.filter((c) => c.columnId === columnId);
    if (blockOverLimit && column?.limit !== undefined && inTarget.length >= column.limit) return;
    let index = inTarget.length;
    if (overCard) {
      const overIndex = inTarget.findIndex((c) => c.id === overCard.id);
      const rect = active.rect.current.translated;
      const below = rect ? rect.top > over.rect.top + over.rect.height / 2 : false;
      index = overIndex + (below ? 1 : 0);
    }
    setDraft(moveCard(list, card.id, columnId, index));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    let final = draft ?? cards;
    const card = final.find((c) => c.id === active.id);
    if (over && card) {
      const { overCard } = targetOf(final, over);
      if (overCard && overCard.columnId === card.columnId && overCard.id !== card.id) {
        const inColumn = final.filter((c) => c.columnId === card.columnId);
        final = moveCard(final, card.id, card.columnId, inColumn.findIndex((c) => c.id === overCard.id));
      }
    }
    setDraft(null);
    setActiveId(null);
    if (!sameOrder(final, cards)) setCards(final);
  };

  const onDragCancel = () => {
    setDraft(null);
    setActiveId(null);
  };

  /* ---------- Screen reader announcements ---------- */

  const titleOf = (active: Active) => {
    const t = items.find((c) => c.id === active.id)?.title ?? cards.find((c) => c.id === active.id)?.title;
    return t ? `“${t}”` : "Card";
  };

  const placeOf = (over: Over) => {
    const data = over.data.current as (DragData & { sortable?: { containerId: string; index: number; items: unknown[] } }) | undefined;
    if (data?.sortable) {
      return `${columnTitle(String(data.sortable.containerId))}, position ${data.sortable.index + 1} of ${data.sortable.items.length}`;
    }
    if (data?.type === "column") {
      const n = byColumn.get(data.columnId)?.length ?? 0;
      return `${columnTitle(data.columnId)}, position ${n + 1} of ${n + 1}`;
    }
    return "";
  };

  const defaultAnnouncements: Announcements = {
    onDragStart: ({ active }) => {
      const card = cards.find((c) => c.id === active.id);
      const list = card ? (byColumn.get(card.columnId) ?? []) : [];
      return `Picked up ${titleOf(active)} in ${columnTitle(card?.columnId)}, position ${list.findIndex((c) => c.id === active.id) + 1} of ${list.length}.`;
    },
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active)} is over ${placeOf(over)}.` : `${titleOf(active)} is no longer over a column.`,
    onDragEnd: ({ active, over }) => (over ? `Dropped ${titleOf(active)} in ${placeOf(over)}.` : `Dropped ${titleOf(active)}.`),
    onDragCancel: ({ active }) => {
      const card = cards.find((c) => c.id === active.id);
      return `Cancelled. ${titleOf(active)} is back in ${columnTitle(card?.columnId)}.`;
    },
  };

  /* ---------- Quick add ---------- */

  const addCard = async (columnId: string, title: string) => {
    const created = onAddCard
      ? await onAddCard(columnId, title)
      : {
          id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `card-${Date.now()}`,
          columnId,
          title,
        };
    if (created) setCards([...latestCards.current, created]);
  };

  /* ---------- Render ---------- */

  const activeCard = activeId ? items.find((c) => c.id === activeId) : undefined;
  const cardState = (card: KanbanCard, isOverlay: boolean): KanbanCardRenderState => {
    const done = columns.find((c) => c.id === card.columnId)?.done;
    return {
      isOverlay,
      isOverdue: Boolean(!done && today && card.due && card.due < today),
      isDueToday: Boolean(!done && today && card.due === today),
    };
  };

  // `relative` makes the scroller the containing block, so absolutely positioned
  // children (sr-only labels, badges) are clipped here instead of widening the page.
  const scroller = "relative flex w-full gap-3 overflow-x-auto overscroll-x-contain pb-3 snap-x snap-mandatory scroll-px-1";
  const colStyle = { width: `min(${columnWidth}, 85%)` };

  if (loading) {
    const skeletonColumns = columns.length > 0 ? columns : [{ id: "a", title: "" }, { id: "b", title: "" }, { id: "c", title: "" }];
    return (
      <div role="region" aria-label={labels.board} aria-busy className={cn("w-full", className)}>
        <span role="status" className="sr-only">
          {labels.loading}
        </span>
        <div className={scroller}>
          {skeletonColumns.map((col, i) => (
            <div
              key={col.id}
              aria-hidden
              style={colStyle}
              className="flex shrink-0 snap-start flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-100/70 p-2 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="h-9 px-1.5 py-2.5">
                <div className="h-3.5 w-24 rounded bg-zinc-300/70 motion-safe:animate-pulse dark:bg-zinc-700/70" />
              </div>
              {Array.from({ length: 3 - (i % 2) }, (_, j) => (
                <div
                  key={j}
                  className="h-24 rounded-lg border border-zinc-200 bg-white motion-safe:animate-pulse dark:border-zinc-800 dark:bg-zinc-900"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div role="region" aria-label={labels.board} className={cn("w-full", className)}>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{
          announcements: announcementsProp ?? defaultAnnouncements,
          screenReaderInstructions: { draggable: labels.instructions },
        }}
      >
        <div className={cn(scroller, activeId && "snap-none")}>
          {columns.map((column) => {
            const list = byColumn.get(column.id) ?? [];
            const isTarget = Boolean(activeCard && activeCard.columnId === column.id);
            const movedIn = isTarget && cards.find((c) => c.id === activeId)?.columnId !== column.id;
            return (
              <Column
                key={column.id}
                column={column}
                cards={list}
                style={colStyle}
                isTarget={isTarget}
                movedIn={movedIn}
                isDragging={activeId !== null}
                disabled={disabled}
                allowAdd={allowAdd && !disabled}
                labels={labels}
                reducedMotion={reducedMotion}
                onAdd={addCard}
                renderCardContent={(card) =>
                  renderCard ? (
                    renderCard(card, cardState(card, false))
                  ) : (
                    <CardContent card={card} state={cardState(card, false)} labels={labels} locale={locale} tagTones={tagTones} />
                  )
                }
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
          {activeCard && (
            <div className="cursor-grabbing rounded-lg border border-indigo-300 bg-white shadow-xl shadow-zinc-900/15 ring-2 ring-indigo-500/40 motion-safe:rotate-[1.5deg] motion-safe:scale-[1.02] dark:border-indigo-500/50 dark:bg-zinc-900 dark:shadow-black/50">
              {renderCard ? (
                renderCard(activeCard, cardState(activeCard, true))
              ) : (
                <CardContent
                  card={activeCard}
                  state={cardState(activeCard, true)}
                  labels={labels}
                  locale={locale}
                  tagTones={tagTones}
                />
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ============================================================
 * Column
 * ========================================================== */

interface ColumnProps {
  column: KanbanColumn;
  cards: KanbanCard[];
  style: { width: string };
  /** The card being dragged is currently in this column. */
  isTarget: boolean;
  /** The dragged card came from another column. */
  movedIn: boolean;
  isDragging: boolean;
  disabled: boolean;
  allowAdd: boolean;
  labels: KanbanLabels;
  reducedMotion: boolean;
  onAdd: (columnId: string, title: string) => Promise<void>;
  renderCardContent: (card: KanbanCard) => ReactNode;
}

function Column({
  column,
  cards,
  style,
  isTarget,
  movedIn,
  isDragging,
  disabled,
  allowAdd,
  labels,
  reducedMotion,
  onAdd,
  renderCardContent,
}: ColumnProps) {
  const titleId = useId();
  const { setNodeRef } = useDroppable({
    id: colKey(column.id),
    data: { type: "column", columnId: column.id } satisfies DragData,
    disabled,
  });

  const count = cards.length;
  const limit = column.limit;
  const over = limit !== undefined && count > limit;
  const atLimit = limit !== undefined && count === limit;

  return (
    <section
      aria-labelledby={titleId}
      style={style}
      className={cn(
        "flex shrink-0 snap-start flex-col rounded-xl border bg-zinc-100/70 transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none dark:bg-zinc-900/60",
        over ? "border-rose-300 dark:border-rose-500/50" : "border-zinc-200 dark:border-zinc-800",
        isTarget && (over ? "ring-2 ring-rose-500/50" : "ring-2 ring-indigo-500/50"),
      )}
    >
      <header className="flex min-h-11 items-center gap-2 px-3 pt-2">
        <h3 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {column.title}
        </h3>
        {over && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400">
            <TriangleAlert className="size-3.5" aria-hidden />
            {labels.overLimit(count - limit, limit)}
          </span>
        )}
        {atLimit && !over && <span className="text-xs font-medium text-amber-800 dark:text-amber-300">{labels.atLimit}</span>}
        <span
          className={cn(
            "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums",
            over
              ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200"
              : atLimit
                ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
                : "bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
          )}
        >
          {limit !== undefined ? (
            <>
              {count}
              <span className="text-[0.85em] font-medium opacity-80">/{limit}</span>
              <span className="sr-only"> cards, limit {limit}</span>
            </>
          ) : (
            <>
              {count}
              <span className="sr-only"> cards</span>
            </>
          )}
        </span>
      </header>

      {movedIn && over && limit !== undefined && (
        <p role="status" className="mx-3 mt-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-800 dark:bg-rose-500/15 dark:text-rose-200">
          {labels.wouldExceed(limit)}
        </p>
      )}

      <SortableContext id={colKey(column.id)} items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 p-2">
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              disabled={disabled || Boolean(card.disabled)}
              labels={labels}
              reducedMotion={reducedMotion}
            >
              {renderCardContent(card)}
            </SortableCard>
          ))}
          {cards.length === 0 && (
            <li
              className={cn(
                "flex min-h-20 flex-1 items-center justify-center rounded-lg border border-dashed text-xs transition-colors motion-reduce:transition-none",
                isDragging
                  ? "border-indigo-300 bg-indigo-50/60 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400",
              )}
            >
              {isDragging ? labels.dropHere : labels.empty}
            </li>
          )}
        </ul>
      </SortableContext>

      {allowAdd && <QuickAdd columnId={column.id} columnTitle={column.title} labels={labels} onAdd={onAdd} />}
    </section>
  );
}

/* ============================================================
 * Card
 * ========================================================== */

function SortableCard({
  card,
  disabled,
  labels,
  reducedMotion,
  children,
}: {
  card: KanbanCard;
  disabled: boolean;
  labels: KanbanLabels;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", columnId: card.columnId } satisfies DragData,
    disabled,
    transition: reducedMotion ? null : undefined,
    attributes: { roleDescription: labels.cardRole },
  });

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className="relative">
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "rounded-lg border bg-white text-left outline-none transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-100 dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-900",
          disabled
            ? "cursor-default border-zinc-200 dark:border-zinc-800"
            : "cursor-grab touch-manipulation border-zinc-200 shadow-xs hover:border-zinc-300 hover:shadow-sm active:cursor-grabbing dark:border-zinc-800 dark:hover:border-zinc-700",
          // The drop placeholder: same size as the card, dashed, contents hidden.
          isDragging &&
            "border-dashed border-indigo-400 bg-indigo-50/70 shadow-none dark:border-indigo-500/60 dark:bg-indigo-500/10 [&>*]:invisible",
        )}
      >
        {children}
        {card.disabled && (
          <span className="absolute right-2 top-2 text-zinc-400 dark:text-zinc-500" title={labels.locked}>
            <Lock className="size-3.5" aria-hidden />
            <span className="sr-only">{labels.locked}</span>
          </span>
        )}
      </div>
    </li>
  );
}

function CardContent({
  card,
  state,
  labels,
  locale,
  tagTones,
}: {
  card: KanbanCard;
  state: KanbanCardRenderState;
  labels: KanbanLabels;
  locale: string;
  tagTones?: Record<string, KanbanTagTone>;
}) {
  const hasFooter = card.due || card.assignee;
  return (
    <div className="flex flex-col gap-2 p-3">
      {card.tags && card.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1 pr-4">
          {card.tags.map((tag) => (
            <li
              key={tag}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-medium leading-4",
                TAG_TONES[tagTones?.[tag] ?? AUTO_TONES[hash(tag) % AUTO_TONES.length]],
              )}
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm font-medium leading-5 break-words text-zinc-900 dark:text-zinc-100">{card.title}</p>
      {hasFooter && (
        <div className="flex items-center justify-between gap-2">
          {card.due ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium",
                state.isOverdue
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  : state.isDueToday
                    ? "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                    : "text-zinc-600 dark:text-zinc-400",
              )}
            >
              {state.isOverdue ? (
                <CircleAlert className="size-3.5" aria-hidden />
              ) : (
                <CalendarClock className="size-3.5" aria-hidden />
              )}
              <span className="sr-only">{labels.due} </span>
              {state.isOverdue && `${labels.overdue} · `}
              {state.isDueToday ? labels.dueToday : formatDue(card.due, locale)}
            </span>
          ) : (
            <span />
          )}
          {card.assignee && <Avatar assignee={card.assignee} label={labels.assignedTo} />}
        </div>
      )}
    </div>
  );
}

function Avatar({ assignee, label }: { assignee: KanbanAssignee; label: string }) {
  return (
    <span
      title={assignee.name}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold ring-2 ring-white dark:ring-zinc-900",
        AVATAR_TONES[hash(assignee.name) % AVATAR_TONES.length],
      )}
    >
      {assignee.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-supplied avatar of unknown origin
        <img src={assignee.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(assignee.name)}</span>
      )}
      <span className="sr-only">
        {label} {assignee.name}
      </span>
    </span>
  );
}

/* ============================================================
 * Inline "Add card"
 * ========================================================== */

function QuickAdd({
  columnId,
  columnTitle,
  labels,
  onAdd,
}: {
  columnId: string;
  columnTitle: string;
  labels: KanbanLabels;
  onAdd: (columnId: string, title: string) => Promise<void>;
}) {
  const inputId = useId();
  const errorId = useId();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const closeForm = () => {
    setOpen(false);
    setTitle("");
    setStatus("idle");
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const value = title.trim();
    if (!value || status === "saving") {
      inputRef.current?.focus();
      return;
    }
    setStatus("saving");
    try {
      await onAdd(columnId, value);
      setTitle("");
      setStatus("idle");
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch {
      setStatus("error");
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeForm();
    }
  };

  if (!open) {
    return (
      <div className="px-2 pb-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${labels.addCard} to ${columnTitle}`}
          className="flex h-10 w-full items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-zinc-600 outline-none transition-colors motion-reduce:transition-none hover:bg-zinc-200/70 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
        >
          <Plus className="size-4" aria-hidden />
          {labels.addCard}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 px-2 pb-2">
      <label htmlFor={inputId} className="sr-only">
        {labels.addCardPlaceholder} ({columnTitle})
      </label>
      <textarea
        ref={inputRef}
        id={inputId}
        // Opening the form is an explicit request to type, so focus moves straight in.
        autoFocus
        rows={2}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        onKeyDown={onKeyDown}
        placeholder={labels.addCardPlaceholder}
        aria-invalid={status === "error" || undefined}
        aria-describedby={status === "error" ? errorId : undefined}
        disabled={status === "saving"}
        className={cn(
          "w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus-visible:ring-2 disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500",
          status === "error"
            ? "border-rose-400 focus-visible:ring-rose-500/40 dark:border-rose-500/60"
            : "border-zinc-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 dark:border-zinc-700",
        )}
      />
      {status === "error" && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden />
          {labels.addError}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={status === "saving" || !title.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white outline-none transition-colors motion-reduce:transition-none hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900"
        >
          {status === "saving" && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}
          {labels.add}
        </button>
        <button
          type="button"
          onClick={closeForm}
          className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-zinc-600 outline-none transition-colors motion-reduce:transition-none hover:bg-zinc-200/70 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {labels.cancel}
        </button>
      </div>
    </form>
  );
}
