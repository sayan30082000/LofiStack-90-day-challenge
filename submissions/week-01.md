# Week 01 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 01
Type: table
Component: Tree View
Live: lofistack-sayan.netlify.app/components/tree-view
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/tree-view.tsx
Prompt:
Build the "Tree View" component (#49, Type: table) for my LofiStack component gallery.
Route: /components/tree-view

What it does:
- A change-aware tree, not just a file tree: it answers "what changed since I last looked?". Most tree components only expand, collapse and select.
- Nodes can carry status: 'added' | 'modified' | 'removed' and changedAt (epoch ms). Each changed row shows a short marker (A / M / R by default, overridable with statusLabels, e.g. + / − for a permissions diff). Removed nodes are struck through. Markers are not colour-only.
- Closed folders roll up the changes inside them as small counts (+2 ~1 −1), so you can see where the changes are without opening anything.
- trackSeen: a dot marks changes you haven't seen yet. A change counts as seen after it has been on screen for seenDelay ms (1500), and the dot fades out. Closed folders carry the dot for unseen changes inside them. Seen state is controlled (seen / onSeenChange) or uncontrolled, and persistSeenKey remembers it in localStorage between visits (read after mount to avoid hydration mismatches, every access in try/catch). A seen key is id@changedAt, so a newer change on the same node shows its dot again; export changeKey(node).
- changesOnly: shows only changed nodes plus their folders (forced open), combined with the text filter.
- Jump between changes: Alt+Down / Alt+Up focus the next or previous change in tree order, opening closed folders on the way. Also exposed through a ref (React 19 ref prop) as TreeViewHandle { focusNextChange(), focusPreviousChange(), markAllSeen() } for toolbar buttons.
- Everything a solid tree needs too: expand/collapse with chevrons and indentation guides, icons per node type, selection modes none / single / multiple / checkbox (tri-state parents that cascade both ways, disabled nodes skipped), a search filter that keeps matching nodes' ancestors and auto-expands them with the match highlighted, lazy children via async loadChildren with a spinner and an error + retry state.

Props (export an interface named TreeViewProps):
data: { id, label, icon?, children?, isLeaf?, disabled?, status?, changedAt? }[], label, selectionMode, expanded? / defaultExpanded / onExpandedChange, selected? / defaultSelected / onSelectedChange, loadChildren?, filter?, onActivate?, showIcons, showGuides, size: 'sm' | 'md', changesOnly, statusLabels?, trackSeen, seen? / defaultSeen / onSeenChange, persistSeenKey?, seenDelay (1500), unseenText, emptyText, loadingText, errorText, retryText, ref?: Ref<TreeViewHandle>

Accessibility:
WAI-ARIA tree: role=tree / treeitem / group, aria-expanded, aria-level, aria-setsize / aria-posinset, aria-selected or aria-checked (mixed), roving tabindex; Right expands, Left collapses or goes to parent, Home/End, typeahead, * opens siblings, Alt+Up/Down jump between changes. Change markers and roll-ups have screen reader text ("modified, new", "contains 2 added, 1 modified").

Demo page shows:
1) "What changed since your last visit": a project file explorer with git status, an All files / Changes toggle, previous/next change buttons, a "Pull teammate's commit" button that changes files again (including one already seen, so its dot comes back), Mark all seen and Reset demo. 2) "Permissions with a diff before saving": a checkbox role editor that marks each grant (+) and revoke (−) against the saved role, rolls them up on collapsed groups, has Review changes (changesOnly), Save and Discard. 3) Selection modes and sizes.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/tree-view.tsx (split into a folder components/ui/tree-view/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/tree-view/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "tree-view", type "table").

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
Week: 01
Type: loader
Component: Typing Indicator
Live: lofistack-sayan.netlify.app/components/typing-indicator
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/typing-indicator/index.tsx
Prompt:
Build the "Typing Indicator" component (#54, Type: loader) for my LofiStack component gallery.
Route: /components/typing-indicator

What it does:
- Goes beyond the usual three bouncing dots seen in Messenger, Instagram and Discord. Do not use bouncing dots at all.
- Each user has an activity: typing, paused, deleting (shown as "is rewriting"), abandoned (shown as "changed their mind" with an eraser wiping the draft line: they erased their draft instead of sending it), recording (live waveform + red dot), attaching (paperclip + sliding progress bar) or thinking (sparkle + shimmer, for AI assistants). Each activity has its own animation and wording.
- Three original looks for typing: 'ink' (an SVG handwriting stroke that draws itself with stroke-dashoffset and plays backwards like an eraser when rewriting), 'keys' (three keycaps pressed in an uneven rhythm; rewriting hammers a backspace keycap), 'ghost' (placeholder word bars that appear one by one behind a blinking caret).
- Typing speed (intensity 0 to 1) sets the animation tempo: slow, steady or fast. Animations are inline styles so tempo can change per user; marks draw in currentColor.
- draftLength (never the text) makes the ghost look grow and switches the wording to "is writing a long message" past longDraftAt; an elapsed timer (· 0:42) appears after elapsedAfter seconds.
- Group mode: stacked avatars with a small activity badge icon each (pen, backspace, pause, eraser, mic, paperclip, sparkles), a +N chip, text grouped by activity ("Priya is recording a voice note · Sam is typing"), and the bubble shows the highest-priority activity.
- Export a useTypingActivity() hook: call track(value) from an input's onChange and reset() after sending. It measures keystroke rate over a window, detects rewriting (2+ deletions within 900ms), turns paused after pauseAfter ms and idle (null) after idleAfter ms, and when a draft that reached abandonAt characters (15) is erased to empty it reports 'abandoned' for abandonedFor ms (2500) before going idle (reset() after sending skips this, so a sent message never reads as erased; abandonAt: null turns it off), and returns { activity, intensity, draftLength, startedAt, track, reset, asUser }.
- Smooth height/opacity collapse when hidden, keeping the last text during the collapse. Wording overridable per activity with [singular, plural] labels for other languages.

Props (export an interface named TypingIndicatorProps):
visible, users: { id?, name, avatarUrl?, activity?, intensity?, draftLength?, startedAt? }[], variant: 'ink' | 'keys' | 'ghost', size: 'sm' | 'md' | 'lg', showText, showAvatars, showActivityBadges, maxAvatars, draftHint, longDraftAt (140), elapsedAfter (10 | null), labels?: Partial<Record<activity | 'longDraft', [singular, plural]>>, formatText?, align: 'start' | 'end', className, bubbleClassName, markClassName

Accessibility:
Status text in a polite live region placed outside the aria-hidden visuals, debounced (~700ms) so typing/paused flips don't flood screen readers; the elapsed timer is never announced. Meaning never relies on motion or color alone (wording + badge icons). prefers-reduced-motion replaces every animation with a slow fade (use the important modifier to beat inline animation styles) and disables the height transition.

Demo page shows:
1) A live mirror: a textarea on the left wired to useTypingActivity, and "What Maya sees" on the right rendering the indicator live, with state/speed/draft chips. 2) A grid of all seven activities with a look switcher. 3) A table of ink/keys/ghost at slow, fast, rewriting and paused, plus sizes. 4) A group chat where you toggle five people with different activities. 5) A scripted support chat where Alex types fast, pauses, rewrites, then writes a long reply with a timer. 6) Custom colors and Spanish labels.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/typing-indicator.tsx (split into a folder components/ui/typing-indicator/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/typing-indicator/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "typing-indicator", type "loader").

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
