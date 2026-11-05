#!/usr/bin/env python3
"""
Assemble the Hub into dist/, ready for GitHub Pages.

    python3 build.py              # regenerate data, then build
    python3 build.py --no-data    # build from the data already in data/out
    python3 build.py --serve 8000 # build, then serve dist/ for a look

⛔ This script builds THE DEMO and nothing else. It takes no client, names no
client path, and has no flag that needs a directory outside this tree. A caller
that assembles its own configuration passes it to build() through `configs` and
`data`, which is a generic escape hatch with no client vocabulary in it: the
published repo was carrying a --tenant flag that imported a directory the
published repo does not have, and whose own help text named a local-only path.

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


def build(no_data: bool = False, dist: Path = DIST,
          configs: dict | None = None, data: dict | None = None) -> dict:
    """Assemble dist/.

    `configs` and `data`, when given, replace the demo's own: a mapping of
    config name to document, and of industry id to its extract. Nothing here
    knows what a caller is building, which is the point.
    """
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
    shutil.copytree(HERE / "src" / "img", DIST / "img")

    # Configuration, with every $-prefixed key stripped. These files are fetched
    # by the browser, so they are published documents: the notes in the repo
    # copies are written for whoever maintains them, not for a prospect reading
    # the network tab.
    (DIST / "config").mkdir()
    if configs is not None:
        for name, cfg in configs.items():
            (DIST / "config" / f"{name}.json").write_text(json.dumps(cfg, separators=(",", ":")))
        (DIST / "data").mkdir()
        for ind, doc in (data or {}).items():
            (DIST / "data" / f"{ind}.json").write_text(json.dumps(doc, separators=(",", ":")))
        return _finish(DIST, list((data or {}).keys()))
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


def _stamp_assets(DIST: Path) -> str:  # noqa: N803
    """Put this build's stamp on every script and stylesheet address.

    Pages tells browsers to keep JS and CSS for ten minutes while the config is
    fetched fresh, so after a publish a browser could pair the new menu with the
    old code: the rail offered HR, the old app.js had no HR pages, and the click
    fell back to Start here (Matt, 2026-11-05). A stamped address is a new file
    to the browser, so a page can only ever load code from one build.
    """
    import re
    parts = sorted(p for p in DIST.rglob("*") if p.suffix in (".js", ".css") and p.is_file())
    stamp = hashlib.sha256(b"".join(p.read_bytes() for p in parts)).hexdigest()[:10]
    imp = re.compile(r"""((?:\bfrom|\bimport)\s*\(?\s*)(['"])(\.{1,2}/[^'"?]+\.js)\2""")
    for p in DIST.joinpath("js").rglob("*.js"):
        s = p.read_text(encoding="utf-8")
        t = imp.sub(lambda m: f"{m[1]}{m[2]}{m[3]}?v={stamp}{m[2]}", s)
        if t != s:
            p.write_text(t, encoding="utf-8")
    idx = DIST / "index.html"
    html = re.sub(r"""((?:src|href)=")((?:js/)?[\w./-]+\.(?:js|css))(")""",
                  lambda m: f"{m[1]}{m[2]}?v={stamp}{m[3]}", idx.read_text(encoding="utf-8"))
    idx.write_text(html, encoding="utf-8")
    return stamp


def _finish(DIST: Path, industries: list[str]) -> dict:  # noqa: N803
    stamp = _stamp_assets(DIST)
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
    args = ap.parse_args()
    m = build(args.no_data)
    if args.serve:
        serve(args.serve, Path(m["dist"]))


if __name__ == "__main__":
    main()
