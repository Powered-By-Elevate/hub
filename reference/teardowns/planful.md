# Planful teardown (for Hub's financial tab)

Researched 2026-11-05, read only. No trial, no form, no sign-in. Planful's help center (help.planful.com, a Document360 site) renders its articles in JavaScript, so direct fetches returned only site configuration. Help-center detail below comes from search-indexed excerpts of those articles, cited by their URLs. Where a screen could not be seen, this file says so instead of guessing.

## 1. Product shape

**What it is.** Enterprise FP&A, close, consolidation and reporting for mid-market and enterprise finance teams (formerly Host Analytics). The site names four pillars: Plan, Close, Consolidate, Report, with taglines like "Roll up every entity in hours instead of the week after close" and "Move from close to board deck without the all nighter" (https://planful.com/). It claims 1,500+ customers. G2 sits at about 4.3 from roughly 490 to 500 reviews and Capterra at 4.3 from 76 (https://www.g2.com/products/planful/reviews_and_filters, https://www.capterra.com/p/72818/Host-Analytics-EPM-Platform/reviews/).

**Who uses it.** Two audiences with two experiences. The finance admin builds models, hierarchies, templates and reports. The "Budget Manager" (business user) gets a simplified experience to submit budgets and react to flagged cells (https://help.planful.com/v4/docs/signals-in-business-user-experience).

**Main surfaces.**
- **Dynamic Reports**: the core grid. Rows and columns are dimensions (account, entity, department, scenario, time), with a Point of View (POV) that pins the remaining dimensions. Admins set default POV per dimension under Maintenance > Reports > Point of View, and if none is set the report falls back to the member selector (https://help.planful.com/v4/docs/reports-admin-guide-point-of-view).
- **Report Collections**: folders of reports, with a 100K-cell limit per report (https://help.planful.com/docs/report-2).
- **Dashboards**: a canvas of draggable charts, including a "Dynamic Report chart" that embeds a saved report as a table (https://help.planful.com/docs/dynamic-report-chart).
- **Spotlight for Microsoft 365**: Excel (SpotlightXL), Word and PowerPoint add-ins. Board books are assembled in Word or PowerPoint with live, one-click-refresh data points (https://help.planful.com/docs/office-reports, https://planful.com/blog/planful-spotlight-for-microsoft-365/).
- **Planful AI**: Analyst (ask a question, get a chart plus narrative plus logic), Planner (forecasts from prompts), Signals (anomaly detection), Projections, Help (https://planful.com/ai/analyst/, https://planful.com/ai/signals/).
- **MCP Server**: read-only, inherits dimension security, Claude available now (https://planful.com/).

**Navigation.** A top navigation bar from the 2020 "Winter20" refresh, described as "simple, fast, and beautiful" and aligned to the brand (https://prnewswire.com/news-releases/planful-delivers-beautiful-user-interface-and-collaboration-upgrades-to-elevate-organizational-financial-iq-301010850.html). No public source found for a redesign since. Navigation is module-first (Planning, Reports, Dashboards, Maintenance), not question-first.

## 2. The financial dashboard

Planful does not ship one fixed "financial dashboard". It ships a dashboard builder and a recommendation of what to put on it.

- **Recommended building blocks for a financial dashboard**: single-value KPI, line, waterfall, column and stacked area (https://help.planful.com/v2/docs/dashboards-end-user-guide-2).
- **Chart catalogue named in the guide**: Line, Bar, Column, Waterfall, Stacked Column, Stacked Bar, Area, Stacked Area, Bubble, Scatter, Dual Y Axis Combination, Gauge ("pointers to display information similar to reading a dial"), KPI, and the Dynamic Report chart (same source).
- **The KPI tile**: the "2 Value KPI Chart with Variance". It shows two values (the documented example is gross margin Q4 against Q3 2017) and a variance against a compare dimension, with text. A Variance toggle in Settings > Properties turns on a Compare Dimensions prompt under the tile. A second variance ("Variance 2") can be added, and a "Consider Absolute Value for Denominator" switch fixes the sign of a variance percent when the base is negative (https://help.planful.com/v1/docs/using-absolute-value-denominator-option-for-kpi-chart). That last detail is real craft: a margin that goes from negative to less negative reads as an improvement, not a negative percent.
- **The table on the dashboard**: the Dynamic Report chart keeps the source report's formatting, formula rows and columns, and from it a viewer can drill down, drill through to source data, view Signals and comment (https://help.planful.com/docs/dynamic-report-chart).
- **P&L, balance sheet, cash flow**: presented as formatted statement reports, GAAP or IFRS, built once into packages that refresh each close, forecast or board cycle (https://planful.com/platform/reporting/). The statements live in reports and board books, not as tiles. The dashboard is where the KPIs and trends go.

What sits at the top is customer-built. The pattern the docs push is a row of two-value KPI tiles with variance, then trend and waterfall charts, then an embedded report table.

## 3. Interaction

- **Time and scenario**: chosen through the POV and page dimensions (scenario such as Actual, Budget, Forecast, and time members). Comparison is a dimension choice, not a hard-coded toggle.
- **Comparisons**: the KPI tile's Compare Dimension (prior period, budget, forecast). Pulse's AI renders answers "as variance tables or trend charts" and highlights drivers (https://planful.com/pulse/).
- **Drill down vs drill through**: two different verbs. Drill down walks the hierarchy (entity to child entity, account roll-up to leaf). Drill through leaves the report for the rows behind a number: Financial Reporting Area, Transactions, Translations, template lines and sublines, capital details. Transaction drill-through shows dates, translation drill-through shows source dimensions. It is on by default, and it is not supported on calculated members, rank, pivot or Excel formulas (https://help.planful.com/v1/docs/enhanced-drill-through-in-dynamic-reports). Marketing calls it "From summary to transaction in a click" (https://planful.com/platform/reporting/).
- **Entity and segment switching**: POV dimension selectors on reports and filter dimensions on dashboards, gated by role (https://help.planful.com/frequently-asked-questions-faqs-dashboards). Eliminations run at any parent level, so a consolidated figure at any node is real (https://planful.com/solution-hub/financial-consolidation/).
- **Anomalies (Signals)**: flagged cells are tinted by severity, and Signals' severity colours override the report's own formatting until the viewer hides them. A legend panel lists the categories with their colours and lets the viewer deselect categories to isolate one. Right-click a flagged cell, choose Predict Signals > Show Signal Context, and a screen compares the value to history and expected range. Resolving a signal turns it into a comment on the cell carrying the original value and the reason (https://help.planful.com/docs/signals-in-dynamic-reports, https://help.planful.com/v1/docs/predict-signals-in-dimension-based-dynamic-reports, https://help.planful.com/docs/how-to-use-the-legend-panel). Signals ranks anomalies by risk so the material ones come first, and users confirm, resolve or escalate in place (https://planful.com/ai/signals/).
- **Commentary**: three layers. Cell and chart comments ("Dynamic Commentary", a threaded record of how decisions were reached, https://prnewswire.com/news-releases/planful-delivers-beautiful-user-interface-and-collaboration-upgrades-to-elevate-organizational-financial-iq-301010850.html). AI narrative on Analyst answers and board reporting ("generates narratives that explain the numbers", https://planful.com/platform/reporting/). Long-form commentary written in Word around live data points (https://help.planful.com/docs/office-reports).
- **Exports and reports**: Spotlight is the export story. Lay out in Excel, insert into Word or PowerPoint, refresh every number with one click.

## 4. Visual language

Concrete evidence is thin because the product sits behind login. What can be said:
- The help center's own brand tokens (likely close to the product's): primary `#2a43ac`, accent violet `#7c4fff` light and `#b499ff` dark, Roboto for headings and body, 0.875rem base text (Document360 config read 2026-11-05 from https://help.planful.com/v2/docs/dashboards-end-user-guide-2).
- Density is spreadsheet density. The report grid is the product, and dashboards are a secondary canvas.
- Status and variance: the KPI tile carries variance as a number with text. Signals uses a small set of strong severity tints (one customer describes "three bright colors", via https://planful.com/category/reporting), explained by a legend.
- Motion, empty and loading states: no public evidence. Reviewers name slow loads on large reports (below), so loading is a lived state.
- Reviewers' read: "pretty dated" (Capterra), "more user-friendly or similar to other BI tools" wished for (G2).

## 5. What makes it feel premium, and useful

- **Trust in the number.** Drill through from a consolidated figure to the transaction, with eliminations already done, is what reviewers praise: analyzing "from a top-of-the-house view" while still reaching "the lowest level" (https://trustradius.com/products/planful/reviews). Drill-down scores about 8.5 of 10 on TrustRadius.
- **Build once, refresh forever.** Report packages and board books that re-pull every period. The Pharo Foundation CFO's example: July reports out August 5 (https://planful.com/platform/reporting/).
- **Excel where finance lives.** Spotlight keeps analysts in Excel and Word.
- **A flag carries its own answer.** A Signal opens into context, and resolving it leaves a dated comment with the reason, so the audit trail is the workflow.
- **Variance math done right.** Absolute denominators on variance percent.

## 6. Complaints and weaknesses

- **Dashboards are the weak point.** G2's summary: dashboard capabilities "could be improved for better visualization". Reviewers call them limited and want them closer to BI tools. TrustRadius scores personalized dashboards about 7 and analytics as a category below average (https://www.g2.com/products/planful/reviews_and_filters, https://trustradius.com/products/planful/reviews).
- **Steep learning curve.** "Tall learning curve" (Capterra), steep training (G2), hard account mapping into reports.
- **Speed at scale.** Large reports load slowly, cube processing and data-load quirks (G2, Capterra).
- **Spotlight formulas are long and hard to trace** (G2).
- **Dated, technical UI** in places, and no mobile app (TrustRadius).
- **Limited report customization** (G2).

## 7. Steal list

1. **Two-value KPI tile**: every headline figure shows this period and its comparison side by side, with the variance as amount and percent plus one line of text, and a picker that swaps the comparison (prior month, prior year, budget).
2. **Absolute-value denominator on every variance percent**, so a loss shrinking reads as green and positive, never a confusing negative.
3. **Two distinct verbs on every figure**: click drills down the hierarchy (company to job or store, account group to account), and a separate "Show source" opens the ledger rows behind it with date, memo and amount.
4. **Severity tints with a legend that filters**: unusual cells get one of three tints, a small legend names them, and clicking a legend chip hides the others so only that severity shows.
5. **Flag opens into context**: clicking a flagged figure opens a side panel with the last 12 months, the expected range band and a one-sentence reason, plus Resolve with a required reason.
6. **Resolved flag becomes a dated note** on that cell, keeping the original value and the reason, so commentary and audit trail are the same object.
7. **Statements as reports, KPIs as dashboard**: keep the P&L, balance sheet and cash flow as formatted statements with formula rows, and embed a statement on the overview as a live table rather than redrawing it as charts.
8. **Ask with the logic shown**: any narrative or AI answer prints the chart, the sentence and the arithmetic behind it, so a number never appears without its working.

## 8. Avoid list

1. **A blank dashboard builder as the product.** Planful hands customers a canvas of fourteen chart types and reviewers call the result limited and dated. Hub should ship opinionated, finished pages.
2. **Spreadsheet density as the default look.** The grid is right for analysts, wrong as the first screen an owner sees.
3. **Commentary living in a separate tool** (Word board books). Notes belong on the figure, in the page.
4. **Gauges.** A dial spends a lot of space to show one number badly.
