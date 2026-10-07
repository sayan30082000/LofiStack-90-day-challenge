import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SkeletonFromLayout,
  SkeletonWrapper,
  forgetSkeletonLayout,
  measureSkeletonLayout,
  type SkeletonLayout,
} from "@/components/ui/skeleton";

/*
  jsdom has no layout engine. These helpers give elements boxes from a data-rect
  attribute and text nodes line boxes from their parent's data-lines attribute.
*/
type Box = { left: number; top: number; width: number; height: number };
const rect = (b: Box) => ({ ...b, x: b.left, y: b.top, right: b.left + b.width, bottom: b.top + b.height, toJSON: () => b }) as DOMRect;

function mockLayout() {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const raw = this.getAttribute("data-rect");
    return rect(raw ? JSON.parse(raw) : { left: 0, top: 0, width: 0, height: 0 });
  });
  const original = document.createRange.bind(document);
  vi.spyOn(document, "createRange").mockImplementation(() => {
    const range = original();
    let owner: Element | null = null;
    range.selectNodeContents = (node: Node) => {
      owner = node.parentElement;
    };
    range.getClientRects = () => {
      const lines: Box[] = JSON.parse(owner?.getAttribute("data-lines") ?? "[]");
      return lines.map(rect) as unknown as DOMRectList;
    };
    return range;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  forgetSkeletonLayout("test-feed");
});

const LAYOUT: SkeletonLayout = {
  width: 400,
  height: 120,
  blocks: [
    { x: 0, y: 0, w: 1, h: 120, r: 12, frame: true },
    { x: 0.05, y: 16, w: 0.1, h: 40, r: 9999 },
    { x: 0.2, y: 20, w: 0.6, h: 10, r: 5 },
  ],
};

describe("measureSkeletonLayout", () => {
  it("turns text lines, media and bordered cards into blocks relative to the root", () => {
    mockLayout();
    const { container } = render(
      <div data-rect={JSON.stringify({ left: 100, top: 50, width: 400, height: 200 })}>
        <article style={{ border: "1px solid" }} data-rect={JSON.stringify({ left: 100, top: 50, width: 400, height: 120 })}>
          <img alt="" data-rect={JSON.stringify({ left: 120, top: 66, width: 40, height: 40 })} />
          <p data-lines={JSON.stringify([{ left: 180, top: 66, width: 300, height: 20 }, { left: 180, top: 86, width: 120, height: 20 }])}>
            A post that wraps onto two lines
          </p>
        </article>
      </div>,
    );
    const layout = measureSkeletonLayout(container.firstElementChild as HTMLElement);

    expect(layout.width).toBe(400);
    expect(layout.blocks).toHaveLength(4);
    const [frame, img, line1, line2] = layout.blocks;
    expect(frame).toMatchObject({ x: 0, y: 0, w: 1, h: 120, frame: true });
    expect(img).toMatchObject({ x: 0.05, y: 16, w: 0.1, h: 40 });
    // Text is drawn at 70% of the line height, centred.
    expect(line1).toMatchObject({ x: 0.2, y: 19, w: 0.75, h: 14 });
    expect(line2.w).toBeCloseTo(0.3);
  });

  it("merges inline pieces of one line into a single bar", () => {
    mockLayout();
    const { container } = render(
      <div data-rect={JSON.stringify({ left: 0, top: 0, width: 200, height: 40 })}>
        <span data-lines={JSON.stringify([{ left: 0, top: 0, width: 50, height: 20 }])}>Hello</span>
        <b data-lines={JSON.stringify([{ left: 54, top: 0, width: 46, height: 20 }])}>world</b>
      </div>,
    );
    const layout = measureSkeletonLayout(container.firstElementChild as HTMLElement);
    expect(layout.blocks).toHaveLength(1);
    expect(layout.blocks[0].w).toBeCloseTo(0.5);
  });

  it("stops at maxBlocks", () => {
    mockLayout();
    const lines = Array.from({ length: 20 }, (_, i) => ({ left: 0, top: i * 30, width: 100, height: 20 }));
    const { container } = render(
      <div data-rect={JSON.stringify({ left: 0, top: 0, width: 100, height: 600 })}>
        <p data-lines={JSON.stringify(lines)}>Lots of lines</p>
      </div>,
    );
    expect(measureSkeletonLayout(container.firstElementChild as HTMLElement, { maxBlocks: 5 }).blocks).toHaveLength(5);
  });
});

describe("<SkeletonFromLayout />", () => {
  it("draws frames as outlines and blocks as positioned skeletons", () => {
    const { container } = render(<SkeletonFromLayout layout={LAYOUT} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.height).toBe("120px");
    expect(root.querySelectorAll("span.border")).toHaveLength(1);
    const blocks = root.querySelectorAll<HTMLElement>("[data-skeleton]");
    expect(blocks).toHaveLength(2);
    expect(blocks[1].style.left).toBe("20%");
    expect(blocks[0].style.borderRadius).toBe("9999px");
  });
});

describe("<SkeletonWrapper /> shape memory", () => {
  it("uses a remembered shape instead of the fallback", () => {
    localStorage.setItem("lofi-skeleton:test-feed", JSON.stringify(LAYOUT));
    const { container } = render(
      <SkeletonWrapper loading rememberKey="test-feed" fallback={<p>hand-made</p>}>
        <p>content</p>
      </SkeletonWrapper>,
    );
    expect(container.querySelector("[data-skeleton-shape]")?.getAttribute("data-skeleton-shape")).toBe("remembered");
    expect(screen.queryByText("hand-made")).toBeNull();
  });

  it("falls back to the hand-made skeleton when nothing is remembered", () => {
    render(
      <SkeletonWrapper loading rememberKey="test-feed" fallback={<p>hand-made</p>}>
        <p>content</p>
      </SkeletonWrapper>,
    );
    expect(screen.getByText("hand-made")).toBeTruthy();
  });

  it("measures the content after it loads and reports it", () => {
    vi.useFakeTimers();
    mockLayout();
    const onMeasure = vi.fn();
    const { rerender } = render(
      <SkeletonWrapper loading rememberKey="test-feed" onMeasure={onMeasure} fallback={<p>hand-made</p>}>
        <p data-lines={JSON.stringify([{ left: 0, top: 0, width: 50, height: 20 }])}>content</p>
      </SkeletonWrapper>,
    );
    rerender(
      <SkeletonWrapper loading={false} rememberKey="test-feed" onMeasure={onMeasure} fallback={<p>hand-made</p>}>
        <p data-lines={JSON.stringify([{ left: 0, top: 0, width: 50, height: 20 }])}>content</p>
      </SkeletonWrapper>,
    );
    act(() => vi.advanceTimersByTime(100));
    expect(onMeasure).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("lofi-skeleton:test-feed")).not.toBeNull();
  });

  it("says 'still loading' after slowAfter", () => {
    vi.useFakeTimers();
    render(
      <SkeletonWrapper loading slowAfter={3000} fallback={<p>hand-made</p>}>
        <p>content</p>
      </SkeletonWrapper>,
    );
    expect(screen.queryByText(/Still loading/)).toBeNull();
    act(() => vi.advanceTimersByTime(3100));
    expect(screen.getByRole("status").textContent).toContain("Still loading… thanks for waiting.");
  });
});
