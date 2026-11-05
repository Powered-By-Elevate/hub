# Vena teardown (for Hub's financial tab)

Read only research, 2026-11-05. Sources are cited inline. Most are Vena's own marketing, partner write-ups and review aggregators, so treat feature claims as vendor positioning. The most concrete screen evidence is the four screenshots in the Vena Insights datasheet (https://www.venasolutions.com/hubfs/Vena%20Insights%20Datasheet_v1.0.pdf), described below in detail because they are the closest thing to a public demo.

## 1. Product shape

**Who it is for.** Mid-market and enterprise FP&A teams that already live in Microsoft 365 and Excel. Vena calls itself a "Complete Planning platform purpose-built to harness the full power of the Microsoft technology ecosystem for FP&A teams and their collaborators", with over 1,900 to 2,000 customers (datasheet p.4, https://shapefin.com/vena-reports-strong-first-half-of-fiscal-year-2026-surpassing-2000-customers-and-advancing-ai-for-fpa/).

**Three surfaces, one data cube (CubeFLEX).**
- **Excel add-in (Vena 365).** The real working surface. Templates open from the web app, the add-in loads, users type into blue input cells and press "Save Data to Vena". Saving the workbook alone does nothing, and formulas save as values (https://hbavolunteer.knowledgeowl.com/help/vena-quick-reference-cheat-sheet). Reports are Excel sheets built in Report Builder with "versions as columns, accounts as rows" and dynamic mappings so a report refreshes against selected parameters (https://quebit.com/askquebit/variance-reporting-with-vena-reports/).
- **Web app.** Top nav in Vena green reads Manager, Contributor, Modeler, Insights, Reports, Admin, i.e. navigation by role and job, not by statement (datasheet screenshots). Contributors get assigned tasks and templates through Workflow.
- **Vena Insights.** Embedded Power BI inside the web app, so "all of your Vena data is available in real-time" without exporting (https://www.venasolutions.com/platform/microsoft/insights).
- **Vena Copilot / Vena AI.** Agents in Excel and Teams: Analytics, Planning, Reporting, Query, and a coming Scenario agent. Vena AI routes each question to the right agent in the background (https://www.venasolutions.com/product/copilot).

**Navigation inside Insights.** Breadcrumb at top left ("Insights / Power BI Reports / Foundation Dashboard"), and the dashboard's pages sit as Power BI tabs along the bottom: Home, Executive Summary, Revenue, Profitability, OpEx, Predictive Analytics, Smart Narrative (datasheet p.1, p.2, p.4).

## 2. The financial dashboard ("Foundation Dashboard")

Layout is the same on every page (datasheet screenshots):

- **Left rail of slicers**, stacked vertically, each a small labelled dropdown: Entity, Base Scenario, Comparison Scenario, Measure (Division), Year, Period (e.g. "3 Years"), Profitability Measure, Currency. A collapse chevron at the bottom hides the rail.
- **Top strip of five KPI cards** spanning the page. Executive Summary shows Revenue FY Growth %, Revenue YTD Growth %, Revenue FY Variance %, Revenue YTD Variance %, FTE Variance %. Each card has a small label, one large percentage, and a small absolute figure beneath it. A negative variance (for example "-6%") turns red, the rest read green or neutral.
- **Profitability page cards**: YTD Growth vs Actual, FY Margin vs PY, YTD Growth vs Actual, FY Growth vs Actual, YTD EBITDA Margin vs PY.
- **Body of three or four visuals in a two column grid**, each with a small title and a "View Details" button at top right:
  - Top 5 OpEx accounts, forecast, as monthly stacked columns in a green family with a legend row.
  - Gross margin breakdown as a decomposition tree (Power BI's drill tree) with City and Account selectors.
  - Revenue by entity on a bubble map (North America, Europe).
  - Profitability measure performance as a line chart with three series: Base Scenario, Comparison Scenario, Previous Year.
  - Scenario comparison as clustered columns (green base, salmon comparison) with a variance line.
  - EBIT waterfall, forecast: green bars up, red bars down, dark green total.
- **Header actions**: a freshness line "Now viewing last successful refresh, today at 2:00 AM", a "Refresh Dataset" button, and a red "Edit Report" button that drops the user into Power BI authoring.
- **Smart Narrative page**: an anomaly detection line chart (one spike marked), a Q&A box where users type a question and get a table of accounts back, and a generated paragraph underneath ("The Actual net income is $20,072,000. The net income scenario variance % is 44 %", with key figures as coloured inline values, plus sentences naming the account group with the largest scenario variance and the department with the highest actual).

P&L and balance sheet as statements are not dashboard tiles in Vena. They live as Excel reports (the "simplest P&L reporting" per datasheet p.4), and the dashboard is a KPI and driver layer over them. Cash appears as a role promise ("Monitor cash flow, expenses, and budget variances with live dashboards" for finance managers, datasheet p.3) rather than a distinct visual in the screenshots.

## 3. Interaction

- **Time.** Year and Period slicers on the rail, plus FY and YTD pairs built into the KPI cards themselves, so the card row answers "for the year" and "so far" side by side.
- **Comparisons.** The defining control is Base Scenario vs Comparison Scenario as two independent pickers. Any visual then compares any two versions (Actual, Budget, Forecast, Prior Year). Line charts add Previous Year as a third series (datasheet).
- **Drill-down.** Three levels. In Power BI, the decomposition tree and "View Details" open the next level. In Excel, "Drill Transactions" shows every transaction that rolls up into any cell, but only when an admin has built a Drill Transactions staging table and set it on the report (https://quebit.com/askquebit/variance-reporting-with-vena-reports/). "Drill Save" shows who changed an input, when, and the earlier value (https://hbavolunteer.knowledgeowl.com/help/vena-quick-reference-cheat-sheet). The Reporting Agent also offers "drill-downs to the data behind reported numbers" (https://www.venasolutions.com/product/copilot).
- **Entity and segment switching.** Entity and Division slicers on the rail, and permissions decide which members a person can even see ("You see only your assigned region" in the template, cheat sheet). Currency is its own slicer.
- **Commentary.** Two kinds. Human: free text commentary fields tied to each department in the variance template, collected through Workflow on a monthly schedule and consolidated for review (Quebit, and https://venasolutions.com/solutions/variance-analysis). Machine: Smart Narrative paragraphs on the dashboard, and the Analytics Agent's variance and trend analysis ("Spot the Shifts"), which since Summer '26 attaches its multi-step reasoning to each answer and asks a clarifying question before assuming (https://www.venasolutions.com/product-release/fy27/summer).
- **Exports and reports.** Reports are Excel, so export is the workbook. Reports "can be generated and emailed" on a schedule (cheat sheet). Ad Hoc reports can be generated from natural language and collaborated on live in Teams (https://www.venasolutions.com/product/copilot). The Executive Board Report kit sits in their template library (https://www.venasolutions.com/templates/reporting).

## 4. Visual language

- **Colour.** One brand green (the Vena logo and nav bar, a mid forest green) does double duty as "favourable". Red marks unfavourable variances and the Edit button. A salmon orange is the comparison series. Everything else is white panels on a very light grey page with grey labels. Conditional formatting in Excel reports follows the same rule, green favourable and red unfavourable, plus "traffic-light indicators" on dashboards (Quebit).
- **Typography.** Marketing uses a slab serif display face in green for headlines over a light sans body (datasheet). The product itself is Power BI default Segoe: small grey card labels, one large numeric figure per card, tiny axis labels.
- **Density.** High. A slicer rail, five cards and four charts fit on one 16:9 page with little whitespace between panels. It reads like a well kept analyst's workbook, not an editorial page.
- **Status and variance.** Shown as signed percentages coloured red or green, waterfalls with red and green bars, and a variance line over clustered columns. No arrows or chips in the screenshots.
- **Freshness.** An explicit "last successful refresh" timestamp in the header, with a refresh button beside it.
- **Motion, empty and loading states.** Not documented publicly. Power BI's own loading spinners apply. Reviewers do complain about load times (section 6).

## 5. What makes it feel premium and useful

- **It is their Excel, with a spine.** The most repeated praise is that it keeps Excel flexibility while adding centralized data, version control and structured workflows (G2 summary, https://www.g2.com/products/vena/reviews). Finance people trust it because it looks like what they already build.
- **Single source of truth.** "Vena insights is thought of as the single source of the truth. So that got rid of all the bias reporting that was coming out of individual departments" (Saint Mary's University, datasheet p.3).
- **Live, not screenshots.** A CFO's team reviews "the live Insights data rather than looking at a screenshot that they saved" on monthly calls (Canford Healthcare, datasheet p.2).
- **Any number explains itself.** Drill Transactions to the ledger line and Drill Save to the change history make every figure auditable. Automated monthly statements "saves us 3 hours a month" (TrustRadius, via https://www.trustradius.com/reviews/vena-2025-11-05-15-14-04).
- **Two scenario pickers** turn one dashboard into every comparison a CFO asks for.
- **Narrative beside the numbers.** Smart Narrative and the Analytics Agent write the "why" in sentences with the figures inline, and the Summer '26 agent shows its reasoning steps, which is the trust feature finance needs.

## 6. Complaints and weaknesses

- **Slow.** "We often have to wait about 2-3 minutes for a template to finish", the add-in "can run slow, especially if multiple workbooks are open", pivot performance "virtually non-functional" (reviews summarized by competitor Datarails, https://www.datarails.com/blog/vena-reviews-pros-and-cons-pricing-competitors/). A TrustRadius reviewer asked for "improved processing power for Insights to ensure even complex dashboards can run quickly".
- **Heavy implementation and consultant dependence.** Rollouts run past the 8 to 10 week average, one "has not been finished after 8 months", and later changes needed "their expensive consultants" (Datarails). Structural changes to models or hierarchies "can require more setup time and coordination" (G2).
- **Dashboards need help to stand up.** Insights "sometimes requires additional Vena support to set up properly" (TrustRadius), and drill to transactions only works if someone built the staging table.
- **Two tools stitched together.** The dashboard is Power BI with Vena's chrome, so editing means Power BI authoring and DAX ("Edit Report"). The look is generic Power BI.
- **Excel as the only real interface** is a drawback for non-finance users (G2 survey summary), and the "Save Data to Vena" step is a trap (saving the file saves nothing).
- **Opaque pricing and multi-year contracts** (Datarails, https://www.rfp.wiki/accounting-finance/financial-planning-software/vena/alternatives-and-competitors).

## 7. Steal list

1. **Two independent comparison pickers** (Base and Compare, each any of Actual, Budget, Forecast, Prior Year) in the financial tab's filter bar, driving every card, chart and variance column at once.
2. **Paired FY and YTD on each KPI card**: one large figure, a small absolute value beneath, and the variance signed and coloured, so a card answers "this year" and "so far" without a toggle.
3. **Every figure drills to its ledger lines**: click a P&L cell, a card or a bar and open a drawer listing the transactions that sum to it, with a change history tab showing who changed an input, when, and from what.
4. **A decomposition tree for margin**: gross margin split by company, then job or store, then account, where the user picks the next dimension at each level.
5. **A generated narrative paragraph under the statements** with key figures as coloured inline values and a "show reasoning" expander listing the steps and source cells behind each sentence.
6. **A freshness line in the header** ("Data as of today 2:00 AM, from QuickBooks") with a refresh action beside it.
7. **Owner commentary per line, collected on a schedule**: each department or job owner gets a monthly prompt to explain variances past a threshold, and the answers sit beside the line in the statement and in the exported report.
8. **An EBIT or net income waterfall** (revenue, then each cost family down in red, total in the brand colour) as the bridge between the cards and the full P&L.

## 8. Avoid list

- **Do not make the dashboard a generic BI canvas.** Vena's Insights looks like stock Power BI with an "Edit Report" button into DAX. Hub should ship one intentional, designed financial tab, not an authoring tool.
- **Do not let drill-down depend on setup.** Vena's transaction drill works only after an admin builds a staging table. In Hub every number should drill by construction.
- **Do not hide the save or refresh model.** Vena's "saving the file saves nothing" trap and minutes-long template loads are the top complaints. Hub's state should be obvious and its pages fast.
- **Do not use the brand colour as the "good" signal.** Vena's green is both logo and favourable, which breaks for any client whose brand is red or green. Keep variance colours separate from the client's brand colour.
