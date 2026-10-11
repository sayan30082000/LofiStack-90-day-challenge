import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TicketBarcode, TicketCard, code39, ticketToIcs } from "@/components/ui/ticket-card";

describe("code39", () => {
  it("encodes the known pattern for * (start/stop)", () => {
    // * = n w n n w n w n n
    expect(code39("").slice(0, 9)).toEqual([1, 3, 1, 1, 3, 1, 3, 1, 1]);
  });

  it("encodes A and 1 as the standard patterns", () => {
    const a = code39("A").slice(10, 19); // after * and the gap
    expect(a).toEqual([3, 1, 1, 1, 1, 3, 1, 1, 3]); // w n n n n w n n w
    const one = code39("1").slice(10, 19);
    expect(one).toEqual([3, 1, 1, 3, 1, 1, 1, 1, 3]); // w n n w n n n n w
  });

  it("gives every character 3 wide elements of 9 and keeps the table unique", () => {
    const seen = new Set<string>();
    for (const ch of "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. ") {
      const p = code39(ch).slice(10, 19);
      expect(p.filter((w) => w === 3)).toHaveLength(3);
      seen.add(p.join(""));
    }
    expect(seen.size).toBe(39);
  });

  it("rejects characters Code 39 can't carry", () => {
    expect(() => code39("hé!")).toThrow();
  });
});

describe("ticketToIcs", () => {
  it("writes a valid event with UTC times, escaped text and CRLF line ends", () => {
    const ics = ticketToIcs(
      {
        title: "Lofi Nights, Live",
        start: new Date(Date.UTC(2026, 10, 21, 13, 30)),
        end: new Date(Date.UTC(2026, 10, 21, 16, 30)),
        location: "Hatirjheel; Dhaka",
        uid: "t1@lofistack",
      },
      new Date(Date.UTC(2026, 9, 11, 8, 0)),
    );
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("DTSTART:20261121T133000Z\r\n");
    expect(ics).toContain("DTEND:20261121T163000Z\r\n");
    expect(ics).toContain("DTSTAMP:20261011T080000Z\r\n");
    expect(ics).toContain("SUMMARY:Lofi Nights\\, Live\r\n");
    expect(ics).toContain("LOCATION:Hatirjheel\\; Dhaka\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

describe("<TicketCard />", () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 200, height: 160, right: 200, bottom: 160, toJSON: () => ({}),
    } as DOMRect);
  });

  const setup = (props = {}) => {
    const onTear = vi.fn();
    const utils = render(
      <TicketCard label="Concert ticket" orientation="horizontal" onTear={onTear} main={<p>Main</p>} stub={<p>Stub</p>} {...props} />,
    );
    const stub = utils.container.querySelector<HTMLElement>(".touch-none")!;
    return { ...utils, onTear, stub };
  };

  it("the scissors button tears the stub off and announces it", () => {
    vi.useFakeTimers();
    const { onTear } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Tear off stub" }));
    act(() => vi.advanceTimersByTime(600));
    expect(onTear).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText("Stub torn off").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Tear off stub" })).toBeNull();
  });

  it("dragging past the threshold tears it off", () => {
    vi.useFakeTimers();
    const { onTear, stub } = setup();
    fireEvent.pointerDown(stub, { button: 0, pointerId: 1, clientX: 10, clientY: 50 });
    fireEvent.pointerMove(stub, { pointerId: 1, clientX: 120, clientY: 50 });
    expect(stub.dataset.tearing).toBe("69");
    fireEvent.pointerUp(stub, { pointerId: 1, clientX: 120, clientY: 50 });
    act(() => vi.advanceTimersByTime(600));
    expect(onTear).toHaveBeenCalledTimes(1);
  });

  it("a short drag springs back", () => {
    vi.useFakeTimers();
    const { onTear, stub } = setup();
    fireEvent.pointerDown(stub, { button: 0, pointerId: 1, clientX: 10, clientY: 50 });
    fireEvent.pointerMove(stub, { pointerId: 1, clientX: 40, clientY: 50 });
    fireEvent.pointerUp(stub, { pointerId: 1, clientX: 40, clientY: 50 });
    act(() => vi.advanceTimersByTime(600));
    expect(onTear).not.toHaveBeenCalled();
    expect(stub.dataset.tearing).toBeUndefined();
  });

  it("a used ticket can't be torn", () => {
    const { onTear, stub } = setup({ used: true });
    expect((screen.getByRole("button", { name: "Tear off stub" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.pointerDown(stub, { button: 0, pointerId: 1, clientX: 10, clientY: 50 });
    fireEvent.pointerMove(stub, { pointerId: 1, clientX: 190, clientY: 50 });
    fireEvent.pointerUp(stub, { pointerId: 1, clientX: 190, clientY: 50 });
    expect(onTear).not.toHaveBeenCalled();
  });

  it("shows tornContent where the stub was", () => {
    setup({ defaultTorn: true, tornContent: <p>Checked in</p> });
    expect(screen.getByText("Checked in")).toBeTruthy();
  });

  it("the barcode is an image named by its value", () => {
    render(<TicketBarcode value="LN-F17" />);
    expect(screen.getByRole("img", { name: "Barcode LN-F17" })).toBeTruthy();
  });
});
