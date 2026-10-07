"use client";

import { useState } from "react";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { cn } from "@/lib/utils";

const ASSET = "/demo/before-after-slider";

export function PhotoEditDemo() {
  return (
    <figure className="w-full max-w-3xl">
      <BeforeAfterSlider
        before={{ src: `${ASSET}/landscape-before.svg`, alt: "Unedited lake photo: flat grey sky, washed-out mountains" }}
        after={{ src: `${ASSET}/landscape-after.svg`, alt: "Edited lake photo: warm sunset sky, violet mountains, glowing reflections" }}
        aspectRatio="16 / 10"
        initial={42}
      />
      <figcaption className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Drag the handle, click anywhere on the photo, or Tab to the handle and use the arrow keys.
      </figcaption>
    </figure>
  );
}

const STOPS = [
  { label: "Old site", value: 100 },
  { label: "Split", value: 50 },
  { label: "New site", value: 0 },
];

export function RedesignDemo() {
  const [value, setValue] = useState(50);
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Jump to" className="inline-flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
          {STOPS.map((s) => (
            <button
              key={s.label}
              type="button"
              aria-pressed={Math.round(value) === s.value}
              onClick={() => setValue(s.value)}
              className={cn(
                "h-10 rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                Math.round(value) === s.value
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">value: {Math.round(value)}</p>
      </div>
      <BeforeAfterSlider
        before={{
          src: `${ASSET}/site-before.svg`,
          alt: "2009 homepage: gradient header, underlined blue links, yellow banner, hit counter",
        }}
        after={{
          src: `${ASSET}/site-after.svg`,
          alt: "Redesigned homepage: clean navigation, bold headline, product preview card and feature cards",
        }}
        labels={{ before: "2009", after: "2026" }}
        aspectRatio="16 / 10"
        value={value}
        onValueChange={setValue}
      />
    </div>
  );
}

export function VerticalDemo() {
  return (
    <div className="w-full max-w-sm">
      <BeforeAfterSlider
        orientation="vertical"
        before={{ src: `${ASSET}/city-day.svg`, alt: "City skyline at midday under a blue sky with a bright sun" }}
        after={{ src: `${ASSET}/city-night.svg`, alt: "The same skyline at night with lit windows, stars and a crescent moon" }}
        labels={{ before: "Day", after: "Night" }}
        aspectRatio="3 / 4"
        initial={55}
      />
    </div>
  );
}

export function StatesDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Missing image</p>
        <BeforeAfterSlider
          before={{ src: "data:image/png;base64,AAAA", alt: "Original product shot" }}
          after={{ src: `${ASSET}/landscape-after.svg`, alt: "Edited lake photo at sunset" }}
          aspectRatio="4 / 3"
          errorText="Couldn't load this image"
          hint={false}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">No labels, square</p>
        <BeforeAfterSlider
          before={{ src: `${ASSET}/landscape-before.svg`, alt: "Unedited lake photo" }}
          after={{ src: `${ASSET}/landscape-after.svg`, alt: "Edited lake photo" }}
          labels={false}
          aspectRatio={1}
          initial={70}
          hint={false}
        />
      </div>
    </div>
  );
}
