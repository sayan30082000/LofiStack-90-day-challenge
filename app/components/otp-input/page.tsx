import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { PinDemo, SmsDemo, VariantsDemo, VerifyEmailDemo } from "./demos";

export const metadata: Metadata = {
  title: "OTP Input",
  description:
    "A one-time code input you can paste a whole SMS into: it finds the code inside the message. Plus WebOTP autofill on Android, an expiry countdown, a growing resend cooldown and an attempts-left warning.",
};

const smsCode = `
<OtpInput
  label="SMS verification code"
  groupSize={3}
  onComplete={verify}
  // Paste "Your code is 482 913. It expires in 5 minutes…" and 482913 is filled in.
  smartPaste
  // Android Chrome: read the code straight from the SMS (WebOTP), no copying.
  webOtp
  expiresAt={sentAt + 5 * 60 * 1000}
  attemptsLeft={attempts}
  onResend={() => api.sendCode(phone)}
  resendCooldowns={[30, 60, 120]}   // waits grow with each resend
/>

extractOtp("Your code is 482 913. Help: +880 1712 345678", 6);   // "482913"`;

const verifyCode = `
const [code, setCode] = useState("");
const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle");

<OtpInput
  label="Email verification code"
  value={code}
  onChange={(v) => {
    setCode(v);
    if (status !== "checking") setStatus("idle"); // editing clears the error
  }}
  onComplete={async (v) => {
    setStatus("checking");
    const ok = await api.verifyEmail(v); // "123456" in the demo
    setStatus(ok ? "success" : "error");
  }}
  loading={status === "checking"}
  success={status === "success"}
  successMessage="Email verified. Redirecting to your dashboard…"
  error={status === "error" ? \`That code didn't match. \${attempts} attempts left.\` : undefined}
/>

<button onClick={resend} disabled={cooldown > 0}>
  {cooldown > 0 ? \`Resend code in \${cooldown}s\` : "Resend code"}
</button>`;

const pinCode = `
const [pin, setPin] = useState("");
const [show, setShow] = useState(false);

<OtpInput
  length={4}
  mask={!show}
  size="lg"
  label="App PIN"
  boxLabel={(i, n) => \`PIN digit \${i} of \${n}\`}
  value={pin}
  onChange={setPin}
  success={pin.length === 4}
  successMessage="PIN saved"
/>`;

const variantsCode = `
<OtpInput label="Disabled code" defaultValue="482" disabled />

<OtpInput
  length={6}
  type="alphanumeric"   // letters and digits, uppercased
  groupSize={3}         // separator after every 3 boxes
  label="Recovery code"
  boxLabel={(i, n) => \`Character \${i} of \${n}\`}
  value={backup}
  onChange={setBackup}
/>`;

const usage = `
import { OtpInput } from "@/components/ui/otp-input";

export function Verify() {
  return <OtpInput onComplete={(code) => console.log("verify", code)} autoFocus />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="otp-input"
      examples={[
        {
          title: "Paste the whole SMS",
          description:
            "Copy the whole message on the left and paste it into the first box: the code is picked out of the text (the phone number is ignored). The code expires in 5 minutes, Resend unlocks after a cooldown that grows each time, and a warning appears at 2 attempts left.",
          preview: <SmsDemo />,
          code: smsCode,
          minHeight: 380,
        },
        {
          title: "Verify your email",
          description:
            "123456 succeeds, anything else shakes the boxes and shows an error. Verifying shows a shimmer, three misses lock the input, and Resend code starts a 30 second cooldown.",
          preview: <VerifyEmailDemo />,
          code: verifyCode,
          minHeight: 440,
        },
        {
          title: "4-digit masked PIN",
          description: "Large boxes with dots instead of digits. The toggle switches masking off.",
          preview: <PinDemo />,
          code: pinCode,
        },
        {
          title: "Disabled and alphanumeric",
          description: "A disabled, partly filled input, and a grouped recovery code that accepts letters. Pasting strips dashes and spaces.",
          preview: <VariantsDemo />,
          code: variantsCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "length", type: "number", default: "6", description: "Number of boxes." },
        { name: "value", type: "string", description: "Current code (controlled). Fills the boxes left to right." },
        { name: "defaultValue", type: "string", default: '""', description: "Initial code (uncontrolled)." },
        { name: "onChange", type: "(value: string) => void", description: "Fired on every change with the code typed so far." },
        { name: "onComplete", type: "(value: string) => void", description: "Fired when every box is filled, including after a paste." },
        { name: "type", type: '"numeric" | "alphanumeric"', default: '"numeric"', description: "Allowed characters. Others are ignored when typed or pasted." },
        { name: "mask", type: "boolean", default: "false", description: "Dots instead of characters; boxes become password inputs." },
        { name: "error", type: "string", description: "Error message. Red boxes, a shake and aria-invalid, linked with aria-describedby." },
        { name: "success", type: "boolean", default: "false", description: "Green success state." },
        { name: "successMessage", type: "string", description: "Message shown in the success state." },
        { name: "disabled", type: "boolean", default: "false", description: "Greys out and disables every box." },
        { name: "loading", type: "boolean", default: "false", description: "Read-only with a shimmer and aria-busy while verifying." },
        { name: "autoFocus", type: "boolean", default: "false", description: "Focus the first empty box on mount." },
        { name: "uppercase", type: "boolean", default: "true", description: "Uppercase letters in alphanumeric mode." },
        { name: "groupSize", type: "number", default: "0", description: "Draw a separator after every n boxes. 0 turns it off." },
        { name: "label", type: "string", default: '"One-time code"', description: "Accessible name of the group." },
        { name: "boxLabel", type: "(index: number, length: number) => string", default: "Digit i of n", description: "Accessible label of each box." },
        { name: "maskChar", type: "string", default: '"•"', description: "Character shown in masked boxes." },
        { name: "name", type: "string", description: "Adds a hidden input with the code for native form posts." },
        { name: "size", type: '"md" | "lg"', default: '"md"', description: "Box size. Both are at least 40px wide and 48px tall." },
        { name: "smartPaste", type: "boolean", default: "true", description: "When pasted text looks like a message, find the code in it with extractOtp: digits split by a space or dash count, the candidate nearest a word like code / OTP / কোড wins, and longer numbers (phones, amounts) are never cut down to fit." },
        { name: "webOtp", type: "boolean", default: "true", description: "On browsers with the WebOTP API (Android Chrome), read the code from the incoming SMS. Starts when the input is focused; only one input per page listens (a new one takes over), and it stops on unmount." },
        { name: "expiresAt / onExpire", type: "number / () => void", description: "Epoch ms when the code stops working. Shows a countdown (amber in the last 30s), then locks the boxes and calls onExpire once." },
        { name: "onResend", type: "() => void | Promise<void>", description: "Adds a Resend button after a cooldown. A promise shows a spinner." },
        { name: "resendCooldowns", type: "number[]", default: "[30, 60, 120]", description: "Seconds to wait before each resend; the last value repeats." },
        { name: "attemptsLeft", type: "number", description: "Shows a warning at 2 or fewer." },
        { name: "otpLabels", type: "Partial<OtpLabels>", description: "Wording of the timer, resend, attempts and paste announcements." },
        { name: "className", type: "string", description: "Classes for the root." },
      ]}
      accessibility={[
        "A code found in a pasted message or read from SMS is announced (\"Code found in the pasted message.\"), and the countdown, resend and attempts lines are linked to every box with aria-describedby.",
        "The boxes sit in a role=\"group\" with an accessible name; each box is a real input labelled \"Digit 1 of 6\" (customisable with boxLabel).",
        "inputMode=\"numeric\" and pattern=\"[0-9]*\" bring up the number pad; the first box has autocomplete=\"one-time-code\" so SMS and email codes can be autofilled into all boxes.",
        "Typing advances, Backspace clears and moves back, Left/Right and Home/End move between boxes. Boxes fill in order, so focusing a later empty box jumps to the first empty one.",
        "The error message is linked to every box with aria-describedby, the boxes get aria-invalid, and the message is announced with role=\"alert\". Success uses role=\"status\".",
        "Masked boxes are password inputs, so screen readers don't read the digits aloud. Loading sets aria-busy.",
        "Visual characters, the caret and the pop-in are drawn over a transparent input. Reduced motion turns off the shake, pop, caret blink and shimmer.",
      ]}
    />
  );
}
