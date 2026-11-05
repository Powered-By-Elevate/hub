# Teardown: Workday Adaptive Planning

Read-only research, 2026-11-05. Sources are Workday's public docs (doc.workday.com), product pages, release notes and public review summaries. No trial, no sign-in, no forms. G2, Capterra, TrustRadius and Software Advice refused direct fetches (403), so review findings come from search-result excerpts of those pages and are labelled as such.

## 1. Product shape

**Who it's for.** Mid-market and enterprise FP&A teams: budgeting, forecasting, workforce planning, consolidation and management reporting. It is a planning engine first and a reporting surface second. The core object is a multidimensional model (accounts × levels (org units) × time × versions × custom dimensions), and every screen is a view onto it.

**Main screens.**
- **Sheets**: the planning grid (standard, cube, modeled sheets). Where budgets are typed in.
- **Reports**: drag-and-drop web reports (matrix and transaction reports). Workday's own comparison table says web reports have "no graphical visualizations," no element stacking and no formatting, and export to Excel and PDF ([reporting and analysis](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/get-started/get-started-for-all-adaptive-planning-users/reporting-and-analysis.html)).
- **Dashboards**: charts, scorecards and editable sheets on a grid layout, grouped into **perspectives** ([dashboards concept](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/get-started-with-dashboards/lnw1670453275200.html)).
- **OfficeConnect**: an Excel, Word and PowerPoint add-in. Board packs and management reports are really built here, refreshed with one click ([OfficeConnect datasheet](https://www.workday.com:443/content/dam/web/en-us/documents/datasheets/enus-pln-da-workday-adaptive-planning-officeconnect.pdf), [analytics and reporting](https://www.workday.com/en-au/products/adaptive-planning/analytics-reporting.html)).
- **Planning Agent (AI)**: a "Data Exploration" sidebar on matrix reports (2025R2, preview) ([release note](https://doc.workday.com/adaptive-planning/en-us/what-s-new/releases/2025r2-release-notes/planning-agent--data-exploration.html)).

**Navigation.** A hierarchy, not a single page: Perspective (a theme such as Finance or Sales, now foldered since 2025R1, [perspective folders](https://doc.workday.com/adaptive-planning/en-us/what-s-new/releases/2025r1-release-notes/perspective-folders-in-dashboards.html)) contains Dashboards, which contain Charts. The perspective owns a toolbar of global filters: **Time, Level and Currency**, plus Refresh, Snapshot and mode controls ([perspectives toolbar](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/get-started-with-dashboards/jwb1670535393567.html)).

## 2. The financial dashboard

There is no fixed "financial dashboard." Customers (or implementation partners such as Kainos) assemble one from 17 chart types ([chart types](https://doc.workday.com/adaptive-planning/nl-nl/workday-adaptive-planning-documentation/dashboards/diagrammen/kqh1623709456802.html)): Area, Bar, Column, Crosstab, Dimension mapping, Doughnut, Fan, Gauge, Geographic map, KPI, Line, Pie, Scatter, Scorecard, Sheet, Text, Waterfall.

**The typical finance build**, as Workday's own marketing describes it: "personalized KPI reports," variances "in a waterfall chart," and a move "from analysis to modeling" ([analytics and reporting](https://www.workday.com/en-au/products/adaptive-planning/analytics-reporting.html)). Their sample screenshot is a sales dashboard with revenue, sales by type, average sales and revenue per FTE trend.

**What sits at the top: the Scorecard.** This is the most finance-specific component and the one worth studying. Workday frames it as the answer to "how are we doing?" ([scorecard](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/charts/elk1623709428380.html)):
- **Rows** are accounts (revenue, net income, gross margin).
- **Sections** are generated from the company calendar: Month, Quarter, Year by default, renamable (for example Year becomes YTD).
- **Columns per section** default to: Value (Actuals), Value (selected version), Variance (Actuals vs version), and a **Micro Chart** trend. The micro chart is dropped for the smallest period, where a trend means nothing.
- Each column has a version, a **time alignment** (Current, Previous, Next, Trailing, Leading), a period count and a data range (total period or to-date). So one column can read "trailing four quarters, to date, as a line," and another "next year's forecast" ([scorecard settings](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/charts/chart-settings-and-ui-options/kyx1623709429957.html), [production scorecard example](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/charts/dashboard-examples/vjw1623709433709.html)).
- Variance direction is explicit: Reference minus Comparison (default), the reverse, or the comparison alone. Variance percent can divide by either side.
- Micro charts come as Line, Column, Area or Outline, with an Accumulate switch.
- Number display: follow account, millions with one decimal, thousands with none or one, and negatives as minus or parentheses.
- Conditional formatting is an expression rule plus a colour per series, not a fixed red/green.

**P&L, balance sheet and cash flow.** These are not native dashboard pages. They are matrix reports (web) or OfficeConnect Excel books. Web reports are grids with expand and collapse of parent accounts, selection parameters and filters ([reporting and analysis](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/get-started/get-started-for-all-adaptive-planning-users/reporting-and-analysis.html)). Since 2025R1 a report can sit on a dashboard with its own parameters, independent or linked to the dashboard's ([RKL summary of 2025R1](https://www.rklesolutions.com/blog/adaptive-2025-r1-additional-features)).

**Version comparison: the Fan chart (2024R1).** One GL account, one reference version (for example the 2024 budget) and several comparison versions or what-if scenarios (best case, worst case) drawn as a fan of outcomes around the baseline. Workday recommends one account per fan ([fan chart](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/charts/create-a-fan-chart.html), [compare versions](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/get-started-with-dashboards/compare-planning-versions-in-dashboards.html)).

**Sheets on dashboards.** An editable grid on the dashboard: type a driver and every linked chart recalculates. This is the "plan and see the effect" loop the marketing leads with ([reporting and analysis](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/get-started/get-started-for-all-adaptive-planning-users/reporting-and-analysis.html)).

## 3. Interaction

- **Time.** Two layers. The perspective toolbar sets the time context. Each chart is either **unpinned** (relative to that context: Current, Backwards n, Forwards n) or **pinned** (fixed single period or range that ignores the toolbar). A chart's own time toolbar can override, and overrides revert when you leave the page ([perspectives toolbar](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/get-started-with-dashboards/jwb1670535393567.html)). Since 2025R1 each chart prints its time period top right by default, beside or below the title ([chart improvements 2025R1](https://doc.workday.com/adaptive-planning/fr-ca/what-s-new/versions/notes-de-version-2025r1/chart-improvements-in-dashboards.html)).
- **Comparisons.** Version is a first-class dimension: Actuals, Working Budget, Forecast, what-ifs. Every series and every scorecard column names its version.
- **Entity and segment switching.** "Level" is the org tree (company, region, department) on the toolbar. Series filter by levels, level attributes, custom dimensions and dimension attributes. Currency is a toolbar switch.
- **Drill-down.** **Explore Cell** on any number in a sheet or chart shows its formula components and lets you drill to contributing versions, accounts, levels or custom dimensions, suppressing zero rows. **Drill through** leaves for transactions: the transaction module, Workday Financials or NetSuite P&L detail. Transaction drill appears only where a transaction exists for that account, level and period, and a rollup shows all children's transactions ([drill down and through](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/sheets/explore-drill-and-enhance-data-in-sheets/wjs1623709472489.html), [drill into transactions FAQ](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/modeling/modeling-faqs-and-troubleshooting/allocation-rules-and-transactions-faqs/xrg1623712199018.html)). Limit: no drill through to Workday objects from dashboard charts, web reports or OfficeConnect ([drill to Workday](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/sheets/explore-drill-and-enhance-data-in-sheets/jye1651005414360.html)). In OfficeConnect, Cell Explorer traces source data and formulas and keeps an audit trail ([Microsoft Marketplace listing](https://marketplace.microsoft.com/de-ch/product/wa200009251)).
- **Commentary and narrative.** Historically a **Text** chart for guidance notes and OfficeConnect Word and PowerPoint for written packs. The new route is the Planning Agent: right-click a Variance cell and choose **Analyze variance**. It finds the top five variances (or ones over a custom threshold), names the dimensions driving each (cost center, product), breaks them down further, and returns narrative, charts and tables that export to PowerPoint. Workday tells users to review the numbers and commentary before trusting them ([Planning Agent](https://doc.workday.com/adaptive-planning/en-us/what-s-new/releases/2025r2-release-notes/planning-agent--data-exploration.html)).
- **Anomalies.** ML predictions (needs 24 months of actuals) flag outlier cells with a border on sheets, removable with Unmark anomaly. 2026R1 brought it to sheets inside dashboards ([anomaly detection in dashboards](https://doc.workday.com/adaptive-planning/en-us/what-s-new/releases/2026r1-release-notes/anomaly-detection-for-sheets-in-dashboards.html)).
- **Exports.** Web reports to Excel and PDF. **Snapshots** are static PDFs of every dashboard in a perspective, schedulable and shareable with notifications (reports and sheets are left out of snapshots). **Presentation mode** shows one chart at a time, stepped with the left menu or arrow keys, and each chart has a Show In Presentation Mode toggle ([perspectives toolbar](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/get-started-with-dashboards/jwb1670535393567.html), [scorecard settings](https://doc.workday.com/adaptive-planning/en-us/workday-adaptive-planning-documentation/dashboards/charts/chart-settings-and-ui-options/kyx1623709429957.html)).

## 4. Visual language

Concrete sources on Adaptive's own pixels are thin, so this mixes documented settings with the Workday design system it sits inside.
- **Typography.** Workday's Canvas design system uses Roboto, with Roboto Mono for tabular figures ([Canvas type tokens](https://canvas.workday.com/styles/tokens/type)). Adaptive's grids read as dense, small-type spreadsheet UI.
- **Colour.** Canvas is built on Blueberry blue with a fruit-named base palette (Cinnamon, Peach, Chili Mango, Cantaloupe, Sour Lemon, Juicy Pear) and an 86-colour charting palette applied in numerical order ([canvas-colors-web](https://www.npmjs.com/package/@workday/canvas-colors-web)). In Adaptive dashboards, colour is mostly a per-series setting: reference and comparison versions get assigned colours on a fan, micro charts take one colour, and conditional formatting paints a colour when an expression is true.
- **Density.** High. Scorecards pack three sections of four columns per account row. Reports have no formatting at all. The look is "enterprise grid."
- **Status and variance.** Shown as signed numbers and percent, with direction chosen by the author, plus optional rule-based colour. No built-in favourable/unfavourable semantics are documented, so whether red means "over budget" depends on whoever wrote the rule.
- **Motion, empty and loading states.** Not documented. Reviews describe slow renders rather than designed loading states.

## 5. What feels premium, and what users love

- **The plan and the report are the same model.** Change a driver on a dashboard sheet and every chart moves. PeerSpot reviewers praise "forecasting changes that instantly flow through all financial statements" ([PeerSpot](https://www.peerspot.com/products/comparisons/planful_vs_workday-adaptive-planning)).
- **Every number is explainable.** Explore Cell and Cell Explorer turn any figure into its formula, its contributors and its transactions. This is the trust feature finance teams buy.
- **Time grammar.** Current, previous, next, trailing, leading, to-date versus total. A scorecard column can say exactly "trailing four quarters YTD" without a custom formula.
- **Excel stays home.** OfficeConnect lets finance keep its board book formatting and refresh it live. Fairfield Residential cut report creation from two or three days a month to about half a day ([analytics and reporting](https://www.workday.com/en-au/products/adaptive-planning/analytics-reporting.html)).
- **Self-service for budget owners**, who manage their own plans directly ([PeerSpot](https://www.peerspot.com/products/comparisons/planful_vs_workday-adaptive-planning)).

## 6. Complaints and weaknesses

From search excerpts of review pages (direct fetches were refused):
- **Speed.** The most common complaint. One G2 reviewer: when anyone runs a report and makes many changes, "the software will run slow for all users." A Software Advice reviewer at a roughly 1,000-person company said a small formula change could lock them out "30mins to an hour" ([G2](https://g2.com/products/workday-adaptive-planning/reviews), [Software Advice](https://www.softwareadvice.com/nonprofit/workday-adaptive-planning-profile/reviews/)).
- **Dashboards score low.** G2's feature comparison shows dashboards around 6.6 against custom reports at 8.6, and one Capterra reviewer left partly over a "lack of clean dashboards" ([G2 compare](https://www.g2.com/compare/workday-adaptive-planning-vs-workiva-workiva), [Capterra](https://www.capterra.com/p/130072/Adaptive-Insights/reviews/?page=2)).
- **Dated, clunky UI.** TrustRadius 2024: UI and design "still clunky". Capterra calls the UX "clunky and complicated". PeerSpot lists "Better user interface (UI)" as a con, and says visualization "needs to catch up with BI leaders" ([TrustRadius](https://www.trustradius.com/reviews/workday-adaptive-planning-2024-09-18-13-41-46), [PeerSpot](https://www.peerspot.com/products/comparisons/planful_vs_workday-adaptive-planning)).
- **Formatting is weak.** Web reports have none by design. Reviewers cite a lack of formatting flexibility and mass updates in dashboards, which is why OfficeConnect exists.
- **Steep learning curve and heavy setup.** Integrations need "quite a bit of internal and IT know-how" ([PeerSpot](https://www.peerspot.com/products/comparisons/planful_vs_workday-adaptive-planning)).
- **Fragmented surfaces.** Charts in dashboards, statements in reports, packs in Excel, AI only on matrix reports, anomalies only on sheets and web reports, snapshots that skip reports and sheets. Each capability lives on a different surface.

## 7. Steal list (for Hub's financial tab)

1. **Scorecard as the opening block**: one row per headline account, with Month, Quarter and YTD sections of Actual, Budget, Variance and a trailing micro trend, the trend dropped at the month level.
2. **Pinned versus unpinned time**: a page-level period picker that every panel follows, with a pin icon on any panel that must stay fixed (for example "FY to date"), and each panel printing its own period top right of its title.
3. **Relative-time grammar in config**: let a panel say `trailing 4 quarters, to date` or `next 1 year, forecast` instead of fixed dates, so a deployment's file never goes stale.
4. **Explore Cell on every figure**: click any number to open a side panel showing how it is built (formula parts, children by company or job), and a "transactions" link only where ledger lines actually exist for that account and period.
5. **Explicit variance direction and units per panel**: a setting for actual minus budget or the reverse, percent of which side, millions or thousands, and parentheses for negatives, with favourable or unfavourable colour derived from the account type rather than a hand-written rule.
6. **Fan chart for forecast against budget**: one account, budget as the baseline, forecast scenarios as a fan around it, for the "where will the year land" question.
7. **Analyze this variance**: a right-click or button on any variance that names the top contributors by job, store or company and writes two sentences, labelled as machine-written for review.
8. **Presentation mode and scheduled snapshot**: step through the tab one panel at a time with arrow keys, and email a dated PDF of the whole tab on a schedule.

## 8. Avoid list

1. **Splitting statements, charts and packs across three tools.** Hub's P&L, balance sheet and cash flow should be formatted, drillable pages inside the same tab, not an unformatted grid with the real report living in Excel.
2. **Colour as an author-written expression.** Leaving red and green to whoever builds a rule means two panels can disagree about what bad looks like. Fix the semantics in the product.
3. **Enterprise-grid density with no designed loading or empty states.** Twelve columns per row and a slow render is exactly the "clunky, dated" verdict reviewers give.
4. **Capability gaps by surface** (AI only here, anomalies only there, snapshots that skip tables). Every Hub feature should work on every panel type or not ship.
