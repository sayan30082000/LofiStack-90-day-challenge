"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Check, ChevronRight, File, Folder, FolderOpen, Loader2, Minus, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

/** What happened to a node, e.g. from git status or a draft diff. */
export type TreeNodeStatus = "added" | "modified" | "removed";

export interface TreeNode {
  id: string;
  label: string;
  /** Custom icon. Defaults to a folder or file icon when showIcons is on. */
  icon?: ReactNode;
  /** Child nodes. Leave undefined (and isLeaf false) to load them lazily with loadChildren. */
  children?: TreeNode[];
  /** Marks a node with no children, so no chevron is shown and nothing is loaded. */
  isLeaf?: boolean;
  disabled?: boolean;
  /** Change marker. Collapsed folders roll up the changes inside them. */
  status?: TreeNodeStatus;
  /** When the change happened (epoch ms). A newer change on the same node counts as unseen again. */
  changedAt?: number;
}

export type TreeSelectionMode = "none" | "single" | "multiple" | "checkbox";
export type CheckState = "checked" | "unchecked" | "mixed";

export interface TreeStatusLabel {
  /** One or two characters shown on the row, e.g. "M". */
  short: string;
  /** Word used for screen readers, tooltips and folder roll-ups, e.g. "modified". */
  label: string;
}

/** Imperative controls, e.g. for "Next change" buttons in a toolbar. */
export interface TreeViewHandle {
  /** Focuses the next changed node after the focused one, opening folders on the way. Returns false when there is none. */
  focusNextChange: () => boolean;
  focusPreviousChange: () => boolean;
  /** Marks every known change as seen. */
  markAllSeen: () => void;
}

export const DEFAULT_STATUS_LABELS: Record<TreeNodeStatus, TreeStatusLabel> = {
  added: { short: "A", label: "added" },
  modified: { short: "M", label: "modified" },
  removed: { short: "R", label: "removed" },
};

/** Identity of one change. Stored in `seen`; changes when the node's status or changedAt changes. */
export function changeKey(node: TreeNode) {
  return `${node.id}@${node.changedAt ?? node.status ?? ""}`;
}

export interface TreeViewProps {
  ref?: Ref<TreeViewHandle>;
  data: TreeNode[];
  /** Accessible name of the tree, e.g. "Project files". */
  label: string;
  /**
   * none: click toggles folders. single: one selected node.
   * multiple: click toggles each node. checkbox: tri-state checkboxes that cascade.
   */
  selectionMode?: TreeSelectionMode;
  /** Expanded node ids (controlled). */
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Selected or checked node ids (controlled). In checkbox mode, fully checked parents are included. */
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Loads children for nodes whose `children` is undefined. */
  loadChildren?: (node: TreeNode) => Promise<TreeNode[]>;
  /** Text filter. Matches stay visible with their ancestors expanded, and the match is highlighted. */
  filter?: string;
  /** Fired on Enter or double click, e.g. to open a file. */
  onActivate?: (node: TreeNode) => void;
  showIcons?: boolean;
  /** Vertical indentation guides. */
  showGuides?: boolean;
  size?: "sm" | "md";
  emptyText?: string;
  loadingText?: string;
  errorText?: string;
  retryText?: string;
  /** Shows only changed nodes and their folders. Combines with filter. */
  changesOnly?: boolean;
  /** Wording for the status markers, e.g. { added: { short: "+", label: "granting" } }. */
  statusLabels?: Partial<Record<TreeNodeStatus, TreeStatusLabel>>;
  /** Puts a dot on changes the person hasn't seen yet. A change counts as seen after it has been on screen for seenDelay ms. */
  trackSeen?: boolean;
  /** Seen change keys (controlled). Build keys with changeKey(node). */
  seen?: string[];
  defaultSeen?: string[];
  onSeenChange?: (keys: string[]) => void;
  /** localStorage key that remembers seen changes between visits (uncontrolled seen only). */
  persistSeenKey?: string;
  /** How long a change must be visible before its dot clears. */
  seenDelay?: number;
  /** Screen reader word for unseen changes. */
  unseenText?: string;
  className?: string;
}

type Rollup = Record<TreeNodeStatus, number> & { unseen: number };

const STATUS_TONE: Record<TreeNodeStatus, string> = {
  added: "text-emerald-700 dark:text-emerald-400",
  modified: "text-amber-700 dark:text-amber-400",
  removed: "text-rose-700 dark:text-rose-400",
};

const ROLLUP_SIGN: Record<TreeNodeStatus, string> = { added: "+", modified: "~", removed: "−" };
const STATUSES: TreeNodeStatus[] = ["added", "modified", "removed"];

const noopSubscribe = () => () => {};

function readStored(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

function writeStored(key: string, keys: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(keys));
  } catch {
    // Storage can be full or blocked; seen state then lasts for this visit only.
  }
}

interface IndexEntry {
  node: TreeNode;
  parentId: string | null;
  level: number;
}

interface FlatItem {
  node: TreeNode;
  parentId: string | null;
  level: number;
}

const SIZE = {
  sm: { row: "min-h-8 text-[13px]", indent: 16, base: 6, icon: "size-4" },
  md: { row: "min-h-10 text-sm", indent: 20, base: 8, icon: "size-4" },
} as const;

/** Controlled/uncontrolled state helper. */
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

function highlight(label: string, query: string): ReactNode {
  if (!query) return label;
  const i = label.toLowerCase().indexOf(query);
  if (i < 0) return label;
  return (
    <>
      {label.slice(0, i)}
      <mark className="rounded-sm bg-amber-200/80 text-inherit dark:bg-amber-400/30">{label.slice(i, i + query.length)}</mark>
      {label.slice(i + query.length)}
    </>
  );
}

export function TreeView({
  ref,
  data,
  label,
  selectionMode = "single",
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  loadChildren,
  filter = "",
  onActivate,
  showIcons = true,
  showGuides = true,
  size = "md",
  emptyText = "No matches",
  loadingText = "Loading…",
  errorText = "Couldn't load this folder.",
  retryText = "Retry",
  changesOnly = false,
  statusLabels,
  trackSeen = false,
  seen: seenProp,
  defaultSeen = [],
  onSeenChange,
  persistSeenKey,
  seenDelay = 1500,
  unseenText = "new",
  className,
}: TreeViewProps) {
  const sz = SIZE[size];
  const [expandedArr, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const [selectedArr, setSelected] = useControllable(selectedProp, defaultSelected, onSelectedChange);
  const [seenState, setSeenRaw] = useControllable(seenProp, defaultSeen, onSeenChange);
  const expandedSet = useMemo(() => new Set(expandedArr), [expandedArr]);
  const selectedSet = useMemo(() => new Set(selectedArr), [selectedArr]);
  const statusText = useMemo(() => ({ ...DEFAULT_STATUS_LABELS, ...statusLabels }), [statusLabels]);

  // Seen changes from earlier visits are read only after mount, so server and client render the same markup.
  const persist = seenProp === undefined ? persistSeenKey : undefined;
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const seenReady = !persist || mounted;
  const stored = useMemo(() => (persist && mounted ? readStored(persist) : []), [persist, mounted]);
  const seenArr = useMemo(
    () => (stored.length ? [...new Set([...stored, ...seenState])] : seenState),
    [stored, seenState],
  );
  const seenSet = useMemo(() => new Set(seenArr), [seenArr]);
  const latestSeen = useRef(seenArr);
  useEffect(() => {
    latestSeen.current = seenArr;
  }, [seenArr]);
  const setSeen = useCallback(
    (keys: string[]) => {
      latestSeen.current = keys;
      setSeenRaw(keys);
      if (persist) writeStored(persist, keys);
    },
    [persist, setSeenRaw],
  );
  const isUnseen = useCallback(
    (n: TreeNode) => trackSeen && seenReady && Boolean(n.status) && !seenSet.has(changeKey(n)),
    [trackSeen, seenReady, seenSet],
  );

  const [loaded, setLoaded] = useState<Record<string, TreeNode[]>>({});
  const [loading, setLoading] = useState<Set<string>>(() => new Set());
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const typeahead = useRef({ buffer: "", timer: 0 as ReturnType<typeof setTimeout> | 0 });
  const latestSelected = useRef(selectedArr);
  const inflight = useRef(new Set<string>());

  useEffect(() => {
    latestSelected.current = selectedArr;
  }, [selectedArr]);

  const childrenOf = useCallback((n: TreeNode) => n.children ?? loaded[n.id], [loaded]);
  const isBranch = useCallback(
    (n: TreeNode) => !n.isLeaf && (n.children ? n.children.length > 0 : Boolean(loadChildren)),
    [loadChildren],
  );

  // id -> node, parent, level for every node we know about (including lazily loaded ones).
  const index = useMemo(() => {
    const map = new Map<string, IndexEntry>();
    const order: string[] = [];
    const walk = (nodes: TreeNode[], parentId: string | null, level: number) => {
      for (const node of nodes) {
        map.set(node.id, { node, parentId, level });
        order.push(node.id);
        const kids = node.children ?? loaded[node.id];
        if (kids) walk(kids, node.id, level + 1);
      }
    };
    walk(data, null, 1);
    return { map, order };
  }, [data, loaded]);

  // Changes inside each folder (not counting the folder itself), for the collapsed roll-up.
  const rollups = useMemo(() => {
    const map = new Map<string, Rollup>();
    const visit = (n: TreeNode): Rollup => {
      const total: Rollup = { added: 0, modified: 0, removed: 0, unseen: 0 };
      for (const k of n.children ?? loaded[n.id] ?? []) {
        const sub = visit(k);
        for (const s of STATUSES) total[s] += sub[s] + (k.status === s ? 1 : 0);
        total.unseen += sub.unseen + (isUnseen(k) ? 1 : 0);
      }
      map.set(n.id, total);
      return total;
    };
    data.forEach(visit);
    return map;
  }, [data, loaded, isUnseen]);

  // Filtering: visible = matches + their ancestors + their descendants; ancestors are force-expanded.
  // changesOnly narrows matches to changed nodes.
  const query = filter.trim().toLowerCase();
  const filterState = useMemo(() => {
    if (!query && !changesOnly) return null;
    const visible = new Set<string>();
    const forced = new Set<string>();
    const addSubtree = (n: TreeNode) => {
      visible.add(n.id);
      (n.children ?? loaded[n.id])?.forEach(addSubtree);
    };
    for (const [id, entry] of index.map) {
      if (changesOnly && !entry.node.status) continue;
      if (query && !entry.node.label.toLowerCase().includes(query)) continue;
      if (changesOnly) visible.add(id);
      else addSubtree(entry.node);
      let p = entry.parentId;
      while (p) {
        visible.add(p);
        forced.add(p);
        p = index.map.get(p)?.parentId ?? null;
      }
      visible.add(id);
    }
    return { visible, forced };
  }, [query, changesOnly, index, loaded]);

  const isVisible = useCallback((id: string) => !filterState || filterState.visible.has(id), [filterState]);
  const isExpanded = useCallback(
    (id: string) => expandedSet.has(id) || Boolean(filterState?.forced.has(id)),
    [expandedSet, filterState],
  );

  // Visible nodes in document order, for keyboard navigation.
  const flat = useMemo(() => {
    const out: FlatItem[] = [];
    const walk = (nodes: TreeNode[], parentId: string | null, level: number) => {
      for (const node of nodes) {
        if (!isVisible(node.id)) continue;
        out.push({ node, parentId, level });
        const kids = childrenOf(node);
        if (isBranch(node) && isExpanded(node.id) && kids) walk(kids, node.id, level + 1);
      }
    };
    walk(data, null, 1);
    return out;
  }, [data, isVisible, isExpanded, isBranch, childrenOf]);

  // Tri-state check states, computed bottom-up once per render.
  const checkStates = useMemo(() => {
    const states = new Map<string, CheckState>();
    if (selectionMode !== "checkbox") return states;
    const visit = (n: TreeNode): CheckState => {
      const kids = (n.children ?? loaded[n.id])?.filter((k) => !k.disabled);
      let s: CheckState;
      if (!kids || kids.length === 0) {
        s = selectedSet.has(n.id) ? "checked" : "unchecked";
        (n.children ?? loaded[n.id])?.forEach(visit);
      } else {
        const childStates = kids.map(visit);
        (n.children ?? loaded[n.id])?.filter((k) => k.disabled).forEach(visit);
        s = childStates.every((c) => c === "checked")
          ? "checked"
          : childStates.every((c) => c === "unchecked")
            ? "unchecked"
            : "mixed";
      }
      states.set(n.id, s);
      return s;
    };
    data.forEach(visit);
    return states;
  }, [selectionMode, data, loaded, selectedSet]);

  const sortByOrder = useCallback(
    (ids: Iterable<string>) => {
      const pos = new Map(index.order.map((id, i) => [id, i]));
      return [...ids].sort((a, b) => (pos.get(a) ?? 1e9) - (pos.get(b) ?? 1e9));
    },
    [index],
  );

  /* ---------- Lazy loading ---------- */

  const load = useCallback(
    (node: TreeNode) => {
      if (!loadChildren || inflight.current.has(node.id)) return;
      inflight.current.add(node.id);
      setLoading((s) => new Set(s).add(node.id));
      setFailed((s) => {
        const n = new Set(s);
        n.delete(node.id);
        return n;
      });
      loadChildren(node)
        .then((kids) => {
          setLoaded((prev) => ({ ...prev, [node.id]: kids }));
          // Children of a checked parent start checked.
          if (selectionMode === "checkbox" && latestSelected.current.includes(node.id)) {
            const next = new Set(latestSelected.current);
            const add = (n: TreeNode) => {
              if (n.disabled) return;
              next.add(n.id);
              n.children?.forEach(add);
            };
            kids.forEach(add);
            setSelected([...next]);
          }
        })
        .catch(() => setFailed((s) => new Set(s).add(node.id)))
        .finally(() => {
          inflight.current.delete(node.id);
          setLoading((s) => {
            const n = new Set(s);
            n.delete(node.id);
            return n;
          });
        });
    },
    [loadChildren, selectionMode, setSelected],
  );

  // Load any expanded lazy node that has no children yet (covers defaultExpanded and controlled changes).
  useEffect(() => {
    for (const id of expandedArr) {
      const entry = index.map.get(id);
      if (!entry) continue;
      const n = entry.node;
      if (!n.isLeaf && n.children === undefined && !loaded[id] && !failed.has(id)) load(n);
    }
  }, [expandedArr, index, loaded, failed, load]);

  /* ---------- Actions ---------- */

  const setNodeExpanded = useCallback(
    (node: TreeNode, open: boolean) => {
      if (open === expandedSet.has(node.id)) return;
      setExpanded(open ? [...expandedArr, node.id] : expandedArr.filter((id) => id !== node.id));
    },
    [expandedArr, expandedSet, setExpanded],
  );

  const toggleExpanded = useCallback(
    (node: TreeNode) => {
      if (failed.has(node.id)) return load(node);
      setNodeExpanded(node, !isExpanded(node.id));
    },
    [failed, load, setNodeExpanded, isExpanded],
  );

  const toggleCheck = useCallback(
    (node: TreeNode) => {
      const target = checkStates.get(node.id) !== "checked";
      const next = new Set(selectedSet);
      const walk = (n: TreeNode, root: boolean) => {
        if (n.disabled && !root) return;
        if (target) next.add(n.id);
        else next.delete(n.id);
        childrenOf(n)?.forEach((k) => walk(k, false));
      };
      walk(node, true);
      // Re-derive each ancestor: checked only when every enabled child is checked.
      let p = index.map.get(node.id)?.parentId ?? null;
      while (p) {
        const parent = index.map.get(p)!.node;
        const kids = (childrenOf(parent) ?? []).filter((k) => !k.disabled);
        if (kids.length > 0 && kids.every((k) => next.has(k.id))) next.add(p);
        else next.delete(p);
        p = index.map.get(p)?.parentId ?? null;
      }
      setSelected(sortByOrder(next));
    },
    [checkStates, selectedSet, childrenOf, index, setSelected, sortByOrder],
  );

  const select = useCallback(
    (node: TreeNode) => {
      if (node.disabled) return;
      if (selectionMode === "single") setSelected([node.id]);
      else if (selectionMode === "multiple") {
        setSelected(
          selectedSet.has(node.id) ? selectedArr.filter((id) => id !== node.id) : sortByOrder([...selectedArr, node.id]),
        );
      } else if (selectionMode === "checkbox") toggleCheck(node);
    },
    [selectionMode, selectedSet, selectedArr, setSelected, sortByOrder, toggleCheck],
  );

  const focusNode = useCallback((id: string | undefined) => {
    if (!id) return;
    setFocusedId(id);
    itemRefs.current.get(id)?.focus();
  }, []);

  /* ---------- Keyboard ---------- */

  const tabbableId = useMemo(() => {
    if (focusedId && flat.some((f) => f.node.id === focusedId)) return focusedId;
    return flat.find((f) => selectedSet.has(f.node.id))?.node.id ?? flat[0]?.node.id ?? null;
  }, [focusedId, flat, selectedSet]);

  /* ---------- Changes ---------- */

  // A change counts as seen once it has been on screen for seenDelay ms.
  useEffect(() => {
    if (!trackSeen || !seenReady) return;
    const fresh = flat.filter((f) => isUnseen(f.node)).map((f) => changeKey(f.node));
    if (fresh.length === 0) return;
    const t = setTimeout(() => setSeen([...new Set([...latestSeen.current, ...fresh])]), seenDelay);
    return () => clearTimeout(t);
  }, [trackSeen, seenReady, flat, isUnseen, seenDelay, setSeen]);

  // Jumping to a change inside a closed folder opens its ancestors first, then focuses after render.
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    const id = pendingFocus.current;
    if (id && flat.some((f) => f.node.id === id)) {
      pendingFocus.current = null;
      focusNode(id);
    }
  }, [flat, focusNode]);

  const jumpToChange = useCallback(
    (dir: 1 | -1) => {
      const changed = index.order.filter((id) => {
        const n = index.map.get(id)!.node;
        return n.status && (!filterState || filterState.visible.has(id));
      });
      if (changed.length === 0) return false;
      const from = focusedId ?? tabbableId;
      const pos = new Map(index.order.map((id, i) => [id, i]));
      const at = from ? (pos.get(from) ?? -1) : -1;
      const target =
        dir === 1
          ? (changed.find((id) => pos.get(id)! > at) ?? changed[0])
          : ([...changed].reverse().find((id) => pos.get(id)! < at) ?? changed[changed.length - 1]);
      const ancestors: string[] = [];
      let p = index.map.get(target)?.parentId ?? null;
      while (p) {
        ancestors.push(p);
        p = index.map.get(p)?.parentId ?? null;
      }
      const closed = ancestors.filter((id) => !isExpanded(id));
      if (closed.length) {
        pendingFocus.current = target;
        setExpanded([...expandedArr, ...closed]);
      } else focusNode(target);
      return true;
    },
    [index, filterState, focusedId, tabbableId, isExpanded, expandedArr, setExpanded, focusNode],
  );

  useImperativeHandle(
    ref,
    () => ({
      focusNextChange: () => jumpToChange(1),
      focusPreviousChange: () => jumpToChange(-1),
      markAllSeen: () => {
        const all = [...index.map.values()].filter((e) => e.node.status).map((e) => changeKey(e.node));
        setSeen([...new Set([...latestSeen.current, ...all])]);
      },
    }),
    [jumpToChange, index, setSeen],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const i = flat.findIndex((f) => f.node.id === tabbableId);
    if (i < 0) return;
    const item = flat[i];
    const { node } = item;
    const branch = isBranch(node);
    const open = branch && isExpanded(node.id);
    let handled = true;

    switch (e.key) {
      case "ArrowDown":
        if (e.altKey) jumpToChange(1);
        else focusNode(flat[i + 1]?.node.id);
        break;
      case "ArrowUp":
        if (e.altKey) jumpToChange(-1);
        else focusNode(flat[i - 1]?.node.id);
        break;
      case "ArrowRight":
        if (branch && !open) toggleExpanded(node);
        else if (open && flat[i + 1]?.parentId === node.id) focusNode(flat[i + 1].node.id);
        else if (failed.has(node.id)) load(node);
        break;
      case "ArrowLeft":
        if (open && !filterState?.forced.has(node.id)) setNodeExpanded(node, false);
        else focusNode(item.parentId ?? undefined);
        break;
      case "Home":
        focusNode(flat[0]?.node.id);
        break;
      case "End":
        focusNode(flat[flat.length - 1]?.node.id);
        break;
      case "Enter":
        if (node.disabled) break;
        if (selectionMode === "single") select(node);
        else if (selectionMode === "none" && branch) toggleExpanded(node);
        onActivate?.(node);
        break;
      case " ":
        if (node.disabled) break;
        if (selectionMode === "none") {
          if (branch) toggleExpanded(node);
        } else select(node);
        break;
      case "*": {
        const siblings = flat.filter((f) => f.parentId === item.parentId && isBranch(f.node)).map((f) => f.node.id);
        setExpanded([...new Set([...expandedArr, ...siblings])]);
        break;
      }
      default:
        handled = false;
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          handled = true;
          const t = typeahead.current;
          if (t.timer) clearTimeout(t.timer);
          t.buffer += e.key.toLowerCase();
          t.timer = setTimeout(() => (t.buffer = ""), 500);
          const ordered = [...flat.slice(i + 1), ...flat.slice(0, i + 1)];
          const repeated = t.buffer.split("").every((c) => c === t.buffer[0]);
          const hit =
            ordered.find((f) => f.node.label.toLowerCase().startsWith(t.buffer)) ??
            (repeated ? ordered.find((f) => f.node.label.toLowerCase().startsWith(t.buffer[0])) : undefined);
          if (hit) focusNode(hit.node.id);
        }
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /* ---------- Rendering ---------- */

  const onRowClick = (node: TreeNode, e: MouseEvent) => {
    focusNode(node.id);
    if (node.disabled) return;
    // Ignore the second click of a double click; onDoubleClick handles that.
    if (e.detail > 1) return;
    if (selectionMode === "none") {
      if (isBranch(node)) toggleExpanded(node);
      return;
    }
    // In checkbox mode a click on the row toggles the box; the chevron handles expansion.
    select(node);
  };

  const renderNodes = (nodes: TreeNode[], level: number): ReactNode[] => {
    const shown = nodes.filter((n) => isVisible(n.id));
    return shown.map((node, i) => {
      const branch = isBranch(node);
      const open = branch && isExpanded(node.id);
      const kids = childrenOf(node);
      const isLoading = loading.has(node.id);
      const isFailed = failed.has(node.id);
      const isSelected = selectedSet.has(node.id);
      const check = checkStates.get(node.id) ?? "unchecked";
      const pad = sz.base + (level - 1) * sz.indent;
      const guideLeft = pad + 8;
      const rollup = rollups.get(node.id);
      // A closed folder carries the dot for unseen changes inside it.
      const unseen = isUnseen(node) || (branch && !open && (rollup?.unseen ?? 0) > 0);

      return (
        <li
          key={node.id}
          ref={(el) => {
            if (el) itemRefs.current.set(node.id, el);
            else itemRefs.current.delete(node.id);
          }}
          role="treeitem"
          aria-level={level}
          aria-setsize={shown.length}
          aria-posinset={i + 1}
          aria-expanded={branch ? open : undefined}
          aria-selected={selectionMode === "single" || selectionMode === "multiple" ? isSelected : undefined}
          aria-checked={selectionMode === "checkbox" ? (check === "mixed" ? "mixed" : check === "checked") : undefined}
          aria-disabled={node.disabled || undefined}
          aria-busy={isLoading || undefined}
          aria-label={isFailed ? `${node.label}, ${errorText}` : undefined}
          tabIndex={node.id === tabbableId ? 0 : -1}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusedId(node.id);
          }}
          className="outline-none [&:focus-visible>div]:ring-2 [&:focus-visible>div]:ring-indigo-500 [&:focus-visible>div]:ring-inset"
        >
          <div
            onClick={(e) => onRowClick(node, e)}
            onDoubleClick={() => {
              if (node.disabled) return;
              if (branch && selectionMode !== "none") toggleExpanded(node);
              onActivate?.(node);
            }}
            style={{ paddingLeft: pad }}
            className={cn(
              "group/row flex cursor-pointer select-none items-center gap-1.5 rounded-md pr-2 transition-colors motion-reduce:transition-none",
              sz.row,
              node.disabled && "cursor-not-allowed opacity-50",
              selectionMode !== "checkbox" && isSelected
                ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-100"
                : !node.disabled && "hover:bg-zinc-100 dark:hover:bg-zinc-800/70",
            )}
          >
            {branch ? (
              <span
                aria-hidden
                onClick={(e) => {
                  e.stopPropagation();
                  focusNode(node.id);
                  toggleExpanded(node);
                }}
                onDoubleClick={(e) => e.stopPropagation()}
                className="-my-1 inline-flex size-5 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 motion-safe:animate-spin" />
                ) : (
                  <ChevronRight
                    className={cn("size-3.5 transition-transform motion-reduce:transition-none", open && "rotate-90")}
                  />
                )}
              </span>
            ) : (
              <span aria-hidden className="size-5 shrink-0" />
            )}

            {selectionMode === "checkbox" && (
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-4 shrink-0 items-center justify-center rounded border transition-colors motion-reduce:transition-none",
                  check === "unchecked"
                    ? "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                    : "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500",
                )}
              >
                {check === "checked" && <Check className="size-3" strokeWidth={3} />}
                {check === "mixed" && <Minus className="size-3" strokeWidth={3} />}
              </span>
            )}

            {showIcons && (
              <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center", sz.icon)}>
                {node.icon ??
                  (branch ? (
                    open ? (
                      <FolderOpen className="size-4 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <Folder className="size-4 text-sky-600 dark:text-sky-400" />
                    )
                  ) : (
                    <File className="size-4 text-zinc-500 dark:text-zinc-400" />
                  ))}
              </span>
            )}

            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                node.status === "removed" && "text-zinc-500 line-through decoration-rose-500/60 dark:text-zinc-400",
              )}
            >
              {highlight(node.label, query)}
            </span>
            <ChangeMarks
              status={node.status}
              statusText={statusText}
              unseen={unseen}
              track={trackSeen}
              rollup={branch && !open ? rollup : undefined}
              unseenText={unseenText}
            />
          </div>

          {open && (
            <ul
              role="group"
              style={{ "--guide": `${guideLeft}px` } as CSSProperties}
              className={cn(
                "relative motion-safe:animate-tree-in",
                showGuides &&
                  "before:absolute before:inset-y-0 before:left-(--guide) before:w-px before:bg-zinc-200 dark:before:bg-zinc-800",
              )}
            >
              {isLoading && !kids && (
                <li role="none" className={cn("flex items-center gap-2 text-zinc-500 dark:text-zinc-400", sz.row)} style={{ paddingLeft: pad + sz.indent + 26 }}>
                  {loadingText}
                </li>
              )}
              {isFailed && !kids && (
                <li role="none" className={cn("flex items-center gap-2 text-rose-700 dark:text-rose-400", sz.row)} style={{ paddingLeft: pad + sz.indent + 26 }}>
                  {errorText}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => load(node)}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 px-2 text-xs font-medium hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                  >
                    <RotateCw className="size-3" aria-hidden /> {retryText}
                  </button>
                </li>
              )}
              {kids && renderNodes(kids, level + 1)}
            </ul>
          )}
        </li>
      );
    });
  };

  if (flat.length === 0) {
    return (
      <p className={cn("px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400", className)} role="status">
        {emptyText}
      </p>
    );
  }

  return (
    <ul
      role="tree"
      aria-label={label}
      aria-multiselectable={selectionMode === "multiple" || selectionMode === "checkbox" || undefined}
      onKeyDown={onKeyDown}
      className={cn("text-zinc-800 dark:text-zinc-200", className)}
    >
      {renderNodes(data, 1)}
    </ul>
  );
}

interface ChangeMarksProps {
  status?: TreeNodeStatus;
  statusText: Record<TreeNodeStatus, TreeStatusLabel>;
  unseen: boolean;
  /** Seen tracking is on, so the dot keeps its slot and can fade out. */
  track: boolean;
  /** Only passed for closed folders. */
  rollup?: Rollup;
  unseenText: string;
}

/** Right side of a row: roll-up counts for a closed folder, the node's own status letter, and the unseen dot. */
function ChangeMarks({ status, statusText, unseen, track, rollup, unseenText }: ChangeMarksProps) {
  const counts = rollup ? STATUSES.filter((s) => rollup[s] > 0) : [];
  if (!status && counts.length === 0 && !unseen) return null;
  const spoken = [
    status && statusText[status].label,
    counts.length > 0 && `contains ${counts.map((s) => `${rollup![s]} ${statusText[s].label}`).join(", ")}`,
    unseen && unseenText,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 pl-2 font-mono text-[11px] font-semibold tabular-nums">
      <span className="sr-only">, {spoken}</span>
      {counts.length > 0 && (
        <span aria-hidden className="inline-flex items-center gap-1" title={counts.map((s) => `${rollup![s]} ${statusText[s].label}`).join(", ")}>
          {counts.map((s) => (
            <span key={s} className={STATUS_TONE[s]}>
              {ROLLUP_SIGN[s]}
              {rollup![s]}
            </span>
          ))}
        </span>
      )}
      {status && (
        <span aria-hidden title={statusText[status].label} className={cn("min-w-3 text-center", STATUS_TONE[status])}>
          {statusText[status].short}
        </span>
      )}
      {track && (
        <span
          aria-hidden
          title={unseen ? unseenText : undefined}
          className={cn(
            "size-2 rounded-full bg-indigo-500 transition-[opacity,scale] duration-500 motion-reduce:transition-none dark:bg-indigo-400",
            unseen ? "opacity-100" : "scale-50 opacity-0",
          )}
        />
      )}
    </span>
  );
}
