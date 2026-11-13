import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OtpInput } from "@/components/ui/otp-input";

/*
  Regression test for a crash: every OTP input used to call navigator.credentials.get({ otp }) on
  mount. Chrome allows one pending WebOTP request per page, so a page with several inputs started
  and aborted requests against each other until the tab crashed. Now an input asks only when it is
  focused, and a new request cancels the previous one.
*/

let calls: AbortSignal[];

beforeEach(() => {
  calls = [];
  (window as unknown as { OTPCredential: unknown }).OTPCredential = class {};
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: {
      get: vi.fn((options: { signal: AbortSignal }) => {
        calls.push(options.signal);
        return new Promise(() => {}); // stays pending, like a real request with no SMS
      }),
    },
  });
});

afterEach(() => {
  delete (window as unknown as { OTPCredential?: unknown }).OTPCredential;
});

describe("WebOTP requests", () => {
  it("makes no request on mount, even with several inputs on the page", () => {
    render(
      <>
        <OtpInput label="First code" />
        <OtpInput label="Second code" />
        <OtpInput label="Third code" />
      </>,
    );
    expect(calls).toHaveLength(0);
  });

  it("asks when an input is focused, once, and hands over to the next input", () => {
    render(
      <>
        <OtpInput label="First code" />
        <OtpInput label="Second code" />
      </>,
    );
    const [first, second] = screen.getAllByLabelText("Digit 1 of 6");
    fireEvent.focus(first);
    fireEvent.focus(first);
    expect(calls).toHaveLength(1);
    fireEvent.focus(second);
    expect(calls).toHaveLength(2);
    expect(calls[0].aborted).toBe(true);
    expect(calls[1].aborted).toBe(false);
  });

  it("doesn't ask when disabled or turned off, and cancels on unmount", () => {
    const { unmount } = render(
      <>
        <OtpInput label="Off" webOtp={false} />
        <OtpInput label="Disabled" disabled />
        <OtpInput label="On" />
      </>,
    );
    const boxes = screen.getAllByLabelText("Digit 1 of 6");
    fireEvent.focus(boxes[0]);
    fireEvent.focus(boxes[1]);
    expect(calls).toHaveLength(0);
    fireEvent.focus(boxes[2]);
    expect(calls).toHaveLength(1);
    unmount();
    expect(calls[0].aborted).toBe(true);
  });
});
