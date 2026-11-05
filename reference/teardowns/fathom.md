# Fathom teardown (fathomhq.com)

Read only research, 2026-11-05. Sources are Fathom's marketing site, its help centre (support.fathomhq.com, an Intercom site), its blog and third-party review summaries. G2, Capterra and Software Advice returned 403 to the fetcher, so review findings come through search summaries and SpotSaaS, and are labelled as thin where they are. Where a source did not describe a visual detail, this note says so instead of guessing.

## 1. Product shape

Fathom calls itself "All-in-one reporting, analysis & forecasting" (https://www.fathomhq.com/). Three buyers: accountants and bookkeepers selling advisory to clients, SMBs reporting to investors, lenders and managers, and franchises or groups monitoring many units. It now belongs to The Access Group (https://www.trustradius.com/compare-products/the-access-group-fathom).

It sits on top of the ledger (QuickBooks Online and Desktop, Xero, MYOB, Sage, Access Financials, Excel and Google Sheets for anything else, including non-financial data) and has four modules (https://www.fathomhq.com/features):

- **Analysis**: a set of tools down a left sidebar.
- **Reporting** (the Report Centre): a page-based report editor with templates, scheduling and PDF output.
- **Forecasting**: three-way (P&L, balance sheet, cash) driver forecasts up to 36 months, scenarios, "microforecasts" for single events such as a hire.
- **Consolidation**: up to 300 entities, 95+ currencies, intercompany eliminations, consolidated budgets.

A firm-level layer, the **Insights Dashboard** (Fathom Portfolio), lists every client company in one table (https://support.fathomhq.com/en/articles/10487513-use-the-insights-dashboard).

**Navigation** (https://intercom.help/fathom/en/articles/2632875-get-started-with-the-analysis-tools):
- Company switcher at top left, the "⌄" beside the entity name, or press `/`. It works across Analysis, Report Centre and Forecasting.
- Left sidebar lists the tools. Up and down arrows move between tools. A download icon at the foot of the sidebar makes a PDF of the tool on screen (`d`).
- Period selector at top right is **bolded "smart text"** inside a sentence, clicked to change. `m`, `q`, `y` switch monthly, quarterly, yearly. Any quarter or year can be a partial period.
- Presentation mode removes the top bar and goes full screen for a client meeting.
- `Shift + ?` lists every shortcut. `v` opens the variable picker on the Trend tool.

## 2. The financial dashboard

Fathom does not have one dashboard page. The "dashboard" is the Analysis sidebar, each tool answering one question:

| Tool | What it shows |
| --- | --- |
| KPI Summary | Every active KPI (up to 60) with result, comparison, and a right column of group median and percentile, or importance (Critical, High, Medium, Low) (https://support.fathomhq.com/en/articles/999159-kpi-summary) |
| KPI Explorer | A visual board of KPIs, each a green tick (favourable against target) or red cross (unfavourable), with **one percentage in the middle**: the share on track. Grouped by Perspective (profitability, efficiency, gearing and custom), by Result (best far right, worst far left) or by Importance (https://support.fathomhq.com/en/articles/999198-kpi-explorer). The help centre calls it a "wheel format" |
| Profitability | Breakeven chart: revenue, variable cost and fixed cost lines, the breakeven point, and the margin of safety between current revenue and breakeven. Hover a revenue level to read the margin (https://support.fathomhq.com/en/articles/999157-profitability-analysis, https://www.fathomhq.com/blog/business-unusual-series-3-monitor-breakeven-and-profitability) |
| Cash Flow | A waterfall of inflows and outflows: P&L steps (revenue, cost of sales, opex), then working capital (receivables, payables, inventory), then investing and financing, reconciling to cash at the bottom. Every step labelled. Green in, red out. It reports Operating, Free and Net Cash Flow by the indirect method, not a statutory cash flow statement (https://www.fathomhq.com/blog/how-to-answer-why-am-i-profitable-but-have-no-cash, https://support.fathomhq.com/en/articles/2277306-why-doesn-t-the-cash-flow-tool-match-with-my-statement-of-cash-flows) |
| Growth | Growth metrics plotted against each other over time |
| Trend | Free chart, up to 6 series of any account or KPI |
| Goalseek | Sliders on drivers (price, volume, variable cost, overheads) against a goal such as EBIT. Their worked example: a 3% price rise equals an 8.8% cut in variable cost of sales (https://www.fathomhq.com/blog/business-unusual-series-8-move-the-levers-with-goalseek) |
| Financials | P&L, balance sheet and cash statements, summary or detail, against prior period or budget |
| Breakdown | Appears only for groups and companies with divisions (class, location, job, department, tracking category). Horizontal bars by unit |
| Compare and Rank | Appear only inside a benchmark group: side by side, and ranked across KPIs |

**KPIs**: 50+ prebuilt financial KPIs, non-financial KPIs imported from Excel or Sheets, custom KPIs from a formula builder that references accounts, headings and other KPIs, a firm-wide KPI library, targets, and alerts (https://www.fathomhq.com/features).

**Group tables** (March 2024): KPIs by Company puts every company side by side with an optional total column, KPI Comparatives shows one KPI across the group against targets or prior periods (https://www.fathomhq.com/blog/kpis-by-company-and-more).

**Chart types** (https://support.fathomhq.com/editing-reports/charts/trend-charts): Trend (line, bar, area, mixable in one chart), Pie and Donut, Breakdown (horizontal bars), **Key Number** (one figure with an optional sparkline and a description), Aged Receivables and Payables, and Benchmark scatter. Marketing says 90+ ready charts.

## 3. Interaction

- **Period**: monthly, quarterly, yearly, any period with data. Month, quarter and year to date appear when the current month is loaded. On the Insights Dashboard a quarter is rolling 3 months and a year rolling 12.
- **Comparisons**: target, prior period, same period last year (KPI Summary). Trend charts compare to target, last year or a **rolling 12-month average**. Financials compare to prior or budget.
- **Projection on a chart**: a series can run forward from the loaded budget or from a straight line off the prior 12-month average, with dashed or dotted line styles, and a shaded fill when values drop below zero. "Highlight current period" is a display option.
- **Drill-down**: clicking a KPI opens commentary, **a plain-language explanation of the calculation**, a summary trend chart and related figures. **"Expand formula" shows the exact account values that made the number.** On the Insights Dashboard a click on any cell opens a larger trend, exact results per period, a second metric on the same chart, and up to three years of history, and can generate a summary report from there.
- **Filters**: on-track or off-track only (KPI Summary and Explorer). The portfolio table filters by threshold colour, result or growth range, tags, year end, source system and group, with any or all matching, and averages recompute as filters change. Saved views per user.
- **Entity and segment**: the company switcher, consolidated groups, Breakdown by division, and a company filter on group tables.
- **Commentary**:
  - Free text blocks in reports.
  - **Auto-text**: placeholders that refresh with the latest figure, so last month's sentence is still true this month.
  - **Observations**: rule-based positive or negative comments that show only when a condition is met.
  - **Commentary Writer** (AI): every figure it writes is highlighted blue and traceable, hover to see the source, and a calculated figure shows its formula. **Editing a number turns it into plain text and it loses its trace** (https://fathomhq.com/features/evo/commentary-writer, https://support.fathomhq.com/en/articles/13656947-verify-the-commentary-writer-s-accuracy). Fathom's line: "Every number is traceable."
- **Alerts**: a red dot with a count appears at the top right of a tool when a KPI crosses its alert level. Hover says why (https://support.fathomhq.com/en/articles/999147-alerts).
- **Exports**: PDF of any tool, PDF reports (portrait or landscape, A4 or Letter, custom cover), Excel and CSV data, chart images. Reports schedule themselves, carry comments and a draft mode, undo and redo, bulk edit of components, and can embed images and PDFs (https://www.fathomhq.com/blog/new-in-fathom-add-images-and-files-to-your-reports).

## 4. Visual language

Sources describe little of the visuals in words, so this section is short on purpose.

- **Tone**: "refreshingly easy" and "No noise. Just signal." (https://www.fathomhq.com/). Report-first: the screens are built to become pages of a PDF.
- **Status**: binary in the analysis tools, a green tick or a red cross against target. A three-level on track, at risk, off track reading is reported by a partner firm (https://www.accountingdepartment.com/blog/build-smarter-financial-dashboards-with-fathom), and the portfolio table filters by "threshold colours".
- **Colour**: green for cash in and red for cash out on the waterfall. Per-series colours are set by the user. White label on reports.
- **Smart text**: controls sit inside sentences in bold ("Showing **all active KPIs** for **September 2026**"), so the page reads as a statement and the statement is the control.
- **Empty states**: a dash where data was not imported for the period, or a currency cannot be translated. Growth still shows when result cannot. Tools that do not apply (Breakdown, Compare) are hidden, never shown empty.
- **Density**: one question per screen, full-bleed chart, with KPI lists capped at 60 and the portfolio table at 6 metric columns.
- Motion and loading states: not described by any source found.

## 5. What makes it premium, and what users love

- **One question per screen.** "Why am I profitable but have no cash?" has one answer: the waterfall, read top to bottom, where the receivables step is the moment the client gets it (the blog post above).
- **Every number explains itself.** A plain calculation explanation, then Expand formula down to account values, then traceable AI commentary. It is accountant-grade trust delivered in consumer form.
- **The report is the product.** Analysis screens become report components, auto-text keeps narrative current, and scheduling sends it. Reviewers praise the "intuitive interface and visual reporting capabilities" and being "easy to use and navigate" (https://www.spotsaas.com/product/fathom/reviews, G2 summary via search).
- **Keyboard and presentation polish**: `/` to switch company, `m q y` for period, full-screen meeting mode. It feels built for an accountant presenting live to a client.
- **Plain-English levers**: Goalseek and breakeven turn "the margin" into "you can lose this much revenue before you lose money".

## 6. Complaints and weaknesses

From review summaries (thin sample, most review sites blocked the fetch):
- **Price feels high** for SMBs (G2 reviewers via search, https://g2.com/products/fathom/reviews/fathom-review-4969311).
- **Limited report customisation** and "limited flexibility in changing report types", plus a learning curve across many tools (https://www.spotsaas.com/product/fathom/reviews).
- **Missing features and upload issues** are G2's top cons by count (https://www.g2.com/compare/g-accon-vs-reach-reporting-vs-fathom, via search).
- **Divisions are second class**: reporting and budgeting by division are weaker than single-company reports (TrustRadius via search). For Hub, whose users live by job and store, this is the gap that matters.
- **Forecast tax variables break** and are painful to fix (Capterra reviewer via search).
- **Setup is heavy**: chart of accounts mapping, KPI definitions and targets all come first (the partner blog stresses this, and consolidation mapping is called out at https://digit.business/fathom).
- Product limits seen in the docs: the Insights Dashboard shows only default KPIs, never custom ones, and excludes consolidated groups. The cash tool does not match the cash flow statement, which needs a help article to explain.

## 7. Steal list

1. **The cash waterfall as the cash page's hero**: revenue, cost of sales and opex steps, then receivables, payables and inventory, then investing and financing, each step labelled with its amount, landing on the closing cash so "profit but no cash" answers itself.
2. **Expand formula on every figure**: a click on any KPI opens a plain sentence of how it is calculated, then the exact account balances that produced it, then a 13-month trend.
3. **Traceable narrative**: every figure inside generated or templated commentary is a live token (highlighted, hover for source), and a token that is edited by hand visibly drops to plain text.
4. **Controls as bold words in the header sentence**: "**TNC** · **September 2026** · against **budget**", each word a picker, with `/` for entity and `m q y` for period.
5. **One on-track percentage over a tick-and-cross board**: KPIs grouped by perspective (profitability, liquidity, efficiency), each ticked or crossed against its target, with one number in the middle for the share on track and a filter to off-track only.
6. **Breakeven and margin of safety on the margins page**: revenue, fixed and variable cost lines, the breakeven point marked, and a sentence saying how far revenue can fall before the company loses money.
7. **Key Number tiles with a sparkline and a one-line description**, plus a dashed forward projection from budget and a highlighted current period on every trend.
8. **Hide what does not apply**: the by-job or by-store breakdown appears only when the company has divisions, and a missing period shows a dash while growth still shows.

## 8. Avoid list

1. **Divisions as an afterthought.** Fathom's weakest area is exactly Hub's core (job and store). Make by-unit a first-class view with its own budgets, never a breakdown bolted on.
2. **A cash tool that disagrees with the cash flow statement.** If Hub shows an operating cash waterfall, it must tie to the statement or say on the page exactly why it differs.
3. **A tool zoo in a sidebar.** Ten tools, each one question, is good for an accountant presenting and hard for an owner browsing. Condense into a few pages with a verdict first.
4. **Binary tick or cross with no "at risk".** A KPI 1% under target and 40% under target look the same. Show the distance to target, not just the side of it.
