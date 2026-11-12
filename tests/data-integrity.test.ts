import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { agentLogPlans, agentLogs } from "@/lib/agent-logs";
import { PROMPTS } from "@/lib/prompts.generated";
import { registry } from "@/lib/registry";
import { DEFAULT_BANGLA_DICTIONARY, suggestBangla, transliterate } from "@/components/ui/bangla-phonetic-input/transliterate";

/*
  Data checks for the gallery's own data: the prompt library, the registry, the agent logs and the
  Bangla dictionary. They run with npm test, so bad data fails the build instead of reaching the site.
*/

const TYPES = ["button", "form", "card", "modal", "navbar", "table", "loader", "section", "chart", "input"];
const dupes = (values: string[]) => values.filter((v, i) => values.indexOf(v) !== i);

describe("prompt library", () => {
  it("has unique numbers, slugs and names", () => {
    expect(dupes(PROMPTS.map((p) => String(p.n)))).toEqual([]);
    expect(dupes(PROMPTS.map((p) => p.slug))).toEqual([]);
    expect(dupes(PROMPTS.map((p) => p.name.toLowerCase()))).toEqual([]);
  });

  it("only uses the challenge's Type labels", () => {
    expect(PROMPTS.filter((p) => !TYPES.includes(p.type)).map((p) => `${p.n} ${p.type}`)).toEqual([]);
  });

  it("plans exactly 2 components for each of the 15 weeks", () => {
    for (let w = 1; w <= 15; w++) expect(PROMPTS.filter((p) => p.week === w).map((p) => p.slug), `week ${w}`).toHaveLength(2);
    expect(PROMPTS.filter((p) => p.week !== null && (p.week < 1 || p.week > 15))).toEqual([]);
  });

  it("has no empty fields, stray spaces or invisible characters", () => {
    const problems: string[] = [];
    for (const p of PROMPTS) {
      for (const [key, value] of Object.entries({ name: p.name, slug: p.slug, sum: p.sum, prompt: p.prompt })) {
        if (!value.trim()) problems.push(`#${p.n} ${key} is empty`);
        if (value !== value.trim()) problems.push(`#${p.n} ${key} has leading/trailing spaces`);
        if (/ {2,}\S/.test(value.replace(/^ +/gm, ""))) problems.push(`#${p.n} ${key} has double spaces`);
        if (/[ ​﻿]/.test(value)) problems.push(`#${p.n} ${key} has invisible characters`);
      }
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) problems.push(`#${p.n} slug "${p.slug}" isn't kebab-case`);
      if (!p.prompt.includes(`/components/${p.slug}`)) problems.push(`#${p.n} prompt doesn't name its route`);
    }
    expect(problems).toEqual([]);
  });
});

describe("registry", () => {
  it("matches the prompt library and points at real files", () => {
    const problems: string[] = [];
    for (const r of registry) {
      const p = PROMPTS.find((x) => x.slug === r.slug);
      if (!p) {
        problems.push(`${r.slug} has no prompt`);
        continue;
      }
      if (p.n !== r.number) problems.push(`${r.slug}: number ${r.number} vs prompt #${p.n}`);
      if (p.type !== r.type) problems.push(`${r.slug}: type ${r.type} vs prompt ${p.type}`);
      if (p.week !== r.week) problems.push(`${r.slug}: week ${r.week} vs prompt week ${p.week}`);
      if (!fs.existsSync(path.join(process.cwd(), "components/ui", r.codePath))) problems.push(`${r.slug}: ${r.codePath} missing`);
      if (!fs.existsSync(path.join(process.cwd(), "app/components", r.slug, "page.tsx"))) problems.push(`${r.slug}: page missing`);
    }
    expect(problems).toEqual([]);
  });

  it("releases weeks in order, two components each", () => {
    const weeks = [...new Set(registry.map((r) => r.week))].sort((a, b) => a - b);
    weeks.forEach((w, i) => expect(w).toBe(i + 1));
    for (const w of weeks) expect(registry.filter((r) => r.week === w)).toHaveLength(2);
  });
});

describe("agent logs", () => {
  it("logs each week once", () => {
    expect(dupes(agentLogs.map((l) => String(l.week)))).toEqual([]);
  });

  it("plans a different kind of task every week", () => {
    expect(dupes(agentLogPlans.map((p) => p.kind.toLowerCase()))).toEqual([]);
    expect(dupes(agentLogPlans.map((p) => String(p.week)))).toEqual([]);
  });
});

describe("Bangla dictionary", () => {
  const entries = Object.entries(DEFAULT_BANGLA_DICTIONARY);

  it("keys are lowercase phonetic English", () => {
    expect(entries.filter(([k]) => !/^[a-z]+$/.test(k)).map(([k]) => k)).toEqual([]);
  });

  it("values are trimmed, NFC-normalised Bangla", () => {
    const bad = entries.flatMap(([k, v]) =>
      (Array.isArray(v) ? v : [v]).filter((w) => w !== w.trim() || w !== w.normalize("NFC") || !/^[ঀ-৿ ]+$/.test(w)).map((w) => `${k}: ${w}`),
    );
    expect(bad).toEqual([]);
  });

  it("has no entry the rules already produce on their own", () => {
    // Such an entry only costs bytes: suggestBangla would return the same word first anyway.
    const redundant = entries.filter(([k, v]) => (Array.isArray(v) ? v.length === 1 && v[0] : v) === transliterate(k)).map(([k]) => k);
    expect(redundant).toEqual([]);
  });

  it("still gives every word from the old 236-entry dictionary the same first suggestion", () => {
    // Snapshot taken before the clean-up, so removing entries can never change what people get.
    const words: Record<string, string> = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/bangla-words.json"), "utf8"));
    const changed = Object.entries(words)
      .filter(([roman, bangla]) => suggestBangla(roman)[0] !== bangla)
      .map(([roman, bangla]) => `${roman}: ${suggestBangla(roman)[0]} (was ${bangla})`);
    expect(Object.keys(words)).toHaveLength(236);
    expect(changed).toEqual([]);
  });
});
