"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Columns3,
  Filter,
  Inbox,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface ColumnDef<T> {
  /** Unique column id. */
  id: string;
  /** Header text; also used in the column menu. */
  header: string;
  /** Key of the row or a function that returns the raw value (used for search and sorting). */
  accessor: keyof T | ((row: T) => unknown);
  /** Custom cell renderer. Defaults to the raw value as text. */
  cell?: (row: T, value: unknown) => ReactNode;
  /** Header click cycles ascending, descending, none. */
  sortable?: boolean;
  /** Value to sort by when it differs from the accessor value. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "center" | "right";
  /** Include in the global search. Defaults to true. */
  searchable?: boolean;
  /** Can be hidden from the column menu. Defaults to true. */
  hideable?: boolean;
  /** Hidden on first render. */
  defaultHidden?: boolean;
  /** Minimum width in px. */
  minWidth?: number;
  /** Extra classes for this column's body cells. */
  className?: string;
  /** Name used in search filters (plan:pro). Defaults to the id. */
  queryKey?: string;
  /** Value that filters compare with, when it differs from the accessor (e.g. a Date for a formatted date). */
  queryValue?: (row: T) => unknown;
  /**
   * Summary in the footer row for the rows shown (or the selected rows, while there is a selection):
   * "sum", "avg", "min", "max", "count", or a function of the rows.
   */
  summary?: SummaryKind | ((rows: T[]) => ReactNode);
  /** Formats a numeric summary. Defaults to a plain number with up to 2 decimals. */
  summaryFormat?: (value: number) => string;
}

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableFilter<T> {
  /** Accessible label and the "all" option text prefix, e.g. "Status". */
  label: string;
  options: DataTableFilterOption[];
  /** Value compared with the selected option. */
  getValue: (row: T) => string;
  /** Text of the option that shows everything. */
  allLabel?: string;
}

export interface DataTableBulkAction<T> {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Receives the selected rows and a function that clears the selection. */
  onClick: (rows: T[], clearSelection: () => void) => void;
  variant?: "default" | "danger";
}

export interface DataTableLabels {
  search: string;
  searchPlaceholder: string;
  clearSearch: string;
  columns: string;
  selectAllOnPage: string;
  selectRow: (rowLabel: string) => string;
  selectedCount: (n: number) => string;
  selectAllMatching: (n: number) => string;
  clearSelection: string;
  rowsPerPage: string;
  range: (from: number, to: number, total: number) => string;
  page: (page: number, pageCount: number) => string;
  first: string;
  previous: string;
  next: string;
  last: string;
  pagination: string;
  noResults: string;
  clearFilters: string;
  results: (n: number) => string;
  loading: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Chip text for a column filter, e.g. "Plan: pro" or "MRR > 500". */
  filterChip: (header: string, op: QueryOperator, value: string, negate: boolean) => string;
  removeFilter: (chip: string) => string;
  /** Notice for a filter naming no column. */
  unknownField: (field: string, suggestion: string | null) => string;
  applySuggestion: (suggestion: string) => string;
  /** Label of the summary row. */
  summaryLabel: (rows: number, selected: boolean) => string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Stable id for each row, used for selection and keys. */
  getRowId: (row: T) => string;
  /** Accessible name of the table (rendered as its caption). */
  caption: string;
  /** Show the caption visually. It is always available to screen readers. */
  showCaption?: boolean;
  /** Shows the search box, which also takes column filters like plan:pro or spend>500. */
  searchable?: boolean;
  /** Search text (controlled). */
  query?: string;
  /** Initial search text (uncontrolled). */
  defaultQuery?: string;
  /** Called whenever the search text changes, from typing, chips or suggestions. */
  onQueryChange?: (query: string) => void;
  /** One select filter in the toolbar, e.g. status. */
  filter?: DataTableFilter<T>;
  pageSize?: number;
  /** Choices in the rows-per-page select. Empty hides it. */
  pageSizeOptions?: number[];
  /** Adds a checkbox column with select-all. */
  selectable?: boolean;
  /** Called with the selected ids and rows after every change. */
  onSelectionChange?: (ids: string[], rows: T[]) => void;
  /** Buttons in the bar that appears while rows are selected. */
  bulkActions?: DataTableBulkAction<T>[];
  /** Name of a row for its checkbox label ("Select Jane Cooper"). Defaults to the first column's value. */
  getRowLabel?: (row: T) => string;
  /** Shows skeleton rows. */
  loading?: boolean;
  /** Shown when data is empty. Defaults to an icon with emptyTitle and emptyDescription. */
  emptyState?: ReactNode;
  /** Keep the first visible column pinned while scrolling sideways. */
  stickyFirstColumn?: boolean;
  /** Height of the scroll area in px; the header sticks inside it. */
  maxHeight?: number;
  /** Shows the column visibility menu. */
  columnMenu?: boolean;
  labels?: Partial<DataTableLabels>;
  className?: string;
}

const DEFAULT_LABELS: DataTableLabels = {
  search: "Search",
  searchPlaceholder: "Search or filter, e.g. plan:pro",
  clearSearch: "Clear search",
  columns: "Columns",
  selectAllOnPage: "Select all rows on this page",
  selectRow: (name) => `Select ${name}`,
  selectedCount: (n) => `${n} selected`,
  selectAllMatching: (n) => `Select all ${n}`,
  clearSelection: "Clear",
  rowsPerPage: "Rows per page",
  range: (from, to, total) => (total === 0 ? "0 results" : `${from}–${to} of ${total}`),
  page: (p, n) => `Page ${p} of ${n}`,
  first: "First page",
  previous: "Previous page",
  next: "Next page",
  last: "Last page",
  pagination: "Pagination",
  noResults: "No rows match your search or filter.",
  clearFilters: "Clear filters",
  results: (n) => `${n} ${n === 1 ? "result" : "results"}`,
  loading: "Loading rows…",
  emptyTitle: "No data yet",
  emptyDescription: "Rows will appear here once there is something to show.",
  filterChip: (h, op, v, neg) => `${neg ? "not " : ""}${h}${op === ":" ? ":" : ` ${op}`} ${v}`,
  removeFilter: (chip) => `Remove filter ${chip}`,
  unknownField: (f, s) => `No column called “${f}”.${s ? ` Did you mean “${s}”?` : ""}`,
  applySuggestion: (s) => `Use ${s}`,
  summaryLabel: (n, sel) => (sel ? `Selected (${n})` : `Total (${n} ${n === 1 ? "row" : "rows"})`),
};

const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const CHECK_COL = 52;
const SKELETON_WIDTHS = ["w-32", "w-44", "w-16", "w-20", "w-24", "w-14", "w-28"];

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function rawValue<T>(row: T, col: ColumnDef<T>): unknown {
  return typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor];
}

function toText(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function compare(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return collator.compare(toText(a), toText(b));
}

/* ---------- Query language (pure) ---------- */

export type QueryOperator = ":" | ">" | "<" | ">=" | "<=";

/** One piece of a search: a plain word or phrase, or a column filter like plan:pro or mrr>500. */
export type QueryTerm =
  | { kind: "text"; value: string; negate: boolean; raw: string }
  | { kind: "field"; field: string; op: QueryOperator; value: string; negate: boolean; raw: string };

const TOKEN = /(-?)(?:([A-Za-z_][\w-]*)(>=|<=|:|>|<))?("([^"]*)"?|[^\s"]+)/g;

/**
 * Parses a search like `plan:pro mrr>500 -status:churned "jane cooper"`. Words and quoted phrases
 * are text terms; `column:value` matches text in that column, `column>n` / `<` / `>=` / `<=`
 * compare numbers or dates, and a leading `-` negates any term.
 */
export function parseTableQuery(query: string): QueryTerm[] {
  const terms: QueryTerm[] = [];
  for (const m of query.matchAll(TOKEN)) {
    const [raw, neg, field, op, token, quoted] = m;
    const value = quoted ?? token;
    if (!value) continue;
    const negate = neg === "-";
    if (field && op) terms.push({ kind: "field", field: field.toLowerCase(), op: op as QueryOperator, value, negate, raw });
    else terms.push({ kind: "text", value: value.toLowerCase(), negate, raw });
  }
  return terms;
}

/** Number from "$1,250", "1.5k", "12%"; null when it isn't one. */
function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const m = v.trim().replace(/[,\s$€£৳%]/g, "").match(/^(-?\d*\.?\d+)([kmb])?$/i);
  if (!m) return null;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[(m[2] ?? "").toLowerCase() as "k" | "m" | "b"] ?? 1;
  return Number(m[1]) * mult;
}

/** Time from a Date, or from "2025", "2025-03" and "2025-03-14" style text; null otherwise. */
function toTime(v: unknown): number | null {
  if (v instanceof Date) return v.getTime();
  if (typeof v !== "string" || !/^\d{4}(-\d{2}(-\d{2})?)?/.test(v.trim())) return null;
  const t = Date.parse(v.trim().length === 4 ? `${v.trim()}-01-01` : v.trim());
  return Number.isNaN(t) ? null : t;
}

function compareTerm(raw: unknown, op: QueryOperator, value: string): boolean {
  if (op === ":") return toText(raw).toLowerCase().includes(value.toLowerCase());
  const n = toNumber(value);
  const rn = toNumber(raw);
  let a: number | null = null;
  let b: number | null = null;
  if (n !== null && rn !== null && !(raw instanceof Date)) [a, b] = [rn, n];
  else {
    const tv = toTime(value);
    const tr = toTime(raw);
    if (tv !== null && tr !== null) [a, b] = [tr, tv];
  }
  if (a === null || b === null) return false;
  return op === ">" ? a > b : op === "<" ? a < b : op === ">=" ? a >= b : a <= b;
}

/** The name a column answers to in queries: queryKey, else its id, lowercased. */
export function columnKey<T>(c: ColumnDef<T>) {
  return (c.queryKey ?? c.id).toLowerCase();
}

function findColumn<T>(columns: ColumnDef<T>[], field: string) {
  return columns.find((c) => columnKey(c) === field || c.header.toLowerCase().replace(/\s+/g, "") === field);
}

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Field terms that name no column, each with the closest column key (or null). */
export function unknownFields<T>(terms: QueryTerm[], columns: ColumnDef<T>[]): { term: QueryTerm & { kind: "field" }; suggestion: string | null }[] {
  return terms
    .filter((t): t is QueryTerm & { kind: "field" } => t.kind === "field" && !findColumn(columns, t.field))
    .map((term) => {
      const best = columns
        .map((c) => ({ key: columnKey(c), d: distance(term.field, columnKey(c)) }))
        .sort((a, b) => a.d - b.d)[0];
      return { term, suggestion: best && best.d <= 2 ? best.key : null };
    });
}

/**
 * True when a row passes every term. Text terms must appear in some searchable column; field
 * terms test their column. Terms naming unknown columns are ignored (and reported separately).
 */
export function matchesQuery<T>(row: T, terms: QueryTerm[], columns: ColumnDef<T>[]): boolean {
  const searchCols = columns.filter((c) => c.searchable !== false);
  return terms.every((t) => {
    let hit: boolean;
    if (t.kind === "text") hit = searchCols.some((c) => toText(rawValue(row, c)).toLowerCase().includes(t.value));
    else {
      const col = findColumn(columns, t.field);
      if (!col) return true;
      const raw = col.queryValue ? col.queryValue(row) : rawValue(row, col);
      hit = compareTerm(raw, t.op, t.value);
    }
    return t.negate ? !hit : hit;
  });
}

/* ---------- Summaries (pure) ---------- */

export type SummaryKind = "sum" | "avg" | "min" | "max" | "count";

/** Aggregates numbers; null for an empty list (except count). */
export function summarize(values: number[], kind: SummaryKind): number | null {
  if (kind === "count") return values.length;
  if (!values.length) return null;
  if (kind === "sum") return values.reduce((a, b) => a + b, 0);
  if (kind === "avg") return values.reduce((a, b) => a + b, 0) / values.length;
  return kind === "min" ? Math.min(...values) : Math.max(...values);
}

const alignClass = { left: "text-left", center: "text-center", right: "text-right" } as const;
const justifyClass = { left: "justify-start", center: "justify-center", right: "justify-end" } as const;

const controlClass =
  "h-10 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 outline-none transition-[border-color,box-shadow] hover:border-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/20 motion-reduce:transition-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus-visible:border-indigo-400";

const iconButtonClass =
  "inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-200 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700";

/** Checkbox with a 40px hit area that supports the indeterminate state. */
function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="-m-2 inline-flex size-10 cursor-pointer items-center justify-center rounded-md has-[:disabled]:cursor-not-allowed">
      <input
        type="checkbox"
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 cursor-[inherit] rounded accent-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 dark:accent-indigo-400 dark:focus-visible:ring-offset-zinc-900"
      />
    </label>
  );
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  caption,
  showCaption = false,
  searchable = true,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  filter,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  selectable = false,
  onSelectionChange,
  bulkActions = [],
  getRowLabel,
  loading = false,
  emptyState,
  stickyFirstColumn = true,
  maxHeight = 520,
  columnMenu = true,
  labels: labelsProp,
  className,
}: DataTableProps<T>) {
  const L = { ...DEFAULT_LABELS, ...labelsProp };
  const uid = useId();

  const [innerQuery, setInnerQuery] = useState(defaultQuery);
  const query = queryProp ?? innerQuery;
  const setQuery = (next: string) => {
    if (queryProp === undefined) setInnerQuery(next);
    onQueryChange?.(next);
  };
  const deferredQuery = useDeferredValue(query);
  const [filterValue, setFilterValue] = useState("");
  const [sort, setSort] = useState<{ id: string; dir: SortDirection } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.id)));
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolledX, setScrolledX] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const visibleColumns = columns.filter((c) => !hidden.has(c.id));

  /* ---------- Pipeline: filter → search → sort → paginate ---------- */

  // The search box takes words and column filters: plan:pro mrr>500 -status:churned.
  const terms = useMemo(() => parseTableQuery(deferredQuery), [deferredQuery]);
  const unknown = useMemo(() => unknownFields(terms, columns), [terms, columns]);
  const filtered = useMemo(
    () =>
      data.filter((row) => {
        if (filter && filterValue && filter.getValue(row) !== filterValue) return false;
        return matchesQuery(row, terms, columns);
      }),
    [data, columns, terms, filter, filterValue],
  );

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.id);
    if (!col) return filtered;
    const get = (r: T) => (col.sortValue ? col.sortValue(r) : rawValue(r, col));
    const factor = sort.dir === "asc" ? 1 : -1;
    // Stable sort keeps the original order for ties.
    return filtered
      .map((row, i) => ({ row, i }))
      .sort((a, b) => compare(get(a.row), get(b.row)) * factor || a.i - b.i)
      .map((x) => x.row);
  }, [filtered, sort, columns]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  /* ---------- Selection ---------- */

  const allIds = useMemo(() => new Set(data.map(getRowId)), [data, getRowId]);
  // Ignore ids whose rows are gone (e.g. deleted by a bulk action).
  const selectedIds = [...selected].filter((id) => allIds.has(id));
  const selectedSet = new Set(selectedIds);
  const pageIds = pageRows.map(getRowId);
  const pageSelected = pageIds.filter((id) => selectedSet.has(id)).length;
  const allPageSelected = pageIds.length > 0 && pageSelected === pageIds.length;
  const somePageSelected = pageSelected > 0 && !allPageSelected;
  const allMatchingSelected = total > 0 && sorted.every((r) => selectedSet.has(getRowId(r)));

  const commitSelection = (next: Set<string>) => {
    setSelected(next);
    if (onSelectionChange) {
      const ids = data.map(getRowId).filter((id) => next.has(id));
      onSelectionChange(
        ids,
        data.filter((r) => next.has(getRowId(r))),
      );
    }
  };
  const clearSelection = () => commitSelection(new Set());
  const toggleRow = (id: string, on: boolean) => {
    const next = new Set(selectedSet);
    if (on) next.add(id);
    else next.delete(id);
    commitSelection(next);
  };
  const togglePage = () => {
    const next = new Set(selectedSet);
    if (allPageSelected) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    commitSelection(next);
  };
  const selectAllMatching = () => {
    const next = new Set(selectedSet);
    sorted.forEach((r) => next.add(getRowId(r)));
    commitSelection(next);
  };
  const selectedRows = data.filter((r) => selectedSet.has(getRowId(r)));

  /* ---------- Column menu ---------- */

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || menuButtonRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const toggleColumn = (id: string) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHidden(next);
  };

  /* ---------- Sorting ---------- */

  const cycleSort = (id: string) => {
    setSort((s) => (!s || s.id !== id ? { id, dir: "asc" } : s.dir === "asc" ? { id, dir: "desc" } : null));
    setPage(1);
  };

  /* ---------- Rendering helpers ---------- */

  const rowLabel = (row: T) => {
    if (getRowLabel) return getRowLabel(row);
    const first = columns[0];
    return first ? toText(rawValue(row, first)) : getRowId(row);
  };

  const filtersActive = Boolean(deferredQuery.trim() || filterValue);
  const resetFilters = () => {
    setQuery("");
    setFilterValue("");
    setPage(1);
  };

  const colCount = visibleColumns.length + (selectable ? 1 : 0);
  const firstColId = stickyFirstColumn ? visibleColumns[0]?.id : undefined;
  const stickyLeft = selectable ? CHECK_COL : 0;
  const pinShadow = scrolledX && "shadow-[6px_0_8px_-6px_rgb(0_0_0/0.25)] dark:shadow-[6px_0_8px_-6px_rgb(0_0_0/0.7)]";

  const showBulkBar = selectable && selectedIds.length > 0 && !loading;
  const searchId = `${uid}-search`;
  const filterId = `${uid}-filter`;
  const pageSizeId = `${uid}-pagesize`;
  const menuId = `${uid}-columns`;

  const chips = terms
    .filter((t): t is QueryTerm & { kind: "field" } => t.kind === "field")
    .map((term) => {
      const col = findColumn(columns, term.field);
      return col ? { term, text: L.filterChip(col.header, term.op, term.value, term.negate) } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
  const rebuild = (next: string) => {
    setQuery(next.replace(/\s+/g, " ").trim());
    setPage(1);
  };
  const removeTerm = (raw: string) => {
    rebuild(query.replace(raw, ""));
    document.getElementById(searchId)?.focus();
  };
  const replaceField = (raw: string, field: string, key: string) => rebuild(query.replace(raw, raw.replace(field, key)));

  // Footer summaries: for the selection while there is one, else for every row that matches.
  const summaryRows = selectedIds.length > 0 ? selectedRows : sorted;
  const hasSummary = columns.some((c) => c.summary);
  const summaryCell = (c: ColumnDef<T>): ReactNode => {
    if (!c.summary) return null;
    if (typeof c.summary === "function") return c.summary(summaryRows);
    const kind = c.summary;
    const nums = summaryRows
      .map((r) => (c.sortValue ? c.sortValue(r) : rawValue(r, c)))
      .map((v) => (typeof v === "number" ? v : toNumber(v)))
      .filter((v): v is number => v !== null);
    const value = summarize(nums, kind);
    if (value === null) return "–";
    const shown = kind === "count" ? String(value) : (c.summaryFormat ?? NUMBER_FORMAT.format)(value);
    return kind === "sum" || kind === "count" ? shown : `${kind} ${shown}`;
  };

  // Opaque row backgrounds so sticky cells (which inherit them) hide what scrolls beneath.
  const rowBg = (isSelected: boolean) =>
    isSelected
      ? "bg-indigo-50 hover:bg-indigo-100/70 dark:bg-[color-mix(in_oklab,var(--color-indigo-500)_14%,var(--color-zinc-900))] dark:hover:bg-[color-mix(in_oklab,var(--color-indigo-500)_20%,var(--color-zinc-900))]"
      : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800";

  return (
    <div className={cn("@container flex w-full min-w-0 flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300", className)}>
      {/* Toolbar */}
      {(searchable || filter || columnMenu) && (
        <div className="flex flex-col gap-2 @2xl:flex-row @2xl:items-center">
          {searchable && (
            <div className="relative min-w-0 flex-1 @2xl:max-w-xs">
              <label htmlFor={searchId} className="sr-only">
                {L.search}
              </label>
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
              <input
                id={searchId}
                type="search"
                value={query}
                autoComplete="off"
                placeholder={L.searchPlaceholder}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className={cn(controlClass, "w-full pl-9 pr-10 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 [&::-webkit-search-cancel-button]:hidden")}
              />
              {query && (
                <button
                  type="button"
                  aria-label={L.clearSearch}
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                    document.getElementById(searchId)?.focus();
                  }}
                  className="absolute right-0 top-0 inline-flex size-10 items-center justify-center rounded-lg text-zinc-500 outline-none hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 @2xl:ml-auto">
            {filter && (
              <>
                <label htmlFor={filterId} className="sr-only">
                  {filter.label}
                </label>
                <select
                  id={filterId}
                  value={filterValue}
                  onChange={(e) => {
                    setFilterValue(e.target.value);
                    setPage(1);
                  }}
                  className={cn(controlClass, "min-w-0 flex-1 px-3 @2xl:flex-none")}
                >
                  <option value="">{filter.allLabel ?? `${filter.label}: All`}</option>
                  {filter.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {filter.label}: {o.label}
                    </option>
                  ))}
                </select>
              </>
            )}
            {columnMenu && (
              <div className="relative">
                <button
                  ref={menuButtonRef}
                  type="button"
                  aria-expanded={menuOpen}
                  aria-controls={menuId}
                  onClick={() => setMenuOpen((o) => !o)}
                  className={cn(
                    controlClass,
                    "inline-flex items-center gap-2 px-3 font-medium text-zinc-700 dark:text-zinc-200",
                    menuOpen && "border-indigo-500 dark:border-indigo-400",
                  )}
                >
                  <Columns3 aria-hidden className="size-4" />
                  {L.columns}
                  {hidden.size > 0 && (
                    <span className="rounded-full bg-zinc-100 px-1.5 text-xs tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {columns.length - hidden.size}/{columns.length}
                    </span>
                  )}
                </button>
                {menuOpen && (
                  <div
                    ref={menuRef}
                    id={menuId}
                    className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
                  >
                    <fieldset>
                      <legend className="px-2.5 pb-1 pt-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {L.columns}
                      </legend>
                      {columns.map((c) => {
                        const isVisible = !hidden.has(c.id);
                        const locked = c.hideable === false || (isVisible && visibleColumns.length === 1);
                        return (
                          <label
                            key={c.id}
                            className={cn(
                              "flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm",
                              locked ? "cursor-not-allowed text-zinc-500 dark:text-zinc-400" : "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isVisible}
                              disabled={locked}
                              onChange={() => toggleColumn(c.id)}
                              className="size-4 cursor-[inherit] accent-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:accent-indigo-400 dark:focus-visible:ring-offset-zinc-900"
                            />
                            {c.header}
                          </label>
                        );
                      })}
                    </fieldset>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Column filters from the search box, each removable. */}
      {chips.length > 0 && (
        <ul aria-label={L.search} className="-mt-1 flex flex-wrap gap-1.5">
          {chips.map(({ term, text }) => (
            <li key={term.raw}>
              <button
                type="button"
                onClick={() => removeTerm(term.raw)}
                aria-label={L.removeFilter(text)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-indigo-800 outline-none hover:border-indigo-300 hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
              >
                <Filter aria-hidden className="size-3" />
                {text}
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {unknown.length > 0 && (
        <div className="-mt-1 flex flex-col gap-1">
          {unknown.map(({ term, suggestion }) => (
            <p key={term.raw} className="flex flex-wrap items-center gap-x-2 text-[13px] text-amber-800 dark:text-amber-300">
              {L.unknownField(term.field, suggestion)}
              {suggestion && (
                <button
                  type="button"
                  onClick={() => replaceField(term.raw, term.field, suggestion)}
                  className="inline-flex min-h-8 items-center rounded-md px-1.5 font-medium text-indigo-700 underline underline-offset-2 outline-none hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-100"
                >
                  {L.applySuggestion(suggestion)}
                </button>
              )}
            </p>
          ))}
        </div>
      )}

      {/* Bulk action bar (the live region stays mounted so changes are announced). */}
      <div aria-live="polite">
        {showBulkBar && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 dark:border-indigo-500/30 dark:bg-indigo-500/10">
            <span className="font-semibold tabular-nums text-indigo-900 dark:text-indigo-100">{L.selectedCount(selectedIds.length)}</span>
            {allPageSelected && !allMatchingSelected && total > pageIds.length && (
              <button
                type="button"
                onClick={selectAllMatching}
                className="inline-flex min-h-10 items-center rounded-md px-2 font-medium text-indigo-700 underline underline-offset-2 outline-none hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-100"
              >
                {L.selectAllMatching(total)}
              </button>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {bulkActions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => a.onClick(selectedRows, clearSelection)}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none [&_svg]:size-4",
                    a.variant === "danger"
                      ? "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500"
                      : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
                  )}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-indigo-800 outline-none hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-indigo-200/70 dark:text-indigo-200 dark:hover:bg-indigo-500/15"
              >
                {L.clearSelection}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status for screen readers: loading and result counts. */}
      <p role="status" className="sr-only">
        {loading ? L.loading : filtersActive ? L.results(total) : ""}
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div
          role="region"
          aria-label={caption}
          tabIndex={0}
          onScroll={(e) => {
            const x = e.currentTarget.scrollLeft > 2;
            if (x !== scrolledX) setScrolledX(x);
          }}
          className="relative overflow-auto overscroll-x-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          style={{ maxHeight }}
        >
          <table aria-busy={loading || undefined} className="w-full border-separate border-spacing-0 text-left">
            <caption className={cn(showCaption ? "px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100" : "sr-only")}>
              {caption}
            </caption>
            <thead>
              <tr>
                {selectable && (
                  <th
                    scope="col"
                    className="sticky left-0 top-0 z-30 border-b border-zinc-200 bg-zinc-50 px-4 dark:border-zinc-800 dark:bg-zinc-950"
                    style={{ width: CHECK_COL, minWidth: CHECK_COL }}
                  >
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={somePageSelected}
                      onChange={togglePage}
                      label={L.selectAllOnPage}
                      disabled={loading || pageIds.length === 0}
                    />
                  </th>
                )}
                {visibleColumns.map((c) => {
                  const dir = sort?.id === c.id ? sort.dir : null;
                  const align = c.align ?? "left";
                  const pinned = c.id === firstColId;
                  return (
                    <th
                      key={c.id}
                      scope="col"
                      aria-sort={c.sortable ? (dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none") : undefined}
                      className={cn(
                        "sticky top-0 z-20 whitespace-nowrap border-b border-zinc-200 bg-zinc-50 px-4 py-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400",
                        alignClass[align],
                        pinned && "z-30",
                        pinned && pinShadow,
                      )}
                      style={{ minWidth: c.minWidth, left: pinned ? stickyLeft : undefined }}
                    >
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => cycleSort(c.id)}
                          disabled={loading}
                          className={cn(
                            "group -mx-2 inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 uppercase outline-none transition-colors hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 active:text-indigo-700 disabled:pointer-events-none motion-reduce:transition-none dark:hover:text-zinc-100",
                            justifyClass[align],
                            dir && "text-zinc-900 dark:text-zinc-100",
                          )}
                        >
                          {c.header}
                          <span aria-hidden className={cn("inline-flex size-4 items-center justify-center rounded", dir && "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300")}>
                            {dir === "asc" ? (
                              <ArrowUp className="size-3" strokeWidth={2.5} />
                            ) : dir === "desc" ? (
                              <ArrowDown className="size-3" strokeWidth={2.5} />
                            ) : (
                              <ChevronsUpDown className="size-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
                            )}
                          </span>
                        </button>
                      ) : (
                        <span className="inline-flex min-h-10 items-center">{c.header}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: Math.min(pageSize, 8) }, (_, r) => (
                  <tr key={`sk-${r}`} aria-hidden className="bg-white dark:bg-zinc-900">
                    {selectable && (
                      <td className="sticky left-0 z-10 border-b border-zinc-100 bg-inherit px-4 py-3 dark:border-zinc-800/80" style={{ width: CHECK_COL }}>
                        <span className="block size-4 rounded bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800" />
                      </td>
                    )}
                    {visibleColumns.map((c, ci) => (
                      <td
                        key={c.id}
                        className={cn(
                          "border-b border-zinc-100 bg-inherit px-4 py-3.5 dark:border-zinc-800/80",
                          c.id === firstColId && "sticky z-10",
                        )}
                        style={{ left: c.id === firstColId ? stickyLeft : undefined, minWidth: c.minWidth }}
                      >
                        <span
                          className={cn(
                            "block h-3 rounded bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800",
                            SKELETON_WIDTHS[(ci + r) % SKELETON_WIDTHS.length],
                            c.align === "right" && "ml-auto",
                            c.align === "center" && "mx-auto",
                          )}
                          style={{ animationDelay: `${r * 60}ms` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-14">
                    {data.length === 0 ? (
                      (emptyState ?? (
                        <div className="mx-auto flex max-w-xs flex-col items-center text-center">
                          <span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            <Inbox aria-hidden className="size-5" />
                          </span>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{L.emptyTitle}</p>
                          <p className="mt-1 text-zinc-500 dark:text-zinc-400">{L.emptyDescription}</p>
                        </div>
                      ))
                    ) : (
                      <div className="mx-auto flex max-w-xs flex-col items-center text-center">
                        <span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          <SearchX aria-hidden className="size-5" />
                        </span>
                        <p className="text-zinc-600 dark:text-zinc-400">{L.noResults}</p>
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-3 inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                        >
                          {L.clearFilters}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const id = getRowId(row);
                  const isSelected = selectedSet.has(id);
                  return (
                    <tr key={id} className={cn("transition-colors motion-reduce:transition-none", rowBg(isSelected))}>
                      {selectable && (
                        <td className="sticky left-0 z-10 border-b border-zinc-100 bg-inherit px-4 py-1 dark:border-zinc-800/80" style={{ width: CHECK_COL }}>
                          <Checkbox checked={isSelected} onChange={(on) => toggleRow(id, on)} label={L.selectRow(rowLabel(row))} />
                        </td>
                      )}
                      {visibleColumns.map((c) => {
                        const value = rawValue(row, c);
                        const pinned = c.id === firstColId;
                        return (
                          <td
                            key={c.id}
                            className={cn(
                              "whitespace-nowrap border-b border-zinc-100 bg-inherit px-4 py-2.5 dark:border-zinc-800/80",
                              alignClass[c.align ?? "left"],
                              c.align === "right" && "tabular-nums",
                              pinned && "sticky z-10",
                              pinned && pinShadow,
                              c.className,
                            )}
                            style={{ left: pinned ? stickyLeft : undefined, minWidth: c.minWidth }}
                          >
                            {c.cell ? c.cell(row, value) : toText(value)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
            {hasSummary && !loading && sorted.length > 0 && (
              <tfoot>
                <tr className="bg-zinc-50 dark:bg-zinc-950">
                  {selectable && (
                    <td className="sticky bottom-0 left-0 z-20 border-t border-zinc-200 bg-inherit px-4 dark:border-zinc-800" style={{ width: CHECK_COL }} />
                  )}
                  {visibleColumns.map((c, i) => {
                    const pinned = c.id === firstColId;
                    return (
                      <td
                        key={c.id}
                        className={cn(
                          "sticky bottom-0 z-10 whitespace-nowrap border-t border-zinc-200 bg-inherit px-4 py-2.5 font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100",
                          alignClass[c.align ?? "left"],
                          c.align === "right" && "tabular-nums",
                          pinned && "z-20",
                          pinned && pinShadow,
                        )}
                        style={{ left: pinned ? stickyLeft : undefined, minWidth: c.minWidth }}
                      >
                        {i === 0 && !c.summary ? (
                          <span className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                            {L.summaryLabel(summaryRows.length, selectedIds.length > 0)}
                          </span>
                        ) : (
                          summaryCell(c)
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-2 border-t border-zinc-200 px-3 py-2 @xl:flex-row @xl:items-center @xl:justify-between dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3 @xl:justify-start">
            <p className="tabular-nums text-zinc-600 dark:text-zinc-400">
              {loading ? L.loading : L.range(total === 0 ? 0 : start + 1, start + pageRows.length, total)}
            </p>
            {pageSizeOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor={pageSizeId} className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {L.rowsPerPage}
                </label>
                <select
                  id={pageSizeId}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className={cn(controlClass, "px-2")}
                >
                  {[...new Set([...pageSizeOptions, initialPageSize])]
                    .sort((a, b) => a - b)
                    .map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
          <nav aria-label={L.pagination} className="flex items-center justify-between gap-1 @xl:justify-end">
            <div className="flex items-center gap-1">
              <button type="button" aria-label={L.first} disabled={loading || currentPage === 1} onClick={() => setPage(1)} className={iconButtonClass}>
                <ChevronsLeft aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-label={L.previous}
                disabled={loading || currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className={iconButtonClass}
              >
                <ChevronLeft aria-hidden className="size-4" />
              </button>
            </div>
            <span className="px-2 tabular-nums text-zinc-700 dark:text-zinc-300">{L.page(currentPage, pageCount)}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={L.next}
                disabled={loading || currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
                className={iconButtonClass}
              >
                <ChevronRight aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-label={L.last}
                disabled={loading || currentPage === pageCount}
                onClick={() => setPage(pageCount)}
                className={iconButtonClass}
              >
                <ChevronsRight aria-hidden className="size-4" />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
