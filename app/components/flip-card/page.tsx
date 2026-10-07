import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { FlashcardDemo, PostcardDemo, TeamCardDemo, TicketDemo } from "./demos";

export const metadata: Metadata = {
  title: "Flip Card",
  description:
    "A flip card that behaves like a real card: it turns away from where you press, leans toward your cursor to show which way it will go, and lets you press and hold to peek at the back.",
};

const postcardCode = `
<FlipCard
  // direction="auto" (default): press near the left/right edge to turn sideways,
  // near the top/bottom to turn up or down, always away from your finger
  className="aspect-[3/2] w-full"
  label="Turn the postcard over"
  tiltHint          // leans toward a hovering mouse (default)
  peekOnHold        // hold 350ms to peek, let go to return (default)
  onPeek={(peeking) => console.log({ peeking })}
  front={<PostcardFront />}
  back={<PostcardMessage />}
/>`;

const flashcardCode = `
const [index, setIndex] = useState(0);
const [flipped, setFlipped] = useState(false);
const card = words[index];

<FlipCard
  key={index}               // a fresh, unflipped card for every word
  className="h-72"
  flipped={flipped}
  onFlip={setFlipped}
  label={\`Show the meaning of \${card.word}\`}
  front={<WordFace word={card} />}
  back={
    <div className="flex h-full flex-col p-6">
      <p>{card.definition}</p>
      <button onClick={() => mark("learning")}>Still learning</button>
      <button onClick={() => mark("known")}>Got it</button>
    </div>
  }
/>

<button onClick={() => { setIndex(index - 1); setFlipped(false); }}>Previous</button>
<button onClick={() => { setIndex(index + 1); setFlipped(false); }}>Next</button>`;

const teamCode = `
<FlipCard
  trigger="hover"
  className="h-80 w-full max-w-xs"
  label="Show more about Maya Okafor"
  front={<ProfileFront />}
  back={
    <div className="flex h-full flex-col bg-zinc-900 p-6 text-zinc-100">
      <p>Builds the component library and owns the motion guidelines.</p>
      <a href="mailto:maya@example.com">Email</a>
      <button onClick={copyEmail}>Copy email</button>
    </div>
  }
  backClassName="border-zinc-800"
/>`;

const ticketCode = `
<FlipCard
  direction="vertical"
  className="h-56"
  label="Show ticket code"
  controlPosition="bottom-right"
  front={<TicketFront />}
  back={<TicketCode />}
/>`;

const usage = `
import { FlipCard } from "@/components/ui/flip-card";

export function Example() {
  return (
    <FlipCard
      className="h-48 w-64"
      front={<div className="grid h-full place-items-center">Question</div>}
      back={<div className="grid h-full place-items-center">Answer</div>}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="flip-card"
      examples={[
        {
          title: "A card that turns like paper",
          description:
            "Press near any edge and the card turns away from that spot. Hover with a mouse and it leans toward the way it will turn. Press and hold to peek at the back, then let go.",
          preview: <PostcardDemo />,
          code: postcardCode,
          minHeight: 420,
        },
        {
          title: "Vocabulary flashcards",
          description:
            "A controlled 3-card deck with Previous / Next. The back face holds real buttons, and clicking them never flips the card.",
          preview: <FlashcardDemo />,
          code: flashcardCode,
          minHeight: 460,
        },
        {
          title: "Hover team card",
          description:
            "Flips on mouse hover. On touch screens a tap flips it, and keyboard users use the corner button, then Tab into the back face links.",
          preview: <TeamCardDemo />,
          code: teamCode,
          minHeight: 380,
        },
        {
          title: "Vertical flip",
          description: "Rotates around the X axis, with the flip button moved to the bottom-right corner.",
          preview: <TicketDemo />,
          code: ticketCode,
          minHeight: 320,
        },
      ]}
      usage={usage}
      props={[
        { name: "front", type: "ReactNode", description: "Content of the front face. Required." },
        { name: "back", type: "ReactNode", description: "Content of the back face. Can hold buttons, links and inputs. Required." },
        { name: "trigger", type: '"click" | "hover"', default: '"click"', description: "click: the surface and the button flip it. hover: mouse hover flips it; taps and the button still toggle." },
        { name: "direction", type: '"auto" | "horizontal" | "vertical"', default: '"auto"', description: "auto picks sideways or up/down from where you press. horizontal and vertical fix the axis. In every mode the card turns away from the pressed point and returns the way it came." },
        { name: "flipped", type: "boolean", description: "Shows the back face (controlled)." },
        { name: "defaultFlipped", type: "boolean", default: "false", description: "Initial state (uncontrolled)." },
        { name: "onFlip", type: "(flipped: boolean) => void", description: "Called with the requested state." },
        { name: "label", type: "string", default: '"Flip card"', description: "Accessible name of the flip button." },
        { name: "showControl", type: "boolean", default: "true", description: "Render the 40px corner flip button. Only turn off if you provide your own control." },
        { name: "controlPosition", type: '"top-left" | "top-right" | "bottom-left" | "bottom-right"', default: '"top-right"', description: "Corner of the flip button." },
        { name: "controlIcon", type: "ReactNode", description: "Replaces the default flip icon." },
        { name: "flipOnSurfaceClick", type: "boolean", default: "true", description: "In click mode, clicks on the card surface flip it. Clicks on interactive content and text selections never do." },
        { name: "tiltHint", type: "boolean", default: "true", description: "Leans the front up to tiltAngle degrees toward a hovering mouse, previewing the turn. Click trigger only; off with reduced motion." },
        { name: "tiltAngle", type: "number", default: "7", description: "Largest lean in degrees, reached at the edges." },
        { name: "peekOnHold", type: "boolean", default: "true", description: "Press and hold the surface to show the other side; letting go turns it back. The release never counts as a flip." },
        { name: "peekDelay", type: "number", default: "350", description: "Milliseconds of holding before a peek starts. Shorter presses are normal clicks." },
        { name: "onPeek", type: "(peeking: boolean) => void", description: "Called when a peek starts and ends." },
        { name: "duration", type: "number", default: "700", description: "Flip duration in ms. The flip overshoots slightly and the card dips back while turning." },
        { name: "perspective", type: "number", default: "1200", description: "Perspective distance in px. Smaller is more dramatic." },
        { name: "disabled", type: "boolean", default: "false", description: "Stops flipping and disables the button." },
        { name: "className", type: "string", description: "Classes for the root. Give the card a height or let the taller face decide." },
        { name: "faceClassName", type: "string", description: "Replaces the default surface (border, background, radius) of both faces." },
        { name: "frontClassName / backClassName", type: "string", description: "Extra classes merged onto one face." },
        { name: "controlClassName", type: "string", description: "Extra classes for the flip button." },
      ]}
      accessibility={[
        "The flip control is a real button with aria-pressed (true while the back shows) and an accessible label you can make specific, e.g. \"Show the meaning of Serendipity\". Enter and Space toggle it.",
        "The hidden face gets aria-hidden and inert, so its links and buttons can't be focused or clicked and screen readers skip it.",
        "Both faces sit in the same grid cell, so the card is always as tall as its taller face and nothing jumps when it flips.",
        "Hover cards still work without a mouse: a tap toggles on touch screens, and the button works from the keyboard.",
        "Pressing, leaning and peeking are extras for pointer users. Keyboard and screen reader users get the same content through the flip button, which flips sideways by default.",
        "Peeking never changes the flipped state or aria-pressed; the faces swap aria-hidden and inert while it lasts so focus never lands on the hidden side.",
        "With prefers-reduced-motion the 3D rotation and the lean are replaced by a 300ms crossfade, and the dip animation is turned off.",
      ]}
    />
  );
}
