import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { SaasHeaderDemo, SimpleHeaderDemo } from "./demos";

export const metadata: Metadata = {
  title: "Mega Menu Navbar",
  description: "Sticky site header with hover-intent mega panels, featured cards, a focus-trapped mobile menu with accordions and a blur on scroll.",
};

const saasCode = `
const items: MegaMenuItem[] = [
  {
    label: "Products",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Scheduling", href: "/products/scheduling", description: "Find a time that works.", icon: <CalendarClock /> },
          { label: "Automations", href: "/products/automations", icon: <Workflow />, badge: "New" },
          { label: "Data export", href: "/developers/export", icon: <Database />, disabled: true },
        ],
      },
      { title: "Developers", links: [/* … */] },
    ],
    featured: {
      eyebrow: "What's new",
      title: "Fernway 4.0 is here",
      href: "/blog/fernway-4",
      cta: "Read the launch post",
      media: <LaunchArt />,
    },
  },
  { label: "Solutions", columns: [/* … */], featured: { /* … */ } },
  { label: "Resources", columns: [/* … */], featured: { /* … */ } },
  { label: "Pricing", href: "/pricing" },
];

const router = useRouter();

<MegaMenuNavbar
  logo={<Logo />}
  logoLabel="Fernway home"
  items={items}
  activeHref={pathname}
  onNavigate={(href, e) => {
    e.preventDefault();       // client-side routing
    router.push(href);
  }}
  actions={
    <>
      <a href="/login">Sign in</a>
      <a href="/signup">Start free</a>
    </>
  }
/>`;

const simpleCode = `
<MegaMenuNavbar
  logo={<Logo />}
  sticky={false}
  activeHref="/overview"
  items={[
    { label: "Overview", href: "/overview" },
    { label: "Changelog", href: "/changelog" },
    { label: "Docs", href: "/docs" },
    { label: "Careers", disabled: true },
  ]}
/>`;

const usage = `
import { MegaMenuNavbar } from "@/components/ui/mega-menu-navbar";

export function SiteHeader() {
  return (
    <MegaMenuNavbar
      logo={<span className="font-semibold">Acme</span>}
      items={[
        {
          label: "Product",
          columns: [{ title: "Features", links: [{ label: "Analytics", href: "/analytics" }] }],
        },
        { label: "Pricing", href: "/pricing" },
      ]}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="mega-menu-navbar"
      examples={[
        {
          title: "SaaS header",
          description:
            "Products, Solutions and Resources open full-width panels with icon links and a featured card; Pricing is a plain link. Scroll inside the frame to see the sticky header blur, and switch the preview to 768 or 375 for the mobile menu.",
          preview: <SaasHeaderDemo />,
          code: saasCode,
          minHeight: 600,
          center: false,
        },
        {
          title: "Links only, not sticky",
          description: "No panels, no actions, a disabled item and an active link. The header scrolls away with the page.",
          preview: <SimpleHeaderDemo />,
          code: simpleCode,
          minHeight: 360,
          center: false,
        },
      ]}
      usage={usage}
      props={[
        { name: "logo", type: "ReactNode", description: "Logo content, e.g. an SVG and a wordmark. Wrapped in a link." },
        { name: "logoHref", type: "string", default: '"/"', description: "Where the logo links to." },
        { name: "logoLabel", type: "string", default: '"Home"', description: "Accessible name of the logo link." },
        { name: "items", type: "MegaMenuItem[]", description: "Top-level items. Items with columns open a panel, the rest are links." },
        { name: "actions", type: "ReactNode", description: "Right-side actions on wide headers." },
        { name: "mobileActions", type: "ReactNode", default: "actions", description: "Actions pinned to the bottom of the mobile menu, stretched to full width." },
        { name: "sticky", type: "boolean", default: "true", description: "Sticks to the top of the nearest scroll container." },
        { name: "activeHref", type: "string", description: 'Marks the matching link with aria-current="page" and its top item with a dot.' },
        { name: "openDelay", type: "number", default: "150", description: "Hover intent delay in ms. Moving to another item while a panel is open switches instantly." },
        { name: "closeDelay", type: "number", default: "200", description: "Grace period in ms after the pointer leaves the header." },
        { name: "scrollThreshold", type: "number", default: "8", description: "Scroll distance in px before the blur, shadow and shorter bar kick in." },
        { name: "onNavigate", type: "(href: string, event: MouseEvent) => void", description: "Called on every link click before menus close. Call preventDefault for client-side routing." },
        { name: "label", type: "string", default: '"Main"', description: "Accessible name of the navigation." },
        { name: "menuLabels", type: "{ open: string; close: string }", default: '{ open: "Open menu", close: "Close menu" }', description: "Accessible names of the hamburger button." },
        { name: "className", type: "string", description: "Classes for the header." },
        { name: "containerClassName", type: "string", default: '"mx-auto w-full max-w-7xl px-4 sm:px-6"', description: "Width container shared by the bar, the panels and the mobile menu." },
      ]}
      types={[
        {
          name: "MegaMenuItem",
          props: [
            { name: "label", type: "string", description: "Top-level text." },
            { name: "href", type: "string", description: "Link target when there are no columns." },
            { name: "columns", type: "{ title: string; links: MegaMenuLink[] }[]", description: "Columns of links in the panel." },
            { name: "featured", type: "MegaMenuFeatured", description: "Promo card at the end of the panel." },
            { name: "disabled", type: "boolean", default: "false", description: "Shown but not interactive." },
          ],
        },
        {
          name: "MegaMenuLink",
          props: [
            { name: "label", type: "string", description: "Link text." },
            { name: "href", type: "string", description: "Link target." },
            { name: "description", type: "string", description: "One line under the label." },
            { name: "icon", type: "ReactNode", description: "Icon shown in a tile; tints on hover." },
            { name: "badge", type: "string", description: 'Pill after the label, e.g. "New".' },
            { name: "disabled", type: "boolean", default: "false", description: "Shown at half opacity, not a link." },
          ],
        },
        {
          name: "MegaMenuFeatured",
          props: [
            { name: "eyebrow", type: "string", description: "Small text above the title." },
            { name: "title", type: "string", description: "Card title." },
            { name: "description", type: "string", description: "Card body (hidden in the compact mobile card)." },
            { name: "href", type: "string", description: "The whole card is one link." },
            { name: "cta", type: "string", description: "Call to action with an arrow." },
            { name: "media", type: "ReactNode", description: "Artwork at the top of the card." },
          ],
        },
      ]}
      accessibility={[
        "Items with panels are disclosure buttons with aria-expanded and aria-controls; plain items are links. The bar is a <nav> named by label.",
        "Left and Right arrows move between top items, Home and End jump to the ends, Down opens a panel and focuses its first link, Up and Down move between links inside it.",
        "Esc closes the open panel and returns focus to its button. Tabbing or clicking outside also closes it; closed panels are inert so they are skipped by Tab.",
        "Hover opens after a 150ms intent delay and only for mouse pointers, so touch and pen users open panels with a tap.",
        "The mobile menu traps focus between the menu button and the menu, closes with Esc (focus returns to the button), locks background scroll, and uses accordion buttons with aria-expanded.",
        'The current page is marked with aria-current="page". Every control is at least 40px tall with a visible focus ring; reduced motion turns off the panel, accordion and icon transitions.',
      ]}
    />
  );
}
