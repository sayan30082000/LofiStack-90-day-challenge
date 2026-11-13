import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DonutChart, biggestChanges, compareDonut, groupSmallSlices, type DonutDatum } from "@/components/ui/donut-chart";
import {
  MultiStepForm,
  activeSteps,
  draftAge,
  formatTimeLeft,
  updatePace,
  type WizardStep,
} from "@/components/ui/multi-step-form";

/* ---------- Donut: grouping and comparison ---------- */

const DATA: DonutDatum[] = [
  { label: "Rent", value: 600 },
  { label: "Food", value: 300 },
  { label: "Books", value: 20 },
  { label: "Gifts", value: 30 },
  { label: "Apps", value: 50 },
];
const PREV: DonutDatum[] = [
  { label: "Rent", value: 600 },
  { label: "Food", value: 200 },
  { label: "Books", value: 40 },
  { label: "Apps", value: 50 },
];

describe("groupSmallSlices", () => {
  it("puts slices under the threshold into one Other slice, last", () => {
    const g = groupSmallSlices(DATA, 0.04);
    expect(g.grouped.map((d) => d.label)).toEqual(["Books", "Gifts"]);
    expect(g.data).toEqual([DATA[0], DATA[1], DATA[4], { label: "Other", value: 50 }]);
  });
  it("leaves the data alone when fewer than two slices are small, or grouping is off", () => {
    expect(groupSmallSlices(DATA, 0.025).grouped).toEqual([]);
    expect(groupSmallSlices(DATA, 0).data).toBe(DATA);
    expect(groupSmallSlices([], 0.1).data).toEqual([]);
  });
});

describe("compareDonut and biggestChanges", () => {
  it("matches categories by label and marks new ones", () => {
    const c = compareDonut(DATA, PREV);
    expect(c.find((x) => x.label === "Food")).toMatchObject({ previous: 200, change: 0.5 });
    expect(c.find((x) => x.label === "Rent")?.change).toBe(0);
    expect(c.find((x) => x.label === "Gifts")).toMatchObject({ previous: null, change: null });
  });
  it("finds the biggest rise and drop", () => {
    const { rise, drop } = biggestChanges(compareDonut(DATA, PREV));
    expect(rise?.label).toBe("Food");
    expect(drop?.label).toBe("Books");
    expect(biggestChanges([])).toEqual({ rise: null, drop: null });
  });
});

describe("<DonutChart /> Other and previous", () => {
  it("opens Other as its own breakdown and comes back", () => {
    render(<DonutChart label="Spend" data={DATA} groupBelow={0.04} animationDuration={0} />);
    const other = screen.getByRole("button", { name: /^Other \(2\).*show the 2 categories/ });
    fireEvent.click(other);
    expect(screen.getByRole("button", { name: "All categories" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Books/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Rent/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "All categories" }));
    expect(screen.getByRole("button", { name: /^Rent/ })).toBeTruthy();
  });

  it("shrinks Other when a category inside it is hidden", () => {
    render(<DonutChart label="Spend" data={DATA} groupBelow={0.04} animationDuration={0} format={(v) => `$${v}`} />);
    fireEvent.click(screen.getByRole("button", { name: /^Other/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Gifts/ }));
    fireEvent.click(screen.getByRole("button", { name: "All categories" }));
    expect(screen.getByRole("button", { name: /^Other/ }).textContent).toContain("$20");
  });

  it("names changes in words and the biggest rise and drop", () => {
    render(<DonutChart label="Spend" data={DATA} previous={PREV} previousLabel="May" animationDuration={0} />);
    expect(screen.getByRole("button", { name: /^Food, up 50% from May/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Gifts, new/ })).toBeTruthy();
    expect(screen.getByText(/Biggest rise:/).parentElement?.textContent).toContain("Food +50%");
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("Books 20");
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("down 50% from May");
  });
});

/* ---------- Wizard: branches, drafts and time left ---------- */

describe("time left and drafts", () => {
  it("moves the pace toward the newest step, within limits", () => {
    expect(updatePace(null, 8)).toBe(8);
    expect(updatePace(10, 20)).toBe(14);
    expect(updatePace(null, 0.5)).toBe(2);
    expect(updatePace(null, 600)).toBe(60);
  });
  it("words the estimate and the draft age", () => {
    expect(formatTimeLeft(30)).toBe("Less than a minute left");
    expect(formatTimeLeft(150)).toBe("About 3 min left");
    expect(draftAge(10_000)).toBe("just now");
    expect(draftAge(5 * 60_000)).toBe("5 minutes ago");
    expect(draftAge(2 * 3_600_000)).toBe("2 hours ago");
    expect(draftAge(3 * 86_400_000)).toBe("3 days ago");
  });
});

type V = { plan: string; billing: string; secret: string };
const STEPS: WizardStep<V>[] = [
  {
    id: "plan",
    title: "Plan",
    fields: 1,
    render: ({ values, setValue, field }) => (
      <label>
        Plan
        <select {...field("plan")} value={values.plan} onChange={(e) => setValue("plan", e.target.value)}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </label>
    ),
  },
  {
    id: "billing",
    title: "Billing",
    when: (v) => v.plan === "pro",
    render: ({ values, setValue, field }) => (
      <label>
        Billing email
        <input {...field("billing")} value={values.billing} onChange={(e) => setValue("billing", e.target.value)} />
      </label>
    ),
  },
  {
    id: "secret",
    title: "Password",
    render: ({ values, setValue, field }) => (
      <label>
        Password
        <input {...field("secret")} value={values.secret} onChange={(e) => setValue("secret", e.target.value)} />
      </label>
    ),
  },
];
const INITIAL: V = { plan: "free", billing: "", secret: "" };

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("activeSteps", () => {
  it("keeps only the steps whose `when` passes", () => {
    expect(activeSteps(STEPS, INITIAL).map((s) => s.id)).toEqual(["plan", "secret"]);
    expect(activeSteps(STEPS, { ...INITIAL, plan: "pro" }).map((s) => s.id)).toEqual(["plan", "billing", "secret"]);
  });
});

describe("<MultiStepForm /> branches, drafts and time left", () => {
  it("adds and removes a step from an answer, and says so", () => {
    render(<MultiStepForm steps={STEPS} initialValues={INITIAL} onSubmit={async () => {}} />);
    expect(screen.getByText("Step 1 of 3")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "pro" } });
    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Added a step: Billing. 4 steps now.");
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "free" } });
    expect(screen.getByRole("status").textContent).toBe("Removed a step: Billing. 3 steps now.");
  });

  it("shows a time estimate from the remaining fields", () => {
    render(<MultiStepForm steps={STEPS} initialValues={INITIAL} onSubmit={async () => {}} secondsPerField={20} />);
    // Plan (1 field) + Password (2 by default) = 3 fields × 20 s.
    expect(screen.getByText("About 1 min left")).toBeTruthy();
  });

  it("saves progress (without excluded fields) and offers to resume it", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const first = render(
      <MultiStepForm steps={STEPS} initialValues={INITIAL} onSubmit={async () => {}} persistKey="t-draft" persistExclude={["secret"]} />,
    );
    await act(async () => void vi.advanceTimersByTime(1));
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "pro" } });
    await act(async () => void fireEvent.submit(screen.getByLabelText("Plan").closest("form")!));
    fireEvent.change(screen.getByLabelText("Billing email"), { target: { value: "bills@example.com" } });
    const saved = JSON.parse(localStorage.getItem("t-draft")!);
    expect(saved).toMatchObject({ stepId: "billing", values: { plan: "pro", billing: "bills@example.com" } });
    expect(saved.values.secret).toBeUndefined();
    first.unmount();

    vi.advanceTimersByTime(2 * 3_600_000);
    render(<MultiStepForm steps={STEPS} initialValues={INITIAL} onSubmit={async () => {}} persistKey="t-draft" />);
    await act(async () => void vi.advanceTimersByTime(1));
    expect(screen.getByText("You have a saved draft from 2 hours ago, at “Billing”.")).toBeTruthy();
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "Resume" })));
    expect((screen.getByLabelText("Billing email") as HTMLInputElement).value).toBe("bills@example.com");
    expect(screen.getByText("Step 2 of 4")).toBeTruthy();
  });

  it("starts fresh and forgets the draft", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    localStorage.setItem("t-draft", JSON.stringify({ values: { plan: "pro" }, stepId: "billing", savedAt: Date.now() }));
    render(<MultiStepForm steps={STEPS} initialValues={INITIAL} onSubmit={async () => {}} persistKey="t-draft" />);
    await act(async () => void vi.advanceTimersByTime(1));
    fireEvent.click(screen.getByRole("button", { name: "Start fresh" }));
    expect(localStorage.getItem("t-draft")).toBeNull();
    expect(screen.queryByText(/saved draft/)).toBeNull();
    expect((screen.getByLabelText("Plan") as HTMLSelectElement).value).toBe("free");
  });
});
