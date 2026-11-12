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
- Drop area plus click-to-browse, drag-over and reject styles, validation of accept, maxSize and maxFiles with a message per rejected file, image thumbnails via URL.createObjectURL (revoked on remove/unmount) and a file list with name, size and remove button.
- Pre-upload checks (preflight, on by default) run on each added file and show amber issue chips: "Contains GPS location" (exported jpegHasGps(bytes) reads the EXIF APP1 segment, both byte orders, and looks for a non-empty GPS IFD), "Looks blurry" (exported sharpness(): variance of the Laplacian on a downscaled grey copy, below blurThreshold), "Only 96 × 96 px (needs 400 × 400)" (minWidth/minHeight), "Large image (3.4 MB)" (shrinkAbove), and for CSVs "Missing columns: email" and "2 empty rows" (exported checkCsv(text, required), matching headers ignoring case, spaces and dashes).
- One-click fixes: Remove location and Shrink re-encode the image on a canvas (which drops all metadata), shrink to shrinkTo px on the long side, replace the file and its preview, announce the result ("photo.jpg shrunk from 3.4 MB to 610 KB") and re-run the checks. Clean files show "Looks good".
- A ref handle (FileDropzoneHandle.addFiles) lets other UI add files. All text is replaceable through messages and preflightMessages.

Props (export an interface named FileDropzoneProps):
accept?: string[], maxSize, maxFiles, multiple, onFilesChange(files), label, hint, disabled, name, formatSize?, messages, preflight: false | { location, blurThreshold, minWidth, minHeight, shrinkAbove, shrinkTo, csvColumns }, preflightMessages, ref

Accessibility:
Hidden file input with a label; the drop area is focusable and opens the picker with Enter/Space; issues are text, not colour alone; fix buttons start with their visible text and add the file name ("Remove location (photo.jpg)"); rejections, checks and fixes are announced once in a polite live region.

Demo page shows:
1) Checks before upload with sample buttons that generate real files in the browser: a photo with GPS (Dhaka) in its EXIF, a blurry photo, a 96 px logo, a 3600 × 2400 photo to shrink, and a contacts CSV missing a column. 2) Images only, max 2 MB, up to 5. 3) A single PDF. 4) Disabled.

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
- Rotates toward the pointer up to maxTilt degrees with perspective, scales slightly, resets smoothly on leave, and gives child layers with data-depth a translateZ for parallax.
- light="pointer" (default) puts the glare under the pointer. light={{ x, y }} (-1 to 1) is a fixed lamp: exported pure lightFor(rx, ry, maxTilt, light) slides the reflection opposite to the tilt like a real glossy surface and casts the drop shadow away from the lamp, and the resting card already shows a soft shine near the light.
- Phone tilt (motion, default on): on touch devices the card follows DeviceOrientation instead of touch, calibrated to how the phone is held when it starts and again after rotating to landscape. Exported pure orientationToTilt(reading, base, maxTilt, range) maps a ±25° change to full tilt. On iOS an Enable motion button asks for permission first.
- Reduced motion and disabled give a flat card; pointer tilt ignores touch.

Props (export an interface named TiltCardProps):
children, maxTilt (12), glare (true), glareColor, scale (1.03), perspective (1000), shadow, resetDuration, disabled, motion (true), motionLabel, light: 'pointer' | { x, y }, className, wrapperClassName

Accessibility:
Motion is decorative; children keep their own semantics; focus-within gives a subtle lift; the motion permission button is a real labelled button; nothing moves under prefers-reduced-motion.

Demo page shows:
1) A collector card "Monsoon" in depth layers under a fixed light, with sliders that move the light. 2) A membership card. 3) A game cover. 4) A plain image card.

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
