# Ramp teardown (reporting, insights, budgets, accounting, treasury)

Researched 2026-11-05, read only, from Ramp's marketing site, help center, launch posts and review sites. No account, no trial, no form. Ramp publishes very little about its screens in words, and most help articles describe behaviour rather than layout, so where a visual detail could not be sourced it is marked **[unsourced]** rather than guessed.

## 1. Product shape

**Who it is for.** Finance teams at startups through mid-market (and a construction vertical) who run corporate cards, reimbursements, bill pay and purchase orders through Ramp. Reporting is a by-product of the spend running through the platform, not a separate BI tool. The pitch is "One platform for all finance decisions" and "make decisions without switching tools" ([ramp.com/reporting](https://ramp.com/reporting)).

**Main screens relevant to Hub.**
- **Insights > Reports**: pre-built and custom dashboards built from reports ([help: Real-time reporting](https://support.ramp.com/hc/en-us/articles/6048244057747-Real-Time-Reporting)).
- **Insights > Price Intelligence**: average price per vendor product with the number of contributing businesses, and an upload to compare a quote against average and lowest per-seat prices ([help: Price Intelligence](https://support.ramp.com/hc/en-us/articles/17522214341523-Price-Intelligence-on-Ramp)).
- **Manage Spend > Budgets**: plan vs actual with spent, committed and remaining, nested up to five layers ([launch post](https://ramp.com/blog/ramp-budgets-launch), [construction budgets](https://ramp.com/construction/budgets)).
- **Accounting**: the Accounting Agent codes transactions as they happen and surfaces only the ones needing a human, posts accruals at month end with a scheduled reversal ([CFOtech](https://cfotech.news/story/ramp-unveils-ai-accounting-agent-to-speed-month-end-close)).
- **Treasury / Banking**: a single 13-week cash forecast that "replaces 3 bank portals and a spreadsheet", an operating minimum with automatic sweeps back, checking and investment balances together ([ramp.com/treasury](https://ramp.com/treasury), [launch release](https://prnewswire.com/news-releases/ramp-launches-ramp-treasury-cash-management-that-maximizes-every-dollar-with-minimal-effort-302357161.html)).
- **Advisor Console > Reporting** (for accounting firms, the closest analogue to Elevate): Cross Business Spend, Efficiency (approval and completion timing split by client) and AP Reporting (aging, outstanding bills, stats by staff and company) ([help: Advisor reporting](https://support.ramp.com/advisor-console-reporting)).

**Navigation.** A left panel with top-level areas (Insights, Manage Spend, Accounting, Banking). Inside Reporting, a dashboard is a page of saved reports, and a report is one chart plus its data table. Managers open the same URL as admins and the data is silently filtered to their reporting chain ([Ramp answers](https://ramp.com/answers/spend-reporting/spend-insights-to-managers-without-full-admin-access)).

## 2. The financial dashboard

Ramp is a spend platform, so it has **no P&L, balance sheet or cash flow statement**. Its "financial dashboard" is spend, budget and cash. That is the main gap and the main lesson: its strength is the path from a number to the transactions behind it, not statement presentation.

- **Top of page.** Pre-built dashboards with "Day-one clarity. No setup, no report-building" ([ramp.com/reporting](https://ramp.com/reporting)). An Ask Ramp box sits at the head of report creation, with suggested questions such as where spend is trending, top vendors, which teams are over budget ([help: AI Reporting](https://support.ramp.com/hc/en-us/articles/44738314816531-AI-Reporting)).
- **KPIs.** Consolidated spend across cards, reimbursements and bills, category breakdowns, flagged spenders, pending approvals (manager view, [Ramp answers](https://ramp.com/answers/spend-reporting/spend-insights-to-managers-without-full-admin-access)). For budgets, every line carries **spent, committed, remaining** ([launch post](https://ramp.com/blog/ramp-budgets-launch)).
- **Construction job view.** Project budget, actual spend, committed costs (from ERP purchase orders, updated when the PO changes) and remaining budget "across every active job in one place", by job, phase or cost code. Finance sees the portfolio, PMs see only their jobs ([construction budgets](https://ramp.com/construction/budgets)). This is almost exactly Hub's by-job view, minus revenue.
- **Chart types.** Bar, line, pie, area and **sankey**, plus a Data table visualization ([help: Real-time reporting](https://support.ramp.com/hc/en-us/articles/6048244057747-Real-Time-Reporting)).
- **Tables.** Every chart has a row-level Data section beneath it with filters, add or remove columns, and download ([help: Advisor reporting](https://support.ramp.com/advisor-console-reporting)).
- **Cash.** A 13-week forecast across connected accounts and entities, balance alerts, liquidity forecasting ([ramp.com/treasury](https://ramp.com/treasury), [The Paypers on Vesto](https://thepaypers.com/mergers-aquisitions-and-investments/news/vesto-joins-ramp-to-bring-multi-bank-treasury-tools-into-one-platform)). The chart form is **[unsourced]**.

## 3. Interaction

- **Drill-down.** "Every chart is clickable", from "a spike to the exact transactions" ([ramp.com/reporting](https://ramp.com/reporting)). Budgets drill from team to department to region "in a click" ([ramp.com/budgets](https://ramp.com/budgets)).
- **Chart editor pane.** Clicking a graph opens an editor: change the chart type, regroup by a different dimension, set how many groups appear, then the row data with filters and columns ([help: Advisor reporting](https://support.ramp.com/advisor-console-reporting)).
- **Ask from a chart.** Click a chart and choose "Ask Ramp" to continue the question in chat, with follow-ups like "break this down by department". Answers cover totals, comparisons, rankings and trends. It refuses single-transaction lookups, standalone math and file uploads ([help: AI Reporting](https://support.ramp.com/hc/en-us/articles/44738314816531-AI-Reporting)).
- **Time and comparisons.** Period vs period is expressed through questions ("Which vendors increased 30%+ this quarter vs last?") and budget vs actual. A dedicated period picker or prior-year toggle is **[unsourced]**. A help note shows date semantics are named: Payment date is the paid date, with Payment send date and arrival date as alternatives ([help: Real-time reporting](https://support.ramp.com/hc/en-us/articles/6048244057747-Real-Time-Reporting)).
- **Entities and segments.** Each transaction carries an entity id and consolidated reporting keeps entity detail ([Ramp answers](https://ramp.com/answers/multi-entity-accounting/can-different-entities-use-different-charts-of-accounts)). How the switcher looks is **[unsourced]**. Scope by role is automatic: a manager sees their full reporting chain and nobody else.
- **Commentary.** No human commentary layer. Narrative comes from AI summaries in Reporting Agent output and from periodic savings insights (duplicate subscriptions, overspend, missed rewards) pushed to admins and managers ([help: Savings Insights](https://support.ramp.com/hc/en-us/articles/360042590674-Ramp-Savings-Insights)). Approvers see budget impact at the moment of decision ([launch post](https://ramp.com/blog/ramp-budgets-launch)).
- **Export and sharing.** Save as new, save to dashboard, share a report "With my access" (recipients see what you see, even without Reporting access) or "With their access". Shared dashboards are read only. Scheduled emailed exports as **Aggregated** (only for bar, line, pie, area, sankey) or **Raw** rows. CSV download. An Excel add-in that refreshes into pivots. Warehouse sync to Snowflake, BigQuery, Redshift. Dashboard export itself is not supported ([help: Real-time reporting](https://support.ramp.com/hc/en-us/articles/6048244057747-Real-Time-Reporting), [ramp.com/reporting](https://ramp.com/reporting)).

## 4. Visual language

From a machine-extracted token file for ramp.com ([webdesignhot design.md diff](https://www.webdesignhot.com/design.md/linear/diff/ramp/)), which describes the marketing site and likely the product's base. Treat as indicative.
- **Type.** Söhne for display and body, Söhne Mono at 11px for labels. Scale 96 / 56 / 40 / 17. The 2023 campaign used TWK Lausanne with a custom logo built on it ([Fonts In Use](https://fontsinuse.com/uses/56961/ramp-2023-campaign)).
- **Colour.** Almost monochrome: ink `#0a0a0a` on white, warm off-whites (`#fafaf7`, paper `#f7f6f1`), greys stepped from `#5b5b58` to `#b0b0a8`. One accent, the Ramp yellow `#fcfb70` with a soft `#fefee0`. Status colours are dark and desaturated: success `#1a7f3a`, warning `#a36b00`, danger `#9a1f1f`, each with a 10% soft fill.
- **Material.** 12px card radius, hairline borders at 6 to 18% ink, one ambient shadow at 4%. Spacing on 4 / 8 / 16 / 32 / 64.
- **Density.** Reviews consistently call the interface clean, straightforward and uncluttered ([Software Advice reviews](https://www.softwareadvice.com/accounting/ramp-profile/reviews/)). Exact in-app table density, motion and loading states are **[unsourced]**.
- **Variance.** Budgets speak in three numbers (spent, committed, remaining) rather than a single variance percent. How over-budget is coloured is **[unsourced]**.

## 5. What makes it premium and useful

- **Restraint.** Ink on warm paper with one accent and dark, quiet status colours. Nothing shouts, so the one yellow thing gets read.
- **Zero setup.** Dashboards exist on day one. Nobody builds a report to get the first answer.
- **Every number is a door.** Click the bar, land on the transactions. The chart and its rows are one object.
- **Committed money counts.** Remaining budget subtracts open POs, so the number answers "how much can I still spend", which is the question people actually ask. Customers quote it: "We don't have to wait until the end of the month to course correct" ([ramp.com/reporting](https://ramp.com/reporting)).
- **Scope is invisible.** A manager never picks a filter to see their team. The page already knows who they are.
- **Ask, then keep.** A plain-English question becomes a chart that can be saved to a dashboard and shared.

## 6. Complaints and weaknesses

- **Reporting depth.** The most cited G2 dislike is missing features, "particularly for reporting and travel approval" (34 reviews, [G2](https://www.g2.com/products/ramp-financial-ramp)). Others: "limited dashboard/reporting depth" ([rfp.wiki](https://www.rfp.wiki/accounting-finance/accounts-payable-applications/ramp/finexio)), "lack of robust reporting" ([SaaSWorthy](https://www.saasworthy.com/product/ramp-management/reviews)), limited customization and no granular forecasts ([GetApp](https://www.getapp.com/finance-accounting-software/a/ramp-financial)). A TrustRadius reviewer: visibility and reporting "severely lacking despite claims of AI" (via [Stampli](https://www.stampli.com/blog/ap-automation/ramp-review/), a competitor).
- **Only Ramp's data.** Payments made outside Ramp do not reach the picture or the ERP ([Stampli](https://www.stampli.com/blog/ap-automation/ramp-review/)). No revenue, so no margin, no statements.
- **Dashboard plumbing gaps.** No dashboard export, copying a dashboard does not copy semantic reports, aggregated export works only for some chart types ([help: Real-time reporting](https://support.ramp.com/hc/en-us/articles/6048244057747-Real-Time-Reporting)).
- **Paywalls.** Sharing, scheduled exports, budgets and multi-entity sit on Ramp Plus.
- **Bulk edits and memory.** Tagging fields one transaction at a time, and the system does not learn repeated codings ([Stampli quoting G2](https://www.stampli.com/blog/ap-automation/ramp-review/)). Mobile lacks admin parity, and some call the web interface clunky ([Software Advice](https://www.softwareadvice.com/accounting/ramp-profile/reviews/)).

## 7. Steal list

1. **Clickable figures to source rows**: every tile, bar and statement line in Hub opens a drawer of the exact ledger lines or transactions behind it, with filters and a CSV button, so chart and rows are one object.
2. **Spent, committed, remaining on every job**: show each job or store's budget as three numbers (actual, committed from open POs or subcontracts, remaining) instead of one variance percent.
3. **A chart editor pane**: clicking a chart opens a side pane to switch chart type, regroup by another dimension (company, job, category, vendor) and set the top-N, without leaving the page.
4. **Ask from the chart**: an "Ask about this" action on any chart that seeds a question with that chart's scope, period and grouping already filled in.
5. **Role-scoped by default**: one URL for everyone, with the view level silently cutting data to the viewer's companies, jobs or reporting chain, and a small label saying what is in scope.
6. **"Share with my access"**: share a page so recipients see exactly what the sender sees, read only, with scheduled emailed exports in aggregated or raw form.
7. **Pushed insight cards**: a short, dated list of computed findings (a cost line up past a threshold, a duplicate vendor, a job heading over budget) at the top of the financial tab, each linking to its rows.
8. **Ink-and-paper palette with one accent**: near-black text on warm off-white, hairline borders, a single brand accent, and dark desaturated green, amber and red with 10% fills for status.

## 8. Avoid list

- **Spend-only framing.** Ramp never shows revenue, so it cannot show margin or a statement. Hub's statements must stay the core, with spend views feeding them.
- **AI as the main route to a comparison.** Ramp leans on questions for period vs period. Hub should keep explicit prior period, prior year and budget toggles visible on the page.
- **Gated plumbing.** Do not ship dashboards that cannot be exported, or copies that silently drop their contents.
- **Data limited to one system.** Ramp's picture misses anything paid outside it. Hub's job is the whole ledger, so never present a partial feed as the full number.
