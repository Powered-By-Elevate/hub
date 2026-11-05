# Pigment teardown

Read only research, 2026-11-05. Sources are Pigment's knowledge base (kb.pigment.com, which describes screens control by control), its marketing site, its community forum, BARC's analyst review and third-party review summaries. G2, Gartner, Capterra and TrustRadius block direct fetches (403), so their content here comes through search snippets and third-party summaries, and is labelled that way. Nothing was signed up for or submitted.

## 1. Product shape

**What it is.** A cloud planning platform (FP&A, sales, workforce, supply chain) for mid-market and enterprise teams. Its customers include Unilever, Siemens, Carta, Figma and Uber, and it is rated 4.6 on G2 and 4.7 on Gartner ([pigment.com](https://www.pigment.com/)). Pricing is quote only, across three plans ([Cube review](https://www.cubesoftware.com/blog/pigment-review)). On G2 comparison pages, reviewers are 73.6% mid-market (search snippet, [G2](https://www.g2.com/products/pigment-2021-08-10/reviews)).

**The object model, which shapes every screen.**
- **Blocks** are the model: Metrics (a number cube by dimensions), Tables (several Metrics together), Dimension lists and Transaction lists. A loader colours each block type: purple for a Metric, red for a Table, blue for a Dimension list, green for a Transaction list ([loader](https://kb.pigment.com/docs/understanding-loader-icon.md)).
- **Views** are saved pivots of a block (rows, columns, pages, filters, formatting) ([views](https://kb.pigment.com/docs/pigment-views.md)).
- **Boards** are the dashboard and app layer, made of widgets: grids, charts (bar, line, combined, pie, waterfall, map), KPI cards, text, dimensioned text, images and action buttons ([widgets](https://kb.pigment.com/docs/widgets), [charts index](https://kb.pigment.com/llms.txt)).
- **Frames** (beta since 2026-09-28) are custom JavaScript apps an AI agent writes on the live model, for visuals a Board cannot draw, such as Sankeys, bubble charts and board decks ([frames](https://kb.pigment.com/docs/frames.md)).
- **Agents**: the Analyst Agent (variance and trend reports with narrative), the Modeler Agent (builds models and boards from plain language) and the Planner Agent (scenarios, coming soon) ([pigment.com](https://www.pigment.com/)).

**Navigation.** Workspaces hold Applications, and Applications hold Blocks and Boards. Pigment's own guidance is a role-based **Landing Board** per audience, with buttons into detail Boards, and a homepage Board set per member group ([designing boards](https://kb.pigment.com/docs/designing-pigment-boards), [homepage](https://kb.pigment.com/docs/set-homepage-board-members.md)). Boards come in three types by intent: Reporting, Planning and Inputs, and Admin and Data.

## 2. The financial dashboard

Pigment publishes no fixed P&L screen. Every financial "page" is a Board a builder lays out. Its own design rules describe the intended shape ([designing boards](https://kb.pigment.com/docs/designing-pigment-boards)):

- **Top down.** Summary at the top, detail below, three to four scrolls at most, and a summary Board linking to detail Boards for wide topics.
- **Top band: KPI cards.** One KPI view can hold up to 36 cards, each a single formatted figure with a description of up to 70 characters and an optional trend line. The headline is the last value of the trend, and the trend line can be coloured by direction (the last two points decide up or down) ([KPI widgets](https://kb.pigment.com/docs/display-performance-kpi-widgets.md)). Conditional formatting set on the grid carries into the card.
- **Then charts.** Pigment's own rule of thumb: bar to compare items in a category, line for change over time. Use KPIs that match the Board's purpose.
- **Waterfall** is first-class, with two modes. **Contribution** shows how parts add to a total, with subtotals added as named "middle steps". **Variation** walks from one period or scenario to another (Budget to Actual). With "Show variation controls" on, it shows the **top three movers by absolute value and groups the rest**, and a reader can change that count on the chart without saving it. Defaults are grey totals, green rises and red falls ([waterfall](https://kb.pigment.com/docs/waterfall-charts.md)).
- **Then the statement grid.** P&L, balance sheet and cash flow are grids over Tables with a tree of accounts: "Show every subtotal" for subtotals by dimension, totals at the bottom by default with an option to pin them to the top for long lists, and advanced aggregators that compute a ratio or growth correctly at subtotal level instead of summing percentages ([totals](https://kb.pigment.com/docs/totals-aggregator-panel.md)).
- **Statement coverage.** Integrated P&L, balance sheet and cash flow models, with consolidation (FX at period-end and average rates, intercompany eliminations) ([consolidation](https://www.pigment.com/use-case/financial-consolidation)). Third parties rate consolidation as basic: CFO Shortlist scores it 35/100 against OneStream's 98 ([CFO Shortlist](https://www.cfoshortlist.com/reports/onestream-vs-pigment)), and BARC calls it suited to "basic scenarios" with only an IFRS starter kit ([BARC](https://barc.com/review/pigment/)).
- **Charts shown in marketing**: a long-range stacked bar of revenue FY25 to FY32 by line, and a revenue bridge in Opening, New, Churned, Reactivating and Forecast bars ([finance use case](https://www.pigment.com/use-case/finance)).

## 3. Interaction

**Time and context selectors.** Page selectors are drop-downs at the Board's top left, and every widget inherits them by default. Change Country to France and every linked widget follows. A builder can unlink one widget so it carries its own selector. Selectors can be single or multi-select (multi aggregates), dependent on a parent ("only relevant items", or "dynamic", which hides items with no data), with defaults that come back each time the Board reopens. **A changed selector turns blue for the session**, so a reader knows the view is not the default, and an X resets one or Reset clears all of them. A reader can also right-click any header or click a chart bar and choose "Set as Page" to pivot the whole Board to that item ([selectors](https://kb.pigment.com/docs/use-selectors-context-views-boards.md)). Selectors can be **minimized** into one drop-down that shows a count ("3 filters"), or hidden and locked to a default ([display mode](https://kb.pigment.com/docs/hide-widget-selectors-display-mode.md)).

**Comparisons.**
- A **Scenario** selector sits top left. Checking several shows them side by side, numbered in the order picked ([compare scenarios](https://kb.pigment.com/docs/compare-scenarios.md)).
- **Data slices** put Actual and Budget, or This year and Last year, side by side as defined columns, and can be bound to variables like "Current Year" so the Board rolls forward on its own ([data slices](https://kb.pigment.com/docs/compare-versions-with-data-slices.md)).
- **Show Values As** presets: Year over Year, Year to Date, Month over Month, % of grand total, % of parent, difference from previous, % growth and running totals ([show values as](https://kb.pigment.com/docs/show-values-as.md)).
- **Compare to snapshot** sets live numbers beside a frozen version (last month's forecast as it was locked) ([snapshot compare](https://kb.pigment.com/docs/use-compare-to-snapshot.md)).

**Drill down.** Two routes, both off a right-click on any number.
- **Drill down** opens a window in four parts: the cell's own value, the Metric's formula, a **formula tree** that breaks the figure into its calculation steps, and a data view of whichever node is selected. Picking a node highlights its part of the formula, and the page selectors move to every value that fed the result. Nodes that do not feed the end figure are greyed out ([drill down](https://kb.pigment.com/docs/drill-down-into-your-data.md)).
- **Drill to data source** opens the transaction list filtered to exactly the rows behind the cell, with selectors set to the cell's context (US, December) ([drill to source](https://kb.pigment.com/docs/drill-data-source.md)). It has honest limits: it stops at a depth of 10 blocks, and it warns when a complex formula may not filter exactly.

**Commentary.** Comments attach to a whole widget or to a single grid cell. A commented widget is highlighted yellow, and a commented cell carries a **blue triangle in its top-left corner**. A count at the Board's top right lists every open conversation. Threads take @mentions (an in-app notification plus an email with a link), can be made private before the first post, cannot be deleted, and are resolved with a checkbox (hidden but reopenable) ([comments](https://kb.pigment.com/docs/add-comments-on-board.md)). A comment is pinned to coordinates, not to a value, so the number it explained can change under it. AI commentary comes from the **Analyst Agent**: a user defines a "mission" (task, data scope, output format, assumptions), and the agent returns a report with insights, visuals and explanations grounded in the model, which can be published on a Board, scheduled, and inspected down to its data and logic ([analyst agent](https://pigment.com/ai/analyst-agent), [launch](https://www.pigment.com/newsroom/analyst-agent-launch)). Its prompt gallery includes "Costs BvA Analysis" and "Profit by Product Line Analysis".

**Exports.** One-click **Export as PDF** captures the whole Board, widgets off-screen included, with the current selections, and is named with the Board name and date. Chart text can be scaled 75 to 200% for the PDF ([PDF export](https://kb.pigment.com/docs/export-boards-to-pdf.md)). Grids export to CSV and Excel. Frames cannot export.

**Trust cues.** A lightbulb toggle shows cell status. A grey border means input, a grey dotted bar means calculated, and a **blue bar means a calculation someone overrode by hand**, with a legend while it is on ([cell status](https://kb.pigment.com/docs/cell-status-indicators.md)). A **blue spinner** on a widget means your own change is still computing, a grey one means another member's change is, and a small indicator at the Board's top shows background work. You can keep working while it runs ([loader](https://kb.pigment.com/docs/understanding-loader-icon.md)).

## 4. Visual language

- **Brand**: DM Sans (a geometric sans, picked for legibility at small sizes) for UI and body, Crimson Pro serif as an accent for section headers and quotes. The logo uses red, yellow and blue primaries, with an extended palette that colour-codes the four use cases and gradients for marketing ([rebrand](https://www.pigment.com/blog/pigment-rebrand-design)).
- **Inside the product, the Board is plain**: a white canvas. Community answers confirm there are no dark or custom backgrounds and no way to remove grid gridlines ([community](https://community.pigment.com/questions-conversations-40/board-customization-qustions-1246)). The premium feel comes from restraint and calm, not ornament.
- **Colour is semantic and sparse.** Green for rises and red for falls on waterfalls, grey for totals, blue for state (a changed selector, an overridden cell, your own pending calculation), yellow for "has commentary". Conditional formatting offers threshold rules, ranges, two- or three-colour scales and rules driven by another Metric. Background and text colour lock together by default so contrast holds ([conditional formatting](https://kb.pigment.com/docs/conditional-formatting-highlight-data.md)).
- **Density**: spreadsheet-dense grids, with KPI cards and charts above them. Pigment's guidance is to round consistently, name every unit and axis, give every figure a comparison value, and leave room for commentary ([designing boards](https://kb.pigment.com/docs/designing-pigment-boards)). Its design webinar names four principles: hierarchy, contrast, harmony and alignment ([webinar](https://community.pigment.com/events/ux-design-the-four-principles-of-pigment-board-design-122)).
- **Labels**: chart text has a global size (S default) with XS to XL overrides per axis and bar label, a "high-contrast labels" switch, and diagonal or wrapped x-axis labels up to five lines ([waterfall](https://kb.pigment.com/docs/waterfall-charts.md)).
- **Motion and loading**: live recalculation shown per widget by a spinner while the rest of the Board stays usable, never a whole-page block. Empty columns can be hidden. Frames update in place with no refresh.
- **Frames show where the brand wants to go**: gallery entries whose image names describe an "ambient glass" executive cockpit, a "Swiss brutalist" opex planner and "colorful blocks" hiring timelines ([frames page](https://www.pigment.com/platform/frames)). That is an admission that Boards alone do not reach presentation grade.

## 5. What makes it premium, and what makes it useful

- **Premium**: the calm white canvas, one sans-serif with a serif accent, colour used only to mean something, and agent-written narrative sitting beside the numbers ("the plan, the actuals and the AI commentary in the same room", [yespress summary](https://yespress.io/pigment)).
- **Useful, the thing users love**: every number is answerable. Right-click to see its formula as a tree, or to see the exact transactions behind it, with the context carried along. Reviewers praise flexibility, scenario comparison, real-time updates, and dashboards "second to none" (search snippets of [Software Advice](https://www.softwareadvice.ie/software/395918/pigment) and [G2](https://www.g2.com/products/pigment-2021-08-10/reviews)). BARC's users praise the front end and fast calculation ([BARC](https://barc.com/review/pigment/)).
- **Board-wide context in one gesture**: click a bar or a row header and the whole Board pivots to it ("Set as Page").

## 6. Complaints and weaknesses

- **Learning curve**: the most common con. Reviewers call it "challenging to get used to at first" and say the many options overwhelm new users ([Cube review](https://www.cubesoftware.com/blog/pigment-review), a competitor's write-up). G2 flags a complex learning curve for end users.
- **Formatting is restricted**: visual formatting on charts is "very restricted", and formatting many rows at once needs workarounds. There are no dark boards, custom backgrounds or gridline control ([community](https://community.pigment.com/questions-conversations-40/board-customization-qustions-1246)).
- **Limited dashboard and reporting options, cumbersome widget placement**: named by BARC's surveyed users, along with "not pixel-perfect publishing" and no report bursting. Advanced BI goes out to Looker or Power BI ([BARC](https://barc.com/review/pigment/)).
- **Performance**: slowdowns on large datasets and slow imports and Sheets connector. A 3-star Gartner review titled "Web-Based Performance Issues Impact Audit Functionality" (search snippet, [Gartner](https://www.gartner.com/reviews/market/financial-planning-software/vendor/pigment)). TrustRadius reviewers report occasional crashes (search snippet).
- **Cost** high for smaller companies. Software Advice scores value for money 4.0, below its feature scores (search snippet).
- **Consolidation and close are shallow** compared with OneStream (see section 2).
- **Builder-dependent**: every Board is hand-built, so quality varies with whoever built it. Pigment's own guide has to tell builders not to overload Boards and to keep selectors consistent.

## 7. Steal list

1. **Right-click any figure, "Show the math"**: open a side panel with the figure, its formula in words, and an expandable tree of the parts that made it, each node showing its own value and highlighting its term in the formula.
2. **"Show the rows" beside it**: the same click opens the ledger lines behind the figure, already filtered to that company, job and month, with a plain warning when the filter is approximate.
3. **Variance waterfall with "top N movers"**: Budget to Actual (or Last year to This year) as grey totals, green and red steps, showing the three largest movers by absolute value and grouping the rest as "All other", with a stepper on the chart to show more.
4. **One context bar that drives everything**: company, job or store, period and comparison selectors at the top left that every panel follows, any changed one tinted in the accent colour with an X to reset, and clicking a bar or row header anywhere re-scopes the whole tab to that item.
5. **Cell-level commentary marks**: a small triangle in the corner of any commented figure, a count of open notes in the header, resolve by checkbox, and AI-drafted variance notes that land as editable notes, never as final text.
6. **Trust marks on cells**: a toggle that shows which numbers are entered by hand, which are calculated, and which were overridden (a coloured bar), with a one-line legend.
7. **Per-panel recalculating spinner**: when a filter or entry changes, only the affected panels show a small spinner while the rest stay readable, plus a quiet "updating" dot in the header.
8. **KPI cards with a trend coloured by direction and a 70-character subline**: one big rounded figure, a sparkline whose colour follows the last two points, and one line of context such as "vs budget +4.2%".

## 8. Avoid list

- **The blank-canvas builder model.** Pigment makes every customer build their own P&L Board, which is where the learning curve and uneven quality come from. Hub should ship opinionated, finished statement pages and let configuration choose what shows, not lay it out.
- **Locked-down styling.** White only, fixed gridlines and restricted chart formatting are why Pigment had to bolt on Frames for anything presentation grade. Hub's brand-derived theming is already ahead, so keep it.
- **Two rendering systems.** Boards export but look plain, while Frames look premium but cannot export or read snapshots. Never let the beautiful view and the exportable view be different things: the PDF must be the page.
- **Comments pinned to coordinates, not values.** A note that silently outlives the number it explained misleads. Stamp each note with the figure it was written against and flag it when the figure moves.
