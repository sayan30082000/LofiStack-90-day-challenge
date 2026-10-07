import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { GameCoverDemo, ImageCardDemo, MembershipDemo } from "./demos";

export const metadata: Metadata = {
  title: "3D Tilt Card",
  description: "Card that tilts in 3D toward the pointer with a moving glare, parallax depth layers and a drifting shadow.",
};

const membershipCode = `
<TiltCard
  wrapperClassName="w-full max-w-[22rem]"
  className="aspect-[1.586/1] w-full rounded-2xl bg-[linear-gradient(135deg,#1e1b4b,#3730a3_45%,#6d28d9)] text-white"
>
  <div className="absolute inset-0 flex flex-col justify-between p-5">
    <div className="flex items-start justify-between">
      <p data-depth="30" className="font-mono text-[11px] tracking-[0.32em]">LOFI MEMBER</p>
      <Chip data-depth="45" />
    </div>
    <p data-depth="40" className="font-mono text-xl tracking-[0.14em]">4096 2187 0042 9918</p>
    <div className="flex items-end justify-between">
      <p data-depth="25">Alex Rivera</p>
      <button data-depth="35" type="button" onClick={copy}>Copy number</button>
    </div>
  </div>
</TiltCard>`;

const gameCode = `
<TiltCard
  maxTilt={16}
  perspective={800}
  glareColor="rgb(255 237 213 / 0.7)"
  wrapperClassName="w-full max-w-[15rem]"
  className="aspect-[3/4] w-full rounded-2xl bg-[#140a2e] text-white"
>
  <SkyArt className="absolute inset-0 overflow-hidden rounded-[inherit]" />
  {/* Each layer clips itself: overflow-hidden on the card would flatten the 3D */}
  <MountainArt data-depth="18" className="absolute inset-0 overflow-hidden rounded-[inherit]" />
  <div className="absolute inset-0 flex flex-col justify-between p-4">
    <Badges data-depth="40" />
    <h3 data-depth="65">NEON DRIFT</h3>
    <button data-depth="30" type="button">Add to library</button>
  </div>
</TiltCard>`;

const imageCode = `
<TiltCard
  maxTilt={maxTilt}
  perspective={perspective}
  glare={glare}
  disabled={disabled}
  wrapperClassName="w-full max-w-sm"
  className="rounded-2xl bg-white p-2 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
>
  <figure>
    <Image src="/demo/tilt-card/lake-at-dusk.svg" alt="…" width={800} height={600} className="rounded-xl" />
    <figcaption>Lake at dusk</figcaption>
  </figure>
</TiltCard>`;

const usage = `
import { TiltCard } from "@/components/ui/tilt-card";

export function Example() {
  return (
    <TiltCard className="rounded-2xl bg-zinc-900 p-6 text-white">
      <h3 data-depth="30" className="text-lg font-semibold">Hover me</h3>
      <p data-depth="15" className="text-sm text-zinc-300">Layers with data-depth lift off the card.</p>
    </TiltCard>
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="tilt-card"
      examples={[
        {
          title: "Membership card",
          description:
            "Name, number, chip and wordmark sit on separate data-depth layers, so they lift off the card while you hover. Press to push it down.",
          preview: <MembershipDemo />,
          code: membershipCode,
          minHeight: 320,
        },
        {
          title: "Game cover",
          description: "Five depth layers from sky to title, a lower perspective for a stronger effect and a warm glare.",
          preview: <GameCoverDemo />,
          code: gameCode,
          minHeight: 420,
        },
        {
          title: "Plain image card",
          description: "A single image with no depth layers. Adjust the props live, or disable the effect.",
          preview: <ImageCardDemo />,
          code: imageCode,
          minHeight: 380,
        },
      ]}
      usage={usage}
      props={[
        { name: "children", type: "ReactNode", description: "Card content. Descendants with data-depth=\"<px>\" get a translateZ for parallax." },
        { name: "maxTilt", type: "number", default: "12", description: "Maximum rotation on each axis, in degrees." },
        { name: "glare", type: "boolean", default: "true", description: "Highlight that follows the pointer." },
        { name: "glareColor", type: "string", default: '"rgb(255 255 255 / 0.55)"', description: "Any CSS color for the center of the glare." },
        { name: "scale", type: "number", default: "1.03", description: "Scale while hovered; pressing shrinks it slightly." },
        { name: "perspective", type: "number", default: "1000", description: "CSS perspective in px. Lower is more dramatic." },
        { name: "shadow", type: "boolean", default: "true", description: "Soft shadow that drifts away from the pointer." },
        { name: "resetDuration", type: "number", default: "600", description: "Ease back to rest after the pointer leaves, in ms." },
        { name: "disabled", type: "boolean", default: "false", description: "Flat card with no tilt, glare or lift." },
        { name: "className", type: "string", description: "Classes for the tilting surface. Don't add overflow-hidden here; clip each layer instead." },
        { name: "wrapperClassName", type: "string", description: "Classes for the untransformed outer wrapper, e.g. width." },
      ]}
      accessibility={[
        "The motion is decorative: no roles or labels are added, and children keep their own semantics and tab order.",
        "Keyboard users get feedback through focus-within: the card lifts a few pixels and depth layers rise halfway.",
        "Touch input never tilts the card, so scrolling past it on a phone is unaffected.",
        "With prefers-reduced-motion the card stays flat: no rotation, scale, glare or transitions. The focus lift stays, without animation.",
        "Glare and shadow layers are aria-hidden and ignore pointer events, so links and buttons inside stay clickable.",
      ]}
    />
  );
}
