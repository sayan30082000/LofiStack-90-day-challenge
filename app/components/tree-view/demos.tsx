"use client";

import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCheck,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  FileType,
  GitPullRequestArrow,
  RotateCcw,
  Save,
  Search,
  Undo2,
  X,
} from "lucide-react";
import { TreeView, type TreeNode, type TreeSelectionMode, type TreeViewHandle } from "@/components/ui/tree-view";
import { cn } from "@/lib/utils";

/* ---------- File explorer ---------- */

function fileIcon(name: string) {
  const ext = name.split(".").pop();
  if (ext === "tsx" || ext === "ts" || ext === "mjs") return <FileCode className="size-4 text-blue-600 dark:text-blue-400" />;
  if (ext === "json") return <FileJson className="size-4 text-amber-600 dark:text-amber-400" />;
  if (ext === "md") return <FileText className="size-4 text-zinc-500 dark:text-zinc-400" />;
  if (ext === "css") return <FileType className="size-4 text-pink-600 dark:text-pink-400" />;
  if (ext === "svg" || ext === "ico" || ext === "png") return <FileImage className="size-4 text-emerald-600 dark:text-emerald-400" />;
  return undefined;
}

type Changes = Record<string, Pick<TreeNode, "status" | "changedAt">>;

function file(path: string, changes: Changes = {}): TreeNode {
  const label = path.split("/").pop()!;
  return { id: path, label, isLeaf: true, icon: fileIcon(label), ...changes[path] };
}

function folder(path: string, children?: TreeNode[]): TreeNode {
  return { id: path, label: path.split("/").pop()!, children };
}

// Fixed timestamps so the server and browser render the same tree.
const LOCAL = Date.UTC(2026, 9, 6, 9);
const PULLED = Date.UTC(2026, 9, 7, 14);

/** Uncommitted work in the working tree, like git status. */
const WORKING: Changes = {
  "components/ui/tree-view.tsx": { status: "modified", changedAt: LOCAL },
  "app/components/tree-view/demos.tsx": { status: "modified", changedAt: LOCAL },
  "components/ui/typing-indicator.tsx": { status: "added", changedAt: LOCAL },
  "lib/registry.ts": { status: "modified", changedAt: LOCAL },
  "public/vercel.svg": { status: "removed", changedAt: LOCAL },
};

/** What a teammate's commit changes when you pull it. */
const TEAMMATE: Changes = {
  "components/ui/tree-view.tsx": { status: "modified", changedAt: PULLED },
  "app/sitemap.ts": { status: "added", changedAt: PULLED },
  "lib/site.ts": { status: "modified", changedAt: PULLED },
  "README.md": { status: "modified", changedAt: PULLED },
};

function project(changes: Changes): TreeNode[] {
  const f = (path: string) => file(path, changes);
  return [
    folder("app", [
      folder("app/components", [
        folder("app/components/tree-view", [f("app/components/tree-view/page.tsx"), f("app/components/tree-view/demos.tsx")]),
        folder("app/components/typing-indicator", [
          f("app/components/typing-indicator/page.tsx"),
          f("app/components/typing-indicator/demos.tsx"),
        ]),
      ]),
      f("app/globals.css"),
      f("app/layout.tsx"),
      f("app/page.tsx"),
      ...(changes["app/sitemap.ts"] ? [f("app/sitemap.ts")] : []),
    ]),
    folder("components", [
      folder("components/gallery", [f("components/gallery/ComponentPage.tsx"), f("components/gallery/CodeBlock.tsx")]),
      folder("components/ui", [f("components/ui/tree-view.tsx"), f("components/ui/typing-indicator.tsx")]),
    ]),
    folder("lib", [f("lib/registry.ts"), f("lib/site.ts"), f("lib/utils.ts")]),
    // Loaded lazily: children undefined.
    folder("node_modules"),
    folder("vendor"),
    folder("public", [f("public/favicon.ico"), f("public/next.svg"), f("public/vercel.svg")]),
    f("next.config.ts"),
    f("package.json"),
    f("README.md"),
  ];
}

const PACKAGES = ["clsx", "lucide-react", "next", "react", "react-dom", "shiki", "tailwind-merge", "tailwindcss"];
const SEEN_KEY = "lofistack:tree-view-demo:seen";

export function ExplorerDemo() {
  const searchId = useId();
  const tree = useRef<TreeViewHandle>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(["components/ui/tree-view.tsx"]);
  const [opened, setOpened] = useState<string | null>(null);
  const [pulled, setPulled] = useState(false);
  const [changesOnly, setChangesOnly] = useState(false);
  // Remounting the tree is how the demo forgets what was seen.
  const [run, setRun] = useState(0);
  const vendorAttempts = useRef(0);

  const changes = useMemo(() => (pulled ? { ...WORKING, ...TEAMMATE } : WORKING), [pulled]);
  const data = useMemo(() => project(changes), [changes]);
  const changeCount = Object.keys(changes).length;

  const reset = () => {
    try {
      window.localStorage.removeItem(SEEN_KEY);
    } catch {
      // Nothing stored.
    }
    setPulled(false);
    setChangesOnly(false);
    setRun((r) => r + 1);
  };

  const loadChildren = (node: TreeNode) =>
    new Promise<TreeNode[]>((resolve, reject) => {
      setTimeout(() => {
        if (node.id === "vendor" && vendorAttempts.current++ === 0) {
          reject(new Error("Network error"));
          return;
        }
        if (node.id === "vendor") resolve([file("vendor/analytics.min.js"), file("vendor/LICENSE.md")]);
        else
          resolve(
            PACKAGES.map((p) =>
              folder(`node_modules/${p}`, [file(`node_modules/${p}/package.json`), file(`node_modules/${p}/README.md`)]),
            ),
          );
      }, 900);
    });

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2 border-b border-zinc-200 p-2 dark:border-zinc-800">
          <div className="flex items-center gap-1">
            <div role="group" aria-label="Show" className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
              <ModeButton pressed={!changesOnly} onClick={() => setChangesOnly(false)}>
                All files
              </ModeButton>
              <ModeButton pressed={changesOnly} onClick={() => setChangesOnly(true)}>
                {`Changes ${changeCount}`}
              </ModeButton>
            </div>
            <span className="flex-1" />
            <IconButton label="Previous change (Alt+Up)" onClick={() => tree.current?.focusPreviousChange()}>
              <ArrowUp className="size-4" aria-hidden />
            </IconButton>
            <IconButton label="Next change (Alt+Down)" onClick={() => tree.current?.focusNextChange()}>
              <ArrowDown className="size-4" aria-hidden />
            </IconButton>
          </div>
          <label htmlFor={searchId} className="sr-only">
            Filter files
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              id={searchId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter files, e.g. page"
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-9 text-sm outline-none placeholder:text-zinc-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="absolute right-1 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto p-1.5">
          <TreeView
            key={run}
            ref={tree}
            label="Project files"
            data={data}
            selectionMode="single"
            selected={selected}
            onSelectedChange={setSelected}
            defaultExpanded={["components", "components/ui"]}
            loadChildren={loadChildren}
            filter={query}
            changesOnly={changesOnly}
            trackSeen
            persistSeenKey={SEEN_KEY}
            onActivate={(n) => n.isLeaf && setOpened(n.id)}
            emptyText={changesOnly ? "No changes match" : `No files match "${query}"`}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <Readout label="Selected" value={selected[0] ?? "Nothing selected"} />
        <Readout label="Opened (Enter or double click)" value={opened ?? "Nothing opened yet"} />
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => setPulled(true)} disabled={pulled}>
            <GitPullRequestArrow className="size-4" aria-hidden />
            {pulled ? "Pulled" : "Pull teammate's commit"}
          </ActionButton>
          <ActionButton onClick={() => tree.current?.markAllSeen()}>
            <CheckCheck className="size-4" aria-hidden /> Mark all seen
          </ActionButton>
          <ActionButton onClick={reset}>
            <RotateCcw className="size-4" aria-hidden /> Reset demo
          </ActionButton>
        </div>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-zinc-500 marker:text-zinc-400 dark:text-zinc-400">
          <li>
            <b className="font-medium text-emerald-700 dark:text-emerald-400">A</b>,{" "}
            <b className="font-medium text-amber-700 dark:text-amber-400">M</b> and{" "}
            <b className="font-medium text-rose-700 dark:text-rose-400">R</b> mark added, modified and removed files. Closed
            folders sum up what changed inside them.
          </li>
          <li>
            A <span className="inline-block size-2 rounded-full bg-indigo-500 align-middle dark:bg-indigo-400" /> dot means
            new since your last visit. It clears once you have seen it, and stays cleared after a reload.
          </li>
          <li>Pull the commit: tree-view.tsx changes again, so its dot comes back.</li>
          <li>
            <b className="font-medium text-zinc-700 dark:text-zinc-300">node_modules</b> loads lazily;{" "}
            <b className="font-medium text-zinc-700 dark:text-zinc-300">vendor</b> fails once to show retry.
          </li>
          <li>Alt+Up/Down jump between changes. Arrows, Home/End, typeahead and * work as usual.</li>
        </ul>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-600 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

function ActionButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 break-all font-mono text-[13px]">{value}</p>
    </div>
  );
}

/* ---------- Permissions (checkbox) ---------- */

const PERMISSIONS: TreeNode[] = [
  {
    id: "projects",
    label: "Projects",
    children: [
      { id: "projects.view", label: "View projects", isLeaf: true },
      { id: "projects.edit", label: "Edit projects", isLeaf: true },
      { id: "projects.delete", label: "Delete projects", isLeaf: true },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    children: [
      { id: "billing.invoices", label: "View invoices", isLeaf: true },
      { id: "billing.payment", label: "Manage payment methods", isLeaf: true },
    ],
  },
  {
    id: "team",
    label: "Team",
    children: [
      { id: "team.invite", label: "Invite members", isLeaf: true },
      { id: "team.remove", label: "Remove members", isLeaf: true },
      {
        id: "team.roles",
        label: "Roles",
        children: [
          { id: "team.roles.assign", label: "Assign roles", isLeaf: true },
          { id: "team.roles.create", label: "Create custom roles", isLeaf: true },
        ],
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    children: [
      { id: "workspace.settings", label: "Edit settings", isLeaf: true },
      { id: "workspace.delete", label: "Delete workspace (owner only)", isLeaf: true, disabled: true },
    ],
  },
];

function leafIds(nodes: TreeNode[]): string[] {
  return nodes.flatMap((n) => (n.children ? leafIds(n.children) : n.disabled ? [] : [n.id]));
}

/** Marks each permission as being granted or revoked compared with the saved role. */
function withDiff(nodes: TreeNode[], saved: Set<string>, draft: Set<string>): TreeNode[] {
  return nodes.map((n) => {
    if (n.children) return { ...n, children: withDiff(n.children, saved, draft) };
    const status = draft.has(n.id) && !saved.has(n.id) ? "added" : !draft.has(n.id) && saved.has(n.id) ? "removed" : undefined;
    return { ...n, status };
  });
}

const INITIAL_GRANTS = ["projects", "projects.view", "projects.edit", "projects.delete", "billing.invoices"];
const DIFF_LABELS = { added: { short: "+", label: "granting" }, removed: { short: "−", label: "revoking" } };

export function PermissionsDemo() {
  const [saved, setSaved] = useState<string[]>(INITIAL_GRANTS);
  const [selected, setSelected] = useState<string[]>(INITIAL_GRANTS);
  const [review, setReview] = useState(false);
  const allLeaves = useMemo(() => leafIds(PERMISSIONS), []);
  const granted = allLeaves.filter((id) => selected.includes(id));
  const data = useMemo(() => withDiff(PERMISSIONS, new Set(saved), new Set(selected)), [saved, selected]);
  const adding = allLeaves.filter((id) => selected.includes(id) && !saved.includes(id)).length;
  const revoking = allLeaves.filter((id) => !selected.includes(id) && saved.includes(id)).length;
  const dirty = adding + revoking > 0;

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="rounded-xl border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 px-2.5 pb-1 pt-2">
          <p className="flex-1 text-sm font-semibold">Editor role</p>
          <button
            type="button"
            aria-pressed={review}
            onClick={() => setReview((r) => !r)}
            disabled={!dirty && !review}
            className="inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium text-indigo-700 outline-none hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:text-zinc-400 aria-pressed:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10 dark:aria-pressed:bg-indigo-500/15"
          >
            {review ? "Show all" : "Review changes"}
          </button>
        </div>
        <TreeView
          label="Editor role permissions"
          data={data}
          selectionMode="checkbox"
          showIcons={false}
          defaultExpanded={["projects", "billing", "team", "team.roles", "workspace"]}
          selected={selected}
          onSelectedChange={setSelected}
          changesOnly={review && dirty}
          statusLabels={DIFF_LABELS}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <p>
          <span className="text-2xl font-semibold tabular-nums">{granted.length}</span>
          <span className="text-zinc-500 dark:text-zinc-400"> of {allLeaves.length} permissions granted</span>
        </p>
        <p role="status" className="text-sm">
          {dirty ? (
            <>
              <span className="font-medium">Unsaved:</span>{" "}
              <span className="text-emerald-700 dark:text-emerald-400">{adding} granting</span>,{" "}
              <span className="text-rose-700 dark:text-rose-400">{revoking} revoking</span>
            </>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">All changes saved</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            disabled={!dirty}
            onClick={() => {
              setSaved(selected);
              setReview(false);
            }}
          >
            <Save className="size-4" aria-hidden /> Save role
          </ActionButton>
          <ActionButton
            disabled={!dirty}
            onClick={() => {
              setSelected(saved);
              setReview(false);
            }}
          >
            <Undo2 className="size-4" aria-hidden /> Discard
          </ActionButton>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Each change shows + or − next to it, and collapsed groups sum up what changes inside them. Review changes hides
          everything else so you can check the diff before saving. Disabled items are skipped by cascades.
        </p>
      </div>
    </div>
  );
}

/* ---------- Selection modes ---------- */

const OUTLINE: TreeNode[] = [
  {
    id: "start",
    label: "Getting started",
    children: [
      { id: "install", label: "Installation", isLeaf: true },
      { id: "structure", label: "Project structure", isLeaf: true },
    ],
  },
  {
    id: "guides",
    label: "Guides",
    children: [
      { id: "theming", label: "Theming", isLeaf: true },
      { id: "a11y", label: "Accessibility", isLeaf: true },
      { id: "testing", label: "Testing", isLeaf: true },
    ],
  },
  { id: "changelog", label: "Changelog", isLeaf: true },
];

const MODES: TreeSelectionMode[] = ["none", "single", "multiple", "checkbox"];

export function ModesDemo() {
  const [mode, setMode] = useState<TreeSelectionMode>("multiple");
  const [selected, setSelected] = useState<string[]>([]);
  const [size, setSize] = useState<"sm" | "md">("md");

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <div role="group" aria-label="Selection mode" className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
          {MODES.map((m) => (
            <ModeButton
              key={m}
              pressed={mode === m}
              onClick={() => {
                setMode(m);
                setSelected([]);
              }}
            >
              {m}
            </ModeButton>
          ))}
        </div>
        <div role="group" aria-label="Size" className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
          {(["sm", "md"] as const).map((s) => (
            <ModeButton key={s} pressed={size === s} onClick={() => setSize(s)}>
              {s}
            </ModeButton>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
        <TreeView
          key={mode}
          label="Documentation outline"
          data={OUTLINE}
          selectionMode={mode}
          size={size}
          defaultExpanded={["start", "guides"]}
          selected={selected}
          onSelectedChange={setSelected}
        />
      </div>
      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">selected: {JSON.stringify(selected)}</p>
    </div>
  );
}

function ModeButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-8 rounded-md px-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        pressed
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
      )}
    >
      {children}
    </button>
  );
}
