#!/usr/bin/env python3
"""
The Hub's sample data engine.

One generator, seven industries. It writes a data file per industry profile that
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

    python3 data/gen.py              # all seven
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

# What a restaurant group pursues: work that adds covers or a site, never a
# shop category. Construction pursues its own job kinds, the rest use CATEGORIES.
PURSUITS = {"construction": JOB_KINDS,
            "restaurants": ["Catering contract", "Private events", "New site",
                            "Corporate account", "Wedding season", "Stadium concession"],
            "healthcare": ["Employer clinic contract", "Payer contract renewal", "New clinic site",
                           "Hospital referral agreement", "Occupational health account", "Telehealth program"]}

# A restaurant's format sets its seats, its check and how much of the group's
# sales it carries. Flagships seat more and sell dearer, an express counter
# turns a cheap check fast.
RESTAURANT_FORMATS = {
    "Flagship": {"seats": 160, "check": 46.0, "weight": 1.5},
    "Neighborhood": {"seats": 120, "check": 33.0, "weight": 1.0},
    "Express": {"seats": 80, "check": 21.0, "weight": 0.7},
    "Catering": {"seats": 0, "check": 38.0, "weight": 1.1},   # no dining room, so no turns
}

# What a visit earns, by clinic specialty (net of payer contractual adjustments).
HEALTH_SPECIALTY = {"Primary care": 168.0, "Pediatrics": 142.0, "Urgent care": 196.0,
                    "Women's health": 214.0, "Physical therapy": 118.0}

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
                                    "industrial": 6, "logistics": 12, "tech": 4,
                                    "restaurants": 4, "healthcare": 4}[kind]))

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
    elif kind == "healthcare":
        # Each clinic has a specialty, which sets its visit fee and how many
        # patients a provider sees in a day.
        specs = ["Primary care", "Primary care", "Pediatrics", "Urgent care",
                 "Primary care", "Women's health", "Urgent care", "Physical therapy"]
        for i in range(n):
            place = PLACES[(i * 4 + 2) % len(PLACES)]
            units.append({
                "id": f"H{i + 1:02d}", "name": f"Bluewater {place}", "short": place,
                "entity": ents[1] if specs[i % len(specs)] == "Physical therapy" and len(ents) > 1 else ents[0],
                "status": "Open", "owner": crew[i % len(crew)],
                "specialty": specs[i % len(specs)],
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
    elif kind == "restaurants":
        # The last location is the catering kitchen, booked to its own entity,
        # the way a group that caters runs it.
        for i in range(n):
            place = PLACES[(i * 5 + 1) % len(PLACES)]
            fmt = "Flagship" if i < 2 else ("Express" if i % 4 == 3 else "Neighborhood")
            units.append({
                "id": f"R{i + 1:02d}", "name": f"Marigold {place}", "short": place,
                "entity": ents[1] if i == n - 1 else ents[0],
                "status": "Open", "owner": crew[i % len(crew)],
                "format": fmt, "seats": RESTAURANT_FORMATS[fmt]["seats"],
            })
        units[-1].update({"name": "Catering kitchen", "short": "Catering", "format": "Catering",
                          "status": "Catering", "seats": 0})
    elif kind == "industrial":
        for i in range(n):
            plant ="Plant 1" if i < n // 2 else "Plant 2"
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
    if ind["id"] == "restaurants":   # a flagship carries more than an express counter
        for u in units:
            unit_weight[u["id"]] *= RESTAURANT_FORMATS[u["format"]]["weight"]
    # a couple of units are deliberately in trouble: a demo needs something to find
    # A demo where nothing is ever seriously wrong does not sell, and a
    # dashboard nobody watches catch something is a dashboard nobody trusts.
    # Three or four across a portfolio, spread out, never the first row.
    trouble = [units[i]["id"] for i in (2, 5, 9, 14) if i < len(units)]

    re_open = model["revM0"] * 12 * 0.21 + lift   # retained earnings opening
    cap = model["revM0"] * 12 * 0.08
    debt0 = model["debt"]
    fa0 = model["revM0"] * 12 * (0.9 if ind["id"] in ("industrial", "logistics", "education", "restaurants")
                                  else 0.45 if ind["id"] == "healthcare" else 0.22)
    inv_rate = {"retail": 0.72, "industrial": 0.55, "construction": 0.09,
                "logistics": 0.04, "education": 0.02, "tech": 0.01,
                "restaurants": 0.07, "healthcare": 0.03}[ind["id"]]   # about a week of food on the shelf

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
        ledger = {"cor": 0.0, "labor": 0.0}   # what the units' own costs must tie to
        for ei, ent in enumerate(ents):
            rev = rev_parts[ei]
            gm = rnd.around(model["gm"], model.get("gmSpread", 0.14))   # a menu holds its food cost tighter than a job book
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
            ledger["cor"] += cor
            ledger["labor"] += oh_split[0]

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
        write_unit_facts(ind, month, mi, rev_total, units, unit_weight, trouble, rnd, unit_facts, ledger)

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
        "people": (lambda p: {**p, "hr": build_hr(ind, p, units)})(build_people(ind, rnd, months, labor12, cor12)),
        "pipeline": build_pipeline(ind, rnd, months, trailing12),
        "docs": build_docs(ind, rnd, units),
    }
    if ind["id"] == "education":
        data["marketing"] = build_marketing(ind, months, units, pl_rows, unit_facts)
    check(data, ind)
    return data


# -------------------------------------------------------------- unit facts

def write_unit_facts(ind, month, mi, rev_total, units, uw, trouble, rnd, out, ledger=None):
    kind = ind["id"]
    live = [u for u in units if u["status"] not in ("Complete",)] or units
    parts = spread_to_total([uw[u["id"]] for u in live], rev_total)
    rev_by_unit = {u["id"]: parts[i] for i, u in enumerate(live)}

    # A restaurant's food and labor are its share of the ledger's own cost of
    # sales and labor lines, spread by each location's rate. So the group's
    # prime cost read off the locations equals the statement to the cent, and a
    # kitchen running hot shows as a location above the rest, not as a figure
    # that disagrees with the P&L.
    if kind == "restaurants":
        gm = ind["model"]["gm"]
        food_rate = {u["id"]: rnd.around(1 - gm + 0.045, 0.02) if u["id"] in trouble else rnd.around(1 - gm, 0.05)
                     for u in units}
        labor_rate = {u["id"]: rnd.around(0.34, 0.03) if u["id"] in trouble else rnd.around(0.30, 0.06) for u in units}
        ids = [u["id"] for u in units]
        food_by = dict(zip(ids, spread_to_total([rev_by_unit[i] * food_rate[i] for i in ids], ledger["cor"])))
        labor_by = dict(zip(ids, spread_to_total([rev_by_unit[i] * labor_rate[i] for i in ids], ledger["labor"])))

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
        elif kind == "healthcare":
            fee = HEALTH_SPECIALTY[u["specialty"]]
            visits = max(1, int(rev / rnd.around(fee, 0.05)))
            # One clinic is leaking money at the front desk and in billing:
            # patients do not show, and claims sit unpaid. That is the thing a
            # practice dashboard exists to catch.
            first = bool(trouble) and uid == trouble[0]
            facts = {"visits": visits,
                     "providers": round2(visits / rnd.around(330, 0.08)),
                     "perVisit": round2(rev / visits),
                     "collect": round2(rnd.around(88.0 if first else 96.2, 0.012)),
                     "arDays": round2(rnd.around(58.0 if first else (47.0 if bad else 38.0), 0.06)),
                     "noShow": round2(rnd.around(14.5 if first else (10.2 if bad else 6.4), 0.1)),
                     "nps": round2(rnd.around(61 if bad else 78, 0.05)),
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
        elif kind == "restaurants":
            spec = RESTAURANT_FORMATS[u["format"]]
            covers = max(1, int(rev / rnd.around(spec["check"], 0.06)))
            food, labor = food_by[uid], labor_by[uid]
            hours = round2(labor / rnd.around(19.5, 0.05))     # all-in cost of an hour
            facts = {"sales": rev, "covers": covers, "check": round2(rev / covers),
                     "seats": u["seats"],
                     "turns": round2(covers / (u["seats"] * 30.4)) if u["seats"] else 0.0,
                     "foodUsd": food, "laborUsd": labor, "hours": hours,
                     "food": round2(food / rev * 100) if rev else 0.0,
                     "labor": round2(labor / rev * 100) if rev else 0.0,
                     "prime": round2((food + labor) / rev * 100) if rev else 0.0,
                     "splh": round2(rev / hours) if hours else 0.0,
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
             "industrial": 264, "logistics": 112, "tech": 74,
             "restaurants": 418, "healthcare": 236}[ind["id"]]
    depts = {
        "construction": ["Field", "Project management", "Estimating", "Accounting", "Safety"],
        "education": ["Instruction", "Student support", "Operations", "Administration", "Food service"],
        "retail": ["Store", "Ecommerce", "Buying", "Distribution", "Support"],
        "industrial": ["Production", "Maintenance", "Quality", "Shipping", "Administration"],
        "logistics": ["Drivers", "Dispatch", "Maintenance", "Safety", "Administration"],
        "tech": ["Engineering", "Product", "Go to market", "Support", "Administration"],
        "restaurants": ["Kitchen", "Front of house", "Bar", "Restaurant management", "Support office"],
        "healthcare": ["Clinical", "Front desk", "Billing", "Practice management", "Support office"],
    }[ind["id"]]
    base_turn = {"construction": 18.4, "education": 12.1, "retail": 41.2,
                 "industrial": 22.6, "logistics": 58.3, "tech": 9.4,
                 "restaurants": 74.0, "healthcare": 19.8}[ind["id"]]
    """Average cost of a seat, by industry. It sets the vacancy figure the page
       puts on an open role, so it is a per-industry number rather than one
       average pretending to fit a driver and an engineer alike."""
    base_cost = {"construction": 78000, "education": 54000, "retail": 41000,
                 "industrial": 62000, "logistics": 68000, "tech": 148000,
                 "restaurants": 36000, "healthcare": 71000}[ind["id"]]

    # Payroll has TWO homes in the statements: the people who do the work sit
    # inside cost of revenue, and everyone else sits in the overhead line. A
    # department table built from an invented cost per head disagreed with the
    # overhead line by five times on the same page, which is exactly the defect
    # the Core BI formula audit was run to find. So the departments are spread
    # to the company's ACTUAL all-in payroll, and the page states the split
    # rather than letting a reader assume one figure is the other.
    direct_share = {"construction": 0.38, "education": 0.70, "retail": 0.12,
                    "industrial": 0.30, "logistics": 0.45, "tech": 0.55,
                    # a restaurant's cost of sales is food and drink only: every hour
                    # worked sits in the labor line, which is how prime cost is read
                    "restaurants": 0.0, "healthcare": 0.62}[ind["id"]]
    direct = round2(cost_of_revenue * direct_share)
    all_in = round2(direct + overhead_labor)

    parts = spread_to_total([rnd.around(1, 0.5) for _ in depts], heads)
    ftes = [max(1, int(x)) for x in parts]
    # The departments add to the headcount, so the HR roster built from them is the same team.
    ftes[ftes.index(max(ftes))] += heads - sum(ftes)
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
        "restaurants": [["Line cook", "Prep cook"], ["Server", "Host"], ["Bartender", "Barback"],
                        ["General manager", "Assistant manager"], ["Payroll clerk", "Purchasing lead"]],
        "healthcare": [["Nurse practitioner", "Medical assistant"], ["Patient coordinator", "Scheduler"],
                       ["Medical biller", "Coding specialist"], ["Practice manager", "Clinic supervisor"],
                       ["Credentialing lead", "Office manager"]],
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
        "titles": {d["name"]: titles[i] for i, d in enumerate(department)},
    }


# ----------------------------------------------------------------------- HR

HR_FIRST = FIRST + ["Avery", "Jordan", "Tessa", "Malik", "Hannah", "Diego", "Kara", "Luis",
                    "Brooke", "Isaac", "Rosa", "Theo", "Wren", "Andre", "Camille", "Felix",
                    "Joy", "Kendall", "Leah", "Micah", "Noelle", "Paul", "Quinn", "Simone"]
HR_LAST = LAST + ["Brennan", "Calloway", "Delgado", "Ellison", "Foster", "Garrity", "Hollis",
                  "Iverson", "Jett", "Kowalski", "Lockhart", "Mercer", "Novak", "Ortega",
                  "Prentice", "Quarles", "Rourke", "Sato", "Tolliver", "Underwood"]

HR_CERTS = {
    "construction": ["OSHA 30", "First aid & CPR", "Forklift operator", "Fall protection"],
    "education": ["Teaching license", "Background check", "First aid & CPR", "Mandated reporter"],
    "retail": ["Forklift operator", "First aid & CPR", "Food handler"],
    "industrial": ["Forklift operator", "Lockout/tagout", "First aid & CPR", "Confined space"],
    "logistics": ["CDL class A", "DOT medical card", "Hazmat endorsement", "First aid & CPR"],
    "tech": ["Security awareness", "First aid & CPR"],
    "restaurants": ["Food handler", "Alcohol server", "Food protection manager"],
    "healthcare": ["State license", "BLS certification", "DEA registration", "Background check"],
}
HR_COURSES = {
    "construction": ["Harassment prevention", "Site safety orientation", "Heat illness prevention", "Cyber security basics"],
    "education": ["Harassment prevention", "Student privacy (FERPA)", "Bloodborne pathogens", "Cyber security basics"],
    "retail": ["Harassment prevention", "Loss prevention", "Customer data privacy", "Workplace safety"],
    "industrial": ["Harassment prevention", "Machine guarding", "Hazard communication", "Cyber security basics"],
    "logistics": ["Harassment prevention", "Hours of service", "Defensive driving", "Hazard communication"],
    "tech": ["Harassment prevention", "Secure coding", "Data privacy", "Incident response"],
    "restaurants": ["Harassment prevention", "Allergen awareness", "Food safety", "Workplace safety"],
    "healthcare": ["Harassment prevention", "HIPAA privacy", "Bloodborne pathogens", "Billing compliance"],
}
HR_ONBOARD = ["Offer signed", "I-9 and E-Verify", "Tax forms", "Direct deposit", "Handbook acknowledged",
              "Benefits enrollment", "Equipment and accounts", "Training assigned"]


def build_hr(ind: dict, people: dict, units: list[dict]) -> dict:
    """The HR tab: who works here, who is out, who is joining, what is due, how reviews stand.

    Matt, 2026-11-04: *"i want to build a paycor dupe but one that makes more sense for our
    build in the demo"*. Its own seed, so adding it moves no figure on any other page, and
    every count is built from one roster so the pages cannot disagree with each other or
    with People & labor's headcount."""
    import datetime as dt
    rnd = Rand(seed_of(ind["id"] + ":hr"))
    y, m = LAST_MONTH
    today = dt.date(y, m, 28)
    iso = lambda d: d.isoformat()
    depts = people["departments"]
    sites = [u.get("short") or u["name"] for u in units][:8] or ["Main office"]
    hourly = people["costPerHead"] / 2080

    titles = people.get("titles", {})
    # Office departments sit at the head office. The ones that do the work sit at a site.
    on_site = {"construction": [0], "education": [0, 1, 2, 4], "retail": [0], "industrial": [0, 1, 2, 3],
               "logistics": [0, 2], "tech": [], "restaurants": [0, 1, 2, 3],
               "healthcare": [0, 1, 3]}[ind["id"]]
    used: set[str] = set()

    def name() -> str:
        for _ in range(60):
            n = f"{rnd.pick(HR_FIRST)} {rnd.pick(HR_LAST)}"
            if n not in used:
                used.add(n)
                return n
        n = f"{rnd.pick(HR_FIRST)} {rnd.pick(HR_LAST)} {len(used)}"
        used.add(n)
        return n

    roster = []
    for di, d in enumerate(depts):
        pool = titles.get(d["name"]) or [d["name"] + " specialist"]
        lead = name()
        for i in range(d["fte"]):
            nm = lead if i == 0 else name()
            years = rnd.next() ** 1.8 * 14 + (4 if i == 0 else 0)
            start = today - dt.timedelta(days=int(years * 365) + 1)
            kind = "Full time" if i == 0 or rnd.next() < 0.82 else ("Part time" if rnd.next() < 0.75 else "Seasonal")
            roster.append({
                "id": f"E{1000 + len(roster)}", "n": nm, "d": d["name"],
                "t": f"{d['name']} lead" if i == 0 else rnd.pick(pool),
                "ty": kind, "s": iso(start), "loc": rnd.pick(sites) if di in on_site else "Head office",
                "mgr": None if i == 0 else lead,
                "st": "On leave" if rnd.next() < 0.015 else "Active",
                "pto": round(rnd.around(64, 0.7)) if kind == "Full time" else 0,
            })

    def pick_people(k):
        out, seen = [], set()
        while len(out) < k and len(seen) < len(roster):
            r = rnd.pick(roster)
            if r["id"] not in seen:
                seen.add(r["id"]); out.append(r)
        return out

    # Time off: requests waiting on a manager, who is out in the next two weeks, the balances.
    kinds = ["Vacation", "Vacation", "Sick", "Personal", "Bereavement", "Jury duty"]
    pending = []
    for r in pick_people(rnd.int_between(5, 9)):
        f = today + dt.timedelta(days=rnd.int_between(3, 40))
        n = rnd.int_between(1, 5)
        pending.append({"id": r["id"], "n": r["n"], "d": r["d"], "k": rnd.pick(kinds[:4]),
                        "from": iso(f), "to": iso(f + dt.timedelta(days=n - 1)), "days": n,
                        "asked": rnd.int_between(0, 9)})
    out = []
    for r in pick_people(rnd.int_between(9, 16)):
        f = today + dt.timedelta(days=rnd.int_between(0, 12))
        n = rnd.int_between(1, 5)
        out.append({"n": r["n"], "d": r["d"], "k": rnd.pick(kinds),
                    "from": iso(f), "to": iso(f + dt.timedelta(days=n - 1))})
    out.sort(key=lambda o: o["from"])
    bal = []
    for d in depts:
        mine = [r for r in roster if r["d"] == d["name"] and r["pto"]]
        hrs = sum(r["pto"] for r in mine)
        bal.append({"d": d["name"], "avg": round(hrs / max(1, len(mine)), 1),
                    "liability": round(hrs * hourly * rnd.around(1, 0.2)),
                    "used": round(rnd.around(62, 0.25), 1)})

    # Hiring: each open seat from People & labor carries a pipeline, plus the last 60 days of hires.
    reqs = []
    for r in people["roles"]:
        applied = rnd.int_between(6, 60)
        screen = rnd.int_between(1, max(1, applied // 3))
        inter = rnd.int_between(0, max(0, screen // 2))
        offer = 1 if inter and rnd.next() < 0.35 else 0
        reqs.append({"t": r["title"], "d": r["dept"], "days": r["days"],
                     "stages": [applied, screen, inter, offer],
                     "src": rnd.pick(["Indeed", "Referral", "LinkedIn", "Careers page", "Job fair"])})
    recent = sorted([r for r in roster if (today - dt.date.fromisoformat(r["s"])).days <= 60],
                    key=lambda r: r["s"], reverse=True)
    if len(recent) < 4:
        for r in pick_people(4 - len(recent)):
            r["s"] = iso(today - dt.timedelta(days=rnd.int_between(3, 55)))
            recent.append(r)
        recent.sort(key=lambda r: r["s"], reverse=True)
    onboarding = []
    for r in recent[:8]:
        age = (today - dt.date.fromisoformat(r["s"])).days
        done = min(len(HR_ONBOARD), max(2, int(age / 6) + rnd.int_between(0, 2)))
        onboarding.append({"n": r["n"], "t": r["t"], "d": r["d"], "s": r["s"], "done": done})

    # Compliance: certifications due, paperwork gaps, required training.
    certs = HR_CERTS[ind["id"]]
    expiring = []
    for r in pick_people(rnd.int_between(7, 14)):
        expiring.append({"n": r["n"], "d": r["d"], "c": rnd.pick(certs),
                         "due": iso(today + dt.timedelta(days=rnd.int_between(-20, 90)))})
    expiring.sort(key=lambda e: e["due"])
    hc = len(roster)
    gaps = [
        {"k": "I-9 not complete", "n": rnd.int_between(0, 3)},
        {"k": "Handbook not acknowledged", "n": rnd.int_between(2, max(3, hc // 25))},
        {"k": "No emergency contact", "n": rnd.int_between(1, max(2, hc // 30))},
        {"k": "W-4 older than 3 years", "n": rnd.int_between(3, max(4, hc // 12))},
    ]
    courses = [{"c": c, "pct": round(rnd.around(84, 0.14), 1), "due": iso(today + dt.timedelta(days=rnd.int_between(10, 75)))}
               for c in HR_COURSES[ind["id"]]]

    # Reviews and benefits.
    reviews = [{"d": d["name"], "self": round(min(100, rnd.around(78, 0.25))), "mgr": round(min(100, rnd.around(58, 0.4)))}
               for d in depts]
    ratings = [int(round(x)) for x in spread_to_total([0.05, 0.18, 0.52, 0.2, 0.05], hc)]
    ratings[2] += hc - sum(ratings)
    eligible = sum(1 for r in roster if r["ty"] == "Full time")
    benefits = {"eligible": eligible, "medical": round(eligible * rnd.around(0.81, 0.08)),
                "dental": round(eligible * rnd.around(0.74, 0.1)), "retire": round(eligible * rnd.around(0.63, 0.15)),
                "window": [iso(dt.date(y, 11, 3)), iso(dt.date(y, 11, 21))],
                "elected": round(eligible * rnd.around(0.34, 0.3))}
    # Time and attendance: the hourly team's cards for the open pay period, with the exceptions
    # that block approval (ADP) and a trailing 30-day attendance points balance (UKG).
    period_end = today + dt.timedelta(days=(4 - today.weekday()) % 7 or 7)
    period_start = period_end - dt.timedelta(days=13)
    hourly_staff = [r for r in roster if r["ty"] != "Full time" or r["d"] == depts[0]["name"]][:40]
    ex_kinds = [("Missed punch", 0), ("Late in", 2), ("Early out", 2), ("Long break", 1), ("Absent, no call", 10)]
    cards = []
    for r in hourly_staff:
        reg = round(rnd.around(72 if r["ty"] == "Full time" else 44, 0.12), 1)
        ot = round(max(0.0, rnd.around(4, 1.0)), 1) if r["ty"] == "Full time" and rnd.next() < 0.45 else 0.0
        exc = [rnd.pick(ex_kinds)[0] for _ in range(rnd.int_between(0, 2) if rnd.next() < 0.35 else 0)]
        pts = sum(dict(ex_kinds)[e] for e in exc) + rnd.int_between(0, 9)
        cards.append({"id": r["id"], "n": r["n"], "d": r["d"], "mgr": r["mgr"], "reg": reg, "ot": ot,
                      "exc": exc, "pts": pts, "approved": not exc and rnd.next() < 0.4})

    # Payroll preview: the next run, what the provider will debit, and the people whose pay moved.
    per_run = people["payroll"]["allIn"] / 26
    gross = round(per_run * 0.84)
    taxes_ee = round(gross * 0.205)
    deductions = round(gross * 0.072)
    net = gross - taxes_ee - deductions
    taxes_er = round(gross * 0.0765 + gross * 0.008)
    run_by = period_end + dt.timedelta(days=3)
    payday = period_end + dt.timedelta(days=7)
    reasons = [("Overtime", "OT +{h}h"), ("Bonus", "Spot bonus"), ("Raise", "Raise effective this run"),
               ("Garnishment", "New garnishment order"), ("Unpaid leave", "{h}h unpaid leave"), ("New hire", "First check, partial period")]
    variances = []
    for r in pick_people(rnd.int_between(5, 9)):
        k, label = rnd.pick(reasons)
        last = round(rnd.around(people["costPerHead"] / 26, 0.3))
        move = {"Overtime": 0.22, "Bonus": 0.35, "Raise": 0.06, "Garnishment": -0.18, "Unpaid leave": -0.25, "New hire": -0.4}[k]
        variances.append({"id": r["id"], "n": r["n"], "d": r["d"], "k": k, "why": label.format(h=rnd.int_between(6, 18)),
                          "last": last, "now": round(last * (1 + move * rnd.around(1, 0.3)))})

    # One inbox for every approval (Workday), each with its route and its history so far.
    inbox = []
    for p_ in pending:
        r = next(x for x in roster if x["id"] == p_["id"])
        inbox.append({"id": f"pto-{p_['id']}-{p_['from']}", "kind": "Time off", "who": p_["n"], "pid": p_["id"],
                      "what": f"{p_['k']}, {p_['days']} day{'s' if p_['days'] > 1 else ''} from {p_['from']}",
                      "route": f"Manager ({r['mgr'] or 'Leadership'})", "age": p_["asked"],
                      "steps": [["Submitted", p_["n"], p_["asked"]], ["Manager approval", r["mgr"] or "Leadership", None]]})
    for r in pick_people(rnd.int_between(2, 4)):
        pct = round(rnd.around(4.5, 0.4), 1)
        inbox.append({"id": f"comp-{r['id']}", "kind": "Pay change", "who": r["n"], "pid": r["id"],
                      "what": f"Merit increase of {pct}%", "route": "Manager, then HR, then Finance over 5%" if pct > 5 else "Manager, then HR",
                      "age": rnd.int_between(1, 6),
                      "steps": [["Proposed", r["mgr"] or "Leadership", rnd.int_between(3, 8)], ["Manager approval", r["mgr"] or "Leadership", rnd.int_between(1, 3)],
                                ["HR review", "HR", None]] + ([["Finance approval", "Finance", None]] if pct > 5 else [])})
    for r in pick_people(rnd.int_between(1, 3)):
        inbox.append({"id": f"job-{r['id']}", "kind": "Job change", "who": r["n"], "pid": r["id"],
                      "what": f"Promotion to senior {r['t'].lower()}, effective the 1st", "route": "Manager, then HR",
                      "age": rnd.int_between(0, 5), "steps": [["Proposed", r["mgr"] or "Leadership", rnd.int_between(1, 5)], ["HR review", "HR", None]]})
    for c in [c for c in cards if c["exc"]][:4]:
        inbox.append({"id": f"tc-{c['id']}", "kind": "Timecard", "who": c["n"], "pid": c["id"],
                      "what": f"{len(c['exc'])} exception{'s' if len(c['exc']) > 1 else ''} to clear: {', '.join(c['exc'])}",
                      "route": f"Manager ({c['mgr'] or 'Leadership'})", "age": rnd.int_between(0, 2),
                      "steps": [["Period closed", "System", 0], ["Clear exceptions", c["mgr"] or "Leadership", None], ["Approve card", c["mgr"] or "Leadership", None]]})
    inbox.sort(key=lambda i: -i["age"])

    # Health score with next-best actions (Paylocity), and the latest pulse survey (BambooHR eNPS).
    enps_hist = [round(rnd.around(22, 0.5)) for _ in range(6)]
    pulse = {"enps": enps_hist[-1], "history": enps_hist, "responded": round(rnd.around(68, 0.15)),
             "promoters": round(rnd.around(44, 0.15)), "detractors": round(rnd.around(20, 0.3)),
             "themes": [["Pay and benefits", round(rnd.around(-0.3, 0.8), 2)], ["Managers", round(rnd.around(0.4, 0.6), 2)],
                        ["Workload", round(rnd.around(-0.2, 0.9), 2)], ["Growth", round(rnd.around(0.1, 1.5), 2)],
                        ["Tools and equipment", round(rnd.around(0.2, 1.2), 2)]]}

    return {
        "asOf": iso(today), "roster": roster,
        "timeoff": {"pending": pending, "out": out, "balances": bal},
        "hiring": {"reqs": reqs, "onboarding": onboarding, "steps": HR_ONBOARD,
                   "timeToFill": round(rnd.around(41, 0.3)), "accept": round(rnd.around(82, 0.1))},
        "compliance": {"expiring": expiring, "gaps": gaps, "courses": courses},
        "reviews": {"cycle": f"{y} annual review", "due": iso(dt.date(y, 12, 12)), "byDept": reviews,
                    "ratings": [int(x) for x in ratings], "goals": [round(hc * 0.61), round(hc * 0.27), round(hc * 0.12)]},
        "benefits": benefits,
        "attendance": {"from": iso(period_start), "to": iso(period_end), "cards": cards,
                       "ladder": [[10, "Verbal warning"], [20, "Written warning"], [30, "Final warning"]]},
        "payroll": {"runBy": iso(run_by), "payday": iso(payday), "people": len(roster), "gross": gross,
                    "taxesEe": taxes_ee, "deductions": deductions, "net": net, "taxesEr": taxes_er,
                    "debit": net + taxes_ee + taxes_er + deductions, "variances": variances},
        "inbox": inbox, "pulse": pulse,
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
                "name": f"{rnd.pick(PLACES)} {rnd.pick(PURSUITS.get(ind['id'], CATEGORIES))}",
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


def build_marketing(ind: dict, months: list[str], units: list[dict], pl_rows: list[dict],
                    unit_facts: list[dict]) -> dict:
    """Enrollment marketing for a school network, read from the software that holds it.

    Matt, 2026-11-10: *"inside of the education demo, we need to focus in on
    marketing and enrollment"* and *"we need to be able to derive everything
    from outside softwares with no manual entry"*. So every figure here names
    the system it comes from: spend from the ad platforms, inquiries, tours and
    applications from the CRM, enrolled students from the student information
    system. Paid spend is a share of the ledger's own Sales & marketing line,
    so the marketing page and the P&L cannot disagree about what was spent.

    Its own seeded generator, so adding it changes no other figure in the file."""
    rnd = Rand(seed_of(ind["id"] + "-marketing"))
    last12 = months[-12:]
    sales_by_m = {}
    for r in pl_rows:
        if r["l"] == "sales":
            sales_by_m[r["m"]] = sales_by_m.get(r["m"], 0.0) + r["v"]
    # name, the system the spend is read from, share of paid spend, cost per inquiry, conversion steps
    channels = [
        ("Google Ads", "google-ads", 0.46, 38.0, (0.34, 0.52, 0.58)),
        ("Meta Ads", "meta-ads", 0.38, 27.0, (0.27, 0.46, 0.52)),
        ("Organic search", "google-analytics", 0.0, 0.0, (0.40, 0.55, 0.62)),
        ("Family referrals", "hubspot", 0.0, 0.0, (0.58, 0.70, 0.74)),
        ("Open house events", "hubspot", 0.16, 61.0, (0.66, 0.61, 0.66)),
    ]
    free_inquiries = {"Organic search": 95, "Family referrals": 48}
    # enrollment season: inquiries peak January to April for an August start
    season = {1: 1.45, 2: 1.55, 3: 1.4, 4: 1.2, 5: 0.9, 6: 0.65, 7: 0.85, 8: 0.95,
              9: 0.7, 10: 0.85, 11: 1.0, 12: 0.75}
    monthly = []
    for m in last12:
        mo = int(m[5:])
        paid = round2(sales_by_m.get(m, 0.0) * 0.55)
        for name, src, share, cpi, (tour, app, enr) in channels:
            spend = round2(paid * share * rnd.around(1.0, 0.08)) if share else 0.0
            inq = int(spend / rnd.around(cpi, 0.12)) if share else int(free_inquiries[name] * season[mo] * rnd.around(1.0, 0.15))
            tours = int(inq * rnd.around(tour, 0.08))
            apps = int(tours * rnd.around(app, 0.08))
            enrolled = int(apps * rnd.around(enr, 0.08))
            monthly.append({"m": m, "channel": name, "source": src, "spend": spend,
                            "inquiries": inq, "tours": tours, "applications": apps, "enrolled": enrolled})
    # next year by campus: seats, applications, offers accepted, waitlist
    latest = months[-1]
    enrolled_now = {f["u"]: f["v"] for f in unit_facts if f["m"] == latest and f["k"] == "enrolled"}
    cap_now = {f["u"]: f["v"] for f in unit_facts if f["m"] == latest and f["k"] == "capacity"}
    campuses = []
    for u in units:
        cap = int(cap_now.get(u["id"], 0))
        if not cap:
            continue
        returning = int(enrolled_now.get(u["id"], 0) * rnd.around(0.88, 0.03))
        open_seats = max(0, cap - returning)
        fill = rnd.around(0.74, 0.25)
        apps = int(open_seats * fill * 1.6) if open_seats else int(cap * 0.08)
        accepted = min(open_seats, int(apps * rnd.around(0.55, 0.12)))
        campuses.append({"u": u["id"], "name": u["name"], "seats": cap, "returning": returning,
                         "open": open_seats, "applications": apps, "accepted": accepted,
                         "waitlist": max(0, apps - int(open_seats * 1.3))})
    return {
        "channels": [c[0] for c in channels],
        "monthly": monthly,
        "campuses": campuses,
        "sources": {"spend": ["google-ads", "meta-ads"], "funnel": ["hubspot"],
                    "traffic": ["google-analytics"], "enrolled": ["powerschool"],
                    "ledger": ["sage-intacct"]},
        "note": "Read from the ad platforms, the CRM and the student information system. Nothing on this page is typed in.",
    }


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
    "restaurants": ["Leases", "Health inspections", "Licenses & permits", "Vendors", "Payroll", "Finance"],
    "healthcare": ["Credentialing", "Payer contracts", "Policies", "Facilities", "Payroll", "Finance"],
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
    "Health inspections": ["Inspection report", "Corrective action", "Temperature log"],
    "Licenses & permits": ["Liquor license", "Food service permit", "Fire certificate"],
    "Credentialing": ["Provider credential file", "Malpractice certificate", "License renewal"],
    "Payer contracts": ["Payer agreement", "Fee schedule", "Amendment"],
    "Policies": ["Clinical policy", "HIPAA policy", "Policy acknowledgement"],
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

    The chooser draws every world before any of their extracts are loaded, so
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
    elif kind == "restaurants":
        sales = fact_sum("sales", ytd)
        value = round2((fact_sum("foodUsd", ytd) + fact_sum("laborUsd", ytd)) / sales * 100) if sales else 0.0
        fmt = "pct"
    elif kind == "healthcare":
        value, fmt = fact_sum("visits", ytd), "num"
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
