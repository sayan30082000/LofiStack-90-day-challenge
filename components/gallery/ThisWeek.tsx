"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const DAY = 86_400_000;

/** "This week" pill, decided in the visitor's browser so the static page never goes stale. */
export function ThisWeek({ start, end }: { start: number; end: number }) {
  const now = useSyncExternalStore(subscribe, () => Math.floor(Date.now() / DAY) * DAY, () => null);
  if (now === null || now < start || now > end) return null;
  return (
    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-indigo-500">
      This week
    </span>
  );
}
