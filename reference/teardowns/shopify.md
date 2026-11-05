# Teardown: Shopify Admin Analytics (retail)

Researched 2026-11-05 from public sources only (Shopify blog, Help Center, changelog, shopify.dev, Shopify Engineering, community forum, third-party guides). No account, trial or form was used. Where a detail comes only from a vendor or a forum post it is marked as such. Details marked *(recalled, unverified)* come from general product familiarity and were not confirmed by a page fetched today.

## 1. Product shape

**Who it is for.** Every Shopify merchant, from a one-person shop to Plus brands. Analytics is included on every plan (*"Shopify Analytics' main features are available to merchants on any Shopify subscription plan"*, https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/new-analytics), with deeper custom reports and ShopifyQL gated higher up (third-party claim, Advanced plan, https://www.putler.com/?p=185069). It is an operator tool first and a finance tool second: sales, sessions, conversion and fulfillment lead, and the accounting view (Finances summary) sits inside Reports.

**Main screens.**
- **Analytics overview dashboard**: the landing screen. *"Key sales, sessions, and fulfillment metrics for your store, updated within about 1 minute"* (https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard). A grid of metric cards, an insights stream on top, targets as gauges.
- **Reports**: a library of prebuilt reports, each a chart over a table, each editable into a saved "exploration" (https://www.shopify.com/blog/new-analytics).
- **Report editor / ShopifyQL editor**: metrics, dimensions, filters, visualization type, date range, or raw ShopifyQL (https://shopify.dev/docs/api/shopifyql/latest).
- **Finances summary**: sales, payments, liabilities and gross profit for a date range, each section linking to its own report (https://help.shopify.com/manual/shopify-mobile-app/reports-on-mobile/).
- **Live View**: a real-time 3D globe or 2D map with live counters and a mini funnel (https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/live-view).
- **Sidekick**: the AI assistant docked beside reports, which writes ShopifyQL from a question and charts the answer (https://changelog.shopify.com/posts/turn-business-questions-into-analytics-reports-with-natural-language-queries).

**Navigation.** Analytics is one item in the admin left rail with Dashboard, Reports and Live View beneath it. The governing pattern is a three-step funnel: card on the dashboard, click it, land in the full report for that metric (*"Each card links to a related report"*, new-analytics help page). A custom report *"also creates a corresponding metric card"* on the dashboard, so dashboard and report library stay one system rather than two.

## 2. The financial view specifically

Shopify has no balance sheet and no cash flow statement. Its financial surface is a revenue-recognition ladder plus payments and liabilities. That is the honest scope, and it is worth noting because Hub must go further.

**The sales ladder (the spine of everything).** Gross sales, minus discounts, minus returns, equals net sales. Net sales plus shipping, plus taxes (and duties, fees) equals total sales. Reportpundit's worked example: gross 25,000, discounts 2,500, refunds 1,000, net 21,500, shipping 2,500, taxes 2,150, total 26,150 (https://www.reportpundit.com/guide/shopify-finance-summary-report). Live View defines Total sales the same way: *"Gross sales minus discounts, sales reversals, plus shipping and taxes"*. The dashboard carries this as a "Total sales breakdown" card listing each rung with its amount and change *(recalled, unverified)*.

**Finances summary layout.** Stacked sections for the chosen period: Sales (the ladder), Payments (by gateway, for matching bank deposits), Liabilities (gift cards outstanding, tips, US sales tax), and Gross profit (net sales less cost of goods, shown only when product cost is tracked). Every section links to the underlying report, and Payments links to one report per payment method (help page above, and Reportpundit). Refunds are recognised on the refund date, not the order date, which moves figures between periods (Reportpundit).

**Top of the dashboard.** Since April 2026 an insights stream sits above the cards: *"top 5 findings, ranked by business impact"*, each carrying a badge (Trending Up, Trending Down, Top Performers) and a "See why" link that opens the report with Sidekick already loaded with that finding (https://changelog.shopify.com/posts/data-driven-insights-now-appear-on-your-analytics-dashboard). Example insight wording: returning-customer sales up eight straight weeks, or a region that has just become the top seller. Another example insight states one-time order sales are on pace to beat last month, with a projected figure (https://www.shopify.com/ae/blog/analytics-spring-2026).

**KPIs on the default grid.** Gross and net sales, total sales over time, sessions, conversion rate, average order value, orders, returning customer rate, sales by channel, top products, fulfillment metrics (overview help page and blog). Each card is one number, a change versus the comparison period, and usually a small chart.

**Targets.** A metric target (for example $20,000 Online Store net sales for Q2) renders as a gauge showing percent complete, current against target, and days remaining, with a cumulative view tracking daily pace against the goal, added to the dashboard in one click (https://changelog.shopify.com/posts/set-and-track-targets-in-shopify-analytics, spring 2026 blog). The API derives status as In progress, Achieved, Not achieved or Upcoming (https://shopify.dev/changelog/analytics-metric-targets-now-available-in-the-graphql-admin-api).

**Chart types.** Line (time series, with comparison series), bar and stacked bar (for example orders by attribution source split by collection), horizontal bar for ranked lists, donut, single-metric cards, funnels (ShopifyQL VISUALIZE supports *"comparisons, trends, distributions, funnels, and single metrics"*, https://shopify.dev/docs/api/shopifyql/latest). Sidekick renders bar, line and donut (https://changelog.shopify.com/posts/sidekick-data-visualization-and-export-updates). Polaris Viz uses data-driven gradients: green rising toward the best values where more is good, red where more is bad (returns) (https://shopify.engineering/react-library-consistent-data-visualization).

**Tables.** Every report is a chart over a detailed table of the same data (new-analytics help page). The table is the source of truth and the chart is its summary.

## 3. Interaction

- **Time controls.** A date picker with presets including event presets like BFCM, plus a second comparison range selector (https://changelog.shopify.com/posts/improvements-to-selecting-date-ranges-within-shopify-reports). Comparison baselines are previous period or previous year (ShopifyQL `COMPARE TO previous_period`, `previous_year`, https://shopify.dev/docs/api/shopifyql/latest/syntax/compare-to). Comparison columns come back named, for example `comparison_net_sales__previous_year`.
- **Comparison display.** A headline value with the percent change against the prior period, for example a gross sales by day chart reading $306,005, up 12.4% (spring 2026 blog). The comparison series is drawn in grey beside the current series (third-party Polaris Viz guide, https://www.vibeindex.ai/skills/toilahuongg/shopify-agents-kit/shopify-polaris-viz).
- **Budget comparison.** None in the classic sense. Targets are the budget substitute. Industry benchmarks existed and were removed on 2026-05-19 (https://changelog.shopify.com/posts/benchmark-comparisons-in-analytics-will-be-removed-on-may-19th).
- **Drill-down.** Card to report (the report is the drill), report table rows by dimension, and Finances summary line to its own report. In Live View, clicking a metric name opens the legacy report.
- **Filters and segments.** Dimensions like sales channel, country, product, customer type, and since 2026 metafields and metaobjects as dimensions and filters (spring 2026 blog). GROUP BY, WHERE, ORDER BY and LIMIT build ranked panels in ShopifyQL. Store switching is per store in the admin, no consolidated multi-entity view outside Plus organization tools.
- **Narrative.** Three layers: auto-generated insights in plain sentences, chart annotations (theme deployed, app installed, products published, shown on hover, ShopifyQL `ANNOTATE`), and Sidekick for follow-up questions (*"What should I do next?"*).
- **Exports and automation.** CSV export from reports, Sidekick exports to CSV, JSONL, XML and Parquet, and Shopify Flow's "Get analytics data" action runs a ShopifyQL query on a schedule (for example 9:00 am, check gross sales against a threshold, post to Slack) (spring 2026 blog).
- **Dashboard editing.** Customize opens a Metrics library sidebar. Cards drag, resize, add and remove, and since August 2025 group into labeled sections such as sales versus marketing (https://changelog.shopify.com/posts/organize-your-analytics-dashboard-with-custom-sections, https://changelog.shopify.com/posts/customize-your-analytics-dashboard-to-focus-on-key-business-metrics).

## 4. Visual language

- **System.** Polaris. The analytics charts come from Polaris Viz, built because admin charts had drifted in *"line widths, dashed line styles, legend styles, background grids"*. A single Theme object owns colors, line styles, spacing and bar rounding, with Light and Dark defaults, and the series palette was chosen with Delta-E and contrast-ratio calculations so no pairing fails accessibility (Shopify Engineering, above). The repo is now archived, and the admin got another new look from 2026-09-15 with new color, typography, spacing and icons (https://community.shopify.dev/t/new-shopify-admin-look-what-does-it-mean-for-bfs-and-for-those-who-partially-migrated/37651).
- **Metric card anatomy** (shopify.dev pattern, https://shopify.dev/docs/api/app-home/patterns/compositions/metrics-card.md): label as a heading, then the value and a trend badge inline. Badge tones: up is `success` with an up arrow, flat is `warning` with no icon, down is `critical` with a down arrow. Several metrics in one card sit in columns separated by thin vertical dividers, collapsing to one column at 400px container width. The whole metric is clickable and links to its detail page.
- **Color.** Mostly neutral white cards on a light grey ground. One brand series color (the Polaris Viz guide names purple for current, grey for historical). Green and red are reserved for direction and for good versus bad gradients, not decoration.
- **Typography.** System sans stack, big tabular figures for the value, small grey labels *(recalled, unverified)*.
- **Density.** Medium. Cards hold one idea each. Reports are dense tables under one chart.
- **Status and variance.** Percent chips with arrow and tone. Targets use a gauge and days-remaining text. Insights use three named badges.
- **Motion.** The Live View globe is the signature motion: blue dots for sessions, purple dots for orders, drag, zoom and search, plus a streamer mode that hides numbers so the globe can be shown publicly (Live View help page). Elsewhere motion is restrained.
- **Empty and loading.** Not documented in sources found. Live View's known failure mode is silent zeros (customer behavior stuck at 0 while visitors show, https://community.shopify.com/t/why-isnt-my-live-globe-view-displaying-customer-behavior/282549). Gross profit simply does not appear when cost is not tracked, which is an empty state by omission.

## 5. What makes it premium, and what makes it useful

**Premium.**
- Live View's globe. It turns a sales counter into a sense of the business breathing, and the streamer mode shows Shopify knows merchants put it on a screen at events and BFCM.
- One visual grammar everywhere. Same card, same badge, same chart theme across dashboard, reports and Sidekick output, because one theme object owns it.
- Calm restraint: one accent, neutral surfaces, color only when it means direction.

**Useful (the thing users love).**
- Freshness. About one minute behind, so the number is trusted during a sale.
- The card is the door to the report. No dead tiles. Every figure opens its own table.
- The insights stream answers "what changed" before the merchant asks, ranked, capped at five, each one leading to the evidence.
- Targets with days remaining turn a budget into a pace the owner feels.
- Sidekick. One merchant: *"the new analytics is way better if you use sidekick"* (https://community.shopify.com/t/analytic-settings/421023).

## 6. Complaints and weaknesses

- **Percent without the number.** Merchants asked to *"bring back 'Compare to' figures and dates"*: the dashboard showed only percentage change, and *"we absolutely need percentages AND data"*. They also lost the previous-year comparison on Sales over time (https://community.shopify.com/t/request-bring-back-compare-to-figures-and-dates-in-analytics/377695).
- **Redesign broke habits.** *"Lots of people are complaining and are not happy about Shopify new Reports"*, missing reports, a linked thread with 72 replies (https://community.shopify.com/t/new-shopify-analytics-and-reports/400952).
- **Bookkeeping got thinner.** The redesign added charts but reduced detailed accounting sections such as liabilities and gift card data (Reportpundit, a vendor, so weigh accordingly).
- **Gross looks inflated and does not tie to payouts.** Discounts on a separate line make gross look high, and the 1099-K comes in lower because it counts processed payments only (https://reddit.sentinel-team.org/posts/1u1b4ng/snapshots/2026-06-10T08%3A42%3A46.097039Z, anecdotal).
- **Shallow for real analysis.** *"I couldn't do the data cuts I wanted"* (app review). Last-click attribution only. Custom reports gated by plan (https://www.putler.com/?p=185069).
- **No real finance statements.** No balance sheet, no cash flow, no budget versus actual, no multi-entity consolidation.
- **Reliability scares.** Analytics down for five days with support pointing to Google Analytics (community thread via search), a Live View map change before Black Friday that merchants hated (https://community.shopify.com/t/what-do-you-think-of-the-new-live-view-from-shopify/169001), and session metrics changing during a measurement rollout with no real change in traffic (overview help page).

## 7. Steal list

1. **Every figure is a door**: each KPI card on Hub's financial tab opens the full report for that metric (chart over the table of its source rows), and every custom report Hub saves automatically gets a card.
2. **Show the amount and the percent, always**: each card reads current value, comparison value with its dates, the difference in dollars, then the percent chip, fixing the exact complaint Shopify merchants filed.
3. **A ranked "what changed" strip at the top, capped at five**: plain-sentence findings with a direction badge (Trending up, Trending down, Top performer) and a "See why" link that opens the evidence report with the question preloaded.
4. **The P&L as a ladder card**: revenue to gross profit to net income drawn as stacked rungs (gross, minus each deduction, equals) with each rung's amount and change, each rung a link to its ledger lines, the way Shopify's sales breakdown runs gross to total.
5. **Budget as a pace gauge**: a target card showing percent complete, actual against budget, days left in the period and a cumulative pace line, with status computed as In progress, Achieved, Not achieved or Upcoming.
6. **Annotations on time charts**: markers for events that explain a spike (month closed, job awarded, price change, a new store opened), shown on hover.
7. **One theme object owns every chart**: current series in the brand color, comparison series in grey on the same axis, good-direction gradient in green and bad-direction in red, with tone tokens (success, warning, critical) shared by badges and charts.
8. **A live "today" view for retail**: a small real-time panel (sales today, orders, live sessions or tills, top stores) with a presentation mode that hides dollar figures for showing on a shared screen.

## 8. Avoid list

- **Percent-only comparisons and silent comparison loss.** Never drop the base figure or the comparison dates, and never let a redesign remove a comparison people relied on.
- **Hiding a line when its input is missing.** Shopify omits gross profit when cost is not tracked. Hub should show the line with a "cost not connected" state instead of letting it vanish.
- **A finance view that cannot tie to cash.** Shopify's gross versus payouts gap confuses owners. Hub's revenue figures must reconcile visibly to deposits and the ledger.
- **Novelty as the premium layer.** The globe is delightful but carries little decision value, and it broke trust when it changed before a peak. Spend the motion budget on clarity, not spectacle.
