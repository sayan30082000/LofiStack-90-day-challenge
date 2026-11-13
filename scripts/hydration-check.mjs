// Loads every released page twice, as built and with the HTML comment Netlify injects into
// <head>, and fails if any page throws (React error #418 is a hydration mismatch). Hosts and
// browser extensions change served HTML; the site must hydrate anyway.
//
//   npm run build && npm start
//   npm run check:hydration          BASE_URL=https://lofistack-sayan.netlify.app npm run check:hydration
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

// The comment Netlify adds after <meta charSet> (shortened).
const NETLIFY_COMMENT = "\n<!-- This site is hosted on Netlify. -->";

const browser = await chromium.launch({ channel: "chrome" });
const failures = [];
try {
  for (const inject of [false, true]) {
    const page = await browser.newPage();
    let current = "";
    page.on("pageerror", (e) => failures.push(`${current} ${inject ? "(with injected comment)" : "(as built)"}: ${e.message.split("\n")[0].slice(0, 160)}`));
    await page.route(`${base}/**`, async (route) => {
      if (route.request().resourceType() !== "document" || !inject) return route.fallback();
      const res = await route.fetch();
      const body = (await res.text()).replace(/<meta charSet="utf-8"\/>/i, (m) => m + NETLIFY_COMMENT);
      await route.fulfill({ response: res, body });
    });
    for (const url of pages) {
      current = url;
      await page.goto(base + url, { waitUntil: "load" });
      await page.waitForTimeout(800);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.log(`Hydration check failed:\n${[...new Set(failures)].join("\n")}`);
  process.exit(1);
}
console.log(`Hydration check passed: ${pages.length} pages, as built and with Netlify's injected comment.`);
