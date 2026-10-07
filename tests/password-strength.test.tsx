import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PASSPHRASE_WORDS,
  DEFAULT_PASSWORD_RULES,
  PasswordStrengthInput,
  bestPasswordTip,
  estimateCrackTime,
  formatCrackTime,
  generatePassphrase,
  scorePassword,
} from "@/components/ui/password-strength-input";

describe("scorePassword", () => {
  it("scores an empty password 0", () => {
    expect(scorePassword("").score).toBe(0);
  });

  it("marks leaked passwords Weak even when they pass every rule", () => {
    const r = scorePassword("Password123!");
    expect(r.checks.common).toBe(true);
    expect(r.score).toBe(1);
  });

  it("sees through trailing digits and l33t swaps", () => {
    expect(scorePassword("sunshine2024").checks.common).toBe(true);
    expect(scorePassword("p4ssw0rd").checks.common).toBe(true);
  });

  it("detects repeats and sequences", () => {
    expect(scorePassword("aaab").checks.repeated).toBe(true);
    expect(scorePassword("xabc").checks.sequential).toBe(true);
    expect(scorePassword("x321").checks.sequential).toBe(true);
    expect(scorePassword("axbycz").checks.sequential).toBe(false);
  });

  it("rates a long, varied password Strong", () => {
    expect(scorePassword("Xk9#mQ2!vL7p-tide").score).toBe(4);
  });

  it("counts emoji as one character", () => {
    expect(scorePassword("🔑🔑").checks.length).toBe(2);
  });
});

describe("formatCrackTime", () => {
  it.each([
    [-3, "instantly"],
    [0, "1 second"],
    [Math.log10(120), "2 minutes"],
    [Math.log10(3 * 3600), "3 hours"],
    [Math.log10(5 * 31_557_600), "5 years"],
    [Math.log10(500 * 31_557_600), "centuries"],
    [20, "millions of years"],
  ])("log10 seconds %d reads %s", (log10, text) => {
    expect(formatCrackTime(log10)).toBe(text);
  });
});

describe("estimateCrackTime", () => {
  it("treats leaked passwords as instant", () => {
    expect(estimateCrackTime("qwerty").display).toBe("instantly");
  });

  it("knows dictionary words are guessed before random letters", () => {
    const words = estimateCrackTime("hello world").log10Seconds;
    const random = estimateCrackTime("kqzvm tbxwp").log10Seconds;
    expect(words).toBeLessThan(random);
    expect(estimateCrackTime("hello world").display).toBe("1 second");
  });

  it("is not fooled by l33t spelling", () => {
    expect(estimateCrackTime("Tr0ub4dor&3").display).toBe("instantly");
  });

  it("gives random 12-character passwords centuries", () => {
    expect(estimateCrackTime("Xk9#mQ2!vL7p").display).toBe("centuries");
  });

  it("gets longer with every added random character", () => {
    const a = estimateCrackTime("Xk9#mQ").log10Seconds;
    const b = estimateCrackTime("Xk9#mQ2!").log10Seconds;
    expect(b).toBeGreaterThan(a);
  });

  it("scales with attacker speed", () => {
    const fast = estimateCrackTime("Xk9#mQ2!", { guessesPerSecond: 1e10 }).log10Seconds;
    const slow = estimateCrackTime("Xk9#mQ2!", { guessesPerSecond: 1e4 }).log10Seconds;
    expect(slow - fast).toBeCloseTo(6);
  });
});

describe("bestPasswordTip", () => {
  it("says nothing for an empty or already strong password", () => {
    expect(bestPasswordTip("")).toBeNull();
    expect(bestPasswordTip("Xk9#mQ2!vL7p")).toBeNull();
  });

  it("puts leaked passwords first", () => {
    expect(bestPasswordTip("Password123!")).toEqual({ id: "common" });
  });

  it("flags runs like aaa and 1234", () => {
    expect(bestPasswordTip("aaaa1234bbbb")?.id).toBe("pattern");
  });

  it("suggests the change with the biggest gain and its new crack time", () => {
    expect(bestPasswordTip("hello world")).toEqual({ id: "length", after: "centuries" });
  });
});

describe("generatePassphrase", () => {
  it("builds count words with separators from the list", () => {
    const { value } = generatePassphrase({ count: 4, separators: "-" , randomCase: false });
    const parts = value.split("-");
    expect(parts).toHaveLength(4);
    for (const p of parts) expect(DEFAULT_PASSPHRASE_WORDS).toContain(p);
  });

  it("reports honest entropy", () => {
    const { bits } = generatePassphrase({ count: 5 });
    const expected = 5 * Math.log2(DEFAULT_PASSPHRASE_WORDS.length) + 4 * Math.log2(16) + 5;
    expect(bits).toBeCloseTo(expected);
  });

  it("retries until accept passes", () => {
    const accept = vi.fn((v: string) => /\d/.test(v) && /[A-Z]/.test(v));
    const { value } = generatePassphrase({ accept });
    expect(accept(value)).toBe(true);
  });

  it("uses crypto randomness, not Math.random", () => {
    const spy = vi.spyOn(Math, "random");
    generatePassphrase();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("<PasswordStrengthInput />", () => {
  it("shows the crack time and the best fix while typing", () => {
    render(<PasswordStrengthInput label="Password" onChange={() => {}} />);
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "hello world" } });
    expect(screen.getByText("About 1 second to crack")).toBeTruthy();
    expect(screen.getByText("Best fix: add 4 more characters (centuries to crack)")).toBeTruthy();
  });

  it("fills both fields with a suggested passphrase that passes the rules", () => {
    const onChange = vi.fn();
    const onConfirm = vi.fn();
    render(<PasswordStrengthInput label="Password" confirm onChange={onChange} onConfirmChange={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Suggest a passphrase" }));
    fireEvent.click(screen.getByRole("button", { name: "Use it" }));

    const [value, result] = onChange.mock.calls.at(-1)!;
    expect(result.valid).toBe(true);
    expect(DEFAULT_PASSWORD_RULES.every((r) => r.test(value))).toBe(true);
    expect(onConfirm).toHaveBeenLastCalledWith(value, true);
    // Shown in plain text so the person can save it.
    expect((screen.getByLabelText("Password") as HTMLInputElement).type).toBe("text");
  });

  it("can hide tips, crack time and suggestions", () => {
    render(
      <PasswordStrengthInput label="Password" onChange={() => {}} showTips={false} showCrackTime={false} suggestPassphrase={false} />,
    );
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "hello world" } });
    expect(screen.queryByText(/to crack/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Suggest a passphrase" })).toBeNull();
  });
});
