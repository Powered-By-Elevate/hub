# Anaplan teardown (connected planning UX: pages, boards, worksheets, reports)

Researched 2026-11-05, read only (no trial, no forms). Anaplan's help center (help.anaplan.com) renders by script and several pages returned 404 to a plain fetch, so a number of details below come from search-indexed help text and Anaplan Community posts. Community posts are practitioner-written and sometimes dated, and are labelled as such.

## 1. Product shape

**Who it's for.** Enterprise FP&A, sales, supply chain and workforce planning teams. A central "model builder" (often a certified admin or partner) builds multidimensional modules, and "page builders" publish them to end users. One Capterra reviewer notes that administrators are needed to maintain the apps ([Capterra](https://www.capterra.com/p/129412/Anaplan/reviews)). It is not a turnkey financial dashboard: every screen is built by the customer.

**Main screens.** Everything an end user touches lives in the UX, opened from **Apps** in the Application menu. Apps group pages around a business function or process and "guide users to relevant data", and each user can also make private pages under **My Pages** ([Anaplan help, UX overview](https://help.anaplan.com/7f5461b3-8f72-44a1-acb8-33ad320055ba)). There are three page types:

- **Board**: a free layout made entirely of cards that can be rearranged and resized, for high-level overview with charts, images and KPIs ([help, cards](https://help.anaplan.com/7182b769-8c81-4ce8-97b3-ed3b4e127706)).
- **Worksheet**: one large primary grid for viewing, editing and running actions (imports, exports), with a collapsible **Insights panel** on the right holding supporting cards ([help, UX overview](https://help.anaplan.com/7f5461b3-8f72-44a1-acb8-33ad320055ba), [Community tip](https://community.anaplan.com/discussions/tagged/user-experience/p9)).
- **Report** (Management Reporting): consistently styled, presentation-only pages that export as a single or multi-page report pack ([Community, Reports vs Boards vs Worksheets](https://community.anaplan.com/discussion/comment/99577), [July 2021 update](https://community.anaplan.com/discussion/comment/99650)).

The community rule of thumb that most builders follow: boards to see, worksheets to do, reports to present. Reports are for presentation only, so data entry belongs on worksheets ([Community](https://community.anaplan.com/discussion/comment/99577)).

**Navigation.** App, then page list, then page. Inside a page, **context selectors** (company, region, version, period and so on) sit in a frozen bar at the top right and drive every card on the page ([Fidenda write-up](https://www.fidenda.com/?p=174)). Builders also link text card titles to other boards and worksheets, so a landing board acts as a hub of doors into the app ([Community search summary](https://community.anaplan.com/discussion/comment/99577)).

## 2. The financial dashboard

Anaplan has no fixed financial dashboard. What finance teams build (P&L, balance sheet and other financial dashboards are named in reviews, [SaaSworthy](https://www.saasworthy.com/product/anaplan/reviews)) follows a recognisable pattern assembled from the card library:

- **Top row: KPI cards.** A KPI card shows a single value from a cell (a sales target, total profit), optionally coloured by conditional formatting and optionally with a **sparkline** over the model's time dimension. Hovering a sparkline point shows the value at that period ([Keyrus tip](https://keyrus.com/us/en/insights/anaplan-tips-and-tricks-kpi-sparklines), [Community, KPI two sparklines](https://community.anaplan.com/discussion/85954/kpi-card-two-sparklines)). Changing a context selector updates both the figure and its sparkline.
- **Middle: chart cards.** Types include area, bar and column, combination, dot, Gantt, line, map, pie and donut, scatter and bubble, and **waterfall**. Anaplan's own example is a waterfall on a board showing the positive and negative changes through an income statement ([help, chart cards](https://help.anaplan.com/ceb898ef-47b4-45d7-9d97-f617ca06e372)). There is no bullet chart.
- **Below: grid cards.** The P&L and balance sheet are grids of line items by time and version. Builders bold row headers to separate hierarchy levels and mark read-only rows ([Community, UX best practices](https://community.anaplan.com/discussion/160857/ux-best-practices-for-building-impactful-dashboards-in-anaplan-part-1)).
- **Report pages for the statements pack.** Table cards (report pages only) show up to 300 rows by 50 columns, and anything larger is meant to link out to a board or worksheet ([search summary of help](https://community.anaplan.com/discussion/147576/formatting-and-variance-analysis-from-management-reporting-on-ux)).
- **Cash flow** is whatever the model builds, usually a grid plus a waterfall from opening to closing cash.

## 3. Interaction

- **Time period.** Time is a native dimension of every module, so period appears either as grid columns (months rolling to quarters and years) or as a context selector. Sparklines read the time dimension directly.
- **Comparisons.** Versions (Actual, Budget, Forecast) are a native dimension. Management Reporting adds **face-of-report variance**: an absolute or percentage variance column computed on the report itself without changing the model ([AM365 and Variance Reporting note](https://help.anaplan.com/cf46a48d-05d0-40a3-a1c6-e8bbe1c0cfb2)). Users report a cap of 10 variance columns per table, short of the 12 a monthly view needs ([Community](https://community.anaplan.com/discussion/147576/formatting-and-variance-analysis-from-management-reporting-on-ux)). A KPI card cannot natively show budget against actual in one card ([Community idea](https://community.anaplan.com/discussion/85954/kpi-card-two-sparklines)).
- **Drill-down.** Works on module, board and worksheet grids, one level or several. Results open in a popup, and an arrow beside a result offers **Open source module**. Right-click "Show All Rows" or "Show All Columns" widens the context ([help, drill down](https://help.anaplan.com/f8df4a63-f4f0-474d-908e-4bb5483b5199)). "Drill to transaction" is a separate path for summary modules ([Community KB](https://community.anaplan.com/kb/articles/81538-drill-down-and-drill-to-transaction)). Weaknesses: drilling dead-ends at TIMESUM formulas, showing only the source module ([Community](https://community.anaplan.com/discussion/157688/black-box-timesum-drilldown)), and results cannot be filtered to non-zero rows, so users scroll to find the account with data ([Community](https://community.anaplan.com/discussion/133226/filter-on-drilldown-to-only-see-items-with-data-0)).
- **Linked cards.** Clicking a data series on a chart card updates the other synced cards on the page ([help, cards](https://help.anaplan.com/7182b769-8c81-4ce8-97b3-ed3b4e127706)). This is the closest thing to cross-filtering.
- **Entity and segment switching.** Context selectors at page level (synced to every card) or card level. A selector at "All" shows the rolled-up total.
- **Commentary.** Comments attach to any card and are **tied to the selected context**, with @mentions to pull a person in. Users have asked for one view of all comments across a page, and one that aggregates children's comments when the selector is at "All" ([Community, UX comment summary](https://community.anaplan.com/discussion/comment/146291)). On reports, narrative is either a text card or a text-format line item someone types into ([Community](https://community.anaplan.com/discussion/147576/formatting-and-variance-analysis-from-management-reporting-on-ux)). **CoPlanner** (generative AI, launched November 2024) answers questions grounded in the live model, and its product page shows a chat panel breaking revenue variance into volume, price and mix beside a pacing chart and a regional map ([Anaplan CoPlanner](https://www.anaplan.com/platform/anaplan-coplanner/), [launch news](https://www.anaplan.com/news/anaplan-coplanner-brings-context-aware-generative-ai-capabilties/)).
- **Exports.** Report pages export to PDF as a multi-page pack. There is no native PowerPoint export: users screenshot the report or PDF and paste it in, and the Microsoft 365 PowerPoint add-in is described as very limited ([Community idea](https://community.anaplan.com/discussion/119066/management-reporting-export-to-powerpoint)). Grids export to Excel.

## 4. Visual language

From help and community sources (no official design spec is public):

- **Card-based, white on light grey.** Published cards toggle only between a transparent and a default white background ([Community](https://community.anaplan.com/discussion/comment/158789)). Restrained, enterprise-neutral.
- **Colour.** Page builders pick body text colours from a set or enter a hex. The saved palette applies to chart series only, not to formatting across the UX, and users keep asking for brand palettes ([Community](https://community.anaplan.com/discussion/comment/163330)). Theme settings add header and line-item colours.
- **Status and variance.** Conditional formatting on a KPI card is a value scale with optional midpoints (for example red, amber, green across a range), set from the card panel or inherited from a view's formatting ([search summary of help](https://help.anaplan.com/1eb5ff31-65ec-4f0a-86b7-20f68d9682da)). It cannot yet be applied to a variance version, so builders add a helper line item ([Community](https://community.anaplan.com/discussion/comment/72040/)).
- **Editability cue.** Practitioners shade editable cells pale yellow or soft blue and mark read-only rows ([Community, UX best practices](https://community.anaplan.com/discussion/160857/ux-best-practices-for-building-impactful-dashboards-in-anaplan-part-1)).
- **Density.** Worksheets are dense spreadsheet grids. Boards are sparser: reviewers say the new UX grid system fits considerably less data per page than the classic dashboards ([G2 reviews](https://www.g2.com/products/anaplan/reviews)). One user asked for larger table fonts for readability.
- **Motion, empty and loading states.** Nothing documented. Reviews point at performance instead: slow performance is a top G2 theme (26 reviews) and models slow if not optimized ([Gartner Peer Insights](https://www.gartner.com/reviews/market/financial-planning-software/vendor/anaplan)).

## 5. What makes it premium and useful

- **One model, many views.** Every card reads the same live model, so a change on a worksheet appears instantly on the board and the report. Nothing is a copy.
- **Context travels.** One selector change re-scopes every card, sparkline and comment on the page.
- **Comments live on the number in its context.** A note on "Q3 gross margin, Southeast" stays on that slice and does not leak onto other regions.
- **Purpose-built page types.** The board, worksheet, report split forces every page to declare whether it is for seeing, doing or presenting.
- **Variance on the face of the report** without asking an admin to change the model.
- **Grounded AI.** CoPlanner answers in the model's own numbers and draws a chart beside the answer.

## 6. Complaints and weaknesses

- Steep learning curve (33 G2 reviews) and an "IT-style" interface that one team could not roll out widely because of its complexity ([G2](https://www.g2.com/products/anaplan/reviews), [Capterra](https://www.capterra.com/p/129412/Anaplan/reviews)).
- Navigation quirks slow even experienced users, and row labels do not freeze on large grids ([AWS Marketplace reviews](https://aws.amazon.com/marketplace/reviews/reviews-list/B09HN4BQLG?page=40)).
- New UX boards hold less data than the old dashboards ([G2](https://www.g2.com/products/anaplan/reviews)).
- Limited reporting (26 G2 reviews) and weak ad hoc analysis compared with BI tools ([airframe analysis](https://www.airframe.ai/product/anaplan-com/analysis)).
- No budget against actual on one KPI card, a 10-column variance cap, no PowerPoint export, no brand palette for formatting.
- Drill-down dead-ends and no non-zero filter on drill results.
- Everything is built by hand per customer, so quality depends entirely on the page builder.

## 7. Steal list (for Hub's financial tab)

1. **One context bar drives every card**: a pinned company, period and comparison selector top right that re-scopes every figure, chart, sparkline and comment on the page, and shows the rolled-up total when set to "All".
2. **KPI card with an inline sparkline and hover readout**: big figure, a 12-month sparkline under it, and hovering any point shows that month's value, with the card tinted by a red, amber, green value scale with a midpoint.
3. **Comments pinned to the number in its context**: a comment on a figure is stored against company, period and line, with an @mention, and a page-level "all comments" drawer that rolls children up when viewing the group.
4. **Face-of-report variance columns**: on any statement table the viewer adds an absolute and a percent variance column against budget or prior year without touching the data, with no column cap.
5. **Drill popup with "open source" and non-zero filter**: clicking a P&L figure opens a popover of its children (accounts, then jobs or stores), zero rows hidden by default, and a link to the underlying ledger lines.
6. **Income statement waterfall as a first-class card**: revenue down through cost and overhead to net income, positive and negative steps coloured, with the end bar correctly fixed as a total.
7. **Linked cards**: clicking a bar (a month, a store) filters every other card on the tab to it, with a visible chip to clear.
8. **See, do, present modes**: the financial tab's view, its editable budget grid and its exportable owner report are declared modes with different density, and the report mode exports a multi-page PDF and a native PPTX pack.

## 8. Avoid list

1. **A blank canvas the customer must build.** Anaplan's quality is only as good as each page builder. Hub should ship the financial tab finished and opinionated.
2. **Spreadsheet-grade density and IT styling on the overview.** Keep the dense grid behind a drill, not on the first screen.
3. **Branding limited to chart series.** Hub's client brand must reach headers, status, tables and charts as one system.
4. **Export by screenshot.** Never make a user paste a picture of a report into a deck.
