import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { HistoryDemo, ReleasesDemo } from "./demos";

export const metadata: Metadata = {
  title: "Vertical Timeline",
  description: "Alternating vertical timeline whose line fills as you scroll, with milestone items and container-aware layout.",
};

const historyCode = `
const history: TimelineItem[] = [
  {
    id: "founded",
    date: "2019-04",             // goes into <time dateTime>
    dateLabel: "April 2019",     // what people see
    title: "Two founders, one spare bedroom",
    description: "Fernway starts as a weekend project…",
    icon: <Sprout />,
    tag: "Founding",
  },
  {
    id: "v1",
    date: "2021-06-15",
    dateLabel: "June 15, 2021",
    title: "Fernway 1.0 launches publicly",
    icon: <Rocket />,
    tag: "Launch",
    highlight: true,             // milestone: glowing node and accented card
  },
  // …
];

<Timeline items={history} label="Fernway company history, 2019 to 2026" />`;

const releasesCode = `
<Timeline
  items={releases}               // items with href get a full-card link
  loading={isLoading}            // skeleton items, aria-busy
  alternate={false}              // one line on the left, dates in their own column
  animateOnScroll={false}
  milestoneText="Latest"
  emptyText="No releases yet. Check back after the first ship."
  label="Release notes"
/>`;

const usage = `
import { Timeline, type TimelineItem } from "@/components/ui/timeline";

const items: TimelineItem[] = [
  { id: "a", date: "2024-01", dateLabel: "Jan 2024", title: "Kickoff" },
  { id: "b", date: "2024-06", dateLabel: "Jun 2024", title: "Beta", highlight: true },
];

export function Example() {
  return <Timeline items={items} label="Project history" />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="timeline"
      examples={[
        {
          title: "Company history",
          description:
            "2019 to 2026 with icons, tags and two highlighted milestones. Cards alternate around a center line on wide containers and stack on a left line on narrow ones; switch the preview width to see it.",
          preview: <HistoryDemo />,
          code: historyCode,
          minHeight: 600,
        },
        {
          title: "Release notes and states",
          description: "Single-line layout with linked cards, plus the loading skeleton and the empty state.",
          preview: <ReleasesDemo />,
          code: releasesCode,
          minHeight: 420,
        },
      ]}
      usage={usage}
      props={[
        { name: "items", type: "TimelineItem[]", description: "Events in display order." },
        { name: "alternate", type: "boolean", default: "true", description: "Alternate cards left and right of a center line when the container is at least 672px wide. Off: one line on the left with a date column." },
        { name: "animateOnScroll", type: "boolean", default: "true", description: "Items glide in from a dimmed but readable resting state as they enter the viewport. Server-rendered fully visible." },
        { name: "fillOnScroll", type: "boolean", default: "true", description: "The line fills as you scroll and lights up each node it passes." },
        { name: "fillAnchor", type: "number", default: "0.6", description: "Where the fill tip sits, as a fraction of the viewport height." },
        { name: "label", type: "string", description: "Accessible name of the list." },
        { name: "loading", type: "boolean", default: "false", description: "Shows skeleton items and sets aria-busy." },
        { name: "skeletonCount", type: "number", default: "3", description: "Skeleton items while loading." },
        { name: "loadingText", type: "string", default: '"Loading timeline…"', description: "Screen reader text while loading." },
        { name: "emptyText", type: "ReactNode", default: '"Nothing on the timeline yet."', description: "Shown when items is empty." },
        { name: "tagLabel", type: "string", default: '"Category"', description: "Screen reader prefix read before each tag." },
        { name: "milestoneText", type: "string", default: '"Milestone"', description: 'Eyebrow on highlighted cards. "" hides it.' },
        { name: "headingLevel", type: "2 | 3 | 4", default: "3", description: "Heading level of each item title." },
        { name: "className", type: "string", description: "Classes for the root. Set --timeline-surface to your page background so nodes cut cleanly through the line." },
      ]}
      types={[
        {
          name: "TimelineItem",
          props: [
            { name: "id", type: "string", description: "Unique key." },
            { name: "date", type: "string", description: 'Machine-readable date for <time dateTime>, e.g. "2021-06" or "2021-06-15".' },
            { name: "dateLabel", type: "string", default: "date", description: "Visible date text." },
            { name: "title", type: "string", description: "Card heading." },
            { name: "description", type: "ReactNode", description: "Card body." },
            { name: "icon", type: "ReactNode", description: "Icon inside the node. Defaults to a dot." },
            { name: "tag", type: "string", description: "Pill next to the date." },
            { name: "highlight", type: "boolean", default: "false", description: "Milestone styling: larger glowing node and an accented card." },
            { name: "href", type: "string", description: "Turns the title into a link that covers the whole card." },
          ],
        },
      ]}
      accessibility={[
        "Renders an <ol> named by label, so screen readers announce the number of events and each position.",
        "Each date is a <time dateTime> element; tags are prefixed with a hidden \"Category:\" label.",
        "Titles are real headings (h3 by default) for quick navigation. Linked cards show a focus ring on the whole card.",
        "Everything is visible in the server render; the scroll fill and reveal are added after mount and only dim items that are below the fold.",
        "With prefers-reduced-motion the line is drawn full, every node is lit, and the reveal and milestone glow are off.",
        "Loading shows a polite status message and aria-busy; decorative line and nodes are aria-hidden.",
      ]}
    />
  );
}
