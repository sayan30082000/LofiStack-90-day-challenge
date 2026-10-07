import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { AccountSettingsDemo, PillDemo, VerticalDemo } from "./demos";

export const metadata: Metadata = {
  title: "Animated Tabs",
  description:
    "WAI-ARIA tabs with a stretchy sliding underline or pill, direction-aware panel transitions, badges, disabled tabs, overflow fades and a vertical mode.",
};

const settingsCode = `
const [unread, setUnread] = useState(3);

const tabs: AnimatedTab[] = [
  { id: "profile", label: "Profile", icon: <User />, content: <ProfilePanel /> },
  { id: "security", label: "Security", icon: <Shield />, content: <SecurityPanel /> },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell />,
    badge: unread > 0 ? unread : undefined,
    badgeLabel: \`\${unread} unread\`,
    content: <NotificationsPanel onReadAll={() => setUnread(0)} />,
  },
  { id: "billing", label: "Billing", icon: <CreditCard />, content: <BillingPanel /> },
];

<AnimatedTabs label="Account settings" tabs={tabs} defaultValue="profile" />`;

const pillCode = `
const [team, setTeam] = useState("all");

<AnimatedTabs
  label="Filter people by team"
  variant="pill"
  value={team}
  onChange={setTeam}
  tabs={[
    { id: "all", label: "All", badge: 8, content: <PeopleGrid /> },
    { id: "design", label: "Design", badge: 2, content: <PeopleGrid team="Design" /> },
    // …
    { id: "alumni", label: "Alumni", disabled: true, content: null },
  ]}
/>`;

const verticalCode = `
<AnimatedTabs
  label="Documentation"
  orientation="vertical"
  activation="manual"   // arrows move focus, Enter / Space select
  variant={variant}     // "underline" | "pill"
  tabs={[
    { id: "start", label: "Getting started", icon: <Rocket />, content: <Doc /> },
    { id: "a11y", label: "Accessibility", icon: <Accessibility />, badge: "New", badgeLabel: "new section", content: <Doc /> },
    { id: "api", label: "API reference", icon: <BookOpen />, disabled: true, content: null },
  ]}
/>`;

const usage = `
import { AnimatedTabs } from "@/components/ui/animated-tabs";

export function Example() {
  return (
    <AnimatedTabs
      label="Project"
      tabs={[
        { id: "overview", label: "Overview", content: <p>Overview</p> },
        { id: "activity", label: "Activity", badge: 2, content: <p>Activity</p> },
      ]}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="animated-tabs"
      examples={[
        {
          title: "Account settings",
          description:
            "Underline variant with icons and a live badge. The bar stretches toward the new tab, and the panel slides in from the side you moved to. Mark the notifications read to clear the badge.",
          preview: <AccountSettingsDemo />,
          code: settingsCode,
          minHeight: 380,
        },
        {
          title: "Pill variant",
          description:
            "Controlled pill tabs with counts and a disabled tab. At narrow widths the list scrolls sideways with fading edges, and the active tab is kept in view.",
          preview: <PillDemo />,
          code: pillCode,
          minHeight: 380,
        },
        {
          title: "Vertical",
          description:
            "A vertical list with manual activation beside the panel, stacked above it in narrow containers. Switch the indicator style to compare.",
          preview: <VerticalDemo />,
          code: verticalCode,
          minHeight: 420,
        },
      ]}
      usage={usage}
      props={[
        { name: "tabs", type: "AnimatedTab[]", description: "Tabs in order. Required." },
        { name: "value", type: "string", description: "Selected tab id (controlled)." },
        { name: "defaultValue", type: "string", default: "first enabled tab", description: "Initially selected tab id (uncontrolled)." },
        { name: "onChange", type: "(id: string) => void", description: "Called with the id of the newly selected tab." },
        { name: "variant", type: '"underline" | "pill"', default: '"underline"', description: "A sliding bar, or a raised chip that slides along a track." },
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Vertical uses Up/Down arrows and sits beside the panel (above it in containers under 36rem)." },
        { name: "activation", type: '"auto" | "manual"', default: '"auto"', description: "auto selects as arrows move focus; manual waits for Enter or Space." },
        { name: "label", type: "string", default: '"Tabs"', description: "Accessible name of the tab list." },
        { name: "fullWidth", type: "boolean", default: "false", description: "Horizontal tabs share the width equally." },
        { name: "keepMounted", type: "boolean", default: "true", description: "Keep inactive panels in the DOM (hidden) so form state survives switching." },
        { name: "emptyText", type: "string", default: '"Nothing to show yet."', description: "Shown when tabs is empty." },
        { name: "className / listClassName / panelClassName", type: "string", description: "Classes for the root, the tab list and every panel." },
      ]}
      types={[
        {
          name: "AnimatedTab",
          props: [
            { name: "id", type: "string", description: "Unique id." },
            { name: "label", type: "string", description: "Tab text." },
            { name: "icon", type: "ReactNode", description: "Icon before the label, sized to 16px and hidden from screen readers." },
            { name: "badge", type: "number | string", description: "Count or short text in a pill after the label." },
            { name: "badgeLabel", type: "string", description: "Screen reader text for the badge, e.g. \"3 unread\"." },
            { name: "content", type: "ReactNode", description: "Panel content." },
            { name: "disabled", type: "boolean", default: "false", description: "Can't be selected and is skipped by arrow keys." },
          ],
        },
      ]}
      accessibility={[
        "Follows the WAI-ARIA tabs pattern: role=\"tablist\" with aria-label and aria-orientation, role=\"tab\" with aria-selected and aria-controls, role=\"tabpanel\" with aria-labelledby.",
        "Roving tabindex: only the selected tab is in the Tab order, then Tab moves into the panel (which is focusable itself).",
        "Left/Right (or Up/Down when vertical) move between tabs and wrap; Home and End jump to the first and last. Disabled tabs are skipped.",
        "activation=\"auto\" selects on focus; \"manual\" only moves focus until Enter or Space, for slow panels.",
        "Badges read as part of the tab name, e.g. \"Notifications, 3 unread\".",
        "Tabs are at least 40px tall. With prefers-reduced-motion the indicator jumps instead of sliding and panels appear without the slide.",
      ]}
    />
  );
}
