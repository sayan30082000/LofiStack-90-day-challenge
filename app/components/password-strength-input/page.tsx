import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { CompactDemo, CustomRulesDemo, SignUpDemo } from "./demos";

export const metadata: Metadata = {
  title: "Password Strength Input",
  description:
    "Password field with a show/hide toggle, a 4-segment strength meter, a live rules checklist, a confirm field and a Caps Lock warning.",
};

const signUpCode = `
const [password, setPassword] = useState("");
const [confirm, setConfirm] = useState("");
const [result, setResult] = useState<PasswordStrengthResult | null>(null);

<PasswordStrengthInput
  label="Password"
  name="password"
  value={password}
  onChange={(value, result) => {
    setPassword(value);
    setResult(result); // { score, label, valid, passedRules }
  }}
  confirm
  confirmValue={confirm}
  onConfirmChange={setConfirm}
  minStrength={3}
  required
/>

<button type="submit" disabled={!result?.valid}>Create account</button>`;

const customCode = `
const adminRules: PasswordRule[] = [
  { id: "min12", label: "At least 12 characters", test: (v) => v.length >= 12 },
  { id: "nospace", label: "No spaces", test: (v) => !/\\s/.test(v) },
  { id: "digit", label: "At least 2 numbers", test: (v) => (v.match(/\\d/g) ?? []).length >= 2 },
];

<PasswordStrengthInput
  label="New key"
  description="Admins need a longer key. Spaces are not allowed."
  value={value}
  onChange={(v, r) => { setValue(v); setResult(r); setError(undefined); }}
  rules={adminRules}
  minStrength={4}
  error={error}
  checklistLabel="Admin key policy"
  strengthLabels={["Weak", "Fair", "Good", "Vault-grade"]}
/>`;

const compactCode = `
<PasswordStrengthInput
  label="Wi-Fi password"
  value={value}
  onChange={setValue}
  showChecklist={false}
  minStrength={2}
/>

<PasswordStrengthInput label="Disabled" value={value} onChange={setValue} showChecklist={false} disabled />`;

const usage = `
import { PasswordStrengthInput, scorePassword } from "@/components/ui/password-strength-input";

export function Example() {
  const [password, setPassword] = useState("");
  return <PasswordStrengthInput label="Password" value={password} onChange={setPassword} />;
}

// The scorer is pure and exported, so the server can use the same rules:
scorePassword("correct horse battery staple").score; // 4 (Strong)
scorePassword("Password123!").score;                  // 1 (Weak, common password)`;

export default function Page() {
  return (
    <ComponentPage
      slug="password-strength-input"
      examples={[
        {
          title: "Sign-up form",
          description:
            "Confirm field with match / no match, a minimum-strength notch on the meter, and a submit button that waits for a valid, matching password. Turn Caps Lock on to see the warning.",
          preview: <SignUpDemo />,
          code: signUpCode,
          minHeight: 560,
        },
        {
          title: "Custom rules",
          description:
            "A stricter policy (12+ characters, no spaces, two numbers) with a Strong minimum, renamed strength labels and a server-style error on save.",
          preview: <CustomRulesDemo />,
          code: customCode,
          minHeight: 440,
        },
        {
          title: "Compact",
          description: "No checklist: just the field, the toggle and the meter. Also shown disabled.",
          preview: <CompactDemo />,
          code: compactCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "label", type: "string", description: "Visible label of the password field. Required." },
        { name: "value", type: "string", description: "Current password (controlled)." },
        { name: "defaultValue", type: "string", default: '""', description: "Initial password (uncontrolled)." },
        { name: "onChange", type: "(value: string, result: PasswordStrengthResult) => void", description: "Called on every keystroke with the value and its score, label, validity and passing rule ids. Required." },
        { name: "rules", type: "PasswordRule[]", default: "DEFAULT_PASSWORD_RULES", description: "Checklist rules. Defaults: 8+ characters, lowercase, uppercase, number, symbol." },
        { name: "showChecklist", type: "boolean", default: "true", description: "Show the rules checklist under the meter." },
        { name: "minStrength", type: "1 | 2 | 3 | 4", default: "3", description: "Lowest acceptable score. Marked with a notch on the meter and required for result.valid." },
        { name: "confirm", type: "boolean", default: "false", description: "Adds a confirm field that reports match / no match." },
        { name: "confirmValue", type: "string", description: "Confirm value (controlled)." },
        { name: "defaultConfirmValue", type: "string", default: '""', description: "Initial confirm value (uncontrolled)." },
        { name: "onConfirmChange", type: "(value: string, matches: boolean) => void", description: "Called when the confirm field changes." },
        { name: "error", type: "string", description: "Error message. Sets aria-invalid and a red border." },
        { name: "disabled", type: "boolean", default: "false", description: "Disables both fields and the toggle." },
        { name: "required", type: "boolean", default: "false", description: "Marks the fields required." },
        { name: "description", type: "string", description: "Hint under the label, linked with aria-describedby." },
        { name: "id / name / confirmName", type: "string", description: "Input id (generated when omitted) and form field names." },
        { name: "placeholder", type: "string", description: "Placeholder of the password field." },
        { name: "autoComplete", type: "string", default: '"new-password"', description: "Lets password managers suggest a strong password." },
        { name: "scoreOptions", type: "ScorePasswordOptions", description: "Passed to scorePassword, e.g. { commonPasswords: myList }." },
        { name: "strengthLabels", type: "[string, string, string, string]", default: '["Weak", "Fair", "Good", "Strong"]', description: "Labels for scores 1 to 4." },
        { name: "meterLabel", type: "string", default: '"Password strength"', description: "Accessible name of the meter and prefix of announcements." },
        { name: "emptyText", type: "string", default: '"Not set"', description: "Meter text while the field is empty." },
        { name: "minStrengthText", type: "(requiredLabel: string) => string", default: "l => `${l} or stronger required`", description: "Hint shown while the score is below minStrength." },
        { name: "toggleLabel", type: "string", default: '"Show password"', description: "Accessible name of the toggle; aria-pressed tells whether the password is visible." },
        { name: "capsLockText", type: "string", default: '"Caps Lock is on"', description: "Warning shown while Caps Lock is on in a focused field." },
        { name: "confirmLabel / matchText / mismatchText", type: "string", default: '"Confirm password" / "Passwords match" / "Passwords don\'t match"', description: "Confirm field wording." },
        { name: "checklistLabel", type: "string", default: '"Your password needs"', description: "Heading of the checklist, also its accessible name." },
        { name: "ruleMetText / ruleUnmetText", type: "string", default: '"done" / "missing"', description: "Screen reader suffix for each checklist item." },
        { name: "announceDelay", type: "number", default: "800", description: "Milliseconds of quiet typing before the strength is announced." },
        { name: "className", type: "string", description: "Classes for the root." },
      ]}
      types={[
        {
          name: "PasswordRule",
          props: [
            { name: "id", type: "string", description: "Stable id, returned in result.passedRules." },
            { name: "label", type: "string", description: "Checklist text." },
            { name: "test", type: "(value: string) => boolean", description: "True when the password satisfies the rule." },
          ],
        },
        {
          name: "scorePassword(password, options?)",
          props: [
            { name: "returns.score", type: "0 | 1 | 2 | 3 | 4", description: "0 empty, then Weak, Fair, Good, Strong. Points for length (8/12/16/20) and variety, minus repeats (aaa) and sequences (abc, 321)." },
            { name: "returns.checks", type: "PasswordChecks", description: "length, lower, upper, number, symbol, common, repeated, sequential." },
            { name: "options.commonPasswords", type: "readonly string[]", default: "DEFAULT_COMMON_PASSWORDS", description: "Always Weak. Also matched after stripping trailing digits/symbols and undoing l33t swaps (P@ssw0rd)." },
          ],
        },
      ]}
      accessibility={[
        "The show/hide toggle is a real button labelled \"Show password\" with aria-pressed, and aria-controls pointing at both fields. It is 40×40px.",
        "The meter has role=\"meter\" with aria-valuemin/max/now and aria-valuetext such as \"Fair. Good or stronger required\".",
        "Strength changes are announced through a polite live region only after typing pauses (800ms by default), so screen readers are not flooded.",
        "The checklist is a real <ul> named by its heading; each item has hidden \"done\" / \"missing\" text so the state isn't conveyed by icon or color alone.",
        "The error message, description, Caps Lock warning and min-strength hint are linked with aria-describedby; error sets aria-invalid.",
        "The confirm field announces match / no match politely and only flags a mismatch once it can no longer become a match, or after blur.",
        "Transitions on the meter and checklist are removed under prefers-reduced-motion.",
      ]}
    />
  );
}
