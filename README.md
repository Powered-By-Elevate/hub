# Hub

A configurable financial and operational dashboard. One build, any industry,
any software stack, any brand.

Core BI is what this is for True North: a dashboard wired to that company's
ledger, that company's jobs, that company's people. Hub is the same product
with every True North decision pulled out into configuration, so the next
company gets it in days instead of a rebuild. The financial dashboard is the
thing that sells; everything else is there when a company wants it.

---

## What it does

- **Seven industries ship as working demos**, each with its own sample company,
  brand and connected software, in this order: construction, retail,
  restaurants, manufacturing, freight, software and schools. Construction and
  retail lead and carry a "Where we lead" mark on the front door, because that
  is the market Elevate sells to first, and schools come last. The financial engine is
  identical in all seven. What changes is the **unit of work** the money is
  divided by (a contract, a store, a restaurant, a production line, a truck, a
  product, a campus), and that single decision is what makes a dashboard read
  as *theirs*.
- **Branding is configuration.** Logo, colour, typefaces, company name. Change
  them in the settings console and the whole page follows, live.
- **Software is pick and plug.** Nine categories, 77 connectors, each with its
  real auth route and API. Switch one on and the pages that use it go live;
  switch it off and those pages say so rather than showing a figure from
  nowhere. Where a company runs nothing in a category, the product puts
  forward the one we would recommend.
- **View levels by job title.** Nine levels out of the box, renameable to a
  company's own titles. A level carries a rank (which pages), a scope (how much
  of the company) and a money setting (whether currency is shown at all), and
  the three are independent: a supervisor can see every operational page for
  their own crew with no money on any of them, and People & HR sees the people
  page and no finance page.
- **An HR tab that copies the best screen in each HR platform** (Matt, 2026-11-04 and 11-05). HR home
  laid out like BambooHR's, the Inbox like Workday's, the employee record and Reports like Rippling's, Timecards
  like ADP and UKG's team grid, Run payroll and Onboarding like Gusto's, plus an org chart with a what-if and a
  calibration nine-box (`src/js/pages/hrmash.js`), beside Directory, Time off, Hiring, Compliance and Reviews
  (`src/js/pages/hr.js`). One generated roster feeds every page (`build_hr` in `data/gen.py`). No vendor name or
  logo ships. Payroll tax and money movement stay with the payroll provider. The spec and the side by side are in
  `os-vault/wiki/research/hr-mashup-spec.md`.
- **It exports its own configuration.** The settings console produces the JSON
  file a real deployment is built from. No per-client code, no branch, no fork.

## The two doors: client sign-in and the Elevate console

Each client gets logins that show different views, and the Elevate team
picks a client and sees all of their data.

| Route | What it is |
| --- | --- |
| `#/signin` or `#/signin/<industry>` | A client's sign-in, in its own brand. "Sign in with Microsoft" is shown as the route a deployment uses. The demo has no sign-in, says so, and lists sample people instead (`config/roles.json` `signin`), each tied to one view level and one landing page. |
| `#/console` | Elevate's staff console, a full-screen client picker in Elevate's own brand (`config/brands.json` `elevate`, the wordmark in `src/img/`). A search field first, focused on arrival: type to filter over company, industry, entity and system, arrow keys move the highlight, Enter opens that client at its top level, Escape clears. Then the four stats, Recently opened (the last four, kept in the browser), industry chips, a sort, and one dense row per client in `config/industries.json` (mark, industry, scope, finance system, close, three figures from its own extract, a 12-month spark, Open and Sign-in view). It is light grey and charcoal on purpose, so it never reads as the dark, scenic front door. Inside a client, the top bar and the rail carry the way back. |

⛔ **Neither door is a permission system.** Picking a person only sets the view
level. Pages are still decided in `settings.js`, scope in `query.js` and money
in `fmt.js`. A signed-in person sees their own name in the top bar and signs
out rather than switching level, and every page route still works with nobody
signed in, which is how the gate walks the Hub. In a deployment the session is
Microsoft's and the level comes from the job title. Code in `src/js/gate.js`.

## The three honest states

The connector catalogue marks every entry as one of:

| State | Means |
| --- | --- |
| **Live** | Run against a real company's data in production. Sage Intacct, QuickBooks Online, Procore, SharePoint, Teams, Outlook, Planner, monday.com, monday CRM. |
| **Adapter built** | Code written and tested against fixtures, not yet pointed at a live tenant. ADP. |
| **Available** | The vendor's API and auth route are confirmed, the adapter is not written. Everything else. |

A demo that blurs those three is a demo that gets caught in the first meeting.
Never promote an entry's state without a measurement.

## Running it

```
cd tools/hub
python data/gen.py           # regenerate the sample data (deterministic)
python build.py              # assemble dist/
python build.py --serve 8000
```

Then open `http://127.0.0.1:8000/`. It must be served over http, not opened as
a file: the configuration and the data are fetched, and ES modules will not
load from `file://`.

## The gate

```
node tests/probe.js          # the full walk: seven industries, nine levels, every page
node tests/probe.js --quick  # one industry
node tests/probe.js --only restaurants   # one named industry
node tests/probe.js --shots  # also write screenshots to tests/shots
node tests/probe.js --dist <path>   # any other build, a client's included
```

**21,067 checks on the demo.** Every page of every view level of every industry is
opened, and the probe asserts that it drew without throwing, that the console is
clean, that nothing reads `NaN` or `undefined`, that there is no sideways scroll
at 1440 or 390, that the statements tie, that every KPI resolves to a real
number, and that a level with no money permission leaks no currency anywhere. It
runs one Chromium at a time on purpose: two in a small container gets the second
killed, and a killed browser reads exactly like a broken page.

It keeps earning its keep, and every one of these was a real defect the eye had
passed over: a `$2.10` threshold written into prose where a no-money level could
read it, a `$comment` key walked as though it were a page, a statement line the
model declared and no extract carried, a position summed as if it were a flow
(a house margin of -222%, a contract 5,356% complete), a percent change OF a
percentage, forty-eight scatter labels written over each other, a panel left
with 1,810px of nothing in it, and a figure strip laid out inside the panel grid
twice.

⛔ Several of those were found by a check written for something else. A gate is
worth more than the bug it was written for.

## How it is put together

```
config/
  product.json      the page catalogue, the module list, the statement model
  connectors.json   77 softwares, nine categories, auth route and API each
  industries.json   seven profiles, in front-door order: company, unit of work, measures, KPIs, software
  brands.json       seven brand kits, plus the validated chart palette
  roles.json        nine view levels, and the sample people the demo sign-in offers
data/gen.py         the sample data engine
src/
  index.html        the shell
  hub.css           the look. No brand colour is hard-coded anywhere in it.
  js/
    settings.js     the client's configuration, and the one apply() that lands it
    query.js        the fact layer. Role scope is applied here and nowhere else.
    chart.js        hand-drawn SVG charts. No chart library.
    fmt.js          formatting, and the one place a money permission is enforced
    ui.js           verdict, strip, panel, table
    cms.js          the settings console
    gate.js         the client sign-in and the Elevate console
    pages/          finance (8 pages), ops (4), start and the lighter modules
    app.js          rail, top bar, router, exports, the __hub probe surface
build.py            assembles dist/ for GitHub Pages
tests/probe.js      the gate
```

Two rules the code holds to, both bought the expensive way on Core BI:

- **One place per rule.** Role scope is applied in `query.js` only. The money
  permission is enforced in `fmt.js` only. Thirty pages cannot each get it
  right; one function can.
- **The pickers are drawn in the page**, never a native `<select>`. A native
  popup is painted outside the document, so a screenshot cannot capture it and
  a headless screenshot call hangs while one is open.

## What is deliberately not built

- **No live API calls.** Every connector in the demo reads the sample extract.
  The adapters that are marked live exist in the Core BI build and come across
  when a real client is wired, which is configuration plus credentials, not
  development.
- **No write path.** Nothing in this product writes to a source system. That
  is a product decision, not an omission.
- **No single-file build.** ES modules will not load from `file://`, so the
  demo is served, not emailed. If emailing one file ever matters, it means
  inlining the modules, which is a small bundler and a day of work.

## Deploying

**Automatic since 2026-11-05.** `.github/workflows/hub-publish.yml` in agentic-os mirrors `tools/hub/` into
`Powered-By-Elevate/hub` on every merge to main that touches it, and that repository's Pages workflow serves
it. Nobody publishes by hand and no session needs the hub repository attached. Check it worked with
`curl -s https://powered-by-elevate.github.io/hub/js/app.js | grep -c <a function the change added>`.

It needs one secret, set once: `HUB_DEPLOY_TOKEN` on agentic-os (Settings > Secrets and variables > Actions),
a fine-grained personal access token with repository access to `Powered-By-Elevate/hub` only and Contents
read and write. Without it the workflow fails at its first step and says so. `tenant/` and `MULTI-TENANT.md`
never cross over, because the hub repository is public.

`dist/` is static files and nothing else. Any static host serves it. For
GitHub Pages, `deploy/pages.yml` is the workflow: drop it in the target repo
at `.github/workflows/pages.yml`, push `dist/` to the repo root, and Pages
serves it from the Actions build.

The permanent home is a repository of its own. A cloud session cannot create
one (`POST /orgs/{org}/repos` returns 403 for an integration token, and
Powered-By-Elevate is a user account rather than an organisation, so the user
route is closed too), so the repository is created by hand once and the session
pushes to it from then on.
