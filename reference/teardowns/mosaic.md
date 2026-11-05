# Mosaic (mosaic.tech) teardown

Researched 2026-11-05, read only. No sign-up, trial, demo request or form.

## A correction before anything else

The brief says Mosaic is now part of Bill. It is not. Mosaic was bought by **HiBob** (the HR platform), announced February 2025, and is now sold as **Bob Finance** inside HiBob's suite ([eightx review](https://eightx.co/blog/compare/reviews/mosaic-for-ecommerce-review), [CB Insights summary via search](https://www.cbinsights.com/company/mosaic-5/customers)). Every mosaic.tech page, the help pages and the "Mosaic in Minutes" videos included, now 301-redirects to https://www.hibob.com/finance/, and that page says the product is being reimagined "with a new experience and powerful AI capabilities" and will return "in a few months". The Wayback Machine is unreachable from this environment, and the training site (masters.mosaic.tech) and the HubSpot-hosted buyer's guide PDF both fail TLS here. So this teardown is built from the current HiBob page, search-indexed snippets of the old mosaic.tech pages, third-party reviews and comparison sites. Where a detail comes from my own knowledge of the pre-acquisition product rather than a source I could read today, it is marked **[recollection, unverified]**.

## 1. Product shape

- **Who it is for.** Strategic finance for VC-backed, high-growth SaaS companies, sitting on top of the accounting system as a planning, reporting and board layer ([fpnatools](https://fpnatools.com/tools/mosaic.html), [cfoshortlist](https://www.cfoshortlist.com/vendors/mosaic)). The founders were three finance leaders, founded 2019 in San Diego.
- **Price point.** No list price. Third-party estimates put Analytics at about $3K to $6K a month, Planning $6K to $12K, Growth $12K to $25K, plus $5K to $15K implementation, priced per company rather than per seat ([cfoshortlist](https://www.cfoshortlist.com/vendors/mosaic)). Vendr data cited at a median of about $24K a year ([eightx](https://eightx.co/blog/compare/reviews/mosaic-for-ecommerce-review)).
- **The modules.** Now split as Bob Financial Insights (analytics, 30+ live data sources, 150+ prebuilt metrics, a custom metric builder) and Bob Financial Planning (live headcount data in plans, collaborative department budgets, connected three-statement models, vendor-level budget vs actual) ([hibob.com/finance](https://www.hibob.com/finance/)). Earlier names that recur in reviews: **Metric Builder** (pivot-table feel with an Excel-like formula language, per the indexed [mosaic.tech/metric-builder](https://mosaic.tech/metric-builder) snippet), **Canvas** or Analysis Canvas (the collaborative report and dashboard builder, per [Cube's write-up](https://www.cubesoftware.com/blog/mosaic-tech-alternatives) and the Mosaic training site description "building impactful Canvas reports and dashboards"), a **Metrics Catalog** of templates, **Topline** (the top-line revenue planner, and a setting that decides whether canvas reports show forecast or actuals, per a Software Advice reviewer surfaced in search), and **Arc AI** (chat assistant, launched Q4 2024).
- **Navigation [recollection, unverified].** A left rail of modules (Dashboards, Metrics, Canvas, Planning with Models, Headcount and Budgets, Financial statements), with each metric having its own page. Reviewers say "filtering and navigation can feel unintuitive" ([rfp.wiki](https://www.rfp.wiki/accounting-finance/financial-planning-software/mosaic-tech/board)).

## 2. The financial dashboard

- **What sits on top.** The headline screen in HiBob's current marketing is a revenue metrics dashboard of customer count, expenses, revenue, net retention, LTV, CAC, gross profit margin and cash burn ([hibob.com/finance](https://www.hibob.com/finance/)). The case studies describe the CEO view as ARR, churn, OpEx, runway and cash balance, shown per scenario on one live, interactive dashboard (Lily AI case study surfaced via search, [mosaic.tech/customers/lily-ai](https://mosaic.tech/customers/lily-ai)).
- **Named cards on the page.** A **Runway** bar chart comparing cash balance across quarters, a **Net Burn** card showing monthly goal, actual spend and percent progress, and an **ARR by industry** chart across four months ([hibob.com/finance](https://www.hibob.com/finance/)). The Net Burn card is the telling one: a goal, an actual and a progress fraction on a single card, so the variance is the card's whole message.
- **Prebuilt dashboard templates.** The "Mosaic in Minutes" library included an **Operational Efficiency dashboard template** (burn multiple, cash conversion, CAC) ([indexed page](https://www.mosaic.tech/mosaic-in-minutes/how-to-use-the-operational-efficiency-dashboard-template-in-3-minutes)), and the blog framed three dashboard families: financial, sales and marketing, and forecast vs actuals ([indexed post](https://mosaic.tech/post/3-types-of-financial-dashboards-for-more-strategic-decision-making)), with forecast vs actuals drilling "down to the department and account levels".
- **Statements.** The CEO use-case page offers P&L, cash flow and budget vs actuals "on demand" ([indexed](https://mosaic.tech/use-cases/founders-ceos)), and department-level P&Ls ([cfoshortlist](https://www.cfoshortlist.com/vendors/mosaic)). The balance sheet is present through the connected three-statement model, but it is never the star. The product leads with metrics, not statements.
- **Tables.** The planning screen shown is a bookings forecast table with regions as rows (US, UK, Germany) and months as columns ([hibob.com/finance](https://www.hibob.com/finance/)). The variance reports are tables of budget, actual and delta by account, department, vendor or date ([indexed expense planning page](https://mosaic.tech/workflow/expense-planning)).

## 3. Interaction

- **Drill-down is the core promise.** "Filter by multiple dimensions and attributes and drill down to transaction details in just a few clicks" ([indexed financial analysis page](https://mosaic.tech/workflow/financial-analysis)). Budget vs actuals drills to deltas "by account, department, vendor, or date" ([expense planning](https://mosaic.tech/workflow/expense-planning)), and the variance guide compares forecast vendor spend to actual vendor spend line by line ([indexed variance report post](https://mosaic.tech/post/variance-report)). One G2 reviewer says they can drill to the account category from a model they built (search summary of [G2](https://g2.com/products/mosaic-tech/reviews?page=3)).
- **The path [recollection, unverified].** A metric or statement cell opens a side panel listing the GL transactions behind it (date, vendor, memo, amount), so the number is always one click from its source rows.
- **Comparisons.** Actual vs budget, actual vs forecast, and scenario vs scenario. Scenarios are unlimited what-ifs on revenue, headcount, OpEx and cash ([hibob.com/finance](https://www.hibob.com/finance/)). Topline decides whether a canvas report reads forecast or actuals.
- **Dimensions.** Department, account, vendor, customer, region, industry, plus HRIS fields since the HiBob merge. Budget owners get curated department views showing historical spend and headcount, add line items and employees, and submit requests a leader approves or rejects ([indexed collaborative budgeting page](https://mosaic.tech/collaborative-budgeting)).
- **Entity switching.** Weak. Multi-entity consolidation, intercompany eliminations and multi-GAAP are listed as missing ([cfoshortlist](https://www.cfoshortlist.com/vendors/mosaic), [eightx](https://eightx.co/blog/compare/reviews/mosaic-for-ecommerce-review)).
- **Commentary and narrative.** Arc "identifies performance drivers and summarizes trends in executive and board-ready stories", with tone set by chat prompts ([indexed arc-ai page](https://www.mosaic.tech/arc-ai)), and variance analysis with automated commentary ([cfoshortlist](https://www.cfoshortlist.com/vendors/mosaic)). Reviewers call Arc v1 and immature ([eightx](https://eightx.co/blog/compare/reviews/mosaic-for-ecommerce-review)).
- **Exports and reports.** Board packages are the flagship outcome: one customer went from two days of board prep to two hours ([eightx](https://eightx.co/blog/compare/reviews/mosaic-for-ecommerce-review)), and FINTRX's CEO runs board meetings from the live dashboards rather than slides ([FINTRX case study via search](https://mosaic.tech/customers/fintrx)). Slack alerts and stakeholder distribution are listed ([cfoshortlist](https://www.cfoshortlist.com/vendors/mosaic)). Cube says export formats are limited ([Cube](https://www.cubesoftware.com/blog/mosaic-tech-alternatives)), and Excel and Google Sheets integration is deliberately absent ([eightx](https://eightx.co/blog/compare/reviews/mosaic-for-ecommerce-review)).

## 4. Visual language

Sources describe the look in general terms only. Cube, a competitor, still calls the visuals Mosaic's "biggest strength" and says it "focuses on visual appeal and simplicity" ([Cube](https://www.cubesoftware.com/blog/mosaic-tech-alternatives)). A G2 reviewer singles out the "nice looking dashboards" they can share with executives and budget owners (search summary of [G2](https://www.g2.com/products/mosaic-tech)).

From the pre-acquisition product **[recollection, unverified]**:
- Light theme, white cards on a pale grey ground, generous padding, one metric or one chart per card.
- A purple-led brand with a small set of saturated accent colours for series, and green and red reserved for variance direction.
- Metric cards lead with one large figure, a period label, and a small delta chip against plan or prior period.
- Sans-serif throughout with tabular numerals in the tables, low density on dashboards and spreadsheet density in planning grids.
- Motion is functional (panels sliding in, charts redrawing on filter change), not decorative.

Empty and loading states are not described in any source I could reach.

## 5. What makes it premium, and what makes it useful

- **Premium:** restraint. A dashboard is a handful of large, single-purpose cards that an executive can read without training, which is why boards are run straight from it. The goal-actual-progress card (Net Burn) says the verdict before the chart does.
- **Useful, the thing users love:** live data from GL, CRM, billing and HRIS in one model with no CSV step, a library of 150+ prebuilt metrics that work on day one, and every number one click from its transactions. G2's own review summary leads with real-time updates, ease of use, the KPI library and integrations ([ai.g2.com](https://ai.g2.com/product/mosaic-tech)). Reviewing budgets against actuals with department heads is called "incredibly smooth" (Software Advice reviewer surfaced via search).

## 6. Complaints and weaknesses

- **Limited customization**, especially of variance reports and charts, is the commonest complaint ([ai.g2.com](https://ai.g2.com/product/mosaic-tech), [rfp.wiki](https://www.rfp.wiki/accounting-finance/financial-planning-software/mosaic-tech/board)).
- **Learning curve** for formulas and model linking, harder forecasting than Excel, and "most tools and formulas don't seem to work as expected" from one G2 reviewer.
- **SaaS only.** The metric library is ARR, MRR, NRR and LTV/CAC. No landed cost, SKU, channel mix or contribution by product line ([eightx](https://eightx.co/blog/compare/reviews/mosaic-for-ecommerce-review), [Cube](https://www.cubesoftware.com/blog/mosaic-tech-alternatives)).
- **No multi-entity consolidation** or intercompany eliminations ([cfoshortlist](https://www.cfoshortlist.com/vendors/mosaic)).
- **Slowness, bugs and awkward publish and unpublish steps** for model edits, and documentation gaps ([rfp.wiki](https://www.rfp.wiki/accounting-finance/financial-planning-software/mosaic-tech/board)), plus delays in posted actuals ([rfp.wiki Centage comparison](https://www.rfp.wiki/accounting-finance/financial-planning-software/mosaic-tech/centage)).
- **Long implementations**, 6 to 12 weeks typical and sometimes months ([eightx](https://eightx.co/blog/compare/reviews/mosaic-for-ecommerce-review), [Cube](https://www.cubesoftware.com/blog/mosaic-tech-alternatives)).
- **Product uncertainty.** It is offline for a rebuild under HiBob, with expected price rises for new buyers ([hibob.com/finance](https://www.hibob.com/finance/), [cfoshortlist](https://www.cfoshortlist.com/vendors/mosaic)).

## 7. Steal list

1. **Goal card:** every headline figure that has a target renders as actual, target and a percent-of-target bar on the same card (Mosaic's Net Burn card), so the variance is read before any chart.
2. **One click to the rows:** clicking any P&L, balance sheet or KPI cell opens a side drawer of the GL lines behind it (date, vendor, memo, amount, job or store), with the drawer total tying to the cell.
3. **Variance by any dimension:** a budget vs actual table whose rows can be re-cut by account, department, vendor, job, store or month from one control, sorted by absolute delta so the biggest misses lead.
4. **Runway as a chart, not a number:** a cash balance bar chart by quarter with the months of runway stated beside it, on the cash page by default.
5. **Prebuilt templates per industry:** ship named dashboard templates (operational efficiency, cash, job profitability, store performance) that work on connect day, the way Mosaic's 150-metric library is what users praise most.
6. **Forecast or actual switch:** one global setting that tells every report whether the current and future months read actuals, forecast or both, with forecast months visibly styled apart.
7. **Narrative drafted from the drivers:** an auto-drafted paragraph per page naming the top two or three drivers of the variance, editable, and carried into the exported board pack.
8. **Budget owner view:** a scoped page per department or job manager showing only their spend, headcount and variance, so finance shares one live page instead of a spreadsheet.

## 8. Avoid list

1. **A metric library that only speaks SaaS.** Hub's buyers are construction, retail and restaurants, so the unit of work (job, store, location) must be first-class, which is exactly where Mosaic fails.
2. **Locked chart and report formats.** Mosaic's commonest complaint is that variance reports and charts cannot be shaped, so Hub's financial tab should let a page be re-cut and re-ordered without a services engagement.
3. **No multi-entity story.** Mosaic has no consolidation or eliminations, and Hub sells to groups of companies, so entity switching and a consolidated view with intercompany netting are table stakes, not a later module.
4. **Publish and unpublish friction.** Model edits that need a separate publish step make figures disagree between views, so every Hub number should come from one computed source that every page reads.
