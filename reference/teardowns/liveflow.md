# LiveFlow teardown

Platform: LiveFlow (liveflow.io, now liveflow.com). Read only research, 2026-11-05. No signup, no trial, no forms.

**One line:** a live data pipe from QuickBooks Online (and Xero) into Google Sheets and Excel, with a web app for multi-entity consolidation mapping, 100+ report templates, budgeting (FinanceIQ), an MCP server for AI assistants, and since February 2026 its own AI-native ERP called Flow ([llms.txt](https://liveflow.com/llms.txt)).

Honest caveat up front: LiveFlow's marketing pages are thin on screen detail and most templates are demo-gated ([P&L period over period template](https://www.liveflow.com/spreadsheet-templates/consolidated-period-over-period-profit-and-loss-template)). The "dashboard" a customer sees is mostly a spreadsheet the customer or a template built. The most concrete UI evidence comes from the help center and from the homepage's own mockup markup and CSS, which was read directly.

---

## 1. Product shape

**Who it is for.** Two buyers. Accounting firms and CPAs running the same report across many client files ("The tenth report takes as long as the first"), and in-house finance teams with many entities ([homepage](https://www.liveflow.com/)). Over 6,000 businesses in North America and the UK, Y Combinator backed ([llms.txt](https://liveflow.com/llms.txt)). Flow targets construction, real estate, food and beverage, healthcare, franchises and technology, which overlaps Hub's industries almost exactly ([llms.txt](https://liveflow.com/llms.txt)).

**Main surfaces.**
- **The spreadsheet add-on** (Google Sheets and Excel). Extensions, LiveFlow, then Create Report, Manage Reports, Refresh All Reports ([quickstart](https://help.liveflow.com/articles/6197167612-liveflow-quickstart-guide)). A sidebar inside the sheet is where report setup and drill-down live.
- **The web app** (app.liveflow.com): workspaces, company connections, consolidation groups and account mapping ([consolidation FAQ](https://help.liveflow.com/articles/8470686813-liveflow-consolidation-faq-and-troubleshooting)).
- **Consolidation**, **Dashboards**, **FinanceIQ** (department budgeting) and **LiveFlow FP&A** as product names on top ([homepage](https://www.liveflow.com/)).
- **LiveFlow MCP**: Claude, ChatGPT or Grok pull QuickBooks reports, balances and transactions. The homepage demo is a chat that answers "Pull Q3 net income for Harbor & Vine, by month" with a month table ([homepage](https://www.liveflow.com/)).
- **Flow ERP**: ledger, AI agents for categorization, bank rec and AR follow-up (human review before finalizing), continuous close with live month-end checklists, 2 to 200+ entities ([llms.txt](https://liveflow.com/llms.txt)).

**Navigation.** In the sheet, navigation is the spreadsheet itself (tabs) plus the add-on menu. In the web app, a group dropdown selects the consolidation group, then a "Configure group" tab holds companies and mapping ([configure group](https://help.liveflow.com/articles/1136857679-how-do-i-configure-my-consolidation-group)).

## 2. The financial dashboard

LiveFlow does not ship one fixed dashboard. It ships templates and a "Dashboards" product that builds charts on live data without formulas ([dashboards](https://www.liveflow.com/products/dashboards)). What is documented:

- **Top of the P&L visual dashboard:** key metrics first (total income, net income, expenses), a "KPI monitor" comparing metrics across periods, adjustable charts that drill into revenue or expense breakdowns, and a place to enter conclusions for client presentations. Output is meant to become a PDF ([P&L visual dashboard](https://www.liveflow.com/spreadsheet-templates/profit-and-loss-visual-dashboard)).
- **The statement grid** (homepage mockup, read from the page markup): a card with a "LIVE" badge, an Account column, three month columns (Jul, Aug, Sep), and the classic five row skeleton: Income 128,400 / 136,900 / 147,600, Cost of goods sold, Gross profit, Operating expenses, Net income 30,900 / 35,400 / 41,600. Numbers are plain thousands with commas, no currency symbol, no decimals ([homepage](https://www.liveflow.com/)).
- **Per client cards:** three "P&L by Customer" cards side by side (Cedar Coffee Co., Harbor & Vine, Atlas Dental), each with a LIVE badge, two customer rows and a Total income line. The pattern: one identical report, stamped across every entity ([homepage](https://www.liveflow.com/)).
- **Template catalog** covers consolidated P&L, consolidated balance sheet with custom mapping, period over period P&L, AR and AP dashboards, trial balance, 13 week rolling cash forecast, weekly cash forecast from P&L and BS, and a construction KPI and WIP dashboard by customer and location ([consolidated AR](https://liveflow.com/spreadsheet-templates/consolidated-a-r-dashboard-template-google-sheets-excel), [balance sheet](https://www.liveflow.com/spreadsheet-templates/customized-mapped-consolidated-balance-sheet-template-for-google-sheets-excel), [13 week cash](https://liveflow.io/spreadsheet-templates/advanced-rolling-13-week-cash-flow-forecast), [construction KPI](https://www.liveflow.com/spreadsheet-templates/construction-kpi-dashboard-for-excel)).
- **Cash flow** is the weak statement: a Capterra reviewer asked for a built-in cash flow statement template because it had to be built by hand ([LiveFlow cons roundup via search](https://www.capterra.ca/software/1019629/liveflow)). The consolidated cash flow follows different inactive account rules than P&L and BS ([consolidation FAQ](https://help.liveflow.com/articles/8470686813-liveflow-consolidation-faq-and-troubleshooting)).

## 3. Interaction

- **Time period.** Each report has a date range set in the sidebar, with a separate "fixed date range" option ([quickstart](https://help.liveflow.com/articles/6197167612-liveflow-quickstart-guide)). The period over period template swaps between monthly and year to date by entity ([P&L PoP](https://www.liveflow.com/spreadsheet-templates/consolidated-period-over-period-profit-and-loss-template)). Accrual and cash adjustment options are on the consolidated P&L.
- **Comparisons.** Budget vs actuals and department budgets (FinanceIQ: department heads upload from their own spreadsheets, values go through approval, only approved values reach the master budget) ([FinanceIQ](https://liveflow.com/products/financeiq)). Flow compares against prior periods, budgets or custom views ([llms.txt](https://liveflow.com/llms.txt)).
- **Drill-down.** Tick "Enable Drill Down" on a report. Drillable cells turn **blue**. Click one and the LiveFlow sidebar lists the underlying transactions, and the **arrow keys** step through details ([quickstart](https://help.liveflow.com/articles/6197167612-liveflow-quickstart-guide)). Pitched as "Move from high-level analytics to transactional level insights in seconds" ([dashboards](https://www.liveflow.com/products/dashboards)). Reviewers note some cells do not support it ([Software Finder reviews](https://softwarefinder.com/accounting-software/liveflow/reviews?page=2)).
- **Filters and segments.** Class, location and department filters, including a "Not Specified" bucket ([FAQ](https://help.liveflow.com/articles/7150130396-liveflow-for-excel-and-google-sheets-faq-and-troubleshooting)). Consolidation by class or location lets you compare one function (their example: marketing) across entities without exposing the rest of the P&L, and share a filtered roll-up ([class and location launch](https://www.liveflow.com/post/launching-consolidation-by-class-and-location)).
- **Entity switching.** By consolidation group: create from the group dropdown, name it, pick the group currency, add companies, then Map Accounts ([configure group](https://help.liveflow.com/articles/1136857679-how-do-i-configure-my-consolidation-group)). Partial ownership with custom dates and percentages, 160+ currencies with built-in or custom FX rates, one-click intercompany elimination ([consolidation](https://liveflow.com/products/consolidation)).
- **Mapping UI.** Click source accounts, click the target sub-account. Unmapped accounts are **orange**, mapped turn **black**, and **"All Mapped" appears in green** when a section is complete. Sections: Income, COGS, Expenses, Other Income, Other Expenses. Elimination accounts are created under the orange top level account and flagged "Mark as an elimination account". A "Show Inactive Accounts" toggle exists ([map accounts](https://help.liveflow.com/articles/6441621709-how-do-i-map-accounts-in-consolidation), [consolidation FAQ](https://help.liveflow.com/articles/8470686813-liveflow-consolidation-faq-and-troubleshooting)).
- **Commentary.** No native narrative layer found. The P&L dashboard leaves a cell area for "conclusions" ([P&L visual dashboard](https://www.liveflow.com/spreadsheet-templates/profit-and-loss-visual-dashboard)). The AI story is the MCP: ask an assistant, get a table back.
- **Refresh and sharing.** Auto-refresh every hour from Manage Reports, or refresh on open, or off ([hourly launch](https://liveflow.com/post/new-launch-schedule-your-liveflow-reports-to-update-every-hour)). Dashboards share as a **real-time view** or as a **snapshot** that freezes numbers at a point in time ([dashboards](https://www.liveflow.com/products/dashboards)). Custom calculations persist across refreshes ([llms.txt](https://liveflow.com/llms.txt)).
- **Exports.** The spreadsheet is the export. No automated PDF or email distribution ([eightx review](https://eightx.co/blog/compare/reviews/liveflow-for-ecommerce-review)).

## 4. Visual language

Measured from the homepage HTML and CSS (Framer build, [homepage](https://www.liveflow.com/)):
- **Type:** Suisse Intl Regular, Medium and Bold for nearly all text (about 170 declarations), **IvyPresto Display Light**, a thin high contrast serif, for display headlines, Geist and Fragment Mono for UI and figure accents. The serif headline over a Swiss grotesk is the main "premium" move.
- **Colour:** near black navy `#000B1D` as ink, one electric blue `#004BF6` (rgb 0,75,246) as the only accent, a deep indigo `#0C1163`, cool greys `#E4E8F0`, `#F0F2F6`, `#F6F8FC` for hairlines and grounds, slate text `#4A5468` and `#6B7487`, and a dark green `#1E6B14` used for positive status. Very restrained: one accent, everything else cool neutral.
- **Density:** statement mockups are sparse: five rows, three columns, generous row height, no gridlines beyond hairlines. The real product inherits whatever density the user's sheet has.
- **Status and variance:** status is a small "LIVE" pill on the report card. In mapping, status is colour on the account name (orange unmapped, black mapped, green "All Mapped"). Drillable figures are blue, which doubles as the link affordance.
- **Motion:** the homepage animates a chat ("Building 3 reports…" then "3 reports ready") and testimonial cards with "Tap for sound". Inside the product, none documented.
- **Empty and loading:** not documented. The "Building 3 reports…" to "3 reports ready" line is the one loading state shown, and it reads well: say what is happening, then say what is done.
- **Before and after framing:** "old way" ready around day 12 per client vs LiveFlow ready day 1 ([homepage](https://www.liveflow.com/)).

## 5. What makes it feel premium, and what makes it useful

- **Premium:** the editorial serif plus one electric blue on navy, and the restraint of the statement card. The LIVE badge carries the brand promise in four letters.
- **Useful, the thing users love:** the numbers are live in the tool they already use. Reviews repeat "fast and seamless" integration and "All the manual work I used to do is now gone" ([Software Finder](https://softwarefinder.com/accounting-software/liveflow/reviews?page=2)). G2 4.9 from 332 reviews, praise for real-time sync, ease of use and report customization ([G2 AI summary](https://ai.g2.com/product/liveflow)). Consolidation with eliminations and FX is called "genuinely hard to replicate at this price" ([eightx](https://eightx.co/blog/compare/reviews/liveflow-for-ecommerce-review)). Firms love one report rolled out to every client.

## 6. Complaints and weaknesses

- **Price** for small operators. No public pricing, third-party estimates around $200 a month single entity up to $4,000 to $10,000+ enterprise ([eightx](https://eightx.co/blog/compare/reviews/liveflow-for-ecommerce-review), [G2 AI summary](https://ai.g2.com/product/liveflow)).
- **Setup** takes two to four weeks with complex charts of accounts ([eightx](https://eightx.co/blog/compare/reviews/liveflow-for-ecommerce-review)).
- **No visibility of when a sync last ran** ([eightx](https://eightx.co/blog/compare/reviews/liveflow-for-ecommerce-review)).
- **Spreadsheet fragility:** merged cells inside a report stop refresh, a 400,000 cell cap per report, large reports error out, the Google sidebar breaks on multi-account sign in, and QuickBooks changes can need a manual reconnect ([FAQ](https://help.liveflow.com/articles/7150130396-liveflow-for-excel-and-google-sheets-faq-and-troubleshooting)).
- **Dashboards "not quite there yet"**, Excel feels second to Sheets, occasional sync errors and slow frequent refreshes, support quality slipping ([Software Finder](https://softwarefinder.com/accounting-software/liveflow/reviews?page=2)).
- **Accounting gaps:** non-controlling interest is not calculated, and 0% owned entities must be added at 100% with equity mapped to an NCI line by hand, while their net income still lands 100% in consolidated net income ([NCI article](https://help.liveflow.com/articles/9105257876-0-ownership-entities-non-controlling-interest-in-liveflow)).
- **Built for finance people:** harder for non-finance staff, per a Capterra reviewer ([Capterra](https://www.capterra.ca/software/1019629/liveflow)). No operational data (no SKU, channel, CAC), read only ledger, board packs need manual formatting ([eightx](https://eightx.co/blog/compare/reviews/liveflow-for-ecommerce-review)).

## 7. Steal list (for Hub's financial tab)

1. **Provenance pill on every statement:** a small "Live" badge plus source and an exact "Synced 9:42 AM" stamp, fixing LiveFlow's own top complaint by making sync time always visible.
2. **Blue means drillable:** every figure that has transactions under it wears the accent colour, opens a right side panel of the transactions behind it, and the arrow keys step to the next and previous figure without closing the panel.
3. **Consolidation group as the entity switcher:** the picker selects a saved group (any set of companies), and the P&L renders one column per entity, an Eliminations column, then Consolidated, with ownership percentage and FX rate shown under each entity header.
4. **Mapping health as a status chip:** the consolidated view shows "All mapped" in green or "3 accounts unmapped" in orange, and clicking it lists the unmapped accounts, so a consolidated number never silently omits money.
5. **Live vs snapshot sharing:** a "Freeze this period" action stamps a dated, immutable copy ("As sent to the board, Oct 12") beside the live view, so a reported number can always be found again.
6. **Monthly / YTD and Accrual / Cash as two small segmented toggles** on the same layout, never separate pages.
7. **Segment slice across entities:** pick one class or department (Marketing, one store, one job) and see that line's P&L across every entity side by side, shareable to that department head alone.
8. **Say what the system is doing:** loading reads "Building 3 statements…" then "3 statements ready", and the hero pairs an editorial serif headline with a restrained grotesk body and a single accent colour.

## 8. Avoid list

1. **The spreadsheet as the interface.** It gives LiveFlow distribution, but it is the source of every complaint (merged cells, cell caps, a fragile sidebar, user-built dashboards that look like whatever the user built). Hub should export to a spreadsheet, not live in one.
2. **Hidden refresh state and silent failures.** Refresh errors that must be debugged by elimination. Hub should name the failure and the fix on the page.
3. **Accounting shortcuts presented as features.** No automatic NCI, and net income for a partly owned entity consolidated at 100%. If Hub consolidates, ownership must flow through to the NCI line and net income both.
4. **Gating the good templates behind a demo.** Hub's demos already show every page, keep it that way.
