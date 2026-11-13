import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { CreateWorkspaceDemo, FeedbackDemo } from "./demos";

export const metadata: Metadata = {
  title: "Multi-Step Form Wizard",
  description:
    "A form wizard whose steps follow your answers (a paid plan adds a Billing step, and it says so), that saves your progress so you can resume later, and that tells you how long is left, learning from your own pace.",
};

const workspaceCode = `
// when: the step exists only for some answers. fields: how many inputs it has (for the time left).
// persistKey: progress is saved; coming back offers Resume / Start fresh.
type Values = { fullName: string; email: string; workspace: string; teamSize: string; plan: string; billingEmail: string };

const steps: WizardStep<Values>[] = [
  {
    id: "account",
    title: "Account",
    validate: (v) => ({
      fullName: v.fullName.trim() ? undefined : "Enter your full name.",
      email: /^\\S+@\\S+\\.\\S{2,}$/.test(v.email) ? undefined : "Enter a valid email.",
    }),
    summary: (v) => [
      { label: "Name", value: v.fullName },
      { label: "Email", value: v.email },
    ],
    render: ({ values, setValue, errors, field, errorId }) => (
      <WizardField label="Full name" htmlFor={field("fullName").id} error={errors.fullName} errorId={errorId("fullName")}>
        <input {...field("fullName")} value={values.fullName} onChange={(e) => setValue("fullName", e.target.value)} className={wizardInputClass} />
      </WizardField>
    ),
  },
  {
    id: "workspace",
    title: "Workspace",
    // Async validation: the Next button shows "Checking name…" while it runs.
    validate: async (v) => {
      if (await api.isTaken(v.workspace)) return { workspace: "That name is taken." };
      if (!v.teamSize) return { teamSize: "Choose a team size." };
    },
    render: (ctx) => <WorkspaceFields {...ctx} />,
  },
  { id: "plan", title: "Plan", validate: (v) => (v.plan ? {} : { plan: "Pick a plan." }), render: (ctx) => <PlanPicker {...ctx} /> },
  {
    id: "billing",
    title: "Billing",
    fields: 2,
    // Only paid plans have this step: picking Team adds it, Starter removes it.
    when: (v) => v.plan === "team" || v.plan === "business",
    validate: (v) => (v.billingEmail ? {} : { billingEmail: "Enter the email that should get invoices." }),
    render: (ctx) => <BillingFields {...ctx} />,
  },
];

<MultiStepForm
  title="Create workspace"
  steps={steps}
  initialValues={{ fullName: "", email: "", workspace: "", teamSize: "", plan: "", billingEmail: "" }}
  showReview
  persistKey="create-workspace"   // resume later; cleared after submit
  onSubmit={(values) => api.createWorkspace(values)}   // reject to show an error
  labels={{ submit: "Create workspace", submitting: "Creating…", validating: "Checking name…" }}
  successTitle="Your workspace is ready"
  successDescription={(v) => <><strong>{v.workspace}</strong> is live. We sent the invite to {v.email}.</>}
  onRestart={() => {}}
/>`;

const feedbackCode = `
<MultiStepForm
  steps={[
    { id: "rating", title: "Rating", validate: (v) => (v.rating ? {} : { rating: "Choose a rating." }), render: RatingStep },
    { id: "comment", title: "Comment", render: CommentStep },   // no validate: always valid
  ]}
  initialValues={{ rating: "", comment: "" }}
  showReview={false}             // the last step submits directly
  onSubmit={sendFeedback}
  labels={{ submit: "Send feedback", submitting: "Sending…" }}
/>`;

const usage = `
import { MultiStepForm, WizardField, wizardInputClass, type WizardStep } from "@/components/ui/multi-step-form";

type Values = { name: string };

const steps: WizardStep<Values>[] = [
  {
    id: "name",
    title: "Your name",
    validate: (v) => (v.name ? {} : { name: "Required" }),
    summary: (v) => [{ label: "Name", value: v.name }],
    render: ({ values, setValue, errors, field, errorId }) => (
      <WizardField label="Name" htmlFor={field("name").id} error={errors.name} errorId={errorId("name")}>
        <input {...field("name")} value={values.name} onChange={(e) => setValue("name", e.target.value)} className={wizardInputClass} />
      </WizardField>
    ),
  },
];

export function Example() {
  return <MultiStepForm steps={steps} initialValues={{ name: "" }} onSubmit={async (v) => save(v)} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="multi-step-form"
      examples={[
        {
          title: "Steps that follow your answers, a draft you can resume",
          description:
            "Account → Workspace → Plan → Review. Pick Team or Business and a Billing step appears in the header (announced as “Added a step: Billing. 5 steps now.”); pick Starter and it goes away. Progress is saved as you go: reload the page and it offers to resume where you were. The time left starts as a guess and adapts to how fast you fill steps in.",
          preview: <CreateWorkspaceDemo />,
          code: workspaceCode,
          minHeight: 560,
        },
        {
          title: "Without a review step",
          description: "showReview={false}: the last step's primary button submits. A step without validate is always valid.",
          preview: <FeedbackDemo />,
          code: feedbackCode,
          minHeight: 420,
        },
      ]}
      usage={usage}
      props={[
        { name: "steps", type: "WizardStep<V>[]", description: "Step config in order. Each renders its own fields through render(ctx)." },
        { name: "initialValues", type: "V", description: "Starting values for every field across all steps. Also used by Start over." },
        { name: "onSubmit", type: "(values: V) => Promise<void>", description: "Runs after every step re-validates. Shows a spinner while pending; a rejection shows its message in an alert." },
        { name: "showReview", type: "boolean", default: "true", description: "Adds a final review step built from each step's summary(), with Edit buttons." },
        { name: "title", type: "ReactNode", description: "Heading above the progress header." },
        { name: "successTitle", type: "ReactNode", default: '"All done"', description: "Heading of the success screen." },
        { name: "successDescription", type: "ReactNode | (values: V) => ReactNode", default: '"Your details were submitted."', description: "Body of the success screen." },
        { name: "onRestart", type: "() => void", description: "Shows a Start over button on the success screen; values reset to initialValues." },
        { name: "persistKey", type: "string", description: "Save values and the current step in localStorage under this key. Coming back shows “You have a saved draft from 2 hours ago, at “Billing”” with Resume and Start fresh. Removed after a successful submit." },
        { name: "persistExclude", type: "(keyof V)[]", default: "[]", description: "Fields never written to the draft, e.g. passwords or card numbers." },
        { name: "showTimeLeft", type: "boolean", default: "true", description: "“About 2 min left” in the header, from the remaining steps' fields × seconds per field." },
        { name: "secondsPerField", type: "number", default: "12", description: "Starting guess for the estimate. After each finished step it moves toward the person's own pace (updatePace)." },
        { name: "labels", type: "Partial<WizardLabels>", description: "Override button and status text: next, back, toReview, submit, submitting, validating, edit, returnToReview, restart, reviewTitle, reviewDescription, progress, stepOf, completed, submitError, noSummary, stepAdded, stepRemoved, stepCount, timeLeft, resumeTitle, resume, startFresh, resumed." },
        { name: "className", type: "string", description: "Classes for the root card." },
      ]}
      types={[
        {
          name: "WizardStep<V>",
          props: [
            { name: "id", type: "string", description: "Stable key." },
            { name: "title", type: "string", description: "Shown in the progress header and as the focused step heading." },
            { name: "description", type: "string", description: "Line under the heading." },
            { name: "render", type: "(ctx: WizardStepContext<V>) => ReactNode", description: "Renders the step's fields." },
            { name: "validate", type: "(values: V) => WizardErrors<V> | Promise<…> | void", description: "Errors keyed by field name. Empty means valid. Async is fine." },
            { name: "summary", type: "(values: V) => { label, value }[]", description: "Rows for the review screen." },
            { name: "when", type: "(values: V) => boolean", description: "Show the step only when this returns true. Re-checked as values change; the header, the count and the time left update, and the change is announced." },
            { name: "fields", type: "number", default: "2", description: "How many fields the step has, for the time-left estimate." },
          ],
        },
        {
          name: "WizardStepContext<V>",
          props: [
            { name: "values", type: "V", description: "All current values." },
            { name: "setValue", type: "(name, value) => void", description: "Sets one value and clears that field's error." },
            { name: "errors", type: "WizardErrors<V>", description: "Errors from the last validation of this step." },
            { name: "field", type: "(name) => { id, name, aria-invalid, aria-describedby }", description: "Spread on an input to make it focusable on error and linked to its message." },
            { name: "fieldId / errorId", type: "(name) => string", description: "The ids field() uses, for custom controls like radio cards." },
            { name: "disabled", type: "boolean", description: "True while submitting (the step is also wrapped in a disabled fieldset)." },
          ],
        },
        {
          name: "WizardField",
          props: [
            { name: "label", type: "ReactNode", description: "Visible <label>." },
            { name: "htmlFor", type: "string", description: "Use field(name).id." },
            { name: "error", type: "string", description: "Error text, rendered with errorId." },
            { name: "errorId", type: "string", description: "Use errorId(name)." },
            { name: "hint", type: "ReactNode", description: "Help text shown when there is no error." },
          ],
        },
      ]}
      accessibility={[
        "Each step change moves focus to the new step heading, which includes “Step 2 of 4” for screen readers.",
        "When validation fails, focus moves to the first invalid field instead; fields get aria-invalid and aria-describedby pointing at their error.",
        "The progress list is a nav with an ordered list; the current step has aria-current=\"step\" and completed steps say so and are real buttons.",
        "Enter in any field runs Next (the step is a real <form>). Buttons stay focusable with aria-disabled while validating or submitting.",
        "Submit errors render in role=\"alert\"; the success screen is a role=\"status\" region and its heading receives focus.",
        "The slide between steps and the success check animation are removed under prefers-reduced-motion.",
        "When an answer adds or removes a step, a visible note under the step count says which (“Added a step: Billing. 5 steps now.”) and it is announced by a status region that is always in the page.",
        "The saved-draft offer is plain text with two real buttons; resuming moves focus to the restored step's heading and announces “Draft restored”, and starting fresh moves focus to the first step.",
      ]}
    />
  );
}
