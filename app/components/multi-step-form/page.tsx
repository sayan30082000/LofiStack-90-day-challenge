import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { CreateWorkspaceDemo, FeedbackDemo } from "./demos";

export const metadata: Metadata = {
  title: "Multi-Step Form Wizard",
  description:
    "Config-driven form wizard with per-step sync or async validation, a clickable segmented progress header, a review screen with Edit links and an async submit.",
};

const workspaceCode = `
type Values = { fullName: string; email: string; workspace: string; teamSize: string; plan: string };

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
];

<MultiStepForm
  title="Create workspace"
  steps={steps}
  initialValues={{ fullName: "", email: "", workspace: "", teamSize: "", plan: "" }}
  showReview
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
          title: "Create workspace",
          description:
            "Account → Workspace → Plan → Review. Each Next runs that step's validate (the workspace step is async). Completed steps in the header are clickable, Back keeps data, and Edit on the review screen returns you there with “Save and review”.",
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
        { name: "labels", type: "Partial<WizardLabels>", description: "Override button and status text: next, back, toReview, submit, submitting, validating, edit, returnToReview, restart, reviewTitle, reviewDescription, progress, stepOf, completed, submitError, noSummary." },
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
      ]}
    />
  );
}
