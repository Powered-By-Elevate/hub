# Copilot Money teardown (for Hub's financial tab)

Researched 2026-11-05, read only (marketing site, help center, Apple Developer story, reviews). No account, no trial, no forms. Where a source is a sponsored post, a competitor's blog or a third-party design write-up, it is marked as such.

## 1. Product shape

**Who it is for.** Individuals and couples on Apple devices who want spending, budgets, investments and net worth in one place. iPhone, iPad, Mac and a desktop web app ([copilot.money](https://copilot.money)). Positioned on design: "Apple Design Awards Finalist" and App Store Editor's Choice ([Apple Developer](https://developer.apple.com/articles/copilot-money)), 4.8 stars from 31,000+ ratings ([copilot.money](https://copilot.money)). One plan, no tiers: the site lists $9 a month or $109 a year today, while 2026 reviews quote $13 a month or $95 a year ([copilot.money](https://copilot.money), [getfinny.app](https://getfinny.app/blog/copilot-money-review-2026)). Pricing has moved several times, which is itself a complaint (section 6).

**Main screens (tabs).** Dashboard (default home), Transactions, Cash Flow, Accounts, Categories (budgets), Recurrings, Investments, Goals, plus a Money Assistant (AI) with six "personalities" and a "Roast me" mode ([copilot.money](https://copilot.money), [help center index](https://intercom.help/copilotmoney/en/)). On iPad and Mac the tabs sit in a sidebar that one tap hides ([9to5Mac, sponsored](https://9to5mac.com/2024/10/31/copilot-money-review-ipad-cash-flow-tags/)). Users can reorder the tabs by dragging in Settings, Appearance, App sections ([Dashboard overview](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview)).

**Navigation logic.** Every dashboard card ends in a named link to the tab that owns its detail ("Categories >", "Recurrings >", "Cash Flow >", "view all >"), so the home page is a set of doors, not a dead end ([Dashboard overview](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview)). The web app lags: no Cash Flow tab, no Goals, no Month and Year in Review, no rules creation ([Web FAQ](https://help.copilot.money/en/articles/13157382-web-faq)).

## 2. The financial dashboard

**Order of cards on the Dashboard** ([Dashboard overview](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview)):

1. **The pace graph.** The single answer at the top: "Free to Spend", shown as a sentence-like figure ("$1,380 left"). Under it a month-to-date line: a dotted line is the ideal pace for the budget, a solid line is actual spend, and the solid line ends in a dot that marks today. Expected recurring bills are taken out so rent does not spike the line.
2. **To Review.** Newly imported transactions not yet marked reviewed, with a MARK AS REVIEWED action and inline edit. This makes the home page a work queue as well as a report.
3. **Budgets.** Only the categories that are "trending", meaning their non-recurring spend is a large share of their budget ([Dashboard FAQ](https://help.copilot.money/en/articles/10238054-dashboard-faq)). Not every category, only the ones that need attention.
4. **Upcoming.** Expected recurring transactions as a horizontally scrolling strip.
5. **Net This Month.** Income minus spending month to date against the same days last month, linking to Cash Flow.
6. A referral card (not relevant to Hub).

**Pace colour rule (precise, and worth copying)** ([Dashboard line colors](https://help.copilot.money/en/articles/10309907-dashboard-line-colors)):
- Ideal = current day divided by days in the month. Actual = spent divided by budget.
- Green: below the ideal pace.
- Light orange: ahead of pace by less than 20%.
- Dark orange: ahead of pace by more than 20%.
- Red: over the budget itself.

The same logic runs on Categories: current month bars change colour with spending rate, turn red over budget, past months are simply green (at or under) or red (over), and **outlined bars show spend still expected from recurrings** ([Categories overview](https://help.copilot.money/en/articles/9504513-categories-tab-overview)). That outlined-bar idea is a clean way to show committed but not yet posted cost.

**Cash Flow tab (the closest thing to a P&L)** ([Cash Flow overview](https://help.copilot.money/en/articles/9682232-cash-flow-tab-overview)):
- Three cards, in this order: **Net Income** (bar chart of income minus spend per period), **Spending** (stacked bars, each colour a category), **Income** (all income transactions).
- Each card has "View More" opening Key Metrics plus the breakdown (monthly totals, category breakdown with an Excluded Transactions section, or the full income list).
- Ranges: year to date, month to date, last 12 months, last 3 months, last 4 weeks. Data stops at today. Future-dated and unpaid recurring items are excluded, and the help text says plainly that totals can therefore differ from the Categories tab.
- Comparison: the prior period of the same length, drawn as a **dotted line** on the same chart. Month to date compares the same days of the previous month, never a full month against a partial one.
- An "excluded spend" toggle adds excluded transactions back for a truer cash view, and the Dashboard's Net This Month follows that setting.
- Reviewers describe year to date against the same period last year and weekly, monthly and yearly bases ([9to5Mac, sponsored](https://9to5mac.com/2024/10/31/copilot-money-review-ipad-cash-flow-tags/)).

**Balance sheet equivalent.** Net worth combines checking, savings, cards, investments and manually added real estate and assets, with a trend line and drill-down by account type ([copilot.money](https://copilot.money), [Penny Hoarder](https://www.thepennyhoarder.com/?p=225952)). There is no formal balance sheet statement, just assets and debts and a line.

**Investments** ([Investments overview](https://help.copilot.money/en/articles/5377645-investments-tab-overview)): a main chart that switches between Returns and Balances, a chosen benchmark overlay (S&P 500 ETF, total market, bonds, Bitcoin and others), live estimates drawn as a dashed line, then Top Movers, Accounts, Allocation and Holdings. Every section below the chart follows the chart's timeframe, so one control sets the whole page. Turning an account off removes it from every section at once.

**Month and Year in Review** ([help](https://help.copilot.money/en/articles/10310024-month-and-year-in-review)): a slide deck summary of spending, income, investments and trends at each month and year turn, each slide shareable. A narrative layer delivered as a ritual, not a report menu.

## 3. Interaction

- **Time controls.** One date range bar per tab (top on Mac and iPad, bottom on iPhone for the thumb). A small fixed preset list rather than a free date picker ([Cash Flow overview](https://help.copilot.money/en/articles/9682232-cash-flow-tab-overview)).
- **Comparison.** One toggle, prior equal-length period, drawn as a dotted ghost of the same series. No budget-versus-actual on Cash Flow. Budget comparison lives in the pace line and the category bars instead.
- **Drill-down.** Three levels on one gesture vocabulary: hover a bar on Mac to see its value and the comparison value, click to open that bar's range broken into categories and then transactions. On iPhone, tap for the value, double-tap for the breakdown ([Cash Flow overview](https://help.copilot.money/en/articles/9682232-cash-flow-tab-overview)). The chart is the navigation, not a picture beside it.
- **Segment switching.** Tags with colours (income sources, stores, trips) slice transactions across categories ([9to5Mac, sponsored](https://9to5mac.com/2024/10/31/copilot-money-review-ipad-cash-flow-tags/)). Accounts toggle in and out of Investments. There is no entity switching, it is a single person (households "coming soon").
- **Commentary.** Two routes. The AI assistant answers questions, suggests budget changes and "always asks before acting" ([copilot.money](https://copilot.money)). The Review decks carry the story at period turns. Help text also explains odd readings in plain words, for example that a negative net income early in the month means no income has landed yet ([Dashboard FAQ](https://help.copilot.money/en/articles/10238054-dashboard-faq)).
- **Exports and reports.** Thin. Review slides are shareable images. An MCP connector exists for AI tools ([help index](https://intercom.help/copilotmoney/en/)). Reviewers ask for more reporting ([search summary of reviews](https://www.fincomparelab.com/reviews/copilot-money-review/)).
- **Keyboard.** The web Transactions tab has shortcuts to move, select, mark reviewed and recategorise ([Web FAQ](https://help.copilot.money/en/articles/13157382-web-faq)).

## 4. Visual language

From a third-party design analysis ([blakecrosley.com](https://blakecrosley.com/guides/design/copilot-money)), so treat the hex values as measured by an outsider, not published by Copilot:
- **Never pure black.** Canvas `#000814`, a near-black navy. Surface steps by tint instead of borders: cards `#001533`, modals and active panels `#00204D`, recessed areas `#010D1E`.
- **Text.** Primary white at 90% opacity, secondary `#7F8BA4`, muted `#597CAA`.
- **Semantic data colours, fixed across the app.** Income green `#00CC4B`, spending red-orange `#FF4433`, pending and warning yellow `#FECE4C`, net and interactive accent blue `#1C6CFF`. Apple's own screenshot is described as red, green and blue charts on white ([Apple Developer](https://developer.apple.com/articles/copilot-money)), so the three-colour data grammar holds in light mode too.
- **Type.** System font (SF), very large display figures with tight negative tracking (marketing: 112px, tracking -2.24, line height 0.9). The hero number is the design.
- **Density.** Low on the home page by intent (progressive disclosure: summary cards and progress bars, never a transaction grid first), denser in the drill sheets. Reviewers name "typography, motion, color, and information density" as the reason it wins ([getfinny.app](https://getfinny.app/blog/copilot-money-review-2026)).
- **Status and variance.** Shown as colour on the line or bar itself (the pace scale above), ghost dotted lines for prior period and ideal pace, dashed for estimates, outlined bars for expected spend. Line style carries meaning: solid is fact, dotted is a reference, dashed is an estimate.
- **Motion.** Swift Charts rendered natively with gesture-driven selection and smooth transitions. No published timings. The team: "We tend to do things very custom. We're very picky when it comes to the design," and that it is all native, "we just tweak it a lot" ([Apple Developer](https://developer.apple.com/articles/copilot-money)). Responsiveness comes from data kept locally ("all the data is kept locally, so the app is really responsive").
- **Empty and loading.** Not documented. The notable related pattern is honesty about partial periods (month to date compared with the same days last month, the early-month negative net income note).

## 5. What makes it premium, and what makes it useful

**Premium.** One hero number in very large type, a dark navy ground with tinted surfaces instead of boxes, three data colours used with total consistency, charts that answer the finger or cursor immediately, and a small set of line styles that each mean one thing. It feels native because it is ([Apple Developer](https://developer.apple.com/articles/copilot-money)). Reviewers repeatedly say it "feels good to open" and rewards regular check-ins ([Penny Hoarder](https://www.thepennyhoarder.com/?p=225952)).

**Useful.** The page answers "am I on track right now" before anything else, with pace rather than a raw total, and colours that tell you how far off you are. Expected recurring costs are separated out so the line is not distorted. The home page shows only the categories that need attention. The review queue turns the dashboard into a weekly habit, which reviewers credit for building a routine ([9to5Mac, sponsored](https://9to5mac.com/2024/10/31/copilot-money-review-ipad-cash-flow-tags/)). Categorisation learns from corrections ([Penny Hoarder](https://www.thepennyhoarder.com/?p=225952)).

## 6. Complaints and weaknesses

- **Apple only**, no Android, so mixed households cannot share it, and no joint multi-login yet ([Penny Hoarder](https://www.thepennyhoarder.com/?p=225952), [getfinny.app](https://getfinny.app/blog/copilot-money-review-2026)).
- **Web app is a lesser product**: no Cash Flow, Goals or Reviews, and users report the web and phone showing different budget categories ([Web FAQ](https://help.copilot.money/en/articles/13157382-web-faq), Reddit snapshots via search). Platform parity failure.
- **Sync reliability** with smaller banks, late, duplicated or miscategorised transactions, and no way to correct bad aggregator data ([pocketclear.app, a competitor](https://pocketclear.app/blog/leaving-copilot-money.html)).
- **Price changes** and renewals at higher rates ([pocketclear.app, a competitor](https://pocketclear.app/blog/leaving-copilot-money.html)).
- **Shallow underneath the polish**: investment analysis "less deep than the visuals suggest", light budgeting with no zero-based mode, limited reporting and customisation ([Penny Hoarder](https://www.thepennyhoarder.com/?p=225952), [getfinny.app](https://getfinny.app/blog/copilot-money-review-2026)).
- **Totals that disagree between tabs** by design (Cash Flow excludes future and unpaid recurring items, Categories does not), explained only in help text ([Cash Flow overview](https://help.copilot.money/en/articles/9682232-cash-flow-tab-overview)).

## 7. Steal list (for Hub's financial tab)

1. **Lead with one pace number.** Open the financial tab on a single large figure stated as a sentence ("$412K of margin left to plan this year") with a month-to-date line where a dotted line is the ideal pace from budget and a solid line ends in a dot at today.
2. **The four-step variance colour scale.** Colour the actual line or bar by pace against plan: green below pace, light orange ahead by under 20%, dark orange ahead by over 20%, red past the budget, with the rule written in the tooltip.
3. **Line style grammar.** Solid for posted actuals, dotted for prior period and plan, dashed for forecast or estimate, outlined bars for committed cost not yet posted (open POs, scheduled payroll, recurring bills), held identical on every chart.
4. **Prior period as a ghost on the same chart.** One comparison toggle that draws last period (same days for a partial month, never a full month against a partial one) as a dotted overlay, with both values in the hover.
5. **The chart is the drill.** Hover a bar for its value and comparison, click it to open that period split by account or job, then click a row to see the transactions, all in one sheet without leaving the page.
6. **Show only what needs attention.** The home cards list the jobs, stores or expense lines whose spend is running ahead of plan, each linking by name to the tab that owns its detail ("Job portfolio >").
7. **One timeframe control drives the whole page.** A small fixed preset set (MTD, YTD, last 3, last 12, same period last year) where every card and table below follows the head chart, and excluding an entity or account removes it everywhere at once.
8. **A period-turn review.** At each month close, a short slide sequence (revenue, margin, cash, the biggest movers, what changed) that a controller can share, which is the narrative layer made into a ritual.

## 8. Avoid list

1. **Platform drift.** Copilot's web app lacks its own Cash Flow tab and shows different figures from the phone. Hub must render the same numbers on every surface from one engine.
2. **Silent disagreements between tabs.** Do not let two pages total the same thing differently and explain it only in help docs. If a figure excludes something, the page says so beside the figure.
3. **Polish over depth.** Reviewers notice when visuals promise analysis that is not there. Every Hub chart must open to the ledger lines that make it.
4. **Gimmick voice.** Assistant personalities and "Roast me" suit a consumer app, not a controller reading a margin.
