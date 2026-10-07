"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TypingUser } from "./index";

export interface TypingActivityOptions {
  /** ms without a keystroke before the state becomes "paused". */
  pauseAfter?: number;
  /** ms without a keystroke before the indicator should disappear. */
  idleAfter?: number;
  /** ms window used to measure typing speed. */
  sampleWindow?: number;
  /** Characters per second that count as full speed (intensity 1). */
  fastRate?: number;
  /** Erasing a draft at least this long reads as "changed their mind" instead of just going idle. null turns it off. */
  abandonAt?: number | null;
  /** ms the "changed their mind" state stays before the indicator hides. */
  abandonedFor?: number;
}

export interface TypingActivityState {
  /** null means idle: hide the indicator. */
  activity: "typing" | "paused" | "deleting" | "abandoned" | null;
  /** 0 to 1, from the recent keystroke rate. */
  intensity: number;
  draftLength: number;
  /** Epoch ms when this typing session started. */
  startedAt: number | null;
}

const IDLE: TypingActivityState = { activity: null, intensity: 0, draftLength: 0, startedAt: null };

/**
 * Turns an input's changes into typing activity you can broadcast to other people.
 * Call `track(value)` from onChange and `reset()` after sending, so a sent message
 * never reads as an erased one.
 */
export function useTypingActivity({
  pauseAfter = 1500,
  idleAfter = 6000,
  sampleWindow = 2500,
  fastRate = 7,
  abandonAt = 15,
  abandonedFor = 2500,
}: TypingActivityOptions = {}) {
  const [state, setState] = useState<TypingActivityState>(IDLE);
  const events = useRef<{ t: number; del: boolean }[]>([]);
  const lastLength = useRef(0);
  const lastAt = useRef(0);
  // Longest the current draft has been; erasing a long draft is a different signal from fixing a typo.
  const peakLength = useRef(0);

  const rate = useCallback(
    (count: number) => Math.min(1, count / (sampleWindow / 1000) / fastRate),
    [sampleWindow, fastRate],
  );

  const track = useCallback(
    (value: string) => {
      const now = Date.now();
      const length = value.length;
      const del = length < lastLength.current;
      lastLength.current = length;
      lastAt.current = now;
      if (length === 0) {
        const erased = abandonAt !== null && peakLength.current >= abandonAt;
        events.current = [];
        peakLength.current = 0;
        setState(erased ? { activity: "abandoned", intensity: 0, draftLength: 0, startedAt: null } : IDLE);
        return;
      }
      peakLength.current = Math.max(peakLength.current, length);
      events.current = [...events.current.filter((e) => now - e.t < sampleWindow), { t: now, del }];
      // Two or more deletions in under a second reads as rewriting, not a typo fix.
      const recentDeletes = events.current.filter((e) => e.del && now - e.t < 900).length;
      const activity = del && recentDeletes >= 2 ? "deleting" : "typing";
      setState((prev) => ({
        activity,
        intensity: rate(events.current.length),
        draftLength: length,
        startedAt: prev.startedAt ?? now,
      }));
    },
    [sampleWindow, rate, abandonAt],
  );

  const reset = useCallback(() => {
    events.current = [];
    lastLength.current = 0;
    peakLength.current = 0;
    setState(IDLE);
  }, []);

  const active = state.activity !== null;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const now = Date.now();
      const since = now - lastAt.current;
      events.current = events.current.filter((e) => now - e.t < sampleWindow);
      setState((prev) => {
        if (!prev.activity) return prev;
        if (prev.activity === "abandoned") return since >= abandonedFor ? IDLE : prev;
        if (since >= idleAfter) return { ...prev, activity: null, intensity: 0, startedAt: null };
        const activity = since >= pauseAfter ? "paused" : prev.activity;
        const intensity = activity === "paused" ? 0 : rate(events.current.length);
        if (activity === prev.activity && Math.abs(intensity - prev.intensity) < 0.05) return prev;
        return { ...prev, activity, intensity };
      });
    }, 250);
    return () => clearInterval(id);
  }, [active, pauseAfter, idleAfter, abandonedFor, sampleWindow, rate]);

  /** Builds a TypingUser for <TypingIndicator users={...} /> from the current state. */
  const asUser = useCallback(
    (user: Pick<TypingUser, "name" | "id" | "avatarUrl">): TypingUser => ({
      ...user,
      activity: state.activity ?? "typing",
      intensity: state.intensity,
      draftLength: state.draftLength,
      startedAt: state.startedAt ?? undefined,
    }),
    [state],
  );

  return { ...state, track, reset, asUser };
}
