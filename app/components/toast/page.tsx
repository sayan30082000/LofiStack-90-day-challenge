import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { PlaygroundDemo, PromiseDemo, UndoDemo } from "./demos";

export const metadata: Metadata = {
  title: "Toast System",
  description: "Toaster with stacking, promise toasts, undo actions, swipe to dismiss and six positions.",
};

const playgroundCode = `
const [position, setPosition] = useState<ToastPosition>("bottom-right");

<Toaster position={position} max={3} />

<button onClick={() => toast("Event saved to your calendar")}>Default</button>
<button onClick={() => toast.success("Changes published", { description: "Your site is live." })}>Success</button>
<button onClick={() => toast.error("Payment failed", { description: "The card was declined." })}>Error</button>
<button onClick={() => toast.info("New version available")}>Info</button>
<button onClick={() => toast.warning("Storage almost full")}>Warning</button>
<button onClick={() => toast.loading("Syncing contacts…")}>Loading</button>
<button onClick={() => toast.dismiss()}>Dismiss all</button>`;

const promiseCode = `
const [pending, setPending] = useState(false);

function deploy() {
  setPending(true);
  toast
    .promise(fetch("/api/deploy", { method: "POST" }).then((r) => r.json()), {
      loading: "Deploying component-gallery…",
      success: (data) => \`Deployed in \${data.seconds}s\`,
      error: (err) => \`Deploy failed: \${err instanceof Error ? err.message : "unknown error"}\`,
    })
    .catch(() => undefined)
    .finally(() => setPending(false));
}

<button onClick={deploy} disabled={pending}>Deploy to production</button>`;

const undoCode = `
function archive(email: Email) {
  setArchived((a) => [...a, email.id]);
  toast("Email archived", {
    id: \`archive-\${email.id}\`,   // archiving twice updates the same toast
    description: email.subject,
    duration: 6000,
    action: {
      label: "Undo",
      onClick: () => setArchived((a) => a.filter((id) => id !== email.id)),
    },
  });
}`;

const usage = `
// app/layout.tsx (or any client component that is always mounted)
import { Toaster } from "@/components/ui/toast";

<body>
  {children}
  <Toaster position="bottom-right" max={3} duration={5000} />
</body>

// Anywhere else, including event handlers and async code
import { toast } from "@/components/ui/toast";

toast.success("Saved");`;

export default function Page() {
  return (
    <ComponentPage
      slug="toast"
      examples={[
        {
          title: "Types, positions and stacking",
          description:
            "Fire a few toasts: they stack as a deck and fan out on hover or focus, which also pauses every countdown. Pick any of the six positions and how many stay visible.",
          preview: <PlaygroundDemo />,
          code: playgroundCode,
          minHeight: 380,
        },
        {
          title: "Promise toast",
          description: "toast.promise shows a spinner, then turns the same toast into a success or an error when the promise settles.",
          preview: <PromiseDemo />,
          code: promiseCode,
          minHeight: 220,
        },
        {
          title: "Email archived, with Undo",
          description: "An action button restores the email. Archive everything to see the empty state.",
          preview: <UndoDemo />,
          code: undoCode,
          minHeight: 320,
        },
      ]}
      usage={usage}
      props={[
        { name: "position", type: '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"', default: '"bottom-right"', description: "Where the stack sits and which way it grows." },
        { name: "max", type: "number", default: "3", description: "Toasts visible at once. Older ones wait and move up as newer ones close." },
        { name: "duration", type: "number", default: "5000", description: "Default auto-dismiss time in ms. Loading toasts stay until updated or dismissed." },
        { name: "expand", type: "boolean", default: "false", description: "Always show the stack expanded, not only on hover or focus." },
        { name: "closeButton", type: "boolean", default: "true", description: "Close button on dismissible toasts." },
        { name: "showProgress", type: "boolean", default: "true", description: "Countdown bar along the bottom edge. Hidden with reduced motion; the timer still runs." },
        { name: "gap", type: "number", default: "10", description: "Gap between expanded toasts, in px." },
        { name: "peek", type: "number", default: "14", description: "How far each collapsed toast peeks out behind the front one, in px." },
        { name: "offset", type: "number", default: "16", description: "Distance from the viewport edges, in px." },
        { name: "width", type: "number", default: "360", description: "Toast width in px, capped to the viewport on small screens." },
        { name: "swipeThreshold", type: "number", default: "64", description: "Horizontal drag in px that dismisses a toast. A quick flick also works." },
        { name: "hotkey", type: "string", default: '"F8"', description: "KeyboardEvent.key that moves focus to the newest toast." },
        { name: "label", type: "string", default: '"Notifications"', description: "Accessible name of the region. The hotkey is appended." },
        { name: "dismissLabel", type: "string", default: '"Dismiss notification"', description: "Close button name. The message is appended when it is text." },
        { name: "clearAllLabel", type: "string", default: '"Clear all"', description: "Button that closes every toast, shown while the stack is expanded. Empty string hides it." },
        { name: "icons", type: "Partial<Record<ToastType, ReactNode>>", description: "Replace the icon of any toast type." },
        { name: "zIndex", type: "number", default: "100", description: "Stacking order of the region." },
        { name: "toastClassName", type: "string", description: "Extra classes for every toast card." },
      ]}
      types={[
        {
          name: "toast() API",
          props: [
            { name: "toast(message, options?)", type: "(ReactNode, ToastOptions) => string", description: "Neutral toast. Returns its id." },
            { name: "toast.success / error / info / warning", type: "(ReactNode, ToastOptions) => string", description: "Typed toasts with an icon. Errors are announced assertively." },
            { name: "toast.loading", type: "(ReactNode, ToastOptions) => string", description: "Spinner toast with no timer. Update it by calling any variant with the same id." },
            { name: "toast.promise", type: "(promise | () => promise, { loading, success, error }, ToastOptions) => Promise<T>", description: "Loading toast that becomes success or error in place. success and error can be functions of the result." },
            { name: "toast.dismiss", type: "(id?: string) => void", description: "Close one toast, or all of them." },
          ],
        },
        {
          name: "ToastOptions",
          props: [
            { name: "description", type: "ReactNode", description: "Second line under the message." },
            { name: "action", type: "{ label: string; onClick: (e) => void }", description: "Action button, e.g. Undo. The toast closes after the click unless onClick calls e.preventDefault()." },
            { name: "duration", type: "number", default: "Toaster duration", description: "Auto-dismiss time in ms. Infinity keeps it open." },
            { name: "id", type: "string", description: "Reuse an id to update a toast in place instead of stacking a new one." },
            { name: "dismissible", type: "boolean", default: "true", description: "Close button, Escape and swipe." },
            { name: "onDismiss", type: "(id: string) => void", description: "Closed by the user or toast.dismiss()." },
            { name: "onAutoClose", type: "(id: string) => void", description: "Closed because the timer ran out." },
          ],
        },
      ]}
      accessibility={[
        "The stack is a region named “Notifications (F8)”. Two persistent live regions inside it announce each toast once: polite for most, assertive for errors.",
        "F8 moves focus to the newest toast and remembers where you were. Tab moves through toasts and their buttons, Escape closes the focused toast and moves focus to the next one, or back to where you pressed F8.",
        "Close buttons are labelled with the message, e.g. “Dismiss notification: Email archived”. Every button is at least 40px.",
        "Hover or focus inside the stack expands it and pauses every timer, so nothing disappears while you read or reach for Undo. Timers also pause while the tab is hidden.",
        "Swipe is a pointer shortcut only; every toast can also be closed with its button or Escape.",
        "With prefers-reduced-motion the toasts fade instead of sliding and the countdown bar is hidden.",
      ]}
    />
  );
}
