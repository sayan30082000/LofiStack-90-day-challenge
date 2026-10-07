import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { LaunchDemo, ResendDemo, TenSecondDemo, VariantsDemo } from "./demos";

export const metadata: Metadata = {
  title: "Countdown Timer",
  description: "Drift-free countdown with split-flap digits, pause and resume, a completion slot and inline and minimal variants.",
};

const launchCode = `
<CountdownTimer
  target="2027-01-15T17:00:00Z"
  size="lg"
  label="Time until launch"
  onComplete={() => confetti()}
  completedContent={<LiveBanner />}   // replaces the tiles at zero
/>`;

const tenCode = `
const timer = useRef<CountdownTimerHandle>(null);

<CountdownTimer
  ref={timer}
  duration={10}            // seconds; supports pause and resume
  showDays={false}
  showControls             // play / pause and restart buttons
  showProgress
  label="Plank break timer"
  onStatusChange={setStatus}
  completedContent={
    <button onClick={() => timer.current?.restart()}>Go again</button>
  }
/>`;

const resendCode = `
const [round, setRound] = useState(0);
const [canResend, setCanResend] = useState(false);

{canResend ? (
  <button onClick={() => { setCanResend(false); setRound((r) => r + 1); }}>Resend code</button>
) : (
  <>
    Resend code in{" "}
    <CountdownTimer
      key={round}          // a new key starts a fresh 30 seconds
      duration={30}
      variant="inline"
      inlineFormat="compact"
      label="Time until you can resend the code"
      onComplete={() => setCanResend(true)}
    />
  </>
)}`;

const variantsCode = `
<CountdownTimer duration={223752} variant="minimal" />                 // 2d 14h 09m 12s
<CountdownTimer duration={8049} variant="inline" />                    // 02:14:09
<CountdownTimer duration={90} autoStart={false} showControls size="sm" />
<CountdownTimer target="sometime soon" invalidText="Couldn't read the launch date." />`;

const usage = `
import { CountdownTimer } from "@/components/ui/countdown-timer";

export function Example() {
  return <CountdownTimer target="2027-01-15T17:00:00Z" label="Time until launch" />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="countdown-timer"
      examples={[
        {
          title: "Product launch",
          description:
            "Counts down to a fixed date with split-flap tiles. The server renders placeholder tiles and ticking starts after mount; the preview button shows the completed slot.",
          preview: <LaunchDemo />,
          code: launchCode,
          minHeight: 380,
        },
        {
          title: "10-second timer",
          description: "Duration mode with pause, resume and restart, a progress bar that lands exactly on each second, and a completion state.",
          preview: <TenSecondDemo />,
          code: tenCode,
          minHeight: 360,
        },
        {
          title: "Resend code",
          description: 'An inline "Resend code in 0:30" timer that turns into a button when it runs out.',
          preview: <ResendDemo />,
          code: resendCode,
        },
        {
          title: "Variants and states",
          description: "Minimal and inline variants, a timer that waits for Start, and the invalid-date error.",
          preview: <VariantsDemo />,
          code: variantsCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "target", type: "Date | string | number", description: "Date to count down to. Strings go through Date.parse; numbers are epoch ms." },
        { name: "duration", type: "number", description: "Seconds to count down from when there is no target. Supports pause and resume. Change the key to start over with a new duration." },
        { name: "onComplete", type: "() => void", description: "Fires once at zero, also when the target is already past on mount." },
        { name: "onStatusChange", type: '(status: "loading" | "idle" | "running" | "paused" | "done" | "invalid") => void', description: "Fires when the status changes." },
        { name: "variant", type: '"flip" | "inline" | "minimal"', default: '"flip"', description: "Split-flap tiles, sentence-friendly 02:14:09 text, or 2d 14h 09m 12s." },
        { name: "labels", type: "Partial<Record<Unit, string>>", default: '{ days: "Days", … }', description: "Unit names under the tiles and in the screen reader summary." },
        { name: "shortLabels", type: "Partial<Record<Unit, string>>", default: '{ days: "d", … }', description: "Unit suffixes for the minimal variant and the inline day count." },
        { name: "autoStart", type: "boolean", default: "true", description: "Start a duration countdown after mount." },
        { name: "showDays", type: 'boolean | "auto"', default: '"auto"', description: '"auto" hides the days unit while it is zero.' },
        { name: "inlineFormat", type: '"clock" | "compact"', default: '"clock"', description: "clock pads every unit (00:00:30); compact drops empty hours (0:30)." },
        { name: "showControls", type: "boolean", default: "false", description: "Play / pause and restart buttons in duration mode." },
        { name: "showProgress", type: "boolean", default: "false", description: "Progress bar in duration mode." },
        { name: "showSeparators", type: "boolean", default: "true", description: "Colons between flip tiles." },
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Flip tile size. md and lg grow with their container." },
        { name: "completedContent", type: "ReactNode", description: "Replaces the digits once done." },
        { name: "label", type: "string", default: '"Time remaining"', description: "Accessible name of the timer." },
        { name: "announceEachMinute", type: "boolean", default: "false", description: "Announce the minute summary politely. Completion is always announced." },
        { name: "formatSummary", type: "(parts, status) => string", description: "Builds the screen reader summary, called with minute precision." },
        { name: "completedText", type: "string", default: "\"Time's up\"", description: "Summary and announcement at zero." },
        { name: "loadingText", type: "string", default: '"Calculating time remaining…"', description: "Summary before the first tick in target mode." },
        { name: "invalidText", type: "string", default: '"Invalid countdown date"', description: "Shown when the target can't be parsed or nothing is set." },
        { name: "controlLabels", type: "Partial<Record<\"start\" | \"pause\" | \"resume\" | \"restart\", string>>", description: "Accessible names of the control buttons." },
        { name: "ref", type: "Ref<CountdownTimerHandle>", description: "start(), pause(), restart() and reset() for your own controls." },
        { name: "className", type: "string", description: "Classes for the root. Set --cd-top, --cd-bottom and --cd-text to recolor flip tiles." },
      ]}
      accessibility={[
        'The time sits in a role="timer" element named by label. The digits are aria-hidden, so nothing is read out every second.',
        "A visually hidden summary such as \"2 hours, 14 minutes remaining\" updates once a minute; turn on announceEachMinute to have it read politely as it changes.",
        "Reaching zero is announced once through a polite live region, and the completed slot can hold focusable content.",
        "Controls are real buttons with names that follow the state (Start, Pause, Resume) and 40px targets.",
        "With prefers-reduced-motion the flip animation is replaced by an instant change, and the progress bar stops gliding.",
        "Ticks recompute from Date.now() on each whole second and catch up when a background tab becomes visible, so the display never drifts.",
      ]}
    />
  );
}
