# Week 06 submissions

Post each block as its own message in lofidb. Links come from lib/site.ts; run `node build.js` again if you change them.

## Post 1

````text
Week: 06
Type: form
Component: File Dropzone
Live: lofistack-sayan.netlify.app/components/file-dropzone
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/file-dropzone.tsx
Prompt:
Build the "File Dropzone" component (#18, Type: form) for my LofiStack component gallery.
Route: /components/file-dropzone

What it does:
- Drop area plus click-to-browse; highlights on drag-over (and shows a reject style for wrong types).
- Validates accepted types, maxSize and maxFiles with a clear message per rejected file.
- Image thumbnails via URL.createObjectURL (revoked on remove/unmount); other files show a type icon.
- File list with name, formatted size and remove button.

Props (export an interface named FileDropzoneProps):
accept?: string[], maxSize (bytes), maxFiles, multiple, onFilesChange(files), label, hint, disabled

Accessibility:
Hidden file input with a label; drop area is focusable and opens the picker with Enter/Space; errors announced in a live region.

Demo page shows:
Images only, max 2MB, up to 5; a single-PDF example; and a disabled example.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/file-dropzone.tsx (split into a folder components/ui/file-dropzone/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/file-dropzone/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "file-dropzone", type "form").

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
Week: 06
Type: card
Component: 3D Tilt Card
Live: lofistack-sayan.netlify.app/components/tilt-card
Repo: github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/tilt-card.tsx
Prompt:
Build the "3D Tilt Card" component (#24, Type: card) for my LofiStack component gallery.
Route: /components/tilt-card

What it does:
- Rotates toward the pointer up to maxTilt degrees with perspective.
- Glare highlight follows the pointer.
- Child layers with a data-depth attribute get translateZ for parallax.
- Smooth reset on leave; disabled on touch and reduced motion.

Props (export an interface named TiltCardProps):
children, maxTilt (default 12), glare (default true), scale (default 1.03), perspective (default 1000), className, disabled

Accessibility:
Motion is decorative; children keep their own semantics; a subtle lift on focus-within so keyboard users get feedback.

Demo page shows:
A membership card ("LOFI MEMBER" with name and number in layers), a game cover card, and a plain image card.

Project context: this goes into my existing LofiStack gallery (Next.js App Router + TypeScript + Tailwind CSS v4, lucide-react icons, cn() helper in lib/utils.ts, shared <ComponentPage> layout in components/gallery/ComponentPage.tsx, registry in lib/registry.ts).

Deliver:
1. components/ui/tilt-card.tsx (split into a folder components/ui/tilt-card/ if it needs helpers or data). Export the component and its props interface. Add "use client" only where needed.
2. app/components/tilt-card/page.tsx: demo page using <ComponentPage> with the live previews below, a usage code snippet and a props table.
3. The new entry for lib/registry.ts (slug "tilt-card", type "card").

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
