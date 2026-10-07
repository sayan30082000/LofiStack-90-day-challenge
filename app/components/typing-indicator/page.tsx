import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { ActivitiesDemo, BrandDemo, ChatDemo, GroupDemo, LooksDemo, MirrorDemo } from "./demos";

export const metadata: Metadata = {
  title: "Typing Indicator",
  description:
    "A typing indicator that shows how someone is writing: speed, pauses, rewrites, long drafts, erased drafts, voice notes, attachments and AI thinking.",
};

const mirrorCode = `
const typing = useTypingActivity();          // your side
const [draft, setDraft] = useState("");

<textarea
  value={draft}
  onChange={(e) => {
    setDraft(e.target.value);
    typing.track(e.target.value);            // speed, pauses, rewrites, length
  }}
/>

// Broadcast typing.activity / intensity / draftLength / startedAt
// over your socket. On the other side:
<TypingIndicator
  visible={typing.activity !== null}
  users={[typing.asUser({ name: "Sam" })]}
  variant="ink"
/>`;

const activitiesCode = `
<TypingIndicator users={[{ name: "Alex", activity: "typing", intensity: 0.5 }]} />
<TypingIndicator users={[{ name: "Alex", activity: "deleting" }]} />   // "is rewriting"
<TypingIndicator users={[{ name: "Alex", activity: "paused" }]} />     // "stopped typing"
<TypingIndicator users={[{ name: "Alex", activity: "abandoned" }]} />  // "changed their mind"
<TypingIndicator users={[{ name: "Alex", activity: "recording" }]} />  // live waveform
<TypingIndicator users={[{ name: "Alex", activity: "attaching" }]} />  // upload bar
<TypingIndicator users={[{ name: "Alex", activity: "thinking" }]} />   // AI assistants`;

const looksCode = `
<TypingIndicator variant="ink" />    // a pen stroke that writes itself, erases when rewriting
<TypingIndicator variant="keys" />   // keycaps tapped in rhythm, backspace when rewriting
<TypingIndicator variant="ghost" />  // placeholder words + caret, grows with draftLength

// Speed comes from intensity (0 to 1): slow, steady or fast tempo
<TypingIndicator users={[{ name: "Alex", intensity: 0.9 }]} />`;

const groupCode = `
<TypingIndicator
  variant="ghost"
  users={[
    { id: "sam", name: "Sam Chen", activity: "typing", intensity: 0.9 },
    { id: "priya", name: "Priya Nair", activity: "recording" },
    { id: "jordan", name: "Jordan Lee", activity: "typing", draftLength: 320 },
  ]}
/>
// → "Priya Nair is recording a voice note · Jordan Lee is writing a long message · Sam Chen is typing"`;

const chatCode = `
// Alex's client broadcasts its typing state; you render it as it arrives.
socket.on("typing", (state) => setAlex(state));   // { activity, intensity, draftLength, startedAt }

<TypingIndicator
  visible={alex !== null}
  users={alex ? [{ name: "Alex Rivera", ...alex }] : []}
  longDraftAt={120}
  elapsedAfter={4}       // "· 0:05" once they've been at it a while
  showAvatars={false}
/>`;

const brandCode = `
<TypingIndicator
  users={[{ name: "Lofi Bot", activity: "thinking" }]}
  bubbleClassName="bg-indigo-600"
  markClassName="text-white"
/>

<TypingIndicator
  variant="keys"
  users={[{ name: "Ana Souza" }]}
  labels={{ typing: ["está escribiendo", "están escribiendo"] }}
/>

<TypingIndicator
  variant="ghost"
  align="end"
  users={[{ name: "Rahim", activity: "deleting" }]}
  labels={{ deleting: ["is choosing their words", "are choosing their words"] }}
/>`;

const usage = `
import { TypingIndicator, useTypingActivity } from "@/components/ui/typing-indicator";

export function Example() {
  return <TypingIndicator users={[{ name: "Alex", activity: "typing" }]} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="typing-indicator"
      examples={[
        {
          title: "Live mirror",
          description:
            "Type on the left and see what the other person sees. Speed changes the tempo, holding Backspace shows a rewrite, stopping shows a pause, and long drafts say so.",
          preview: <MirrorDemo />,
          code: mirrorCode,
          minHeight: 320,
        },
        {
          title: "Activities",
          description: "Six activities, each with its own animation and wording, in any of the three looks.",
          preview: <ActivitiesDemo />,
          code: activitiesCode,
        },
        {
          title: "Looks, speed and states",
          description: "Ink, keys and ghost at slow and fast typing speeds, while rewriting and while paused.",
          preview: <LooksDemo />,
          code: looksCode,
        },
        {
          title: "Group chat",
          description: "Toggle people on and off. Each avatar has an activity badge and the text groups people by activity.",
          preview: <GroupDemo />,
          code: groupCode,
        },
        {
          title: "Realistic reply",
          description: "Send a message. Alex types fast, hesitates, rewrites, then writes a longer reply with a running timer.",
          preview: <ChatDemo />,
          code: chatCode,
          minHeight: 440,
        },
        {
          title: "Custom styling and wording",
          description: "Marks draw in currentColor, so one class recolors them. Labels take singular and plural forms for any language.",
          preview: <BrandDemo />,
          code: brandCode,
          minHeight: 200,
        },
      ]}
      usage={usage}
      props={[
        { name: "visible", type: "boolean", default: "true", description: "Shows or hides the indicator with a height and opacity transition." },
        { name: "users", type: "TypingUser[]", default: "[]", description: "People currently active, each with their own activity, speed and draft length." },
        { name: "variant", type: '"ink" | "keys" | "ghost"', default: '"ink"', description: "Look of the typing marks. Recording, attaching and thinking have their own marks." },
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Scales the bubble, marks, avatars and text." },
        { name: "showText", type: "boolean", default: "true", description: "Shows the status text. Screen readers hear it either way." },
        { name: "showAvatars", type: "boolean", default: "true", description: "Stacked avatars next to the bubble." },
        { name: "showActivityBadges", type: "boolean", default: "true", description: "Small activity icons on each avatar (pen, mic, paperclip, sparkles…)." },
        { name: "maxAvatars", type: "number", default: "3", description: "Avatars shown before the rest collapse into a +N chip." },
        { name: "draftHint", type: "boolean", default: "true", description: "Uses draftLength: the ghost look grows and long drafts read \"writing a long message\"." },
        { name: "longDraftAt", type: "number", default: "140", description: "Draft length that counts as a long message." },
        { name: "elapsedAfter", type: "number | null", default: "10", description: "Seconds before an elapsed timer (· 0:42) appears. null turns it off." },
        { name: "labels", type: "Partial<Record<TypingLabelKey, [string, string]>>", description: "Singular and plural wording per activity, for other languages or tone." },
        { name: "formatText", type: "(users: TypingUser[]) => string", description: "Replaces the whole status text." },
        { name: "align", type: '"start" | "end"', default: '"start"', description: "Which side of the conversation the bubble sits on." },
        { name: "className", type: "string", description: "Classes for the outer wrapper." },
        { name: "bubbleClassName", type: "string", description: "Classes for the bubble, e.g. a brand background." },
        { name: "markClassName", type: "string", description: "Text color classes for the marks, which draw in currentColor." },
      ]}
      types={[
        {
          name: "TypingUser",
          props: [
            { name: "id", type: "string", description: "Stable key. Falls back to the name." },
            { name: "name", type: "string", description: "Display name, used in the text and avatar initials." },
            { name: "avatarUrl", type: "string", description: "Avatar image. Colored initials are shown when missing." },
            { name: "activity", type: '"typing" | "paused" | "deleting" | "abandoned" | "recording" | "attaching" | "thinking"', default: '"typing"', description: "What they are doing right now. abandoned means they erased their draft instead of sending it." },
            { name: "intensity", type: "number", description: "Typing speed from 0 to 1. Picks a slow, steady or fast tempo." },
            { name: "draftLength", type: "number", description: "Characters in their draft. Only the length is shared, never the text." },
            { name: "startedAt", type: "number", description: "Epoch ms when they started. Drives the elapsed timer." },
          ],
        },
        {
          name: "useTypingActivity(options)",
          props: [
            { name: "pauseAfter", type: "number", default: "1500", description: "ms without a keystroke before the state becomes \"paused\"." },
            { name: "idleAfter", type: "number", default: "6000", description: "ms without a keystroke before activity becomes null (hide)." },
            { name: "sampleWindow", type: "number", default: "2500", description: "ms window used to measure typing speed." },
            { name: "fastRate", type: "number", default: "7", description: "Characters per second that count as full speed." },
            { name: "abandonAt", type: "number | null", default: "15", description: "Erasing a draft that reached this many characters reads \"changed their mind\" instead of going idle. null turns it off." },
            { name: "abandonedFor", type: "number", default: "2500", description: "ms the \"changed their mind\" state shows before the indicator hides." },
            { name: "→ returns", type: "{ activity, intensity, draftLength, startedAt, track, reset, asUser }", description: "Call track(value) in onChange and reset() after sending (so a sent message never reads as erased). asUser() builds a TypingUser." },
          ],
        },
      ]}
      accessibility={[
        "All status text sits in a polite live region outside the animated visuals, so screen readers hear \"Alex is rewriting\" rather than the animation.",
        "Live announcements are debounced, so quick typing and paused flips don't flood screen readers. The elapsed timer is never announced.",
        "Meaning never depends on motion or color alone: every activity has its own wording and avatar badge icon.",
        "prefers-reduced-motion replaces every animation with a slow fade and turns off the height transition.",
        "Only the draft length is shared, never its content. The \"changed their mind\" signal also comes from length alone.",
        "Default colors meet WCAG AA contrast in light and dark themes.",
      ]}
    />
  );
}
