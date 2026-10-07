import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { DeepPathDemo, SeparatorDemo, ShortPathDemo } from "./demos";

export const metadata: Metadata = {
  title: "Breadcrumbs",
  description: "Breadcrumb trail that collapses long paths into a menu, truncates long labels with a tooltip and offers a compact back link on mobile.",
};

const deepCode = `
const path: BreadcrumbItem[] = [
  { label: "lofistack", href: "/files" },
  { label: "component-gallery", href: "/files/component-gallery", icon: <Folder /> },
  { label: "app", href: "/files/component-gallery/app", icon: <Folder /> },
  { label: "components", href: "/files/component-gallery/app/components", icon: <Folder /> },
  { label: "breadcrumbs", href: "/files/component-gallery/app/components/breadcrumbs", icon: <Folder /> },
  { label: "collapsing-trail-with-truncated-labels-and-tooltips.md", icon: <FileText /> },
];

<Breadcrumbs
  items={path}
  maxItems={4}          // 6 items > 4, so the middle 3 collapse into "…"
  showHomeIcon
  homeIconOnly          // the first label stays readable by screen readers
  mobileBackLink        // "← breadcrumbs" when the trail has less than ~448px
  maxLabelWidth="14rem"
/>`;

const shortCode = `
const [loading, setLoading] = useState(false);

<Breadcrumbs
  items={[
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings" },
    { label: "Notifications" },
  ]}
  showHomeIcon
  loading={loading}     // skeleton crumbs + aria-busy while the path resolves
/>`;

const separatorCode = `
// Built in: "chevron" (default) or "slash"
<Breadcrumbs items={repoPath} separator="slash" maxItems={5} label="Repository path" />

// Or any node
<Breadcrumbs
  items={[
    { label: "Shop", href: "/shop" },
    { label: "Audio", href: "/shop/audio" },
    { label: "Archived collection", disabled: true },
    { label: "Studio Monitor Headphones X2" },
  ]}
  separator={<Dot className="size-5 text-indigo-500" />}
  label="Product category"
/>`;

const usage = `
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export function PageHeader() {
  return (
    <Breadcrumbs
      items={[
        { label: "Docs", href: "/docs" },
        { label: "Components", href: "/docs/components" },
        { label: "Breadcrumbs" },
      ]}
      renderLink={({ href, className, children }) => (
        <Link href={href} className={className}>
          {children}
        </Link>
      )}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="breadcrumbs"
      examples={[
        {
          title: "Deep file path",
          description:
            "Six levels collapse into a “…” menu that lists the hidden folders as a small tree. The long file name truncates with a tooltip, and narrow widths swap to a back link.",
          preview: <DeepPathDemo />,
          code: deepCode,
          minHeight: 300,
        },
        {
          title: "Short path",
          description: "Three items never collapse. The home icon sits on the first crumb, and the loading state shows skeleton crumbs.",
          preview: <ShortPathDemo />,
          code: shortCode,
          minHeight: 180,
        },
        {
          title: "Custom separators",
          description: "A slash separator for a repository path, and a custom node separator with a disabled crumb.",
          preview: <SeparatorDemo />,
          code: separatorCode,
          minHeight: 240,
        },
      ]}
      usage={usage}
      props={[
        { name: "items", type: "BreadcrumbItem[]", description: "Trail from the root to the current page. The last item is the current page and is never a link. Empty renders nothing." },
        { name: "maxItems", type: "number", default: "4", description: "When there are more items than this, the middle collapses into a “…” menu." },
        { name: "separator", type: '"chevron" | "slash" | ReactNode', default: '"chevron"', description: "Separator between crumbs. Always hidden from screen readers." },
        { name: "itemsBeforeCollapse", type: "number", default: "1", description: "Items kept before the “…”." },
        { name: "itemsAfterCollapse", type: "number", default: "2", description: "Items kept after the “…”. At least 1, so the current page stays visible." },
        { name: "renderLink", type: "(props: BreadcrumbLinkProps) => ReactNode", default: "<a>", description: "Renders every link, including those in the menu and the back link. Use it for next/link." },
        { name: "showHomeIcon", type: "boolean", default: "false", description: "House icon on the first item, unless it has its own icon." },
        { name: "homeIconOnly", type: "boolean", default: "false", description: "With showHomeIcon, hides the first label visually. It stays in the accessible name." },
        { name: "mobileBackLink", type: "boolean", default: "false", description: "When the trail has less than about 448px (a container query, so it reacts to its own width), shows a compact “← Parent” link instead." },
        { name: "backLabel", type: "(parent: BreadcrumbItem) => string", default: "parent.label", description: "Visible text of the back link." },
        { name: "backAriaLabel", type: "(parent: BreadcrumbItem) => string", default: '"Back to {label}"', description: "Accessible name of the back link." },
        { name: "label", type: "string", default: '"Breadcrumb"', description: "Accessible name of the nav landmark. Change it when a page has more than one trail." },
        { name: "expandLabel", type: "(count: number) => string", default: '"Show {n} more"', description: "Accessible name of the “…” button." },
        { name: "maxLabelWidth", type: "string", default: '"12rem"', description: "Labels wider than this truncate and get a tooltip. Any CSS length." },
        { name: "loading", type: "boolean", default: "false", description: "Shows skeleton crumbs and sets aria-busy." },
        { name: "loadingLabel", type: "string", default: '"Loading breadcrumb"', description: "Announced while loading." },
        { name: "loadingCount", type: "number", default: "3", description: "Number of skeleton crumbs." },
        { name: "className", type: "string", description: "Classes for the nav element." },
      ]}
      types={[
        {
          name: "BreadcrumbItem",
          props: [
            { name: "label", type: "string", description: "Visible text and accessible name." },
            { name: "href", type: "string", description: "Link target. Items without one render as plain text." },
            { name: "icon", type: "ReactNode", description: "Icon before the label, sized to 16px." },
            { name: "disabled", type: "boolean", default: "false", description: "Muted, non-interactive text." },
          ],
        },
        {
          name: "BreadcrumbLinkProps",
          props: [
            { name: "href", type: "string", description: "Link target." },
            { name: "className", type: "string", description: "Styles for the link, including hover, active and focus-visible states. Pass it through." },
            { name: "children", type: "ReactNode", description: "Icon and label." },
            { name: "item", type: "BreadcrumbItem", description: "The item being rendered." },
          ],
        },
      ]}
      accessibility={[
        "A nav landmark labelled “Breadcrumb” wraps an ordered list. Separators are aria-hidden, so screen readers hear only the crumbs.",
        "The last item is plain text with aria-current=\"page\".",
        "The “…” button is named “Show 3 more” and exposes aria-expanded and aria-controls. Arrow Down or Up opens it and moves into the list; arrows, Home and End move between links; Escape closes and returns focus; Tab out or a click outside closes it.",
        "Truncation is visual only: the full label stays in the DOM. When a label is cut off, a tooltip shows it on hover and focus, and a truncated current page becomes focusable so keyboard users can reveal it.",
        "Every link, the “…” button and the back link are at least 40px tall with a visible focus ring. Reduced motion removes the menu animation and color transitions.",
      ]}
    />
  );
}
