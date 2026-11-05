# Procore financials teardown (for Hub's financial tab)

Researched 2026-11-05 from public sources only: Procore's marketing pages, its support site (v1 and v2), What's New release pages, and review sites. No sign-up, no trial, no form. Procore's own help pages describe screens in words more than pictures, so where a visual detail is not stated by a source, this file says so rather than guessing.

## 1. Product shape

Procore is a construction management platform whose financial side ("Project Financials", also sold as Financial Management or Cost Management) serves general contractors, specialty contractors and owners. Its centre of gravity is the **project**, not the company ledger. Procore does not keep the general ledger: it integrates with ERPs (Sage 300 CRE, Sage Intacct, QuickBooks, Viewpoint and others), claiming over 200 accounting integrations ([procore.com/en-gb/project-financials](https://www.procore.com/en-gb/project-financials)).

The financial tools, each a separate "tool" in the project's tool menu:

- **Budget**: the heart. A configurable grid of cost codes against columns (original, changes, committed, direct, projected, forecast, over/under). Tabs: Budget, Budget Details, Forecasting, Project Status Snapshots, Budget Changes, Change History ([support.procore.com, apply view/snapshot/group/filter](https://support.procore.com/products/online/user-guide/project-level/budget/tutorials/apply-the-view-snapshot-group-and-filter-options-on-a-budget-view)).
- **Commitments**: subcontracts and purchase orders, with their change orders and invoices.
- **Prime Contracts**: the owner contract, its schedule of values and prime change orders (revenue side).
- **Change Events**: the place a potential change starts, carrying a Cost ROM and Revenue ROM per line before any change order exists ([Procore release archive on Revenue ROM](https://en-gb.support.procore.com/product-releases/new-releases/change-events-track-potential-revenue-throughout-the-change-management-process)).
- **Direct Costs**, **Procore Pay** (invoice approvals, lien waivers, payouts) ([Procore blog](https://www.procore.com/blog/unlock-more-from-procore-financials)).
- **Company level**: the Portfolio tool's Health Dashboard (legacy), Procore Home, Company-Level Insights (Sept 2025) and the Portfolio Monitoring suite for owners (June 2026) ([Business Wire, 2026-06-17](https://www.businesswire.com/news/home/20260617320347/en/Procore-Introduces-New-Suite-of-Portfolio-Management-and-Capital-Planning-Capabilities-for-Owners-Powered-by-Procore-AI)).
- **Procore Analytics**: a separate paid product of Power BI reports (over 100 dashboards and reports), embedded inside Procore or opened in Power BI, refreshed hourly on Analytics 2.0, and needing Power BI Pro or Premium licences ([support.procore.com, Procore Analytics](https://support.procore.com/integrations/procore-analytics)).

Navigation: company level (portfolio) then project level, with a tool picker per project. Inside a tool, tabs across the top, a View drop-down, a Snapshot menu, a group-by control and a Filters side panel.

## 2. The financial dashboard

Procore has no single P&L, balance sheet or cash flow page. That is the ERP's job. What it offers instead is **job cost** presented three ways.

**The Budget grid (project level).** The Procore Standard Budget View runs left to right as a chain of definitions, each column built from the ones before it ([v2.support.procore.com, standard budget views](https://v2.support.procore.com/faq-what-are-procores-standard-budget-views)):

| Group | Column | Formula |
|---|---|---|
| Budget | Original Budget | entered |
| | Budget Modifications, Approved COs | from tools |
| | Revised Budget | Original + Modifications + Approved COs |
| | Pending Budget Changes | pending statuses |
| | Projected Budget | Revised + Pending |
| Cost | Committed Costs | approved subcontracts, POs, CCOs |
| | Direct Costs | pending, revise and resubmit, approved |
| | Job to Date Costs | Direct + subcontractor invoices |
| | Pending Cost Changes | out-for-signature and pending items |
| Forecast | Projected Costs | Committed + Direct + Pending cost changes |
| | Forecast to Complete | Projected Budget minus Projected Costs (automatic) |
| | Estimated Cost at Completion | Projected Costs + Forecast to Complete |
| | **Projected Over/Under** | Projected Budget minus EAC |

The one number everyone reads is the last column. Procore's own reading guide says check red rows first, "particularly projected over/under" ([Read a Budget](https://v2.support.procore.com/en-gb/product-manuals/budget-project/tutorials/read-a-budget)). Rows group by sub job, cost code tiers and cost type, with expand and collapse arrows on group summaries.

Forecast to Complete has four methods per line: Automatic, Itemized Manual Entry, Lump Sum Manual Entry, and Monitored Resources (a recurring cost that draws down as time passes) ([FTC method FAQ](https://support.procore.com/faq/which-calculation-method-should-i-choose-when-using-the-forecast-to-complete-feature)).

**The Forecasting tab.** Spreads cost to complete across months using a curve: linear, front-loaded, back-loaded or bell, the non-linear ones built from a standard normal CDF, or typed month by month with a "Remaining" figure that should reach $0.00. Monthly only, no quarterly ([forecasting curves FAQ](https://support.procore.com/faq/how-do-procores-advanced-forecasting-curves-distribute-projected-cost-to-complete-amounts)).

**The portfolio Health Dashboard (company level, legacy).** Financial Health sits at the top: a bar chart of projects by budget (Budget beside Cost at Completion per project), Projected Budget, Estimated Cost at Completion, Total Over Under with a green or red outline, and Over Under % ((projected budget minus EAC) divided by projected budget). Below it, Company Health by Project: one row per project with Projected Over Under, a schedule bar (hover for start, completion, days past due) and color-coded dots for submittals, RFIs, unapproved change orders, daily logs, punch list and incidents. Widgets cannot be customized ([Health Dashboard guide](https://v2.support.procore.com/product-manuals/portfolio-company/tutorials/view-the-health-dashboard-in-the-portfolio-tool)).

**Insights (2025 to 2026).** Single-question cards with a headline, a chart and a ranked table. The Unfunded Commitment Change Orders insight (April 2026) shows unfunded exposure as a percentage of total contract value, an aging chart in 0 to 30, 31 to 60 and 60+ day buckets, a table of the highest-value unfunded CCOs, a ranking by percentage unfunded, a "View all projects" link and a "Go to Report" button ([unfunded CCO insight](https://v2.support.procore.com/process-guides/about-procore-insights/company-unfunded-commitment-change-orders)). Spend on General Conditions compares GC spend to its allocation, with a benchmark like "an average of 6.5% of each project's budget" over four quarters ([GC spend insight](https://v2.support.procore.com/en-gb/process-guides/about-procore-insights/company-spend-on-general-conditions)). Insights carry High, Medium or Low risk tags ([Insights release notes](https://support.procore.com/products/online/insights/release-notes)).

**Procore Analytics Financials Budget report.** Sixteen Power BI pages including Budget Insights, Key Influencers, Root Cause Analysis, Budget Benchmarking, Snapshots Over Time, Snapshot Comparison, Advanced Forecasting and Cost vs Schedule ([Financials Budget report](https://support.procore.com/integrations/procore-analytics/reports/financials-budget-report)). The help page shows mock screenshots only, so visual specifics are not stated.

## 3. Interaction

- **Time.** Not a period switch in the P&L sense. The budget is cumulative to date. Time enters through the "Actuals by Date" filter (a date range), the Forecast Start Date filter, and the monthly forecasting grid.
- **Comparisons.** Snapshots are the comparison engine. Project Status Snapshots are saved point-in-time captures (typically month end), Ad Hoc snapshots are one-offs. "Analyze Variance" opens a dialog: pick a snapshot, choose "Comparison and Variance", "Comparison only" or "Variance only", tick the columns, and the grid gains a snapshot column (shown in blue) and a variance column. On the snapshots tab, a Variance icon on a column expands it into Current, Previous and Variance ([analyze variances](https://support.procore.com/products/online/user-guide/project-level/budget/tutorials/analyze-variances-between-budget-snapshots)). Since April 2026 variance settings are configured per view ([flexible forecast panel](https://www.procore.com/whats-new/enhanced-budget-table-flexible-forecast-panel)).
- **Drill-down.** Any value in blue is a link. Clicking it opens the records that make up that figure. Procore's marketing screenshot shows a popup listing the approved commitment variations behind one cost code, totalling £172,500.00 ([Project Financials page](https://www.procore.com/en-gb/project-financials)). The Modernized Budget Table (beta from Oct 2025) moved this from a modal to a side panel, and the Forecast to Complete panel can dock at the side or the bottom ([Procore What's New](https://www.procore.com/whats-new/modernized-budget-table-smarter-view-management)).
- **Column tooltips.** Hovering a column title explains how it is calculated, its source and its status filters ([apply view options](https://support.procore.com/products/online/user-guide/project-level/budget/tutorials/apply-the-view-snapshot-group-and-filter-options-on-a-budget-view)).
- **Filters and grouping.** Filters side panel (sub job, cost code tiers, cost type, budgeted or non-budgeted rows, prime contract, has notes) with Clear All. Group-by chips you drag to reorder, with Reset. Groupings and filters are remembered per view in local storage.
- **Views.** Admin-defined budget views decide which columns a project shows. In 2026 company-driven views replaced manual column pinning.
- **Entity switching.** Company to project, and at company level, filters by department, region, program and stage.
- **Commentary.** Notes on budget lines (filterable). Insights carry the narrative. No P&L commentary layer.
- **Exports.** Budget to CSV and PDF, the new forecasting table to CSV and PDF, Analytics through Power BI.

## 4. Visual language

- **Type.** The CORE design system uses the Inter family, which clients supply ([core.procore.com](https://core.procore.com/latest/web/introduction/)). Procore's design site says its type was chosen for legibility "as users skim through the large content areas" (via search snippet of design.procore.com/typography, now redirected to brand.procore.com).
- **Color.** Procore orange is the brand accent. In the data, color is reserved for meaning: blue text means clickable, red rows mean a negative calculated value, green and red outlines mark under and over budget at portfolio level, status dots on the health table.
- **Density.** Very dense. A standard budget view shows fourteen money columns per row, grouped, with full-screen mode for room. It is a spreadsheet with semantics, not a dashboard.
- **Variance.** Shown as a signed number in its own column and as red row color. No bars inside cells are documented.
- **Motion, empty and loading states.** Not described in any public source found.

## 5. What makes it premium and useful

- **Every column is a defined formula over named sources**, and the definition is one hover away. A finance person can audit any figure without asking.
- **Every blue number opens its receipts.** The figure is never a dead end.
- **The chain from potential to committed is visible.** A change event shows up as pending before it is a change order, so EAC moves before the money does. Reviewers praise having budget and actual cost together in one place ([G2 via search](https://www.g2.com/compare/procore-vs-sage-intacct)).
- **Snapshots make "what changed since last month" a first-class action**, not a spreadsheet exercise.
- **Insights answer one question each**, with a headline percentage, an aging view and a ranked list of what to chase.

## 6. Complaints and weaknesses

- Budget and change order tools are called the most confusing part, and change event to PCO to PCCO adds steps ([Capterra reviews](https://capterra.com/p/56250/Procore/reviews/), [TrustRadius](https://www.trustradius.com/reviews/procore-2017-11-07-11-27-13)).
- The budget tool "is really not sufficient for tracking project revenue or any sort of gross margin tracking" (TrustRadius reviewer, via search). It is cost-first, and margin depends on data being pushed in. A competing vendor argues margins read high when burdens and indirect costs are not in Procore ([signld.ai blog](https://signld.ai/blog/procore-project-margin-budget-at-completion)).
- Accounting sync is the most common pain, especially QuickBooks Desktop, and some GCs keep financials out of Procore entirely (r/ConstructionManagers, via mirror).
- Reporting customization is limited, the health widgets cannot be customized, and serious dashboards need a second paid product plus Power BI licences.
- Price: "by far, the most expensive solution that we reviewed" (Capterra reviewer).
- No budget tool on mobile (G2 review title, via search).
- Too many columns, too many statuses: what counts as "committed" depends on status settings an admin chose, so two projects can disagree silently.

## 7. Steal list

1. **Hover-to-define on every figure**: each KPI and column header carries a tooltip giving its formula, its sources and what it excludes.
2. **Blue means it opens**: any figure built from records is a link that slides in a side panel (not a modal) listing those records with a total that ties to the figure.
3. **One verdict column per row**: every job or store row ends in a single signed "projected over/under" (or margin to plan) figure, and the whole row tints when it goes negative.
4. **Month-end snapshots with a one-click variance**: freeze each closed month, and let any table add "Previous" and "Change" columns beside "Current" from a snapshot picker.
5. **Show pending beside committed**: a third state between budget and actual ("pending", from open change orders, unapproved bills or signed-not-booked deals) so the forecast moves before the ledger does.
6. **Single-question insight cards**: a headline percentage of a meaningful base, an aging chart in three buckets, and a ranked list of the five largest items to chase, with a link to the full report.
7. **Portfolio row with status dots**: a company-level table, one row per job or store, with its financial verdict first and small colored dots for the operational signals beside it.
8. **Forecast curves with a Remaining counter**: spread a remaining amount across months by linear, front, back or bell curve, or by hand with a running "left to allocate" that must reach zero.

## 8. Avoid list

1. Fourteen money columns by default. Hub should lead with three or four and let the rest unfold.
2. Hiding the P&L, balance sheet and cash in another product. Hub's tab must hold the statements and the job view together.
3. Dashboards that cannot be configured, and serious analytics sold as a separate Power BI tier.
4. Definitions that change silently with admin status settings. If a figure's inclusion rules are configurable, the page must say which rules are in force.
