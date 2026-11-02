#!/usr/bin/env python3
"""
Assemble the Hub into dist/, ready for GitHub Pages.

    python3 build.py              # regenerate data, then build
    python3 build.py --no-data    # build from the data already in data/out
    python3 build.py --serve 8000 # build, then serve dist/ for a look
    python3 build.py --tenant <id> # one client's Hub, from their client.json and work/hub.json,
                                   # into local-only/hub-tenants/<id>/work/dist (never the repo)

There is no bundler and no npm. The app is ES modules, the configuration and
the data are JSON fetched at runtime, and the whole of dist/ is static files,
which is the only requirement Pages has.
"""
from __future__ import annotations

import argparse
import hashlib
import http.server
import json
import shutil
import socketserver
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DIST = HERE / "dist"


def strip_notes(node):
    """Drop every $-prefixed key, at any depth."""
    if isinstance(node, dict):
        return {k: strip_notes(v) for k, v in node.items() if not k.startswith("$")}
    if isinstance(node, list):
        return [strip_notes(v) for v in node]
    return node


def _cfg(name: str) -> dict:
    return strip_notes(json.loads((HERE / "config" / f"{name}.json").read_text(encoding="utf-8")))


# Catalogue rows for the two ledger routes the harness adds beyond config/connectors.json
EXTRA_CONNECTORS = {
    "filedrop": {"id": "filedrop", "name": "File drop", "cat": "finance", "auth": "None: a scheduled export to a folder",
                 "api": "CSV or XLSX trial balance", "status": "built",
                 "note": "Reads the trial balance your ledger exports to a folder on a schedule."},
    "merge-accounting": {"id": "merge-accounting", "name": "Merge", "cat": "finance", "auth": "Merge Link",
                         "api": "Merge Accounting API", "status": "built",
                         "note": "Reads income statements and balance sheets from your ledger through Merge."},
}


def tenant_config(client: dict, doc: dict) -> dict:
    """The five config documents for one client: their company, brand, industry, connected software and levels,
    with every sample company and every demo switch left out."""
    product, brands, inds = _cfg("product"), _cfg("brands"), _cfg("industries")
    conns, roles = _cfg("connectors"), _cfg("roles")
    ind = next((i for i in inds["industries"] if i["id"] == client["industry"]), None)
    if not ind:
        raise SystemExit(f"industry {client['industry']!r} is not in config/industries.json")
    name = client["displayName"]
    brand = dict(brands["brands"].get(client["brand"]) or brands["brands"]["default"])
    if client["brand"] not in brands["brands"] or client["brand"] == "default":
        brand["name"] = name
        brand["mono"] = "".join(w[0] for w in name.split()[:3]).upper() or brand["mono"]
    picked: dict[str, list[str]] = {}
    for cat, items in (client.get("connectors") or {}).items():
        picked[cat] = [e["id"] for e in items or [] if e.get("id")]
    known = {c["id"] for c in conns["connectors"]}
    conns["connectors"] += [EXTRA_CONNECTORS[i] for ids in picked.values() for i in ids
                            if i in EXTRA_CONNECTORS and i not in known]
    levels = {v.get("level") for v in client.get("views") or []}
    if levels:
        roles["roles"] = [r for r in roles["roles"] if r["id"] in levels]
    product["tenant"] = {"id": client["id"], "company": name}
    product.pop("demoNotice", None)
    ind = {**ind, "company": name, "brand": client["brand"], "connected": picked,
           "entities": [{"id": e["id"], "name": e["name"], "kind": ""} for e in doc["entities"]]}
    if not doc.get("unitFacts"):
        # a ledger alone resolves these, and every other figure reads unit facts it does not have,
        # which would print as a confident zero
        keep = ["revenue", "grossMargin", "cashDays"] + (
            ["stockTurn"] if any(r["l"] == "inv" and r["v"] for r in doc.get("bs", [])) else [])
        ind["kpis"] = [k for k in ind.get("kpis", []) if k in keep] + [k for k in keep if k not in ind.get("kpis", [])]
        ind["headline"] = {"metric": "revenue", "label": "Revenue", "says": "Revenue stands at {v}"}
    return {"product": product, "brands": {**brands, "brands": {client["brand"]: brand}},
            "industries": {**inds, "industries": [ind]}, "connectors": conns, "roles": roles}


def build_tenant(tid: str) -> dict:
    sys.path.insert(0, str(HERE / "tenant"))
    import harness
    work = harness.root() / tid / "work"
    hub = work / "hub.json"
    if not hub.exists():
        raise SystemExit(f"no {hub}: run tenant/harness.py build {tid} first")
    client = harness.load(tid)
    doc = json.loads(hub.read_text(encoding="utf-8"))
    return build(no_data=True, dist=work / "dist", tenant=(client, doc))


def build(no_data: bool = False, dist: Path = DIST, tenant: tuple | None = None) -> dict:
    DIST = dist  # noqa: N806  one name for both builds below
    if not no_data:
        subprocess.run([sys.executable, str(HERE / "data" / "gen.py")], check=True)

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    # the app
    shutil.copy2(HERE / "src" / "index.html", DIST / "index.html")
    shutil.copy2(HERE / "src" / "hub.css", DIST / "hub.css")
    shutil.copy2(HERE / "src" / "world.css", DIST / "world.css")
    shutil.copytree(HERE / "src" / "js", DIST / "js")

    # Configuration, with every $-prefixed key stripped. These files are fetched
    # by the browser, so they are published documents: the notes in the repo
    # copies are written for whoever maintains them, not for a prospect reading
    # the network tab.
    (DIST / "config").mkdir()
    if tenant:
        client, doc = tenant
        for name, cfg in tenant_config(client, doc).items():
            (DIST / "config" / f"{name}.json").write_text(json.dumps(cfg, separators=(",", ":")))
        (DIST / "data").mkdir()
        (DIST / "data" / f"{client['industry']}.json").write_text(json.dumps(doc, separators=(",", ":")))
        return _finish(DIST, [client["industry"]])
    for name in ("product", "brands", "industries", "connectors", "roles"):
        src = HERE / "config" / f"{name}.json"
        doc = strip_notes(json.loads(src.read_text()))   # also refuses invalid JSON
        (DIST / "config" / f"{name}.json").write_text(json.dumps(doc, separators=(",", ":")))

    # data
    (DIST / "data").mkdir()
    industries = json.loads((HERE / "config" / "industries.json").read_text())["industries"]
    for ind in industries:
        src = HERE / "data" / "out" / f"{ind['id']}.json"
        if not src.exists():
            raise SystemExit(f"no data for {ind['id']}: run data/gen.py")
        shutil.copy2(src, DIST / "data" / f"{ind['id']}.json")

    # the front door reads this one small file instead of the six large ones
    summary = HERE / "data" / "out" / "summary.json"
    if not summary.exists():
        raise SystemExit("no data/out/summary.json: run data/gen.py without --only")
    shutil.copy2(summary, DIST / "data" / "summary.json")

    return _finish(DIST, [i["id"] for i in industries])


def _finish(DIST: Path, industries: list[str]) -> dict:  # noqa: N803
    # Pages serves the repo as-is; .nojekyll stops it hiding anything underscored
    (DIST / ".nojekyll").write_text("")

    files = sorted(p for p in DIST.rglob("*") if p.is_file())
    total = sum(p.stat().st_size for p in files)
    manifest = {
        "files": len(files),
        "bytes": total,
        "industries": industries,
        "hash": hashlib.sha256(
            b"".join(p.read_bytes() for p in files)).hexdigest()[:12],
    }
    (DIST / "manifest.json").write_text(json.dumps(manifest, indent=2))
    manifest["dist"] = str(DIST)
    print(f"dist {DIST}: {manifest['files']} files, {total / 1024:.0f} KB, hash {manifest['hash']}")
    return manifest


def serve(port: int, root: Path = DIST) -> None:
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(root), **kw)

        def log_message(self, *a):
            pass

    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"serving {root} at http://127.0.0.1:{port}/  (ctrl-c to stop)")
        httpd.serve_forever()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-data", action="store_true")
    ap.add_argument("--serve", type=int, default=0)
    ap.add_argument("--tenant", help="build one client's Hub from local-only/hub-tenants/<id>")
    args = ap.parse_args()
    m = build_tenant(args.tenant) if args.tenant else build(args.no_data)
    if args.serve:
        serve(args.serve, Path(m["dist"]))


if __name__ == "__main__":
    main()
