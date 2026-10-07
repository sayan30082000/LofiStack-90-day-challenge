# Week 11 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 11
Type: table
Component: Kanban Board
Live: lofistack-90-day-challenge.vercel.app/components/kanban-board
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/kanban-board.tsx
Prompt:
Build the "Kanban Board" component (#48, Type: table) for my LofiStack component gallery.
Route: /components/kanban-board

What it does:
- Columns of cards; drag within and between columns with a drop placeholder.
- Column WIP limit warning when exceeded; count per column.
- Inline "Add card" per column.
- Card shows title, tags, assignee avatar and due date (overdue in red).
- Horizontal scroll with snap on mobile. onChange returns the new card state.

Props (export an interface named KanbanBoardProps):
columns: { id, title, limit? }[], cards: { id, columnId, title, tags?, assignee?, due? }[], onChange(cards), onAddCard?, renderCard?

Accessibility:
Keyboard dragging (Space to pick up, arrows to move, Space to drop) with screen reader announcements, as provided by dnd-kit.

Demo page shows:
To do / In progress (limit 3) / Review / Done with 10 cards.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/kanban-board.tsx (split into a folder components/ui/kanban-board/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/kanban-board/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "kanban-board", type "table").

Rules:
- TypeScript interfaces for every prop, with short JSDoc comments. No `any`.
- Nothing hardcoded inside the component: text, data, sizes and colors come from props with sensible defaults.
- No UI kits (shadcn, MUI, Radix, Headless UI, etc.). Allowed dependencies: @dnd-kit/core, @dnd-kit/sortable.
- Fully responsive at 375px, 768px and 1280px; touch targets at least 40px.
- Include every state that applies: hover, active, focus-visible, disabled, loading, error, empty.
- Dark mode via Tailwind dark: variants, WCAG AA contrast in both themes.
- Respect prefers-reduced-motion (motion-safe: / motion-reduce:).
- The accessibility points above are required, not optional.
- Complete files only, no placeholders or TODOs. After the code, list 5 quick manual checks I can do to test it.
````

## Post 2

````text
Week: 11
Type: chart
Component: Gauge Chart
Live: lofistack-90-day-challenge.vercel.app/components/gauge-chart
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/gauge-chart.tsx
Prompt:
Build the "Gauge Chart" component (#66, Type: chart) for my LofiStack component gallery.
Route: /components/gauge-chart

What it does:
- 180 or 270 degree SVG arc with colored zones (e.g. 0 to 40 green, 40 to 75 amber, 75 to 100 red).
- Needle animates to the value with spring easing.
- Min/max labels, ticks, center value and unit; optional target marker.

Props (export an interface named GaugeChartProps):
value, min, max, zones?: { from, to, color, label? }[], unit?, label, target?, arc: 180 | 270, size

Accessibility:
role=meter with aria-valuenow etc.; valuetext includes the zone ("72%, Warning").

Demo page shows:
CPU usage driven by a slider, a credit score from 300 to 850 with zones, and a page speed score.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/gauge-chart.tsx (split into a folder components/ui/gauge-chart/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/gauge-chart/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "gauge-chart", type "chart").

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
