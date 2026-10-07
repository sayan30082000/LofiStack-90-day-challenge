import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { BlogFooterDemo, FakeApiDemo, InlineDemo } from "./demos";

export const metadata: Metadata = {
  title: "Newsletter Signup",
  description: "Email capture with validation on submit then on blur, distinct submitting, success and error states, and an optional consent checkbox.",
};

const footerCode = `
<footer className="grid gap-8 @2xl:grid-cols-[1fr_22rem]">
  <BlogLinks />
  <NewsletterSignup
    variant="card"
    title="One thoughtful essay, every other Sunday"
    description="Join 4,200 engineers and designers. No listicles, no tracking pixels."
    footnote="Unsubscribe with one click."
    onSubscribe={(email) =>
      fetch("/api/subscribe", { method: "POST", body: JSON.stringify({ email }) }).then((r) => {
        if (!r.ok) throw new Error("Our mail server didn't respond. Please try again.");
      })
    }
  />
</footer>`;

const inlineCode = `
<NewsletterSignup
  variant="inline"
  label="Email for release notes"
  placeholder="Work email"
  buttonText="Notify me"
  successTitle="Subscribed"
  successMessage={(email) => \`We'll email \${email} when a new version ships.\`}
  onSubscribe={subscribe}
/>

<NewsletterSignup
  variant="inline"
  title="Product updates"
  requireConsent
  consentLabel={<>I agree to receive product emails and accept the <a href="/privacy">privacy policy</a>.</>}
  onSubscribe={subscribe}
/>

<NewsletterSignup variant="inline" title="Disabled" disabled onSubscribe={subscribe} />`;

const fakeApiCode = `
// Fails for any email containing "fail", succeeds otherwise.
function fakeSubscribe(email: string) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (email.toLowerCase().includes("fail")) {
        reject(new Error("Our mail server didn't respond. Your email wasn't saved, please try again."));
      } else resolve();
    }, 1100);
  });
}

<NewsletterSignup variant="card" title="Try the states" onSubscribe={fakeSubscribe} />`;

const usage = `
import { NewsletterSignup } from "@/components/ui/newsletter-signup";

export function Example() {
  return (
    <NewsletterSignup
      title="Get the newsletter"
      description="One email a month. No spam."
      onSubscribe={async (email) => {
        await api.subscribe(email); // throw to show the error state
      }}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="newsletter-signup"
      examples={[
        {
          title: "Card variant in a blog footer",
          description:
            "The card sits beside footer links and stacks under them in narrow containers. The email row itself stacks when the card is narrower than 24rem.",
          preview: <BlogFooterDemo />,
          code: footerCode,
          minHeight: 420,
        },
        {
          title: "Inline variant",
          description: "A bare row for banners and sidebars, with a custom success message, a required consent checkbox, and a disabled instance.",
          preview: <InlineDemo />,
          code: inlineCode,
          minHeight: 460,
        },
        {
          title: "Fake API and states",
          description:
            "Submit empty, then an invalid email, then anything containing “fail” to see the server error, then a valid address for the confirmation. Validation errors never call the API.",
          preview: <FakeApiDemo />,
          code: fakeApiCode,
          minHeight: 320,
        },
      ]}
      usage={usage}
      props={[
        { name: "onSubscribe", type: "(email: string) => Promise<void>", description: "Called with the trimmed email. Resolve for success; reject (ideally with an Error message) for the error state." },
        { name: "variant", type: '"inline" | "card"', default: '"card"', description: "card is a framed panel with an icon badge; inline is a bare row." },
        { name: "title", type: "ReactNode", description: "Heading above the form. Also labels the form." },
        { name: "description", type: "ReactNode", description: "Supporting copy under the title." },
        { name: "titleAs", type: '"h2" | "h3" | "h4" | "p"', default: '"h3"', description: "Element used for the title, to fit the page outline." },
        { name: "label", type: "string", default: '"Email address"', description: "Visually hidden label of the email field." },
        { name: "placeholder", type: "string", default: '"you@example.com"', description: "Placeholder of the email field." },
        { name: "buttonText", type: "string", default: '"Subscribe"', description: "Submit button text." },
        { name: "submittingText", type: "string", default: '"Subscribing…"', description: "Button text while onSubscribe is pending." },
        { name: "retryText", type: "string", default: '"Try again"', description: "Button text after a failed request." },
        { name: "successTitle", type: "ReactNode", default: '"You\'re on the list"', description: "Title of the confirmation that replaces the form." },
        { name: "successMessage", type: "ReactNode | (email: string) => ReactNode", default: "Confirmation link text", description: "Body of the confirmation. The function form receives the subscribed email." },
        { name: "resetText", type: "string", default: '"Use another email"', description: "Link that brings back an empty form." },
        { name: "requireConsent", type: "boolean", default: "false", description: "Shows a consent checkbox that must be ticked before subscribing." },
        { name: "consentLabel", type: "ReactNode", default: '"I agree to receive emails…"', description: "Label of the consent checkbox. Can contain links." },
        { name: "emptyErrorText", type: "string", default: '"Enter your email address."', description: "Error when the field is empty." },
        { name: "invalidErrorText", type: "string", default: '"Enter a valid email, like name@example.com."', description: "Error when the email is malformed." },
        { name: "consentErrorText", type: "string", default: '"Please tick the box to continue."', description: "Error when consent is missing." },
        { name: "errorText", type: "string", default: '"Something went wrong. Please try again."', description: "Server error fallback when the rejection has no message." },
        { name: "validate", type: "(email: string) => boolean", description: "Custom email check, e.g. to block disposable domains." },
        { name: "footnote", type: "ReactNode", description: "Small print under the form. Linked to the field with aria-describedby." },
        { name: "icon", type: "ReactNode", default: "Mail icon", description: "Icon in the card variant's badge." },
        { name: "disabled", type: "boolean", default: "false", description: "Disables the field, checkbox and button." },
        { name: "className", type: "string", description: "Classes for the root element." },
      ]}
      accessibility={[
        "The email field has a real <label> (visually hidden), autocomplete=\"email\" and inputMode=\"email\".",
        "Validation runs on submit, then on blur after the first submit; an error clears as soon as the value becomes valid while typing.",
        "Invalid fields get aria-invalid and point to their error text with aria-describedby; focus moves to the first invalid control on submit.",
        "Server errors render in a role=\"alert\" box that is also linked to the field. The button stays focusable (aria-disabled) while submitting.",
        "The confirmation renders inside a persistent role=\"status\" region and receives focus; \"Use another email\" returns focus to the field.",
        "The shake on error, the check-mark draw and the fade-in are removed under prefers-reduced-motion.",
      ]}
    />
  );
}
