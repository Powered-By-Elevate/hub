# Mercury teardown (for Hub's financial tab)

Researched 2026-11-05, read only (no sign-up, no trial, no form). Mercury's help center (support.mercury.com) and the SaaSFrame and Capterra pages returned 403 to the fetcher, so screen detail comes from Mercury's own product posts, its marketing pages, third-party design write-ups and search snippets of the help center. Where a figure comes from a third party's reconstruction of the design system, it says so.

## 1. Product shape

**Who it's for.** Startups and small businesses, then (with Personal) founders themselves. It is a bank account first: checking, savings, Treasury, cards, bill pay, invoicing, reimbursements, accounting sync. It is not an accounting system, so everything it shows is cash basis, built from bank transactions.

**Main screens.** Home (balances, recent transactions, cash flow), Transactions, Insights, Cards, Payments and Bill Pay, Invoicing, Treasury, Accounts, Settings. Insights sits in the left sidebar for all admins ([Mercury, Insights page overview snippet](https://support.mercury.com/hc/en-us/articles/44277089544084-Insights-page-overview)). A 925 Studios breakdown of the product counts 367 UI screens and 112 components, and reads the hierarchy as financial position at the top level (balance, recent transactions, cash flow) and operational controls (cards, permissions, wire setup) one level down ([925 Studios](https://www.925studios.co/blog/mercury-design-breakdown)).

**Navigation.** A persistent left sidebar of products, a company switcher under the company logo, and an **All accounts** view that rolls up every Mercury account the user belongs to, can be set as the default view, is searchable, downloads statements for all linked accounts at once and opens straight into any one company's dashboard ([Mercury, View all accounts](https://support.mercury.com/hc/en-us/articles/35624262501524-View-All-Accounts)). That rollup is exactly Hub's "by company" problem, solved as a home page rather than a filter.

## 2. The financial dashboard

Mercury has two analytic surfaces, and the split is instructive.

**The Transactions page as an analytic surface** ([Mercury, updated Transactions page](https://mercury.com/blog/updated-transactions-page), [May 2025 updates](https://mercury.com/blog/may-2025-product-updates)):
- Two live charts sit above the table. A **cash flow graph** defaults to the current month, zooms to specific days or a custom range, and follows the table's filters. A **money movement breakdown** shows the top five inflow and outflow sources, grouped by account, card, category, merchant type and similar.
- The table under them is the ledger. Filters for date, keyword and amount are one click, with advanced filters for category, merchant type, team member and GL code. **Customize** groups and sorts the table into segments.
- **Data Views** save filter combinations for one click. Three ship by default: My transactions, Monthly money in, Monthly money out.
- Bulk edit of categories and GL codes, synced to QuickBooks, Xero or NetSuite. Mercury's line is "No CSV exports or third-party dashboards needed."

**Insights** ([launch post](https://mercury.com/blog/introducing-insights), [product page](https://mercury.com/insights), [March 2026 updates](https://mercury.com/blog/march-2026-product-updates)):
- **Overview**: a snapshot of financial health, named as burn, runway and key spend categories. The Personal version's Overview shows net cash flow and top spending categories ([Mercury Personal Insights snippet](https://support.mercury.com/hc/en-us/articles/47642937853076-Understanding-your-Insights-page-on-Mercury-Personal)).
- **Money in** and **Money out** tabs: totals over time, sorted by source (recipient for outflows), category or GL code. Clicking any row opens the transactions behind it. Internal transfers are excluded from both sides, so moving money between your own accounts never reads as income or spend.
- **AI insights and alerts** in the dashboard flag notable changes in cash flow. Clicking one opens a chat seeded with that insight, to ask things like why software spend rose that month.
- Categories are assigned automatically, users review, approve or edit them, and the model learns from corrections. Users can create their own categories.

**What there is not.** No P&L, no balance sheet, no accrual statements, no budget. The "balance sheet" is the account list and the Treasury portfolio. Mercury deliberately stays in its lane (cash), which is part of why it feels so clean.

**Treasury.** Shown as a portfolio with "months of cash" framing (image label on [mercury.com/treasury](https://www.mercury.com/treasury)), yield displayed net of fees by tier, and **auto-transfer rules** that hold a minimum in operating accounts and sweep the rest. Rules start from four templates, a custom build, or a plain-language description, and scheduled rules run at 6:00 AM PT on business days ([Mercury, cash management guide](https://mercury.com/blog/cash-management-methods), [Treasury launch](https://mercury.com/blog/introducing-mercury-treasury)). March 2026 added nicknames and a history per rule.

## 3. Interaction

- **Time.** Current month by default, zoom into days, custom ranges, and "compare timeframes" on Insights ([product page](https://mercury.com/insights)). Comparison is period against period. There is no budget or plan to compare against.
- **Drill-down.** The defining move. Every aggregate (a breakdown row, a chart, an AI alert) opens its own transactions, and the transactions page's charts redraw to whatever the table is filtered to. Chart and table are one object seen two ways.
- **Exclusions.** Users can exclude data points or transaction types so one-off items do not distort the cash flow picture ([product page FAQ](https://mercury.com/insights), [Personal snippet](https://support.mercury.com/hc/en-us/articles/47642937853076-Understanding-your-Insights-page-on-Mercury-Personal)).
- **Entity switching.** Company logo menu, All accounts rollup, one click into a single company.
- **Commentary.** Two layers. Human: comments on individual transactions with @-mentions for the accounting team ([May 2025](https://mercury.com/blog/may-2025-product-updates)). Machine: AI alerts and recaps that link to the data and open a chat. Narrative is attached to the number it explains, never a separate memo page.
- **Exports and reports.** Statements (including all-accounts statements), accounting sync, and since March 2026 a read-only MCP connector for ChatGPT and Claude with 24-hour tokens. Mercury's position is to analyse in place rather than export.
- **Other polish.** Dark mode on web (system, dark or light) and iOS home-screen balance widgets ([May 2025](https://mercury.com/blog/may-2025-product-updates)).

## 4. Visual language

Caveat: the exact tokens below come from third-party reconstructions of mercury.com (mostly the marketing site), not Mercury's own documentation. Treat them as close, not canonical.

- **Typography.** A proprietary family, Arcadia for UI and ArcadiaDisplay for headings at 24px and up, on a variable axis with in-between weights (360, 400, 420, 480) rather than the usual 400/500/600 steps ([shadcn.io DESIGN.md](https://www.shadcn.io/design/mercury/raw), [Blake Crosley guide](https://blakecrosley.com/guides/design/mercury)). Headings sit at 480, light body at 360. Financial figures are their own typographic tier: about 28px, weight 500, slight negative tracking, line height 1.0, with a small medium-weight label above (12px) and 4px between label and value ([Blake Crosley](https://blakecrosley.com/guides/design/mercury)). Balances always carry thousands separators and two decimals.
- **Colour.** Restraint is the headline. An indigo primary (about `#5266eb`), cool near-black and cool near-white neutrals (`#171721`, `#1e1e2a`, `#ededf3`), hairlines rather than heavy borders (`#272735` on dark), and red or yellow only for errors and warnings ([shadcn.io](https://www.shadcn.io/design/mercury/raw), [925 Studios](https://www.925studios.co/blog/mercury-design-breakdown): no promotional oranges or engagement-bait purples). Money colours are desaturated: credit green, debit red and pending amber are softened to sit inside the palette ([Blake Crosley](https://blakecrosley.com/guides/design/mercury)).
- **Spacing and shape.** A 4px base with large steps (20, 32, 40, 72, 112), product padding of 32 to 40px, cards at 12px radius with a 1px hairline, small 4px radius on table chrome, full pills for status ([shadcn.io](https://www.shadcn.io/design/mercury/raw)). Dense in function (108 modal instances counted by 925 Studios) but airy in layout.
- **Status and variance.** Status as soft pills and dots. Variance is shown by period comparison and AI alerts in sentences rather than by red and green walls of percentages.
- **Motion.** Short and functional, around 0.2s ease on hover states ([Blake Crosley](https://blakecrosley.com/guides/design/mercury)). Charts and tables update "instantly" on filter ([Insights launch](https://mercury.com/blog/introducing-insights)). No decorative motion inside the app found in sources.
- **Empty and loading states.** Not documented in any source reached. The reconstructed design system lists loading and balance-delta tokens as a known gap ([shadcn.io](https://www.shadcn.io/design/mercury/raw)).

## 5. What makes it premium, and what makes it useful

**Premium.** One typeface nobody else can license, set at unusual weights. A palette that refuses to shout, so the money is the brightest thing on screen. Numbers treated as typography (size, tracking, tight leading) rather than table cells. Calm surfaces separated by hairlines and slight elevation. Financial state first, controls second. The marketing site leads with a live product demo, which signals confidence in the screens themselves ([925 Studios](https://www.925studios.co/blog/mercury-design-breakdown)).

**Useful.** Every number is one click from the transactions that make it up. Charts and tables share one filter state. Saved views turn recurring questions ("monthly money out") into a button. Internal transfers are stripped out automatically so cash flow is honest. Alerts arrive as a sentence about what changed, and open a chat already about that number. All accounts makes multi-entity a home page, not a chore.

## 6. Complaints and weaknesses

- **Account closures and frozen funds** dominate negative reviews: sudden closures, weeks without response, funds held (Trustpilot about 4.0 on roughly 2,400 reviews, [Trustpilot](https://uk.trustpilot.com/review/mercury.com?page=4), [StartupOwl](https://startupowl.com/reviews/mercury)). A banking risk, not a design one, but it shows trust is the real product.
- **Support** is email only, no phone or live chat ([Capterra and review summaries via search](https://www.capterra.com/p/10035709/x/reviews/)).
- **Categorisation depth.** Users cannot categorise expenses as finely as they want, and category editing is sometimes limited ([Capterra snippet](https://www.capterra.com/p/10035709/x/reviews/)).
- **Reporting depth.** Accounting features rated well below dedicated tools such as QuickBooks Online ([Merchant Maverick](https://merchantmaverick.com/reviews/mercury-bank-review)). Insights is cash only: no accrual view, no budget comparison, no P&L or balance sheet, which is the gap Hub lives in.
- **Partner-bank changes and foreign-currency fees** disrupted some users ([G2](https://www.g2.com/products/mercury-mercury/reviews)).

## 7. Steal list

1. **Chart on top of its own ledger**: every financial page puts its chart above the exact rows that make it up, sharing one filter state, so a filter or a click on a bar redraws both.
2. **Top-five movers beside the chart**: a compact "top five sources and destinations" breakdown next to each P&L or cash chart, regroupable by customer, vendor, category, GL account, company or job.
3. **Every aggregate opens its transactions**: any figure, row, bar or alert in the financial tab drills to the GL lines behind it in a side panel, with no dead-end numbers.
4. **Saved views as buttons**: ship three default views per page (for example "Month to date", "This job", "Overhead only") and let users save their own filter combinations as one-click chips.
5. **Figures as a typographic tier**: one money style (larger, tabular, slight negative tracking, line height 1.0, small medium-weight label 4px above), desaturated credit and debit colours, and colour reserved for exceptions.
6. **Insights as sentences tied to numbers**: a short "what changed" strip of alerts at the top of the tab, each one naming the figure, linking to its rows, and opening Ask with that question pre-filled.
7. **Honest totals by default**: intercompany and internal transfers are excluded automatically from revenue and cost, with a visible "excluded" toggle and the ability to exclude a one-off item from a chart.
8. **All companies as the home view**: a rollup of every entity's position on one screen that can be set as default and opens any company with one click, plus a statement or report download for all at once.

## 8. Avoid list

- **Cash only thinking.** Mercury's views are bank-transaction views with no accrual P&L, balance sheet, budget or job costing. Hub must keep statements and plan comparisons at the centre and borrow only the interaction model.
- **Dark-first marketing theatre.** The cinematic dark styling and glowing CTAs are a marketing-site look. A finance tab read daily needs a calm light default with dark as an option, as Mercury's own app does.
- **No export as a stance.** "No CSV exports needed" works for a bank. Hub's finance users hand work to lenders, owners and controllers, so a workbook and PDF must stay one click away.
- **Thin category control.** Users complain they cannot categorise finely enough. Hub should let the client's own chart of accounts and job structure drive grouping, never a fixed category list.
