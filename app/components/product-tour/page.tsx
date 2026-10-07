import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { DashboardTourDemo } from "./demos";

export const metadata: Metadata = {
  title: "Onboarding Tour",
  description: "Step-by-step product tour with an SVG-masked spotlight, auto-flipping card with arrow, progress dots and full keyboard support.",
};

const dashboardCode = `
const steps: TourStep[] = [
  { target: '[data-tour="sidebar"]', title: "Navigate your workspace", content: "…", placement: "right" },
  { target: '[data-tour="search"]', title: "Find anything fast", content: "…", placement: "bottom" },
  { target: '[data-tour="new"]', title: "Start something new", content: "…", placement: "bottom" },
  { target: '[data-tour="chart"]', title: "Track progress", content: "…", placement: "top" },
];

const [open, setOpen] = useState(false);

<button onClick={() => setOpen(true)}>Take the tour</button>

<nav data-tour="sidebar">…</nav>
<input data-tour="search" />
<button data-tour="new">New project</button>
<section data-tour="chart">…</section>

<ProductTour
  steps={steps}
  open={open}
  onOpenChange={setOpen}
  startAt={0}
  onFinish={() => markOnboarded()}
  onSkip={(index) => track("tour_skipped", { index })}
/>`;

const usage = `
import { ProductTour, type TourStep } from "@/components/ui/product-tour";

const steps: TourStep[] = [
  { target: "#billing-link", title: "Billing moved", content: "Invoices now live under Settings." },
];

export function Example() {
  const [open, setOpen] = useState(true);
  return <ProductTour steps={steps} open={open} onOpenChange={setOpen} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="product-tour"
      examples={[
        {
          title: "Dashboard walkthrough",
          description:
            "Four steps over a mini dashboard. The spotlight glides between targets, the card flips sides when there is no room, and the event log shows the callbacks. Click the dimmed area to see the card nudge.",
          preview: <DashboardTourDemo />,
          code: dashboardCode,
          minHeight: 560,
        },
      ]}
      usage={usage}
      props={[
        { name: "steps", type: "TourStep[]", description: "Steps in order. Required." },
        { name: "open", type: "boolean", description: "Whether the tour is showing. Required." },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called with false on Skip, Escape and Finish. Required." },
        { name: "onFinish", type: "() => void", description: "Called when Finish is pressed on the last step." },
        { name: "onSkip", type: "(index: number) => void", description: "Called with the current step index when the tour is skipped or dismissed." },
        { name: "onStepChange", type: "(index: number) => void", description: "Called whenever the step changes." },
        { name: "startAt", type: "number", default: "0", description: "Step index used each time the tour opens." },
        { name: "spotlightPadding", type: "number", default: "8", description: "Space in px around the target inside the spotlight." },
        { name: "spotlightRadius", type: "number", default: "12", description: "Corner radius of the spotlight cut-out." },
        { name: "offset", type: "number", default: "14", description: "Gap in px between the spotlight and the card." },
        { name: "closeOnOverlayClick", type: "boolean", default: "false", description: "Skip on a click outside the card. Off by default: the card gives a small nudge instead." },
        { name: "labels", type: "Partial<ProductTourLabels>", description: "next, back, skip, finish and stepOf(current, total) for translations." },
        { name: "className", type: "string", description: "Classes for the card." },
      ]}
      types={[
        {
          name: "TourStep",
          props: [
            { name: "target", type: "string", description: "CSS selector of the element to highlight. If nothing matches, the card is centered with no cut-out." },
            { name: "title", type: "string", description: "Card heading; names the dialog." },
            { name: "content", type: "ReactNode", description: "Card body; describes the dialog." },
            { name: "placement", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', description: "Preferred side. Tries the opposite side, then the rest; docks at the bottom when none fits." },
            { name: "spotlightPadding", type: "number", description: "Per-step override of spotlightPadding." },
          ],
        },
      ]}
      accessibility={[
        "The card is role=\"dialog\" with aria-modal, named by the step title and described by its content.",
        "Focus moves into the card when the tour opens, Tab is trapped inside it, and focus returns to the element that opened it when the tour closes.",
        "Escape skips the tour; Left and Right arrows go back and next (ignored while typing in a field).",
        "Step changes are announced in a polite live region (\"Step 2 of 4: Find anything fast\"); the progress dots are decorative and the counter is text.",
        "The target is scrolled into view when it is off screen, and the spotlight follows it on scroll, resize and layout changes.",
        "Reduced motion removes the spotlight glide, the glow, the card movement and the nudge. All buttons are at least 40px tall.",
      ]}
    />
  );
}
