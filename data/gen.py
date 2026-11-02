#!/usr/bin/env python3
"""
The Hub's sample data engine.

One generator, six industries. It writes a data file per industry profile that
the dashboard reads exactly as it would read a real company's extract, so the
demo exercises the same code path a client does: nothing in the app knows the
figures were invented.

Three rules it holds to, because a demo that does not hold to them is the thing
a CFO catches in the first ten minutes:

  1. Deterministic. A seeded generator, so running it twice produces the same
     file and a test can assert on a number.
  2. The balance sheet balances. Cash is the plug, which is how a projection
     balances in real life, and the generator refuses to finish if any month
     is out by more than a dollar.
  3. The unit figures roll up to the statement. A job's earned revenue, a
     store's sales, a truck's linehaul: summed across units they equal the
     revenue line for that month, to the cent. A dashboard whose detail does
     not tie to its summary is worse than no dashboard.

    python3 data/gen.py              # all six
    python3 data/gen.py --only tech  # one
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = HERE / "out"

MONTHS_BACK = 30           # 30 months, so year-on-year and TTM both work
LAST_MONTH = (2026, 10)    # the open month
CLOSED_THROUGH = "2026-09"  # signed off; October is tentative


# ---------------------------------------------------------------- randomness

class Rand:
    """A small deterministic generator. Same seed, same numbers, every run."""

    def __init__(self, seed: int):
        self.s = seed & 0x7FFFFFFF or 1

    def next(self) -> float:
        self.s = (self.s * 48271) % 0x7FFFFFFF
        return self.s / 0x7FFFFFFF

    def around(self, center: float, spread: float) -> float:
        """center, plus or minus up to spread (as a fraction of center)."""
        return center * (1 + (self.next() * 2 - 1) * spread)

    def pick(self, items):
        return items[int(self.next() * len(items)) % len(items)]

    def int_between(self, lo: int, hi: int) -> int:
        return lo + int(self.next() * (hi - lo + 1)) % (hi - lo + 1)


def seed_of(text: str) -> int:
    h = 2166136261
    for ch in text:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return h & 0x7FFFFFFF


# ------------------------------------------------------------------- months

def month_list() -> list[str]:
    y, m = LAST_MONTH
    out = []
    for i in range(MONTHS_BACK):
        mm = m - i
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        out.append(f"{yy:04d}-{mm:02d}")
    return list(reversed(out))


# -------------------------------------------------------------------- names

PLACES = [
    "Marlow", "Kestrel", "Fairhope", "Brightwater", "Caldwell", "Ashmore",
    "Pinehurst", "Westvale", "Rockford", "Harlow", "Stonebridge", "Elmgrove",
    "Northgate", "Clearfield", "Summerton", "Briar Hollow", "Granby", "Linden",
]

JOB_KINDS = [
    "Elementary School", "Middle School", "Distribution Center", "Medical Office",
    "Apartments", "Town Center", "Logistics Park", "Civic Center", "Clinic",
    "Mixed Use", "Warehouse", "Senior Living", "Fire Station", "Library",
]

PRODUCT_LINES = ["Core Platform", "Analytics", "Field Mobile", "Connect API"]

LANES = [
    "Atlanta to Memphis", "Charlotte to Richmond", "Nashville to Louisville",
    "Greenville to Atlanta", "Birmingham to Jackson", "Columbia to Savannah",
    "Knoxville to Lexington", "Macon to Orlando",
]

CATEGORIES = ["Apparel", "Home", "Outdoor", "Gift", "Pantry"]

# Names for the sample people. A demo whose owner column reads "PM A" tells a
# prospect they are looking at a placeholder, which is the one thing a demo
# cannot afford, so the sample set carries people with names.
FIRST = ["Alice", "Marcus", "Dana", "Priya", "Owen", "Lena", "Caleb", "Nina",
         "Victor", "Ruth", "Omar", "Grace", "Elliot", "Sofia", "Hugh", "Maya"]
LAST = ["Reed", "Hale", "Monroe", "Pike", "Vance", "Ashford", "Bell", "Okafor",
        "Castellan", "Duarte", "Whitlock", "Nakamura", "Ibarra", "Sterne"]


def person(rnd: "Rand") -> str:
    return f"{rnd.pick(FIRST)} {rnd.pick(LAST)}"


def people_pool(rnd: "Rand", n: int) -> list[str]:
    """n distinct names, so a scorecard never lists the same person twice."""
    out: list[str] = []
    guard = 0
    while len(out) < n and guard < n * 40:
        guard += 1
        nm = person(rnd)
        if nm not in out:
            out.append(nm)
    while len(out) < n:                      # exhausted the pool: number them
        out.append(f"{person(rnd)} ({len(out)})")
    return out


# ------------------------------------------------------------------ helpers

def round2(x: float) -> float:
    return round(x + 0.0, 2)


def spread_to_total(parts: list[float], total: float) -> list[float]:
    """Scale parts so they sum to total exactly, to the cent."""
    s = sum(parts)
    if s == 0:
        return [0.0] * len(parts)
    out = [round2(p * total / s) for p in parts]
    out[-1] = round2(out[-1] + (round2(total) - round2(sum(out))))
    return out


# ------------------------------------------------------------------- units

def build_units(ind: dict, rnd: Rand) -> list[dict]:
    kind = ind["id"]
    n = ind["model"]["units"]
    ents = [e["id"] for e in ind["entities"]]
    units: list[dict] = []

    # The people who carry the work. Each industry has a sensible number of
    # them, and a unit is handed to one by position so the same person carries
    # several, which is what makes a workload page worth drawing.
    #
    # They used to be "PM A" through "PM F". A demo whose owner column reads
    # like that tells a prospect they are looking at a placeholder, and a
    # workload page is specifically about people.
    crew = people_pool(rnd, min(n, {"construction": 6, "education": 6, "retail": 8,
                                    "industrial": 6, "logistics": 12, "tech": 4}[kind]))

    if kind == "construction":
        for i in range(n):
            year = 24 + (i * 3) // n
            num = f"{year}-{101 + i * 7 % 380:03d}"
            name = f"{rnd.pick(PLACES)} {rnd.pick(JOB_KINDS)}"
            # Start and duration are the job's, not the month's, so percent
            # complete can only rise and the status agrees with it. Rolling
            # status separately let a job read "In progress" at 100%.
            start = (seed_of(num) % 34) - 6          # months, relative to the window
            dur = 14 + seed_of(num + "dur") % 20     # 14 to 33 months on site
            pct_now = min(1.0, max(0.01, (MONTHS_BACK - 1 - start) / dur))
            units.append({
                "id": num, "name": f"{num} {name}", "short": name,
                "entity": ents[i % len(ents)],
                "status": ("Complete" if pct_now >= 1.0
                           else "Starting" if pct_now < 0.12 else "In progress"),
                "owner": crew[i % len(crew)],
                "started": f"20{year}-{rnd.int_between(1, 11):02d}",
                "start": start, "dur": dur,
            })
    elif kind == "education":
        grades = ["K-5", "K-5", "6-8", "6-8", "9-12", "K-8"]
        for i in range(n):
            place = PLACES[i * 3 % len(PLACES)]
            units.append({
                "id": f"C{i + 1}", "name": f"{place} Academy", "short": place,
                "entity": ents[0], "status": "Open", "owner": crew[i % len(crew)],
                "grades": grades[i % len(grades)],
            })
    elif kind == "retail":
        for i in range(n):
            place = PLACES[i * 2 % len(PLACES)]
            units.append({
                "id": f"S{i + 1:02d}", "name": f"{place} Store", "short": place,
                "entity": ents[1] if i == n - 1 else ents[0],
                "status": "Trading" if i < n - 1 else "Online",
                "owner": crew[i % len(crew)],
                "format": "Flagship" if i < 2 else ("Mall" if i % 3 == 0 else "High street"),
            })
        units[-1]["name"] = "Online"
        units[-1]["short"] = "Online"
        units[-1]["format"] = "Ecommerce"
    elif kind == "industrial":
        for i in range(n):
            plant = "Plant 1" if i < n // 2 else "Plant 2"
            units.append({
                "id": f"L{i + 1}", "name": f"{plant} Line {i % (n // 2) + 1}", "short": f"Line {i + 1}",
                "entity": ents[0] if i < n - 1 else ents[1],
                "status": "Running", "owner": crew[i % len(crew)],
                "plant": plant,
            })
    elif kind == "logistics":
        for i in range(n):
            units.append({
                "id": f"{2100 + i * 3}", "name": f"Unit {2100 + i * 3}", "short": f"{2100 + i * 3}",
                "entity": ents[0] if i < n - 6 else ents[1],
                "status": "In service" if rnd.next() > 0.08 else "In shop",
                "owner": crew[i % len(crew)],
                "lane": LANES[i % len(LANES)],
                "terminal": ["Atlanta", "Charlotte", "Nashville"][i % 3],
            })
    else:  # tech
        for i in range(n):
            units.append({
                "id": f"P{i + 1}", "name": PRODUCT_LINES[i % len(PRODUCT_LINES)],
                "short": PRODUCT_LINES[i % len(PRODUCT_LINES)],
                "entity": ents[0], "status": "Live" if i < 3 else "Beta",
                "owner": crew[i % len(crew)],
            })
    return units


# ------------------------------------------------------------- the statement

class NeedLift(Exception):
    """The opening equity was too thin and cash went under. Carries the shortfall."""

    def __init__(self, amount: float):
        super().__init__(f"lift {amount:,.0f}")
        self.amount = amount


def build(ind: dict, product: dict, lift: float = 0.0) -> dict:
    model = ind["model"]
    months = month_list()
    rnd = Rand(seed_of(ind["id"]))
    ents = ind["entities"]
    units = build_units(ind, rnd)

    # entity weights: the first entity carries most of the business
    weights = []
    for i, _e in enumerate(ents):
        weights.append(1.0 if i == 0 else (0.34 if i == 1 else 0.17))
    wsum = sum(weights)
    weights = [w / wsum for w in weights]

    pl_rows: list[dict] = []
    bs_rows: list[dict] = []
    budget_rows: list[dict] = []
    unit_facts: list[dict] = []
    cash_rows: list[dict] = []

    unit_weight = {u["id"]: rnd.around(1.0, 0.55) for u in units}
    # a couple of units are deliberately in trouble: a demo needs something to find
    # A demo where nothing is ever seriously wrong does not sell, and a
    # dashboard nobody watches catch something is a dashboard nobody trusts.
    # Three or four across a portfolio, spread out, never the first row.
    trouble = [units[i]["id"] for i in (2, 5, 9, 14) if i < len(units)]

    re_open = model["revM0"] * 12 * 0.21 + lift   # retained earnings opening
    cap = model["revM0"] * 12 * 0.08
    debt0 = model["debt"]
    fa0 = model["revM0"] * 12 * (0.9 if ind["id"] in ("industrial", "logistics", "education") else 0.22)
    inv_rate = {"retail": 0.72, "industrial": 0.55, "construction": 0.09,
                "logistics": 0.04, "education": 0.02, "tech": 0.01}[ind["id"]]

    ni_cum_prior = 0.0
    fa = fa0
    debt = debt0
    min_cash = None
    cash_floor = model["revM0"] * 0.6   # a demo company holds at least a few weeks of cash

    for mi, month in enumerate(months):
        y, m = int(month[:4]), int(month[5:])
        season = model["season"][m - 1]
        rev_total = model["revM0"] * ((1 + model["growth"]) ** mi) * season
        rev_total = rnd.around(rev_total, 0.045)

        # --- the P&L, per entity
        rev_parts = spread_to_total([rnd.around(w, 0.06) for w in weights], rev_total)
        month_ni = 0.0
        for ei, ent in enumerate(ents):
            rev = rev_parts[ei]
            gm = rnd.around(model["gm"], 0.14)
            cor = round2(rev * (1 - gm))
            gp = round2(rev - cor)
            oh_total = round2(rev_total * model["ohPct"] * (weights[ei] if ei else 1 - sum(weights[1:])))
            oh_split = spread_to_total([
                rnd.around(0.52, 0.1), rnd.around(0.13, 0.2), rnd.around(0.12, 0.3),
                rnd.around(0.1, 0.3), rnd.around(0.13, 0.2),
            ], oh_total)
            dep = round2(rev * model["capex"] * 0.62)
            interest = round2(debt * weights[ei] * 0.0695 / 12)
            other = round2(rnd.around(rev * 0.004, 0.9))
            ebitda = round2(gp - oh_total)
            ni = round2(ebitda - dep - interest + other)
            month_ni += ni

            for line, amount in (
                ("rev", rev), ("cor", cor), ("gp", gp),
                ("labor", oh_split[0]), ("facility", oh_split[1]), ("equip", oh_split[2]),
                ("sales", oh_split[3]), ("admin", oh_split[4]), ("oh", oh_total),
                ("ebitda", ebitda), ("dep", dep), ("int", interest), ("other", other), ("ni", ni),
            ):
                pl_rows.append({"m": month, "e": ent["id"], "l": line, "v": round2(amount)})

            # --- budget: the plan, set before the year, deliberately wrong in places
            if y >= 2025:
                bias = 1.0 + (0.06 if ind["id"] == "tech" else 0.03) - (0.11 if m in (7, 8) else 0)
                brev = round2(rev / rnd.around(1.0, 0.09) * bias)
                bcor = round2(brev * (1 - model["gm"]))
                boh = round2(oh_total / rnd.around(1.0, 0.05))
                for line, amount in (
                    ("rev", brev), ("cor", bcor), ("gp", round2(brev - bcor)),
                    ("oh", boh), ("ebitda", round2(brev - bcor - boh)),
                    ("ni", round2(brev - bcor - boh - dep - interest)),
                ):
                    budget_rows.append({"m": month, "e": ent["id"], "l": line, "v": amount})

        # --- the fleet of units, tied to the month's revenue
        write_unit_facts(ind, month, mi, rev_total, units, unit_weight, trouble, rnd, unit_facts)

        # --- the balance sheet, per entity, cash as the plug
        fy_start = mi - (m - 1) if m <= mi + 1 else 0
        ytd_ni = sum(r["v"] for r in pl_rows
                     if r["l"] == "ni" and r["m"][:4] == month[:4] and r["m"] <= month)
        fa = round2(fa + rev_total * model["capex"] - sum(
            r["v"] for r in pl_rows if r["l"] == "dep" and r["m"] == month))
        debt = round2(debt - debt0 / 240)

        ar_total = round2(rev_total * model["dso"] / 30.4)
        inv_total = round2(rev_total * inv_rate)
        ap_total = round2(rev_total * (1 - model["gm"]) * model["dpo"] / 30.4)
        accr_total = round2(sum(r["v"] for r in pl_rows if r["l"] == "labor" and r["m"] == month) * 0.42)
        oca_total = round2(rev_total * 0.06)
        ooa_total = round2(rev_total * 0.09)
        ocl_total = round2(rev_total * 0.05)
        cd_total = round2(debt0 / 20)
        ltd_total = round2(debt - cd_total)
        re_total = round2(re_open + ni_cum_prior)

        liab_eq = (ap_total + accr_total + cd_total + ltd_total + ocl_total
                   + cap + re_total + ytd_ni)
        assets_known = ar_total + inv_total + oca_total + fa + ooa_total
        cash_total = round2(liab_eq - assets_known)

        min_cash = cash_total if min_cash is None else min(min_cash, cash_total)

        for line, total in (
            ("cash", cash_total), ("ar", ar_total), ("inv", inv_total), ("oca", oca_total),
            ("fa", fa), ("ooa", ooa_total), ("ap", ap_total), ("accr", accr_total),
            ("cd", cd_total), ("ltd", ltd_total), ("ocl", ocl_total),
            ("cap", cap), ("re", re_total), ("cy", round2(ytd_ni)),
        ):
            parts = spread_to_total([rnd.around(w, 0.05) for w in weights], total)
            for ei, ent in enumerate(ents):
                bs_rows.append({"m": month, "e": ent["id"], "l": line, "v": parts[ei]})

        cash_rows.append({
            "m": month,
            "operating": round2(month_ni + sum(r["v"] for r in pl_rows if r["l"] == "dep" and r["m"] == month)),
            "investing": round2(-rev_total * model["capex"]),
            "financing": round2(-debt0 / 240),
            "balance": cash_total,
        })

        if m == 12:
            ni_cum_prior = round2(ni_cum_prior + ytd_ni)

    if min_cash is not None and min_cash < cash_floor:
        raise NeedLift(lift + cash_floor - min_cash)

    def last12(line: str) -> float:
        return round2(sum(r["v"] for r in pl_rows
                          if r["l"] == line and r["m"] in months[-12:]))

    trailing12 = last12("rev")
    labor12 = last12("labor")
    cor12 = last12("cor")

    data = {
        "meta": {
            "industry": ind["id"],
            "company": ind["company"],
            "brand": ind["brand"],
            "months": months,
            "closedThrough": CLOSED_THROUGH,
            "currency": "USD",
            "generated": "deterministic sample data",
            "notice": product["demoNotice"],
        },
        "entities": ind["entities"],
        "units": units,
        "pl": pl_rows,
        "budget": budget_rows,
        "bs": bs_rows,
        "cash": cash_rows,
        "unitFacts": unit_facts,
        "people": build_people(ind, rnd, months, labor12, cor12),
        "pipeline": build_pipeline(ind, rnd, months, trailing12),
        "docs": build_docs(ind, rnd, units),
    }
    check(data, ind)
    return data


# -------------------------------------------------------------- unit facts

def write_unit_facts(ind, month, mi, rev_total, units, uw, trouble, rnd, out):
    kind = ind["id"]
    live = [u for u in units if u["status"] not in ("Complete",)] or units
    parts = spread_to_total([uw[u["id"]] for u in live], rev_total)
    rev_by_unit = {u["id"]: parts[i] for i, u in enumerate(live)}

    for u in units:
        uid = u["id"]
        rev = rev_by_unit.get(uid, 0.0)
        bad = uid in trouble
        if kind == "construction":
            mult = 7.5 if u["status"] != "Complete" else 4.0
            contract = round2(rev * mult * uw[uid] + 250000)
            # A job only ever gets further through itself. The first cut used a
            # sine wave, which made percent complete FALL month on month across
            # the whole portfolio: obvious nonsense the moment it was put on a
            # grid, and invisible until it was.
            pct = min(1.0, max(0.01, (mi - u["start"]) / u["dur"]))
            earned = round2(contract * pct)
            est = round2(contract * (1 - ind["model"]["gm"]) * (1.14 if bad else rnd.around(0.99, 0.04)))
            facts = {"contract": contract, "earned": earned,
                     "billed": round2(earned * rnd.around(1.04 if not bad else 0.88, 0.04)),
                     # 1.05 sat exactly on the "more than 5% over" rule and so
                     # never tripped it. A job in trouble is in trouble.
                     "cost": round2(est * pct * (1.12 if bad else 1.0)),
                     "estCost": est, "pct": round2(pct * 100), "rev": rev}
        elif kind == "education":
            cap = {"K-5": 480, "6-8": 420, "9-12": 620, "K-8": 560}[u["grades"]]
            # One campus is genuinely struggling and one is merely soft, so the
            # two bands both have something in them. Moving the threshold to
            # fit the data would have been fitting the rule to the answer.
            fill = (0.66 if trouble.index(uid) == 0 else 0.78) if bad \
                else rnd.around(0.93, 0.05)
            enrolled = int(cap * min(1.0, fill))
            facts = {"enrolled": enrolled, "capacity": cap,
                     "adm": round2(enrolled * rnd.around(0.955, 0.012)),
                     "funding": round2(rev * 12 / max(1, enrolled)),
                     "staff": round2(enrolled / rnd.around(14.5, 0.08)),
                     "costPer": round2(rev * 12 / max(1, enrolled) * rnd.around(0.93, 0.05)),
                     "rev": rev}
        elif kind == "retail":
            sqft = 2200 if u["format"] == "Mall" else (5400 if u["format"] == "Flagship" else 3100)
            if u["format"] == "Ecommerce":
                sqft = 0
            margin = (ind["model"]["gm"] - 0.11) if bad else rnd.around(ind["model"]["gm"], 0.07)
            traffic = int(rev / rnd.around(38, 0.15))
            facts = {"sales": rev, "units": int(rev / rnd.around(31, 0.12)),
                     "sqft": sqft, "margin": round2(margin * 100),
                     "traffic": traffic, "conv": round2(rnd.around(22 if sqft else 3.1, 0.12)),
                     "rev": rev}
        elif kind == "industrial":
            avail = 520
            run = avail * (0.61 if bad else rnd.around(0.84, 0.06))
            produced = int(run * rnd.around(142, 0.08))
            scrap = int(produced * (0.061 if bad else rnd.around(0.019, 0.3)))
            facts = {"produced": produced, "scrap": scrap,
                     "hoursRun": round2(run), "hoursAvl": avail,
                     "oee": round2(run / avail * (1 - scrap / max(1, produced)) * rnd.around(0.93, 0.03) * 100),
                     "cpu": round2(rev * (1 - ind["model"]["gm"]) / max(1, produced - scrap)),
                     "rev": rev}
        elif kind == "logistics":
            miles = int(rev / rnd.around(2.42 if not bad else 2.02, 0.07))
            facts = {"loads": int(miles / rnd.around(640, 0.1)), "miles": miles,
                     "linehaul": rev, "fuel": round2(miles * rnd.around(0.512, 0.08)),
                     "maint": round2(miles * (0.36 if bad else rnd.around(0.168, 0.2))),
                     "deadhead": round2(rnd.around(16.5 if not bad else 24.0, 0.12)),
                     "onTime": round2(rnd.around(95.4 if not bad else 86.0, 0.03)),
                     "rev": rev}
        else:  # tech
            arr = round2(rev * 12)
            facts = {"arr": arr, "newArr": round2(arr * rnd.around(0.027, 0.4)),
                     "churn": round2(arr * (0.019 if bad else rnd.around(0.0075, 0.4))),
                     "seats": int(arr / rnd.around(1180, 0.1)),
                     "cac": round2(rnd.around(5400, 0.2) * (1.6 if bad else 1.0)),
                     "gm": round2(rnd.around(ind["model"]["gm"] * 100, 0.04)),
                     "rev": rev}
        for k, v in facts.items():
            out.append({"m": month, "u": uid, "k": k, "v": v})


# -------------------------------------------------------- the other modules

def build_people(ind: dict, rnd: Rand, months: list[str],
                 overhead_labor: float, cost_of_revenue: float) -> dict:
    """Headcount, what it costs, who is leaving, and what is open.

    The first cut carried four numbers and a department split, which is a
    caption rather than a page. Matt, 2026-11-02: *"your people and labour
    section is spelled like we are british and we arent. also, it's incredibly
    barren and useless at the moment"*. A labor page earns its place by
    answering whether the team is growing with the work, where it is bleeding,
    and what the empty seats are costing, so the generator now carries the
    series and the per-department detail those answers need."""
    heads = {"construction": 148, "education": 412, "retail": 186,
             "industrial": 264, "logistics": 112, "tech": 74}[ind["id"]]
    depts = {
        "construction": ["Field", "Project management", "Estimating", "Accounting", "Safety"],
        "education": ["Instruction", "Student support", "Operations", "Administration", "Food service"],
        "retail": ["Store", "Ecommerce", "Buying", "Distribution", "Support"],
        "industrial": ["Production", "Maintenance", "Quality", "Shipping", "Administration"],
        "logistics": ["Drivers", "Dispatch", "Maintenance", "Safety", "Administration"],
        "tech": ["Engineering", "Product", "Go to market", "Support", "Administration"],
    }[ind["id"]]
    base_turn = {"construction": 18.4, "education": 12.1, "retail": 41.2,
                 "industrial": 22.6, "logistics": 58.3, "tech": 9.4}[ind["id"]]
    """Average cost of a seat, by industry. It sets the vacancy figure the page
       puts on an open role, so it is a per-industry number rather than one
       average pretending to fit a driver and an engineer alike."""
    base_cost = {"construction": 78000, "education": 54000, "retail": 41000,
                 "industrial": 62000, "logistics": 68000, "tech": 148000}[ind["id"]]

    # Payroll has TWO homes in the statements: the people who do the work sit
    # inside cost of revenue, and everyone else sits in the overhead line. A
    # department table built from an invented cost per head disagreed with the
    # overhead line by five times on the same page, which is exactly the defect
    # the Core BI formula audit was run to find. So the departments are spread
    # to the company's ACTUAL all-in payroll, and the page states the split
    # rather than letting a reader assume one figure is the other.
    direct_share = {"construction": 0.38, "education": 0.70, "retail": 0.12,
                    "industrial": 0.30, "logistics": 0.45, "tech": 0.55}[ind["id"]]
    direct = round2(cost_of_revenue * direct_share)
    all_in = round2(direct + overhead_labor)

    parts = spread_to_total([rnd.around(1, 0.5) for _ in depts], heads)
    ftes = [max(1, int(x)) for x in parts]
    # Cost follows the people, with a little spread for seniority mix, then is
    # scaled so the departments sum to all_in to the dollar.
    raw = [ftes[i] * rnd.around(1, 0.25) for i in range(len(depts))]
    costs = spread_to_total(raw, all_in)
    department = []
    for i, d in enumerate(depts):
        department.append({
            "name": d,
            "fte": ftes[i],
            "cost": round2(costs[i]),
            "turnover": round2(rnd.around(base_turn, 0.45)),
            "open": 0,
        })

    """Headcount month by month, built backwards from today's number so the
       series and the headline cannot disagree: the page shows both."""
    hist = []
    head = heads
    for m in reversed(months):
        left = rnd.int_between(0, max(1, int(heads * base_turn / 100 / 12 * 1.8)))
        joined = rnd.int_between(0, left + 2)
        hist.append({"m": m, "head": head, "joined": joined, "left": left})
        head = max(1, head - joined + left)
    hist.reverse()

    """Open roles. Each one carries how long it has been open and what the
       empty seat costs a year, because "3 roles open" says nothing about
       whether that is a week of recruiting or a structural hole."""
    open_n = rnd.int_between(3, 11)
    # Titles belong to their department. The first cut picked a title at random
    # from one flat list, which filed an "Estimator" under Field: exactly the
    # kind of detail that tells a prospect the data is made up.
    titles = {
        "construction": [["Superintendent", "Foreman"], ["Project engineer", "Project manager"],
                         ["Estimator", "Preconstruction lead"], ["Staff accountant", "Billing clerk"],
                         ["Safety lead", "Safety coordinator"]],
        "education": [["Teacher", "Instructional coach"], ["Counselor", "Paraprofessional"],
                      ["Bus driver", "Custodian"], ["Registrar", "Office manager"],
                      ["Cook", "Cafeteria lead"]],
        "retail": [["Store associate", "Shift lead"], ["Ecommerce manager", "Merchandiser"],
                   ["Buyer", "Planner"], ["Warehouse picker", "Receiving lead"],
                   ["Support agent", "Support lead"]],
        "industrial": [["Machine operator", "Line lead"], ["Maintenance tech", "Reliability engineer"],
                       ["Quality inspector", "Quality engineer"], ["Shipping lead", "Material handler"],
                       ["Office manager", "Production planner"]],
        "logistics": [["Driver", "Owner operator"], ["Dispatcher", "Load planner"],
                      ["Diesel tech", "Shop lead"], ["Safety officer", "Compliance clerk"],
                      ["Billing clerk", "Office manager"]],
        "tech": [["Backend engineer", "Frontend engineer"], ["Designer", "Product manager"],
                 ["Account executive", "Sales engineer"], ["Support engineer", "Support lead"],
                 ["Office manager", "Finance analyst"]],
    }[ind["id"]]
    roles = []
    for i in range(open_n):
        d = department[i % len(department)]
        roles.append({
            "title": rnd.pick(titles[i % len(department)]),
            "dept": d["name"],
            "days": rnd.int_between(6, 180),
            "cost": int(round(rnd.around(base_cost, 0.22) / 1000) * 1000),
        })
    roles.sort(key=lambda r: -r["days"])
    for d in department:
        d["open"] = sum(1 for r in roles if r["dept"] == d["name"])

    return {
        "headcount": heads,
        "open": open_n,
        "turnover": round2(rnd.around(base_turn, 0.08)),
        "costPerHead": base_cost,
        "payroll": {"allIn": all_in, "direct": direct, "overhead": round2(overhead_labor)},
        "departments": department,
        "history": hist,
        "roles": roles,
    }


def build_pipeline(ind: dict, rnd: Rand, months: list[str], annual_rev: float) -> dict:
    """What is coming, what it is worth weighted, and whether it is enough.

    Matt, 2026-11-02: *"the pipeline section is bare and useless. it needs to
    actually be built out with useful information"*. A pipeline page that only
    totals open opportunity cannot answer the question a company actually has,
    which is whether the pipeline covers the plan. So the generator carries a
    target, the closed history that makes a win rate a measurement, each
    pursuit's age in its stage, and a per-owner scorecard.

    DO NOT let any of it reach a statement. A pursuit is not revenue, and the
    page says so rather than implying otherwise."""
    stages = [("Identified", 0.10), ("Qualified", 0.25), ("Proposal", 0.50),
              ("Negotiation", 0.75), ("Committed", 1.0)]
    owners = people_pool(rnd, 4)
    sources = ["Referral", "Repeat client", "Public bid", "Inbound", "Conference"]
    lost_why = ["Price", "Lost to incumbent", "Scope changed", "Funding pulled", "No decision"]

    # A funnel narrows. The first cut dealt pursuits round-robin across the
    # stages and drew each value at random, which produced a Proposal stage
    # WIDER than Qualified: a chart that contradicts the word "funnel" printed
    # above it. Scaling the draw was not enough either — with two or three
    # pursuits in the late stages the randomness still inverted a pair.
    #
    # So the shape is built, not hoped for. Each stage gets a share of the
    # total that is strictly smaller than the stage before, and the pursuits
    # inside it are spread to exactly that share. The funnel narrows in every
    # industry, every run, and the variation lives inside a stage rather than
    # between them. `check()` refuses to write a file where it does not.
    per_stage = [5, 4, 3, 3, 2]
    share = [1.0, 0.70, 0.50, 0.34, 0.20]
    pool = ind["model"]["revM0"] * 2.4 * sum(per_stage)
    stage_total = [pool * x / sum(share) for x in share]

    rows = []
    i = 0
    for si, n in enumerate(per_stage):
        values = spread_to_total([rnd.around(1, 0.3) for _ in range(n)], stage_total[si])
        for v in values:
            st = stages[si]
            value = round2(v)
            rows.append({
                "name": f"{rnd.pick(PLACES)} {rnd.pick(JOB_KINDS) if ind['id'] == 'construction' else rnd.pick(CATEGORIES)}",
                "stage": st[0], "weight": st[1], "value": value,
                "weighted": round2(value * st[1]),
                "owner": owners[i % len(owners)],
                "source": rnd.pick(sources),
                "age": rnd.int_between(4, 210),
                "close": f"2026-{rnd.int_between(11, 12):02d}" if i % 3 else "2027-03",
            })
            i += 1

    # The closed history. It is what makes the win rate a measurement rather
    # than an assumption, and what the page compares a stage weight against.
    closed = []
    for m in months[-12:]:
        for _ in range(rnd.int_between(1, 3)):
            value = round2(rnd.around(ind["model"]["revM0"] * 2.0, 0.7))
            won = rnd.next() < 0.42
            closed.append({
                "m": m, "won": won, "value": value,
                "owner": rnd.pick(owners),
                "source": rnd.pick(sources),
                "why": "" if won else rnd.pick(lost_why),
            })

    scoreboard = []
    for nm in owners:
        mine = [r for r in rows if r["owner"] == nm]
        mine_closed = [c for c in closed if c["owner"] == nm]
        won = [c for c in mine_closed if c["won"]]
        scoreboard.append({
            "name": nm,
            "open": len(mine),
            "openValue": round2(sum(r["value"] for r in mine)),
            "weighted": round2(sum(r["weighted"] for r in mine)),
            "won": len(won),
            "lost": len(mine_closed) - len(won),
            "wonValue": round2(sum(c["value"] for c in won)),
            "winRate": round2(len(won) / len(mine_closed) * 100) if mine_closed else 0.0,
        })
    scoreboard.sort(key=lambda o: -o["weighted"])

    # The target the pipeline is measured against: the last twelve months of
    # actual revenue, grown a little.
    #
    # The first cut built it from revM0, the run rate THIRTY MONTHS AGO times
    # twelve, which every growing industry had already passed. Coverage came
    # out as a dash and the gap to plan as $0 on a page whose whole purpose is
    # to say whether the pipeline covers the plan. A target has to be derived
    # from where the company is now, not where it started.
    target = round2(annual_rev * 1.12)

    return {"stages": [s[0] for s in stages], "rows": rows,
            "owners": scoreboard, "closed": closed, "target": target,
            "note": "Pipeline is never a fact. It sits beside the statements and enters none of them."}


# The filing taxonomy, per industry. ONE scheme for every unit of work, which
# is the point: a company with a folder scheme per project has no scheme.
DISCIPLINES = {
    "construction": ["Contracts", "Drawings", "Submittals", "RFIs", "Change orders",
                     "Pay applications", "Permits", "Safety", "Closeout"],
    "education": ["Enrollment", "Curriculum", "Staff files", "Compliance",
                  "Facilities", "Finance", "Board"],
    "retail": ["Leases", "Vendors", "Merchandising", "Payroll", "Compliance", "Finance"],
    "industrial": ["Work orders", "Quality", "Maintenance", "Safety", "Suppliers", "Finance"],
    "logistics": ["Driver files", "Maintenance", "DOT compliance", "Insurance",
                  "Rate confirmations", "Finance"],
    "tech": ["Contracts", "Specifications", "Security & compliance", "Support", "Finance"],
}

# What lives in each of those folders, so a document's name tells you what it is.
DOC_KINDS = {
    "Contracts": ["Executed agreement", "Amendment", "Notice to proceed", "Bond"],
    "Drawings": ["Permit set", "Issued for construction", "As-built", "Shop drawing"],
    "Submittals": ["Product data", "Sample transmittal", "Shop submittal"],
    "RFIs": ["Request for information", "RFI response"],
    "Change orders": ["Change order", "Change event", "Proposed change"],
    "Pay applications": ["Pay application", "Schedule of values", "Lien waiver"],
    "Permits": ["Building permit", "Inspection report", "Certificate of occupancy"],
    "Safety": ["Toolbox talk", "Incident report", "Site inspection"],
    "Closeout": ["O&M manual", "Warranty", "Punch list"],
    "Enrollment": ["Enrollment roster", "Withdrawal notice", "Lottery results"],
    "Curriculum": ["Scope and sequence", "Adoption list", "Pacing guide"],
    "Staff files": ["Offer letter", "Certification", "Evaluation"],
    "Compliance": ["State report", "Audit response", "Policy acknowledgement"],
    "Facilities": ["Lease", "Inspection", "Work order"],
    "Finance": ["Statement", "Invoice", "Budget", "Reconciliation"],
    "Board": ["Agenda", "Minutes", "Resolution"],
    "Leases": ["Lease", "Estoppel", "CAM reconciliation"],
    "Vendors": ["Purchase order", "Vendor agreement", "W-9"],
    "Merchandising": ["Planogram", "Markdown schedule", "Assortment plan"],
    "Payroll": ["Payroll register", "Timesheet summary"],
    "Work orders": ["Work order", "Production record", "Downtime log"],
    "Quality": ["Inspection record", "Non-conformance", "Corrective action"],
    "Maintenance": ["Service record", "PM schedule", "Parts order"],
    "Suppliers": ["Supplier agreement", "Certificate of analysis"],
    "Driver files": ["Qualification file", "Medical card", "Logbook audit"],
    "DOT compliance": ["Inspection report", "Hours of service audit", "Drug test record"],
    "Insurance": ["Certificate of insurance", "Claim file"],
    "Rate confirmations": ["Rate confirmation", "Bill of lading", "Proof of delivery"],
    "Specifications": ["Product specification", "Architecture note", "Release plan"],
    "Security & compliance": ["SOC 2 report", "Penetration test", "DPA"],
    "Support": ["Escalation record", "Runbook"],
}


def sample_docs(rnd: Rand, place: str, disc: str, updated: str, k: int) -> list[dict]:
    """A handful of real filenames inside each folder.

    A browser where every folder you open says "0 of them by name" is worse
    than a flat list: it invites the click and then shows nothing. Each folder
    carries a small sample, the page says plainly how many more are behind it,
    and nothing pretends the sample is the whole folder.

    The newest document in the sample is dated the folder's own last-filed day,
    so the folder card and the folder's contents cannot contradict each other."""
    kinds = DOC_KINDS.get(disc, ["Document"])
    year, month, day = (int(x) for x in updated.split("-"))
    out = []
    for i in range(k):
        back = 0 if i == 0 else rnd.int_between(3, 160)
        d = day - back
        m, y = month, year
        while d < 1:
            m -= 1
            if m < 1:
                m, y = 12, y - 1
            d += 30
        when = f"{y}-{m:02d}-{min(28, d):02d}"
        out.append({
            "name": f"{place} - {when} {rnd.pick(kinds)}.pdf",
            "when": when,
            "by": person(rnd),
            "size": round2(rnd.around(2.4, 0.85)),
        })
    out.sort(key=lambda r: r["when"], reverse=True)
    return out


def build_docs(ind: dict, rnd: Rand, units: list[dict]) -> dict:
    """A filing tree, not a pile.

    Matt, 2026-11-02: *"your documents section looks like shit. there are no
    folders....just documents...it looks horrible and unorganized"*. The first
    cut carried a count and eight recent filenames, so the page could only ever
    draw a list. A document system is believable when you can see the SHAPE of
    it: one folder scheme applied to every unit of work, counts that add up,
    and a date on each folder saying when anything last landed in it."""
    discs = DISCIPLINES[ind["id"]]
    folders = []
    total = 0
    for u in units:
        for d in discs:
            n = rnd.int_between(3, 160)
            total += n
            updated = f"2026-{rnd.int_between(6, 10):02d}-{rnd.int_between(1, 28):02d}"
            folders.append({
                "unit": u["id"], "unitName": u["short"] or u["name"],
                "disc": d, "n": n,
                "size": round2(n * rnd.around(1.8, 0.7)),          # MB
                "updated": updated,
                "docs": sample_docs(rnd, u["short"] or u["name"], d, updated, min(n, 6)),
            })
    # Company-level folders sit beside the units: the things that belong to the
    # business rather than to one piece of work.
    for d in discs:
        n = rnd.int_between(40, 520)
        total += n
        updated = f"2026-{rnd.int_between(8, 10):02d}-{rnd.int_between(1, 28):02d}"
        folders.append({
            "unit": None, "unitName": "Company", "disc": d, "n": n,
            "size": round2(n * rnd.around(1.8, 0.7)),
            "updated": updated,
            "docs": sample_docs(rnd, "Company", d, updated, min(n, 6)),
        })

    recent = []
    for i in range(10):
        f = folders[rnd.int_between(0, len(folders) - 1)]
        kind = rnd.pick(DOC_KINDS.get(f["disc"], ["Document"]))
        when = f"2026-10-{rnd.int_between(10, 29):02d}"
        recent.append({
            # The name carries the SAME date as the filing. The first cut drew
            # the two separately, so a document filed on the 27th was named for
            # the 17th on the same row.
            "name": f"{f['unitName']} - {when} {kind}.pdf",
            "unit": f["unit"], "unitName": f["unitName"], "disc": f["disc"],
            "when": when,
            "by": person(rnd),
            "size": round2(rnd.around(2.4, 0.8)),
        })
    recent.sort(key=lambda r: r["when"], reverse=True)

    return {
        "count": total,
        "sizeGb": round2(sum(f["size"] for f in folders) / 1024),
        "disciplines": discs,
        "folders": folders,
        "recent": recent,
    }


# ------------------------------------------------------------------- checks

def check(data: dict, ind: dict) -> None:
    """Refuse to write a file whose statements do not hold together."""
    # The funnel must narrow. A page that prints the word "funnel" over a
    # chart whose third bar is wider than its second is telling a prospect the
    # data is made up, so this refuses the file rather than shipping it.
    pipe = data["pipeline"]
    by_stage = []
    for st in pipe["stages"]:
        by_stage.append(sum(r["value"] for r in pipe["rows"] if r["stage"] == st))
    for a, b, na, nb in zip(by_stage, by_stage[1:], pipe["stages"], pipe["stages"][1:]):
        if b >= a:
            raise SystemExit(
                f"{ind['id']}: the funnel widens at {nb} ({b:,.0f} against {na} {a:,.0f})")

    # Every pipeline figure must stay out of the statements. A pursuit is not
    # revenue, and the one way that could silently stop being true is a future
    # edit that reads pipeline rows into a ledger line.
    if any(r.get("l") for r in pipe["rows"]):
        raise SystemExit(f"{ind['id']}: a pipeline row carries a statement line")

    pl, bs = data["pl"], data["bs"]
    for month in data["meta"]["months"]:
        a = sum(r["v"] for r in bs if r["m"] == month and r["l"] in
                ("cash", "ar", "inv", "oca", "fa", "ooa"))
        le = sum(r["v"] for r in bs if r["m"] == month and r["l"] in
                 ("ap", "accr", "cd", "ltd", "ocl", "cap", "re", "cy"))
        if abs(a - le) > 1.0:
            raise SystemExit(f"{ind['id']} {month}: balance sheet out by {a - le:,.2f}")
        if sum(r["v"] for r in bs if r["m"] == month and r["l"] == "cash") <= 0:
            raise SystemExit(f"{ind['id']} {month}: cash went negative")

        rev = sum(r["v"] for r in pl if r["m"] == month and r["l"] == "rev")
        urev = sum(f["v"] for f in data["unitFacts"] if f["m"] == month and f["k"] == "rev")
        if abs(rev - urev) > 1.0:
            raise SystemExit(f"{ind['id']} {month}: units sum to {urev:,.2f}, revenue is {rev:,.2f}")

        for line, formula in (("gp", ("rev", "cor")), ("ebitda", ("gp", "oh"))):
            got = sum(r["v"] for r in pl if r["m"] == month and r["l"] == line)
            want = (sum(r["v"] for r in pl if r["m"] == month and r["l"] == formula[0])
                    - sum(r["v"] for r in pl if r["m"] == month and r["l"] == formula[1]))
            if abs(got - want) > 1.0:
                raise SystemExit(f"{ind['id']} {month}: {line} is {got:,.2f}, should be {want:,.2f}")


# ------------------------------------------------------------------ summary

def summarise(data: dict, ind: dict) -> dict:
    """One small card's worth of a company, for the front door.

    The chooser draws six worlds before any of their extracts are loaded, so
    the figure on each card is computed here instead. It duplicates a little of
    the app's KPI arithmetic, which is why the probe asserts that every card
    matches what that industry's own KPI returns once loaded: a duplicated
    number that nothing checks is a number that will drift.
    """
    months = data["meta"]["months"]
    last = months[-1]
    year = last[:4]
    ytd = [m for m in months if m[:4] == year]

    def fact_at(key, month=last):
        return round2(sum(f["v"] for f in data["unitFacts"]
                          if f["m"] == month and f["k"] == key))

    def fact_sum(key, window):
        w = set(window)
        return round2(sum(f["v"] for f in data["unitFacts"]
                          if f["m"] in w and f["k"] == key))

    kind = ind["id"]
    if kind == "construction":
        open_ids = {u["id"] for u in data["units"] if u["status"] != "Complete"}
        value = round2(sum(f["v"] for f in data["unitFacts"]
                           if f["m"] == last and f["u"] in open_ids and f["k"] == "contract")
                       - sum(f["v"] for f in data["unitFacts"]
                             if f["m"] == last and f["u"] in open_ids and f["k"] == "earned"))
        fmt = "usd"
    elif kind == "education":
        value, fmt = fact_at("enrolled"), "num"
    elif kind == "retail":
        sqft = fact_at("sqft")
        annual = 12 / max(1, len(ytd))
        value = round2(fact_sum("rev", ytd) * annual / sqft) if sqft else 0.0
        fmt = "usdExact"
    elif kind == "industrial":
        num = den = 0.0
        for u in data["units"]:
            oee = next((f["v"] for f in data["unitFacts"]
                        if f["m"] == last and f["u"] == u["id"] and f["k"] == "oee"), None)
            avl = next((f["v"] for f in data["unitFacts"]
                        if f["m"] == last and f["u"] == u["id"] and f["k"] == "hoursAvl"), 0)
            if oee is None:
                continue
            num += oee * avl
            den += avl
        value, fmt = (round2(num / den) if den else 0.0), "pct"
    elif kind == "logistics":
        miles = fact_sum("miles", ytd)
        value = round2(fact_sum("rev", ytd) / miles) if miles else 0.0
        fmt = "usdExact"
    else:
        value, fmt = fact_at("arr"), "usd"

    return {
        "id": ind["id"],
        "name": ind["name"],
        "short": ind["short"],
        "company": ind["company"],
        "brand": ind["brand"],
        "tagline": ind["tagline"],
        "collection": ind["unit"]["collection"],
        "unit": ind["unit"]["one"],
        "many": ind["unit"]["many"],
        "units": len(data["units"]),
        "entities": len(data["entities"]),
        "metric": ind["headline"]["metric"],
        "label": ind["headline"]["label"],
        "value": value,
        "fmt": fmt,
        "spark": [round2(sum(r["v"] for r in data["pl"] if r["m"] == m and r["l"] == "rev"))
                  for m in months[-12:]],
        "connected": sorted({c for v in ind["connected"].values()
                             for c in (v if isinstance(v, list) else ([v] if v else []))}),
    }


# --------------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="one industry id")
    args = ap.parse_args()

    product = json.loads((ROOT / "config" / "product.json").read_text())
    inds = json.loads((ROOT / "config" / "industries.json").read_text())["industries"]
    OUT.mkdir(parents=True, exist_ok=True)
    cards = []

    for ind in inds:
        if args.only and ind["id"] != args.only:
            continue
        lift = 0.0
        for _attempt in range(6):
            try:
                data = build(ind, product, lift)
                break
            except NeedLift as need:
                lift = need.amount
        else:
            raise SystemExit(f"{ind['id']}: could not find an opening equity that keeps cash positive")
        path = OUT / f"{ind['id']}.json"
        path.write_text(json.dumps(data, separators=(",", ":")))
        rev = sum(r["v"] for r in data["pl"]
                  if r["l"] == "rev" and r["m"][:4] == "2026" and r["m"] <= "2026-09")
        cards.append(summarise(data, ind))
        print(f"{ind['id']:13s} {len(data['units']):3d} units  "
              f"{len(data['pl']) + len(data['bs']) + len(data['unitFacts']):6d} facts  "
              f"YTD revenue {rev / 1e6:7.2f}M  {path.stat().st_size / 1024:6.0f} KB")

    if not args.only:
        summary = OUT / "summary.json"
        summary.write_text(json.dumps({"industries": cards}, separators=(",", ":")))
        print(f"summary       {len(cards)} cards  {summary.stat().st_size / 1024:6.1f} KB")


if __name__ == "__main__":
    main()
