// Accessibility audit: runs axe-core (WCAG 2.0/2.1/2.2 A + AA rules) on the homepage and every
// released component page, in light and dark mode, at 375px and 1280px, in your installed Chrome.
//
//   npm run build && npm start      (or npm run dev)
//   npm run a11y                    BASE_URL=https://lofistack-sayan.netlify.app npm run a11y
//   ONLY=command-palette npm run a11y   (one page; the report then covers only that page)
//
// Writes docs/a11y-report.md and exits with 1 when anything fails.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const axeSource = fs.readFileSync(path.join(root, "node_modules/axe-core/axe.min.js"), "utf8");

// Released pages, read the same way the site does: registry entries up to releasedThroughWeek.
const site = fs.readFileSync(path.join(root, "lib/site.ts"), "utf8");
const released = Number(site.match(/releasedThroughWeek:\s*(\d+)/)?.[1] ?? 0);
const registry = fs.readFileSync(path.join(root, "lib/registry.ts"), "utf8");
const slugs = [...registry.matchAll(/slug:\s*"([^"]+)"[\s\S]*?week:\s*(\d+)/g)]
  .filter((m) => Number(m[2]) <= released)
  .map((m) => m[1]);
// ONLY=command-palette npm run a11y   checks just the pages whose path contains that text.
const pages = ["/", ...slugs.map((s) => `/components/${s}`)].filter((p) => !process.env.ONLY || p.includes(process.env.ONLY));

// Interactive states that only exist after a click: audited on top of the page as loaded.
const STATES = {
  "/components/confirm-dialog": [
    { label: "dialog open (typing)", run: (p) => p.click('button[aria-label="Delete brand-assets"]') },
    {
      label: "undo bar",
      run: async (p) => {
        await p.keyboard.press("Escape");
        await p.click('button[aria-label="Delete scratch-notes"]');
        await p.click('[role="alertdialog"] button[type="submit"]');
      },
    },
  ],
  "/components/pricing-cards": [
    { label: "finder: nothing fits", run: (p) => p.locator('input[type="range"]').first().fill("25") },
  ],
  "/components/bangla-phonetic-input": [
    { label: "suggestions open", run: (p) => p.getByRole("textbox", { name: "Reply in Bangla" }).pressSequentially("valo achi tumi") },
  ],
  "/components/ticket-card": [
    { label: "stub torn off", run: (p) => p.getByRole("button", { name: "Tear off stub" }).first().click() },
  ],
  "/components/otp-input": [
    {
      label: "wrong code",
      run: async (p) => {
        await p.getByLabel("Digit 1 of 6").nth(1).pressSequentially("111111");
        await p.waitForTimeout(1200);
      },
    },
  ],
  "/components/activity-heatmap": [
    { label: "longest streak lit", run: (p) => p.getByRole("button", { name: /^Longest streak/ }).first().click() },
  ],
  "/components/file-dropzone": [
    {
      label: "every check failing",
      run: async (p) => {
        for (const name of ["Photo with GPS", "Blurry photo", "Tiny logo", "Big photo", "Contacts CSV"]) {
          await p.getByRole("button", { name }).click();
        }
        // Issue chips (amber <li>s); the same words also appear in the build prompt.
        await p.locator("li.bg-amber-50", { hasText: "Looks blurry" }).waitFor({ timeout: 15000 });
        await p.locator("li.bg-amber-50", { hasText: /^Large image/ }).waitFor({ timeout: 15000 });
      },
    },
    {
      label: "location removed",
      run: async (p) => {
        await p.getByRole("button", { name: /^Remove location/ }).click();
        await p.locator("li.bg-amber-50", { hasText: "Contains GPS location" }).waitFor({ state: "detached", timeout: 15000 });
      },
    },
  ],
  "/components/command-palette": [
    {
      label: "inline value + learned pick",
      run: async (p) => {
        await p.getByRole("button", { name: "Open the palette" }).click();
        await p.getByRole("combobox").pressSequentially("accent pink");
      },
    },
    {
      label: "value step with an error",
      run: async (p) => {
        await p.getByRole("combobox").fill("zoom");
        await p.keyboard.press("Enter");
        await p.getByRole("combobox").pressSequentially("300");
      },
    },
    {
      label: "shortcut tip",
      run: async (p) => {
        await p.keyboard.press("Escape");
        for (let i = 0; i < 3; i++) {
          await p.getByRole("button", { name: "Open the palette" }).click();
          await p.getByRole("combobox").fill("mode");
          await p.keyboard.press("Enter");
        }
        await p.getByRole("button", { name: "Open the palette" }).click();
      },
    },
  ],
  "/components/logo-marquee": [
    { label: "optical sizing off", run: (p) => p.getByRole("button", { name: "Optical sizing" }).click() },
  ],
  "/components/multi-step-form": [
    {
      label: "paid plan adds Billing",
      run: async (p) => {
        const w = p.locator('[id$="-panel-preview"]').first();
        await w.getByLabel("Full name").fill("Jane Cooper");
        await w.getByLabel("Work email").fill("jane@example.com");
        await w.getByRole("button", { name: "Continue" }).click();
        await w.getByLabel("Workspace name").fill("Northwind Studio");
        await w.locator("select").first().selectOption({ index: 2 });
        await w.getByRole("button", { name: "Continue" }).click();
        await w.getByText("Team", { exact: true }).first().click();
        await w.getByText(/Added a step: Billing/).waitFor();
      },
    },
    {
      label: "resume offer",
      run: async (p) => {
        await p.reload({ waitUntil: "networkidle" });
        await p.getByRole("button", { name: "Resume" }).waitFor();
      },
    },
  ],
  "/components/donut-chart": [
    { label: "Other opened", run: (p) => p.getByRole("button", { name: /^Other/ }).first().click() },
  ],
  "/components/data-table": [
    {
      label: "filters, a typo and a selection",
      run: async (p) => {
        const w = p.locator('[id$="-panel-preview"]').first();
        await w.getByRole("button", { name: "joined<2024 -status:suspended", exact: true }).click();
        await w.locator("input[type=search]").fill("joined<2024 -status:suspended rol:viewer");
        await w.getByRole("checkbox", { name: /^Select (?!all)/ }).first().check();
      },
    },
  ],
  "/components/newsletter-signup": [
    {
      label: "typo suggestion",
      run: async (p) => {
        const w = p.locator('[id$="-panel-preview"]').first();
        await w.getByRole("textbox", { name: "Email address" }).fill("jane@gmial.com");
        await w.getByRole("button", { name: /Subscribe/ }).click();
      },
    },
    {
      label: "success with inbox link",
      run: async (p) => {
        const w = p.locator('[id$="-panel-preview"]').first();
        await w.getByRole("button", { name: "Yes, fix it" }).click();
        await w.getByRole("button", { name: /Subscribe/ }).click();
        await w.getByRole("link", { name: /Open Gmail/ }).waitFor();
      },
    },
  ],
  "/components/tree-view": [
    { label: "changes only", run: (p) => p.getByRole("button", { name: /^Changes/ }).first().click() },
  ],
};

const runs = [];
for (const width of [375, 1280]) for (const scheme of ["light", "dark"]) runs.push({ width, scheme });

const browser = await chromium.launch({ channel: "chrome" });
const results = [];
try {
  for (const run of runs) {
    const context = await browser.newContext({
      viewport: { width: run.width, height: 900 },
      colorScheme: run.scheme,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const url of pages) {
      await page.goto(base + url, { waitUntil: "networkidle" });
      await page.addScriptTag({ content: axeSource });
      for (const state of [null, ...(STATES[url] ?? [])]) {
      if (state) {
        await state.run(page);
        await page.waitForTimeout(400);
      }
      // The site header is sticky: scrolled content under it would count as "obscured" targets.
      await page.evaluate(() => window.scrollTo(0, 0));
      // A state may reload the page, which drops axe: inject it again.
      if (!(await page.evaluate(() => typeof window.axe !== "undefined"))) await page.addScriptTag({ content: axeSource });
      const violations = await page.evaluate(async () => {
        const options = {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
          resultTypes: ["violations"],
        };
        // While a modal is open, the page behind it sits under a semi-transparent backdrop and is
        // inactive. axe blends the backdrop into background colors but not text colors, so its
        // contrast numbers there are wrong: check contrast inside the dialog only.
        const modal = document.querySelector("[aria-modal=\"true\"]");
        const found = modal
          ? [
              ...(await axe.run(document, { ...options, rules: { "color-contrast": { enabled: false } } })).violations,
              ...(await axe.run(modal, { ...options, runOnly: { type: "rule", values: ["color-contrast"] } })).violations,
            ]
          : (await axe.run(document, options)).violations;
        return found.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          tags: v.tags.filter((t) => /^wcag\d/.test(t)),
          nodes: v.nodes.map((n) => ({
            target: n.target.join(" "),
            summary: n.failureSummary?.split("\n").slice(1, 2).join(" ").trim(),
            html: n.html.slice(0, 200),
            data: n.any?.[0]?.data,
          })),
        }));
      });
      const label = state ? `${url} [${state.label}]` : url;
      results.push({ url: label, ...run, violations });
      const n = violations.reduce((s, v) => s + v.nodes.length, 0);
      console.log(`${n ? "✗" : "✓"} ${label.padEnd(58)} ${String(run.width).padStart(4)}px ${run.scheme.padEnd(5)} ${n ? `${n} issue(s): ${violations.map((v) => v.id).join(", ")}` : "clean"}`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

/* ---------- Report ---------- */

const failing = results.filter((r) => r.violations.length);
const byRule = new Map();
for (const r of failing) {
  for (const v of r.violations) {
    const key = v.id;
    const entry = byRule.get(key) ?? { ...v, where: new Set(), nodes: new Map() };
    entry.where.add(`${r.url} (${r.width}px ${r.scheme})`);
    for (const n of v.nodes) entry.nodes.set(n.target, n.summary);
    byRule.set(key, entry);
  }
}

const lines = [
  "# Accessibility report",
  "",
  `axe-core ${JSON.parse(fs.readFileSync(path.join(root, "node_modules/axe-core/package.json"), "utf8")).version}, WCAG 2.0 / 2.1 / 2.2 A and AA rules, against ${base}.`,
  `${pages.length} pages plus ${Object.values(STATES).flat().length} interactive states, each in light/dark at 375/1280px: ${results.length} runs. Generated by \`npm run a11y\`.`,
  "",
  failing.length === 0 ? "**Result: no violations.**" : `**Result: ${byRule.size} rule(s) failing in ${failing.length} run(s).**`,
  "",
  "| Page | 375 light | 375 dark | 1280 light | 1280 dark |",
  "|---|---|---|---|---|",
  ...[...new Set(results.map((r) => r.url))].map((url) => {
    const cell = (w, s) => {
      const r = results.find((x) => x.url === url && x.width === w && x.scheme === s);
      const n = r.violations.reduce((t, v) => t + v.nodes.length, 0);
      return n ? `✗ ${n}` : "✓";
    };
    return `| \`${url}\` | ${cell(375, "light")} | ${cell(375, "dark")} | ${cell(1280, "light")} | ${cell(1280, "dark")} |`;
  }),
  "",
];
for (const [id, v] of byRule) {
  lines.push(`## ${id} (${v.impact})`, "", `${v.help}. ${v.tags.join(", ")}`, "", `Seen on: ${[...v.where].join("; ")}`, "");
  for (const [target, summary] of [...v.nodes].slice(0, 8)) lines.push(`- \`${target}\`${summary ? `: ${summary}` : ""}`);
  lines.push("");
}
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/a11y-report.md"), lines.join("\n"));
// Full machine-readable results, e.g. A11Y_JSON=a11y.json npm run a11y
if (process.env.A11Y_JSON) fs.writeFileSync(process.env.A11Y_JSON, JSON.stringify(results, null, 1));
console.log(`\n${failing.length ? `${byRule.size} rule(s) failing` : "All clean"}. Report: docs/a11y-report.md`);
process.exit(failing.length ? 1 : 0);
