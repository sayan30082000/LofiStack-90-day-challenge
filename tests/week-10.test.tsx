import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Breadcrumbs, filterSiblings, type BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Toaster, readingTime, toast, toastMergeKey } from "@/components/ui/toast";

/* ---------- Toast: merging, reading time, undo ---------- */

describe("toastMergeKey and readingTime", () => {
  it("merges by group, else by type and text; never loading or group: false", () => {
    expect(toastMergeKey("success", "Saved")).toBe("success:Saved");
    expect(toastMergeKey("error", "Saved")).toBe("error:Saved");
    expect(toastMergeKey("success", "a.jpg uploaded", "uploads")).toBe("group:uploads");
    expect(toastMergeKey("success", "Saved", false)).toBeNull();
    expect(toastMergeKey("loading", "Saving…")).toBeNull();
  });
  it("gives about 0.3s per word on top of 3s, between 4s and 15s", () => {
    expect(readingTime("Saved")).toBe(4000);
    expect(readingTime(Array(10).fill("word").join(" "))).toBe(6000);
    expect(readingTime(Array(100).fill("word").join(" "))).toBe(15000);
  });
});

const live = () => [...document.querySelectorAll("[data-toast]:not([data-removing])")].map((el) => (el as HTMLElement).textContent);

describe("<Toaster /> merging and undo", () => {
  afterEach(async () => {
    await act(async () => {
      toast.dismiss();
      await new Promise((r) => setTimeout(r, 260));
    });
  });

  it("counts repeats instead of stacking, and summarises groups", async () => {
    render(<Toaster />);
    await act(async () => {
      toast.success("Draft saved");
      toast.success("Draft saved");
      toast.success("Draft saved");
    });
    expect(live()).toHaveLength(1);
    expect(live()[0]).toContain("Draft saved");
    expect(live()[0]).toContain("3 times");
    await act(async () => {
      toast.success("a.jpg uploaded", { group: "up", groupMessage: (n) => `${n} photos uploaded` });
      toast.success("b.jpg uploaded", { group: "up", groupMessage: (n) => `${n} photos uploaded` });
    });
    expect(live()).toHaveLength(2);
    expect(live()[0]).toContain("2 photos uploaded");
    expect(live()[0]).not.toContain("times");
  });

  it("toast.undo commits when it closes, and undoes with the button instead", async () => {
    render(<Toaster />);
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    await act(async () => void toast.undo("Email archived", { onUndo, onCommit }));
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: /^Undo/ })));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
    // Let the first toast finish leaving.
    await act(async () => void (await new Promise((r) => setTimeout(r, 260))));

    const onCommit2 = vi.fn();
    await act(async () => void toast.undo("Email archived", { onUndo: vi.fn(), onCommit: onCommit2 }));
    await act(async () => void fireEvent.click(screen.getAllByRole("button", { name: "Dismiss notification: Email archived" })[0]));
    expect(onCommit2).toHaveBeenCalledTimes(1);
  });

  it("Ctrl/⌘+Z undoes the newest undo toast, but not while typing", async () => {
    render(
      <>
        <input aria-label="Notes" />
        <Toaster />
      </>,
    );
    const onUndo = vi.fn();
    await act(async () => void toast.undo("Deleted", { onUndo }));
    fireEvent.keyDown(screen.getByLabelText("Notes"), { key: "z", ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
    await act(async () => void fireEvent.keyDown(document.body, { key: "z", metaKey: true }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});

/* ---------- Breadcrumbs: sibling switcher ---------- */

const PROJECTS: BreadcrumbItem[] = Array.from({ length: 9 }, (_, i) => ({ label: ["Lofi Gallery", "Docs", "Données", "Mobile app", "Design", "Billing", "Status", "Help", "Brand"][i], href: `/p/${i}` }));

describe("filterSiblings", () => {
  it("matches any part, ignoring case and accents", () => {
    expect(filterSiblings(PROJECTS, "DONNEES").map((p) => p.label)).toEqual(["Données"]);
    expect(filterSiblings(PROJECTS, "  ").length).toBe(9);
    expect(filterSiblings(PROJECTS, "zzz")).toEqual([]);
  });
});

describe("<Breadcrumbs /> siblings", () => {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { ...PROJECTS[0], siblings: PROJECTS },
    { label: "Billing", siblings: [{ label: "General", href: "/s/general" }, { label: "Billing", href: "/s/billing" }] },
  ];

  it("lists the siblings, ticks the current one, and filters long lists", async () => {
    render(<Breadcrumbs items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Other items next to Lofi Gallery" }));
    // Focus moves into the menu once it has rendered.
    await act(async () => void (await new Promise((r) => setTimeout(r, 10))));
    const list = screen.getByRole("list", { name: "Other items next to Lofi Gallery" });
    expect(within(list).getAllByRole("link")).toHaveLength(9);
    expect(within(list).getByRole("link", { name: "Lofi Gallery, current" })).toBeTruthy();
    const filter = screen.getByRole("searchbox", { name: "Filter…" });
    expect(document.activeElement).toBe(filter);
    fireEvent.change(filter, { target: { value: "doc" } });
    expect(within(list).getAllByRole("link").map((a) => a.textContent)).toEqual(["Docs"]);
    fireEvent.keyDown(filter, { key: "Escape" });
    expect(screen.queryByRole("list", { name: "Other items next to Lofi Gallery" })).toBeNull();
  });

  it("works on the current page (no link), with no filter for short lists", () => {
    render(<Breadcrumbs items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Other items next to Billing" }));
    const list = screen.getByRole("list", { name: "Other items next to Billing" });
    expect(within(list).getByRole("link", { name: "Billing, current" })).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("adds no button for items without siblings", () => {
    render(<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Page" }]} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
