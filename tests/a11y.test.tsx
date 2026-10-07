import { act, render } from "@testing-library/react";
import axe from "axe-core";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import * as animatedTabs from "@/app/components/animated-tabs/demos";
import * as confirmDialog from "@/app/components/confirm-dialog/demos";
import * as flipCard from "@/app/components/flip-card/demos";
import * as passwordStrength from "@/app/components/password-strength-input/demos";
import * as pricingCards from "@/app/components/pricing-cards/demos";
import * as skeleton from "@/app/components/skeleton/demos";
import * as treeView from "@/app/components/tree-view/demos";
import * as typingIndicator from "@/app/components/typing-indicator/demos";

/*
  Structural accessibility check for every released demo: names, roles, ARIA attributes,
  labels, list and landmark structure. jsdom has no layout or colours, so contrast and
  focus-visibility are covered by the browser audit instead (npm run a11y).
*/
const PAGES: Record<string, Record<string, unknown>> = {
  "tree-view": treeView,
  "typing-indicator": typingIndicator,
  "password-strength-input": passwordStrength,
  "flip-card": flipCard,
  "animated-tabs": animatedTabs,
  skeleton,
  "pricing-cards": pricingCards,
  "confirm-dialog": confirmDialog,
};

const demos = Object.entries(PAGES).flatMap(([page, mod]) =>
  Object.entries(mod)
    .filter(([name, value]) => name.endsWith("Demo") && typeof value === "function")
    .map(([name, value]) => [`${page} › ${name}`, value as ComponentType] as const),
);

describe("axe: released demos have no structural violations", () => {
  it.each(demos)("%s", async (_, Demo) => {
    const { container } = render(<Demo />);
    // Let effects and the first animation frame settle.
    await act(async () => new Promise((r) => setTimeout(r, 0)));
    const result = await axe.run(container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: {
        "color-contrast": { enabled: false },
        // A demo renders a fragment, not a whole page.
        region: { enabled: false },
      },
    });
    const summary = result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(summary).toEqual([]);
  });
});
