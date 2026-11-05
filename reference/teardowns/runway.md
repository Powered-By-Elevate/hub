# Teardown: Runway (Runway Financial, now cfo.ai)

Researched 2026-11-05, read only. Nothing was signed up for, no trial started, no form submitted.

## Read this first: the product moved

The financial planning product that lived at runway.com is gone from that address. Today runway.com serves Runway AI, the generative video company (fetched 2026-11-05, https://runway.com). Runway Financial announced on 2026-09-10 that it was rebranding as **cfo.ai** and pivoting to **Ari**, an "AI CFO" agent (https://siliconangle.com/?p=837986, https://ffnews.com/news/cfo-ai-launches-an-ai-cfo-built-for-founders-b684fc82). The old subdomain `runway.cfo.ai` now 301-redirects to `https://cfo.ai/` (measured), and `docs.runway.com`, `help.runway.com`, `get.runway.com` and `explore.runway.com` no longer resolve in DNS (measured).

So this teardown has two layers:

- **Runway Financial (2020 to mid 2026)**, the FP&A product the brief asked about. Sources are search-index copies of its docs and help center, launch press, reviews and the Product Hunt page. Where a doc URL is cited below it is the original address, read through search snippets, because the live page is offline.
- **cfo.ai (since Sept 2026)**, the same team and model engine with an agent on top. Its homepage and docs (https://cfo.ai, https://docs.cfo.ai) are live and describe the current screens in more detail than anything left of Runway.

Founders: Siqi Chen (CEO, ex-Zynga, Sandbox VR) and Arya Asemanfar. $27.5M Series A led by Initialized, July 2023 (https://techcrunch.com/2023/07/17/runway-lands-27-5m-to-streamline-financial-planning-for-businesses/). GA and "Ambient Intelligence" launch July 9, 2024 (https://ffnews.com/newsarticle/fintech/runway-launches-first-ambient-intelligence-platform-for-finance-teams).

## 1. Product shape

**Who it was for.** Startup and growth-stage finance teams, roughly $5M to $50M ARR, SaaS-leaning (https://www.cfoshortlist.com/vendors/runway). Customers named: Superhuman, AngelList, ConvertKit (https://www.unite.ai/cs/siqi-chen-founder-ceo-of-runway-interview-series/). The pitch was "the finance platform you don't hate" and "a consumer-grade product for normal people who aren't accountants" (https://www.producthunt.com/posts/runway-financial). Chen explicitly modelled it on Canva, Figma and Notion: tools that made a specialist craft approachable (https://www.producthunt.com/posts/runway-financial).

**The object model** (from the docs index, https://docs.runway.com/get-started/introduction and https://docs.runway.com/concepts/drivers):

- **Drivers.** Every line is a named driver (Revenue, Burn, Gross Margin), each with an actuals formula and a forecast formula. Closed months pull actuals from integrations, open months run the forecast formula. A `Last Close` date is the line between them (https://help.runway.com/planning--collaborating/uSijm9sGNmbhAY2BeSCfmf/budget-vs-actuals-bva/tvJgZqnnwrabihX3FruK3t).
- **Databases.** Line-item tables (employees, deals, invoices) that feed drivers. Admins see an "Unlisted Drivers" page for orphans.
- **Models.** Groups of drivers in a spreadsheet-like grid with months across.
- **Pages.** Notion-style block documents: text, driver tables, driver charts, images, embeds. Typing `/` opens the block menu (https://docs.runway.com/concepts/pages, https://docs.runway.com/concepts/pages/text-media-block). This is the dashboard and report layer.
- **Plans.** Its signature idea. A plan is an isolated, named change to the model that carries the business intent behind it ("Hire 5 AEs in Q2"). Plans have owners, sit on a timeline, can be dragged to new dates, and are compared by their effect on key metrics (https://venturebeat.com/ai/runway-raises-27m-make-financial-planning-more-accessible-intelligent).
- **Scenarios.** Git-style branches. A draft starts as an exact copy of main, edits stay local, "Pull updates from Main" can be allowed or blocked, and only admins can merge, through a **Compare and merge** view that shows the changes against main before confirming. "Discard draft" throws it away (https://docs.runway.com/concepts/scenarios).

**Navigation.** A left sidebar of Pages and Models (Notion-like tree), a scenario picker, and the grid or page canvas on the right. cfo.ai keeps this: "The Scenario picker in the sidebar controls which Scenario a Page shows" (https://docs.cfo.ai/concepts/scenarios.md).

## 2. The financial dashboard

Runway never shipped one fixed "financial tab". The dashboard is a Page the customer or onboarding team assembles from blocks, and reviewers noted that more prebuilt statement pages were wished for (G2 snippet via https://www.g2.com/products/runway-financial/reviews).

What a typical Runway executive page held, from its own comparison-page screenshots: ARR, cash, ACV and **runway (months of cash)** charts, a growth roadmap of plans, and a scenario comparison table (search snippet of https://runway.com/compare/pigment). Reviewers singled out the runway-months view: "Every startup CEO should have this open on a second monitor" (https://digitalbydefault.ai/blog/runway-financial-planning-review-2026).

**Chart types** in a driver chart block: line, column, stacked, combo, area, waterfall, value (a single big number), sankey. Rollups (month to quarter to year) work only on time-series charts, and waterfalls show the whole time range as one period (https://docs.runway.com/concepts/pages/charts-block).

**Statements.** Three-statement modelling (P&L, balance sheet, cash flow) built as driver groups (https://www.cfoshortlist.com/vendors/runway), months across, actuals then forecast.

**The current cfo.ai dashboard** is the most concrete layout available (https://cfo.ai, measured 2026-11-05):

- Scenario tabs across the top: **Main Scenario · Upside · Downside**. Section tabs: **Summary · P&L · Cash flow · Headcount**.
- Header: company name and the window, "LTM to Q2 FY27".
- An eleven-tile KPI grid: Ending ARR, Net new ARR, LTM NRR, Revenue, Billings, Gross margin, Total OpEx, EBITDA, Free cash flow, Ending cash, Headcount.
- A **Board summary** view with tabs Board summary · ARR and retention · P&L and cash · Scenarios, subtitled "Q4 FY26 · main". Its hero is an EBITDA-margin line by quarter, **solid for actuals and dashed for plan**, with two annotations painted on the chart: "EBITDA POSITIVE · Q3 FY26" and a "Q4 FY26 · CLOSE" marker. Under it a four-row **Plan · Actual · Var** table (Ending ARR, Revenue, Ending cash, Headcount), negatives in parentheses, and one summary sentence: ARR 2.3% above plan, revenue 1.2% under, Q4 free cash flow $3.2M.
- A scenario answer drawn as a **waterfall from plan to worst case** (FY27 plan $18.7M, growth −$3.6M, hires −$2.7M, cloud −$1.2M, worst case $11.2M) with a breakeven marker and toggles for each driver.

## 3. Interaction

- **Time.** Months across the grid, a `Last Close` date that splits actuals from forecast, rollups to quarter and year on time-series charts (https://docs.runway.com/concepts/pages/charts-block).
- **Comparisons.** In any driver table: Customize (top right), then Compare, then pick the budget scenarios. Adds Variance and Variance % columns, and scenarios can be laid out as rows or columns. Budgets are locked scenarios so they do not drift as actuals land (https://docs.runway.com/guides/modeling/bva). Charts get the same Compare icon. cfo.ai tables show other scenarios beside their own, and a canvas block reads up to three at once (https://docs.cfo.ai/concepts/scenarios.md).
- **Variance colour is a per-driver setting.** Right-click a driver, Format and display, Comparison color, and choose whether a positive variance is green or red (https://docs.runway.com/guides/modeling/bva). So a cost line over budget reads red and a revenue line over budget reads green, which is the correct semantic most dashboards get wrong.
- **Drill-down.** Driver to its formula to its database rows. cfo.ai frames it as answers that "trace back to the underlying invoices or lines" (https://cfo.ai).
- **Driver explanations on hover.** Hover "Gross Margin" or "Burn" and a plain-language definition written against your own model appears (https://www.unite.ai/cs/siqi-chen-founder-ceo-of-runway-interview-series/).
- **Ambient variance.** BvA variances highlighted without being asked, deviation alerts when actuals leave the forecast, auto-written summaries of how scenarios differ (https://ffnews.com/newsarticle/fintech/runway-launches-first-ambient-intelligence-platform-for-finance-teams).
- **Commentary.** Cell-level comments, resolved comments kept viewable so past decisions stay findable (LinkedIn update via search), and narrative written in Page text blocks with **live inline metrics**: a dropdown inserts a driver such as Cash into a sentence and it stays current (search snippet of https://runway.com/product/reporting). cfo.ai's overnight message ("Overnight rebuild done, checks pass", then four bullets) is the same idea pushed out as a digest (https://cfo.ai).
- **Entity and segment.** Dimensions on databases (Product type, Region, Segment, Customer in the cfo.ai sample table). No true multi-entity consolidation or intercompany eliminations (https://www.cfoshortlist.com/vendors/runway).
- **Exports.** Present dashboards live instead of exporting to PowerPoint (https://digitalbydefault.ai/blog/runway-financial-planning-review-2026). Runway could not export a full Page to PDF (https://docs.runway.com/concepts/pages). cfo.ai adds Excel export, PDF and slide-deck reports, and read-only share links: up to 50 Pages on one link, an "Opens here" start page, a fixed scenario, optional password, a custom address and an editable preview card (https://docs.cfo.ai/guides/share-a-page.md).

## 4. Visual language

Specific product colours and type are not documented anywhere still reachable, so this is what the sources support and no more.

- **Brand.** The 2023 identity and site by Reform Collective won Awwwards Site of the Day (July 10, 2023), palette `#192227` (near-black slate) and `#F9A600` (amber), an aviation and flight-launch narrative scrolled as one story (https://www.awwwards.com/sites/runway-financial, https://dribbble.com/shots/21752460-Runway-Rebrand-Launch). Product Hunt commenters said the design "goes further than a finance app typically does" (https://www.producthunt.com/posts/runway-financial).
- **Product UI.** Reviewers call it "clean and intuitive" and say it "sits somewhere between a spreadsheet and a purpose-built planning tool" (https://digitalbydefault.ai/blog/runway-financial-planning-review-2026). Notion-like page canvas with block insertion. "Sleek, collaborative interface" (https://puzzle.io/integrations/runway).
- **Numbers.** Per-driver format: number, date, precision, currency. Negatives default to a minus sign and can switch to parentheses, set per driver or globally in Settings, General (https://docs.runway.com/concepts/drivers/driver-formatting). cfo.ai's samples all use parentheses.
- **Actual vs forecast.** Solid line for actuals, dashed for plan, and the close drawn on the chart as a labelled marker (https://cfo.ai).
- **Variance.** Green and red by driver meaning, with Variance and Variance % columns beside the figures.
- **Annotation over decoration.** The hero chart carries its own milestones in caps ("EBITDA POSITIVE · Q3 FY26"), so the chart says what happened rather than leaving it to the reader.
- **Motion, empty and loading states.** Not documented. Drag-to-move plans on a timeline is the one motion users describe.

## 5. What makes it premium, and what makes it useful

**Premium**
- It treats finance like a design tool: one canvas, blocks, slash commands, hover explanations, drag a hire date and watch runway move. That combination is what reviewers mean by "joyful", Chen's own word for the "god's-eye view" (https://techcrunch.com/2023/07/17/runway-lands-27-5m-to-streamline-financial-planning-for-businesses/).
- Charts that annotate themselves, and one sentence of verdict under every table.
- Brand craft carried into the marketing (an award-winning site), which sets expectation before login.

**Useful (the thing users love)**
- **Plans as named, owned, draggable decisions** instead of hard-coded cells. Users praised reverse-engineering plans and changing inputs to test what-ifs (https://www.producthunt.com/posts/runway-financial).
- **Scenarios without duplicating the model**, with a pull-request style review before merge (https://docs.runway.com/concepts/scenarios).
- **Live actuals** from 650 to 750 integrations, so the model updates itself, and a headline efficiency claim of 50x to 100x from Superhuman's finance lead (https://ffnews.com/newsarticle/fintech/runway-launches-first-ambient-intelligence-platform-for-finance-teams).
- **Runway months** as a first-class number, and headcount modelled hire by hire with its effect on cash shown at once (https://digitalbydefault.ai/blog/runway-financial-planning-review-2026).
- Support: G2 rates support 4.8 (https://www.cfoshortlist.com/vendors/runway).

## 6. Complaints and weaknesses

- **Learning curve**, the most consistent complaint. "Not beginner-friendly, if you don't know SQL, there's a learning curve" (G2 snippet, https://www.g2.com/products/runway-financial/reviews). A day of setup at minimum (https://digitalbydefault.ai/blog/runway-financial-planning-review-2026), 4 to 6 weeks of implementation (https://www.cfoshortlist.com/vendors/runway).
- **Reporting depth.** Pre-built dashboards are good, custom reporting "can feel constrained" next to Looker or Metabase, no pixel-perfect output, no full-page PDF, and users asked for more prebuilt statement pages (https://digitalbydefault.ai/blog/runway-financial-planning-review-2026, https://docs.runway.com/concepts/pages).
- **Not multi-entity.** No consolidation, intercompany eliminations or statutory reporting, and no SAP or Oracle ERP connectors (https://www.cfoshortlist.com/vendors/runway). This is the gap that matters most for a holding company like True North.
- **SaaS bias.** Best fit for subscription revenue, weaker for non-SaaS businesses (https://digitalbydefault.ai/blog/runway-financial-planning-review-2026).
- **Performance and bugs.** Slowdowns on large models and occasional bugs (https://www.cfoshortlist.com/vendors/runway, G2 summaries).
- **Price.** Estimated $30K to $80K a year mid-market (https://www.cfoshortlist.com/vendors/runway).
- **Upkeep.** The customer owns and maintains the model (https://fuelfinance.me/blog/runway-financial-alternatives, a competitor's view).
- **Platform risk, now realised.** The company sold its domain, renamed itself and pivoted to an agent product in September 2026. A customer's links, docs and bookmarks all broke.

## 7. Steal list

1. **Actual solid, forecast dashed, close marked.** Every time-series on the financial tab draws actuals as a solid line, plan or forecast as a dashed line, and the last closed month as a labelled vertical marker ("Sep · close").
2. **Charts that annotate themselves.** The page writes one or two milestone callouts onto the hero chart from the data (first positive month, the month a store crossed budget), in small caps, instead of leaving events for the reader to find.
3. **Plan · Actual · Var, then one sentence.** Under each chart sits a four to six row Plan / Actual / Var table with negatives in parentheses, followed by a single generated verdict line ("Revenue 1.2% under plan, cash $0.8M short, both from the Riverbend draw").
4. **Variance colour by meaning, not by sign.** Each line carries a "higher is good" flag so a cost over budget reads red and revenue over budget reads green, set once per account class.
5. **Hover a metric, get its definition in this company's terms.** Hovering "Gross margin" or "WIP over/under" shows a two-line explanation and the formula with this month's actual numbers plugged in.
6. **Sentences with live figures.** Commentary blocks let the writer insert a metric chip into the text so "Cash ended at $4.2M" updates on the next refresh and links to its source.
7. **A scenario answered as a waterfall.** A what-if (a delayed job, a new store) renders as a bridge from plan to outcome with one bar per driver and a breakeven line, each driver a toggle.
8. **Share links that fix the view.** A read-only link names its company, period and scenario, opens on a chosen page, takes an optional password and shows a branded preview card.

## 8. Avoid list

1. **A blank canvas as the dashboard.** Runway made each customer assemble Pages from blocks, which is where the learning curve and the "more prebuilt statements" requests came from. Hub should ship the financial tab finished and opinionated, with configuration around it.
2. **SaaS-shaped KPIs.** ARR, NRR and burn lead Runway's screens. Construction, retail and restaurants need contract, job and store economics on top, not subscription metrics in the hero slot.
3. **Single-entity thinking.** No consolidation or intercompany elimination is the ceiling users hit. Hub's company switcher and group rollup must stay a first-class control, not a filter.
4. **Hanging the product on someone else's address.** Runway's docs and links died with its domain. Keep Hub's docs and share links on addresses Elevate controls.
