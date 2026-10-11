import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  BanglaPhoneticInput,
  DEFAULT_BANGLA_DICTIONARY,
  suggestBangla,
  transliterate,
  transliterateText,
} from "@/components/ui/bangla-phonetic-input";

describe("transliterate (Avro-style rules)", () => {
  it.each([
    ["ami", "আমি"],
    ["tumi", "তুমি"],
    ["kotha", "কথা"],
    ["ekhon", "এখন"],
    ["boi", "বই"],
    ["bangla", "বাংলা"],
    ["bangali", "বাঙালি"], // ng before a vowel is ঙ
    ["prothom", "প্রথম"], // ra-phala
    ["gram", "গ্রাম"],
    ["bondhu", "বন্ধু"], // conjunct ন্ধ
    ["bakyo", "বাক্য"], // ya-phala
    ["nayok", "নায়ক"], // য় after a vowel
    ["shikkha", "শিক্ষা"], // kkh → ক্ষ
    ["ca^d", "চাঁদ"], // chandrabindu
    ["2026", "২০২৬"],
    ["Ami", "আমি"], // capital without its own rule acts like lowercase
  ])("%s → %s", (roman, bangla) => {
    expect(transliterate(roman)).toBe(bangla);
  });

  it("is case-sensitive where Avro is", () => {
    expect(transliterate("tk")).toBe("তক");
    expect(transliterate("Tk")).toBe("টক");
    expect(transliterate("dal")).toBe("দাল");
    expect(transliterate("Dal")).toBe("ডাল");
  });

  it("keeps আমরা unjoined but joins reph only when asked (rr)", () => {
    expect(transliterate("amra")).toBe("আমরা");
    expect(transliterate("korbo")).toBe("করব");
    expect(transliterate("dhorrmo")).toBe("ধর্ম");
  });
});

describe("suggestBangla", () => {
  it("puts dictionary words first", () => {
    expect(suggestBangla("tomake")[0]).toBe("তোমাকে");
    expect(suggestBangla("dhaka")[0]).toBe("ঢাকা");
    expect(suggestBangla("bhalobashi")[0]).toBe("ভালোবাসি");
  });

  it("offers reph and স/শ variants", () => {
    expect(suggestBangla("dhormo")).toContain("ধর্ম");
    expect(suggestBangla("shundor")).toContain("সুন্দর");
  });

  it("uses custom words and never repeats a suggestion", () => {
    const s = suggestBangla("lofistack", { lofistack: "লফিস্ট্যাক" });
    expect(s[0]).toBe("লফিস্ট্যাক");
    expect(new Set(s).size).toBe(s.length);
  });

  it("has 200+ everyday words, all in Bangla script", () => {
    const words = Object.values(DEFAULT_BANGLA_DICTIONARY).flat();
    expect(Object.keys(DEFAULT_BANGLA_DICTIONARY).length).toBeGreaterThan(200);
    for (const w of words) expect(w).toMatch(/^[ঀ-৿ ]+$/);
  });
});

describe("transliterateText", () => {
  it("converts a sentence and turns full stops into দাঁড়ি", () => {
    expect(transliterateText("ami tomake bhalobashi. tumi kemon acho?")).toBe("আমি তোমাকে ভালোবাসি। তুমি কেমন আছো?");
  });
});

describe("<BanglaPhoneticInput />", () => {
  /** Types text one character at a time, like a keyboard. */
  const type = (field: HTMLInputElement | HTMLTextAreaElement, text: string) => {
    for (const ch of text) {
      const at = field.selectionStart ?? field.value.length;
      const next = field.value.slice(0, at) + ch + field.value.slice(at);
      fireEvent.change(field, { target: { value: next, selectionStart: at + 1, selectionEnd: at + 1 } });
      field.setSelectionRange(at + 1, at + 1);
    }
  };

  it("converts each word when a space follows it", () => {
    const onChange = vi.fn();
    render(<BanglaPhoneticInput label="Message" onChange={onChange} />);
    const field = screen.getByRole("combobox") as HTMLInputElement;
    type(field, "ami tomake ");
    expect(field.value).toBe("আমি তোমাকে ");
    expect(onChange).toHaveBeenLastCalledWith("আমি তোমাকে ");
  });

  it("shows suggestions for the word being typed, with the English original last", () => {
    render(<BanglaPhoneticInput label="Message" />);
    const field = screen.getByRole("combobox");
    type(field as HTMLInputElement, "dhaka");
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options[0]).toBe("ঢাকা");
    expect(options.at(-1)).toBe("English: dhaka");
    expect(field.getAttribute("aria-expanded")).toBe("true");
    expect(field.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("option")[0].id);
  });

  it("↓ then Enter picks another suggestion", () => {
    render(<BanglaPhoneticInput label="Message" />);
    const field = screen.getByRole("combobox") as HTMLInputElement;
    type(field, "ki");
    fireEvent.keyDown(field, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(field, { key: "Enter" });
    expect(field.value).toBe("কি");
  });

  it("Esc keeps the English word", () => {
    render(<BanglaPhoneticInput label="Message" />);
    const field = screen.getByRole("combobox") as HTMLInputElement;
    type(field, "email");
    fireEvent.keyDown(field, { key: "Escape" });
    type(field, " ");
    expect(field.value).toBe("email ");
  });

  it("Ctrl+M switches to English and back", () => {
    const onModeChange = vi.fn();
    render(<BanglaPhoneticInput label="Message" onModeChange={onModeChange} />);
    const field = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.keyDown(field, { key: "m", ctrlKey: true });
    expect(onModeChange).toHaveBeenLastCalledWith(false);
    expect(field.getAttribute("lang")).toBe("en");
    type(field, "hello ");
    expect(field.value).toBe("hello ");
    expect(screen.getByRole("button", { name: "বাংলা, Type in Bangla" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("converts pasted English", () => {
    render(<BanglaPhoneticInput label="Message" />);
    const field = screen.getByRole("combobox") as HTMLInputElement;
    const pasted = "ami bangla bhalobashi ";
    fireEvent.change(field, { target: { value: pasted, selectionStart: pasted.length, selectionEnd: pasted.length } });
    expect(field.value).toBe("আমি বাংলা ভালোবাসি ");
  });

  it("turns a full stop after a word into দাঁড়ি", () => {
    render(<BanglaPhoneticInput label="Message" multiline />);
    const field = screen.getByLabelText("Message") as HTMLTextAreaElement;
    type(field, "dhonnobad.");
    expect(field.value).toBe("ধন্যবাদ।");
    expect(field.getAttribute("lang")).toBe("bn");
  });
});
