// Visits the homepage and every released component page, light and dark, at 375px and 1280px,
// and lists console errors and warnings, uncaught page errors and failed requests.
//
//   npm run dev   (React warnings only show in development)
//   node scripts/console-scan.mjs        BASE_URL=https://lofistack-sayan.netlify.app node scripts/console-scan.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const site = fs.readFileSync(path.join(root, "lib/site.ts"), "utf8");
const released = Number(site.match(/releasedThroughWeek:\s*(\d+)/)?.[1] ?? 0);
const registry = fs.readFileSync(path.join(root, "lib/registry.ts"), "utf8");
const slugs = [...registry.matchAll(/slug:\s*"([^"]+)"[\s\S]*?week:\s*(\d+)/g)].filter((m) => Number(m[2]) <= released).map((m) => m[1]);
const pages = ["/", ...slugs.map((s) => `/components/${s}`)];

const browser = await chromium.launch({ channel: "chrome" });
const found = new Map();
const note = (kind, url, text) => {
  const key = `${kind}: ${text.replace(/\s+/g, " ").slice(0, 400)}`;
  const entry = found.get(key) ?? new Set();
  entry.add(url);
  found.set(key, entry);
};
try {
  for (const width of [375, 1280]) {
    for (const scheme of ["light", "dark"]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
      const page = await ctx.newPage();
      let current = "";
      page.on("console", (m) => {
        if (m.type() === "error" || m.type() === "warning") note(`console.${m.type()}`, `${current} (${width} ${scheme})`, m.text());
      });
      page.on("pageerror", (e) => note("pageerror", `${current} (${width} ${scheme})`, e.message));
      page.on("requestfailed", (r) => {
        if (!/_next\/webpack-hmr|__nextjs/.test(r.url())) note("requestfailed", `${current} (${width} ${scheme})`, `${r.url()} ${r.failure()?.errorText}`);
      });
      page.on("response", (r) => {
        if (r.status() >= 400) note(`http ${r.status()}`, `${current} (${width} ${scheme})`, r.url());
      });
      for (const url of pages) {
        current = url;
        await page.goto(base + url, { waitUntil: "networkidle" });
        await page.waitForTimeout(600);
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
if (!found.size) console.log(`No console errors, warnings, page errors or failed requests on ${pages.length} pages.`);
for (const [key, urls] of found) console.log(`\n${key}\n  on ${[...urls].slice(0, 6).join(", ")}${urls.size > 6 ? ` and ${urls.size - 6} more` : ""}`);
