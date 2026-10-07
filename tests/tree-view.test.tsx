import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TreeView, changeKey, type TreeNode } from "@/components/ui/tree-view";

const DATA: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/a.ts", label: "a.ts", isLeaf: true, status: "modified", changedAt: 1 },
      { id: "src/b.ts", label: "b.ts", isLeaf: true, status: "added", changedAt: 1 },
      { id: "src/c.ts", label: "c.ts", isLeaf: true },
    ],
  },
  { id: "old.md", label: "old.md", isLeaf: true, status: "removed", changedAt: 1 },
  { id: "readme.md", label: "readme.md", isLeaf: true },
];

const item = (name: RegExp) => screen.getByRole("treeitem", { name });

describe("<TreeView /> change markers", () => {
  it("rolls up changes on a closed folder", () => {
    render(<TreeView label="Files" data={DATA} />);
    expect(item(/^src/).textContent).toContain("contains 1 added, 1 modified");
  });

  it("marks each changed row and strikes through removed ones", () => {
    render(<TreeView label="Files" data={DATA} defaultExpanded={["src"]} />);
    expect(item(/^a\.ts/).textContent).toContain("modified");
    const removed = item(/^old\.md/);
    expect(removed.textContent).toContain("removed");
    expect(removed.querySelector(".line-through")).not.toBeNull();
  });

  it("changesOnly hides everything that did not change", () => {
    render(<TreeView label="Files" data={DATA} changesOnly />);
    expect(screen.queryByRole("treeitem", { name: /^c\.ts/ })).toBeNull();
    expect(screen.queryByRole("treeitem", { name: /^readme/ })).toBeNull();
    expect(item(/^b\.ts/)).toBeTruthy();
  });
});

describe("<TreeView /> jump to change", () => {
  it("Alt+Down opens closed folders on the way and focuses the next change", () => {
    render(<TreeView label="Files" data={DATA} />);
    const tree = screen.getByRole("tree");
    act(() => item(/^src/).focus());
    fireEvent.keyDown(tree, { key: "ArrowDown", altKey: true });
    expect(item(/^src/).getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(item(/^a\.ts/));
    fireEvent.keyDown(tree, { key: "ArrowDown", altKey: true });
    expect(document.activeElement).toBe(item(/^b\.ts/));
    fireEvent.keyDown(tree, { key: "ArrowDown", altKey: true });
    expect(document.activeElement).toBe(item(/^old\.md/));
  });
});

describe("<TreeView /> new since last visit", () => {
  it("clears the dot after the change has been on screen, and remembers it", () => {
    vi.useFakeTimers();
    const onSeenChange = vi.fn();
    const { unmount } = render(
      <TreeView label="Files" data={DATA} trackSeen persistSeenKey="seen-test" seenDelay={1000} onSeenChange={onSeenChange} />,
    );
    expect(item(/^old\.md/).textContent).toContain("new");
    act(() => vi.advanceTimersByTime(1100));
    expect(item(/^old\.md/).textContent).not.toContain("new");
    expect(JSON.parse(localStorage.getItem("seen-test")!)).toContain(changeKey(DATA[1]));
    // The closed folder still carries the dot for the unseen changes inside it.
    expect(item(/^src/).textContent).toContain("new");
    unmount();

    render(<TreeView label="Files" data={DATA} trackSeen persistSeenKey="seen-test" />);
    expect(item(/^old\.md/).textContent).not.toContain("new");
  });

  it("a newer change on the same node is unseen again", () => {
    const key = changeKey(DATA[1]);
    const newer: TreeNode[] = [DATA[0], { ...DATA[1], changedAt: 2 }, DATA[2]];
    render(<TreeView label="Files" data={newer} trackSeen seen={[key]} />);
    expect(item(/^old\.md/).textContent).toContain("new");
  });
});
