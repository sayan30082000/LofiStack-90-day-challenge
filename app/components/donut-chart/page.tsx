import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { ExpensesDemo, StatesDemo, TrafficDemo } from "./demos";

export const metadata: Metadata = {
  title: "Donut Chart",
  description: "Hand-built SVG donut chart with parallel-edged gaps, hover push-out, a live center readout and legend toggles that re-animate.",
};

const expensesCode = `
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

<DonutChart
  label="September expenses by category"
  data={[
    { label: "Rent", value: 1650 },
    { label: "Groceries", value: 540 },
    { label: "Savings", value: 600 },
    { label: "Dining out", value: 320 },
    // …
  ]}
  format={(v) => usd.format(v)}
  centerLabel="spent this month"
  legendPosition="right"   // falls back to bottom below 32rem
  size={260}
  thickness={34}
  onHiddenChange={setHidden}
/>`;

const trafficCode = `
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

<DonutChart
  label={\`Website visits by source, last \${range}\`}
  data={traffic[range]}        // new data tweens from the old angles
  format={(v) => compact.format(v)}
  centerLabel="visits"
  legendPosition="bottom"
  size={220}
  thickness={22}
  gap={4}
  hoverOffset={8}
/>`;

const statesCode = `
<DonutChart label="Sprint time" data={budget} loading />          // pulsing ring + legend skeleton
<DonutChart label="Sprint time" data={[]} emptyText="No time logged this sprint" />
<DonutChart
  label="Sprint time by discipline"
  data={[
    { label: "Design", value: 42, color: "#6366f1" },   // custom colors per segment
    { label: "Engineering", value: 35, color: "#0ea5e9" },
    { label: "Research", value: 23, color: "#14b8a6" },
  ]}
  format={(v) => \`\${v}h\`}
  thickness={44}
  cornerRadius={4}
/>`;

const usage = `
import { DonutChart } from "@/components/ui/donut-chart";

export function Example() {
  return (
    <DonutChart
      label="Revenue by plan"
      data={[
        { label: "Starter", value: 1200 },
        { label: "Team", value: 3400 },
        { label: "Enterprise", value: 5100 },
      ]}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="donut-chart"
      examples={[
        {
          title: "Monthly expense breakdown",
          description:
            "Hover a segment or a legend item to push it out and read its value and share in the center. Click legend items to hide categories; the remaining arcs re-flow with a tween instead of redrawing.",
          preview: <ExpensesDemo />,
          code: expensesCode,
          minHeight: 400,
        },
        {
          title: "Traffic sources",
          description: "A thinner ring with the legend below. Switching the date range animates each arc from its old angle to its new one. On touch, tap a segment to pin it.",
          preview: <TrafficDemo />,
          code: trafficCode,
          minHeight: 460,
        },
        {
          title: "Loading, empty and custom colors",
          description: "A skeleton ring while loading, a neutral track with a message when there is nothing to show, and per-segment colors.",
          preview: <StatesDemo />,
          code: statesCode,
          minHeight: 400,
        },
      ]}
      usage={usage}
      props={[
        { name: "data", type: "DonutDatum[]", description: "Segments in drawing order, clockwise from 12 o'clock. Labels must be unique." },
        { name: "label", type: "string", default: '"Donut chart"', description: "Accessible name, start of the spoken summary and caption of the screen-reader table." },
        { name: "size", type: "number", default: "240", description: "Maximum width in px. The SVG uses a viewBox, so it shrinks with its container." },
        { name: "thickness", type: "number", default: "36", description: "Ring thickness at full size." },
        { name: "gap", type: "number", default: "3", description: "Gap between segments in px. Edges stay parallel because the angular pad shrinks with the radius." },
        { name: "cornerRadius", type: "number", default: "2", description: "Rounding of segment corners." },
        { name: "hoverOffset", type: "number", default: "6", description: "How far the active segment moves outward." },
        { name: "format", type: "(value: number) => string", default: "en-US number", description: "Formats values in the center, legend and table." },
        { name: "formatPercent", type: "(fraction: number) => string", default: '"42%" / "4.5%"', description: "Formats shares of the visible total." },
        { name: "centerLabel", type: "ReactNode", default: '"Total"', description: "Text under the total in the center." },
        { name: "showLegend", type: "boolean", default: "true", description: "Legend with values, shares and visibility toggles." },
        { name: "legendPosition", type: '"right" | "bottom"', default: '"right"', description: "right falls back to bottom when the container is narrower than 32rem." },
        { name: "colors", type: "string[]", default: "8-hue palette", description: "Palette assigned by position in data, so hiding a segment never repaints the others. A segment's own color wins." },
        { name: "defaultHidden", type: "string[]", default: "[]", description: "Labels hidden on first render." },
        { name: "onHiddenChange", type: "(hidden: string[]) => void", description: "Called with the hidden labels after a legend toggle." },
        { name: "loading", type: "boolean", default: "false", description: "Shows a pulsing skeleton ring and legend. Data sweeps in when it turns off." },
        { name: "loadingText", type: "string", default: '"Loading chart…"', description: "Center text and accessible name while loading." },
        { name: "emptyText", type: "string", default: '"No data yet"', description: "Shown when data is empty or sums to 0." },
        { name: "allHiddenText", type: "string", default: '"All categories hidden"', description: "Shown when every segment is toggled off." },
        { name: "hiddenText", type: "string", default: '"hidden"', description: "Screen-reader suffix for hidden legend items and table rows." },
        { name: "tableHeaders", type: "[string, string, string]", default: '["Category", "Value", "Share"]', description: "Headers of the screen-reader table." },
        { name: "animationDuration", type: "number", default: "700", description: "Mount and toggle tween in ms. 0 or reduced motion jumps straight to the result." },
        { name: "className", type: "string", description: "Classes for the root element." },
      ]}
      types={[
        {
          name: "DonutDatum",
          props: [
            { name: "label", type: "string", description: "Category name, unique within the chart." },
            { name: "value", type: "number", description: "Non-negative value. Negative values count as 0." },
            { name: "color", type: "string", description: "Any CSS color for this segment." },
          ],
        },
        {
          name: "computeDonutArcs(values, hidden?)",
          props: [
            { name: "values", type: "number[]", description: "Segment values." },
            { name: "hidden", type: "boolean[]", default: "[]", description: "Hidden segments get a zero sweep at their position." },
            { name: "returns", type: "{ start, end, fraction }[]", description: "Angles in radians from 12 o'clock, clockwise, and each share of the visible total." },
          ],
        },
      ]}
      accessibility={[
        "The SVG has role=\"img\" and an aria-label summary: the name, the visible total and every visible segment with its value and share.",
        "A visually hidden <table> with a caption lists every category, its value and its share (or \"hidden\").",
        "Legend items are buttons with aria-pressed (pressed = shown). Focusing one highlights its segment exactly like hover does.",
        "Identity is never color alone: every segment is named in the legend and table, and hidden items are struck through as well as hollow.",
        "The default palette is a fixed-order, colorblind-checked set with separate light and dark steps; text never uses series colors.",
        "Reduced motion removes the sweep, the toggle tween and the push-out transition.",
      ]}
    />
  );
}
