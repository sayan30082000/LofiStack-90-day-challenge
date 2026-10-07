import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlipCard, type FlipCardProps } from "@/components/ui/flip-card";

// jsdom has no layout: give every element a 200 × 100 box at the origin.
beforeEach(() => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, toJSON: () => ({}),
  } as DOMRect);
});

function setup(props: Partial<FlipCardProps> = {}) {
  const onFlip = vi.fn();
  const utils = render(
    <FlipCard front={<p>Front side</p>} back={<button type="button">Back action</button>} onFlip={onFlip} {...props} />,
  );
  const root = utils.container.firstElementChild as HTMLElement;
  const rotor = root.querySelector<HTMLElement>("[class*='--lofi-flip-rot']")!;
  const rotation = () => rotor.style.getPropertyValue("--lofi-flip-rot");
  return { ...utils, root, rotation, onFlip };
}

describe("<FlipCard /> turns away from where you press", () => {
  it("pressing the right edge turns it right (rotateY +180)", () => {
    const { root, rotation, onFlip } = setup();
    fireEvent.click(root, { clientX: 190, clientY: 50 });
    expect(onFlip).toHaveBeenCalledWith(true);
    expect(rotation()).toBe("rotateX(0deg) rotateY(180deg)");
  });

  it("pressing the left edge turns it left (rotateY -180)", () => {
    const { root, rotation } = setup();
    fireEvent.click(root, { clientX: 10, clientY: 50 });
    expect(rotation()).toBe("rotateX(0deg) rotateY(-180deg)");
  });

  it("in auto mode, pressing the bottom edge flips it up and over (rotateX -180)", () => {
    const { root, rotation } = setup();
    fireEvent.click(root, { clientX: 100, clientY: 98 });
    expect(rotation()).toBe("rotateX(-180deg) rotateY(0deg)");
  });

  it("horizontal mode never turns around the X axis", () => {
    const { root, rotation } = setup({ direction: "horizontal" });
    fireEvent.click(root, { clientX: 100, clientY: 98 });
    expect(rotation()).toMatch(/rotateX\(0deg\) rotateY\(-?180deg\)/);
  });

  it("returns the way it came", () => {
    const { root, rotation } = setup();
    fireEvent.click(root, { clientX: 100, clientY: 98 });
    fireEvent.click(root, { clientX: 190, clientY: 50 });
    expect(rotation()).toBe("rotateX(0deg) rotateY(0deg)");
  });
});

describe("<FlipCard /> hold to peek", () => {
  it("shows the back while held and returns on release, without flipping", () => {
    vi.useFakeTimers();
    const onPeek = vi.fn();
    const { root, onFlip } = setup({ onPeek });

    fireEvent.pointerDown(root, { button: 0, clientX: 190, clientY: 50, pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(400));
    expect(root.dataset.peeking).toBe("true");
    expect(onPeek).toHaveBeenLastCalledWith(true);

    fireEvent.pointerUp(root);
    fireEvent.click(root, { clientX: 190, clientY: 50 });
    expect(root.dataset.peeking).toBeUndefined();
    expect(onPeek).toHaveBeenLastCalledWith(false);
    expect(onFlip).not.toHaveBeenCalled();
  });

  it("a quick press is a normal click", () => {
    vi.useFakeTimers();
    const { root, onFlip } = setup();
    fireEvent.pointerDown(root, { button: 0, clientX: 190, clientY: 50, pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerUp(root);
    fireEvent.click(root, { clientX: 190, clientY: 50 });
    expect(onFlip).toHaveBeenCalledWith(true);
  });
});

describe("<FlipCard /> accessibility", () => {
  it("the flip button toggles aria-pressed and hides the unseen face", () => {
    setup();
    const button = screen.getByRole("button", { name: "Flip card" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("button", { name: "Back action" })).toBeNull();

    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Back action" })).toBeTruthy();
  });

  it("clicking a control on the back never flips the card", () => {
    const { onFlip } = setup({ defaultFlipped: true });
    fireEvent.click(screen.getByRole("button", { name: "Back action" }));
    expect(onFlip).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const { root, onFlip } = setup({ disabled: true });
    fireEvent.click(root, { clientX: 190, clientY: 50 });
    expect(onFlip).not.toHaveBeenCalled();
  });
});
