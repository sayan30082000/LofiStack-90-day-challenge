import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { OpticalDemo, TechStackDemo, TrustedByDemo, VerticalDemo } from "./demos";

export const metadata: Metadata = {
  title: "Logo Marquee",
  description:
    "A logo strip where every logo looks the same size: it measures each logo's ink and sizes wide, tall, thin and heavy logos to match. Rows move at the same pixel speed, and you can drag them.",
};

const opticalCode = `
// Logos with very different shapes: a square icon, a 440×40 wordmark,
// a heavy block, a file with lots of empty padding, a tall stacked logo…
<LogoMarquee
  items={logos}
  normalize        // default: measure each logo and size it optically
  logoHeight={28}  // the height a typical 3:1 wordmark gets
  gap={56}
  label="Customer logos"
/>

// The maths is exported and pure:
analyzeLogoPixels(rgba, width, height) // → { x, y, width, height, density } of the ink
opticalLogoHeight(inkAspect, density, 28) // → height for this logo's ink, in px`;

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
          title: "Logos that look the same size",
          description:
            "Six logos with very different shapes. Switch optical sizing off to see the usual result: equal heights make the wide wordmark shout and the padded file look tiny. Drag the strip to scrub through it.",
          preview: <OpticalDemo />,
          code: opticalCode,
          minHeight: 220,
        },
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
        { name: "pxPerSecond", type: "number", default: "40", description: "Speed in pixels per second. Every row moves at this speed, however many logos it has." },
        { name: "speed", type: "number", description: "Seconds per loop instead of pxPerSecond. Rows of different lengths then move at different speeds." },
        { name: "direction", type: '"left" | "right" | "up" | "down"', default: '"left"', description: "Direction of the first row. up and down make it vertical." },
        { name: "pauseOnHover", type: "boolean", default: "true", description: "Pause while hovered. Keyboard focus on a link inside always pauses." },
        { name: "draggable", type: "boolean", default: "true", description: "Grab a row and drag to scrub through it. A drag that ends on a link doesn't open it." },
        { name: "fade", type: "boolean", default: "true", description: "Mask the edges so logos fade in and out." },
        { name: "fadeSize", type: "number", default: "64", description: "Size of each edge fade, in px." },
        { name: "gap", type: "number", default: "48", description: "Space between logos, in px. Rows are gap / 2 apart." },
        { name: "rows", type: "number", default: "1", description: "Number of rows (columns when vertical). Every other row is reversed." },
        { name: "grayscale", type: "boolean", default: "true", description: "Grayscale until hovered or focused." },
        { name: "logoHeight", type: "number", default: "28", description: "Height of image logos, in px. With normalize, the height a typical 3:1 wordmark gets." },
        { name: "normalize", type: "boolean", default: "true", description: "Optical sizing: trim each image logo's empty padding, then size its ink by shape (1/√aspect) and weight (density) so all logos look equally big." },
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
            { name: "srcDark", type: "string", description: "Image URL used in dark mode. Sized like src." },
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
        "Dragging is an extra, never the only way: the pause button does the same job without a pointer, and a drag never opens a link by accident.",
        "Optical sizing only changes image sizes; nothing is announced differently, and logos without readable pixels (cross-origin images without CORS) fall back to their outer shape.",
      ]}
    />
  );
}
