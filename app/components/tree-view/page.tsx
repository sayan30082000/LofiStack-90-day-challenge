import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { ExplorerDemo, ModesDemo, PermissionsDemo } from "./demos";

export const metadata: Metadata = {
  title: "Tree View",
  description:
    "A change-aware tree view: git-style added/modified/removed markers, folder roll-ups, new-since-last-visit dots, a changes-only view and jump-to-change, plus tri-state checkboxes, filtering and lazy loading.",
};

const explorerCode = `
// Nodes carry their change: { id, label, status: "modified", changedAt: 1759830000000 }
const tree = useRef<TreeViewHandle>(null);
const [changesOnly, setChangesOnly] = useState(false);

<button onClick={() => tree.current?.focusPreviousChange()}>Previous change</button>
<button onClick={() => tree.current?.focusNextChange()}>Next change</button>
<button onClick={() => tree.current?.markAllSeen()}>Mark all seen</button>

<TreeView
  ref={tree}
  label="Project files"
  data={filesWithGitStatus}
  selectionMode="single"
  filter={query}
  changesOnly={changesOnly}
  // Dots for changes you haven't seen, remembered between visits
  trackSeen
  persistSeenKey="repo:seen"
  // Folders with children: undefined load on first expand
  loadChildren={(node) => fetch(\`/api/files?dir=\${node.id}\`).then((r) => r.json())}
  onActivate={(node) => node.isLeaf && openFile(node.id)}
/>`;

const permissionsCode = `
// Diff the draft against the saved role: new grants are "added", revoked ones "removed".
function withDiff(nodes: TreeNode[], saved: Set<string>, draft: Set<string>): TreeNode[] {
  return nodes.map((n) => {
    if (n.children) return { ...n, children: withDiff(n.children, saved, draft) };
    const status = draft.has(n.id) && !saved.has(n.id) ? "added"
      : !draft.has(n.id) && saved.has(n.id) ? "removed" : undefined;
    return { ...n, status };
  });
}

<TreeView
  label="Editor role permissions"
  data={withDiff(permissions, new Set(saved), new Set(draft))}
  selectionMode="checkbox"
  showIcons={false}
  selected={draft}
  onSelectedChange={setDraft}
  changesOnly={reviewing}
  statusLabels={{
    added: { short: "+", label: "granting" },
    removed: { short: "−", label: "revoking" },
  }}
/>`;

const modesCode = `
<TreeView label="Docs" data={outline} selectionMode="none" />      // click opens folders
<TreeView label="Docs" data={outline} selectionMode="single" />    // one selected item
<TreeView label="Docs" data={outline} selectionMode="multiple" />  // click toggles items
<TreeView label="Docs" data={outline} selectionMode="checkbox" />  // tri-state cascade
<TreeView label="Docs" data={outline} size="sm" />                 // denser rows`;

const usage = `
import { TreeView, type TreeNode } from "@/components/ui/tree-view";

const data: TreeNode[] = [
  { id: "src", label: "src", children: [{ id: "src/index.ts", label: "index.ts", isLeaf: true }] },
];

export function Example() {
  return <TreeView label="Files" data={data} defaultExpanded={["src"]} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="tree-view"
      examples={[
        {
          title: "What changed since your last visit",
          description:
            "A file explorer with git-style A/M/R markers. Closed folders sum up the changes inside them, blue dots mark changes you haven't seen yet (remembered after a reload), and Alt+Up/Down or the arrow buttons jump between changes. Pull the teammate's commit to see a file change again.",
          preview: <ExplorerDemo />,
          code: explorerCode,
          minHeight: 520,
        },
        {
          title: "Permissions with a diff before saving",
          description:
            "Checkbox mode with tri-state cascades. Every grant or revoke is marked against the saved role, collapsed groups sum it up, and Review changes shows only the diff.",
          preview: <PermissionsDemo />,
          code: permissionsCode,
          minHeight: 420,
        },
        {
          title: "Selection modes and sizes",
          description: "Switch between the four selection modes and the two row sizes on the same data.",
          preview: <ModesDemo />,
          code: modesCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "data", type: "TreeNode[]", description: "Top-level nodes." },
        { name: "label", type: "string", description: "Accessible name of the tree, e.g. \"Project files\". Required." },
        { name: "selectionMode", type: '"none" | "single" | "multiple" | "checkbox"', default: '"single"', description: "How clicks, Space and Enter select nodes." },
        { name: "expanded", type: "string[]", description: "Expanded node ids (controlled)." },
        { name: "defaultExpanded", type: "string[]", default: "[]", description: "Initially expanded ids (uncontrolled)." },
        { name: "onExpandedChange", type: "(ids: string[]) => void", description: "Called when a node opens or closes." },
        { name: "selected", type: "string[]", description: "Selected or checked ids (controlled). Fully checked parents are included in checkbox mode." },
        { name: "defaultSelected", type: "string[]", default: "[]", description: "Initially selected ids (uncontrolled)." },
        { name: "onSelectedChange", type: "(ids: string[]) => void", description: "Called with the new selection, in tree order." },
        { name: "loadChildren", type: "(node: TreeNode) => Promise<TreeNode[]>", description: "Loads children for nodes whose children is undefined. Shows a spinner, then an error with retry if it rejects." },
        { name: "filter", type: "string", default: '""', description: "Shows matching nodes, their ancestors (forced open) and their descendants, with the match highlighted." },
        { name: "onActivate", type: "(node: TreeNode) => void", description: "Fired on Enter or double click, e.g. to open a file." },
        { name: "showIcons", type: "boolean", default: "true", description: "Folder and file icons. A node's own icon always wins." },
        { name: "showGuides", type: "boolean", default: "true", description: "Vertical indentation guides." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Row height and indentation. md rows are 40px tall for touch." },
        { name: "emptyText", type: "string", default: '"No matches"', description: "Shown when nothing is visible." },
        { name: "loadingText", type: "string", default: '"Loading…"', description: "Shown inside a folder while its children load." },
        { name: "errorText", type: "string", default: "\"Couldn't load this folder.\"", description: "Shown when loadChildren rejects." },
        { name: "retryText", type: "string", default: '"Retry"', description: "Label of the retry button." },
        { name: "changesOnly", type: "boolean", default: "false", description: "Shows only nodes with a status, plus their folders (forced open). Combines with filter." },
        { name: "statusLabels", type: "Partial<Record<TreeNodeStatus, { short: string; label: string }>>", default: "A / M / R", description: "Marker text per status and the word used for screen readers, tooltips and folder roll-ups." },
        { name: "trackSeen", type: "boolean", default: "false", description: "Puts a dot on changes not seen yet. A change counts as seen after it has been on screen for seenDelay ms." },
        { name: "seen", type: "string[]", description: "Seen change keys (controlled). Build them with changeKey(node)." },
        { name: "defaultSeen", type: "string[]", default: "[]", description: "Initially seen change keys (uncontrolled)." },
        { name: "onSeenChange", type: "(keys: string[]) => void", description: "Called when changes are marked seen." },
        { name: "persistSeenKey", type: "string", description: "localStorage key that remembers seen changes between visits (uncontrolled only)." },
        { name: "seenDelay", type: "number", default: "1500", description: "Milliseconds a change must be visible before its dot clears." },
        { name: "unseenText", type: "string", default: '"new"', description: "Screen reader word for unseen changes." },
        { name: "ref", type: "Ref<TreeViewHandle>", description: "focusNextChange(), focusPreviousChange() and markAllSeen() for toolbar buttons." },
        { name: "className", type: "string", description: "Classes for the tree root." },
      ]}
      types={[
        {
          name: "TreeNode",
          props: [
            { name: "id", type: "string", description: "Unique id across the whole tree." },
            { name: "label", type: "string", description: "Text shown and used for filtering and typeahead." },
            { name: "icon", type: "ReactNode", description: "Custom icon for this node." },
            { name: "children", type: "TreeNode[]", description: "Child nodes. Leave undefined to load lazily." },
            { name: "isLeaf", type: "boolean", default: "false", description: "No chevron and nothing to load." },
            { name: "disabled", type: "boolean", default: "false", description: "Can be focused but not selected or checked, and is skipped by cascades." },
            { name: "status", type: '"added" | "modified" | "removed"', description: "Change marker. Removed nodes are struck through. Closed folders roll up their descendants' statuses." },
            { name: "changedAt", type: "number", description: "When the change happened (epoch ms). A newer change on the same node counts as unseen again." },
          ],
        },
      ]}
      accessibility={[
        "Follows the WAI-ARIA tree pattern: role=\"tree\", \"treeitem\" and \"group\", with aria-level, aria-setsize, aria-posinset and aria-expanded.",
        "aria-selected in single and multiple modes; aria-checked with \"mixed\" for partly checked parents in checkbox mode; aria-multiselectable when more than one node can be chosen.",
        "Roving tabindex: the tree is one Tab stop. Up/Down move, Right opens or moves to the first child, Left closes or moves to the parent, Home/End jump, * opens all siblings.",
        "Space selects or checks, Enter selects and activates. Typing letters jumps to the next matching label.",
        "Alt+Down and Alt+Up jump to the next or previous change, opening closed folders on the way and moving focus there.",
        "Change markers are not colour-only: each row has a letter or sign, and screen readers hear e.g. \"modified, new\" on a file or \"contains 2 added, 1 modified\" on a closed folder.",
        "Loading folders set aria-busy; failed folders announce the error in their label and retry with Right arrow.",
        "Focus is shown with a visible ring on the row; reduced motion removes the expand animation and chevron rotation transition.",
      ]}
    />
  );
}
