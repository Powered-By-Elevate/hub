# Toast reporting and analytics: teardown

Researched 2026-11-05 from public sources only (Toast support center, Toast press, App Store listing, Capterra and community excerpts). No account, trial or form was touched. Several Toast marketing and review pages returned 403 to the fetcher, so the help center carries most of the weight, and where a source was silent this file says so rather than guessing.

## 1. Product shape

Toast is a restaurant POS whose reporting lives in two surfaces:

- **Toast Web** (desktop back office). Reports sit under a top menu by domain: Sales, Labor, Menus, Benchmarking, Accounting, Location reports. The default view when you open Reports is the **Weekly Overview** dashboard ([Toast Reporting Dashboard: Weekly Overview](https://intercom.help/toast-central/en/articles/14728163-toast-reporting-dashboard-weekly-overview)). The Toast Web homepage itself carries a real-time snapshot of net sales, hourly labor cost percentage and discounts, flippable between today and yesterday, plus Quick actions that jump to reports such as Sales summary ([Reporting Best Practices: Your First Day](https://support.toasttab.com/en/article/Reporting-Best-Practices-Reports-to-Use-After-Your-First-Day-on-Toast?lang=en_US), [Sales Summary Report](https://support.toasttab.com/en/article/Sales-Summary-Report)).
- **Toast Now** (iOS and Android owner app). Opens on a multi-location view for anyone with more than one store, then each store's homepage: a date bar, net sales and labor charts, a grid of operational cards, the manager log and takeout toggles ([Get Started With the Toast Now App](https://support.toasttab.com/en/article/Get-Started-with-the-Toast-Now-App)).
- **Toast IQ** (AI assistant, expanded October 2025). Opens from the top-left of the Toast Web nav or the bottom bar of Toast Now, has a proactive "For You" feed and answers plain-language questions with downloadable tables ([Toast IQ Overview](https://support.toasttab.com/en/article/Toast-IQ-Overview)). Toast says the most used prompt in its first 90 days was a request for a short daily briefing ([Business Wire, 2026-06-10](https://businesswire.com/news/home/20260610036506/en/90-Days-with-Toast-IQ-How-Restaurant-Operators-Are-Using-Toast-IQ-to-Find-Time-Protect-Margins-and-Grow)).
- **Push to inbox**: Daily and Weekly Performance Summary emails at 9 a.m. ET ([Performance Email FAQ](https://support.toasttab.com/en/article/Weekly-Performance-Summary-Email-FAQs?lang=en_US)).

Who it is for: owners, GMs and multi-unit operators who think in a business day, a shift and a week, not in a month-end close. Every screen is gated by numbered permissions (4.1 Sales Reports, 4.3 Labor Reports, 4.20 Benchmarking), and in Toast Now the cards you see are literally the permissions you hold: a user with only inventory rights sees only the Stock card ([Toast Now](https://support.toasttab.com/en/article/Get-Started-with-the-Toast-Now-App)).

## 2. The "financial dashboard"

Toast has no P&L, balance sheet or cash flow statement. Its financial view is a sales and labor operating view, and costs outside the POS (food purchases, rent, utilities) are invisible to it ([sagnikbhattacharya.com](https://sagnikbhattacharya.com/blog/restaurants-toast-iq-cannot-answer)). COGS and gross margin appear only if item costs are maintained ([Accounting Reports Overview](https://support.toasttab.com/en/article/Accounting-Reports-Overview)). That gap is itself a finding: it is why operators export to QuickBooks or Restaurant365 ([Toast community, R365 thread](https://community.toasttab.com/t5/back-office-team/toast-reporting-with-restaurant-365/m-p/1927)).

What Toast does present:

**Weekly Overview (default reports landing).** A Key Metrics band at the top: Net Sales, Labor Cost, Guest Count, Net Sales for Top Selling Items. Below it four sections, each with a total and percent change against the chosen comparison. Labor shows dollars AND percent of sales together. Today is highlighted in grey inside the week. Top Selling Items is a short list of seven with average daily quantity, net sales and percent change. Refreshes hourly ([Weekly Overview](https://intercom.help/toast-central/en/articles/14728163-toast-reporting-dashboard-weekly-overview)).

**Sales Summary (the "day to day financial view").** One scrolling page ([Sales Summary Report](https://support.toasttab.com/en/article/Sales-Summary-Report)):
- Sales Trends pinned at the top: three bar charts, sales by date, by day of week, by time of day, with hover popups.
- Then summary cards: Revenue Summary (gratuity, tax, tips, deferred, paid total, total revenue), Net Sales Summary (gross sales, discounts, refunds, net sales, a small waterfall in table form), Tip Summary, Unpaid Orders, Sales Category, Revenue Center, Dining Option, Service/Daypart, Tax, Service Charge, Void, Cash, Cash Activity, Payments Summary (table by tender with a Columns picker), Service Mode Summary (averages per guest, payment and order, plus turn time). A Deferred card appears only when the period has deferred sales.
- Cards with a caret drill to a deeper report.

**Product Mix (PMIX).** A table, no charts. A Menu hierarchy picker sets the nesting (menu, group, subgroup, item, modifier), rows collapse and expand, a Show percentages toggle shows each row's share of its parent, and with costs set up the columns include COGS, gross profit and gross margin ([PMIX Report Overview](https://support.toasttab.com/en/article/Product-Mix-PMIX-Report-Overview?lang=en_US)).

**Labor.** Labor Cost Breakdown (labor %, SPLH, cost by job, employee, hour, day, week), Hourly Sales in 15-minute intervals with labor as % of net sales per interval, Labor Summary, Employee Productivity and a dozen operational logs ([Labor Reports Overview](https://support.toasttab.com/en/article/Labor-Reports-Overview?lang=en_US)). Labor % is labor cost over net or gross sales by a report setting, salaried jobs excluded.

**Toast Now homepage.** Two bar graphs (net sales, labor cost) for the chosen day. With Comparison on, prior period bars render grey beside today's, with a green or red arrow and the percent change. Below, cards: Team (who is clocked in), SPLH, Guests, Avg/Guest, Orders, Avg/Order, Item Sales, Stock, Refunds, Voids, Discounts, Labor Cost, Checks. Net sales detail filters by hour, week, daypart, employee, revenue center, sales category and dining option. Labor detail can overlay net sales in a chart or table ([Toast Now](https://support.toasttab.com/en/article/Get-Started-with-the-Toast-Now-App)).

**Multi-location.** Toast Now's first screen lists each store with net sales, labor % and SPLH, but shows no combined total. In Toast Web, Location Overview gives a real-time per-location sales and labor table with Compare Dates, custom Columns and Show Percentages (each store's share of the total), and Location Breakdown builds a tab per location on a 96-hour delay ([Location Reports Overview](https://intercom.help/toast-central/en/articles/14728162-location-reports-overview)). Benchmarking's Group overview puts group totals for Net sales, Order volume, Avg check and SPLH in cards, with a down arrow on each card revealing the best and worst location's figure, then a location table with YoY trend against a peer group of similar nearby restaurants, filtered by service model, cuisine, price range and alcohol mix ([Benchmarking Multi-Unit Group Overview](https://support.toasttab.com/en/article/Toast-Benchmarking-Multi-Unit-Group-Overview), [Benchmarking Overview](https://support.toasttab.com/article/Toast-Benchmarking-Overview)).

## 3. Interaction

- **Time.** Toast Web: presets (today, yesterday, this week) apply instantly, a custom range needs Apply, no range limit ([Sales Summary](https://support.toasttab.com/en/article/Sales-Summary-Report)). Toast Now: one day only, stepped with arrows, a calendar, and a one-tap "back to today" icon. Data shown to the nearest whole hour in the store's time zone. Pull to refresh.
- **Comparisons.** The signature move. Toast Now's Comparison toggle is on by default: same day last week, last year, or two years ago. The emails use SDLW (same day last week), SWLY (same week last year) and the 4-week average of the same weekday, and the weekly email adds a forecast for the coming week's net sales against last week and SWLY ([Performance Email FAQ](https://support.toasttab.com/en/article/Weekly-Performance-Summary-Email-FAQs?lang=en_US)). PMIX puts two periods in adjacent columns when Compare is on. Budget comparison does not exist, and there is no scheduled vs actual labor ([Labor Reports Overview](https://support.toasttab.com/en/article/Labor-Reports-Overview?lang=en_US)).
- **Drill-down.** Every headline number is a link to the report that produced it: net sales opens Sales, labor cost opens Labor Summary, top item net sales opens Menu Breakdown, guest count opens Guest Information ([Weekly Overview](https://intercom.help/toast-central/en/articles/14728163-toast-reporting-dashboard-weekly-overview)). Sales Summary cards with a caret open Sales Breakdown, Voided Orders, Cash Drawer History and Payments. In Toast Now, tapping an employee shows their sales by hour and tapping an item shows its modifiers.
- **Filters.** A consistent pattern across reports: date, compare and location dropdowns in the top bar, then a More filters side panel (service hours, day of week, revenue center, service area, dining option, source, employee, item tags), with the ability to **pin** a filter to the top bar, Apply and Clear all ([PMIX](https://support.toasttab.com/en/article/Product-Mix-PMIX-Report-Overview?lang=en_US), [Location Reports](https://intercom.help/toast-central/en/articles/14728162-location-reports-overview)).
- **Layout control.** A gear opens Report settings where cards can be dragged into a new order or reset, with Sales Trends fixed at the top. The layout is per browser and does not travel to exports ([Sales Summary](https://support.toasttab.com/en/article/Sales-Summary-Report)).
- **Commentary.** The manager log is a human narrative attached to a date: it sits under the cards on the Toast Now homepage, supports replies, and rides inside the Daily Performance Summary email ([Toast Now](https://support.toasttab.com/en/article/Get-Started-with-the-Toast-Now-App)). Machine narrative comes from Toast IQ's For You feed (shifts in item sales, local events).
- **Exports.** Email or download icons top right, CSV or multi-sheet XLS, following active filters but not layout. PMIX exports only the columns scrolled into view.

## 4. Visual language

Public sources describe behaviour more than pixels, so this section separates documented from not documented.

Documented:
- Comparison as **grey ghost bars** beside the current period's bars, with a **green or red arrow plus percent** as the variance signal ([Toast Now](https://support.toasttab.com/en/article/Get-Started-with-the-Toast-Now-App)).
- Today highlighted in grey inside a week strip ([Weekly Overview](https://intercom.help/toast-central/en/articles/14728163-toast-reporting-dashboard-weekly-overview)).
- Cards as the universal unit: a titled card holding a short label/value ledger, a caret where it drills.
- Conditional cards: a card (Deferred) appears only when it has something to say, rather than rendering an empty zero.
- Permission-shaped layout: what you cannot see is absent, not greyed.
- Interface built on Buffet, Toast's cross-platform component library across web, Android and iOS ([Toast careers posting](https://careers.toasttab.com/jobs/senior-staff-frontend-engineer-dublin-county-dublin-ireland)), which is why Toast Web and Toast Now share a card grammar.

Not documented in any reachable source: typefaces, exact palette (beyond the well-known Toast orange brand), spacing scale, motion, and loading states. One App Store reviewer says the iPhone layout cuts off lines and text and the admin dashboard shows too much unnecessary information ([App Store](https://apps.apple.com/us/app/toast-now/id6444586410)), so density is a known weak spot.

## 5. What makes it premium and useful

It is useful far more than it is luxurious. What users love:
- **The comparison is always there.** Same day last week, last year and two years ago, on by default, is the feature App Store reviewers praise most, and it is what makes one day's number mean something ([search summary of App Store and Apptail reviews](https://apptail.io/app/toast-now-yiYn/united-states)).
- **Live and in the pocket.** Hour-by-hour sales and labor, who is clocked in, 86 an item, pause DoorDash, all from the phone. Toast says beta users logged in about three times more often than web portal users, and one group rolled it out to HR and marketing too ([Restaurant Technology News](https://restauranttechnologynews.com/2023/11/toast-launches-new-mobile-app-designed-to-boost-restaurant-efficiency-and-enhance-control/)). 4.9 stars on about 12K ratings ([App Store](https://apps.apple.com/us/app/toast-now/id6444586410)).
- **Labor beside sales.** Labor in dollars and percent of sales together, SPLH as a first-class KPI, and a toggle that overlays sales on labor by hour. The ratio is the operator's real question.
- **Every number is a door.** Headline figures link to the report that built them.
- **Peer benchmarking.** Your store against similar restaurants nearby, with best and worst location one tap under each group card.
- **The 9 a.m. email.** The answer arrives before anyone opens the app, with SDLW, SWLY and 4-week average, plus a forecast for next week.

## 6. Complaints and weaknesses

- **One day at a time on mobile.** No week to date or month to date in Toast Now, a repeated owner request ([Toast Now](https://support.toasttab.com/en/article/Get-Started-with-the-Toast-Now-App), [Apptail reviews](https://apptail.io/app/toast-now-yiYn/united-states)).
- **No combined multi-location total** in Toast Now, and Location Breakdown runs four days behind ([Location Reports](https://intercom.help/toast-central/en/articles/14728162-location-reports-overview)).
- **Numbers that disagree.** Toast itself warns that dashboard net sales can differ from other reports because refunds, fees, service charges and unpaid orders are treated differently, and Benchmarking sales ignore post-order adjustments ([Weekly Overview](https://intercom.help/toast-central/en/articles/14728163-toast-reporting-dashboard-weekly-overview), [Benchmarking FAQ](https://support.toasttab.com/en/article/Toast-Benchmarking-FAQ)).
- **Not a financial system.** No P&L, no budget, food cost only if inventory costs are kept, no scheduled vs actual labor, no FOH/BOH split.
- **Advanced and multi-location depth.** A Capterra reviewer: basic tracking works but "more advanced inventory controls and reporting tools would make a big difference, especially for multi-location operations" (via [Capterra](https://www.capterra.com/p/136301/Toast-POS/reviews/?page=2)). Another calls the reporting "weak at best" ([Capterra](https://www.capterra.com/p/136301/Toast-POS/reviews/?page=5)).
- **Exports go stale and are clumsy.** Data exports do not update when a past day is edited ([Data Exports Overview](https://intercom.help/toast-central/en/articles/14725429-toast-data-exports-overview)), PMIX exports only the columns scrolled into view, layout never travels to the export, and a community thread on CSV deficiencies says Toast indicated fixes could be months or years out ([Toast community](https://community.toasttab.com/t5/restaurant-operations/critical-reporting-deficiencies-csv-exports-toast-catering-menu/m-p/14915)).
- **Layout that does not follow you.** Card order is per browser.
- **Sprawl.** Thirteen labor reports alone, several legacy and current versions of the same report with different numbers (Employee Productivity, Time Entry), and naming drift (Menu Breakdown vs PMIX vs Item Details).

## 7. Steal list

1. **Ghost comparison bars**: draw the comparison period as muted grey bars directly behind or beside the current period, with one green or red arrow and a percent, and make that comparison on by default on every chart.
2. **Named comparison basis, chosen per view**: offer "same period last year", "prior period", "4-period average" and "budget" as one dropdown beside the date control, and print the chosen basis in the KPI footnote (Toast's SDLW, SWLY, 4-week average, with budget added since Toast lacks it).
3. **Cost shown in dollars and as a percent of revenue together**: every cost KPI (labor, COGS, overhead) carries its dollar figure and its ratio to revenue in one tile, plus a revenue-per-unit-of-input metric like SPLH (revenue per labor hour, per job, per square foot).
4. **Every figure is a link to its source**: each headline number opens the exact report or ledger that produced it, and each card with a deeper view shows a caret.
5. **Group card with best and worst underneath**: a consolidated KPI card for the whole group with a disclosure that reveals the best and worst entity's value, and an entity table below with each entity's share of the total as a toggleable percent column.
6. **Cards that appear only when they have something to say**: hide a section (deferred revenue, unpaid invoices, intercompany) when the period holds nothing, rather than rendering a zero card.
7. **Pinnable filters and a draggable card order that persists per user** (stored server side, unlike Toast's per-browser layout), with the key trend chart fixed at the top.
8. **A dated human note attached to the period**: a manager or controller log that sits under the KPIs for the chosen period and rides inside the scheduled email, next to a short machine briefing.

## 8. Avoid list

- **Several definitions of the same number.** Toast's dashboard, reports and benchmarking disagree on net sales by design. Hub should have one definition per measure, and where a view must differ, say so on the figure.
- **Report sprawl and legacy twins.** Thirteen labor reports and old and new versions with different totals. Hub should condense into one tab with drill paths, not a menu of near-duplicate reports.
- **Single-day-only mobile views and no consolidated total.** Always offer period-to-date and a group total.
- **Exports that drop layout or go stale.** An export should be the view as seen, recomputed on request.
