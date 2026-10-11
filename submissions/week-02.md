# Week 02 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 02
Type: input
Component: Bangla Phonetic Input
Live: lofistack-sayan.netlify.app/components/bangla-phonetic-input
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/bangla-phonetic-input/index.tsx
Prompt:
Build the "Bangla Phonetic Input" component (#71, Type: input) for my LofiStack component gallery.
Route: /components/bangla-phonetic-input

What it does:
- An input that turns phonetic English into Bangla as you type, the way Avro Phonetic does: "ami tomake bhalobashi" becomes "আমি তোমাকে ভালোবাসি". No Bangla keyboard needed.
- Pure, exported transliterate(roman): longest-match, case-sensitive Avro rules (t ত / T ট, d দ / D ড, n ন / N ণ, sh শ / S ষ, r র / R ড়, o inherent / O ো, i ি / I ী, u ু / U ূ, rri ৃ), vowels as kar after a consonant and full letters elsewhere, a list of real conjuncts (ন্ধ ক্ত স্ত ক্ষ…), ra-phala after most consonants (প্র গ্র) but not ম (আমরা), y → য-ফলা after a consonant and য় elsewhere, w → ব-ফলা, ng → ং or ঙ before a vowel (বাংলা, বাঙালি), rr → reph, ^ → ঁ, digits → ০–৯.
- Pure suggestBangla(roman, dictionary): dictionary words first (DEFAULT_BANGLA_DICTIONARY, about 230 everyday words and loanwords: তোমাকে, ভালোবাসি, ঢাকা, ধন্যবাদ…), then the rule reading, then variants (final ো, স/শ swap, reph). transliterateText(text) converts a paragraph and turns full stops into দাঁড়ি (।).
- The field converts each word when you type a space, newline or punctuation after it. A suggestion bar under it shows the current word's candidates plus the English original; ↑ ↓ pick, Enter takes one, Esc keeps English, clicking takes one without losing focus. Ctrl+M or a toggle switches Bangla / English. Pasting English in Bangla mode converts it. A dictionary prop adds your own words (brand names, people). Works with phone keyboards (no keydown dependence: it reads what changed), autocorrect off.

Props (export an interface named BanglaPhoneticInputProps):
label, value? / defaultValue, onChange(value), defaultBangla, onModeChange, multiline, rows, dictionary?: Record<string, string | string[]>, maxSuggestions, convertPaste, onCommit(bangla, roman), placeholder, hint, name, id, disabled, required, banglaLabel, englishLabel, toggleLabel, suggestionsLabel, keepEnglishLabel

Accessibility:
Single-line field is a WAI-ARIA combobox (aria-expanded, aria-controls, aria-activedescendant) with a listbox of suggestions; the top suggestion is announced politely after typing pauses; lang="bn" in Bangla mode so screen readers switch voice; the toggle has aria-pressed and aria-keyshortcuts="Control+M"; 40px suggestion targets.

Demo page shows:
1) A chat reply box in Bangla with a converted-word count. 2) A form whose dictionary prop adds brand words (lofistack → লফিস্ট্যাক). 3) A paragraph converter using transliterateText with a Copy button.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/bangla-phonetic-input.tsx (split into a folder components/ui/bangla-phonetic-input/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/bangla-phonetic-input/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "bangla-phonetic-input", type "input").

Rules:
- TypeScript interfaces for every prop, with short JSDoc comments. No `any`.
- Nothing hardcoded inside the component: text, data, sizes and colors come from props with sensible defaults.
- No UI kits (shadcn, MUI, Radix, Headless UI, etc.). Allowed dependencies: none beyond the project's existing ones.
- Fully responsive at 375px, 768px and 1280px; touch targets at least 40px.
- Include every state that applies: hover, active, focus-visible, disabled, loading, error, empty.
- Dark mode via Tailwind dark: variants, WCAG AA contrast in both themes.
- Respect prefers-reduced-motion (motion-safe: / motion-reduce:).
- The accessibility points above are required, not optional.
- Complete files only, no placeholders or TODOs. After the code, list 5 quick manual checks I can do to test it.
````

## Post 2

````text
Week: 02
Type: card
Component: Tear-off Ticket Card
Live: lofistack-sayan.netlify.app/components/ticket-card
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/ticket-card.tsx
Prompt:
Build the "Tear-off Ticket Card" component (#72, Type: card) for my LofiStack component gallery.
Route: /components/ticket-card

What it does:
- A ticket card (concert, boarding pass, cinema) whose stub tears off along a perforated edge like real paper.
- Drag the stub away from the main part: it follows the pointer, rotating from the far corner so the perforation opens; past tearThreshold (half its size) it rips free on release with a short flying animation and a light vibration; earlier, it springs back. Pointer capture, touch-action none, drags starting on buttons or links ignored. A 40px scissors button tears it from the keyboard. onTear fires once; tornContent shows where the stub was (e.g. "Checked in 7:42 PM").
- Layout: stub on the right, or at the bottom when the ticket is narrower than 520px (orientation auto | horizontal | vertical). Notches at the perforation are cut with CSS masks so any background shows through, a dashed perforation line, drop shadow on the masked shape.
- TicketBarcode: a real, scannable Code 39 barcode as SVG (0-9, A-Z, space, - .), built from Code 39's structure (10 bar patterns × 4 wide-space positions) instead of a typed table, quiet zones, dark bars on white in both themes. AddToCalendar + pure ticketToIcs(event): an .ics file with UTC times, escaped text and CRLF line ends.
- A used state stamps the ticket and locks the stub.

Props (export an interface named TicketCardProps):
label, main, stub, orientation, stubSize, torn? / defaultTorn, onTear, tearThreshold, used, usedLabel, tornContent, tearLabel, tornText, notch, className, paperClassName, mainClassName, stubClassName. TicketBarcode: value, height, showValue. AddToCalendar: event { title, start, end, location?, description?, uid? }, label, fileName

Accessibility:
The ticket is an article named by label; dragging always has the scissors-button alternative; tearing and the used state are announced in a polite live region; the barcode is role=img named "Barcode …"; reduced motion skips the flying animation; text on coloured paper stays above 4.5:1.

Demo page shows:
1) A concert ticket on a purple gradient with gate/row/seat, Add to calendar and a check-in stub with a barcode; a New ticket button resets it. 2) A vertical boarding pass DAC → CXB with a barcode stub you drag down. 3) A used cinema ticket.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/ticket-card.tsx (split into a folder components/ui/ticket-card/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/ticket-card/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "ticket-card", type "card").

Rules:
- TypeScript interfaces for every prop, with short JSDoc comments. No `any`.
- Nothing hardcoded inside the component: text, data, sizes and colors come from props with sensible defaults.
- No UI kits (shadcn, MUI, Radix, Headless UI, etc.). Allowed dependencies: none beyond the project's existing ones.
- Fully responsive at 375px, 768px and 1280px; touch targets at least 40px.
- Include every state that applies: hover, active, focus-visible, disabled, loading, error, empty.
- Dark mode via Tailwind dark: variants, WCAG AA contrast in both themes.
- Respect prefers-reduced-motion (motion-safe: / motion-reduce:).
- The accessibility points above are required, not optional.
- Complete files only, no placeholders or TODOs. After the code, list 5 quick manual checks I can do to test it.
````
