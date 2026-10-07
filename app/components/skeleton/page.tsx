import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { FeedDemo, PresetsDemo, PrimitivesDemo } from "./demos";

export const metadata: Metadata = {
  title: "Skeleton Loader Kit",
  description:
    "Skeletons that remember the real shape: after content loads once, every text line, image and button is measured, and the next load draws that exact layout. Plus primitives, presets, a page-synchronised shimmer and a 'still loading' message.",
};

const feedCode = `
const [loading, setLoading] = useState(true);

<SkeletonWrapper
  loading={loading}
  animation="shimmer"          // default for every skeleton inside the fallback
  label="Loading posts"
  loadedText="3 posts loaded"
  // Shape memory: after the first load the real layout is measured and saved,
  // and every later load draws that exact shape instead of the fallback
  rememberKey="home-feed"
  slowAfter={4000}             // "Still loading… thanks for waiting." after 4s
  fallback={posts.map((p) => <PostSkeleton key={p.id} image={p.image} />)}
>
  {posts.map((p) => <PostView key={p.id} post={p} />)}
</SkeletonWrapper>

// Mirror the real layout so nothing jumps when data lands
function PostSkeleton({ image }: { image?: boolean }) {
  return (
    <div className="flex gap-3 rounded-xl border p-4">
      <SkeletonCircle size={40} />
      <div className="flex-1">
        <Skeleton width={96} height={12} />
        <SkeletonText lines={2} lineHeight={10} gap={10} className="mt-2" />
        {image && <Skeleton height={160} radius={8} className="mt-3" />}
      </div>
    </div>
  );
}`;

const presetsCode = `
<SkeletonCard />
<SkeletonProfile />

<SkeletonListItem />
<SkeletonListItem lines={3} />
<SkeletonListItem trailing={false} />

<table>
  <tbody aria-busy="true">
    <SkeletonTableRow columns={3} leadingCircle />
    <SkeletonTableRow columns={3} leadingCircle widths={["55%", "40%", "30%"]} />
  </tbody>
</table>`;

const primitivesCode = `
<SkeletonCircle size={48} animation="pulse" />
<Skeleton height={88} radius={12} animation="pulse" />
<Skeleton width={72} height={28} radius={9999} animation="pulse" />
<SkeletonText lines={4} animation="pulse" />`;

const usage = `
import { SkeletonCard, SkeletonWrapper } from "@/components/ui/skeleton";

export function Example({ data }: { data?: Article }) {
  return (
    <SkeletonWrapper loading={!data} fallback={<SkeletonCard />}>
      {data && <ArticleCard article={data} />}
    </SkeletonWrapper>
  );
}`;

const animationType = '"shimmer" | "pulse" | "none"';

export default function Page() {
  return (
    <ComponentPage
      slug="skeleton"
      examples={[
        {
          title: "Loading feed",
          description:
            "The first load uses a hand-made skeleton. Turn loading off once and the real posts are measured: every text line, avatar, image, button and card outline. Refresh again and the skeleton is the exact shape of your content, even after a page reload.",
          preview: <FeedDemo />,
          code: feedCode,
          minHeight: 640,
        },
        {
          title: "Presets",
          description: "Card, profile, list item and table row presets, built from the same primitives.",
          preview: <PresetsDemo />,
          code: presetsCode,
          minHeight: 520,
        },
        {
          title: "Primitives and animations",
          description:
            "The shimmer is pinned to the viewport, so every block on the page catches the same sweep of light. Pulse fades the blocks; none keeps them static.",
          preview: <PrimitivesDemo />,
          code: primitivesCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "width", type: "number | string", default: '"100%"', description: "Skeleton width. Numbers are px; strings are any CSS length." },
        { name: "height", type: "number | string", default: "16", description: "Skeleton height." },
        { name: "radius", type: "number | string", default: "8", description: "Corner radius. SkeletonCircle is always round." },
        { name: "animation", type: animationType, default: '"shimmer"', description: "Per shape. Falls back to the SkeletonWrapper's animation, then shimmer." },
        { name: "className / style", type: "string / CSSProperties", description: "Extra classes or styles, e.g. a tinted background." },
      ]}
      types={[
        {
          name: "SkeletonText",
          props: [
            { name: "lines", type: "number", default: "3", description: "Number of lines." },
            { name: "gap", type: "number | string", default: "8", description: "Space between lines." },
            { name: "lineHeight", type: "number | string", default: "12", description: "Height of each line." },
            { name: "lastLineWidth", type: "number | string", default: '"60%"', description: "Width of the last line, so the block reads as a paragraph." },
            { name: "widths", type: "(number | string)[]", default: '["100%", "96%", "92%", "98%"]', description: "Widths of the other lines, cycled." },
            { name: "radius / animation / className", type: "…", description: "Same as Skeleton." },
          ],
        },
        {
          name: "SkeletonCircle",
          props: [
            { name: "size", type: "number | string", default: "40", description: "Diameter." },
            { name: "animation / className", type: "…", description: "Same as Skeleton." },
          ],
        },
        {
          name: "SkeletonWrapper",
          props: [
            { name: "loading", type: "boolean", description: "Show the fallback instead of the children. Required." },
            { name: "fallback", type: "ReactNode", description: "Skeleton layout shown while loading. Required." },
            { name: "children", type: "ReactNode", description: "Real content, faded in when loading ends." },
            { name: "label", type: "string", default: '"Loading content"', description: "Accessible name of the busy container." },
            { name: "loadedText", type: "string", default: '"Content loaded"', description: "Announced politely when loading ends. Pass \"\" to stay silent." },
            { name: "animation", type: animationType, description: "Default animation for every skeleton in the fallback." },
            { name: "fadeDuration", type: "number", default: "400", description: "Fade-in duration of the children in ms." },
            { name: "rememberKey", type: "string", description: "Turns on shape memory. After each load the real content is measured (text lines via Range.getClientRects, media and controls as blocks, round painted elements as circles, bordered surfaces as outlines) and saved under this key; later loads draw that shape instead of the fallback." },
            { name: "persistShape", type: "boolean", default: "true", description: "Also keep remembered shapes in localStorage, so they survive a reload. Read only after hydration." },
            { name: "onMeasure", type: "(layout: SkeletonLayout) => void", description: "Called with each new measurement." },
            { name: "slowAfter", type: "number | null", default: "4000", description: "After this many ms of loading, show and announce slowText. null turns it off." },
            { name: "slowText", type: "string", default: '"Still loading… thanks for waiting."', description: "Message for slow loads." },
            { name: "className", type: "string", description: "Classes for the container (both states)." },
          ],
        },
        {
          name: "Shape memory helpers",
          props: [
            { name: "measureSkeletonLayout(el, options?)", type: "(HTMLElement, { maxBlocks?, minSize? }) => SkeletonLayout", default: "160, 3", description: "Measures any element's visible shape. x and w are stored as fractions of the width, so the shape survives resizes." },
            { name: "<SkeletonFromLayout layout />", type: "{ layout, animation?, className? }", description: "Draws a measured layout as positioned skeleton blocks." },
            { name: "forgetSkeletonLayout(key)", type: "(key: string) => void", description: "Forgets a remembered shape, e.g. after a redesign." },
          ],
        },
        {
          name: "Presets",
          props: [
            { name: "SkeletonCard", type: "{ media?, mediaHeight?, lines?, footer?, bordered? }", default: "true, 160, 2, true, true", description: "Media block, title, text and an avatar footer." },
            { name: "SkeletonListItem", type: "{ avatarSize?, lines?, trailing? }", default: "40, 2, true", description: "Avatar, lines and a trailing block." },
            { name: "SkeletonTableRow", type: "{ columns?, widths?, leadingCircle?, cellClassName? }", default: "4, …, false", description: "A <tr>; render it inside a <tbody>." },
            { name: "SkeletonProfile", type: "{ avatarSize?, stats?, lines?, bordered? }", default: "72, 3, 3, true", description: "Avatar, name, stat blocks and bio." },
            { name: "animation / className", type: "…", description: "Accepted by every preset." },
          ],
        },
      ]}
      accessibility={[
        "While loading, the wrapper is a role=\"status\" container with aria-busy=\"true\" and aria-label \"Loading content\" (configurable), so it is announced as busy rather than read shape by shape.",
        "Every skeleton shape and preset is aria-hidden; only the label is exposed.",
        "When loading ends, aria-busy turns false and a polite live region says \"Content loaded\" (configurable, or silent).",
        "A slow load adds \"Still loading… thanks for waiting.\" inside the role=\"status\" container, so screen reader users hear it once too.",
        "Remembered shapes are aria-hidden like every other skeleton; only the label is exposed.",
        "With prefers-reduced-motion, shimmer and pulse stop and the shapes are static; the content appears without the fade.",
        "Skeleton colors are zinc-200 on light and zinc-800 on dark, visible against cards in both themes.",
      ]}
    />
  );
}
