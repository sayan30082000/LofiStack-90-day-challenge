import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { InvoicesDemo, UsersDemo } from "./demos";

export const metadata: Metadata = {
  title: "Data Table",
  description:
    "Typed data table with three-state sorting, global search, a status filter, row selection with a bulk action bar, pagination, column visibility, a sticky header and a pinned first column.",
};

const usersCode = `
const columns: ColumnDef<User>[] = [
  { id: "name", header: "Name", accessor: "name", sortable: true, hideable: false, minWidth: 200, cell: (u) => <UserCell user={u} /> },
  { id: "email", header: "Email", accessor: "email", sortable: true },
  { id: "role", header: "Role", accessor: "role", sortable: true },
  { id: "status", header: "Status", accessor: "status", sortable: true, cell: (u) => <StatusBadge status={u.status} /> },
  { id: "joined", header: "Joined", accessor: "joined", sortable: true, searchable: false, cell: (u) => formatDate(u.joined) },
  { id: "spend", header: "Spend", accessor: "spend", sortable: true, align: "right", cell: (u) => usd.format(u.spend) },
];

<DataTable
  caption="Workspace members"
  data={users}
  columns={columns}
  getRowId={(u) => u.id}
  getRowLabel={(u) => u.name}        // checkbox label: "Select Jane Cooper"
  filter={{
    label: "Status",
    getValue: (u) => u.status,
    options: [
      { value: "Active", label: "Active" },
      { value: "Invited", label: "Invited" },
      { value: "Suspended", label: "Suspended" },
    ],
  }}
  selectable
  onSelectionChange={(ids, rows) => setSelection(rows)}
  bulkActions={[
    { id: "export", label: "Export", icon: <Download />, onClick: (rows) => exportCsv(rows) },
    { id: "delete", label: "Delete", icon: <Trash2 />, variant: "danger", onClick: (rows, clear) => { remove(rows); clear(); } },
  ]}
  pageSize={10}
  loading={loading}
  maxHeight={480}
/>`;

const invoicesCode = `
<DataTable
  caption="Recent invoices"
  showCaption
  data={invoices}
  columns={[
    { id: "id", header: "Invoice", accessor: "id", sortable: true },
    { id: "customer", header: "Customer", accessor: "customer", sortable: true },
    { id: "issued", header: "Issued", accessor: "issued", sortable: true },
    { id: "amount", header: "Amount", accessor: "amount", sortable: true, align: "right", cell: (i) => usd.format(i.amount) },
  ]}
  getRowId={(i) => i.id}
  searchable={false}
  columnMenu={false}
  pageSizeOptions={[]}
  stickyFirstColumn={false}
  pageSize={5}
/>`;

const usage = `
import { DataTable, type ColumnDef } from "@/components/ui/data-table";

type Row = { id: string; name: string; score: number };

const columns: ColumnDef<Row>[] = [
  { id: "name", header: "Name", accessor: "name", sortable: true },
  { id: "score", header: "Score", accessor: (r) => r.score, sortable: true, align: "right" },
];

export function Example({ rows }: { rows: Row[] }) {
  return <DataTable caption="Scores" data={rows} columns={columns} getRowId={(r) => r.id} selectable />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="data-table"
      examples={[
        {
          title: "Workspace members",
          description:
            "50 seeded fake users. Search, filter by status, click headers to sort ascending → descending → off, select rows (or every match) for bulk actions, hide columns, and scroll sideways at narrow widths: the header and the Name column stay put. Toggle loading and empty states above the table.",
          preview: <UsersDemo />,
          code: usersCode,
          minHeight: 640,
          center: false,
        },
        {
          title: "Minimal",
          description: "The same component with search, filter, selection, column menu and page-size picker turned off, and a visible caption.",
          preview: <InvoicesDemo />,
          code: invoicesCode,
          minHeight: 360,
        },
      ]}
      usage={usage}
      props={[
        { name: "data", type: "T[]", description: "Rows. Selection survives sorting, searching and paging." },
        { name: "columns", type: "ColumnDef<T>[]", description: "Column config: accessor, header, cell renderer, sortable, align and more." },
        { name: "getRowId", type: "(row: T) => string", description: "Stable id per row for keys and selection." },
        { name: "caption", type: "string", description: "Accessible name of the table and its scroll region. Required." },
        { name: "showCaption", type: "boolean", default: "false", description: "Show the caption visually (it is always read by screen readers)." },
        { name: "searchable", type: "boolean", default: "true", description: "Global search across columns whose searchable is not false." },
        { name: "filter", type: "DataTableFilter<T>", description: "One select filter in the toolbar, e.g. status." },
        { name: "pageSize", type: "number", default: "10", description: "Initial rows per page." },
        { name: "pageSizeOptions", type: "number[]", default: "[10, 25, 50]", description: "Rows-per-page choices. [] hides the select." },
        { name: "selectable", type: "boolean", default: "false", description: "Checkbox column with an indeterminate select-all for the current page." },
        { name: "onSelectionChange", type: "(ids: string[], rows: T[]) => void", description: "Called after every selection change, in data order." },
        { name: "bulkActions", type: "DataTableBulkAction<T>[]", default: "[]", description: "Buttons in the bar shown while rows are selected. onClick gets the rows and a clear function." },
        { name: "getRowLabel", type: "(row: T) => string", default: "first column value", description: "Row name used in checkbox labels: “Select Jane Cooper”." },
        { name: "loading", type: "boolean", default: "false", description: "Skeleton rows, disabled controls and aria-busy on the table." },
        { name: "emptyState", type: "ReactNode", default: "Icon + emptyTitle", description: "Shown when data is empty. Filtered-out results show noResults with a Clear filters button instead." },
        { name: "stickyFirstColumn", type: "boolean", default: "true", description: "Pin the first visible column (after the checkbox) while scrolling sideways, with an edge shadow once scrolled." },
        { name: "maxHeight", type: "number", default: "520", description: "Height of the scroll area in px. The header sticks to its top." },
        { name: "columnMenu", type: "boolean", default: "true", description: "Column visibility menu. The last visible column cannot be hidden." },
        { name: "labels", type: "Partial<DataTableLabels>", description: "Override any text: search, columns, selectRow, selectedCount, selectAllMatching, range, page, noResults, loading, emptyTitle…" },
        { name: "className", type: "string", description: "Classes for the root element." },
      ]}
      types={[
        {
          name: "ColumnDef<T>",
          props: [
            { name: "id", type: "string", description: "Unique column id." },
            { name: "header", type: "string", description: "Header text, also used in the column menu." },
            { name: "accessor", type: "keyof T | (row: T) => unknown", description: "Raw value for display, search and sorting." },
            { name: "cell", type: "(row: T, value: unknown) => ReactNode", description: "Custom renderer." },
            { name: "sortable", type: "boolean", default: "false", description: "Header click cycles asc → desc → none." },
            { name: "sortValue", type: "(row: T) => string | number", description: "Sort key when it differs from the accessor." },
            { name: "align", type: '"left" | "center" | "right"', default: '"left"', description: "Cell and header alignment. Right-aligned cells use tabular numbers." },
            { name: "searchable", type: "boolean", default: "true", description: "Include in global search." },
            { name: "hideable", type: "boolean", default: "true", description: "Allow hiding from the column menu." },
            { name: "defaultHidden", type: "boolean", default: "false", description: "Start hidden." },
            { name: "minWidth", type: "number", description: "Minimum width in px." },
            { name: "className", type: "string", description: "Classes for body cells." },
          ],
        },
        {
          name: "DataTableFilter<T>",
          props: [
            { name: "label", type: "string", description: "Accessible label and option prefix, e.g. “Status”." },
            { name: "options", type: "{ value, label }[]", description: "Choices besides “All”." },
            { name: "getValue", type: "(row: T) => string", description: "Value compared with the chosen option." },
            { name: "allLabel", type: "string", default: '"<label>: All"', description: "Text of the show-everything option." },
          ],
        },
        {
          name: "DataTableBulkAction<T>",
          props: [
            { name: "id", type: "string", description: "Key." },
            { name: "label", type: "string", description: "Button text." },
            { name: "icon", type: "ReactNode", description: "Icon before the label." },
            { name: "onClick", type: "(rows: T[], clearSelection: () => void) => void", description: "Runs with the selected rows." },
            { name: "variant", type: '"default" | "danger"', default: '"default"', description: "danger renders a red button." },
          ],
        },
      ]}
      accessibility={[
        "Real <table>, <caption>, <thead>/<tbody> and scope=\"col\" headers; the scroll area is a focusable, labelled region so keyboard users can scroll it.",
        "Sortable headers are buttons inside the <th>, and the <th> carries aria-sort (ascending, descending or none).",
        "Every row checkbox has a label like “Select Jane Cooper”; the header checkbox is “Select all rows on this page” and shows the indeterminate state when some are selected.",
        "The bulk action bar sits in a polite live region, so “3 selected” is announced; result counts after searching and loading are announced through a status region.",
        "Search, filter and page size have labels; pagination is a labelled nav with named icon buttons that disable at the ends. Every control is at least 40px tall.",
        "Skeleton rows are hidden from assistive tech while the table reports aria-busy; pulse animations stop under prefers-reduced-motion.",
      ]}
    />
  );
}
