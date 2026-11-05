#!/usr/bin/env python3
"""
Push dist/ to the repository that serves the demo.

    python3 deploy/push.py <owner/repo> [--branch main] [--path ""] [--dry-run]

It builds first, then writes the built files into a clone of the target and
pushes. The site is the repository root by default, because Pages with the
Actions source serves whatever is uploaded and a subdirectory only buys a
longer URL.

The target repository has to exist already: a cloud session cannot create one
(403 for an integration token on the organisation route, and the personal
route is PAT-only). Creating it by hand takes about thirty seconds, and after
that this script is the whole deployment.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def run(cmd, cwd=None, check=True):
    print('   ', ' '.join(str(c) for c in cmd))
    return subprocess.run(cmd, cwd=cwd, check=check, text=True, capture_output=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('target', help='owner/repo')
    ap.add_argument('--branch', default='main')
    ap.add_argument('--path', default='', help='subdirectory inside the repo')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    subprocess.run([sys.executable, str(ROOT / 'build.py')], check=True)
    dist = ROOT / 'dist'
    if not dist.exists():
        raise SystemExit('no dist/ to push')

    url = f'https://github.com/{args.target}'
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp) / 'repo'
        try:
            run(['git', 'clone', '--depth', '1', url, str(work)])
        except subprocess.CalledProcessError as err:
            print(err.stderr)
            raise SystemExit(
                f'could not clone {args.target}. Create the repository first, '
                'then attach it to this session with add_repo.')

        dest = work / args.path if args.path else work
        # clear what we own, keep the repo's own files (workflow, licence, readme)
        for name in ('index.html', 'hub.css', 'js', 'config', 'data', 'manifest.json', '.nojekyll'):
            p = dest / name
            if p.is_dir():
                shutil.rmtree(p)
            elif p.exists():
                p.unlink()
        dest.mkdir(parents=True, exist_ok=True)
        for item in dist.iterdir():
            target = dest / item.name
            if item.is_dir():
                shutil.copytree(item, target)
            else:
                shutil.copy2(item, target)

        wf = work / '.github' / 'workflows'
        wf.mkdir(parents=True, exist_ok=True)
        shutil.copy2(HERE / 'pages.yml', wf / 'pages.yml')

        run(['git', 'add', '-A'], cwd=work)
        status = run(['git', 'status', '--porcelain'], cwd=work)
        if not status.stdout.strip():
            print('nothing changed')
            return
        if args.dry_run:
            print(status.stdout)
            print('dry run: nothing pushed')
            return
        run(['git', '-c', 'user.name=Claude', '-c', 'user.email=noreply@anthropic.com',
             'commit', '-m', 'Hub demo: publish dist'], cwd=work)
        run(['git', 'push', '-u', 'origin', args.branch], cwd=work)
        owner, repo = args.target.split('/')
        print(f'\npushed. Pages will serve it at '
              f'https://{owner.lower()}.github.io/{repo}/{args.path}')


if __name__ == '__main__':
    main()
