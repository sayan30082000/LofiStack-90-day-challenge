import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityHeatmap, computeHeatmapInsights } from "@/components/ui/activity-heatmap";
import { checkCsv, jpegHasGps, sharpness } from "@/components/ui/file-dropzone";
import { OtpInput, extractOtp } from "@/components/ui/otp-input";
import { lightFor, orientationToTilt } from "@/components/ui/tilt-card";

/* ---------- OTP ---------- */

describe("extractOtp", () => {
  it.each([
    ["Your Lofi code is 482913. Don't share it.", "482913"],
    ["Your verification code is 482 913", "482913"],
    ["OTP: 482-913 (valid 5 min)", "482913"],
    ["code 482913 5 min", "482913"],
    ["Help: +880 1712 345678. Your code is 482913.", "482913"],
    ["আপনার কোড 482913", "482913"],
  ])("%s → %s", (text, code) => {
    expect(extractOtp(text, 6)).toBe(code);
  });

  it("never cuts a phone number or amount down to a code", () => {
    expect(extractOtp("Call +880 1712 345678 or pay Tk 1250000", 6)).toBeNull();
  });

  it("prefers the number next to a code word", () => {
    expect(extractOtp("Order 551203 shipped. Your code is 482913.", 6)).toBe("482913");
  });

  it("handles letter codes", () => {
    expect(extractOtp("Your login code: k7p2qz. Expires soon.", 6, "alphanumeric")).toBe("K7P2QZ");
  });
});

describe("<OtpInput /> smart features", () => {
  it("finds the code in a pasted SMS", () => {
    const onComplete = vi.fn();
    render(<OtpInput onComplete={onComplete} />);
    fireEvent.paste(screen.getByLabelText("Digit 1 of 6"), {
      clipboardData: { getData: () => "Your Lofi code is 482 913. It expires in 5 minutes. Help: +880 1712 345678" },
    });
    expect(onComplete).toHaveBeenCalledWith("482913");
    expect(screen.getByText("Code found in the pasted message.")).toBeTruthy();
  });

  it("counts down and locks the boxes when the code expires", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    render(<OtpInput expiresAt={Date.now() + 65_000} onExpire={onExpire} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Code expires in 1:04")).toBeTruthy();
    act(() => vi.advanceTimersByTime(65_000));
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByText("This code has expired. Request a new one.")).toBeTruthy();
    expect((screen.getByLabelText("Digit 1 of 6") as HTMLInputElement).readOnly).toBe(true);
  });

  it("unlocks Resend after a cooldown that grows each time", async () => {
    vi.useFakeTimers();
    const onResend = vi.fn();
    render(<OtpInput onResend={onResend} resendCooldowns={[10, 20]} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText(/Resend code in 0:/)).toBeTruthy();
    act(() => vi.advanceTimersByTime(10_000));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    });
    expect(onResend).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText(/Resend code in 0:(19|20)/)).toBeTruthy();
  });

  it("warns when two or fewer attempts are left", () => {
    const { rerender } = render(<OtpInput attemptsLeft={3} />);
    expect(screen.queryByText(/attempts? left/)).toBeNull();
    rerender(<OtpInput attemptsLeft={1} />);
    expect(screen.getByText("1 attempt left")).toBeTruthy();
  });
});

/* ---------- Heatmap ---------- */

const days = (from: string, n: number, count = 1) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${from}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return { date: d.toISOString().slice(0, 10), count };
  });

describe("computeHeatmapInsights", () => {
  const data = [...days("2026-03-02", 5, 2), ...days("2026-03-20", 3, 4), ...days("2026-06-28", 3, 1)];
  const info = computeHeatmapInsights(data, "2026-01-01", "2026-06-30");

  it("finds the longest and current streaks with their dates", () => {
    expect(info.longestStreak).toEqual({ length: 5, start: "2026-03-02", end: "2026-03-06" });
    expect(info.currentStreak).toEqual({ length: 3, start: "2026-06-28", end: "2026-06-30" });
  });

  it("totals, averages, busiest month and weekday", () => {
    expect(info.total).toBe(10 + 12 + 3);
    expect(info.activeDays).toBe(11);
    expect(info.busiestMonth).toEqual({ month: "2026-03", total: 22 });
    // 20–22 March 2026 is Friday–Sunday, at 4 each; the 2-a-day run covers Monday–Friday.
    expect(info.busiestWeekday?.weekday).toBe(5);
  });

  it("allows today to be empty in the current streak", () => {
    expect(computeHeatmapInsights(days("2026-06-25", 5), "2026-06-01", "2026-06-30").currentStreak?.length).toBe(5);
    expect(computeHeatmapInsights(days("2026-06-20", 5), "2026-06-01", "2026-06-30").currentStreak).toBeNull();
  });
});

describe("<ActivityHeatmap /> insights", () => {
  it("lights up exactly the streak's days", () => {
    const data = [...days("2026-03-02", 5, 2), ...days("2026-03-20", 2, 1)];
    const { container } = render(<ActivityHeatmap data={data} endDate="2026-06-30" />);
    const button = screen.getByRole("button", { name: /Longest streak: 5 days/ });
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    const cells = [...container.querySelectorAll("[role=gridcell]")];
    const lit = cells.filter((c) => !c.getAttribute("class")!.includes("opacity-20"));
    expect(lit.map((c) => c.getAttribute("aria-label"))).toHaveLength(5);
    fireEvent.click(button);
    expect(container.querySelectorAll("[role=gridcell].opacity-20")).toHaveLength(0);
  });
});

/* ---------- Dropzone checks ---------- */

/** A minimal JPEG: SOI, an APP1 EXIF segment with or without a GPS IFD, then SOS. */
function jpeg(withGps: boolean) {
  const t: number[] = [0x49, 0x49, 42, 0, 8, 0, 0, 0];
  const u16 = (v: number) => t.push(v & 255, v >> 8);
  const u32 = (v: number) => t.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, v >>> 24);
  u16(1);
  if (withGps) {
    u16(0x8825); u16(4); u32(1); u32(26);
  } else {
    u16(0x010f); u16(2); u32(4); t.push(76, 111, 102, 0); // Make: "Lof"
  }
  u32(0);
  if (withGps) {
    u16(1);
    u16(1); u16(2); u32(2); t.push(78, 0, 0, 0);
    u32(0);
  }
  const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, ...t];
  const len = payload.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 255, ...payload, 0xff, 0xda, 0, 2]);
}

describe("jpegHasGps", () => {
  it("spots a GPS IFD and ignores other EXIF", () => {
    expect(jpegHasGps(jpeg(true))).toBe(true);
    expect(jpegHasGps(jpeg(false))).toBe(false);
  });
  it("is safe on non-JPEG or truncated data", () => {
    expect(jpegHasGps(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(jpegHasGps(jpeg(true).slice(0, 20))).toBe(false);
  });
});

describe("sharpness", () => {
  it("scores sharp edges high and flat or smooth images low", () => {
    const w = 32;
    const checker = Array.from({ length: w * w }, (_, i) => (((i % w) + Math.floor(i / w)) % 2 ? 255 : 0));
    const ramp = Array.from({ length: w * w }, (_, i) => (i % w) * 8);
    expect(sharpness(checker, w, w)).toBeGreaterThan(10_000);
    expect(sharpness(ramp, w, w)).toBeLessThan(1);
    expect(sharpness(new Array(w * w).fill(128), w, w)).toBe(0);
  });
});

describe("checkCsv", () => {
  it("finds missing columns (case, spaces and dashes ignored) and empty rows", () => {
    const r = checkCsv('﻿Name,"Phone Number",City\nA,1,Dhaka\n,,\nB,2,Sylhet\n', ["name", "email", "phone-number"]);
    expect(r.columns).toEqual(["Name", "Phone Number", "City"]);
    expect(r.missing).toEqual(["email"]);
    expect(r.rows).toBe(2);
    expect(r.emptyRows).toBe(1);
  });
});

/* ---------- Tilt ---------- */

describe("orientationToTilt", () => {
  it("is zero at the calibration reading and full at the range", () => {
    const base = { beta: 40, gamma: 0 };
    expect(orientationToTilt(base, base, 12)).toEqual({ rx: 0, ry: 0 });
    expect(orientationToTilt({ beta: 65, gamma: 25 }, base, 12)).toEqual({ rx: -12, ry: 12 });
    expect(orientationToTilt({ beta: 140, gamma: -90 }, base, 12)).toEqual({ rx: -12, ry: -12 });
  });
});

describe("lightFor", () => {
  it("puts the shine near the light and the shadow away from it", () => {
    const rest = lightFor(0, 0, 12, { x: -0.6, y: -0.7 });
    expect(rest.gx).toBeLessThan(50);
    expect(rest.gy).toBeLessThan(50);
    expect(rest.sx).toBeGreaterThan(0);
    expect(rest.sy).toBeGreaterThan(12);
  });
  it("slides the reflection opposite to the tilt", () => {
    const light = { x: 0, y: 0 };
    expect(lightFor(0, 12, 12, light).gx).toBeLessThan(lightFor(0, -12, 12, light).gx);
  });
});
