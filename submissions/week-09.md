# Week 09 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 09
Type: form
Component: Newsletter Signup
Live: lofistack-sayan.netlify.app/components/newsletter-signup
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/newsletter-signup.tsx
Prompt:
Build the "Newsletter Signup" component (#19, Type: form) for my LofiStack component gallery.
Route: /components/newsletter-signup

What it does:
- A complete signup: email field and button on one row (stacking in narrow containers), validation on submit then live once flagged, distinct idle/submitting/success/error states, a shake on error, an optional consent checkbox, a success screen that replaces the form with “Use another email”, and card or inline variants.
- Typo check (suggestDomains, default: common providers): exported pure suggestEmail(email, domains) finds a known provider one or two keystrokes away (gmial.com → gmail.com, hotmail.co → hotmail.com, gmailcom → gmail.com; shorter domains get less slack), and fixes only known slips in endings (.con → .com, .ner → .net, .ogr → .org) so real country domains like .ca, .bb or .cm are never “corrected”. The suggestion shows after the field is left (not while typing): “Did you mean jane@gmail.com?” with Yes, fix it / No, keep mine. Pressing Subscribe with an unanswered suggestion doesn't send; it moves focus to Yes, fix it. Keeping the typed address is remembered.
- Open your inbox: exported pure inboxFor(email, sender?) maps Gmail/Googlemail, Outlook/Hotmail/Live/MSN, Yahoo/Ymail, iCloud/me/mac, Proton, AOL, Zoho and Yandex to their webmail; for Gmail it links to a search for senderEmail (from:… in:anywhere) so the confirmation email is the first thing you see. The success screen shows an “Open Gmail” button (new tab, said so for screen readers); unknown domains get no button.

Props (export an interface named NewsletterSignupProps):
onSubscribe(email): Promise<void>, title, description, titleAs, label, placeholder, buttonText, submittingText, retryText, successTitle, successMessage, resetText, requireConsent, consentLabel, emptyErrorText, invalidErrorText, consentErrorText, errorText, validate?, footnote, icon, variant: 'card' | 'inline', disabled, suggestDomains (string[] | false), senderEmail?, showInboxLink, suggestionText, acceptSuggestionText, keepTypedText, openInboxText, className

Accessibility:
Visually hidden label; errors linked with aria-describedby and the field focused on error; the typo suggestion sits in a status region, is linked to the field and gets focus when Subscribe is pressed with a likely typo; the confirmation is a focused status region; the inbox link says it opens a new tab; motion removed with reduced motion.

Demo page shows:
1) A blog footer card with senderEmail: try jane@gmial.com, jane@hotmail.con, a gmail.com address for the Open Gmail button, or “fail” for the error state. 2) An inline variant. 3) A fake API with a consent checkbox.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/newsletter-signup.tsx (split into a folder components/ui/newsletter-signup/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/newsletter-signup/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "newsletter-signup", type "form").

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
Week: 09
Type: table
Component: Data Table
Live: lofistack-sayan.netlify.app/components/data-table
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/data-table.tsx
Prompt:
Build the "Data Table" component (#46, Type: table) for my LofiStack component gallery.
Route: /components/data-table

What it does:
- A complete typed table: columns with accessor, cell renderer, three-state sorting (stable), alignment, min width; global search; one select filter; pagination with rows-per-page; checkbox selection with select-all-on-page, “Select all N” and a bulk action bar; a column visibility menu; sticky header and pinned first column with a shadow when scrolled; loading skeletons, empty and no-results states.
- Filters in the search box: exported pure parseTableQuery(query) reads words, "quoted phrases", column:value (text in that column), column>n, <, >=, <= (numbers like 1.5k, $1,250 or 12%, and dates like 2024, 2024-06 or 2024-06-14), and a leading - to negate any term; matchesQuery(row, terms, columns) ANDs them. Columns answer to queryKey (default id) or their header without spaces; queryValue overrides what's compared. Each column filter shows as a chip (“Role: admin”, “Spend > 5000”, “not Status: suspended”) that removes itself from the query. unknownFields(terms, columns) reports filters naming no column with the closest key (“No column called “rol”. Did you mean “role”?” + a Use role button). query/defaultQuery/onQueryChange make it controllable.
- Summary row: ColumnDef.summary is "sum" | "avg" | "min" | "max" | "count" | (rows) => ReactNode (exported pure summarize), formatted with summaryFormat, shown in a <tfoot> that sticks to the bottom of the scroll area. It covers the rows matching the search and filter, or the selected rows while there is a selection, and its first cell says which: “Total (11 rows)” or “Selected (3)”.

Props (export an interface named DataTableProps):
data, columns: ColumnDef<T>[] ({ id, header, accessor, cell?, sortable, sortValue?, align, searchable, hideable, defaultHidden, minWidth, className, queryKey?, queryValue?, summary?, summaryFormat? }), getRowId, caption, showCaption, searchable, query? / defaultQuery / onQueryChange, filter?, pageSize, pageSizeOptions, selectable, onSelectionChange, bulkActions, getRowLabel, loading, emptyState, stickyFirstColumn, maxHeight, columnMenu, labels, className

Accessibility:
A real <table> with caption, scope and aria-sort; the scroll area is a focusable labelled region; filter chips are buttons named “Remove filter Role: admin” and return focus to the search box; the result count is announced; checkboxes are named per row; the summary is a <tfoot> whose first cell names what it covers; 40px targets; motion removed with reduced motion.

Demo page shows:
Workspace members: 50 seeded users with Try buttons for role:admin, spend>5000, joined<2024 -status:suspended, role:editor spend>=1k and a misspelled rol:viewer; a footer that totals Spend and counts active users for the matches or the selection; bulk Export/Suspend/Delete; loading and empty toggles. Plus a minimal invoices table.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/data-table.tsx (split into a folder components/ui/data-table/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/data-table/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "data-table", type "table").

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
