import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DataTable,
  matchesQuery,
  parseTableQuery,
  summarize,
  unknownFields,
  type ColumnDef,
} from "@/components/ui/data-table";
import { NewsletterSignup, inboxFor, suggestEmail } from "@/components/ui/newsletter-signup";

/* ---------- Data table: query language ---------- */

type Row = { id: string; name: string; plan: string; mrr: number; joined: string; status: string };
const ROWS: Row[] = [
  { id: "1", name: "Jane Cooper", plan: "Pro", mrr: 1250, joined: "2023-05-02", status: "Active" },
  { id: "2", name: "Marcus Lind", plan: "Free", mrr: 0, joined: "2024-08-19", status: "Churned" },
  { id: "3", name: "Priya Raman", plan: "Pro plus", mrr: 4800, joined: "2025-01-10", status: "Active" },
  { id: "4", name: "Tomás Okafor", plan: "Team", mrr: 620, joined: "2022-11-30", status: "Churned" },
];
const COLS: ColumnDef<Row>[] = [
  { id: "name", header: "Name", accessor: "name" },
  { id: "plan", header: "Plan", accessor: "plan" },
  { id: "mrr", header: "MRR", accessor: "mrr", align: "right", summary: "sum", summaryFormat: (n) => `$${n}` },
  { id: "joined", header: "Joined", accessor: "joined", searchable: false },
  { id: "status", header: "Status", accessor: "status", queryKey: "state" },
];
const run = (q: string) => ROWS.filter((r) => matchesQuery(r, parseTableQuery(q), COLS)).map((r) => r.id);

describe("parseTableQuery", () => {
  it("splits words, phrases, column filters and negations", () => {
    expect(parseTableQuery(`plan:pro mrr>=1k -state:churned "jane cooper" hello`)).toEqual([
      { kind: "field", field: "plan", op: ":", value: "pro", negate: false, raw: "plan:pro" },
      { kind: "field", field: "mrr", op: ">=", value: "1k", negate: false, raw: "mrr>=1k" },
      { kind: "field", field: "state", op: ":", value: "churned", negate: true, raw: "-state:churned" },
      { kind: "text", value: "jane cooper", negate: false, raw: `"jane cooper"` },
      { kind: "text", value: "hello", negate: false, raw: "hello" },
    ]);
  });
  it("keeps quoted filter values together", () => {
    expect(parseTableQuery(`plan:"pro plus"`)[0]).toMatchObject({ field: "plan", value: "pro plus" });
  });
});

describe("matchesQuery", () => {
  it("filters by text in a column, numbers and dates", () => {
    expect(run("plan:pro")).toEqual(["1", "3"]);
    expect(run(`plan:"pro plus"`)).toEqual(["3"]);
    expect(run("mrr>1000")).toEqual(["1", "3"]);
    expect(run("mrr>=1.25k")).toEqual(["1", "3"]);
    expect(run("mrr<=$620")).toEqual(["2", "4"]);
    expect(run("joined<2024")).toEqual(["1", "4"]);
    expect(run("joined>=2024-08")).toEqual(["2", "3"]);
  });
  it("negates, combines, uses queryKey and the header, and ANDs words", () => {
    expect(run("-state:churned")).toEqual(["1", "3"]);
    expect(run("status:active plan:pro")).toEqual(["1", "3"]);
    expect(run("plan:pro -mrr>2000")).toEqual(["1"]);
    expect(run("jane cooper")).toEqual(["1"]);
    expect(run("cooper raman")).toEqual([]);
  });
  it("ignores unknown columns and reports them with a suggestion", () => {
    expect(run("plna:pro")).toEqual(["1", "2", "3", "4"]);
    const u = unknownFields(parseTableQuery("plna:pro foo:bar"), COLS);
    expect(u.map((x) => [x.term.field, x.suggestion])).toEqual([
      ["plna", "plan"],
      ["foo", null],
    ]);
  });
});

describe("summarize", () => {
  it("sums, averages and finds extremes", () => {
    expect(summarize([1, 2, 3], "sum")).toBe(6);
    expect(summarize([1, 2, 3], "avg")).toBe(2);
    expect(summarize([4, 9], "max")).toBe(9);
    expect(summarize([], "sum")).toBeNull();
    expect(summarize([], "count")).toBe(0);
  });
});

describe("<DataTable /> filters and summary", () => {
  const setup = () =>
    render(<DataTable caption="Customers" data={ROWS} columns={COLS} getRowId={(r) => r.id} selectable />);

  it("shows filters as chips that can be removed, and totals the matches", () => {
    setup();
    const box = screen.getByRole("searchbox");
    fireEvent.change(box, { target: { value: "plan:pro mrr>1000" } });
    expect(screen.getByRole("button", { name: "Remove filter Plan: pro" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove filter MRR > 1000" })).toBeTruthy();
    const foot = screen.getAllByRole("rowgroup").at(-1)!;
    expect(foot.textContent).toContain("Total (2 rows)");
    expect(foot.textContent).toContain("$6050");
    fireEvent.click(screen.getByRole("button", { name: "Remove filter MRR > 1000" }));
    expect((box as HTMLInputElement).value).toBe("plan:pro");
  });

  it("offers a fix for a misspelled column", () => {
    setup();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "plna:free" } });
    expect(screen.getByText("No column called “plna”. Did you mean “plan”?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use plan" }));
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("plan:free");
  });

  it("summarises the selection while there is one", () => {
    setup();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Jane Cooper" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Tomás Okafor" }));
    const foot = screen.getAllByRole("rowgroup").at(-1)!;
    expect(within(foot).getByText("Selected (2)")).toBeTruthy();
    expect(foot.textContent).toContain("$1870");
  });
});

/* ---------- Newsletter: typos and inbox links ---------- */

describe("suggestEmail", () => {
  it.each([
    ["jane@gmial.com", "jane@gmail.com"],
    ["jane@gmail.co", "jane@gmail.com"],
    ["jane@gmailcom", "jane@gmail.com"],
    ["jane@hotmial.com", "jane@hotmail.com"],
    ["jane@yaho.com", "jane@yahoo.com"],
    ["jane@outlok.com", "jane@outlook.com"],
    ["jane@company.con", "jane@company.com"],
    ["jane@uni.ac.bb", null],
    ["jane@site.ca", null],
    ["jane@lab.cm", null],
    ["jane@shop.ner", "jane@shop.net"],
  ])("%s → %s", (input, expected) => {
    expect(suggestEmail(input)).toBe(expected);
  });
  it("leaves correct and unrelated domains alone", () => {
    expect(suggestEmail("jane@gmail.com")).toBeNull();
    expect(suggestEmail("jane@lofistack.dev")).toBeNull();
    expect(suggestEmail("jane@me.com")).toBeNull();
    expect(suggestEmail("not-an-email")).toBeNull();
  });
});

describe("inboxFor", () => {
  it("knows the big webmail providers", () => {
    expect(inboxFor("a@gmail.com", "news@site.dev")?.url).toBe(
      "https://mail.google.com/mail/u/0/#search/from%3Anews%40site.dev%20in%3Aanywhere",
    );
    expect(inboxFor("a@hotmail.co.uk")?.name).toBe("Outlook");
    expect(inboxFor("a@yahoo.com")?.name).toBe("Yahoo Mail");
    expect(inboxFor("a@icloud.com")?.name).toBe("iCloud Mail");
    expect(inboxFor("a@proton.me")?.name).toBe("Proton Mail");
    expect(inboxFor("a@company.com")).toBeNull();
  });
});

describe("<NewsletterSignup /> typo check and inbox link", () => {
  it("asks about a likely typo before sending, and sends the fixed address", async () => {
    const onSubscribe = vi.fn(() => Promise.resolve());
    render(<NewsletterSignup onSubscribe={onSubscribe} senderEmail="news@site.dev" />);
    const field = screen.getByRole("textbox", { name: "Email address" });
    fireEvent.change(field, { target: { value: "jane@gmial.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Subscribe/ }));
    expect(onSubscribe).not.toHaveBeenCalled();
    expect(screen.getByText(/Did you mean/).textContent).toContain("jane@gmail.com");
    fireEvent.click(screen.getByRole("button", { name: "Yes, fix it" }));
    expect((field as HTMLInputElement).value).toBe("jane@gmail.com");
    fireEvent.click(screen.getByRole("button", { name: /Subscribe/ }));
    expect(onSubscribe).toHaveBeenCalledWith("jane@gmail.com");
    const link = await screen.findByRole("link", { name: /Open Gmail/ });
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("sends the typed address after “No, keep mine”", () => {
    const onSubscribe = vi.fn(() => Promise.resolve());
    render(<NewsletterSignup onSubscribe={onSubscribe} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: "jane@outlok.com" } });
    fireEvent.blur(screen.getByRole("textbox", { name: "Email address" }));
    fireEvent.click(screen.getByRole("button", { name: "No, keep mine" }));
    expect(screen.queryByText(/Did you mean/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Subscribe/ }));
    expect(onSubscribe).toHaveBeenCalledWith("jane@outlok.com");
  });
});
