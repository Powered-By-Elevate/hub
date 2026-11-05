# Jirav teardown (for Hub's financial tab)

Researched 2026-11-05, read only (marketing site, help center, release notes, third-party reviews). No trial, no sign-up, no form. G2, Capterra, TrustRadius and The CFO Club pages returned 403 to the fetcher, so review quotes come from SoftwareFinder, search-result summaries and a Cube review (a competitor's blog, written 2022, weighted lightly). Where a source does not say something, this note says so instead of guessing.

## 1. Product shape

**What it is.** Cloud FP&A for small and mid-size businesses, sold hard to accounting firms and CFO advisory firms (fractional finance, which is exactly Elevate's seat). Driver-based planning, connected to QuickBooks, Xero, Gusto, Salesforce, Google Sheets, producing 3-way financials, dashboards and monthly report packages ([connected financial dashboard](https://www.jirav.com/product/connected-financial-dashboard), [Cube review](https://www.cubesoftware.com/blog/jirav-review)). G2 4.7 from about 191 reviews ([G2 compare](https://www.g2.com/compare/jirav-vs-anaplan)). Historical pricing about $10K a year Starter, $15K Pro ([Cube review](https://www.cubesoftware.com/blog/jirav-review)).

**Main screens.** Four top-level apps, as the help center is organised ([help center](https://help.jirav.com/learning-education/core-reports)):
- **Dashboard**: a grid of tiles, multiple dashboards per company, switched from a dropdown next to the current dashboard's name ("Manage Dashboards") ([tiles overview](https://help.jirav.com/dashboard/tiles-overview)).
- **Report**: report *packages* (renamed from "templates" in Feb 2026) made of reports (Executive Summary, Income Statement, Balance Sheet, Cash Flow, Variance, IS by Department, A/R and A/P aging, custom, text pages) ([report index](https://help.jirav.com/report), [2026 release notes](https://help.jirav.com/release-notes-2026-updated)).
- **Plan**: revenue and expense, workforce, balance sheet and cash planning, KPIs, custom tables, auto-forecast.
- **Settings** and **Integrations** (renamed from "Actuals" in April 2025) ([2025 release notes](https://help.jirav.com/release-notes-2025-updated)).

**Navigation.** App-level switch, then a package or dashboard picker, then sections inside. Since Feb 2026 the Report page reopens the last package viewed instead of the default one ([2026 release notes](https://help.jirav.com/release-notes-2026-updated)). For firms, a Partner Portal sits above client accounts and packages can be cloned from one client to another ([Insightful Accountant demo](https://insightfulaccountant.com/ia-blogs/from-the-publisher/apps-directory-spotlight-jirav/)).

## 2. The financial dashboard

**Layout.** A free grid of resizable tiles. Drag to move, drag the bottom-right corner to resize, and the rest reflow to fill gaps. "Actions" top right adds a tile, a gear opens bulk edit ([tiles overview](https://help.jirav.com/dashboard/tiles-overview)). Jirav's own framing: the main dashboard should "highlight a story" without minor details, with separate dashboards per audience (board, sales, company-wide with sensitive data removed) ([multiple dashboards](https://jirav.com/blog/multiple-dashboards)).

**Tile types.** Vertical bar, line, horizontal bar, number, table, stacked vertical bar, donut, plus three special tiles: Income Statement, Balance Sheet and Text (with hyperlinks) ([dashboards index](https://help.jirav.com/dashboards)).

**What sits at the top.** Not fixed by the product. The demo carousel shows "Full Dashboard" and "Salary Run Rate" ([Insightful Accountant](https://insightfulaccountant.com/ia-blogs/from-the-publisher/apps-directory-spotlight-jirav/)). Number tiles are positioned for Cash on Hand, Headcount and Run Rates ([number tile](https://help.jirav.com/dashboard/number-tile)). Marketing names cash runway as the hero KPI ([connected financial dashboard](https://www.jirav.com/product/connected-financial-dashboard)).

**P&L.** The Income Statement tile is a *chart, not a table*: bars for Revenue, COGS, Gross Margin, OpEx, Operating Income, Other Income and Expense, Net Income, with **Cash as an overlay line** across it ([income statement tile](https://help.jirav.com/income-statement-tile)). The full statement lives in Reports, with % of Revenue columns (Oct 2025), GL account codes (Jul 2025) and double underlines on Net Income and Ending Cash (May 2025) ([2025 release notes](https://help.jirav.com/release-notes-2025-updated)).

**Balance sheet.** Its own tile and a full report, with an "out of balance" warning when the plan does not tie ([report index](https://help.jirav.com/report)).

**Cash.** Treated as a first-class thread: the cash overlay on the P&L chart, a "Present Cash Burn on a Report" pattern, and the Executive Summary opening on a Cash section (Cash on Hand, Change in Cash) ([executive summary](https://help.jirav.com/reporting/create-an-executive-summary)).

**Executive Summary (the real front page).** Defaults to a summary graph, then cash metrics, an Income Statement summary and headcount by department, by quarter with a total. The chart can be hidden from a menu next to the title ([executive summary](https://help.jirav.com/reporting/create-an-executive-summary)).

## 3. Interaction

**Time.** Every tile carries three time settings: *Range*, *Show Dates* (Monthly, Quarterly, Yearly, Total) and *Show Actuals Until* (Close Month or Max) ([tiles overview](https://help.jirav.com/dashboard/tiles-overview)). Ranges are built from an anchor (Current Month, **Close Month**, Fiscal Year Start), a width and a shift, for example "This Month Last Year" is Current Month, 1 month, minus 12 ([ranges](https://help.jirav.com/ranges)).

**Close Month is the key idea.** The company's close month (from the ledger or set by hand) caps actuals on every tile set to it, so a half-booked month never reaches a budget vs actual view, and tiles roll forward on their own when the next month closes ([close month on tiles](https://help.jirav.com/dashboard/close-month-on-tiles)). The help center does *not* describe any visual distinction between actuals and forecast on a tile.

**Comparisons.** Each tile and report has a Primary Source and Comparison Source(s) (actuals, budget, rolling forecast, scenarios). Reports compute Variance # with six pairings across three sources and Variance % with four formulas ([variance analysis](https://help.jirav.com/reports)). One-click swap of sources on a tile (Oct 2025) ([2025 release notes](https://help.jirav.com/release-notes-2025-updated)). Older reviews say only one comparison at a time ([Cube review](https://www.cubesoftware.com/blog/jirav-review)), which multi-column groups (Jan 2025) partly answer.

**Materiality.** Variance colour applies only where the variance clears a threshold set in Settings > Variance Rules, per data element (all of Revenue, not each line) ([variance analysis](https://help.jirav.com/reports)).

**Drill-down.** Thin. The only drill documented is Feb 2026: a parent department shows which child department each salary and manual-input line comes from, editable in place ([2026 release notes](https://help.jirav.com/release-notes-2026-updated)). No tile-to-transaction drill appears in any help article read.

**Entity and segment.** Dimensions (departments, classes) are tile selection modes, with "select All then deselect" (Nov 2025). IS by Department report with child departments (Dec 2025) ([2025 release notes](https://help.jirav.com/release-notes-2025-updated)). Consolidation across files is a named reviewer request ([search summary of SoftwareFinder](https://softwarefinder.com/accounting-software/jirav/reviews)).

**Commentary.** Notes and footnotes ride on report rows ("Show Notes" column setting, footnotes printed "As Footnotes or Inline" in PDF), text pages and text tiles carry narrative, shared viewers can comment, and unread-comment badges count across the app ([executive summary](https://help.jirav.com/reporting/create-an-executive-summary), [share and export](https://help.jirav.com/share-reporting-package), [tiles overview](https://help.jirav.com/dashboard/tiles-overview)). "Smart Labels" (Sep 2025) let text fields carry variable dates that follow the close month ([2025 release notes](https://help.jirav.com/release-notes-2025-updated)).

**Exports and reports.** Tile: PNG, PDF, SVG, CSV, or full screen. Package: PDF with a preview and settings (alignment, portrait or landscape, fixed width vs fit to page, footnote placement), Excel or Google Sheets with one tab per report and formatting kept, a company logo on the cover (Jul 2025), and section selection on PDF download. Sharing is a live link by email, view only, unlimited dashboard-only users ([share and export](https://help.jirav.com/share-reporting-package), [tiles overview](https://help.jirav.com/dashboard/tiles-overview), [Aug 2021 update](https://jirav.com/blog/product-update-2021-august)).

## 4. Visual language

Sources describe settings more than pixels, so this is what can be stated:
- **Variance colour is opt-in and configurable**: favourable and unfavourable switches with a chosen colour each, default green and red, gated by materiality ([variance analysis](https://help.jirav.com/reports), [number tile](https://help.jirav.com/dashboard/number-tile)). Negative currency optionally red.
- **Named chart palettes**: Clarity, Balance, Signal (Sep 2025) ([2025 release notes](https://help.jirav.com/release-notes-2025-updated)).
- **Statement typography conventions** kept: double underline on the bottom line, progressive shading on quarter and total columns, heavier black PDF footnote fonts ([2025 release notes](https://help.jirav.com/release-notes-2025-updated)).
- **Chart hygiene work**: consistent K and M scaling off the left axis, unified overlay axis toggle, $ or % on data labels (Feb 2026), toggle for zero labels, rotated labels when crowded, legend format "SERIES | SOURCE" ([2025](https://help.jirav.com/release-notes-2025-updated) and [2026](https://help.jirav.com/release-notes-2026-updated) notes).
- **Density**: a configurable grid, so density is whatever the builder makes it. Motion, empty states and loading states are not documented. Reviewers name slow initial and report loading ([SoftwareFinder](https://softwarefinder.com/accounting-software/jirav/reviews)).

Overall read: competent, accountant-grade, settings-heavy. Not luxury.

## 5. What makes it premium, and what makes it useful

- **The close month as a single dial.** One company setting makes every tile honest and self-rolling. Users love that the monthly package "just updates".
- **The package is the product.** A firm builds one monthly package (cover with logo, executive summary, statements, variance, text pages) and clones it to every client. Reviewers: "reporting, dashboarding, and forecasting all in one place" ([SoftwareFinder](https://softwarefinder.com/accounting-software/jirav/reviews)).
- **Cash woven through the P&L**, the overlay line making profit and cash read together.
- **Materiality-gated variance colour**, which keeps a statement calm until something matters.
- **Audience dashboards** with unlimited free viewers.

## 6. Complaints and weaknesses

- Learning curve and complex setup, the top G2 con ([G2 compare](https://www.g2.com/compare/jirav-vs-anaplan), [SoftwareFinder](https://softwarefinder.com/accounting-software/jirav/reviews)).
- Slow initial load and report loading on bigger models ([SoftwareFinder](https://softwarefinder.com/accounting-software/jirav/reviews)).
- "The variety of visualizations is somewhat limited", tile limits per dashboard, no complex formulas on tiles ([SoftwareFinder](https://softwarefinder.com/accounting-software/jirav/reviews)).
- Weak alerts, wants more non-financial reporting such as staffing ([SoftwareFinder](https://softwarefinder.com/accounting-software/jirav/reviews)).
- Historically one comparison at a time, and price high for small businesses ([Cube review](https://www.cubesoftware.com/blog/jirav-review)).
- A G2 discussion is titled "Will the dashboards ever become interactive?" ([G2 discussion](https://www.g2.com/discussions/14533-will-the-dashboards-ever-become-interactive)), consistent with the absence of documented drill-down.

## 7. Steal list

1. **A company-level Close Month that every figure respects**: actuals stop at the last closed month by default, the page rolls forward on its own when the next one closes, and the header says "Actuals through September".
2. **Ranges as anchor + width + shift** (Close Month, 12 months, minus 11), so "trailing 12 to close", "YTD to close" and "same month last year" are one primitive, not a hard-coded list.
3. **Materiality-gated variance colour**: a variance is tinted favourable or unfavourable only when it clears a per-category threshold (Revenue, COGS, OpEx), everything else stays ink.
4. **Cash as an overlay line on the P&L bar chart**, so profit and cash are read in one picture.
5. **Primary vs comparison source with a one-click swap**, showing Variance $ and % beside it, with legends written "Revenue | Budget".
6. **Close-aware live labels in commentary** ("September revenue", "through Q3") that update with the period, so narrative never goes stale.
7. **Statement typography rules**: double underline on Net Income and Ending Cash, shaded quarter and total columns, a % of Revenue column on demand.
8. **A packaged monthly report** (logo cover, executive summary that opens on cash, statements, variance, text page) exportable to PDF with fit-to-page and to Excel with one tab per statement.

## 8. Avoid list

- **The blank tile grid with a builder per tile.** It is the source of the learning-curve and "limited visualizations" complaints. Hub should ship an opinionated, finished financial tab and let configuration pick, not compose.
- **Static figures with no drill.** Jirav documents no tile-to-source drill, and users ask for interactivity. Every Hub figure should open its accounts and its jobs.
- **Settings that hide the default.** Variance colours off until switched on, chart palettes picked per tile: Hub should decide the look once.
- **Heavy initial loads.** Reviewers feel it. Hub's page should paint instantly from a computed document.
