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

    def around(self, centre: float, spread: float) -> float:
        """centre, plus or minus up to spread (as a fraction of centre)."""
        return centre * (1 + (self.next() * 2 - 1) * spread)

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
                "owner": f"PM {chr(65 + i % 6)}",
                "started": f"20{year}-{rnd.int_between(1, 11):02d}",
                "start": start, "dur": dur,
            })
    elif kind == "education":
        grades = ["K-5", "K-5", "6-8", "6-8", "9-12", "K-8"]
        for i in range(n):
            place = PLACES[i * 3 % len(PLACES)]
            units.append({
                "id": f"C{i + 1}", "name": f"{place} Academy", "short": place,
                "entity": ents[0], "status": "Open", "owner": f"Principal {chr(65 + i)}",
                "grades": grades[i % len(grades)],
            })
    elif kind == "retail":
        for i in range(n):
            place = PLACES[i * 2 % len(PLACES)]
            units.append({
                "id": f"S{i + 1:02d}", "name": f"{place} Store", "short": place,
                "entity": ents[1] if i == n - 1 else ents[0],
                "status": "Trading" if i < n - 1 else "Online",
                "owner": f"Manager {chr(65 + i % 8)}",
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
                "status": "Running", "owner": f"Supervisor {chr(65 + i)}",
                "plant": plant,
            })
    elif kind == "logistics":
        for i in range(n):
            units.append({
                "id": f"{2100 + i * 3}", "name": f"Unit {2100 + i * 3}", "short": f"{2100 + i * 3}",
                "entity": ents[0] if i < n - 6 else ents[1],
                "status": "In service" if rnd.next() > 0.08 else "In shop",
                "owner": f"Driver {chr(65 + i % 12)}{i % 7}",
                "lane": LANES[i % len(LANES)],
                "terminal": ["Atlanta", "Charlotte", "Nashville"][i % 3],
            })
    else:  # tech
        for i in range(n):
            units.append({
                "id": f"P{i + 1}", "name": PRODUCT_LINES[i % len(PRODUCT_LINES)],
                "short": PRODUCT_LINES[i % len(PRODUCT_LINES)],
                "entity": ents[0], "status": "Live" if i < 3 else "Beta",
                "owner": f"PM {chr(65 + i)}",
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
    trouble = [units[2]["id"], units[min(len(units) - 1, 5)]["id"]]

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
                ("labour", oh_split[0]), ("facility", oh_split[1]), ("equip", oh_split[2]),
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
        accr_total = round2(sum(r["v"] for r in pl_rows if r["l"] == "labour" and r["m"] == month) * 0.42)
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
        "people": build_people(ind, rnd),
        "pipeline": build_pipeline(ind, rnd),
        "docs": build_docs(ind, rnd),
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
                     "cost": round2(est * pct * (1.05 if bad else 1.0)),
                     "estCost": est, "pct": round2(pct * 100), "rev": rev}
        elif kind == "education":
            cap = {"K-5": 480, "6-8": 420, "9-12": 620, "K-8": 560}[u["grades"]]
            fill = 0.72 if bad else rnd.around(0.93, 0.05)
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
                     "maint": round2(miles * (0.31 if bad else rnd.around(0.168, 0.2))),
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

def build_people(ind: dict, rnd: Rand) -> dict:
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
    parts = spread_to_total([rnd.around(1, 0.5) for _ in depts], heads)
    return {
        "headcount": heads,
        "open": rnd.int_between(3, 11),
        "turnover": round2(rnd.around({"construction": 18.4, "education": 12.1, "retail": 41.2,
                                       "industrial": 22.6, "logistics": 58.3, "tech": 9.4}[ind["id"]], 0.08)),
        "departments": [{"name": d, "fte": int(parts[i])} for i, d in enumerate(depts)],
    }


def build_pipeline(ind: dict, rnd: Rand) -> dict:
    stages = [("Identified", 0.10), ("Qualified", 0.25), ("Proposal", 0.50),
              ("Negotiation", 0.75), ("Won", 1.0)]
    rows = []
    n = 14
    for i in range(n):
        st = stages[i % len(stages)]
        value = round2(rnd.around(ind["model"]["revM0"] * 2.4, 0.8))
        rows.append({
            "name": f"{rnd.pick(PLACES)} {rnd.pick(JOB_KINDS) if ind['id'] == 'construction' else rnd.pick(CATEGORIES)}",
            "stage": st[0], "weight": st[1], "value": value,
            "weighted": round2(value * st[1]),
            "owner": f"BD {chr(65 + i % 4)}",
            "close": f"2026-{rnd.int_between(11, 12):02d}" if i % 3 else "2027-03",
        })
    return {"stages": [s[0] for s in stages], "rows": rows,
            "note": "Pipeline is never a fact. It sits beside the statements and enters none of them."}


def build_docs(ind: dict, rnd: Rand) -> dict:
    kinds = ["Contract", "Invoice", "Statement", "Report", "Drawing", "Permit",
             "Insurance", "Policy", "Lease", "Change order"]
    return {
        "count": rnd.int_between(14000, 41000),
        "recent": [
            {"name": f"{rnd.pick(PLACES)} {rnd.pick(kinds)}", "when": f"2026-10-{rnd.int_between(10, 29):02d}",
             "by": f"{chr(65 + i)}. {rnd.pick(['Reed', 'Hale', 'Monroe', 'Pike', 'Vance'])}"}
            for i in range(8)
        ],
    }


# ------------------------------------------------------------------- checks

def check(data: dict, ind: dict) -> None:
    """Refuse to write a file whose statements do not hold together."""
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
