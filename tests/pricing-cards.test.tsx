import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  PricingTable,
  fittingPlans,
  recommendPlan,
  type PlanFinderDimension,
  type PricingPlan,
} from "@/components/ui/pricing-cards";

const plan = (id: string, monthly: number, yearly: number): PricingPlan => ({
  id,
  name: id[0].toUpperCase() + id.slice(1),
  description: `${id} plan`,
  monthly,
  yearly,
  features: [],
  cta: { label: `Choose ${id}` },
});

const PLANS = [plan("starter", 0, 0), plan("pro", 15, 144), plan("team", 40, 384), plan("studio", 35, 400)];

const FINDER: PlanFinderDimension[] = [
  { id: "seats", label: "Team size", unit: "seats", min: 1, max: 30, limits: { starter: 1, pro: 1, team: 10, studio: 10 } },
  { id: "storage", label: "Storage", unit: "storage", min: 1, max: 600, defaultValue: 5, format: (n) => `${n} GB`, limits: { starter: 1, pro: 50, team: null, studio: 500 } },
];

describe("recommendPlan", () => {
  it("picks the cheapest plan that covers every value", () => {
    expect(recommendPlan(PLANS, "monthly", FINDER, { seats: 1, storage: 1 })).toBe("starter");
    expect(recommendPlan(PLANS, "monthly", FINDER, { seats: 1, storage: 20 })).toBe("pro");
  });

  it("compares at the chosen billing period", () => {
    // Monthly: studio (35) is cheaper than team (40). Yearly: team (32/mo) beats studio (33.33/mo).
    expect(recommendPlan(PLANS, "monthly", FINDER, { seats: 5, storage: 20 })).toBe("studio");
    expect(recommendPlan(PLANS, "yearly", FINDER, { seats: 5, storage: 20 })).toBe("team");
  });

  it("treats null and missing limits as unlimited", () => {
    expect(fittingPlans(PLANS, "monthly", FINDER, { seats: 2, storage: 600 }).map((p) => p.id)).toEqual(["team"]);
  });

  it("returns null when nothing fits", () => {
    expect(recommendPlan(PLANS, "monthly", FINDER, { seats: 25, storage: 1 })).toBeNull();
  });
});

describe("<PricingTable finder />", () => {
  const setRange = (el: HTMLElement, v: number) => fireEvent.change(el, { target: { value: String(v) } });

  it("marks the best fit, explains plans that are too small, and reports the choice", () => {
    const onRecommend = vi.fn();
    render(<PricingTable plans={PLANS} finder={FINDER} onRecommend={onRecommend} />);
    expect(onRecommend).toHaveBeenLastCalledWith("pro");
    expect(screen.getByRole("heading", { name: "Pro, Best fit for you" })).toBeTruthy();

    setRange(screen.getByLabelText("Team size"), 4);
    expect(onRecommend).toHaveBeenLastCalledWith("studio");
    expect(screen.getAllByText("Too small: you need 4 seats")).toHaveLength(2);
    expect(screen.getAllByText("Up to 10 seats")).toHaveLength(2);
    expect(screen.getByText("Unlimited storage")).toBeTruthy();
  });

  it("says when nothing fits", () => {
    render(<PricingTable plans={PLANS} finder={FINDER} />);
    setRange(screen.getByLabelText("Team size"), 25);
    expect(screen.getByText(/None of these plans is big enough/)).toBeTruthy();
    expect(screen.queryByText(/Best fit for you/)).toBeNull();
  });

  it("announces a new recommendation once the slider settles", () => {
    vi.useFakeTimers();
    const { container } = render(<PricingTable plans={PLANS} finder={FINDER} />);
    setRange(screen.getByLabelText("Team size"), 4);
    const live = container.querySelector("[aria-live=polite]")!;
    expect(live.textContent).toBe("");
    act(() => vi.advanceTimersByTime(700));
    expect(live.textContent).toBe("Best fit: Studio, $35 per month.");
  });

  it("gives the slider a readable value", () => {
    render(<PricingTable plans={PLANS} finder={FINDER} />);
    expect(screen.getByLabelText("Storage").getAttribute("aria-valuetext")).toBe("5 GB");
  });
});
