import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { SprintBoardDemo, StatesDemo } from "./demos";

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "Drag cards between columns with the mouse, touch or keyboard, with WIP limits, inline quick add and overdue warnings.",
};

const sprintCode = `
const columns: KanbanColumn[] = [
  { id: "todo", title: "To do" },
  { id: "doing", title: "In progress", limit: 3 },
  { id: "review", title: "Review" },
  { id: "done", title: "Done", done: true },   // never flags overdue
];

const [cards, setCards] = useState<KanbanCard[]>([
  {
    id: "c4",
    columnId: "doing",
    title: "Kanban board keyboard dragging",
    tags: ["Feature", "A11y"],
    assignee: { name: "Leo Martins" },
    due: "2026-10-15",
  },
  // …9 more
]);

<KanbanBoard
  columns={columns}
  cards={cards}
  onChange={setCards}       // full new array after every drop or added card
  today="2026-10-15"        // optional; defaults to the viewer's date after hydration
  labels={{ board: "Sprint 11 board" }}
/>`;

const statesCode = `
<KanbanBoard columns={columns} cards={[]} loading />          // skeleton columns, aria-busy
<KanbanBoard columns={columns} cards={[]} onChange={setCards} />  // empty columns are drop zones
<KanbanBoard columns={columns} cards={cards} disabled />          // read-only

// Async quick add: resolve a card and the board inserts it, reject to show the error.
<KanbanBoard
  columns={columns}
  cards={cards}
  onChange={setCards}
  onAddCard={async (columnId, title) => {
    const res = await fetch("/api/cards", { method: "POST", body: JSON.stringify({ columnId, title }) });
    if (!res.ok) throw new Error("Save failed");
    return res.json();
  }}
/>`;

const usage = `
import { useState } from "react";
import { KanbanBoard, type KanbanCard } from "@/components/ui/kanban-board";

export function Board() {
  const [cards, setCards] = useState<KanbanCard[]>([
    { id: "1", columnId: "todo", title: "Ship it" },
  ]);
  return (
    <KanbanBoard
      columns={[
        { id: "todo", title: "To do" },
        { id: "done", title: "Done", done: true },
      ]}
      cards={cards}
      onChange={setCards}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="kanban-board"
      examples={[
        {
          title: "Sprint board",
          description:
            "To do / In progress (limit 3) / Review / Done with 10 cards. In progress starts at its limit, overdue dates are red, and the tree view card is locked. On narrow screens the columns scroll and snap.",
          preview: <SprintBoardDemo />,
          code: sprintCode,
          minHeight: 560,
        },
        {
          title: "States",
          description: "Loading skeleton, an empty board, a read-only board and a quick add that fails on the first try.",
          preview: <StatesDemo />,
          code: statesCode,
          minHeight: 420,
        },
      ]}
      usage={usage}
      props={[
        { name: "columns", type: "KanbanColumn[]", description: "Columns in display order." },
        { name: "cards", type: "KanbanCard[]", description: "Cards (controlled). Order within a column follows the array order." },
        { name: "defaultCards", type: "KanbanCard[]", default: "[]", description: "Initial cards when uncontrolled." },
        { name: "onChange", type: "(cards: KanbanCard[]) => void", description: "Called with the whole new card array after a drop or an added card. Not called if a drag ends where it started." },
        { name: "onAddCard", type: "(columnId, title) => KanbanCard | void | Promise<KanbanCard | void>", description: "Called by the inline Add card form. Return a card to have the board insert it, or nothing to handle it yourself. A rejection shows the error state. Without it the board creates the card." },
        { name: "renderCard", type: "(card, state: KanbanCardRenderState) => ReactNode", description: "Replaces the inside of a card. Dragging, focus and the placeholder still work." },
        { name: "allowAdd", type: "boolean", default: "true", description: "Shows the inline Add card form in every column." },
        { name: "today", type: "string (YYYY-MM-DD)", default: "viewer's date", description: "Used for overdue and due-today badges. The default is read after hydration to keep server and client markup equal." },
        { name: "locale", type: "string", default: '"en-US"', description: "Locale of due dates." },
        { name: "tagTones", type: "Record<string, KanbanTagTone>", description: "Force a color for specific tags. Others get a stable color from their name." },
        { name: "blockOverLimit", type: "boolean", default: "false", description: "Refuse drops into a column that is already at its limit, instead of only warning." },
        { name: "disabled", type: "boolean", default: "false", description: "Read-only board: no dragging, no adding." },
        { name: "loading", type: "boolean", default: "false", description: "Skeleton columns with aria-busy." },
        { name: "labels", type: "Partial<KanbanLabels>", description: "Every visible and announced string, e.g. board, addCard, empty, overLimit, overdue, instructions." },
        { name: "announcements", type: "Announcements", description: "Replace dnd-kit's screen reader announcements entirely." },
        { name: "columnWidth", type: "string", default: '"16.5rem"', description: "Column width on wide screens. Columns shrink to 85% of the board on narrow ones." },
        { name: "className", type: "string", description: "Classes for the board region." },
      ]}
      types={[
        {
          name: "KanbanColumn",
          props: [
            { name: "id", type: "string", description: "Unique column id." },
            { name: "title", type: "string", description: "Column heading." },
            { name: "limit", type: "number", description: "WIP limit. The count turns amber at the limit and red above it." },
            { name: "done", type: "boolean", default: "false", description: "Finished column: due dates here are never flagged." },
          ],
        },
        {
          name: "KanbanCard",
          props: [
            { name: "id", type: "string", description: "Unique card id." },
            { name: "columnId", type: "string", description: "Column the card is in." },
            { name: "title", type: "string", description: "Card title." },
            { name: "tags", type: "string[]", description: "Small colored labels." },
            { name: "assignee", type: "{ name: string; avatarUrl?: string }", description: "Shown as an avatar with initials when there is no image." },
            { name: "due", type: "string (YYYY-MM-DD)", description: "Due date. Past dates are red with an icon and “Overdue” text; today is amber." },
            { name: "disabled", type: "boolean", default: "false", description: "Locked card that can't be dragged." },
          ],
        },
      ]}
      accessibility={[
        "Keyboard dragging comes from dnd-kit: focus a card, press Space or Enter to pick it up, use the arrow keys to move it within a column or to the next one, then Space or Enter to drop or Escape to cancel.",
        "Each card announces its role as “draggable card” and has instructions read on focus. Pick up, move, drop and cancel are announced with the card title, column name and position, e.g. “Dropped “Gauge chart” in Review, position 2 of 3.”",
        "Columns are sections labelled by their heading. Counts read as “3 cards, limit 3”; a broken limit is written out (“1 over limit”) and not shown by color alone. Overdue dates carry an icon and the word Overdue.",
        "The inline Add card form focuses its field, submits on Enter, closes on Escape and returns focus to the Add card button. Errors use role=\"alert\" and aria-invalid.",
        "Touch dragging starts after a short press, so swiping still scrolls the board horizontally. Buttons are at least 40px tall.",
        "With prefers-reduced-motion the card shuffle and drop animations are turned off and the lifted card is not tilted.",
      ]}
    />
  );
}
