import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { PhotoEditDemo, RedesignDemo, StatesDemo, VerticalDemo } from "./demos";

export const metadata: Metadata = {
  title: "Before/After Slider",
  description: "Draggable image comparison with clip-path reveal, click to jump, fading labels and full keyboard support.",
};

const photoCode = `
<BeforeAfterSlider
  before={{ src: "/demo/before-after-slider/landscape-before.svg", alt: "Unedited lake photo: flat grey sky" }}
  after={{ src: "/demo/before-after-slider/landscape-after.svg", alt: "Edited lake photo: warm sunset sky" }}
  aspectRatio="16 / 10"
  initial={42}
/>`;

const redesignCode = `
const [value, setValue] = useState(50);

<button onClick={() => setValue(100)}>Old site</button>
<button onClick={() => setValue(50)}>Split</button>
<button onClick={() => setValue(0)}>New site</button>

<BeforeAfterSlider
  before={{ src: "/demo/before-after-slider/site-before.svg", alt: "2009 homepage" }}
  after={{ src: "/demo/before-after-slider/site-after.svg", alt: "Redesigned homepage" }}
  labels={{ before: "2009", after: "2026" }}
  aspectRatio="16 / 10"
  value={value}
  onValueChange={setValue}
/>`;

const verticalCode = `
<BeforeAfterSlider
  orientation="vertical"
  before={{ src: "/demo/before-after-slider/city-day.svg", alt: "City skyline at midday" }}
  after={{ src: "/demo/before-after-slider/city-night.svg", alt: "The same skyline at night" }}
  labels={{ before: "Day", after: "Night" }}
  aspectRatio="3 / 4"
  initial={55}
/>`;

const statesCode = `
// A failed image shows an icon, errorText and its alt text in place.
<BeforeAfterSlider
  before={{ src: "/photos/missing.jpg", alt: "Original product shot" }}
  after={{ src: "/demo/before-after-slider/landscape-after.svg", alt: "Edited photo" }}
  errorText="Couldn't load this image"
  hint={false}
/>

// No corner labels, square frame.
<BeforeAfterSlider before={before} after={after} labels={false} aspectRatio={1} initial={70} />`;

const usage = `
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";

export function Example() {
  return (
    <BeforeAfterSlider
      before={{ src: "/before.jpg", alt: "Kitchen before the renovation" }}
      after={{ src: "/after.jpg", alt: "Kitchen after the renovation" }}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="before-after-slider"
      examples={[
        {
          title: "Photo edit",
          description:
            "The edited photo sits underneath; the original is clipped at the divider. Labels fade out as the divider reaches their edge.",
          preview: <PhotoEditDemo />,
          code: photoCode,
          minHeight: 360,
        },
        {
          title: "Website redesign",
          description: "Controlled with value and onValueChange, so outside buttons can jump to either version.",
          preview: <RedesignDemo />,
          code: redesignCode,
          minHeight: 400,
        },
        {
          title: "Vertical",
          description: "The divider moves up and down; Up and Down arrows follow it on screen.",
          preview: <VerticalDemo />,
          code: verticalCode,
          minHeight: 480,
        },
        {
          title: "Error and label-free states",
          description: "A broken image falls back to its alt text, and labels can be turned off.",
          preview: <StatesDemo />,
          code: statesCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "before", type: "{ src: string; alt: string }", description: "Image on the start side (left, or top when vertical). Required." },
        { name: "after", type: "{ src: string; alt: string }", description: "Image on the end side (right, or bottom when vertical). Required." },
        { name: "initial", type: "number", default: "50", description: "Starting percent of the before image that is visible (uncontrolled)." },
        { name: "value", type: "number", description: "Position from 0 to 100 (controlled)." },
        { name: "onValueChange", type: "(value: number) => void", description: "Called while dragging, on click and on key presses." },
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Direction the divider moves." },
        { name: "labels", type: "{ before: string; after: string } | false", default: '{ before: "Before", after: "After" }', description: "Corner labels. They fade near the edges. false hides them." },
        { name: "aspectRatio", type: "string | number", default: '"16 / 9"', description: "CSS aspect ratio of the frame. Images cover it." },
        { name: "step", type: "number", default: "1", description: "Arrow key step in percent. Shift + arrow and Page Up/Down move 10 steps." },
        { name: "handleLabel", type: "string", default: '"Comparison position"', description: "Accessible name of the handle." },
        { name: "formatValueText", type: "(value, labels) => string", default: '"50% before, 50% after"', description: "Builds aria-valuetext." },
        { name: "hint", type: "boolean", default: "true", description: "Nudges the handle twice after mount until the first interaction. Off with reduced motion." },
        { name: "errorText", type: "string", default: '"Image unavailable"', description: "Shown with the alt text when an image fails to load." },
        { name: "className", type: "string", description: "Classes for the frame, e.g. a max width or rounded corners." },
      ]}
      accessibility={[
        "The handle is role=\"slider\" named \"Comparison position\" with aria-valuenow, aria-valuemin/max, aria-orientation and a spoken aria-valuetext like \"62% before, 38% after\".",
        "Arrow keys move it by step (Shift for 10 steps), Page Up/Down by 10 steps, Home/End to either edge. The handle moves in the direction of the arrow.",
        "Both images keep their alt text; the corner labels and the percent readout are decorative and hidden from screen readers.",
        "Pointer down anywhere focuses the handle, so keyboard control continues from where you clicked.",
        "Touch: horizontal sliders still let the page scroll vertically (touch-action: pan-y).",
        "The 44px handle has a visible focus ring; reduced motion turns off the jump transition and the mount hint.",
      ]}
    />
  );
}
