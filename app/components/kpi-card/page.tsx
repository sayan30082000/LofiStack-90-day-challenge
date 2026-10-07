import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { DashboardDemo, VariantsDemo } from "./demos";

export const metadata: Metadata = {
  title: "KPI Stat Card",
  description: "Metric tile with a count-up value, a trend delta that understands inverted metrics, and a hand-drawn SVG sparkline.",
};

const dashboardCode = `
<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
  <KpiCard
    label="Revenue"
    value={48290}
    previousValue={42970}
    format="currency"
    trend={[3100, 3420, 3380, 3710, 3650, 3990, 4120, 3980, 4310, 4460, 4390, 4720]}
    period="last month"
    icon={<DollarSign />}
    loading={loading}
  />
  <KpiCard label="Active users" value={12480} previousValue={11105} trend={users} period="last month" icon={<Users />} />
  <KpiCard
    label="Churn rate"
    value={0.024}            // fractions for format="percent": 2.4%
    previousValue={0.029}
    format="percent"
    invertTrend              // down is good: shows green
    trend={churn}
    period="last month"
    icon={<UserMinus />}
  />
  <KpiCard
    label="Avg response time"
    value={238}
    previousValue={212}
    formatOptions={{ style: "unit", unit: "millisecond", unitDisplay: "short" }}
    invertTrend
    trend={latency}
    period="last month"
    icon={<Gauge />}
  />
</div>`;

const variantsCode = `
// Any locale and currency, translated labels, neutral sparkline, whole card as a link.
<KpiCard
  label="Monthly recurring revenue"
  value={84210}
  previousValue={79300}
  format="currency"
  currency="EUR"
  locale="de-DE"
  period="Vormonat"
  labels={{ versus: "vs.", up: "Plus", down: "Minus", from: "gegenüber" }}
  trend={mrr}
  sparklineTone="neutral"
  href="/reports/mrr"
/>

// No change, no trend
<KpiCard label="Signups today" value={0} previousValue={0} period="yesterday" />

// Error
<KpiCard label="Conversion rate" value={0} format="percent" error="Couldn't load conversions." />`;

const usage = `
import { DollarSign } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";

export function Example() {
  return (
    <KpiCard
      label="Revenue"
      value={48290}
      previousValue={42970}
      format="currency"
      trend={[31, 34, 33, 37, 36, 40, 41, 40, 43, 45, 44, 47]}
      period="last month"
      icon={<DollarSign />}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="kpi-card"
      examples={[
        {
          title: "Dashboard row",
          description:
            "Four metrics with count-up values and sparklines. Churn and response time are inverted, so a drop is good news. Switch the range or turn on the loading skeleton.",
          preview: <DashboardDemo />,
          code: dashboardCode,
          minHeight: 360,
        },
        {
          title: "Locales, empty and error",
          description: "German formatting with a link card, a zero-change metric without a sparkline, and an error state.",
          preview: <VariantsDemo />,
          code: variantsCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "label", type: "string", description: "Metric name. Also names the card for assistive tech. Required." },
        { name: "value", type: "number", description: "Current value. Fractions for percent (0.024 = 2.4%). Required." },
        { name: "format", type: '"number" | "currency" | "percent" | "compact"', default: '"number"', description: "Intl.NumberFormat preset. compact gives 12.5K." },
        { name: "currency", type: "string", default: '"USD"', description: "ISO currency code for format=\"currency\"." },
        { name: "locale", type: "string", default: '"en-US"', description: "Locale for every number on the card." },
        { name: "formatOptions", type: "Intl.NumberFormatOptions", description: "Extra options merged over the preset, e.g. unit formatting." },
        { name: "previousValue", type: "number", description: "Enables the delta badge and the caption value." },
        { name: "invertTrend", type: "boolean", default: "false", description: "Down is good: decreases show green, increases red." },
        { name: "trend", type: "number[]", description: "Values oldest first, drawn as a sparkline with an emphasized last point." },
        { name: "trendLabels", type: "string[]", description: "Point names shown in the hover readout, e.g. months." },
        { name: "period", type: "string", default: '"last period"', description: "Comparison period. Caption reads \"vs last month\"." },
        { name: "icon", type: "ReactNode", description: "Icon in the top corner (decorative)." },
        { name: "loading", type: "boolean", default: "false", description: "Skeleton with aria-busy. Turning it off replays the count-up." },
        { name: "error", type: "string", description: "Shows this message instead of the value." },
        { name: "duration", type: "number", default: "1200", description: "Count-up length in ms. 0 or reduced motion shows the value at once." },
        { name: "sparklineTone", type: '"sentiment" | "neutral"', default: '"sentiment"', description: "Sparkline follows the delta color or stays indigo." },
        { name: "href", type: "string", description: "Renders the card as a link with hover, active and focus states." },
        { name: "formatSummary", type: "(info: KpiDeltaInfo, period: string) => string", description: "Replaces the screen reader delta summary." },
        { name: "labels", type: "Partial<KpiCardLabels>", description: "Words for the caption and the spoken summary: versus, up, down, flat, from, good, bad, loading." },
        { name: "className", type: "string", description: "Classes for the card." },
      ]}
      types={[
        {
          name: "KpiDeltaInfo",
          props: [
            { name: "change", type: "number | null", description: "Relative change (0.124 = +12.4%). null when previousValue is 0." },
            { name: "direction", type: '"up" | "down" | "flat"', description: "Direction of the change, after rounding to 0.1%." },
            { name: "sentiment", type: '"good" | "bad" | "neutral"', description: "Direction combined with invertTrend." },
            { name: "formatted", type: "string", description: "Signed percent, e.g. \"+12.4%\"." },
          ],
        },
      ]}
      accessibility={[
        "The card is a labelled group (or a link when href is set) named by the metric label.",
        "The counting number is hidden from screen readers; an sr-only copy holds the final value, so nothing is read mid-animation.",
        "The delta is conveyed by text, not color alone: a signed percent, an arrow icon, and an sr-only summary such as \"Up 12.4% from last month, an improvement.\"",
        "The sparkline and its hover readout are aria-hidden; the summary covers the trend.",
        "Loading sets aria-busy and announces \"Loading Revenue\"; errors use role=\"alert\".",
        "Reduced motion skips the count-up and the pulsing last point. Badge colors meet AA contrast in both themes.",
      ]}
    />
  );
}
