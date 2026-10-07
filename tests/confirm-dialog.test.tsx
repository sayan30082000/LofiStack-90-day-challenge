import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog, impactTotal, type ConfirmDialogProps } from "@/components/ui/confirm-dialog";

function setup(props: Partial<ConfirmDialogProps> = {}) {
  const onConfirm = vi.fn(() => Promise.resolve());
  const onOpenChange = vi.fn();
  const utils = render(
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title="Delete brand-assets?"
      resourceName="brand-assets"
      onConfirm={onConfirm}
      {...props}
    />,
  );
  const confirm = () => screen.getByRole("button", { name: "Delete" });
  return { ...utils, onConfirm, onOpenChange, confirm };
}

describe("impactTotal", () => {
  it("adds numeric values and ignores text", () => {
    expect(impactTotal([{ value: 48, label: "files" }, { value: 3, label: "people" }, { value: "1.2 GB", label: "storage" }])).toBe(51);
  });
});

describe("<ConfirmDialog /> friction", () => {
  it("shows what will be lost", () => {
    setup({ impact: [{ value: 48, label: "files" }, { value: "1.2 GB", label: "of storage" }] });
    expect(screen.getByText("You will lose")).toBeTruthy();
    expect(screen.getByText("48")).toBeTruthy();
    expect(screen.getByText("1.2 GB")).toBeTruthy();
  });

  it("friction=auto with a small impact needs no typing and starts on Cancel", () => {
    const { confirm } = setup({ friction: "auto", autoTypeAt: 10, impact: [{ value: 2, label: "files" }] });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect((confirm() as HTMLButtonElement).disabled).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
  });

  it("friction=auto with a big impact asks for the name", () => {
    const { confirm } = setup({ friction: "auto", autoTypeAt: 10, impact: [{ value: 48, label: "files" }] });
    const input = screen.getByRole("textbox");
    expect(document.activeElement).toBe(input);
    expect((confirm() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(input, { target: { value: "brand-assets" } });
    expect((confirm() as HTMLButtonElement).disabled).toBe(false);
  });

  it("friction=click never asks for typing", () => {
    setup({ friction: "click", impact: [{ value: 999, label: "files" }] });
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});

describe("<ConfirmDialog /> undo window", () => {
  const fakeClock = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "performance", "Date"] });

  it("closes, counts down, then runs onConfirm", async () => {
    fakeClock();
    const { confirm, onConfirm, onOpenChange } = setup({ friction: "click", undoWindow: 5000 });
    fireEvent.click(confirm());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText("Deleting brand-assets in 5s. Undo to cancel.")).toBeTruthy();

    await act(async () => vi.advanceTimersByTime(5200));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText("brand-assets was deleted.").length).toBeGreaterThan(0);
  });

  it("Undo cancels and nothing is deleted", async () => {
    fakeClock();
    const onUndo = vi.fn();
    const { confirm, onConfirm } = setup({ friction: "click", undoWindow: 5000, onUndo });
    fireEvent.click(confirm());
    await act(async () => vi.advanceTimersByTime(2000));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await act(async () => vi.advanceTimersByTime(10_000));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("pauses while the bar is focused, so nobody is rushed", async () => {
    fakeClock();
    const { confirm, onConfirm } = setup({ friction: "click", undoWindow: 3000 });
    fireEvent.click(confirm());
    act(() => screen.getByRole("button", { name: "Undo" }).focus());
    await act(async () => vi.advanceTimersByTime(10_000));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Paused/).length).toBeGreaterThan(0);
  });

  it("Delete now skips the wait", async () => {
    fakeClock();
    const { confirm, onConfirm } = setup({ friction: "click", undoWindow: 8000 });
    fireEvent.click(confirm());
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete now" }));
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("without undoWindow, onConfirm runs right away", async () => {
    const { confirm, onConfirm } = setup({ friction: "click" });
    await act(async () => {
      fireEvent.click(confirm());
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
