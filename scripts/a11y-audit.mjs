// Accessibility audit: runs axe-core (WCAG 2.0/2.1/2.2 A + AA rules) on the homepage and every
// released component page, in light and dark mode, at 375px and 1280px, in your installed Chrome.
//
//   npm run build && npm start      (or npm run dev)
//   npm run a11y                    BASE_URL=https://lofistack-sayan.netlify.app npm run a11y
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
const pages = ["/", ...slugs.map((s) => `/components/${s}`)];

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
  "/components/password-strength-input": [
    { label: "passphrase suggestion", run: (p) => p.getByRole("button", { name: "Suggest a passphrase" }).first().click() },
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
      const violations = await page.evaluate(async () => {
        // eslint-disable-next-line no-undef
        const r = await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
          resultTypes: ["violations"],
        });
        return r.violations.map((v) => ({
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
