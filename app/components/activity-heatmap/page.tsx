import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { ContributionsDemo, ReadingDemo, StatesDemo } from "./demos";

export const metadata: Metadata = {
  title: "Activity Heatmap",
  description: "GitHub-style contribution calendar in hand-built SVG with tooltips, keyboard navigation and a year selector.",
};

const contributionsCode = `
const [range, setRange] = useState<HeatmapRange>("rolling");
const [selected, setSelected] = useState<HeatmapDay | null>(null);

<ActivityHeatmap
  data={contributions}          // { date: "2026-03-04", count: 12 }[]
  endDate="2026-09-30"          // fixed, so server and client render the same grid
  range={range}                 // "rolling" (last 365 days) or a year
  onRangeChange={setRange}
  selectedDate={selected?.date}
  onDayClick={setSelected}      // { date, count, level }
/>

{selected && <DayDetails day={selected} />}`;

const readingCode = `
<div className="[--read-1:var(--color-emerald-200)] dark:[--read-1:var(--color-emerald-900)] ...">
  <ActivityHeatmap
    data={reading}
    weekStart={1}                       // Monday rows first
    levels={[1, 20, 40, 60]}            // minimum minutes for levels 1-4
    colorScale={["var(--read-0)", "var(--read-1)", "var(--read-2)", "var(--read-3)", "var(--read-4)"]}
    unit="minutes read"
    unitSingular="minute read"
    showYearSelector={false}
    focusableCells={false}              // a single role="img" with a summary
    legendLabels={["0 min", "60+ min"]}
    formatDay={(d, date) => (d.count ? \`\${d.count} min on \${date}\` : \`Didn't read on \${date}\`)}
  />
</div>`;

const statesCode = `
<ActivityHeatmap data={[]} loading />                       // pulsing skeleton grid
<ActivityHeatmap data={[]} endDate="2026-09-30"
  emptyText="No contributions yet. Push your first commit!" />
<ActivityHeatmap data={[]} error={<>Couldn't load activity. <RetryButton /></>} />`;

const usage = `
import { ActivityHeatmap } from "@/components/ui/activity-heatmap";

export function Activity({ days }: { days: { date: string; count: number }[] }) {
  return <ActivityHeatmap data={days} onDayClick={(d) => console.log(d.date, d.count)} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="activity-heatmap"
      examples={[
        {
          title: "Contributions",
          description:
            "Two and a half years of seeded data. Pick the rolling year or a calendar year, hover or focus a day for its tooltip, click it for details, and hover the legend to isolate one intensity level. On narrow screens the grid scrolls, starting at the latest week.",
          preview: <ContributionsDemo />,
          code: contributionsCode,
          minHeight: 460,
        },
        {
          title: "Custom scale and thresholds",
          description:
            "Reading minutes with fixed thresholds, a theme-aware emerald scale through CSS variables, Monday-first rows and a non-interactive image mode.",
          preview: <ReadingDemo />,
          code: readingCode,
        },
        {
          title: "Loading, empty and error",
          description: "Skeleton while data loads, an empty grid with a message, and an error with retry.",
          preview: <StatesDemo />,
          code: statesCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "data", type: "{ date: string; count: number }[]", description: "One entry per day, date as YYYY-MM-DD. Missing days count as 0; duplicates are summed." },
        { name: "endDate", type: "string", default: "latest date in data", description: "Last day shown. Falls back to today on the client when data is empty. Pass a fixed date for prerendered pages." },
        { name: "levels", type: 'number[] | "quantile"', default: '"quantile"', description: "Minimum count for levels 1-4, or quartiles of the non-zero days in the visible range." },
        { name: "colorScale", type: "string[]", description: "Five CSS colors for levels 0-4. CSS variables let it follow the theme. Defaults to an indigo ramp with separate light and dark steps." },
        { name: "onDayClick", type: "(day: HeatmapDay) => void", description: "Click, or Enter/Space on the focused day." },
        { name: "selectedDate", type: "string", description: "Draws a ring around this day and sets aria-selected." },
        { name: "weekStart", type: "0 | 1", default: "0", description: "First row: 0 Sunday, 1 Monday." },
        { name: "unit", type: "string", default: '"contributions"', description: "Plural unit used in the header, tooltips and summary." },
        { name: "unitSingular", type: "string", default: "unit without trailing s", description: "Used when a count is exactly 1." },
        { name: "locale", type: "string", default: '"en-US"', description: "Locale for month, weekday, date and number formatting." },
        { name: "cellSize", type: "number", default: "12", description: "Cell size in px." },
        { name: "cellGap", type: "number", default: "3", description: "Gap between cells in px." },
        { name: "range", type: '"rolling" | number', description: "Selected range (controlled): the 365 days ending at endDate, or a calendar year." },
        { name: "defaultRange", type: '"rolling" | number', default: '"rolling"', description: "Initial range (uncontrolled)." },
        { name: "onRangeChange", type: "(range: HeatmapRange) => void", description: "Fired by the year selector." },
        { name: "showYearSelector", type: "boolean", default: "true", description: "Year buttons from the latest year back to the first year in data." },
        { name: "rollingLabel", type: "string", default: '"Last year"', description: "Label of the rolling-range button." },
        { name: "yearSelectorLabel", type: "string", default: '"Year"', description: "Accessible name of the year buttons group." },
        { name: "formatTotal", type: "(total: number, range: HeatmapRange) => ReactNode", description: "Header text. Defaults to \"1,234 contributions in the last year\"." },
        { name: "formatDay", type: "(day: HeatmapDay, formattedDate: string) => string", description: "Tooltip and cell label. Defaults to \"12 contributions on Mar 4, 2026\"." },
        { name: "legendLabels", type: "[string, string]", default: '["Less", "More"]', description: "Legend end labels." },
        { name: "focusableCells", type: "boolean", default: "true", description: "Arrow-key navigable cells. When false the SVG is a single role=\"img\" with the summary." },
        { name: "loading", type: "boolean", default: "false", description: "Pulsing skeleton grid; disables the year selector." },
        { name: "error", type: "ReactNode", description: "Replaces the grid with an alert." },
        { name: "emptyText", type: "string", default: '"No activity in this period yet."', description: "Shown over the grid when the range has no activity." },
        { name: "className", type: "string", description: "Classes for the root." },
      ]}
      types={[
        {
          name: "HeatmapDay",
          props: [
            { name: "date", type: "string", description: "YYYY-MM-DD." },
            { name: "count", type: "number", description: "Total for the day." },
            { name: "level", type: "number", description: "Intensity level, 0 (none) to 4 (most)." },
          ],
        },
      ]}
      accessibility={[
        "The SVG has an accessible summary: total for the range plus the busiest day. With focusableCells={false} it is a single role=\"img\".",
        "With focusable cells (default) the SVG is a role=\"grid\" of 7 weekday rows; each cell is a gridcell labelled like \"12 contributions on Mar 4, 2026\", with aria-selected on the selected day.",
        "One Tab stop (roving tabindex). Left/Right move a week, Up/Down a day, Home/End the start/end of the week, Ctrl+Home/End the whole range, PageUp/PageDown four weeks, Enter/Space clicks.",
        "The visible tooltip mirrors the cell label and is aria-hidden; the header total is a polite live region so a new year's total is announced.",
        "Color is never the only cue: every value is in the tooltip and label. The indigo ramp uses separate light and dark steps, and cells keep a faint outline so empty days stay visible.",
        "Year buttons are 40px tall with aria-pressed. Reduced motion turns off the column-by-column entrance and the skeleton pulse.",
      ]}
    />
  );
}
