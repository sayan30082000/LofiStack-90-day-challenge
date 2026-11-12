import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  CommandPalette,
  emptyPaletteMemory,
  learnedBoost,
  matchWithArgument,
  parseArgument,
  rememberRun,
  type CommandArg,
  type CommandItem,
} from "@/components/ui/command-palette";
import { analyzeLogoPixels, opticalLogoHeight } from "@/components/ui/logo-marquee";

/* ---------- Command palette: values ---------- */

const color: CommandArg = {
  kind: "choice",
  name: "color",
  options: [
    { value: "indigo", label: "Indigo", keywords: ["blue"] },
    { value: "rose", label: "Rose", keywords: ["pink", "red"] },
    { value: "emerald", label: "Emerald", keywords: ["green"] },
  ],
};
const zoom: CommandArg = { kind: "number", name: "zoom level", min: 80, max: 150, unit: "%" };

describe("parseArgument", () => {
  it("picks a choice by label, value or keyword", () => {
    expect(parseArgument(color, "ros")).toEqual({ ok: true, value: "rose", display: "Rose" });
    expect(parseArgument(color, "pink")).toEqual({ ok: true, value: "rose", display: "Rose" });
    expect(parseArgument(color, "green")).toMatchObject({ value: "emerald" });
    expect(parseArgument(color, "xyz")).toEqual({ ok: false, error: "No color matches “xyz”" });
  });

  it("reads numbers with or without the unit and checks the range", () => {
    expect(parseArgument(zoom, "125")).toEqual({ ok: true, value: 125, display: "125%" });
    expect(parseArgument(zoom, "90 %")).toMatchObject({ value: 90 });
    expect(parseArgument(zoom, "300")).toEqual({ ok: false, error: "Enter a number from 80 to 150%" });
    expect(parseArgument(zoom, "big")).toEqual({ ok: false, error: "“big” isn't a number" });
    expect(parseArgument(zoom, "125px")).toMatchObject({ ok: false });
  });

  it("validates text and returns null when nothing is typed", () => {
    const title: CommandArg = { kind: "text", name: "title", validate: (v) => (v.length > 5 ? "Too long" : null) };
    expect(parseArgument(title, " Hi ")).toEqual({ ok: true, value: "Hi", display: "Hi" });
    expect(parseArgument(title, "Too long title")).toEqual({ ok: false, error: "Too long" });
    expect(parseArgument(title, "   ")).toBeNull();
  });
});

describe("matchWithArgument", () => {
  const accent: CommandItem = { id: "accent", group: "Theme", label: "Change accent color", keywords: ["colour"], arg: color };
  const zoomCmd: CommandItem = { id: "zoom", group: "Theme", label: "Zoom text", keywords: ["font"], arg: zoom };

  it("splits the command from its value", () => {
    expect(matchWithArgument(accent, "accent pink")).toMatchObject({ value: "rose", display: "Rose" });
    expect(matchWithArgument(accent, "change accent color green")).toMatchObject({ value: "emerald" });
    expect(matchWithArgument(accent, "colour blue")).toMatchObject({ value: "indigo" });
    expect(matchWithArgument(zoomCmd, "font 125%")).toMatchObject({ value: 125, display: "125%" });
  });

  it("needs a real value and words from the command", () => {
    expect(matchWithArgument(zoomCmd, "zoom")).toBeNull();
    expect(matchWithArgument(zoomCmd, "zoom 400")).toBeNull();
    expect(matchWithArgument(accent, "theme pink")).toBeNull();
    expect(matchWithArgument({ ...accent, disabled: true }, "accent pink")).toBeNull();
  });
});

describe("learning", () => {
  it("boosts the exact search most, related searches less, and caps the boost", () => {
    let m = emptyPaletteMemory();
    m = rememberRun(m, "Th", "theme");
    expect(learnedBoost(m, "th", "theme")).toBe(40);
    expect(learnedBoost(m, "the", "theme")).toBe(20);
    expect(learnedBoost(m, "t", "theme")).toBe(20);
    expect(learnedBoost(m, "x", "theme")).toBe(0);
    expect(learnedBoost(m, "th", "other")).toBe(0);
    for (let i = 0; i < 10; i++) m = rememberRun(m, "th", "theme");
    expect(learnedBoost(m, "th", "theme")).toBe(160);
    expect(m.runs.theme).toBe(11);
  });

  it("keeps only the 100 most recent searches", () => {
    let m = emptyPaletteMemory();
    for (let i = 0; i < 120; i++) m = rememberRun(m, `q${i}`, "a");
    expect(Object.keys(m.picks)).toHaveLength(100);
    expect(m.picks.q0).toBeUndefined();
    expect(m.picks.q119).toEqual({ a: 1 });
  });
});

/* ---------- Command palette: in the UI ---------- */

function setup(extra: Partial<CommandItem>[] = []) {
  const onAccent = vi.fn();
  const onZoom = vi.fn();
  const onTheme = vi.fn();
  const onTop = vi.fn();
  const commands: CommandItem[] = [
    { id: "top", group: "Navigation", label: "Back to top", onRun: onTop },
    { id: "theme", group: "Theme", label: "Toggle theme", shortcut: ["⇧", "D"], onRun: onTheme },
    { id: "accent", group: "Theme", label: "Change accent color", keywords: ["accent"], arg: color, onRun: onAccent },
    { id: "zoom", group: "Theme", label: "Zoom text", arg: zoom, onRun: onZoom },
    ...(extra as CommandItem[]),
  ];
  render(<CommandPalette commands={commands} storageKey={null} maxRecent={0} />);
  const open = () => act(() => void fireEvent.keyDown(window, { key: "k", ctrlKey: true }));
  const input = () => screen.getByRole("combobox");
  const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
  const enter = () => fireEvent.keyDown(input(), { key: "Enter" });
  return { open, input, type, enter, onAccent, onZoom, onTheme, onTop };
}

describe("<CommandPalette /> values, learning and tips", () => {
  it("runs a command with a value typed inline", () => {
    const t = setup();
    t.open();
    t.type("accent pink");
    expect(screen.getByRole("group", { name: "Run with this value" })).toBeTruthy();
    expect(screen.getAllByRole("option")[0].textContent).toContain("Rose");
    t.enter();
    expect(t.onAccent).toHaveBeenCalledWith("rose");
  });

  it("asks for the value when a command is chosen without one", () => {
    const t = setup();
    t.open();
    t.type("zoom");
    t.enter();
    expect(t.onZoom).not.toHaveBeenCalled();
    expect(t.input().getAttribute("aria-label")).toBe("Zoom text: zoom level");
    t.type("300");
    expect(screen.getAllByText("Enter a number from 80 to 150%").length).toBeGreaterThan(0);
    t.type("125");
    t.enter();
    expect(t.onZoom).toHaveBeenCalledWith(125);
  });

  it("goes back from the value step with Backspace and restores the search", () => {
    const t = setup();
    t.open();
    t.type("acc");
    t.enter();
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Indigo", "Rose", "Emerald"]);
    fireEvent.keyDown(t.input(), { key: "Backspace" });
    expect((t.input() as HTMLInputElement).value).toBe("acc");
  });

  it("ranks the command picked for a search first next time", () => {
    const t = setup();
    t.open();
    t.type("t");
    expect(screen.getAllByRole("option")[0].textContent).toContain("Toggle theme");
    // Pick "Back to top" for "t" twice.
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByRole("option", { name: /Back to top/ }));
      expect(t.onTop).toHaveBeenCalledTimes(i + 1);
      t.open();
      t.type("t");
    }
    const first = screen.getAllByRole("option")[0];
    expect(first.textContent).toContain("Back to top");
    expect(first.textContent).toContain("Your usual pick");
  });

  it("shows a command's shortcut once after it has run 3 times", () => {
    const t = setup();
    for (let i = 0; i < 3; i++) {
      t.open();
      t.type("toggle");
      t.enter();
    }
    t.open();
    // Shown in the note and read out in the status region.
    expect(screen.getAllByText(/You've run “Toggle theme” from here 3 times/)).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryAllByText(/You've run/)).toHaveLength(0);
    fireEvent.keyDown(t.input(), { key: "Escape" });
    t.open();
    expect(screen.queryAllByText(/You've run/)).toHaveLength(0);
  });
});

/* ---------- Logo marquee: optical sizing ---------- */

/** RGBA bitmap with a filled rectangle of ink on a transparent or white background. */
function bitmap(w: number, h: number, box: [number, number, number, number], opaque = false) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const ink = x >= box[0] && x < box[0] + box[2] && y >= box[1] && y < box[1] + box[3];
      if (ink) data.set([20, 20, 20, 255], i);
      else if (opaque) data.set([255, 255, 255, 255], i);
    }
  return data;
}

describe("analyzeLogoPixels", () => {
  it("finds the ink box inside transparent padding", () => {
    expect(analyzeLogoPixels(bitmap(100, 50, [20, 10, 40, 20]), 100, 50)).toEqual({ x: 20, y: 10, width: 40, height: 20, density: 1 });
  });
  it("treats an opaque corner color as background", () => {
    expect(analyzeLogoPixels(bitmap(60, 60, [5, 5, 10, 30], true), 60, 60)).toMatchObject({ x: 5, y: 5, width: 10, height: 30 });
  });
  it("returns null for an empty image", () => {
    expect(analyzeLogoPixels(new Uint8ClampedArray(10 * 10 * 4), 10, 10)).toBeNull();
  });
});

describe("opticalLogoHeight", () => {
  it("keeps a typical 3:1 wordmark at the base height", () => {
    expect(opticalLogoHeight(3, null, 28)).toBe(28);
  });
  it("makes square marks taller and wide wordmarks shorter, within limits", () => {
    expect(opticalLogoHeight(1, null, 28)).toBeGreaterThan(40);
    expect(opticalLogoHeight(8, null, 28)).toBeLessThan(20);
    expect(opticalLogoHeight(0.2, null, 28)).toBeLessThanOrEqual(28 * 1.6);
    // A 16:1 wordmark is capped at 7 × base wide, but never thinner than 0.42 × base.
    expect(opticalLogoHeight(16, null, 28) * 16).toBeLessThanOrEqual(28 * 7 + 1);
    expect(opticalLogoHeight(60, null, 28)).toBeCloseTo(28 * 0.42, 1);
  });
  it("shrinks heavy logos and grows thin ones", () => {
    expect(opticalLogoHeight(3, 0.9, 28)).toBeLessThan(28);
    expect(opticalLogoHeight(3, 0.1, 28)).toBeGreaterThan(28);
  });
});
