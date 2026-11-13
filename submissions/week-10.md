# Week 10 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 10
Type: modal
Component: Toast System
Live: lofistack-sayan.netlify.app/components/toast
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/toast.tsx
Prompt:
Build the "Toast System" component (#35, Type: modal) for my LofiStack component gallery.
Route: /components/toast

What it does:
- A complete toaster: one <Toaster /> plus an imperative toast() API (success, error, info, warning, loading, promise, dismiss) from a tiny external store read with useSyncExternalStore; a stack that peeks as a deck and fans out on hover or focus (which pauses every timer, as does a hidden tab); six positions; max visible with a queue; a progress bar; swipe or flick to dismiss; an action button; update in place by id; Clear all; F8 to jump to the newest toast; theme copied into the portal.
- Merging: exported pure toastMergeKey(type, message, group) — toasts with the same group, or the same type and text, merge into the one on screen instead of stacking: it moves to the front, its timer restarts, a ×3 badge bumps (read as “3 times”). groupMessage(count, latest) words a summary (“3 photos uploaded”, no badge then). group: false always stacks; loading toasts never merge.
- Reading time: the Toaster's duration defaults to "auto": exported pure readingTime(text) gives 3s + 0.3s per word of the message and description, between 4s and 15s.
- toast.undo(message, { onUndo, onCommit, undoLabel, undoneMessage }): for changes that are easy to take back. The change is applied in the UI at once, but onCommit runs only when the toast closes in any other way (timer, ×, swipe, Escape, Clear all); Undo, or Ctrl/⌘+Z anywhere outside a text field (undoShortcut), runs onUndo instead and shows a short “Undone”. The Undo button shows its shortcut.

Props (export an interface named ToastProps):
Toaster: position, max, duration (number | "auto"), expand, closeButton, showProgress, gap, peek, offset, width, swipeThreshold, hotkey, label, dismissLabel, clearAllLabel, icons, zIndex, toastClassName, undoShortcut. toast(message, { description, action, duration, id, dismissible, onDismiss, onAutoClose, group, groupMessage }); toast.undo(message, { onUndo, onCommit?, undoLabel?, undoneMessage?, ... })

Accessibility:
A region named “Notifications (F8)” with persistent polite and assertive live regions (errors interrupt); each toast is announced once, and again when a merge changes it; close buttons are named with the message; F8, Tab and Escape work; the Undo button has aria-keyshortcuts and Ctrl/⌘+Z never hijacks text-field undo; hover/focus pause timers and auto durations follow reading time (WCAG 2.2.1); reduced motion fades instead of sliding.

Demo page shows:
1) A playground for every type, position and stack size. 2) toast.promise. 3) An inbox where archiving uses toast.undo(): Undo or Ctrl/⌘+Z brings the email back, and a line shows what was actually saved to the “server”. 4) Merging: Save pressed repeatedly gives “Draft saved ×3”, uploads in one group become “3 photos uploaded”, and a long message stays up longer.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/toast.tsx (split into a folder components/ui/toast/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/toast/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "toast", type "modal").

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
Week: 10
Type: navbar
Component: Breadcrumbs
Live: lofistack-sayan.netlify.app/components/breadcrumbs
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/breadcrumbs.tsx
Prompt:
Build the "Breadcrumbs" component (#42, Type: navbar) for my LofiStack component gallery.
Route: /components/breadcrumbs

What it does:
- A complete breadcrumb trail: a nav landmark around an ordered list; chevron, slash or custom separators; the last item is the current page; long paths collapse into a “…” menu that shows the hidden levels as a small tree (maxItems, itemsBeforeCollapse, itemsAfterCollapse); long labels truncate with a tooltip only when actually cut off; an optional house icon; a compact “← Parent” link below ~448px via a container query; skeleton loading; renderLink for next/link.
- Sibling switcher: BreadcrumbItem.siblings lists the other items at the same level (other workspaces, projects, settings pages). A small ▾ after the crumb opens a menu of those links; the crumb itself is ticked and read as “Billing, current”. Menus with more than siblingFilterThreshold items (default 7) get a filter box; exported pure filterSiblings(items, query) matches anywhere, ignoring case and accents, and the number of matches is announced. It also works on the current page, which has no link (switch to a sibling page).
- Keyboard: Arrow Down on a ▾ opens it into the filter box (or the first link), Arrow Up into the last; arrows, Home and End move through the links, Arrow Up from the first link returns to the filter, Escape closes and returns focus to the ▾; clicking outside or tabbing away closes it.

Props (export an interface named BreadcrumbsProps):
items: { label, href?, icon?, disabled?, siblings? }[], maxItems, separator: 'chevron' | 'slash' | ReactNode, itemsBeforeCollapse, itemsAfterCollapse, renderLink, showHomeIcon, homeIconOnly, mobileBackLink, backLabel, backAriaLabel, label, expandLabel, maxLabelWidth, loading, loadingLabel, loadingCount, siblingsLabel, siblingFilterThreshold, siblingFilterLabel, noMatchesLabel, className

Accessibility:
Separators are aria-hidden; the current page has aria-current="page"; the “…” and every ▾ are buttons with aria-expanded and aria-controls, named “Show 3 more” and “Other items next to Lofi Gallery”; menus are lists of real links with arrow-key movement and Escape back to the button; the current sibling is read as “…, current”; 40px targets; reduced motion removes the menu animation.

Demo page shows:
1) A SaaS header path Acme Studio / Lofi Gallery / Settings / Billing where every level switches sideways: 3 workspaces, 12 projects with a filter box, and 5 settings pages. 2) A deep file path that collapses with tooltips and a mobile back link. 3) A short path with a home icon and loading. 4) Custom separators with a disabled crumb.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/breadcrumbs.tsx (split into a folder components/ui/breadcrumbs/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/breadcrumbs/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "breadcrumbs", type "navbar").

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
