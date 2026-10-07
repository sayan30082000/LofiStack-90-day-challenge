# Password Strength Input

> Week 02 · `input` · #9

A password field that explains itself: how long the password would take to crack in plain words, the single change that would help most, and a one-click memorable passphrase that already passes your rules. Plus a strength meter, rules checklist and confirm field.

- Live demo: https://lofistack-sayan.netlify.app/components/password-strength-input
- Source: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/password-strength-input.tsx
- Build prompt: https://lofistack-sayan.netlify.app/components/password-strength-input#prompt

```tsx
import { PasswordStrengthInput } from "@/components/ui/password-strength-input";
```

## ScorePasswordOptions

| Prop | Type | Default | Description |
|---|---|---|---|
| `commonPasswords` | `readonly string[]` | — | Passwords that are always scored Weak. Compared case-insensitively. |

## CrackTimeOptions

_extends ScorePasswordOptions_

| Prop | Type | Default | Description |
|---|---|---|---|
| `guessesPerSecond` | `number` | — | Attacker speed. Default 1e10: a fast offline attack on a leaked, weakly hashed password. |

## PassphraseOptions

| Prop | Type | Default | Description |
|---|---|---|---|
| `words` | `readonly string[]` | `DEFAULT_PASSPHRASE_WORDS` | Word list. Each word adds log2(words.length) bits. |
| `count` | `number` | `5` | Number of words. |
| `separators` | `string` | `"23456789!#%&*+=?"` | Characters placed between words, one picked at random each time. |
| `randomCase` | `boolean` | `true` | Randomly capitalise each word (adds 1 bit per word). |
| `accept` | `(value: string) => boolean` | — | Tries again (up to 50 times) until this returns true, e.g. to satisfy a form's rules. |

## PasswordStrengthInputProps

| Prop | Type | Default | Description |
|---|---|---|---|
| `label *` | `string` | — | Visible field label. |
| `value` | `string` | — | Current password (controlled). |
| `defaultValue` | `string` | `""` | Initial password (uncontrolled). |
| `onChange *` | `(value: string, result: PasswordStrengthResult) => void` | — | Called on every change with the new value and its strength result. |
| `rules` | `PasswordRule[]` | `DEFAULT_PASSWORD_RULES` | Checklist rules. Defaults to DEFAULT_PASSWORD_RULES. |
| `showChecklist` | `boolean` | `true` | Show the rules checklist under the meter. |
| `minStrength` | `1 \| 2 \| 3 \| 4` | `3` | Lowest acceptable score (1 Weak … 4 Strong). Marked on the meter. |
| `confirm` | `boolean` | `false` | Adds a confirm field that shows match / no match. |
| `confirmValue` | `string` | — | Confirm value (controlled). |
| `defaultConfirmValue` | `string` | `""` | Initial confirm value (uncontrolled). |
| `onConfirmChange` | `(value: string, matches: boolean) => void` | — | Called when the confirm field changes. |
| `error` | `string` | — | Error message, e.g. from the server. Marks the field invalid. |
| `disabled` | `boolean` | `false` | — |
| `required` | `boolean` | — | — |
| `description` | `string` | — | Hint under the label. |
| `id` | `string` | — | Input id. Generated when omitted. |
| `name` | `string` | — | — |
| `confirmName` | `string` | — | — |
| `placeholder` | `string` | — | — |
| `autoComplete` | `string` | `"new-password"` | — |
| `scoreOptions` | `ScorePasswordOptions` | — | Options passed to scorePassword, e.g. a bigger commonPasswords list. |
| `strengthLabels` | `[weak: string, fair: string, good: string, strong: string]` | `["Weak", "Fair", "Good", "Strong"]` | Labels for scores 1 to 4. |
| `meterLabel` | `string` | `"Password strength"` | Accessible name of the meter. |
| `emptyText` | `string` | `"Not set"` | Meter text while the field is empty. |
| `minStrengthText` | `(requiredLabel: string) => string` | `(l) => `${l} or stronger required`` | Hint shown while the score is below minStrength. |
| `toggleLabel` | `string` | `"Show password"` | Accessible name of the show/hide toggle. Its pressed state says whether the password is visible. |
| `capsLockText` | `string` | `"Caps Lock is on"` | — |
| `confirmLabel` | `string` | `"Confirm password"` | — |
| `matchText` | `string` | `"Passwords match"` | — |
| `mismatchText` | `string` | `"Passwords don't match"` | — |
| `checklistLabel` | `string` | `"Your password needs"` | Heading above the checklist. |
| `ruleMetText` | `string` | `"done"` | Screen reader suffixes for checklist items. |
| `ruleUnmetText` | `string` | `"missing"` | — |
| `announceDelay` | `number` | `800` | Milliseconds of quiet typing before the strength is announced. |
| `showCrackTime` | `boolean` | `true` | Shows how long the password would take to crack, in plain words. |
| `guessesPerSecond` | `number` | `1e10` | Attacker speed used for the crack time. Default 1e10 guesses per second (fast offline attack). |
| `crackTimeText` | `(time: string) => string` | `(t) => (t === "instantly" ? "Could be cracked instantly" : `${aboutOrWould(t)} ${t} to crack`)` | Crack time sentence, e.g. (t) => `About ${t} to crack`. |
| `showTips` | `boolean` | `true` | Shows the single change that would help most. |
| `tipText` | `Partial<Record<PasswordTipId, (after?: string) => string>>` | — | Tip wording per tip id. `after` is the crack time once the tip is followed. |
| `suggestPassphrase` | `boolean` | `true` | Offers a random, memorable passphrase that already passes the rules. |
| `passphraseOptions` | `Omit<PassphraseOptions, "accept">` | — | Word list, word count and separators for the suggestion. |
| `suggestText` | `string` | `"Suggest a passphrase"` | — |
| `useSuggestionText` | `string` | `"Use it"` | — |
| `anotherSuggestionText` | `string` | `"Another"` | — |
| `dismissSuggestionText` | `string` | `"Dismiss suggestion"` | — |
| `suggestionStrengthText` | `(time: string) => string` | `(t) => `${aboutOrWould(t)} ${t} to crack, even if the attacker knows how it was made.`` | Strength sentence under the suggestion. |
| `suggestionUsedText` | `string` | `"Passphrase filled in and shown so you can save it."` | Announced after a suggestion is filled in. |
| `className` | `string` | — | — |

`*` = required. Generated by `npm run docs` from the TypeScript source; edit the JSDoc comments, not this file.
