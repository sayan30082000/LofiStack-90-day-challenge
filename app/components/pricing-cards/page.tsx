import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { PlansDemo, StatesDemo } from "./demos";

export const metadata: Metadata = {
  title: "Pricing Cards",
  description: "Plan cards with a monthly/yearly toggle, odometer-style price rolls and a featured plan.",
};

const plansCode = `
const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For side projects and trying things out.",
    monthly: 0,
    yearly: 0,
    features: [
      { label: "3 projects", included: true },
      { label: "Custom domains", included: false },
    ],
    cta: { label: "Start for free" },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For solo makers shipping to real users.",
    monthly: 15,
    yearly: 144, // total per year, shown as $12/mo
    featured: true,
    features: [
      { label: "Unlimited projects", included: true },
      { label: "Custom domains", included: true },
    ],
    cta: { label: "Upgrade to Pro" },
  },
  // ...team
];

<PricingTable
  plans={plans}
  defaultBilling="monthly"
  yearlyDiscountLabel="Save 20%"
  // Returning a promise shows a spinner on that plan's button
  onSelect={(planId, billing) => startCheckout(planId, billing)}
/>`;

const statesCode = `
<PricingTable
  plans={[
    { ...starter, cta: { label: "Current plan", disabled: true } },
    pro,
    { ...team, featured: true },
  ]}
  currency="GBP"
  locale="en-GB"
  defaultBilling="yearly"
  yearlyDiscountLabel="-20%"
  labels={{ featured: "Best for teams", empty: "Plans are being updated. Check back soon." }}
  // A rejected promise shows its message under the button
  onSelect={async (planId) => {
    const res = await fetch(\`/api/checkout?plan=\${planId}\`, { method: "POST" });
    if (!res.ok) throw new Error("Your card was declined. Try another card.");
  }}
/>

// Single card, e.g. inside an upgrade modal
<PricingCard plan={pro} billing="yearly" onSelect={upgrade} />`;

const usage = `
import { PricingTable, type PricingPlan } from "@/components/ui/pricing-cards";

const plans: PricingPlan[] = [
  {
    id: "pro",
    name: "Pro",
    description: "Everything you need.",
    monthly: 15,
    yearly: 144,
    features: [{ label: "Unlimited projects", included: true }],
    cta: { label: "Upgrade", href: "/checkout?plan=pro" },
    featured: true,
  },
];

export function Pricing() {
  return <PricingTable plans={plans} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="pricing-cards"
      examples={[
        {
          title: "Starter, Pro and Team",
          description:
            "Flip the billing toggle and each digit rolls to its new value. Yearly prices show the per-month rate, the billed total and the saving. Picking a plan shows a short loading state.",
          preview: <PlansDemo />,
          code: plansCode,
          minHeight: 640,
        },
        {
          title: "States and currency",
          description:
            "Pounds with en-GB formatting, a disabled current plan, a featured plan with a custom label, a checkout that fails the first time, and the empty state.",
          preview: <StatesDemo />,
          code: statesCode,
          minHeight: 640,
        },
      ]}
      usage={usage}
      props={[
        { name: "plans", type: "PricingPlan[]", description: "Plans in display order. An empty array shows the empty state." },
        { name: "defaultBilling", type: '"monthly" | "yearly"', default: '"monthly"', description: "Billing period selected on first render." },
        { name: "yearlyDiscountLabel", type: "string", default: '"Save 20%"', description: "Badge inside the yearly option. Empty string hides it." },
        { name: "currency", type: "string", default: '"USD"', description: "ISO 4217 currency code passed to Intl.NumberFormat." },
        { name: "locale", type: "string", default: '"en-US"', description: "Locale used to format prices." },
        { name: "onSelect", type: "(planId: string, billing: Billing) => void | Promise<void>", description: "Fired by a CTA. A returned promise shows a spinner; a rejection shows its message under the button." },
        { name: "onBillingChange", type: "(billing: Billing) => void", description: "Fired when the toggle changes." },
        { name: "labels", type: "Partial<PricingLabels>", default: "defaultPricingLabels", description: "Override any text: toggle options, period, billed lines, free-plan line, saving chip, featured label, \"Not included\", live announcement, error and empty text." },
        { name: "className", type: "string", description: "Classes for the root. Columns follow the root's width (container queries): 1, then 2 from 576px, then 3 from 896px." },
      ]}
      types={[
        {
          name: "PricingPlan",
          props: [
            { name: "id", type: "string", description: "Passed to onSelect." },
            { name: "name", type: "string", description: "Plan name, also the card's accessible name." },
            { name: "description", type: "string", description: "One line under the name." },
            { name: "monthly", type: "number", description: "Price per month when billed monthly." },
            { name: "yearly", type: "number", description: "Total per year when billed yearly. Shown as yearly / 12 per month, with the total and saving underneath." },
            { name: "features", type: "{ label: string; included: boolean }[]", description: "Excluded features get a dash, strike-through and a screen-reader \"Not included\"." },
            { name: "cta", type: "{ label: string; href?: string; disabled?: boolean }", description: "Button, or a link when href is set. disabled is for the current plan." },
            { name: "featured", type: "boolean", default: "false", description: "Indigo ring, raised card in the 3-column layout and the featured label." },
          ],
        },
        {
          name: "PricingCardProps",
          props: [
            { name: "plan", type: "PricingPlan", description: "The plan to render." },
            { name: "billing", type: '"monthly" | "yearly"', description: "Which price to show." },
            { name: "currency / locale / labels / onSelect", type: "—", description: "Same as on PricingTable." },
          ],
        },
      ]}
      accessibility={[
        "The billing toggle is a role=\"radiogroup\" with two role=\"radio\" options and a roving tabindex: one Tab stop, arrow keys or Home/End switch the period.",
        "A polite live region announces the new period and every plan's price after the toggle changes. The rolling digits are aria-hidden; each price has an sr-only text such as \"$12 per month\".",
        "Excluded features keep their text, add an sr-only \", Not included\" and use a dash icon, so the state never depends on color or strike-through alone.",
        "Each card is an article labelled by its plan name. The CTA sets aria-busy while loading, and errors render with role=\"alert\" and are linked with aria-describedby.",
        "CTAs and toggle options are at least 40px tall with a visible focus ring. Reduced motion turns off the digit roll, pill slide and chip pop.",
      ]}
    />
  );
}
