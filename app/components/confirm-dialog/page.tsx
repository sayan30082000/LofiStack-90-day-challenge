import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { CaseInsensitiveDemo, DangerZoneDemo } from "./demos";

export const metadata: Metadata = {
  title: "Type-to-Confirm Dialog",
  description: "Destructive confirmation that unlocks only after the resource name is typed, with async loading and in-dialog errors.",
};

const dangerCode = `
const [open, setOpen] = useState(false);
const [deleted, setDeleted] = useState(false);
const restoreRef = useRef<HTMLButtonElement>(null);

<button onClick={() => setOpen(true)}>Delete repository</button>

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Delete lofistack/lofi-ui?"
  description="This permanently deletes the repository, its wiki, issues, comments and packages."
  resourceName="lofi-ui"
  consequences={[
    "1,204 stars and 86 forks are removed from the network",
    "The Netlify deploy hook and 3 webhooks stop firing",
    "Open pull requests from collaborators are closed",
  ]}
  confirmLabel="Delete this repository"
  loadingLabel="Deleting repository…"
  onConfirm={async () => {
    const res = await fetch("/api/repos/lofi-ui", { method: "DELETE" });
    // Throwing keeps the dialog open and shows the message inside it
    if (!res.ok) throw new Error(\`GitHub API error (\${res.status}). Nothing was deleted.\`);
    setDeleted(true);
  }}
  // The trigger disappears with the row, so send focus to Restore instead
  finalFocusRef={restoreRef}
/>`;

const caseCode = `
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title={\`Remove \${member.name} from the team?\`}
  description="They lose access to every project immediately."
  resourceName={member.handle}
  caseSensitive={false}
  confirmLabel="Remove member"
  loadingLabel="Removing…"
  inputLabel={(name) => <>Type their handle {name} (any case)</>}
  onConfirm={() => removeMember(member.id)}
  finalFocusRef={listRef}
/>`;

const usage = `
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProject() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Delete project</button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete my-app?"
        resourceName="my-app"
        onConfirm={() => api.deleteProject("my-app")}
      />
    </>
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="confirm-dialog"
      examples={[
        {
          title: "Repository danger zone",
          description:
            "Type lofi-ui to unlock the delete button. Correct characters light up green in the name chip and the progress line fills. The first attempt fails to show the error state; after deletion the row disappears and Restore brings it back.",
          preview: <DangerZoneDemo />,
          code: dangerCode,
          minHeight: 420,
        },
        {
          title: "Case-insensitive match",
          description: "Removing a team member. The handle can be typed in any case, and there is no consequences list.",
          preview: <CaseInsensitiveDemo />,
          code: caseCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "open", type: "boolean", description: "Whether the dialog is shown (controlled)." },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called with false on Esc, backdrop click, Cancel, the close button and after onConfirm resolves." },
        { name: "title", type: "ReactNode", description: "Dialog heading; labels the alertdialog." },
        { name: "description", type: "ReactNode", description: "Text under the title; describes the alertdialog." },
        { name: "resourceName", type: "string", description: "The exact text the user must type." },
        { name: "consequences", type: "string[]", default: "[]", description: "Bullet list of what will happen. Hidden when empty." },
        { name: "consequencesTitle", type: "string", default: '"This will:"', description: "Heading above the consequences." },
        { name: "confirmLabel", type: "string", default: '"Delete"', description: "Danger button label." },
        { name: "loadingLabel", type: "string", default: '"Deleting…"', description: "Danger button label while onConfirm is pending." },
        { name: "cancelLabel", type: "string", default: '"Cancel"', description: "Cancel button label." },
        { name: "onConfirm", type: "() => Promise<void>", description: "Runs on confirm. Resolving closes the dialog; rejecting shows the error message inside it." },
        { name: "caseSensitive", type: "boolean", default: "true", description: "Require matching letter case." },
        { name: "inputLabel", type: "(name: ReactNode) => ReactNode", default: "Type {name} to confirm", description: "Label above the input. Receives the highlighted name chip." },
        { name: "placeholder", type: "string", default: "resourceName", description: "Input placeholder." },
        { name: "matchedText", type: "string", default: '"Name matches. The delete button is enabled."', description: "Announced to screen readers once the value matches." },
        { name: "errorFallback", type: "string", default: '"Something went wrong. Nothing was deleted."', description: "Shown when onConfirm rejects without an Error message." },
        { name: "closeLabel", type: "string", default: '"Close"', description: "Accessible label of the × button." },
        { name: "finalFocusRef", type: "RefObject<HTMLElement | null>", description: "Focus target on close when the element that opened the dialog no longer exists." },
        { name: "className", type: "string", description: "Classes for the dialog panel." },
      ]}
      accessibility={[
        "The panel is role=\"alertdialog\" with aria-modal, aria-labelledby pointing at the title and aria-describedby at the description.",
        "Focus moves to the input on open, Tab and Shift+Tab are trapped inside the dialog, and focus returns to the trigger on close (or to finalFocusRef if the trigger was removed).",
        "Esc, the backdrop and Cancel close the dialog, except while onConfirm is pending. While loading the dialog sets aria-busy and the confirm button stays focusable so focus never falls out.",
        "The confirm button is a real disabled button until the name matches; a polite live region then announces that it is enabled. Enter submits.",
        "Errors render inside the dialog with role=\"alert\", are linked to the input with aria-describedby, and focus goes back to the input to retry.",
        "The colored name chip is aria-hidden with a plain sr-only copy, so the label reads as normal text. Reduced motion replaces the slide and scale with an instant fade.",
      ]}
    />
  );
}
