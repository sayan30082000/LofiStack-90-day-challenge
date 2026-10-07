import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedTabs, type AnimatedTab } from "@/components/ui/animated-tabs";

const TABS: AnimatedTab[] = [
  { id: "overview", label: "Overview", content: <p>Overview panel</p> },
  { id: "billing", label: "Billing", content: <p>Billing panel</p> },
  { id: "team", label: "Team", content: <p>Team panel</p> },
  { id: "legacy", label: "Legacy", content: <p>Legacy panel</p>, disabled: true },
];

const tab = (name: string) => screen.getByRole("tab", { name });

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("<AnimatedTabs /> intent", () => {
  it("fires onIntent after the mouse rests on a tab, not on a quick pass", () => {
    vi.useFakeTimers();
    const onIntent = vi.fn();
    render(<AnimatedTabs tabs={TABS} onIntent={onIntent} intentDelay={80} />);

    fireEvent.pointerEnter(tab("Billing"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(40));
    fireEvent.pointerLeave(tab("Billing"));
    act(() => vi.advanceTimersByTime(200));
    expect(onIntent).not.toHaveBeenCalled();

    fireEvent.pointerEnter(tab("Team"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(100));
    expect(onIntent).toHaveBeenCalledWith("team");
  });

  it("fires immediately on keyboard focus and on touch", () => {
    const onIntent = vi.fn();
    render(<AnimatedTabs tabs={TABS} onIntent={onIntent} intentOnce={false} />);
    act(() => tab("Billing").focus());
    expect(onIntent).toHaveBeenLastCalledWith("billing");
    fireEvent.pointerEnter(tab("Team"), { pointerType: "touch" });
    expect(onIntent).toHaveBeenLastCalledWith("team");
  });

  it("intentOnce reports each tab only the first time", () => {
    const onIntent = vi.fn();
    render(<AnimatedTabs tabs={TABS} onIntent={onIntent} />);
    act(() => tab("Billing").focus());
    act(() => tab("Overview").focus());
    act(() => tab("Billing").focus());
    expect(onIntent.mock.calls.map((c) => c[0])).toEqual(["billing", "overview"]);
  });

  it("never fires for disabled tabs", () => {
    const onIntent = vi.fn();
    render(<AnimatedTabs tabs={TABS} onIntent={onIntent} />);
    fireEvent.pointerEnter(tab("Legacy"), { pointerType: "touch" });
    expect(onIntent).not.toHaveBeenCalled();
  });
});

describe("<AnimatedTabs /> hashSync", () => {
  it("opens the tab named in the URL and reports it once", () => {
    window.history.replaceState(null, "", "/#settings-billing");
    const onChange = vi.fn();
    render(<AnimatedTabs tabs={TABS} hashSync="settings-" onChange={onChange} />);
    expect(tab("Billing").getAttribute("aria-selected")).toBe("true");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("billing");
  });

  it("writes the selected tab into the hash without adding history entries", () => {
    const push = vi.spyOn(window.history, "pushState");
    const onChange = vi.fn();
    render(<AnimatedTabs tabs={TABS} hashSync="settings-" onChange={onChange} />);
    fireEvent.click(tab("Team"));
    expect(window.location.hash).toBe("#settings-team");
    expect(push).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("follows hash changes from links and back/forward", () => {
    render(<AnimatedTabs tabs={TABS} hashSync />);
    act(() => {
      window.history.replaceState(null, "", "/#team");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(tab("Team").getAttribute("aria-selected")).toBe("true");
  });

  it("ignores hashes that don't name an enabled tab", () => {
    window.history.replaceState(null, "", "/#legacy");
    render(<AnimatedTabs tabs={TABS} hashSync />);
    expect(tab("Overview").getAttribute("aria-selected")).toBe("true");
  });
});

describe("<AnimatedTabs /> keyboard", () => {
  it("arrows skip disabled tabs and wrap", () => {
    render(<AnimatedTabs tabs={TABS} defaultValue="team" />);
    fireEvent.keyDown(tab("Team"), { key: "ArrowRight" });
    expect(tab("Overview").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tab("Overview"));
  });
});
