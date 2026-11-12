Week: 06

COMPONENT 1: File Dropzone
Type: form
Live: https://lofistack-sayan.netlify.app/components/file-dropzone
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/file-dropzone.tsx
Pros: Checks files before upload: finds hidden GPS location in photos and removes it in one click, flags blurry or too-small images, shrinks huge ones, and lists missing CSV columns. All in the browser, nothing uploaded.
Cons: GPS check reads JPEG only (not HEIC/PNG). Removing location re-saves the image, so other metadata goes too.

COMPONENT 2: 3D Tilt Card
Type: card
Live: https://lofistack-sayan.netlify.app/components/tilt-card
Repo: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/tilt-card.tsx
Pros: Lit by a fixed light, like a real glossy card: the shine slides across as it tilts and the shadow falls away from the lamp. On phones you tilt the phone itself. Parallax depth layers.
Cons: iPhone asks for motion permission first. Flat under reduced motion (on purpose).

Prompt: The full final prompt for each component is on its live page, under "Build prompt" (link + #prompt).

AGENT LOG
Task: Draft two emails: a progress update to the challenge lead and a note to a teammate about duplicate components
Agent: Claude Code
Workflow: Asked it to draft both from facts in my repo only (components, links, git history), with placeholders for anything unknown, under 250 words each, saved as drafts, not sent.
Result: Two ready-to-edit drafts in about 10 minutes, every claim traceable to the repo. It caught that my Week 14 Before/After Slider clashes with a teammate's, so it will be replaced. Saved about 45 minutes.
