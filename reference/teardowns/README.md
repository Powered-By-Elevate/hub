# Financial software teardowns (2026-11-05)

Matt: *"let's reverse engineer every one that you listed ... one agent per platform"*, then *"create a
mockup of mashing them all together into a sleek, condensed but powerful financial tab"*.

There are 23 teardowns, one per platform, each built from public pages, help centers and reviews only (no accounts or
trials). The mockup that merges them is `../mockups/financial-tab/index.html`. Its "Show where each
idea came from" switch labels every element with the platforms it borrows from.

## What most of them agree on

| Pattern | Where it shows up |
| --- | --- |
| Every figure opens a side drawer: how it is built, what moved it, the ledger rows, and a total that ties back to the figure | Stripe, Ramp, Mercury, Pigment, Mosaic, Procore, LiveFlow, Datarails, Planful, Vena, Workday, Anaplan, Foundation, Sage, Fathom |
| One context bar (company, period, comparison) drives every card, chart and table on the page | Anaplan, Pigment, Vena, Restaurant365, Toast, Copilot, Reach, Fathom, Jirav |
| Say how fresh the data is, and draw closed months differently from open ones | Stripe, Jirav, LiveFlow, Vena, Cube, Reach, Restaurant365, Sage |
| Colour a variance by whether it helps, not by its sign, and only past a threshold | Runway, Jirav, Datarails, Planful, Restaurant365, Reach, Vena, Workday |
| Show the math on hover or click | Pigment, Fathom, Procore, Foundation, Runway, Workday, Restaurant365 |
| A short "what changed" strip, each item tied to its rows | Mercury, Ramp, Shopify, Planful, Datarails, Copilot |
| Commentary with live figures, marked draft or approved | Fathom, Runway, Cube, Jirav, Mosaic, Vena, Toast |
| A budget-to-actual bridge, with the top movers named and the rest grouped | Pigment, Cube, Datarails, Anaplan, Vena, Runway, Shopify |
| One line grammar: solid for actual, dashed for forecast, dotted for last year | Runway, Copilot, Reach, Mosaic, Shopify |
| A job or store row ending in a verdict, with cost as spent, committed and left | Procore, Sage, Foundation, Ramp, Toast |
| A cash roll-forward from opening to closing balance | Fathom, Stripe, Mosaic |
| A monthly pack that exports to PDF, Excel and PowerPoint and keeps the page's filters | Jirav, Cube, Datarails, Anaplan, Workday |

## What most of them warn against

- A blank dashboard builder the client has to fill (Stripe, Anaplan, Planful, Vena, Runway, Reach, Datarails).
- Green for "higher" even when the line is a cost (Restaurant365, Reach, Vena).
- AI text whose numbers do not tie to the page (Datarails, Planful).
- Splitting one answer across several dashboards (Restaurant365, Stripe).

## Notes on sources

Many review sites (G2, Capterra, TrustRadius) and several help centers refused direct reads, so
several teardowns rely on search excerpts and say so. Mosaic now belongs to HiBob (not Bill), and
Runway Financial rebranded to cfo.ai on 2026-09-10.
