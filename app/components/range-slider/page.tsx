import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { AgeDemo, PriceDemo, TimeDemo } from "./demos";

export const metadata: Metadata = {
  title: "Dual Range Slider",
  description: "Two-thumb range slider with a histogram that highlights the selected range, synced number inputs and full keyboard support.",
};

const priceCode = `
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const [range, setRange] = useState<RangeValue>([120, 640]);

<RangeSlider
  label="Price range"
  min={0}
  max={1000}
  step={10}
  minGap={50}
  value={range}
  onChange={setRange}
  onChangeEnd={(r) => refetchProducts(r)}   // fires on release, key press or input blur
  formatValue={(n) => usd.format(n)}
  histogram={priceBuckets}                  // 40 bar heights from $0 to $1000
  histogramLoading={isFetching}
  showInputs
  inputPrefix="$"
  thumbLabels={["Minimum price", "Maximum price"]}
  name={["price_min", "price_max"]}         // hidden inputs for native forms
/>`;

const ageCode = `
const [range, setRange] = useState<RangeValue>([25, 34]);

<RangeSlider
  label="Age"
  min={18}
  max={65}
  minGap={1}
  value={range}
  onChange={setRange}
  formatValue={(n) => (n === 65 ? "65+" : String(n))}
  thumbLabels={["Youngest age", "Oldest age"]}
  error={range[1] - range[0] < 5 ? "Pick a span of at least 5 years." : undefined}
  disabled={disabled}
/>`;

const timeCode = `
function formatTime(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return \`\${h12}:\${String(minutes % 60).padStart(2, "0")} \${h24 < 12 ? "AM" : "PM"}\`;
}

<RangeSlider
  ariaLabel="Quiet hours"
  min={360}          // 6:00 AM
  max={1380}         // 11:00 PM
  step={15}
  minGap={60}
  defaultValue={[540, 1020]}
  formatValue={formatTime}
  tooltip="always"
  showValue={false}
  thumbLabels={["Start time", "End time"]}
  className="[--rs-accent:#0d9488] dark:[--rs-accent:#2dd4bf]"
/>`;

const usage = `
import { RangeSlider } from "@/components/ui/range-slider";

export function Example() {
  return <RangeSlider label="Volume" min={0} max={100} defaultValue={[20, 80]} minGap={10} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="range-slider"
      examples={[
        {
          title: "Price filter",
          description:
            "$0 to $1000 with a histogram whose bars light up exactly up to each thumb, synced inputs, a $50 minimum gap and a loading state for the counts.",
          preview: <PriceDemo />,
          code: priceCode,
          minHeight: 360,
        },
        {
          title: "Age range",
          description: "18 to 65 with a custom label for the top value, a validation error and a disabled toggle.",
          preview: <AgeDemo />,
          code: ageCode,
        },
        {
          title: "Time of day",
          description: "Minutes since midnight formatted as 9:00 AM, 15-minute steps, tooltips always on and a custom accent color.",
          preview: <TimeDemo />,
          code: timeCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "min", type: "number", default: "0", description: "Lowest selectable value." },
        { name: "max", type: "number", default: "100", description: "Highest selectable value." },
        { name: "step", type: "number", default: "1", description: "Increment between values. PageUp and PageDown move ten steps." },
        { name: "value", type: "[number, number]", description: "Selected range (controlled)." },
        { name: "defaultValue", type: "[number, number]", default: "[min, max]", description: "Initial range (uncontrolled)." },
        { name: "onChange", type: "(value: [number, number]) => void", description: "Fires on every change while dragging, typing or pressing keys." },
        { name: "onChangeEnd", type: "(value: [number, number]) => void", description: "Fires once per committed change: pointer released, key pressed or input blurred." },
        { name: "minGap", type: "number", default: "0", description: "Smallest distance between the thumbs, so they can never cross." },
        { name: "formatValue", type: "(n: number) => string", default: "String", description: "Formats the readout, tooltips, input hints and aria-valuetext." },
        { name: "showInputs", type: "boolean", default: "false", description: "Two number inputs synced both ways. Valid numbers move the thumbs while typing; the rest are clamped on blur." },
        { name: "histogram", type: "number[]", description: "Bar heights spread evenly from min to max. Bars inside the range are highlighted, partly covered bars split at the thumb." },
        { name: "histogramLoading", type: "boolean", default: "false", description: "Pulsing skeleton bars in place of the histogram." },
        { name: "histogramHeight", type: "number", default: "56", description: "Histogram height in pixels." },
        { name: "histogramEmptyText", type: "string", default: '"No data for this range"', description: "Shown when the histogram is empty or all zeros." },
        { name: "disabled", type: "boolean", default: "false", description: "Disables dragging, keys and inputs." },
        { name: "label", type: "ReactNode", description: "Visible label. Names the group." },
        { name: "ariaLabel", type: "string", description: "Accessible name when there is no visible label." },
        { name: "thumbLabels", type: "[string, string]", default: '["Minimum", "Maximum"]', description: "Accessible names of the two thumbs." },
        { name: "inputLabels", type: "[string, string]", default: "thumbLabels", description: "Visible labels of the inputs." },
        { name: "inputPrefix", type: "string", description: 'Shown inside the inputs before the number, e.g. "$".' },
        { name: "inputSuffix", type: "string", description: 'Shown inside the inputs after the number, e.g. "kg".' },
        { name: "showValue", type: "boolean", default: "true", description: 'The formatted "low – high" readout next to the label.' },
        { name: "separator", type: "string", default: '"–"', description: "Text between the two values." },
        { name: "tooltip", type: '"auto" | "always" | "never"', default: '"auto"', description: "auto shows the value above a thumb while hovering, focusing or dragging it." },
        { name: "error", type: "ReactNode", description: "Error message below the slider. Turns the accent red and sets aria-invalid on the thumbs." },
        { name: "inputErrorText", type: "(low: string, high: string) => string", default: '"Enter a value from …"', description: "Message for an out-of-range number in an input." },
        { name: "name", type: "[string, string]", description: "Names of two hidden inputs so the range posts with a native form." },
        { name: "className", type: "string", description: "Classes for the root. Set --rs-accent, --rs-bar and --rs-bar-on to recolor." },
      ]}
      accessibility={[
        'Each thumb is role="slider" with aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext from formatValue. The limits of each thumb account for the other thumb and minGap.',
        "Arrow keys move one step, PageUp and PageDown ten steps, Home and End jump to the thumb's limits.",
        'The two thumbs sit in a role="group" named by the label, and each has its own name, e.g. "Minimum price".',
        "Pointer drags use pointer capture, so dragging keeps working outside the track. Clicking the track or a bar moves the nearest thumb; when the thumbs overlap, the drag direction picks one.",
        "Each thumb has a 40px hit area and a visible focus ring. The inputs have visible labels and announce out-of-range errors.",
        "Errors set aria-invalid and are linked with aria-describedby. Reduced motion removes the glide and tooltip transitions.",
      ]}
    />
  );
}
