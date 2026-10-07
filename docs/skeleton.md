# Skeleton Loader Kit

> Week 03 · `loader` · #51

Skeletons that remember the real shape: after content loads once, every text line, image and button is measured and the next load draws that exact layout, so nothing jumps. Plus primitives, presets, a page-wide shimmer and a gentle 'still loading' message.

- Live demo: https://lofistack-sayan.netlify.app/components/skeleton
- Source: https://github.com/sayan30082000/LofiStack-90-day-challenge/blob/main/components/ui/skeleton.tsx
- Build prompt: https://lofistack-sayan.netlify.app/components/skeleton#prompt

```tsx
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonCard, SkeletonListItem, SkeletonTableRow, SkeletonProfile, SkeletonFromLayout, SkeletonWrapper } from "@/components/ui/skeleton";
```

## SkeletonProps

| Prop | Type | Default | Description |
|---|---|---|---|
| `width` | `SkeletonSize` | `"100%"` | Width. Number = px. |
| `height` | `SkeletonSize` | `16` | Height. Number = px. |
| `radius` | `SkeletonSize` | `8` | Corner radius. Number = px. |
| `animation` | `SkeletonAnimation` | — | Defaults to the surrounding SkeletonWrapper's animation, then "shimmer". |
| `className` | `string` | — | Extra classes, e.g. a different background color. |
| `style` | `CSSProperties` | — | — |

## SkeletonTextProps

_extends Omit<SkeletonProps, "height" | "width">_

| Prop | Type | Default | Description |
|---|---|---|---|
| `lines` | `number` | `3` | Number of lines. |
| `gap` | `SkeletonSize` | `8` | Space between lines. Number = px. |
| `lineHeight` | `SkeletonSize` | `12` | Height of each line. Number = px. |
| `lastLineWidth` | `SkeletonSize` | `"60%"` | Width of the last line when there is more than one. |
| `widths` | `SkeletonSize[]` | `["100%", "96%", "92%", "98%"]` | Widths of the other lines, cycled. Slight variety looks more like real text. |

## SkeletonCircleProps

_extends Omit<SkeletonProps, "width" | "height" | "radius">_

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `SkeletonSize` | `40` | Diameter. Number = px. |

## SkeletonCardProps

_extends PresetBase_

| Prop | Type | Default | Description |
|---|---|---|---|
| `media` | `boolean` | `true` | Show the media block on top. |
| `mediaHeight` | `SkeletonSize` | `160` | — |
| `lines` | `number` | `2` | Body text lines under the title. |
| `footer` | `boolean` | `true` | Avatar and meta row at the bottom. |
| `bordered` | `boolean` | `true` | Draw the card border and background. |

## SkeletonListItemProps

_extends PresetBase_

| Prop | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | `SkeletonSize` | `40` | — |
| `lines` | `number` | `2` | — |
| `trailing` | `boolean` | `true` | Small block on the right, e.g. a time or a button. |

## SkeletonTableRowProps

_extends PresetBase_

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `number` | `4` | — |
| `widths` | `SkeletonSize[]` | `["70%", "50%", "60%", "40%"]` | Width of the bar in each column, cycled. |
| `leadingCircle` | `boolean` | `false` | Avatar circle in the first cell. |
| `cellClassName` | `string` | — | Classes for each <td>. |

## SkeletonProfileProps

_extends PresetBase_

| Prop | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | `SkeletonSize` | `72` | — |
| `stats` | `number` | `3` | Number of stat blocks. |
| `lines` | `number` | `3` | Bio lines. |
| `bordered` | `boolean` | `true` | — |

## MeasureSkeletonOptions

| Prop | Type | Default | Description |
|---|---|---|---|
| `maxBlocks` | `number` | — | Stop after this many blocks. |
| `minSize` | `number` | — | Ignore anything smaller than this, in px. |

## SkeletonWrapperProps

| Prop | Type | Default | Description |
|---|---|---|---|
| `loading *` | `boolean` | — | Show the fallback instead of the children. |
| `fallback *` | `ReactNode` | — | Skeleton layout shown while loading. Try to match the real layout so nothing jumps. |
| `children *` | `ReactNode` | — | — |
| `rememberKey` | `string` | — | Turns on shape memory: after the content has loaded once, its real shape (every text line, image and button) is measured and saved under this key. The next load draws that exact shape instead of the fallback. |
| `persistShape` | `boolean` | `true` | Also keep remembered shapes in localStorage, so they survive a reload. |
| `onMeasure` | `(layout: SkeletonLayout) => void` | — | Called with each new measurement. |
| `slowAfter` | `number \| null` | `4000` | After this many ms of loading, show slowText. null turns it off. |
| `slowText` | `string` | `"Still loading… thanks for waiting."` | Shown (and announced) when loading takes longer than slowAfter. |
| `label` | `string` | `"Loading content"` | Accessible name of the busy container. |
| `loadedText` | `string` | `"Content loaded"` | Announced politely when loading finishes. Empty string to stay silent. |
| `animation` | `SkeletonAnimation` | — | Default animation for every skeleton inside the fallback. |
| `fadeDuration` | `number` | `400` | Fade-in duration of the children, in ms. |
| `className` | `string` | — | — |

`*` = required. Generated by `npm run docs` from the TypeScript source; edit the JSDoc comments, not this file.
