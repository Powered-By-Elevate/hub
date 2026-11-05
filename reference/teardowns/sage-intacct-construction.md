# Teardown: Sage Intacct Construction (role-based dashboards, project financials, WIP, job cost)

Researched 2026-11-05 from public sources only (marketing, Sage help center and release notes, partner write-ups, review aggregators). No trial, no login, no forms. Where a source could not be read (G2, Capterra, TrustRadius and sage.com returned 403 to the fetcher), findings come from search-result summaries of those pages and are marked as thinner evidence.

The single most useful primary artifact is a real product screenshot of the **Project Financials** dashboard inside Sage's own data sheet, distributed by partner RKL eSolutions: https://www.rklesolutions.com/hubfs/Sage%20Intacct%20Construction/RKL%20-%20Sage%20Intacct%20Construction%20Dashboards%20%26%20Reporting.pdf (page 2). Much of section 2 and 4 below is read directly off that screenshot.

## 1. Product shape

**Who it is for.** Mid-market commercial general contractors, labor-heavy specialty contractors, multi-entity contractors and real estate developers, often moving off Sage 100 Contractor or Sage 300 CRE. Partners say it is a poor fit for very small contractors with simple billing and low reporting pressure (https://www.altavistatech.com/blog/sage-intacct-construction-review). One partner frames standard Intacct versus the construction edition as "Ford Focus versus an F-450 dually" (same source).

**What it is.** Sage Intacct's cloud general ledger with a construction layer: job cost (project, task and cost type as dimensions rather than GL accounts), commitments (subcontracts and POs), change management, project contracts with AIA G702/G703 billing, retainage, compliance and lien waivers, and WIP management. Scheduling, estimating and field work live elsewhere, usually Procore or Sage Construction Management (https://softabase.com/software/erp/sage-intacct-construction).

**Main screens relevant to a financial tab.**
- **Dashboards**: user or role dashboards built from components (performance cards, reports, charts, smart links, records). A dashboard can be set as a user's home page (https://www.intacct.com/ia/docs/en_US/help_action/Reporting/Dashboards/dashboard-basics.htm).
- **Project Financials dashboard**: the flagship construction dashboard in Sage's own marketing (RKL data sheet above).
- **WIP management**: monthly WIP schedules per entity, project lines with PM and CFO forecast fields, a draft, finalize, post workflow, and since 2025 R2 a read-only **WIP History** page, plus in 2026 R3 a **WIP project history** and **WIP detail history** at task or task and cost type level (https://www.sage.com/en-us/blog/sage-intacct-construction-2025-r2-release-highlights/, https://www.intacct.com/ia/docs/en_US/releasenotes/2026/2026_Release_3/Construction/2026-R3-wip-management.htm).
- **Reports**: standard reports, Custom Report Writer, Interactive Custom Report Writer (ICRW, separate subscription), Interactive Visual Explorer (IVE, separate subscription), and the Financial Report Writer for statements (https://www-p04.intacct.com/ia/docs/en_GB/help_action/Construction/Construction-reporting-solutions.htm).
- **Primary Document Details tab** (2025 R2): one place per subcontract or PO showing invoiced, retainage held and released, AP bills and payments, with line detail and a "Refresh All Data" button (2025 R2 highlights above).

**Navigation.** A top header with the company and entity switcher (a pill reading "Timberline GC" in the screenshot), a star for favourites, a home icon, a menu dropdown ("Dashboards"), search, and a bookmark. 2026 R3 updated that header for light and dark themes and full keyboard access (https://www.intacct.com/ia/docs/en_US/releasenotes/2026/2026_Release_3/Company_and_Administration/2026-R3-global-nav-update.htm). 2025 R2 reorganised the construction menu so Change Management and Project Contracts sit at the top (2025 R2 highlights). Entity scope works top-down: at the top level you see all entities, inside an entity only its own.

## 2. The financial dashboard specifically

### Project Financials (read off Sage's screenshot)

**Header strip.** Page title "Project Financials" at left. At right, in one row: an as-of date field (09/30/2022 with a calendar picker), a "All locations" dropdown, a "All projects" dropdown, a blue-outlined "Clear" filter button, then add (+), settings, copy and print icons.

**KPI band: ten performance cards in two rows.**
Row one, inception to date: Project Revenue $6,557,230, Project Cost $5,166,989, Project Profit Margin $1,390,240, Project Profit Margin % 21.20%, Active Job Count 1, Month to Date Project Cost $1,756,497 (green up arrow, "+$530,066 vs. prior month").
Row two, this month: Month To Date Revenue $2,320,300 (green up arrow, "+$745,825 vs. prior month"), Monthly Project Profit Margin $563,802, Monthly Project Profit Margin % 24.30% (green up arrow, "+2.19 vs. prior month"), New Jobs this Month 0 ("no change vs. prior month").

Each card is: a small grey label at top left, one large light-weight figure, a tiny grey caption under it naming the window ("inception to date", "this month to date"), and where a comparison is set, a fat green arrow to the right plus a small blue comparison line in the bottom right corner. The cards are white tiles with a hairline border on a light grey page.

**Below the band: stacked, collapsible report panels.** Each panel has a chevron, a title, a timestamp of when it was run (for example 01/24/2023 11:21:51), and a row of small icons at right (filter, edit, refresh, zoom, settings, delete).
1. **Project Overview**: a dense table grouped under "Active Projects", one row per job (job number and name as blue links, for example "22-001 - Quick Boots - Portland"), with a bold "Total Active Projects" row. Columns: Org Contract Amount, CO Contract Amount, Contract Total, Budget / Estimate, Est Gross Profit, Est Profit Margin %, Commitments, Total Billings, Total Cost, Gross Profit, % Spent, % Billed, Profit Margin %.
2. **Project Overview by Job Type**: the same columns, rows grouped by job type (Restaurants, Hotels, Warehouse) with a subtotal per group.
3. **Cost Overview Report**: collapsed by default.
4. Further panels below the fold (a "Project Overview by PM" style panel is partly visible).

So the shape is: **filters, then a KPI band, then grouped job tables with subtotals**, the same table re-cut by a different dimension in the next panel. There is no chart in the hero view.

### How the P&L, balance sheet and cash flow are presented

Statements are not native dashboard pages. They are Financial Report Writer reports dropped onto a dashboard as a "report" component, shown as a Snapshot (refresh on demand) or Live view, with a row count and a collapsed option. Sage's help warns against putting large reports on heavily used start pages because they slow the page (https://www.intacct.com/ia/docs/en_US/help_action/Reporting/Dashboards/dashboard-basics.htm). Charts come from "financial charts" or "memorized charts" in line, bar or pie styles (https://www.pkfscs.co.uk/sage-tips/dashboard-components-in-sage-intacct/). Cash flow appears as forecasting and cash modelling in marketing copy rather than as a named dashboard page (RKL data sheet).

### The WIP schedule (the construction-specific centre)

Public column sets from the ICRW WIP report library (https://www.intacct.com/ia/docs/en_GB/help_action/Reporting/Interactive_custom_reports/Report_library/Construction_reports/construction-wip-reports.htm):
- **WIP Schedule by Project**: Primary project, Period end, forecasted contract amount, forecasted cost to complete, forecasted cost at completion, forecasted gross profit, forecasted gross margin %, billed to date, cost to date, Billed %, % complete, earned to date, current earned profit, billings in excess of cost, cost in excess of billings.
- **WIP Schedule by Period**: the same plus a Comment column, one row per period, which is how profit fade is read over time.
- **WIP Billing GL Detail** and **WIP Cost GL Detail**: the transactions behind the billed and cost figures, with a batch number that links to the journal entry.
- **WIP PM Import Worksheet** and **WIP CFO Import Worksheet**: the forecast fields split by who owns them.

Key model: job-to-date costs and billings are "ERP facts", forecast cost and contract value are "predictions", operations forecasts, finance publishes, and **project manager comments explain margin changes** line by line (https://www.sage.com/en-us/blog/construction-wip-reporting/). A project can be split into several WIP lines (by building or by trade). Every project must be Finalized before the schedule can Post, and posting writes the over and under billing journal entries (https://www.intacct.com/ia/docs/en_AU/help_action/Construction/WIP_management/post-wip-schedule.htm). 2024 R4 renamed the YTD over and under billing fields to job-to-date labels (https://www-p02.intacct.com/ia/docs/en_US/releasenotes/2024/2024_Release_4/Construction/2024-R4-wip-management.htm).

## 3. Interaction

- **Time period.** A dashboard-level as-of date drives every card. Each performance card sets its own reporting period (inception to date, month to date, a finished period, a single day). 2026 R3 added a "Compare to" field so a card can compare to prior actuals and not only budget (https://preview.intacct.com/ia/docs/en_AU/releasenotes/2026/2026_Release_3/Reporting_Advanced/2026-R3-perform-cards-comparison-option.htm).
- **Comparisons.** Per card: finished period, current period, single day, budget, or none. Change can show as an absolute difference or a percentage. The card's icon and icon colour are chosen by the author (a happy or sad face, green or red), so direction of "good" is set by hand per card (https://www.greytrix.com/blogs/sageintacct/?p=2156). A ratio whose numerator is actual and denominator is budget is not supported on a card, so the docs send you to a chart for that (same source).
- **Drill-down.** From dashboard to report to transaction to source document "with just a few clicks" (RKL data sheet). Job names in the Project Overview table are blue links. GL detail reports link a batch number to its journal entry (ICRW page above). In Sage Construction Management's analytics, detail cost reports drill by cost code, division, owner code, transaction type, resource and vendor, and heat maps filter by project, prime contract or cost code depending on how many projects are selected (https://help.sagecm.intacct.com/Content/Modules/Reporting/Analytics_ProjectFinancials/ResourceCenter_Analytics_ProjectFinancials.htm).
- **Filters and segment switching.** Dashboard filters sit at the top and use whatever dimensions the company has turned on (location, department, project, customer, project manager, and so on). Each component chooses "Allow" or "Prevent" for the dashboard filters, so one panel can stay fixed while others follow the filter (dashboard basics page). Location filters accept a single location or a location group including sub-locations.
- **Entity switching.** The header pill switches entity. Consolidation across entities is native.
- **Commentary.** The only first-class narrative is the **PM comment on a WIP line**, carried into the "by Period" report so the comment sits beside the margin it explains. Sage Copilot adds Variance Analysis (budget to actual deviations flagged across entities, emailable) and a Close Assistant, but nothing public shows narrative written onto the dashboard itself (https://www.rsmus.com/insights/technology/sage-intacct/sage-copilot-can-help-businesses-increase-efficiency).
- **Exports and delivery.** Print and copy icons on the dashboard, report delivery by email or cloud storage, WIP History export including a built-in view that exports in the WIP import format so a schedule can be round-tripped (2025 R2 highlights). Charts, heat maps and grids in the CM analytics export individually to Excel, PDF or JPEG from a hover menu in the corner (CM analytics page).
- **Ownership.** Users cannot edit another person's dashboard but can clone it. Role dashboards are distributed through the Permissions tab (dashboard basics page).

## 4. Visual language

Concrete from the screenshot and release notes:
- **Typography.** A plain system sans throughout. KPI figures are large and light weight (roughly 22 to 26 px, regular, not bold), labels and captions are small grey (roughly 11 px). Tables run at about 10 to 11 px with right-aligned figures and two decimal places on every amount, which makes them dense and noisy.
- **Colour.** Almost monochrome: white tiles, light grey page, black figures, grey labels, blue for links and comparison captions, one green (Sage brand green) for up arrows, a small purple pill for the entity. 2023 R4 rebranded buttons, menus and tabs to match other Sage products while keeping links in reports blue (summarised from the 2023 R4 Sage branding release note, which returned 404 to direct fetch).
- **Density.** High. Ten KPIs above the fold, then a 13-column table. The tables are spreadsheet-like with no row banding visible, thin rules above totals, bold totals.
- **Spacing.** Tight. Cards are evenly sized with small gutters. The table panels span full width.
- **Status and variance.** A single big arrow glyph beside the figure plus a "+$X vs. prior month" line. Colour and icon are author-chosen per card, not computed from whether up is good. "Visual alerts" for cost overruns and schedule slippage are claimed in marketing (RKL data sheet) without a public picture of them.
- **Motion.** None found in any source.
- **Empty and loading.** Not documented. The docs note Snapshot components only change on Refresh and Live ones may need a browser reload to show new results (dashboard basics page), and each panel shows its own run timestamp. The CM help even tells users to Ctrl and scroll to zoom the browser when labels are cut off, which is a tell about layout robustness (CM analytics page).

## 5. What feels premium, and what makes it useful

It does not feel premium. It feels like an accountant's instrument panel. What users love is usefulness:
- **One ledger, every cut.** Dimensions mean the same transactions answer by job, job type, PM, location, customer or entity without separate reports (https://www.altavistatech.com/blog/sage-intacct-construction-review). Reviewers single out customizable dashboards and multi-dimensional slicing as the strength (TrustRadius summary via search).
- **Job health in one row.** Contract, change orders, estimate, commitments, billed, cost, % spent next to % billed, margin. A CFO can see in one line whether a job is billing ahead of or behind its cost.
- **Drill to the document.** ACT Construction's CFO: the dashboard lets them ask "is this job on path to make money for our company?" and at completion meetings "the first place we look is the Sage Intacct dashboard" (RKL data sheet, page 2).
- **WIP with memory.** WIP History turns monthly schedules into a trend of profit fade, filterable by PM, with comments that explain each move (2025 R2 highlights, WIP blog).
- **Role tailoring.** A controller can design dashboards and dashlets for each budget owner (Capterra review summary via search).

## 6. Complaints and weaknesses users name

- **Reports run slowly** and the custom report builder is too complex to use without a specialist. Software Advice summarises consistent complaints about report speed and about needing custom development just to calculate gross profit (search summary of https://www.softwareadvice.com/accounting/sage-intacct-profile/reviews/). A G2 headline: user friendly, but "creating your own reporting is too complex" (search summary). About 14% of TrustRadius reviewers cite difficulty customizing reports (search summary of https://www.trustradius.com/products/intacct/reviews).
- **Learning curve** (329 G2 mentions) and **missing features** (376 mentions) are the top G2 cons for Intacct overall (https://www.g2.com/compare/procore-vs-sage-intacct-vs-netsuite, via search).
- **Bank and bonding reports still get built by hand.** A partner names reporting "probably the most common" pain point (AltaVista).
- **Paywalled depth.** ICRW and IVE are separate subscriptions, custom dashboards and advanced WIP sit in higher tiers (Softabase, construction reporting solutions page). Budgeting and interactive reporting cost extra (SoftwareConnect via search).
- **Legacy debt.** Sage's own help says "Construction reporting is a legacy reporting area that will not be updated" and points users to Project Detail instead (ICRW WIP page), so prebuilt reports can be on a dead branch.
- **WIP is only as good as the forecast.** The schedule is only as current as cost-to-complete updates from PMs (AltaVista).
- **Configuration burden.** Every card's comparison, icon and colour is hand-set, so two cards on one dashboard can disagree about what green means.

## 7. Steal list (for Hub's financial tab)

1. **Two-window KPI band**: pair every headline figure as "to date" and "this month" in two aligned rows, each card captioned with its window in words and a one-line "+$X vs. prior month" delta under it.
2. **Job health row**: a per-job table whose fixed column order is contract, change orders, revised contract, estimate, committed, billed, cost, % spent, % billed, margin %, so billing ahead of or behind cost reads across one line (for retail swap in sales, budget, COGS, margin per store).
3. **Same table, re-cut by panel**: stack the identical column set grouped by a second dimension (job type, PM, region, store format) with subtotals, instead of building a different report per cut.
4. **Over and under billing as first-class columns**: show earned to date, billings in excess of cost and cost in excess of billings on every construction job row, with the WIP total flowing straight into the balance sheet's contract asset and liability lines.
5. **Comment beside the margin move**: let the owner of a job or store attach a dated one-line note to a period's margin change and show it in the period-by-period trend table next to the number it explains.
6. **Per-panel filter lock**: let each panel declare whether it follows the page's entity and segment filters or stays pinned (a group total that never changes while the job table filters).
7. **Run stamp and drill chain on every panel**: print "as of" and "read at" on each panel, and make every figure a link that walks panel, then job, then transaction, then source document.
8. **Round-trip export**: export the forecast or budget grid in the exact shape the import accepts, so a controller can edit it in Excel and load it back.

## 8. Avoid list

- **Hand-set variance colour and icons.** Compute good or bad from the account's sign and type (revenue up is good, cost up is bad) so green always means the same thing, and drop smiley faces.
- **Spreadsheet density with two decimals everywhere.** Thirteen columns of cents at 10 px reads as an export, not a dashboard. Round to the reader's scale, band rows, and let the drill show cents.
- **Statements as embedded reports that need Refresh.** Hub's P&L, balance sheet and cash should be native, live views, never a Snapshot that goes stale until someone clicks.
- **Charts as a separate paid tier and an afterthought.** Intacct's hero dashboard has no chart above the fold. Hub should put one well-chosen picture (margin trend or billed versus earned) beside the KPI band, included, not upsold.
