import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { AnalyticsDemo, HotelDemo, LocaleDemo } from "./demos";

export const metadata: Metadata = {
  title: "Date Range Picker",
  description: "Two-month range calendar with presets, hover preview, disabled dates and a full keyboard grid, built on native Date and Intl.",
};

const analyticsCode = `
const today = new Date(2026, 9, 15);
const [range, setRange] = useState<DateRange>({ from: addDays(today, -6), to: today });

<DateRangePicker
  value={range}
  onChange={setRange}
  today={today}            // fixed reference date: same output on server and client
  maxDate={today}          // no future data; presets are clamped to it
  minDate={new Date(2025, 0, 1)}
  align="end"
/>`;

const hotelCode = `
const SOLD_OUT = new Set(["2026-10-27", "2026-10-28", "2026-11-05"]);

const STAY_PRESETS: DateRangePreset[] = [
  { id: "tonight", label: "Tonight", range: (t) => ({ from: t, to: addDays(t, 1) }) },
  { id: "weekend", label: "This weekend", range: (t) => ({ from: nextFriday(t), to: addDays(nextFriday(t), 2) }) },
  { id: "week", label: "7 nights", range: (t) => ({ from: addDays(t, 1), to: addDays(t, 8) }) },
];

<DateRangePicker
  label="Check-in to check-out"
  value={stay}
  onChange={setStay}
  today={today}
  minDate={today}                                   // past dates disabled
  isDateDisabled={(d) => SOLD_OUT.has(toIso(d))}    // sold-out nights
  minSpan={1}                                       // at least one night
  weekStartsOn={1}
  presets={STAY_PRESETS}
  formatSummary={({ from, to }) => \`\${differenceInDays(from, to)} nights\`}
  error={error}
  labels={{ placeholder: "Add dates", pickStart: "Select check-in", pickEnd: "Select check-out" }}
/>`;

const localeCode = `
<DateRangePicker
  label="Zeitraum"
  locale="de-DE"
  weekStartsOn={1}
  numberOfMonths={1}
  presets={false}
  defaultValue={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 9) }}
  labels={{ to: "bis", apply: "Übernehmen", cancel: "Abbrechen", placeholder: "Datum wählen" }}
/>

<DateRangePicker label="Billing period" defaultValue={september} disabled />`;

const usage = `
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";

export function Example() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  return <DateRangePicker label="Dates" value={range} onChange={setRange} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="date-range-picker"
      examples={[
        {
          title: "Analytics date filter",
          description:
            "Presets in the sidebar, future dates disabled, and the popover aligned to the end of the toolbar. Hover a second day to preview the range before you click.",
          preview: <AnalyticsDemo />,
          code: analyticsCode,
          minHeight: 600,
          center: false,
        },
        {
          title: "Hotel booking",
          description:
            "Past dates disabled, sold-out nights struck through, a one-night minimum, and a range can't cross a sold-out night. Submit without dates to see the error state.",
          preview: <HotelDemo />,
          code: hotelCode,
          minHeight: 640,
          center: false,
        },
        {
          title: "Locale and states",
          description: "German month and weekday names with Monday first and one month, next to a disabled field.",
          preview: <LocaleDemo />,
          code: localeCode,
          minHeight: 520,
          center: false,
        },
      ]}
      usage={usage}
      props={[
        { name: "value", type: "{ from: Date | null; to: Date | null } | null", description: "Selected range (controlled)." },
        { name: "defaultValue", type: "DateRange | null", default: "null", description: "Initial range (uncontrolled)." },
        { name: "onChange", type: "(range: DateRange) => void", description: "Called on Apply and when the field is cleared." },
        { name: "presets", type: "DateRangePreset[] | false", default: "DEFAULT_PRESETS", description: "Today, Last 7 days, Last 30 days, This month, Last month. A Custom entry is always added. false hides the sidebar." },
        { name: "minDate", type: "Date", description: "Earliest selectable day. Presets are clamped to it." },
        { name: "maxDate", type: "Date", description: "Latest selectable day. Presets are clamped to it." },
        { name: "isDateDisabled", type: "(date: Date) => boolean", description: "Marks single days unavailable. They are struck through and announced as unavailable." },
        { name: "allowDisabledInRange", type: "boolean", default: "false", description: "Allow a range to span disabled days." },
        { name: "minSpan", type: "number", default: "0", description: "Minimum days between start and end, e.g. 1 for one night." },
        { name: "numberOfMonths", type: "number", default: "2", description: "Months side by side on wide screens." },
        { name: "singleMonthBelow", type: "number", default: "800", description: "Viewport width (px) under which one month is shown." },
        { name: "weekStartsOn", type: "0 | 1 | 2 | 3 | 4 | 5 | 6", default: "0", description: "First day of the week, 0 = Sunday." },
        { name: "locale", type: "string", default: '"en-US"', description: "Locale for month names, weekdays and the field text." },
        { name: "today", type: "Date", description: "Reference date for presets and the today dot. Defaults to the client's date after mount." },
        { name: "label", type: "string", description: "Visible label above the field." },
        { name: "description", type: "string", description: "Helper text under the field." },
        { name: "error", type: "string", description: "Error text under the field, with a red border." },
        { name: "disabled", type: "boolean", default: "false", description: "Disables the field." },
        { name: "clearable", type: "boolean", default: "true", description: "Shows a clear button when a range is set." },
        { name: "align", type: '"start" | "end"', default: '"start"', description: "Popover alignment. It shifts to stay inside the viewport." },
        { name: "formatValue", type: "(range: { from: Date; to: Date }) => string", default: '"Mar 4 to Mar 18, 2026"', description: "Field text for a complete range." },
        { name: "formatSummary", type: "(range: { from: Date; to: Date }) => string", default: '"15 days"', description: "Footer summary of the draft range." },
        { name: "labels", type: "Partial<DateRangePickerLabels>", description: "Every visible and spoken string, including announcement builders." },
        { name: "className", type: "string", description: "Classes for the wrapper. The field is max-w-xs by default." },
      ]}
      types={[
        {
          name: "DateRangePreset",
          props: [
            { name: "id", type: "string", description: "Stable key." },
            { name: "label", type: "string", description: "Button text." },
            { name: "range", type: "(today: Date) => { from: Date; to: Date }", description: "Builds the range from today. Disabled when it can't fit minDate, maxDate or disabled days." },
          ],
        },
        {
          name: "Date helpers",
          props: [
            { name: "addDays / addMonths", type: "(d: Date, n: number) => Date", description: "Native Date arithmetic. addMonths clamps the day (Jan 31 + 1 = Feb 28)." },
            { name: "startOfMonth / endOfMonth / startOfDay", type: "(d: Date) => Date", description: "Exported for building presets." },
            { name: "startOfWeek", type: "(d: Date, weekStartsOn?: number) => Date", description: "Start of the week containing d." },
            { name: "differenceInDays", type: "(a: Date, b: Date) => number", description: "Whole days from a to b, safe across DST changes." },
          ],
        },
      ]}
      accessibility={[
        "The field is a button with aria-haspopup=\"dialog\" and aria-expanded; its name combines the label and the current range. Helper and error text are linked with aria-describedby.",
        "The popover is a labelled dialog. Each month is a role=\"grid\" named by its month heading, with full weekday names for screen readers.",
        "One day is tabbable (roving tabindex). Arrows move by day and week, Home/End to the week's start and end, Page Up/Down by month (Shift for a year); moving past the visible months pages the calendar.",
        "Days have full-date aria-labels (\"Thursday, October 15, 2026, today\"), aria-selected for every day in the range, aria-current=\"date\" for today and aria-disabled for unavailable days, which stay focusable.",
        "A polite live region announces the start date, the finished range and why a range was rejected.",
        "Escape or a click outside cancels and returns focus to the field; Apply commits. All targets are at least 40px and reduced motion removes the open animation.",
      ]}
    />
  );
}
