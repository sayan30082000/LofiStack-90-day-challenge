import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { ChatDemo, ConverterDemo, FormDemo } from "./demos";

export const metadata: Metadata = {
  title: "Bangla Phonetic Input",
  description:
    "Type Bangla with English letters, Avro-style: ami tomake bhalobashi becomes আমি তোমাকে ভালোবাসি, with a suggestion bar, a common-word dictionary and Ctrl+M to switch language.",
};

const chatCode = `
const [draft, setDraft] = useState("");

<BanglaPhoneticInput
  label="Reply in Bangla"
  multiline
  value={draft}
  onChange={setDraft}
  onCommit={(bangla, roman) => console.log(roman, "→", bangla)}
/>`;

const formCode = `
// Your own words, keyed in lowercase phonetic English
const BRAND_WORDS = { lofistack: "লফিস্ট্যাক", netlify: "নেটলিফাই" };

<BanglaPhoneticInput label="Your name" value={name} onChange={setName} dictionary={BRAND_WORDS} />`;

const converterCode = `
import { transliterate, transliterateText, suggestBangla } from "@/components/ui/bangla-phonetic-input";

transliterate("prothom");              // "প্রথম"  (rules only)
suggestBangla("tomake");               // ["তোমাকে", "তমাকে"]  (dictionary first)
transliterateText("ami tomake bhalobashi.");  // "আমি তোমাকে ভালোবাসি।"`;

const usage = `
import { BanglaPhoneticInput } from "@/components/ui/bangla-phonetic-input";

export function Example() {
  const [text, setText] = useState("");
  return <BanglaPhoneticInput label="Message" value={text} onChange={setText} />;
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="bangla-phonetic-input"
      examples={[
        {
          title: "Chat in Bangla",
          description:
            "Type valo achi tumi kemon acho and press Space after each word. A suggestion bar shows the Bangla while you type: ↑ ↓ pick another spelling, Enter takes it, Esc keeps the English word, Ctrl+M switches language.",
          preview: <ChatDemo />,
          code: chatCode,
          minHeight: 460,
        },
        {
          title: "Your own words",
          description: "The dictionary prop adds brand and people names, so lofistack becomes লফিস্ট্যাক and sayan becomes সায়ন.",
          preview: <FormDemo />,
          code: formCode,
          minHeight: 320,
        },
        {
          title: "Convert a whole paragraph",
          description:
            "The rules are exported as pure functions, so a paragraph converts in one call (on the server too). Pasting English into the input does the same.",
          preview: <ConverterDemo />,
          code: converterCode,
          minHeight: 300,
        },
      ]}
      usage={usage}
      props={[
        { name: "label", type: "string", description: "Visible label. Required." },
        { name: "value / defaultValue", type: "string", description: "Text, controlled or uncontrolled." },
        { name: "onChange", type: "(value: string) => void", description: "Called with the new text after every change and conversion." },
        { name: "defaultBangla", type: "boolean", default: "true", description: "Start in Bangla or English. The toggle and Ctrl+M switch." },
        { name: "onModeChange", type: "(bangla: boolean) => void", description: "Called when the language switches." },
        { name: "multiline / rows", type: "boolean / number", default: "false / 3", description: "Textarea instead of a single line." },
        { name: "dictionary", type: "Record<string, string | string[]>", description: "Extra or overriding words, keyed in lowercase phonetic English. Merged with DEFAULT_BANGLA_DICTIONARY (about 230 everyday words)." },
        { name: "maxSuggestions", type: "number", default: "4", description: "Bangla suggestions per word. The English original is always added last." },
        { name: "convertPaste", type: "boolean", default: "true", description: "Convert phonetic English pasted while in Bangla mode." },
        { name: "onCommit", type: "(bangla: string, roman: string) => void", description: "Called each time a word is converted." },
        { name: "placeholder / hint / name / id / disabled / required", type: "…", description: "Standard field props. hint defaults to the keyboard help." },
        { name: "banglaLabel / englishLabel / toggleLabel / suggestionsLabel / keepEnglishLabel", type: "string", description: "Every visible and spoken string. The toggle always shows banglaLabel and uses aria-pressed for on and off." },
        { name: "className / inputClassName", type: "string", description: "Classes for the root and the field." },
      ]}
      types={[
        {
          name: "Pure helpers",
          props: [
            { name: "transliterate(roman)", type: "string", description: "Rule-based Avro-style conversion: case-sensitive (t ত / T ট), conjuncts (ন্ধ, ক্ত), ra-phala (প্র), ya-phala (ক্য), ng → ং or ঙ, digits → ০–৯." },
            { name: "suggestBangla(roman, dictionary?, max?)", type: "string[]", description: "Dictionary words first, then the rule reading, then variants (final ো, স/শ, reph)." },
            { name: "transliterateText(text, dictionary?)", type: "string", description: "Converts every word of a sentence and turns full stops into দাঁড়ি (।)." },
          ],
        },
      ]}
      accessibility={[
        "The single-line field is a WAI-ARIA combobox (aria-expanded, aria-controls, aria-activedescendant) and the suggestions are a listbox, so screen readers hear the highlighted suggestion as ↑ ↓ move it.",
        "The top suggestion is also announced in a polite live region after typing pauses, so the converted word is heard without leaving the field.",
        "The field gets lang=\"bn\" in Bangla mode, so screen readers switch to a Bangla voice.",
        "The language toggle is a button with aria-pressed and aria-keyshortcuts=\"Control+M\". Suggestions are 40px tall and clickable without moving focus out of the field.",
        "Autocorrect, autocapitalise and spellcheck are off, so phone keyboards don't fight the conversion.",
      ]}
    />
  );
}
