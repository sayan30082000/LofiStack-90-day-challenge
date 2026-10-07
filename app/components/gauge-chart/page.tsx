import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { CpuDemo, CreditDemo, PageSpeedDemo } from "./demos";

export const metadata: Metadata = {
  title: "Gauge Chart",
  description: "SVG gauge with colored zones, ticks, a target marker and a needle that springs to the value.",
};

const cpuCode = `
const zones: GaugeZone[] = [
  { from: 0, to: 40, color: "#059669", label: "Normal" },
  { from: 40, to: 75, color: "#d97706", label: "Warning" },
  { from: 75, to: 100, color: "#e11d48", label: "Critical" },
];

const [cpu, setCpu] = useState(72);

<GaugeChart label="CPU usage" value={cpu} unit="%" zones={zones} size={300} />
<input type="range" min={0} max={100} value={cpu} onChange={(e) => setCpu(+e.target.value)} />

// States
<GaugeChart label="CPU usage" value={cpu} loading />
<GaugeChart label="CPU usage" value={null} />                       // "No data"
<GaugeChart label="CPU usage" value={cpu} error="Agent offline since 14:02" />`;

const creditCode = `
<GaugeChart
  label="Credit score"
  value={768}
  min={300}
  max={850}
  arc={270}
  zones={[
    { from: 300, to: 580, color: "#e11d48", label: "Poor" },
    { from: 580, to: 670, color: "#ea580c", label: "Fair" },
    { from: 670, to: 740, color: "#d97706", label: "Good" },
    { from: 740, to: 800, color: "#65a30d", label: "Very good" },
    { from: 800, to: 850, color: "#059669", label: "Exceptional" },
  ]}
  ticks={22}            // one tick every 25 points
  majorTickEvery={4}    // a long tick every 100
  target={740}
  targetLabel="Mortgage minimum"
/>`;

const speedCode = `
const [running, setRunning] = useState(false);

<GaugeChart
  label="Mobile performance"
  value={scores.mobile}
  arc={270}
  zones={[
    { from: 0, to: 50, color: "#e11d48", label: "Poor" },
    { from: 50, to: 90, color: "#d97706", label: "Needs work" },
    { from: 90, to: 100, color: "#059669", label: "Good" },
  ]}
  target={90}
  showLegend={false}
  loading={running}
  loadingText="Running Lighthouse…"
  size={220}
/>`;

const usage = `
import { GaugeChart } from "@/components/ui/gauge-chart";

export function DiskUsage({ percent }: { percent: number }) {
  // Without zones, a single indigo track fills up to the value.
  return <GaugeChart label="Disk usage" value={percent} unit="%" />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="gauge-chart"
      examples={[
        {
          title: "CPU usage",
          description:
            "A 180° gauge driven by a slider. The zones light up to the needle, and the needle overshoots a little before it settles. Switch states to see loading, empty and error.",
          preview: <CpuDemo />,
          code: cpuCode,
          minHeight: 460,
        },
        {
          title: "Credit score",
          description: "A 270° gauge from 300 to 850 with five zones, a target marker and a legend. Hover a zone for its range.",
          preview: <CreditDemo />,
          code: creditCode,
          minHeight: 460,
        },
        {
          title: "Page speed score",
          description: "Two compact gauges with a target at 90. Running the test shows the loading state, then both needles spring to the new scores.",
          preview: <PageSpeedDemo />,
          code: speedCode,
          minHeight: 380,
        },
      ]}
      usage={usage}
      props={[
        { name: "value", type: "number | null", description: "Current value, clamped to min and max. null or undefined shows the empty state." },
        { name: "label", type: "string", description: "Name of the measure. Shown above the gauge and used as the meter's accessible name. Required." },
        { name: "min", type: "number", default: "0", description: "Lowest value on the scale." },
        { name: "max", type: "number", default: "100", description: "Highest value on the scale." },
        { name: "zones", type: "GaugeZone[]", description: "Colored bands. The part up to the needle is lit, the rest is faded. Without zones a single track fills up to the value." },
        { name: "unit", type: "string", default: '""', description: "Unit after the value. % and ° attach directly, other units get a space." },
        { name: "target", type: "number", description: "Draws a marker across the arc and adds it to aria-valuetext." },
        { name: "targetLabel", type: "string", default: '"Target"', description: "Text before the target value." },
        { name: "arc", type: "180 | 270", default: "180", description: "Sweep of the arc in degrees." },
        { name: "size", type: "number", default: "260", description: "Maximum width in px. The gauge shrinks to fit narrower containers." },
        { name: "thickness", type: "number", default: "14", description: "Arc thickness in viewBox units (the gauge is 200 wide)." },
        { name: "ticks", type: "number", default: "10", description: "Tick intervals between min and max. 0 hides them." },
        { name: "majorTickEvery", type: "number", default: "5", description: "Every nth tick is long." },
        { name: "color", type: "string", default: "indigo", description: "Fill color when there are no zones." },
        { name: "format", type: "(value: number) => string", default: "integer or 1 decimal", description: "Formats the value, min/max labels, zone ranges and aria-valuetext." },
        { name: "valueText", type: "(formatted: string, zone?: GaugeZone) => string", default: '"72%, Warning"', description: "Builds aria-valuetext." },
        { name: "showLegend", type: "boolean", default: "true", description: "Zone legend with ranges. The current zone is bold." },
        { name: "hideLabel", type: "boolean", default: "false", description: "Hides the visible label. It stays the accessible name." },
        { name: "animate", type: "boolean", default: "true", description: "Spring animation for the needle. Always off with prefers-reduced-motion." },
        { name: "animateOnMount", type: "boolean", default: "true", description: "Sweep up from min on first render." },
        { name: "stiffness", type: "number", default: "170", description: "Spring stiffness. Higher is snappier." },
        { name: "damping", type: "number", default: "15", description: "Spring damping. Lower wobbles more." },
        { name: "loading", type: "boolean", default: "false", description: "Pulsing track, a spinner and aria-busy." },
        { name: "error", type: "string | boolean", description: "Error state with a message. true uses errorText." },
        { name: "errorText", type: "string", default: "\"Couldn't load this value\"", description: "Message for error={true}." },
        { name: "loadingText", type: "string", default: '"Loading…"', description: "Shown and announced while loading." },
        { name: "emptyText", type: "string", default: '"No data"', description: "Shown and announced when there is no value." },
        { name: "className", type: "string", description: "Classes for the outer wrapper." },
      ]}
      types={[
        {
          name: "GaugeZone",
          props: [
            { name: "from", type: "number", description: "Start of the zone, in value units." },
            { name: "to", type: "number", description: "End of the zone. The last zone includes its end." },
            { name: "color", type: "string", description: "Any CSS color. Use a step with at least 3:1 contrast on your surface." },
            { name: "label", type: "string", description: "Zone name, shown under the value and read in aria-valuetext." },
          ],
        },
      ]}
      accessibility={[
        "The gauge is role=\"meter\" with aria-valuenow, aria-valuemin, aria-valuemax and an aria-valuetext that includes the zone and target, e.g. “72%, Warning”.",
        "The visible label names the meter through aria-labelledby. With hideLabel it becomes aria-label.",
        "Loading, empty and error states have no value, so they switch to role=\"img\" with a label such as “CPU usage: No data”, and loading sets aria-busy.",
        "Color never carries meaning alone: the current zone is written under the value and in the legend, with the zone ranges as text.",
        "Zone colors in the demos are 600-level steps with at least 3:1 contrast on white and on zinc-900. Text uses neutral ink, never the zone color.",
        "With prefers-reduced-motion the needle jumps to the value instead of springing, and the loading pulse is removed.",
      ]}
    />
  );
}
