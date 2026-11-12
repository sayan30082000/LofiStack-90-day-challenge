import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { DemoAppPalette, LoadingPalette } from "./demos";

export const metadata: Metadata = {
  title: "Command Palette",
  description:
    "A Cmd/Ctrl+K palette that takes values inline (\"accent pink\", \"zoom 125\"), learns which result you pick for each search, and teaches you a command's keyboard shortcut once you keep reaching for it.",
};

const demoAppCode = `
const commands: CommandItem[] = [
  { id: "go-usage", group: "Navigation", label: "Go to Usage", icon: <Hash />, keywords: ["import"], onRun: () => scrollToSection("usage") },
  { id: "go-top", group: "Navigation", label: "Back to top", icon: <ArrowUpToLine />, shortcut: ["⇧", "T"], onRun: () => window.scrollTo({ top: 0 }) },
  { id: "go-home", group: "Navigation", label: "Open the component gallery", icon: <LayoutGrid />, onRun: () => router.push("/") },

  // Return a promise: the row shows a spinner, and a rejection shows its message
  { id: "copy-link", group: "Actions", label: "Copy link to this page", icon: <Link />, onRun: () => navigator.clipboard.writeText(location.href) },
  { id: "export", group: "Actions", label: "Export as PDF", description: "Pro plan", icon: <FileDown />, disabled: true },

  { id: "theme", group: "Theme", label: "Toggle dark mode", icon: <Moon />, shortcut: ["⇧", "D"], onRun: toggleTheme },
  {
    id: "accent",
    group: "Theme",
    label: "Change accent color",
    icon: <Palette />,
    keywords: ["accent", "color"],
    // Type "accent pink" (keywords count: pink → Rose) or pick it in a second step
    arg: {
      kind: "choice",
      name: "color",
      options: [
        { value: "indigo", label: "Indigo", keywords: ["blue"] },
        { value: "rose", label: "Rose", keywords: ["pink", "red"] },
        // …
      ],
    },
    onRun: (value) => setAccent(value as Accent),
  },
  {
    id: "zoom",
    group: "Theme",
    label: "Zoom text",
    keywords: ["zoom", "font", "size"],
    // "zoom 125" or "font 90%"; out of range shows "Enter a number from 80 to 150%"
    arg: { kind: "number", name: "zoom level", min: 80, max: 150, unit: "%" },
    onRun: (value) => setZoom(value as number),
  },
  {
    id: "rename",
    group: "Actions",
    label: "Rename this page",
    arg: { kind: "text", name: "title", validate: (v) => (v.length > 60 ? "Keep the title under 60 characters" : null) },
    onRun: (value) => setTitle(String(value)),
  },
];

<CommandPalette
  commands={commands}
  open={open}
  onOpenChange={setOpen}
  defaultRecent={["go-props"]}
  portal={false} // inherit this demo's own light/dark class
  // learn (default): picks per search are remembered in localStorage
  // tipAfter={3} (default): after 3 runs of "Toggle dark mode", it shows ⇧ D once
/>`;

const loadingCode = `
const [open, setOpen] = useState(false);
const [loading, setLoading] = useState(false);

<CommandPalette
  commands={commands}
  open={open}
  onOpenChange={(next) => {
    setOpen(next);
    if (next) {
      setLoading(true);
      fetchCommands().finally(() => setLoading(false));
    }
  }}
  hotkey="/"            // Ctrl or Cmd + /
  loading={loading}
  maxRecent={0}
  storageKey={null}     // learn for this page view only
  triggerLabel="Jump to a project…"
  emptyText={(q) => \`Nothing called “\${q}”. Try “mob” or “docs”.\`}
/>`;

const usage = `
import { CommandPalette, type CommandItem } from "@/components/ui/command-palette";

const commands: CommandItem[] = [
  { id: "new", group: "Actions", label: "New document", shortcut: ["N"], onRun: () => createDoc() },
  { id: "settings", group: "Navigation", label: "Open settings", onRun: () => router.push("/settings") },
];

export function AppCommands() {
  return <CommandPalette commands={commands} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="command-palette"
      examples={[
        {
          title: "Commands that take values, and learn",
          description:
            "Press Ctrl+K or ⌘K and type a command with its value: “accent pink”, “zoom 125”, “rename Hello”. Choose a command without a value and it asks for one. Pick the same result for a search twice and it ranks first next time; run “Toggle dark mode” 3 times and the palette shows you its shortcut.",
          preview: <DemoAppPalette />,
          code: demoAppCode,
          minHeight: 320,
        },
        {
          title: "Loading and empty states",
          description: "A different hotkey (Ctrl or ⌘ + /), skeleton rows while commands load, and a custom no-results message.",
          preview: <LoadingPalette />,
          code: loadingCode,
          minHeight: 200,
        },
      ]}
      usage={usage}
      props={[
        { name: "commands", type: "CommandItem[]", description: "Commands of the root page. Order sets the order of groups." },
        { name: "open", type: "boolean", description: "Open state (controlled)." },
        { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state (uncontrolled)." },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called on open and close, from the hotkey, trigger, Esc, backdrop or a command." },
        { name: "placeholder", type: "string", default: '"Type a command or search…"', description: "Search placeholder on the root page." },
        { name: "hotkey", type: "string | null", default: '"k"', description: "Opens and closes the palette with Cmd (macOS) or Ctrl. null turns it off." },
        { name: "showTrigger", type: "boolean", default: "true", description: "Render the trigger button with the shortcut." },
        { name: "triggerLabel", type: "string", default: '"Search commands…"', description: "Text of the trigger button." },
        { name: "triggerClassName", type: "string", description: "Classes for the trigger button." },
        { name: "label", type: "string", default: '"Command palette"', description: "Accessible name of the dialog." },
        { name: "recentLabel", type: "string", default: '"Recent"', description: "Heading of the recent section." },
        { name: "maxRecent", type: "number", default: "3", description: "Recent commands remembered and shown first. 0 turns recents off." },
        { name: "defaultRecent", type: "string[]", default: "[]", description: "Command ids shown as recent before anything runs." },
        { name: "loading", type: "boolean", default: "false", description: "Skeleton rows and aria-busy instead of results." },
        { name: "loadingText", type: "string", default: '"Loading commands…"', description: "Announced while loading." },
        { name: "emptyText", type: "(query: string) => string", default: "No commands match “query”", description: "Shown and announced when nothing matches." },
        { name: "backLabel / closeLabel", type: "string", default: '"Back" / "Close"', description: "Accessible labels of the back and close buttons." },
        { name: "showFooter", type: "boolean", default: "true", description: "Keyboard hint footer, hidden on small screens." },
        { name: "portal", type: "boolean", default: "true", description: "Render into document.body. Turn off to inherit theme classes from the surrounding markup." },
        { name: "learn", type: "boolean", default: "true", description: "Rank a command higher for a search it was picked for before (and for longer or shorter versions of that search)." },
        { name: "tipAfter", type: "number", default: "3", description: "After a command with a shortcut has run this many times from the palette, show its shortcut once as a tip. 0 turns tips off." },
        { name: "storageKey", type: "string | null", default: '"lofi-command-palette"', description: "localStorage key for what the palette learned. null keeps it for this page view only." },
        { name: "quickRunLabel", type: "string", default: '"Run with this value"', description: "Heading of inline matches like “accent pink”." },
        { name: "learnedLabel", type: "string", default: '"Your usual pick"', description: "Badge on the top result when learning put it there." },
        { name: "tipText / tipDismissLabel", type: "(label, runs) => string / string", description: "Wording of the shortcut tip and its dismiss button." },
      ]}
      types={[
        {
          name: "CommandItem",
          props: [
            { name: "id", type: "string", description: "Unique across the whole tree. Used for recents." },
            { name: "label", type: "string", description: "Searched with fuzzy matching; matched letters are highlighted." },
            { name: "group", type: "string", description: "Section heading, e.g. \"Navigation\"." },
            { name: "icon", type: "ReactNode", description: "Icon in the row's tile." },
            { name: "description", type: "string", description: "Muted text after the label." },
            { name: "shortcut", type: "string[]", description: "Key hints on the right. Display only." },
            { name: "keywords", type: "string[]", description: "Extra terms that also match, without highlighting." },
            { name: "onRun", type: "(value?) => void | Promise<unknown>", description: "Runs the command (with the parsed value when it has an arg), then the palette closes. A promise shows a spinner; a rejection shows its message." },
            { name: "arg", type: "CommandArg", description: "A value the command takes: { kind: \"choice\", options } | { kind: \"number\", min, max, unit } | { kind: \"text\", validate }. Typed inline after the command, or asked for in a second step." },
            { name: "children", type: "CommandItem[]", description: "Opens a nested page instead of running. Searching from a parent page also finds nested commands." },
            { name: "disabled", type: "boolean", description: "Listed, but skipped by arrow keys and can't run." },
            { name: "keepOpen", type: "boolean", description: "Stay open after running." },
          ],
        },
      ]}
      accessibility={[
        "The palette is a role=\"dialog\" with aria-modal and a label. Tab and Shift+Tab are trapped inside it, and focus returns to the element that opened it.",
        "The search box is a combobox that controls a listbox; the active row is exposed with aria-activedescendant, so focus never leaves the input.",
        "Rows are role=\"option\" inside labelled role=\"group\" sections, with aria-selected on the active row and aria-disabled on disabled ones.",
        "Up/Down move (wrapping, skipping disabled rows), Enter runs, Esc closes, Backspace on an empty search goes back a page. The trigger exposes the shortcut with aria-keyshortcuts.",
        "A polite status region announces the number of results, the empty message or the loading text; command errors use role=\"alert\".",
        "In the value step the search box is renamed (“Zoom text: zoom level”), number values open the decimal keyboard on phones, and an invalid value is shown and announced as the empty message (“Enter a number from 80 to 150%”).",
        "The shortcut tip is a visible note with a real dismiss button, and its sentence is also read out with the result count when the palette opens.",
        "A visible 40px close button and backdrop tap close it on touch devices. Open, page and highlight animations are removed with prefers-reduced-motion.",
      ]}
    />
  );
}
