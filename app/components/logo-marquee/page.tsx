import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { TechStackDemo, TrustedByDemo, VerticalDemo } from "./demos";

export const metadata: Metadata = {
  title: "Logo Marquee",
  description: "Infinite scrolling logo strip with edge fades, grayscale-to-color hover, multiple rows and a vertical variant.",
};

const trustedCode = `
const logos: LogoMarqueeItem[] = [
  { src: "/logos/lumaforge.svg", srcDark: "/logos/lumaforge-dark.svg", alt: "Lumaforge" },
  { src: "/logos/quillby.svg", srcDark: "/logos/quillby-dark.svg", alt: "Quillby" },
  { src: "/logos/orbitra.svg", srcDark: "/logos/orbitra-dark.svg", alt: "Orbitra", href: "https://example.com" },
  // …
];

<LogoMarquee
  items={logos}
  title={<p className="text-xs font-semibold uppercase tracking-[0.18em]">Trusted by product teams at</p>}
  speed={36}
  gap={56}
/>`;

const stackCode = `
const stack: LogoMarqueeItem[] = [
  { alt: "React 19", node: <Pill icon={Atom}>React 19</Pill> },
  { alt: "Next.js", node: <Pill icon={Triangle}>Next.js</Pill> },
  // … 12 items: the first half goes in row 1, the rest in row 2
];

<LogoMarquee
  items={stack}
  rows={2}          // row 2 moves the opposite way
  gap={12}
  speed={40}
  grayscale={false}
  fadeSize={96}
  label="Tech stack"
/>`;

const verticalCode = `
<LogoMarquee
  items={logos}
  direction="up"
  rows={2}
  height={280}
  gap={36}
  speed={24}
  logoHeight={24}
  label="Customer logos"
/>`;

const usage = `
import { LogoMarquee } from "@/components/ui/logo-marquee";

export function Logos() {
  return (
    <LogoMarquee
      label="Our customers"
      items={[
        { src: "/logos/acme.svg", alt: "Acme" },
        { src: "/logos/globex.svg", alt: "Globex" },
      ]}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="logo-marquee"
      examples={[
        {
          title: "Trusted by",
          description:
            "Fictional SVG wordmarks with light and dark versions. Grayscale until hovered, faded edges, paused on hover or with the button.",
          preview: <TrustedByDemo />,
          code: trustedCode,
          minHeight: 200,
        },
        {
          title: "Two-row tech stack",
          description: "rows={2} splits the items in half; the second row runs the other way. Items are custom nodes instead of images.",
          preview: <TechStackDemo />,
          code: stackCode,
          minHeight: 220,
        },
        {
          title: "Vertical",
          description: "direction=\"up\" scrolls a fixed-height column; with two rows you get two columns moving in opposite directions.",
          preview: <VerticalDemo />,
          code: verticalCode,
          minHeight: 340,
        },
      ]}
      usage={usage}
      props={[
        { name: "items", type: "LogoMarqueeItem[]", description: "Logos to scroll. Split across rows, in order, when rows > 1." },
        { name: "speed", type: "number", default: "30", description: "Seconds per loop. Higher is slower." },
        { name: "direction", type: '"left" | "right" | "up" | "down"', default: '"left"', description: "Direction of the first row. up and down make it vertical." },
        { name: "pauseOnHover", type: "boolean", default: "true", description: "Pause while hovered. Keyboard focus on a link inside always pauses." },
        { name: "fade", type: "boolean", default: "true", description: "Mask the edges so logos fade in and out." },
        { name: "fadeSize", type: "number", default: "64", description: "Size of each edge fade, in px." },
        { name: "gap", type: "number", default: "48", description: "Space between logos, in px. Rows are gap / 2 apart." },
        { name: "rows", type: "number", default: "1", description: "Number of rows (columns when vertical). Every other row is reversed." },
        { name: "grayscale", type: "boolean", default: "true", description: "Grayscale and dimmed until hovered or focused." },
        { name: "logoHeight", type: "number", default: "28", description: "Height of image logos, in px." },
        { name: "height", type: "number", default: "320", description: "Height of the marquee when vertical, in px." },
        { name: "title", type: "ReactNode", description: "Heading above the strip. Also names the region." },
        { name: "label", type: "string", default: '"Logos"', description: "Accessible name of the region when there is no title." },
        { name: "showControls", type: "boolean", default: "true", description: "Pause / play button." },
        { name: "pauseLabel / playLabel", type: "string", default: '"Pause logo animation" / "Play logo animation"', description: "Accessible labels of the control." },
        { name: "className", type: "string", description: "Classes for the outer section." },
        { name: "itemClassName", type: "string", description: "Classes for each logo cell." },
      ]}
      types={[
        {
          name: "LogoMarqueeItem",
          props: [
            { name: "src", type: "string", description: "Image URL." },
            { name: "srcDark", type: "string", description: "Image URL used in dark mode." },
            { name: "alt", type: "string", description: "Alt text, or the visible text fallback when there is no src or node. Required." },
            { name: "href", type: "string", description: "Makes the logo a link with a 40px target." },
            { name: "node", type: "ReactNode", description: "Custom content instead of an image." },
          ],
        },
      ]}
      accessibility={[
        "The strip is a <section> named by its title or label, and each set is a real list.",
        "The duplicate set that makes the loop seamless is aria-hidden and inert, so screen readers hear each logo once and links in it can't be tabbed to.",
        "A 40px pause / play button stops the motion for keyboard and touch users (WCAG 2.2.2). Hover and focus inside also pause it.",
        "With prefers-reduced-motion the animation stops, the duplicate set and the control are removed, and logos wrap into a static centered grid.",
        "Image logos need alt text; links show a visible focus ring and bring the logo back to full color.",
      ]}
    />
  );
}
