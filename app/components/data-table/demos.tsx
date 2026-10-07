"use client";

import { useState } from "react";
import { Ban, Download, RotateCcw, Trash2 } from "lucide-react";
import { DataTable, type ColumnDef, type DataTableBulkAction, type DataTableFilter } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

type Role = "Admin" | "Editor" | "Viewer" | "Billing";
type Status = "Active" | "Invited" | "Suspended";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  /** ISO date, YYYY-MM-DD */
  joined: string;
  spend: number;
}

/* ---------- 50 deterministic fake users ---------- */

/** mulberry32: tiny seeded PRNG so server and client render the same data. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Jane", "Marcus", "Priya", "Tomás", "Aiko", "Leah", "Noah", "Zara", "Elif", "Kwame", "Ines", "Oskar", "Mei", "Rafael", "Sana", "Felix", "Amara", "Jonah", "Lucía", "Theo"];
const LAST = ["Cooper", "Lindqvist", "Raman", "Okafor", "Brennan", "Duarte", "Nakamura", "Fischer", "Haddad", "Moreau", "Kowalski", "Mensah", "Varga", "Castillo", "Ishikawa", "Novak", "Adeyemi", "Sorensen", "Bianchi", "Whitlow"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pick<T>(r: number, table: [T, number][]): T {
  let acc = 0;
  for (const [v, w] of table) {
    acc += w;
    if (r < acc) return v;
  }
  return table[table.length - 1][0];
}

function makeUsers(): User[] {
  const rand = prng(46);
  const base = Date.UTC(2023, 0, 1);
  return Array.from({ length: 50 }, (_, i) => {
    const first = FIRST[i % 20];
    const last = LAST[(3 * (i % 20) + Math.floor(i / 20)) % 20];
    const status = pick<Status>(rand(), [
      ["Active", 0.7],
      ["Invited", 0.15],
      ["Suspended", 0.15],
    ]);
    const role = pick<Role>(rand(), [
      ["Admin", 0.1],
      ["Editor", 0.35],
      ["Viewer", 0.4],
      ["Billing", 0.15],
    ]);
    const joined = new Date(base + Math.floor(rand() * 1368) * 86_400_000).toISOString().slice(0, 10);
    const r = rand();
    const spend = status === "Invited" ? 0 : Math.round(r * r * 1_200_000) / 100;
    const email = `${first}.${last}@example.com`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return { id: `u_${String(i + 1).padStart(3, "0")}`, name: `${first} ${last}`, email, role, status, joined, spend };
  });
}

const USERS = makeUsers();

/* ---------- Columns ---------- */

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const AVATAR_TONES = [
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
];

const STATUS_STYLE: Record<Status, string> = {
  Active: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  Invited: "bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/25",
  Suspended: "bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-500/30",
};

const STATUS_DOT: Record<Status, string> = {
  Active: "bg-emerald-500",
  Invited: "bg-sky-500",
  Suspended: "bg-zinc-400",
};

const COLUMNS: ColumnDef<User>[] = [
  {
    id: "name",
    header: "Name",
    accessor: "name",
    sortable: true,
    hideable: false,
    minWidth: 200,
    cell: (u) => {
      const initials = u.name
        .split(" ")
        .map((p) => p[0])
        .join("");
      const tone = AVATAR_TONES[Number(u.id.slice(2)) % AVATAR_TONES.length];
      return (
        <span className="flex items-center gap-2.5">
          <span aria-hidden className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", tone)}>
            {initials}
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{u.name}</span>
        </span>
      );
    },
  },
  {
    id: "email",
    header: "Email",
    accessor: "email",
    sortable: true,
    cell: (u) => <span className="text-zinc-600 dark:text-zinc-400">{u.email}</span>,
  },
  { id: "role", header: "Role", accessor: "role", sortable: true },
  {
    id: "status",
    header: "Status",
    accessor: "status",
    sortable: true,
    cell: (u) => (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", STATUS_STYLE[u.status])}>
        <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[u.status])} />
        {u.status}
      </span>
    ),
  },
  {
    id: "joined",
    header: "Joined",
    accessor: "joined",
    sortable: true,
    searchable: false,
    cell: (u) => <time dateTime={u.joined}>{formatDate(u.joined)}</time>,
  },
  {
    id: "spend",
    header: "Spend",
    accessor: "spend",
    sortable: true,
    align: "right",
    searchable: false,
    cell: (u) => (u.spend === 0 ? <span className="text-zinc-500 dark:text-zinc-400">—</span> : usd.format(u.spend)),
  },
];

const STATUS_FILTER: DataTableFilter<User> = {
  label: "Status",
  getValue: (u) => u.status,
  options: [
    { value: "Active", label: "Active" },
    { value: "Invited", label: "Invited" },
    { value: "Suspended", label: "Suspended" },
  ],
};

/* ---------- Demo ---------- */

export function UsersDemo() {
  const [users, setUsers] = useState<User[]>(USERS);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [log, setLog] = useState("Select rows to see the bulk action bar.");

  const bulkActions: DataTableBulkAction<User>[] = [
    {
      id: "export",
      label: "Export",
      icon: <Download aria-hidden />,
      onClick: (rows) => setLog(`Exported ${rows.length} ${rows.length === 1 ? "user" : "users"} to CSV (not really).`),
    },
    {
      id: "suspend",
      label: "Suspend",
      icon: <Ban aria-hidden />,
      onClick: (rows, clear) => {
        const ids = new Set(rows.map((r) => r.id));
        setUsers((list) => list.map((u) => (ids.has(u.id) ? { ...u, status: "Suspended" } : u)));
        setLog(`Suspended ${rows.length} ${rows.length === 1 ? "user" : "users"}.`);
        clear();
      },
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 aria-hidden />,
      variant: "danger",
      onClick: (rows, clear) => {
        const ids = new Set(rows.map((r) => r.id));
        setUsers((list) => list.filter((u) => !ids.has(u.id)));
        setLog(`Deleted ${rows.map((r) => r.name).slice(0, 3).join(", ")}${rows.length > 3 ? ` and ${rows.length - 3} more` : ""}.`);
        clear();
      },
    },
  ];

  return (
    <div className="flex w-full min-w-0 max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Toggle pressed={loading} onClick={() => setLoading((l) => !l)}>
          Loading
        </Toggle>
        <Toggle pressed={empty} onClick={() => setEmpty((e) => !e)}>
          Empty data
        </Toggle>
        <button
          type="button"
          onClick={() => {
            setUsers(USERS);
            setLog("Data reset to 50 users.");
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-700 outline-none hover:bg-zinc-200/60 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw aria-hidden className="size-4" />
          Reset data
        </button>
        <p className="min-w-0 basis-full font-mono text-xs text-zinc-500 sm:ml-auto sm:basis-auto dark:text-zinc-400" aria-live="polite">
          {log}
        </p>
      </div>

      <DataTable
        caption="Workspace members"
        data={empty ? [] : users}
        columns={COLUMNS}
        getRowId={(u) => u.id}
        getRowLabel={(u) => u.name}
        filter={STATUS_FILTER}
        searchable
        selectable
        bulkActions={bulkActions}
        onSelectionChange={(ids) => ids.length > 0 && setLog(`onSelectionChange: ${ids.length} selected`)}
        pageSize={10}
        loading={loading}
        labels={{ searchPlaceholder: "Search name, email or role…" }}
        maxHeight={480}
      />
    </div>
  );
}

function Toggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2.5 rounded-lg border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none",
        pressed
          ? "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-100"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-4 w-7 rounded-full transition-colors motion-reduce:transition-none",
          pressed ? "bg-indigo-600 dark:bg-indigo-400" : "bg-zinc-300 dark:bg-zinc-600",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-3 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none",
            pressed ? "translate-x-3.5" : "translate-x-0.5",
          )}
        />
      </span>
      {children}
    </button>
  );
}

/* ---------- Minimal: sorting only ---------- */

interface Invoice {
  id: string;
  customer: string;
  issued: string;
  amount: number;
}

const INVOICES: Invoice[] = [
  { id: "INV-1042", customer: "Northwind Studio", issued: "2026-09-28", amount: 1840 },
  { id: "INV-1041", customer: "Blue Heron Labs", issued: "2026-09-21", amount: 640.5 },
  { id: "INV-1040", customer: "Quiet Margins", issued: "2026-09-14", amount: 2299 },
  { id: "INV-1039", customer: "Atlas & Oak", issued: "2026-09-02", amount: 410 },
  { id: "INV-1038", customer: "Fernwood Co.", issued: "2026-08-27", amount: 1275.25 },
];

const INVOICE_COLUMNS: ColumnDef<Invoice>[] = [
  { id: "id", header: "Invoice", accessor: "id", sortable: true, cell: (i) => <span className="font-mono text-[13px]">{i.id}</span> },
  { id: "customer", header: "Customer", accessor: "customer", sortable: true },
  { id: "issued", header: "Issued", accessor: "issued", sortable: true, cell: (i) => <time dateTime={i.issued}>{formatDate(i.issued)}</time> },
  { id: "amount", header: "Amount", accessor: "amount", sortable: true, align: "right", cell: (i) => usd.format(i.amount) },
];

export function InvoicesDemo() {
  return (
    <div className="w-full max-w-2xl">
      <DataTable
        caption="Recent invoices"
        showCaption
        data={INVOICES}
        columns={INVOICE_COLUMNS}
        getRowId={(i) => i.id}
        searchable={false}
        columnMenu={false}
        pageSizeOptions={[]}
        stickyFirstColumn={false}
        pageSize={5}
      />
    </div>
  );
}
