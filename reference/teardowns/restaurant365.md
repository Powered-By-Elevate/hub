# Restaurant365 teardown

Researched 2026-11-05 from public pages only (marketing site, docs.restaurant365.com, review aggregators, status trackers). No trial, no sign-up, no form. G2 and Capterra review pages returned 403 to a direct fetch, so review findings come from search-result summaries of those pages and are directional.

## 1. Product shape

Restaurant365 (R365) is a restaurant-specific ERP: general ledger, AP automation, banking, inventory and recipe costing, scheduling and payroll, plus reporting, sold per location (the Professional plan is listed at $489 a month per location, billed annually, https://www.restaurant365.com/finance). Its buyers are multi-unit operators and their finance teams. Two audiences live in one product, and that split shapes everything:

- **Operators (GMs, area managers)** land on a home dashboard built around yesterday and this week: sales, labor, cash over and short, the day's log and the schedule.
- **Finance (controllers, CFOs, outside accountants)** live in My Reports: the P&L, balance sheet, Sales and Prime Cost, custom financial reports, and the R365 Intelligence (AI Dashboards) layer.

Navigation is role-gated. The desktop home page carries a **Dashboard Selector** that switches between Financial, Labor, Operations, Operations Dashboard, Tasks and the classic Dashboard, with a Locations Selector beside it (https://docs.restaurant365.com/docs/home-page). Financial reports are visible only to Full Access or Accounting Manager roles (https://docs.restaurant365.com/docs/profit-and-loss). The mobile app moved in Q4 2025 to a persistent bottom tab bar with one customizable pinned tool, a categorized More menu and a widget Dashboard as the landing page (https://docs.restaurant365.com/docs/r365-app-update-2025). The web product is mid-way through a "modernized design" rollout with a toggle between new and classic views on some records (https://docs.restaurant365.com/docs/new-recipe-record-coming-soon).

## 2. The financial dashboard

There is no single financial home in the Stripe sense. Financial insight is spread across four surfaces, each worth studying.

**a. Operations Overview Dashboard (the home page)** (https://docs.restaurant365.com/docs/home-page)
- Header: dashboard selector, location selector, weather for the location's zip code, today's date and weekday.
- Shortcut tiles (Invoices, Schedule, Inventory, Orders, Transfers, Reports, Waste Log, My Tasks), each with an **alert count** of items needing attention and a plus button to create a record. Tiles grey out when the feature is not enabled. Files can be dragged straight onto the Invoices tile.
- **A Look at Yesterday**: the prior day's Daily Sales Summary (DSS) figures, with a button reading **Complete DSS** and a red dot until yesterday is closed out, after which it reads **View DSS**.
- **Week to Date**: sales, labor and over/short through the latest polled day, with a sales versus labor comparison chart and a Net/Gross toggle.
- Logbook, News and Events tabs. Labor Lineup: a daypart timeline with a current-time line, shift bars, unassigned shifts grey with a red outline, scheduled overtime as a red block behind the bar and potential overtime as a red block after it.

**b. Profitability Overview widget (Spotlight page, Dashboards app, beta)** (https://docs.restaurant365.com/docs/profitability-overview-widget). This is the closest thing to a modern financial summary, laid out in three bands:
1. Header and totals: location selector, one comparison period selector governing the whole widget ("Last month"), then a **1 to 5 health score with a tier label and a one-line tier description**, net sales with % change, Prime Cost with the prior period's %, and check count with % change.
2. **"What's driving health score"**: Sales growth, Cost of Goods %, Labor cost % and Net margin %, each against prior period. The score is weighted Food Cost 30%, Labor 30%, Net Margin 25%, Sales Growth 15%, scored against thresholds set for the location's Restaurant Type.
3. **"Other metrics to watch"**: a sales-by-service-type donut (dine-in, to-go, delivery) and a weekly net revenue line, current against prior.
- Links: "How it's calculated" opens Profitability Score Details. Prime Cost links to the Sales and Prime Cost report. **Ask Advisor** on select metrics offers "Explain this metric" or "How to improve". An "Include unapproved DSS" toggle sits in the menu, and the trend notes that totals come from approved GL entries and can move when entries are approved.

**c. The P&L report** (https://docs.restaurant365.com/docs/profit-and-loss). A parameterized report, not a dashboard. Rows are GL accounts and account types. Columns depend on a **Report Type** picker:
- Period and YTD vs Budget and Prior Year (Actual, Budget, PY, YTD Actual, YTD Budget, YTD Prior, variances)
- Operations Statement with YTD (each week-end in the period side by side, then PTD, PY PTD, PTD Budget, YTD)
- Comp and Non-Comp vs Prior Year (same-store split, driven by each location's Comp Start Date)
- Location Side by Side and Legal Entity Side by Side, each with a Total column
- Budget-only and Periods Side by Side with Forecast
- Parameters: Cutoff (Full, Controllable, or Prime Cost accounts only), Detail vs Summary, Filter By a reporting category such as Region, fiscal vs operational calendar, Hide $0, Show Unapproved, rounding, Metrics (adds guest count and check average as rows), Variance Percent basis (% of Sales recommended), custom field filter.

**d. Sales and Prime Cost report** (https://docs.restaurant365.com/docs/sales-and-prime-cost). Rows are sales and labor categories broken down by day part, menu category, labor type and day of week. Column groups are **Week to Date, Period to Date and Year to Date**, each repeating Actual, Same PY, Variance PY, % Chg, Budget, Var Budget, Act v Budg. Labor productivity carries Sales per Labor Hour against prior.

Balance sheets cover one or several legal entities or locations with drill-down to transactions (https://www.restaurant365.com/finance). Cash flow is not featured anywhere in the public material: the product's center of gravity is the P&L and the two controllable costs.

The **Financial dashboard** (prebuilt, needs the Custom Financial Report Writer) shows COGS % by category, EBIT, EBITDA and profit margins for one or more locations, widgets customizable per user (https://docs.restaurant365.com/docs/visualizing-your-data-with-dashboards).

## 3. Interaction

- **Time.** Restaurant time is the operational calendar: week, period (often 4-4-5 or 13 periods), year, with fiscal as an alternative. Every report asks "fiscal or operational". Date types are Custom range, Week or Period. The dashboards default to yesterday, because the books for today are not in yet (https://docs.restaurant365.com/docs/daily-operations-report).
- **Comparisons.** Prior period of equal length, Prior Year, Prior Week, Budget and Forecast are everywhere. The Key Info Comparative Dashboard names them as PY, PW, OWTD, OPTD, OYTD and DOB (date of business) (https://docs.restaurant365.com/docs/r365-intelligence-key-info-comparative-dashboard-master). The same-store (comp vs non-comp) split is a first-class report type, which matters for any multi-unit business that opens and closes sites.
- **Drill-down.** Metric cards on the Daily Operations Report are hyperlinked to drillthrough reports by account, employee, job or day part. The P&L drills to transactions and the GL Account Detail report. The health score drills to its own calculation page.
- **Filters and segments.** Filter By a reporting category (Region, concept) then pick values. Location Side by Side and Legal Entity Side by Side are columns, not a picker, so a controller sees every store in one grid with a total.
- **Presentation vs Grid.** The Daily Operations Report has a **Presentation** view (a scorecard of grouped cards) and a **Grid** view (spreadsheet table) of the same data, with Grid grouping By Day, By Location, or By Location and Day.
- **Approval state as a filter.** "Show Unapproved" and "Include unapproved DSS" let a viewer see provisional numbers or only reviewed ones.
- **Commentary.** Narrative lives operationally, not financially: Logbook entries (category, daypart, author, time, comment count, Must Read and Important filters) and DSS comments. On the finance side the narrative is now AI: Ask Advisor and prompt-built dashboards with "what-if" scenarios (https://www.restaurant365.com/intelligence/).
- **Exports and distribution.** Every report's Run button drops down to Export, Email or Print, and saved views and scheduled email subscriptions carry the same report to people on a cadence. The docs themselves recommend exporting to CSV to fix formatting.

## 4. Visual language

Public sources describe structure far more than styling, so this section is partly inference and says so.
- **Status color is binary green and red.** In Intelligence tables, a value above its comparison is green and below is red, applied the same way to every comparison (https://docs.restaurant365.com/docs/r365-intelligence-key-info-comparative-dashboard-master). Nothing in the docs inverts this for cost lines, so a labor % above prior year would read green. That is a real defect to avoid.
- **Red is the "needs you" color** on the home page: the red dot on Complete DSS, red outlines on unassigned shifts, red overtime blocks, alert counts on tiles.
- **Density is high.** The P&L and Sales and Prime Cost reports repeat seven measures across three time groups, which puts twenty-plus numeric columns on screen. Charts are standard BI marks: line for trends against PY, grouped bars for DOB vs PY vs PW, one donut for service mix.
- **Empty and loading states.** Data appears only after a location's DSS has polled for that date, and future dates never appear. Disabled features show as greyed tiles rather than disappearing. The status-page record shows recurring "intermittent slowness" incidents and a user report of the custom financials reporter that "will not load, just spins" (https://statusgator.com/services/restaurant365/custom-financials-reporter, https://status.restaurant365.com/incidents/qbyl816wc88t).
- **Motion** is not described anywhere public. Mobile cards swipe between "A Look at Yesterday" and "Week to Date" (https://docs.restaurant365.com/docs/r365-red-app-mobile-dashboard).

## 5. What feels premium, what makes it useful

- **The daily P&L.** The pitch and the praise are the same thing: profit you can see tomorrow morning, not after month-end close. R365's own argument is that a monthly P&L is "old news" and labor that drifts from 10% to 15% cannot be recovered once the period closes (https://www.restaurant365.com/blog/why-your-monthly-pl-is-useless/). A G2 reviewer praises P&L results being almost instantly available, and a multi-unit owner and CFO on Capterra says he sees what is happening daily from anywhere (summaries via https://capterra.com/p/139768/Restaurant365/).
- **One industry number at the top.** Prime cost (COGS plus labor as a % of sales, target below about 65% for full service, https://www.restaurant365.com/blog/how-to-track-restaurant-prime-cost/) gives an operator one figure that summarizes control. The health score goes a step further by weighting it into a 1 to 5 grade with a sentence.
- **Every store side by side with a total.** Location and legal entity side-by-side views, plus same-store comp splits, are what multi-unit CFOs buy it for. Sbarro's CFO cites benchmarking food and labor across stores (https://www.restaurant365.com/intelligence/).
- **WTD, PTD and YTD in one row** against prior year and budget, so a single line reads the week, the period and the year at once.
- **The home page asks you to finish yesterday.** The Complete DSS button with its red dot turns the dashboard into a daily ritual rather than a place you visit.

## 6. Complaints and weaknesses

- **Learning curve and training.** G2's pros and cons summary ranks Training Difficulty, Learning Difficulty and Learning Curve among the top cons. Capterra reviewers call onboarding complex (https://www.g2.com/compare/altametrics-vs-restaurant365-vs-crunchtime, https://capterra.com/p/139768/Restaurant365/reviews/?page=2).
- **Reporting is the paradox.** It is the reason people buy and also a top con: G2 lists "Inadequate Reporting", reviewers call the module limited or confusing. The P&L alone has a dozen parameters before it runs.
- **Speed.** Reports that take a long time to run or error out, and vendor-acknowledged slowness incidents in 2025 and January 2026 (https://zoftwarehub.com/en-bh/products/restaurant365/reviews).
- **Formatting.** The vendor's own docs advise exporting to CSV to adjust formatting, which concedes the on-screen statement is not presentation-ready.
- **Fragmentation.** Classic Dashboard, Operations Overview, Operations Dashboard, Spotlight, R365 Intelligence masters (which cannot be edited, only duplicated) and the mobile Dashboard are separate surfaces, and mobile edits are per device (https://docs.restaurant365.com/docs/configure-mobile-dashboard-widgets).
- **Data discipline.** A third-party review notes meaningful insight depends on disciplined recipe and count data (https://gitnux.org/best/restaurant-dashboard-software/), and two guest counts (DSS vs tickets) can disagree on the same report.

## 7. Steal list

1. **A "yesterday, closed or not" strip at the top of the financial tab**: last day's net sales, prime cost % and labor %, with a single button that reads Complete or View depending on whether that day's data has been reviewed, and a dot until it is.
2. **One comparison selector that governs every figure on the page**, with the options named in plain words (Prior period, Prior year, Budget, Forecast) and the chosen basis printed beside each delta.
3. **A health grade with its recipe shown**: a 1 to 5 score, a tier word and one sentence, then "What's driving it" listing the four weighted components against prior, and a "How it's calculated" link that opens the weights and thresholds per industry.
4. **WTD / PTD / YTD as three column groups in one row**, each repeating Actual, Prior year, Budget and variance, so a P&L line reads the week, the period and the year without changing the period control.
5. **Side by side as a report type, not a filter**: one column per store, job or legal entity with a Total column, plus a same-store (comp vs non-comp) split keyed off each unit's open date.
6. **A Presentation / Grid toggle on the same data**: scorecards for reading, a dense table grouped by unit, by day, or by unit and day for working.
7. **Cutoff levels on the P&L** (Full, Controllable, Prime) so a store manager sees the lines they control and the controller sees everything, from the same statement.
8. **Approved vs provisional as a visible switch**, labelled on every figure it touches, with the note that trend totals move as entries are approved.

## 8. Avoid list

- **Do not color by "higher is green".** R365 applies above-comparison-equals-green to every metric, which paints a rising cost line as good. Color by favorable or unfavorable for that line's sign.
- **Do not make the statement a parameter form.** Twelve settings before a P&L runs is why reviewers call reporting confusing. Default the sensible view and put the rest behind one "Adjust" control.
- **Do not split the financial story across five dashboards** (classic, overview, operations, spotlight, intelligence masters). One financial tab, with depth reached by drilling, not by switching dashboards.
- **Do not ship a screen statement that needs exporting to look right.** The on-screen P&L should already be the presentation copy.
