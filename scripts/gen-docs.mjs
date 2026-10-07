// Generates docs/<slug>.md for every released component, straight from the TypeScript source:
// each exported *Props / *Options interface becomes a table of name, type, default and description.
// Run with `npm run docs`. Defaults come from the destructuring in the component's signature.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

/* ---------- Registry and site config ---------- */

const site = read("lib/site.ts");
const released = Number(site.match(/releasedThroughWeek:\s*(\d+)/)?.[1] ?? 0);
const siteUrl = site.match(/url:\s*"([^"]+)"/)?.[1] ?? "";
const repoUrl = site.match(/repoUrl:\s*"([^"]+)"/)?.[1] ?? "";

function registryEntries() {
  const src = ts.createSourceFile("registry.ts", read("lib/registry.ts"), ts.ScriptTarget.Latest, true);
  const entries = [];
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const entry = {};
      for (const p of node.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const key = p.name.getText(src);
        const v = p.initializer;
        if (ts.isStringLiteralLike(v)) entry[key] = v.text;
        else if (ts.isNumericLiteral(v)) entry[key] = Number(v.text);
      }
      if (entry.slug && entry.codePath) entries.push(entry);
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
  return entries;
}

/* ---------- Props extraction ---------- */

const clean = (s) => s.replace(/\s+/g, " ").trim();
const cell = (s) => clean(s).replace(/\|/g, "\\|");

function jsDocOf(node) {
  const docs = node.jsDoc ?? [];
  return docs
    .map((d) => (typeof d.comment === "string" ? d.comment : (d.comment ?? []).map((c) => c.text ?? "").join("")))
    .join(" ");
}

/** Default values from `function X({ a = 1, b = "x" }: XProps)` and `const X = ({ … }: XProps) =>`. */
function defaultsFor(src, interfaceName) {
  const defaults = new Map();
  const visit = (node) => {
    if ((ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && node.parameters.length) {
      const param = node.parameters[0];
      const typeName = param.type?.getText(src);
      if (typeName === interfaceName && ts.isObjectBindingPattern(param.name)) {
        for (const el of param.name.elements) {
          if (el.initializer) defaults.set((el.propertyName ?? el.name).getText(src), el.initializer.getText(src));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
  return defaults;
}

function interfacesIn(file) {
  const text = fs.readFileSync(file, "utf8");
  const src = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = [];
  for (const stmt of src.statements) {
    if (!ts.isInterfaceDeclaration(stmt)) continue;
    const exported = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    const name = stmt.name.text;
    if (!exported || !/(Props|Options)$/.test(name)) continue;
    const defaults = defaultsFor(src, name);
    const rows = [];
    for (const m of stmt.members) {
      if (!ts.isPropertySignature(m) || !m.name) continue;
      const prop = m.name.getText(src);
      rows.push({
        name: prop + (m.questionToken ? "" : " *"),
        type: m.type ? m.type.getText(src) : "unknown",
        def: defaults.get(prop) ?? "",
        doc: jsDocOf(m),
      });
    }
    const extendsText = stmt.heritageClauses?.map((h) => h.getText(src)).join(" ") ?? "";
    out.push({ name, doc: jsDocOf(stmt), extendsText, rows });
  }
  return out;
}

/** Components (Capitalised) and hooks (use…) a file exports, including `export { x } from "./y"`. */
function exportsIn(file) {
  const src = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = [];
  const exported = (n) => n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  for (const stmt of src.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name && exported(stmt)) names.push(stmt.name.text);
    else if (ts.isVariableStatement(stmt) && exported(stmt)) stmt.declarationList.declarations.forEach((d) => names.push(d.name.getText(src)));
    else if (ts.isExportDeclaration(stmt) && !stmt.isTypeOnly && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
      stmt.exportClause.elements.filter((e) => !e.isTypeOnly).forEach((e) => names.push(e.name.text));
    }
  }
  return names.filter((n) => /^[A-Z]/.test(n) || /^use[A-Z]/.test(n)).filter((n) => !/^[A-Z_]+$/.test(n));
}

/* ---------- Write ---------- */

const entries = registryEntries()
  .filter((e) => e.week <= released)
  .sort((a, b) => a.week - b.week || a.name.localeCompare(b.name));

fs.mkdirSync(path.join(root, "docs"), { recursive: true });
const index = [];

for (const e of entries) {
  const main = path.join(root, "components/ui", e.codePath);
  const dir = path.dirname(main);
  const files = e.codePath.includes("/")
    ? fs.readdirSync(dir).filter((f) => /\.(tsx?|mts)$/.test(f)).map((f) => path.join(dir, f))
    : [main];
  const interfaces = files.flatMap(interfacesIn);
  const importPath = `@/components/ui/${e.codePath.replace(/(\/index)?\.tsx?$/, "")}`;
  const exported = exportsIn(main);

  const lines = [
    `# ${e.name}`,
    "",
    `> Week ${String(e.week).padStart(2, "0")} · \`${e.type}\` · #${e.number}`,
    "",
    e.description,
    "",
    `- Live demo: ${siteUrl}/components/${e.slug}`,
    `- Source: ${repoUrl}/blob/main/components/ui/${e.codePath}`,
    `- Build prompt: ${siteUrl}/components/${e.slug}#prompt`,
    "",
    "```tsx",
    `import { ${exported.join(", ")} } from "${importPath}";`,
    "```",
    "",
  ];
  for (const i of interfaces) {
    lines.push(`## ${i.name}`, "");
    if (i.doc) lines.push(clean(i.doc), "");
    if (i.extendsText) lines.push(`_${i.extendsText}_`, "");
    lines.push("| Prop | Type | Default | Description |", "|---|---|---|---|");
    for (const r of i.rows) {
      lines.push(`| \`${cell(r.name)}\` | \`${cell(r.type)}\` | ${r.def ? `\`${cell(r.def)}\`` : "—"} | ${cell(r.doc) || "—"} |`);
    }
    lines.push("");
  }
  lines.push("`*` = required. Generated by `npm run docs` from the TypeScript source; edit the JSDoc comments, not this file.", "");
  fs.writeFileSync(path.join(root, "docs", `${e.slug}.md`), lines.join("\n"));
  index.push(`| ${String(e.week).padStart(2, "0")} | [${e.name}](./${e.slug}.md) | \`${e.type}\` | ${interfaces.reduce((n, i) => n + i.rows.length, 0)} | [demo](${siteUrl}/components/${e.slug}) |`);
}

fs.writeFileSync(
  path.join(root, "docs", "README.md"),
  [
    "# Component docs",
    "",
    `Generated by \`npm run docs\` for the ${entries.length} released components (weeks 1–${released}).`,
    "",
    "| Week | Component | Type | Props documented | Live |",
    "|---|---|---|---|---|",
    ...index,
    "",
  ].join("\n"),
);
console.log(`docs: ${entries.length} components, weeks 1-${released}`);
