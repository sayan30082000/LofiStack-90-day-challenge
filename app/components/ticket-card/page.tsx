import type { Metadata } from "next";
import { ComponentPage } from "@/components/gallery/ComponentPage";
import { BoardingPassDemo, ConcertDemo, UsedDemo } from "./demos";

export const metadata: Metadata = {
  title: "Tear-off Ticket Card",
  description:
    "A ticket whose stub tears off along a perforated edge when you drag it, with a real scannable Code 39 barcode and an Add to calendar (.ics) button.",
};

const concertCode = `
<TicketCard
  label="Concert ticket, Lofi Nights Live"
  onTear={() => checkIn(ticket.id)}      // drag the stub away, or the scissors button
  main={<EventDetails />}
  stub={<TicketBarcode value="LN-F17" />} // real Code 39, scannable
  tornContent={<p>Checked in</p>}
/>

<AddToCalendar event={{
  title: "Lofi Nights Live",
  start: new Date("2026-11-21T19:30:00+06:00"),
  end: new Date("2026-11-21T22:30:00+06:00"),
  location: "Open Air Stage, Hatirjheel, Dhaka",
}} />`;

const passCode = `
<TicketCard
  label="Boarding pass, Dhaka to Cox's Bazar"
  orientation="vertical"                  // stub at the bottom, drag down
  main={<Route />}
  stub={<TicketBarcode value="LA412 12A" />}
/>`;

const usedCode = `
<TicketCard label="Cinema ticket" used usedLabel="Used" main={...} stub={...} />`;

const usage = `
import { TicketCard, TicketBarcode } from "@/components/ui/ticket-card";

export function Example() {
  return (
    <TicketCard
      label="Ticket"
      main={<h3>Lofi Nights Live</h3>}
      stub={<TicketBarcode value="A17" />}
    />
  );
}`;

export default function Page() {
  return (
    <ComponentPage
      slug="ticket-card"
      examples={[
        {
          title: "Concert ticket",
          description:
            "Grab the stub and drag it right: it peels away from the perforation, and past halfway it rips off when you let go (earlier, it snaps back). The barcode is real Code 39, and Add to calendar downloads an .ics file.",
          preview: <ConcertDemo />,
          code: concertCode,
          minHeight: 420,
        },
        {
          title: "Boarding pass",
          description: "Vertical layout with the stub at the bottom: drag it down. Narrow tickets switch to this layout on their own (orientation=\"auto\").",
          preview: <BoardingPassDemo />,
          code: passCode,
          minHeight: 480,
        },
        {
          title: "Used ticket",
          description: "A stamped ticket whose stub can't be torn.",
          preview: <UsedDemo />,
          code: usedCode,
        },
      ]}
      usage={usage}
      props={[
        { name: "label", type: "string", description: "Accessible name of the ticket. Required." },
        { name: "main / stub", type: "ReactNode", description: "The main part and the part that tears off. Required." },
        { name: "orientation", type: '"auto" | "horizontal" | "vertical"', default: '"auto"', description: "auto puts the stub on the right, or at the bottom when the ticket is narrower than 520px." },
        { name: "stubSize", type: "string", default: '"34%"', description: "Stub width when horizontal." },
        { name: "torn / defaultTorn", type: "boolean", default: "false", description: "Whether the stub is off (controlled / uncontrolled)." },
        { name: "onTear", type: "() => void", description: "Called once the stub comes off." },
        { name: "tearThreshold", type: "number", default: "0.5", description: "Share of the stub's size to drag before letting go tears it." },
        { name: "used / usedLabel", type: "boolean / string", default: 'false / "Used"', description: "Stamps the ticket and locks the stub." },
        { name: "tornContent", type: "ReactNode", description: "Shown where the stub was." },
        { name: "tearLabel / tornText", type: "string", default: '"Tear off stub" / "Stub torn off"', description: "Tear button name and the announcement." },
        { name: "notch", type: "number", default: "12", description: "Radius in px of the notches at the perforation." },
        { name: "className / paperClassName / mainClassName / stubClassName", type: "string", description: "paperClassName sets the background and text colour of both parts." },
      ]}
      types={[
        {
          name: "Helpers",
          props: [
            { name: "<TicketBarcode value height? showValue? />", type: "Code 39 SVG", description: "Real, scannable barcode for 0-9, A-Z, space, - and . with quiet zones and dark bars on white in both themes." },
            { name: "code39(value, wide?)", type: "number[]", description: "Bar and space widths, built from Code 39's structure (10 bar patterns × 4 wide-space positions)." },
            { name: "<AddToCalendar event />", type: "button", description: "Downloads the event as .ics for Google, Apple or Outlook calendars." },
            { name: "ticketToIcs(event)", type: "string", description: "The iCalendar text: UTC times, escaped commas and semicolons, CRLF line ends." },
          ],
        },
      ]}
      accessibility={[
        "Dragging is never the only way: the stub has a 40px scissors button named \"Tear off stub\" that works with Enter or Space.",
        "When the stub comes off, a polite live region says \"Stub torn off\"; a used ticket announces \"Used\" and its tear button is disabled.",
        "The ticket is an article named by label. The barcode is an image named \"Barcode LN-F17\", and its printed value is hidden from screen readers to avoid reading it twice.",
        "Notches are cut with CSS masks, so the ticket sits on any background. With reduced motion the stub comes off without the flying animation.",
      ]}
    />
  );
}
