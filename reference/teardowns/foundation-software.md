# Foundation Software (FOUNDATION): teardown

Researched 2026-11-05, read only. Platform: FOUNDATION construction accounting (foundationsoft.com), its Executive Dashboard module, ExecutiveHQ (the web dashboard in the HQ Suite) and its job cost and WIP report family.

**Source quality, stated plainly.** Foundation publishes almost no screen-level documentation in public. The richest primary source is the vendor's own *Sample Job Costing Report Book* (2024 PDF, https://www.foundationsoft.com/wp-content/uploads/2024/04/2024-04_FOUNDATION-SampleJobCostingReportBook_.pdf), which carries a real screenshot of the Executive Dashboard and full column layouts of eight reports. I rendered its pages and read the screenshot directly, so the visual description below is measured, not inferred. Capterra, G2, TrustRadius and the AI roadmap press release returned 403 to the fetcher, so review findings come from search snippets of those pages plus SoftwareConnect. The web search budget for the turn ran out before a YouTube demo could be found, so no video was watched.

---

## 1. Product shape

- **Who it's for:** US contractors, mostly small and mid-size general and specialty trades, who need job costing, construction payroll (certified, union, multi-state) and AIA billing in one system. Marketed as "America's #1 Construction Accounting Software" (https://www.foundationsoft.com/?p=19000).
- **Two generations of product side by side:**
  - **FOUNDATION** itself, a Windows desktop client (cloud hosted or on premise) with modules: GL, Consolidated GL, AP, AR, Job Costing, PO and Subcontracts, Payroll, Equipment, Service Dispatch, T&M and Unit Price Billing, DataGenie Report Designer, and the **Executive Dashboard** add-on (https://www.foundationsoft.com/?p=19000).
  - **The HQ Suite** (ProjectHQ, ExecutiveHQ, CrewHQ, SafetyHQ, hrHQ), newer web products. ExecutiveHQ is "a standalone dashboard that consolidates job and financial data in one centralized location" with "Project WIP schedules to help monitor project profitability and progress" (https://www.myhqsuite.com/?p=20997). The "sort and filter job reports by project manager" feature is listed under ProjectHQ.
- **Navigation in the Executive Dashboard** (from the screenshot in the report book, page 2): a classic Windows window with File / View / Report / Help menus, a toolbar of small icons, then a **row of tabs across the top: Criteria, Job Cost, Change Orders, Financials, Cash, Payables, Receivables, Report**. Each tab is one dashboard view. The vendor page confirms the views: "job costing, change orders, over/under billing (WIP), cash flows, payables, and receivables" and that "convenient report tabs" let you navigate back after drilling (https://www.foundationsoft.com/?p=1603).
- **The Criteria tab comes first.** Filters are a tab of their own, set before you look, rather than chips on the page.

## 2. The financial dashboard

### The Job Cost tab (the one screenshot that exists)

Measured off the report book screenshot:

- **A black header band** with the view name in thin, wide-tracked caps: "JOB COSTS".
- **Left half, a dark charcoal panel** titled "BILLING & PROFIT TOTALS:" in light thin caps. It holds a vertical bar chart on a near-black ground with a faint gridline per $200,000 (axis $0 to $4,000,000). Bars are paired by measure: a tall gold bar and a shorter gold bar, a blue bar and a shorter blue bar, and a small green bar. They are glossy, with a lighter top fading darker toward the base. This is billing to date versus cost versus profit at company level.
- **Right half, a light panel** titled "Job List" with a black pill button "VIEW REPORT" top right. Columns: **JOB#**, **NAME**, then per row a tiny two-line label "ESTIMATE: $xxx / ACTUAL: $xxx" beside **two thin horizontal bars stacked** (a grey bar for estimate, a coloured bar for actual, both on the same scale), then a **rounded percent-complete pill** at the far right (e.g. 56%, 73%, 100%, 30%).
- **Pill colour carries status**: gold for most jobs mid-progress, blue for one, purple for the job at 100%, green for the job at 30%. The legend is not shown in the screenshot, so the exact rule is not published. Bar colour matches the pill colour on the same row, so one hue ties the row together.
- **Zebra rows** in very light grey, generous row height (roughly two text lines), job names in small bold dark type.

Vendor feature list for the same page: "Job-by-job estimate vs. actual · Graphical billing and profit totals · Percent complete charts · Custom job cost structures · Imports from third-party estimating" (report book p.2).

### The drill path (the real product)

The dashboard is a doorway into reports. From the chart, "zoom in from high-altitude graphs and charts" to open the relevant report, and drill "even down to individual invoices" (https://www.foundationsoft.com/?p=1603), "down to individual transactions and invoice images" (https://www.foundationsoft.com/software/general-ledger/). The report book names the chain from a job (p.3, "DRILL DOWN INTO"): **Job cost detail · Job summary to date · Change order detail · Job budget list · Contract receivables · Job cost history detail**.

The **Job Summary** for one job (97091 Midwest Turnpike) is a single page in blocks:
- *Job to Date:* Billed to Date 224,800 · Cost to Date 193,374.52 · Gross Margin 31,425.48 · Percent Complete 43.02% · Over/Under Billing 10,560.29.
- *Contract Information:* Contract 498,000 · Change Orders · Revised Amount. *Estimated Costs* 449,500 · *Profit* 48,500.
- *Committed Information:* Original PO/Subs 190,000 · Change Orders 18,500 · Revised Committed 208,500 · Invoiced 127,000 · Remaining 81,500 · Paid 79,000.
- *Client* and *Job* address blocks.
- Inline links on the page itself: "Click Here for Committed PO Detail", "Click Here for Committed Cost Summary", "Click Here for Change Order Detail", "Click Here for Billing Detail", "Click Here for Job Cost Detail". The drill targets live next to the figure they explain.

Then **Job Cost by Cost Code** (Estimated / Actual / Remaining for both cost and quantity, with U/M per line), **by Cost Code/Class** (each code split into Labor, Materials, Subs, Owned Equipment, Burden, with hours alongside dollars), and finally **Job Cost History Detail** (each payroll line: date, employee, trade, earning code REG or OTI1, hours, cost, source P/R).

### The WIP report (Over/Under Billing)

Report book p.6. The column headers **carry their own formulas as letters**:

| Contract A | Est-Cost B | Profit C=A−B | Tot-Cost D | % Cmp E=(D/B)×100 | Profit F=(A×E/100)−D | Billing G | Billings Over Cost H=G−D | Over/Under Billing I=H−F |

One row per job, a totals row, negatives shown with a minus sign. "Post automatic over/under billing adjustments right from inside the report" (p.7), so the WIP report is also where the month-end entry is made.

### Other financial views

- **Cash Flow by Job:** Contract, Total Est Costs, Est Gross Profit, Billings to Date, Costs to Date, Cash Collected to Date, A/P Cash Paid, P/R Cash Paid, **Net Cash Flow** per job (p.7). Cash is shown job by job, not only company wide.
- **Job Overhead Allocation:** Total Income, Mat/Sub, Labor, Other, Total Costs, Gross Profit, Profit %, Ovhd % (based on labor), Allocated Overhead, Net Income, Income %, with an "Unallocated Overhead" line that must read 0.00 (p.8). Net margin after overhead, per job.
- **Job Variance:** per cost code, Estimated Cost, Cost to Date, Variance, Est Hours, Hours to Date, Variance Hours, with job totals (p.8).
- **Billing Backlog:** Original Contract, Revised Estimated, Income to Date, Income Current, Cash Received to Date, Cash Received Current, Backlog (p.9).
- **Committed Costs:** Committed Original, Change Orders, Committed Revised, Invoiced, Committed Remaining, Paid to Date (p.10).
- **Financial statements:** GL with a "flexible financial statement designer", account budgets "for any length of time", "comparative financials", consolidated GL across companies (https://www.foundationsoft.com/software/general-ledger/, https://softwareconnect.com/reviews/foundation-construction-accounting/). P&L and balance sheet are report outputs, not dashboard tiles. There is no evidence of a designed statement view.

## 3. Interaction

- **Time:** "Run reports instantly for any date range" (report book p.1). Every report prints "As of: date" under its title. The dashboard itself shows to-date figures.
- **Comparisons:** estimate versus actual is the native comparison everywhere (dollars, hours and quantities). Budget versus actual on the GL through account budgets and comparative financials. Prior year comparison is not described for the dashboard.
- **Drill-down:** chart, then report, then report, then transaction, then invoice image. Report tabs keep the trail so you can go back (https://www.foundationsoft.com/?p=1603).
- **Filters:** by project manager, project class, or job. Include or exclude **bid jobs and overhead jobs**. Change orders and POs filtered by status (https://www.foundationsoft.com/?p=1603).
- **Security as a filter:** "PM-security" can "restrict user accounts to show just the jobs they're assigned to" (same page). A PM opens the same dashboard and sees only their jobs.
- **Entity switching:** Consolidated GL exists, but no entity picker on the dashboard is described.
- **Alerts:** "Receive automated alerts to avoid overruns", and the system "alerts users when costs approach or exceed budget thresholds" (https://www.foundationsoft.com/?p=19000, general ledger page).
- **Commentary:** none. No narrative, notes or annotation layer is described anywhere. The 2026 AI roadmap press release (title only, page was 403) signals "intelligent agents" coming, but nothing shipped is described.
- **Exports:** reports print and export to Excel (Capterra summary via search). DataGenie lets users "drag and drop rows and columns to modify or create custom construction financial reports" (general ledger page).

## 4. Visual language

From the dashboard screenshot and the report pages:

- **Dashboard:** dark mode charts (charcoal ground, near-black header) beside a light list. Thin, light, wide-tracked uppercase for panel titles ("BILLING & PROFIT TOTALS:", "JOB COSTS"). Small bold sans serif for job names. Saturated gold, blue, purple and green as data colours, with glossy gradient bars. Dense but not cramped: about 18 rows visible on the right, with zebra striping.
- **Status:** shown as a coloured percent-complete pill per row, the same colour reused on the row's actual bar. Variance on reports is a signed number in its own column, never coloured.
- **Reports:** monochrome print documents. Centred company name, report title in bold caps, job line, "As of" date, "Page 1 of 1" and a print timestamp in the corner. Right-aligned figures with two decimals, bold totals rows flanked by asterisks ("** Midwest Turnpike Totals **"). They look like 1990s accounting printouts because they are designed to be printed.
- **Brand (marketing only):** black, white and a strong gold/yellow, heavy geometric uppercase headings, photography of earthmoving equipment. The gold of the brand is the gold of the bars, so the product and the brochure share one accent.
- **Motion, empty and loading states:** nothing public. The Windows client has none worth noting.

## 5. What makes it feel premium, and what makes it useful

Honestly, it does not feel premium. It is useful, and the usefulness is specific:

- **Construction-native maths users trust.** The WIP report is the industry's own schedule, with percent complete by cost, earned profit and over/under billing, and the formulas printed in the header. A Capterra reviewer called the WIP report perfect for a company with varied projects (search summary, https://www.capterra.com/p/2032/FOUNDATION/reviews?page=3).
- **One number, every layer beneath it.** Officers get "a quick and easy-to-understand overview" (Big Sky Electric's accountant, https://www.foundationsoft.com/?p=1603), and the accountant can follow any figure to the invoice image without leaving the system.
- **Estimate versus actual on the row.** The paired grey and coloured bar on every job lets you see overrun by length, before reading a number.
- **Cost, hours and quantity together.** Variance is never dollars alone, so a labour overrun shows up as hours before it shows up as money.
- **Committed cost beside actual cost.** POs and subcontracts show what is owed but not yet invoiced, which is what really drives cost to complete.
- **The month-end entry is made where the problem is seen** (post over/under adjustments from inside the WIP report).

## 6. Complaints and weaknesses

- **Dated interface.** "Outdated and unintuitive interface" (Capterra cons, via search), "certain screens can feel dated compared to newer cloud-based platforms" (Software Advice summary, https://www.softwareadvice.co.uk/software/419696/foundation), "dated data entry methods" (https://softwareconnect.com/reviews/foundation-construction-accounting/).
- **Custom reports are hard.** Pulling custom reports "can take time to learn", and building them is "clunky" (Capterra via search).
- **Some WIP reports "a little too basic"** and needing more substantive reporting (G2, via search, https://www.g2.com/products/foundation/reviews).
- **Weak integrations** with HR, payroll and benefits systems (Capterra, GetApp via search).
- **Mobile is weak.** "Didn't function well on mobile devices" (SelectHub via search), "usability issues with mobile app" (SoftwareConnect).
- **The dashboard is an add-on module** and a separate web product (ExecutiveHQ), so the overview is not part of the base experience.
- **Permissions feel all or nothing** and audit logging lacks detail (Capterra AI summary via search).
- **No narrative.** Every figure is presented without a sentence saying what it means.

## 7. Steal list (for Hub's financial tab)

1. **Paired estimate and actual bars on every job or store row**: a thin grey bar for budget and a coloured bar for actual on one shared scale, the two dollar figures in tiny type beside them, so overrun reads as length before anyone reads a number.
2. **A percent-complete (or percent-of-budget) pill at the row's right edge whose colour also paints that row's actual bar**, one hue per status so the eye can scan the column of pills alone.
3. **Print the formula in the column header** of any derived table (`Over/Under = Billed − Earned`, `% Complete = Cost ÷ Est. Cost`), so a banker or owner can audit the WIP schedule without asking.
4. **A job summary drawer built in labelled blocks (To date · Contract · Committed · Client), with the drill link sitting beside the figure it explains** ("See billing detail" next to Billed to Date), never in a separate menu.
5. **A visible drill trail of tabs or breadcrumbs (Dashboard › Job › Cost code › Cost class › Transaction)** so every level stays one click from the last and Back always names where you were.
6. **Show cost, hours and quantity side by side in variance views** (Est, Actual, Remaining for each), so labour overruns surface as hours first.
7. **Net cash flow per job (collected minus paid AP minus paid payroll) as its own column** beside billed and cost, so cash is read job by job and not only for the company.
8. **"Include bid jobs" and "Include overhead jobs" as explicit toggles, plus role scoping that silently limits a project manager to their own jobs** using the same page everyone else sees.

## 8. Avoid list

1. **Filters on a separate Criteria tab you set before you look.** Put scope and period on the page itself, live, where the figure changes as you choose.
2. **Glossy gradient bars and dark chart panels bolted beside a light list.** Two grounds on one screen and decorative gloss read dated, not premium. Keep one ground and flat marks.
3. **Reports that are print documents on screen** (centred titles, asterisk totals, "Page 1 of 1"). The screen view should be designed for reading, with a print stylesheet behind it.
4. **Status colour with no stated rule.** Foundation's pill colours (gold, blue, purple, green) carry no visible legend. Every colour in Hub should say what it means on the page.
