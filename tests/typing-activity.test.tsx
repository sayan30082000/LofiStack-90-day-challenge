import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TypingIndicator, useTypingActivity } from "@/components/ui/typing-indicator";

function typeInto(track: (v: string) => void, text: string, msPerKey = 120) {
  for (let i = 1; i <= text.length; i++) {
    act(() => {
      track(text.slice(0, i));
      vi.advanceTimersByTime(msPerKey);
    });
  }
}

describe("useTypingActivity", () => {
  it("goes typing → paused → idle", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypingActivity({ pauseAfter: 1500, idleAfter: 6000 }));
    typeInto(result.current.track, "hi there");
    expect(result.current.activity).toBe("typing");
    expect(result.current.draftLength).toBe(8);
    act(() => vi.advanceTimersByTime(1600));
    expect(result.current.activity).toBe("paused");
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.activity).toBeNull();
  });

  it("reads quick repeated deletes as rewriting", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypingActivity());
    typeInto(result.current.track, "hello there");
    act(() => result.current.track("hello ther"));
    act(() => result.current.track("hello the"));
    expect(result.current.activity).toBe("deleting");
  });

  it("erasing a long draft reads as 'changed their mind', then hides", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypingActivity({ abandonAt: 15, abandonedFor: 2500 }));
    typeInto(result.current.track, "Actually, I think we should");
    act(() => result.current.track(""));
    expect(result.current.activity).toBe("abandoned");
    // The hook re-checks every 250ms, so allow one extra tick.
    act(() => vi.advanceTimersByTime(2800));
    expect(result.current.activity).toBeNull();
  });

  it("erasing a short draft, or sending, just goes idle", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypingActivity({ abandonAt: 15 }));
    typeInto(result.current.track, "ok");
    act(() => result.current.track(""));
    expect(result.current.activity).toBeNull();

    typeInto(result.current.track, "See you at five tomorrow");
    act(() => result.current.reset());
    expect(result.current.activity).toBeNull();
  });

  it("abandonAt: null turns the signal off", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypingActivity({ abandonAt: null }));
    typeInto(result.current.track, "Actually, I think we should");
    act(() => result.current.track(""));
    expect(result.current.activity).toBeNull();
  });
});

describe("<TypingIndicator />", () => {
  it("words each activity and groups people", () => {
    vi.useFakeTimers();
    render(
      <TypingIndicator
        users={[
          { name: "Sam", activity: "abandoned" },
          { name: "Priya", activity: "recording" },
          { name: "Jo", activity: "recording" },
        ]}
      />,
    );
    // Once in the visible text and once in the screen reader live region.
    expect(screen.getAllByText("Priya and Jo are recording voice notes · Sam changed their mind")).toHaveLength(2);
  });

  it("announces through a debounced polite live region", () => {
    vi.useFakeTimers();
    render(<TypingIndicator users={[{ name: "Sam", activity: "deleting" }]} />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    act(() => vi.advanceTimersByTime(800));
    expect(status.textContent).toBe("Sam is rewriting");
  });
});
