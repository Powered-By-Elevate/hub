#!/usr/bin/env node
/*
 * The gate. It serves dist/, opens it in one Chromium, and walks every
 * industry, every view level and every page that level is offered, asserting
 * on what it finds rather than on what the code claims.
 *
 *   node tests/probe.js            # the full walk
 *   node tests/probe.js --quick    # one industry, every role
 *   node tests/probe.js --shots    # also write screenshots to tests/shots
 *
 * One browser at a time, on purpose: two headless Chromiums in a small
 * container get the second one killed, and a killed browser reads exactly like
 * a broken page.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SHOTS = path.join(__dirname, 'shots');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

let failures = 0;
let checks = 0;

function ok(cond, what, detail = '') {
  checks++;
  if (!cond) {
    failures++;
    console.log(`  FAIL  ${what}${detail ? ' — ' + detail : ''}`);
  }
  return !!cond;
}

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(DIST, url === '/' ? 'index.html' : url);
    if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, body) => {
      if (err) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function main() {
  const quick = process.argv.includes('--quick');
  const shots = process.argv.includes('--shots');
  if (shots) fs.mkdirSync(SHOTS, { recursive: true });

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  /* ⛔ A BOOT FAILURE IS NOT A CHECK FAILURE, AND IT HAS ITS OWN WITNESS.

     An import once landed inside a block comment: `node --check` passed,
     `build.py` passed, and this line threw a bare `TimeoutError` with an empty
     log while the real cause, `ReferenceError: brandVars is not defined`, was
     already sitting in the `errors` array collected two lines above. Twenty
     minutes went into reading the diff for something the page had said in one
     sentence.

     A change that produces valid syntax in the wrong place passes every static
     gate there is, and the only witness is the running page. So the wait
     reports what the page said rather than only that it timed out. */
  try {
    await page.waitForFunction('window.__hub !== undefined', { timeout: 20000 });
  } catch (e) {
    console.log('\n  THE APP DID NOT BOOT. This is a boot failure, not a check failure.');
    if (errors.length) {
      console.log('  The page said:');
      for (const line of errors.slice(0, 5)) console.log('    ' + String(line).split('\n')[0]);
    } else {
      console.log('  The page logged nothing, so look at the script tags and the module graph.');
    }
    throw e;
  }

  /* ⛔ EVERY INK READS ON EVERY SURFACE IT CAN LAND ON.

     This build shipped with NO contrast check of any kind, and `--ink-faint`
     was a WCAG AA failure for small text in the light theme the whole time:
     3.76:1 on paper, 3.34:1 on the ground, 3.07:1 on the deep ground, against
     4.5 needed. It carries every label, note, unit and caption in the build.
     Nothing reported it because nothing measured it, and the Core BI sweep
     that would have caught it was never carried over: a design ruling recorded
     against one project is not inherited by the next.

     ⚠️ This is deliberately ARITHMETIC OVER THE TOKENS, not a sweep of the
     rendered page. A DOM sweep was tried first and was not trustworthy: this
     build paints its surfaces with gradients and runtime brand colours, so a
     walk up the ancestors for `backgroundColor` finds nothing to compose
     against and falls through to white. It reported 1.03:1 on text that
     screenshots as near-white on near-black, about 14:1. Measuring text on a
     painted ground needs pixels, and until that exists this check guards the
     pairs that are decided in the stylesheet, where the answer is exact.

     What it does NOT cover, stated so nobody reads it as more than it is:
     text over a gradient, a brand colour, a chart fill, or any SVG label. */
  {
    const css = fs.readFileSync(path.join(ROOT, 'src', 'hub.css'), 'utf8');
    const block = name => {
      const i = css.indexOf(name);
      if (i < 0) return null;
      const open = css.indexOf('{', i);
      return css.slice(open + 1, css.indexOf('}', open));
    };
    const tokens = text => {
      const out = {};
      for (const m of text.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2];
      return out;
    };
    const lum = hex => {
      const v = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
        .map(x => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    const ratio = (a, b) => {
      const l1 = lum(a), l2 = lum(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const INKS = ['ink', 'ink-soft', 'ink-faint'];
    const SURFACES = ['paper', 'ground', 'ground-deep'];
    /* ⛔ AND THE PAIRINGS THE STYLESHEET ACTUALLY MAKES, BY NAME.

       The cross product above covers the inks that can land anywhere. It does
       not cover a colour used on one specific surface, and that is where the
       build's last failure hid: `.tag.warn` wore the raw `--warn` on
       `--warn-tint` at 4.45:1, a fourth surface family that is neither paper,
       ground, ground-deep nor `--tint`, so nothing looked at it. Naming the
       pairing is the only way to check it, because the pairing is a decision
       in the stylesheet rather than a property of either colour. */
    const PAIRS = [
      ['good-on-tint', 'good-tint'], ['warn-on-tint', 'warn-tint'], ['bad-on-tint', 'bad-tint'],
    ];
    const themes = {
      light: tokens(block(':root') || ''),
      dark: tokens(block(':root[data-theme="dark"]') || ''),
    };
    const fails = [];
    for (const [name, t] of Object.entries(themes)) {
      for (const ink of INKS) {
        for (const surf of SURFACES) {
          if (!t[ink] || !t[surf]) continue;
          const r = ratio(t[ink], t[surf]);
          /* 4.5:1 is AA for small text, and every one of these inks is used at
             10.5px to 13px somewhere in this build, so small is the case. */
          if (r + 0.005 < 4.5) fails.push(`${name} --${ink} on --${surf} ${r.toFixed(2)}:1`);
        }
      }
      for (const [ink, surf] of PAIRS) {
        if (!t[ink] || !t[surf]) { fails.push(`${name} --${ink} or --${surf} missing`); continue; }
        const r = ratio(t[ink], t[surf]);
        if (r + 0.005 < 4.5) fails.push(`${name} --${ink} on --${surf} ${r.toFixed(2)}:1`);
      }
    }
    ok(Object.keys(themes.light).length > 5, 'the light theme tokens parse',
      `${Object.keys(themes.light).length} found`);
    ok(Object.keys(themes.dark).length > 5, 'the dark theme tokens parse',
      `${Object.keys(themes.dark).length} found`);
    ok(fails.length === 0, 'every ink reads 4.5:1 on every surface, both themes',
      fails.join('; '));
  }

  /* ⛔ AND THE SURFACES THE STYLESHEET NEVER SEES.

     The check above is exact and structurally blind: `--tint` and every
     brand-derived ink are computed at runtime from the client's palette, so
     they do not appear in any stylesheet for arithmetic to reach. The
     publishing session's pixel sweep found four failures entirely inside that
     gap, which is the gap the comment above admits to:

       .page-eyebrow   dark   1.96 to 3.06:1   the brand colour used as ink
       .pf-bar label   light  1.83 to 2.77:1   --ink inside a saturated fill
       .panel-foot     dark   4.09 to 4.37:1   --ink-faint on --tint
       .agepill        dark   3.67 to 4.26:1   --warn and --bad used as ink

     So this imports the SAME derivation the page runs (`src/js/color.js`,
     which `Settings.apply()` calls) and asserts it over every brand in the
     config and both themes. One source, two callers, no copy to drift. It
     needs no browser, which is why it can be trusted where the DOM sweep
     could not: that one reported 1.03:1 on text screenshotting at 14:1. */
  {
    const { pathToFileURL } = require('url');
    const C = await import(pathToFileURL(path.join(ROOT, 'src', 'js', 'color.js')).href);
    const brands = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'brands.json'), 'utf8')).brands;
    const bad = [];
    let pairs = 0;
    for (const theme of ['light', 'dark']) {
      const surf = C.SURFACE[theme], ink = C.INK[theme], sem = C.SEMANTIC[theme];
      for (const [id, b] of Object.entries(brands)) {
        const v = C.brandVars(b.palette, theme);
        const on = [
          /* the faint ink carries the panel foot, which sits on the tint */
          ['--ink-faint on --tint', ink.faint, v['--tint']],
          /* the brand as ink, on both grounds it can land on */
          ['--accent-ink on ground', v['--accent-ink'], surf.ground],
          ['--accent-ink on deep', v['--accent-ink'], surf.groundDeep],
          ['--accent-on-tint', v['--accent-on-tint'], v['--tint']],
          /* the semantics as ink, on the tint and the deep ground */
          ['--good-ink on tint', v['--good-ink'], v['--tint']],
          ['--warn-ink on tint', v['--warn-ink'], v['--tint']],
          ['--bad-ink on tint', v['--bad-ink'], v['--tint']],
          ['--good-ink on deep', v['--good-ink'], surf.groundDeep],
          ['--warn-ink on deep', v['--warn-ink'], surf.groundDeep],
          ['--bad-ink on deep', v['--bad-ink'], surf.groundDeep],
          /* text INSIDE a saturated fill, where there is no hue choice */
          ['--on-accent in accent', v['--on-accent'], b.palette.accent],
          ['--on-bad in bad', v['--on-bad'], sem.bad],
          ['--on-good in good', v['--on-good'], sem.good],
          ['--on-warn in warn', v['--on-warn'], sem.warn],
        ];
        for (const [what, fg, bg] of on) {
          pairs++;
          const r = C.contrast(fg, bg);
          if (r + 0.005 < 4.5) bad.push(`${theme}/${id} ${what} ${r.toFixed(2)}:1`);
        }
      }
    }
    ok(pairs > 100, 'the brand derivation is exercised over every brand and theme', `${pairs} pairs`);
    ok(bad.length === 0, 'every brand-derived ink reads 4.5:1 on every surface it lands on',
      bad.slice(0, 3).join('; '));

    /* ⛔ AND THE LADDER, NOT JUST THE BOUND.

       Raising `--ink-faint` to clear AA flattened the hierarchy: soft-to-faint
       fell from 1.88 to 1.27 while dark, the design's own standard, runs an
       even 1.77 and 1.67. A fix that reads only the failing value will flatten
       whatever sits above it, so the scale is checked as a scale. */
    for (const theme of ['light', 'dark']) {
      const k = C.INK[theme];
      const a = C.contrast(k.ink, k.soft), b = C.contrast(k.soft, k.faint);
      /* ⚠️ A floor on each step catches the exact failure this was written for
         (the old 1.27 trips it) and nothing more general: 2.33 and 1.50 would
         pass and is the same shape of problem, as the publishing session
         pointed out. So the STEPS are compared to each other as well. An even
         ladder is what makes three tiers read as three tiers, and the dark
         theme, which is the design's own standard, runs 1.77 and 1.67. */
      const even = Math.max(a, b) / Math.min(a, b);
      ok(a > 1.45 && b > 1.45, `${theme}: every step of the ink scale is a step`,
        `ink/soft ${a.toFixed(2)}, soft/faint ${b.toFixed(2)}`);
      ok(even < 1.35, `${theme}: the ink scale's steps are even`,
        `steps differ by ${((even - 1) * 100).toFixed(0)}%`);
    }

    /* ⛔ AND THE DERIVATION REPORTS ITS OWN FAILURES.

       `worst()` returns its best attempt and cannot say that no colour
       satisfies the surfaces it was given: brute-forcing the grey space finds
       255 surface pairs where none exists, and for one of them it returns a
       value reading 1.30:1 with no signal. Every brand in the config converges
       today, so this asserts the postcondition rather than trusting it, and a
       future palette that cannot be satisfied fails here instead of shipping. */
    const unsat = [];
    for (const theme of ['light', 'dark']) {
      for (const [id, b] of Object.entries(brands)) {
        for (const m of (C.brandVars(b.palette, theme).missed || [])) {
          unsat.push(`${theme}/${id} ${m}`);
        }
      }
    }
    ok(unsat.length === 0, 'the derivation satisfies every surface it was asked for',
      unsat.slice(0, 3).join('; '));

    /* ⛔ AND IT CLEARS THE SURFACE THE WORLD ACTUALLY PAINTS.

       `world.css` lays a lit ground over `--ground`, so the declared surface
       is not the one text sits on. Measured under the page eyebrow in dark:
       rgb(12, 25, 44) against the token's rgb(14, 20, 28). Deriving to exactly
       4.5 against the token left two brands at 4.32:1 on the paint. The margin
       is in `color.js` as PAINTED; this is the check that it is enough. */
    const paintMiss = [];
    for (const [id, b] of Object.entries(brands)) {
      const v = C.brandVars(b.palette, 'dark');
      const r = C.contrast(v['--accent-ink'], '#0c192c');
      if (r + 0.005 < 4.5) paintMiss.push(`${id} ${r.toFixed(2)}:1`);
    }
    ok(paintMiss.length === 0, 'the brand ink clears the ground the world paints, not just the token',
      paintMiss.join('; '));
  }

  /* the front door: a first-time viewer lands here before any extract loads */
  const firstScreen = await page.evaluate(() => ({
    showing: window.__hub.choosing(),
    cards: (window.__hub.cards() || []).length,
    worlds: document.querySelectorAll('#chooser .world').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  ok(firstScreen.showing, 'a first visit opens on the chooser');
  ok(firstScreen.cards === 6, 'the chooser reads six cards', String(firstScreen.cards));
  ok(firstScreen.worlds === 6, 'the chooser draws six worlds', String(firstScreen.worlds));
  ok(firstScreen.overflow <= 1, 'the chooser does not scroll sideways at 1440',
    String(firstScreen.overflow));

  /* picking a world enters that demo */
  await page.evaluate(() => document.querySelector('[data-world="retail"]').click());
  await page.waitForTimeout(700);
  const entered = await page.evaluate(() => ({
    choosing: window.__hub.choosing(),
    industry: window.__hub.settings().industry,
    page: window.__hub.page(),
  }));
  ok(!entered.choosing, 'picking a world closes the chooser');
  ok(entered.industry === 'retail', 'picking a world switches the demo', entered.industry);

  /* ⛔ Picking the demo that is ALREADY loaded must still be remembered.
     Construction is the default, so a first-time viewer who picked the first
     card left no record of having chosen, and every reload put the front door
     back over whatever page they were on. Found on the live site by Claude in
     Chrome 2026-10-31 ("the address still ended in #/ops-watch, but the page
     came back on the front door"), and it survived every gate before this one
     because the probe only ever picked a DIFFERENT industry. */
  await page.evaluate("window.__hub.chooser(true)");
  await page.waitForTimeout(200);
  await page.evaluate("localStorage.removeItem('hub.settings.v2')");
  const cur = await page.evaluate('window.__hub.settings().industry');
  await page.evaluate(`document.querySelector('[data-world="${cur}"]').click()`);
  await page.waitForTimeout(500);
  const remembered = await page.evaluate(() => {
    try { return !!localStorage.getItem('hub.settings.v2'); } catch (e) { return 'blocked'; }
  });
  ok(remembered === true, 'picking the demo already loaded is still remembered', String(remembered));

  /* and it can be reopened from the rail */
  await page.evaluate(() => document.querySelector('[data-act="chooser"]').click());
  await page.waitForTimeout(260);
  ok(await page.evaluate('window.__hub.choosing()'), 'the rail reopens the chooser');
  await page.evaluate('window.__hub.chooser(false)');
  await page.waitForTimeout(140);

  /* --- the world (world.css, world.js) ---------------------------------------
     Matt, 2026-10-31: *"why dsoesnt it have the moving background and texture
     and the visuals that the core bi and launchpad have? yours is so flat"*.
     It was never ported, so these checks exist to stop it being lost again.
     The entrance is skipped for a robot by design, so the checks that matter
     force it on and then assert the page SETTLES: a reader must never be left
     looking at a half-faded panel. */
  const world = await page.evaluate(() => {
    const deco = document.getElementById('deco');
    const cs = n => getComputedStyle(n);
    const panel = document.querySelector('#page .panel');
    return {
      deco: !!deco,
      dots: !!deco && !!deco.querySelector('.dots') && !!deco.querySelector('.dots-lit'),
      trail: !!deco && deco.querySelectorAll('.tr-spark, .tr-spark-g').length === 2,
      travels: !!deco && cs(deco.querySelector('.tr-spark')).animationName === 'travel',
      ground: cs(document.body).backgroundImage.includes('gradient'),
      lifted: !!panel && cs(panel).boxShadow !== 'none' && cs(panel).borderTopWidth === '0px',
      litOff: !!deco && !deco.classList.contains('is-lit'),
    };
  });
  ok(world.deco, 'the world is drawn once in the shell');
  ok(world.dots, 'the dot grid and its lit layer are both there');
  ok(world.trail, 'the light trail carries its two spark paths');
  ok(world.travels, 'the spark travels the trail');
  ok(world.ground, 'the ground is a lit gradient, not a flat fill');
  ok(world.lifted, 'a panel is paper lifted off the sky, with no border under its ring');
  ok(world.litOff, 'the dots are unlit until a pointer is over them');

  /* the pointer lights the dots, and only inside the deco */
  await page.mouse.move(900, 150);
  await page.waitForTimeout(120);
  const lit = await page.evaluate(() => {
    const d = document.getElementById('deco');
    return { on: d.classList.contains('is-lit'), mx: d.style.getPropertyValue('--mx') };
  });
  await page.mouse.move(900, 940);
  await page.waitForTimeout(120);
  const unlit = await page.evaluate(() =>
    document.getElementById('deco').classList.contains('is-lit'));
  ok(lit.on && lit.mx !== '', 'the pointer lights the dots around it', lit.mx);
  ok(!unlit, 'the light does not follow the pointer down the page');

  /* the entrance settles: force it, let it run, assert nothing is left faded
     or displaced. A page that ends at opacity .14 is worse than no entrance. */
  await page.evaluate(() => {
    const host = document.getElementById('page');
    host.classList.remove('enter'); void host.offsetWidth; host.classList.add('enter');
  });
  await page.waitForTimeout(2400);
  const settled = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('#page .grid > *, #page .strip > .strip-item')) {
      const c = getComputedStyle(el);
      if (Number(c.opacity) < 0.99) bad.push(`opacity ${c.opacity}`);
      if (c.transform !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(c.transform)) {
        bad.push(`transform ${c.transform}`);
      }
    }
    return bad;
  });
  ok(settled.length === 0, 'the entrance settles every section it moved', settled.join('; '));

  /* The question arrives word by word, and a figure inside it stays whole: the
     splitter walks text nodes so <b>$47.4M</b> is one word, not five.
     ⚠️ Start here opens on a cover, which carries neither a verdict nor a
     .page-title, so this has to stand on a page that has one. */
  await page.evaluate("location.hash = '#/ops-watch'");
  await page.waitForTimeout(700);
  const split = await page.evaluate(() => {
    const h = document.querySelector('#page .verdict h2, #page .page-title');
    if (!h) return { none: true };
    return {
      words: h.querySelectorAll('.w').length,
      boldsWhole: [...h.querySelectorAll('b')].every(b => b.classList.contains('w')),
      bolds: h.querySelectorAll('b').length,
    };
  });
  ok(!split.none && split.words > 0, 'the question is split into words for the entrance',
    JSON.stringify(split));
  ok(!split.none && split.boldsWhole, 'a figure inside the question stays one word',
    JSON.stringify(split));

  /* --- the panel tile, the strip picker and the axis (2026-11-02) ------------ */

  /* Every panel head wears its icon on a tile. Derived from the title where no
     caller names one, so this check is what proves the derivation reaches the
     whole build rather than the handful of panels that pass `ico`. */
  const tiles = await page.evaluate(() => {
    const heads = [...document.querySelectorAll('#page .panel-head')];
    return { heads: heads.length, withTile: heads.filter(h => h.querySelector('.p-tile svg')).length };
  });
  ok(tiles.heads > 0 && tiles.withTile === tiles.heads,
    'every panel head on the page wears an icon tile',
    `${tiles.withTile} of ${tiles.heads}`);

  /* ⛔ The axis must let the data fill the plot. The ladder used to jump 5 to
     10, so a series peaking at 5.5M drew against a 10M axis and filled barely
     half the panel, in every bar and line chart in the build. Tested as
     arithmetic, because a picture of it cannot be asserted on. */
  const axis = await page.evaluate(() => {
    const peaks = [5.5e6, 3.3e6, 7.2e6, 1.9e6, 24.9e6, 890e3, 61, 4.4];
    return peaks.map(v => ({ v, max: window.__hub.niceMax(v), fill: v / window.__hub.niceMax(v) }));
  });
  const thin = axis.filter(a => a.fill < 0.7);
  ok(thin.length === 0, 'a chart axis never leaves a third of the plot empty',
    thin.map(a => `${a.v} on ${a.max} = ${Math.round(a.fill * 100)}%`).join('; '));

  /* --- the figure picks itself, in place (2026-11-02) ----------------------- */

  await page.evaluate("location.hash = '#/home'");
  await page.waitForTimeout(700);

  const inPlace = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#page .strip-item')];
    const pickable = items.filter(i => i.classList.contains('pickable'));
    return {
      figures: items.length,
      pickable: pickable.length,
      gears: document.querySelectorAll('#page .strip-swap').length,
      opts: pickable[0]?.querySelectorAll('.fig-opt').length || 0,
      withValues: [...(pickable[0]?.querySelectorAll('.fig-opt .fo-v') || [])]
        .every(n => n.textContent.trim().length > 0),
    };
  });
  ok(inPlace.pickable === inPlace.figures && inPlace.figures > 0,
    'every figure on the strip picks itself', `${inPlace.pickable} of ${inPlace.figures}`);
  ok(inPlace.gears === 0, 'no separate control is bolted to the card', String(inPlace.gears));
  ok(inPlace.opts > 1, 'the list offers this industry’s metrics', String(inPlace.opts));
  ok(inPlace.withValues, 'every option carries its own live value, so a choice is never blind');

  /* ⛔ Hovering an option shows that metric IN THE CARD, and leaving restores
     exactly what is saved. The restore is the half that broke first: F.figure
     returns markup, and a textContent round trip put the raw tags on screen. */
  const preview = await page.evaluate(() => {
    const item = document.querySelector('#page .strip-item.pickable');
    const was = item.querySelector('.strip-value').innerHTML;
    item.querySelector('.fig-open').click();
    const opts = item.querySelectorAll('.fig-opt');
    const last = opts[opts.length - 1];
    last.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    const during = item.querySelector('.strip-value').innerHTML;
    item.querySelector('.fig-menu').dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
    const after = item.querySelector('.strip-value').innerHTML;
    item.querySelector('.fig-menu').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return { was, during, after, want: last.dataset.fig, tags: /&lt;|&gt;/.test(after) };
  });
  ok(preview.during === preview.want, 'hovering a metric shows its real figure in the card',
    `${preview.during} vs ${preview.want}`);
  ok(preview.after === preview.was, 'leaving the list restores the figure that is saved',
    `${preview.after} vs ${preview.was}`);
  ok(!preview.tags, 'the restored figure is markup, not escaped tags on screen', preview.after);

  /* --- the settings console (2026-11-02) ------------------------------------ */

  await page.evaluate("location.hash = '#/settings'");
  await page.waitForTimeout(600);
  const console0 = await page.evaluate(() => ({
    navItems: document.querySelectorAll('.set-nav > button').length,
    navIcons: document.querySelectorAll('.set-nav .sn-i svg').length,
    navWhy: [...document.querySelectorAll('.set-nav > button > span > span')]
      .filter(n => n.textContent.trim()).length,
    rows: document.querySelectorAll('.srow').length,
    rowsNamed: [...document.querySelectorAll('.srow')]
      .filter(r => r.querySelector('.srow-t')?.textContent.trim()).length,
  }));
  ok(console0.navItems === 5, 'the console has its five sections', String(console0.navItems));
  ok(console0.navIcons === console0.navItems, 'each section wears its icon',
    `${console0.navIcons} of ${console0.navItems}`);
  ok(console0.navWhy === console0.navItems, 'each section says what it is for',
    `${console0.navWhy} of ${console0.navItems}`);
  ok(console0.rows > 0 && console0.rowsNamed === console0.rows,
    'every setting is a named row, not a bare field', `${console0.rowsNamed} of ${console0.rows}`);

  /* ⛔ .srow-c is a column flex container, so a flex shorthand there sets the
     HEIGHT: the first switches came out as 42px circles. Measured, not eyeballed. */
  await page.evaluate(() =>
    document.querySelector('[data-act="settab"][data-arg="modules"]').click());
  await page.waitForTimeout(500);
  const switches = await page.evaluate(() => [...document.querySelectorAll('.sw')].map(n => {
    const r = n.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  }));
  ok(switches.length > 0 && switches.every(x => x.w === 42 && x.h === 24),
    'a module switch is a switch, not a circle',
    switches.map(x => `${x.w}x${x.h}`).join(' '));

  /* --- the statement model and the data must agree (2026-11-02) -------------
     ⛔ A rename that moves `product.json` but not `data/gen.py`, or the other
     way, is a two-file version skew: the page asks for a line the extract does
     not carry, the figure comes out empty or NaN, and NOTHING fails. CI only
     asserts that three dist paths exist, so it cannot see this either.

     It nearly shipped: the British-spelling sweep renamed the overhead line id
     `labour` to `labor` in product.json AND its formula AND the generator, and
     a brief that claimed the generator was untouched would have left one side
     behind. Caught by the publishing session deriving the diff rather than
     trusting the brief. This check is so nobody has to notice next time. */
  const model = await page.evaluate(async () => {
    const base = document.body.dataset.base || '';
    const product = await (await fetch(`${base}config/product.json`)).json();
    const inds = await (await fetch(`${base}config/industries.json`)).json();
    const want = {
      pl: product.statement.pl.map(l => l.id),
      bs: product.statement.bs.map(l => l.id),
    };
    const out = [];
    for (const ind of inds.industries) {
      const d = await (await fetch(`${base}data/${ind.id}.json`)).json();
      const have = {
        pl: new Set((d.pl || []).map(r => r.l)),
        bs: new Set((d.bs || []).map(r => r.l)),
      };
      /* a derived line is computed, never stored, so it is allowed to be absent */
      const derived = new Set(product.statement.pl.concat(product.statement.bs)
        .filter(l => l.of || l.sum || l.formula).map(l => l.id));
      for (const side of ['pl', 'bs']) {
        for (const id of want[side]) {
          if (!have[side].has(id) && !derived.has(id)) out.push(`${ind.id}.${side}.${id}`);
        }
      }
    }
    return out;
  });
  ok(model.length === 0,
    'every statement line the model declares is carried by every extract',
    model.join(', '));

  /* The sibling hole, named by the publishing session the same day: the check
     above compares the model against the extracts, so a key renamed on BOTH
     sides together still passes while a third reader keeps the old spelling.
     The readers inside the model are its own formulas, and they are cheap to
     check: every id a formula names must be a line the model declares. That is
     exactly the shape the `labour` rename would have broken had the sweep
     renamed the line and not `oh`'s formula. */
  const dangling = await page.evaluate(async () => {
    const base = document.body.dataset.base || '';
    const product = await (await fetch(`${base}config/product.json`)).json();
    const lines = product.statement.pl.concat(product.statement.bs);
    const ids = new Set(lines.map(l => l.id));
    const out = [];
    for (const l of lines) {
      const refs = [];
      /* `formula` only. `of` and `sum` name ACCOUNT codes, not line ids, so
         walking them here would fail on data that is perfectly correct. */
      if (l.formula) refs.push(...String(l.formula).split(/[^A-Za-z0-9_]+/));
      for (const r of refs) {
        if (!r || /^[0-9.]+$/.test(r)) continue;
        if (!ids.has(r)) out.push(`${l.id} -> ${r}`);
      }
    }
    return out;
  });
  ok(dangling.length === 0,
    'every id a statement formula names is a line the model declares',
    dangling.join(', '));

  const industries = await page.evaluate('window.__hub.industries()');
  const roles = await page.evaluate('window.__hub.roles()');
  ok(industries.length === 6, 'six industries ship', industries.join(','));
  ok(roles.length >= 8, 'at least eight view levels', String(roles.length));

  const list = quick ? [industries[0]] : industries;

  for (const ind of list) {
    console.log(`\n${ind}`);
    await page.evaluate(`window.__hub.pick('industry', '${ind}')`);
    await page.waitForTimeout(260);

    /* the card on the front door must equal the figure the dashboard computes:
       the summary is generated in Python, so nothing but this check keeps the
       two arithmetics from drifting apart */
    await page.evaluate("window.__hub.pick('role', 'exec')");
    await page.evaluate("window.__hub.pick('basis', 'ytd')");
    await page.evaluate("window.__hub.pick('entity', '*')");
    await page.waitForTimeout(90);
    const card = await page.evaluate(`(() => {
      const c = window.__hub.cards().find(x => x.id === '${ind}');
      const k = window.__hub.kpi(c.metric);
      return { card: c.value, kpi: k.value, metric: c.metric, label: c.label,
               shown: window.__hub.cardValue(c.id) };
    })()`);
    const gap = Math.abs(card.card - card.kpi);
    const tol = Math.max(1, Math.abs(card.kpi) * 0.001);
    ok(gap <= tol, `${ind}: the chooser card matches the dashboard KPI`,
      `${card.metric}: card ${card.card}, dashboard ${card.kpi}`);
    /* the card spells its measure out for a reader who does not work in this
       industry ("Overall equipment effectiveness", not "OEE"), so the labels
       are deliberately not the same string. What must hold is that the card
       shows a real formatted figure rather than an empty box. */
    ok(/\d/.test(card.shown || ''), `${ind}: the card shows a formatted figure`, card.shown);
    ok((card.label || '').length > 3, `${ind}: the card names its measure in words`, card.label);

    /* ⛔ DRIVE THE READOUT, DO NOT JUST READ ITS DATA.

       A readout whose data parses but which never appears is the same as no
       readout, and the structural check above cannot tell the difference. So
       once per industry a real pointer is moved onto a real chart and the box
       is read off the page: it has to show, name the point, and carry one row
       per series.

       ⚠️ The chart is scrolled into view first. My own first run of this
       hovered a chart 1,228px down a 1,000px viewport, got nothing, and read
       as a broken feature: `elementFromPoint` outside the viewport returns
       null, so the pointer was over nothing at all. */
    const readout = await (async () => {
      await page.evaluate("window.__hub.go('fin-balance')");
      await page.waitForTimeout(220);
      /* ⛔ SCROLL, SETTLE, THEN MEASURE. Scrolling a panel into view arms
         world.js's settle animation, which translates the section AFTER the
         scroll: measuring in the same tick returns coordinates the chart has
         already left, and the pointer lands beside it. It failed on two
         industries out of six and passed on four, which is exactly what a
         race looks like. */
      const found = await page.evaluate(() => {
        const svg = document.querySelector('#page svg[data-hover]');
        if (!svg) return false;
        svg.scrollIntoView({ block: 'center' });
        return true;
      });
      if (!found) return { skipped: true };
      await page.waitForTimeout(320);
      const box = await page.evaluate(() => {
        const svg = document.querySelector('#page svg[data-hover]');
        if (!svg) return null;
        const r = svg.getBoundingClientRect();
        return { x: r.left + r.width * 0.55, y: r.top + r.height * 0.5,
          series: JSON.parse(svg.dataset.hover).series.map(s => s.name) };
      });
      if (!box) return { skipped: true };
      await page.mouse.move(box.x, box.y);
      await page.waitForTimeout(140);
      const seen = await page.evaluate(() => {
        const t = document.querySelector('.hoverout');
        if (!t || t.hidden) return null;
        return { text: t.innerText, rows: t.querySelectorAll('.ro-row').length };
      });
      await page.mouse.move(4, 4);
      await page.waitForTimeout(80);
      const gone = await page.evaluate(() => {
        const t = document.querySelector('.hoverout');
        return !t || t.hidden;
      });
      return { seen, gone, want: box.series };
    })();
    if (!readout.skipped) {
      ok(!!readout.seen, `${ind}: hovering a chart shows a readout`);
      if (readout.seen) {
        ok(readout.seen.rows === readout.want.length,
          `${ind}: the readout carries every series`,
          `${readout.seen.rows} rows against ${readout.want.length} series`);
        for (const name of readout.want) {
          ok(readout.seen.text.includes(name),
            `${ind}: the readout names ${name}`, readout.seen.text.replace(/\n/g, ' | '));
        }
      }
      ok(readout.gone, `${ind}: the readout clears when the pointer leaves`);
    }

    /* the statements must hold together, from inside the app's own query layer */
    const ties = await page.evaluate('window.__hub.ties()');
    ok(ties.worstBalance <= 1, `${ind}: balance sheet balances every month`, `worst ${ties.worstBalance}`);
    ok(ties.worstUnits <= 1, `${ind}: units sum to the revenue line`, `worst ${ties.worstUnits}`);
    ok(ties.months === 30, `${ind}: thirty months of history`, String(ties.months));

    /* the KPIs the industry declares must all resolve to a real number */
    const kpis = await page.evaluate('window.__hub.kpis()');
    for (const k of kpis) {
      ok(Number.isFinite(k.value), `${ind}: kpi ${k.id} is a number`, String(k.value));
      ok(!!k.label && k.label !== k.id, `${ind}: kpi ${k.id} has a label`, k.label);
    }

    for (const role of roles) {
      await page.evaluate(`window.__hub.pick('role', '${role}')`);
      await page.waitForTimeout(90);
      const pages = await page.evaluate('window.__hub.pages()');
      ok(pages.length > 0, `${ind}/${role}: at least one page`);

      for (const p of pages) {
        errors.length = 0;
        await page.evaluate(`window.__hub.go('${p}')`);
        await page.waitForTimeout(110);

        const seen = await page.evaluate(() => {
          const host = document.getElementById('page');
          const text = host.innerText || '';
          return {
            page: window.__hub.page(),
            len: text.length,
            broken: text.includes('could not be drawn'),
            empties: host.querySelectorAll('.empty').length,
            panels: host.querySelectorAll('.panel').length,
            dollars: (text.match(/\$/g) || []).length,
            charts: host.querySelectorAll('svg.chart').length,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            nan: /NaN|undefined|Infinity/.test(text),
            /* ⛔ An absurd percentage is the signature of a POSITION summed
               as if it were a FLOW. `cost`, `billed`, `earned` and `contract`
               are the figure to date at each month, so adding them across a
               window the way revenue is added multiplies by the number of
               months: the first draw of the workload scorecard printed a house
               margin of −222% and a contract 5,356% complete, and every other
               check on this page passed.

               ⛔ The bound is on the MEASURE, not on the digits. The first cut
               of this check was /-?[\d,]{4,}%/, which counts characters: it
               caught 5,356% and 5,194% and let −222% through, and −222% was
               one of the two symptoms it was written for. 356% complete is the
               same bug wearing three digits. Found by the publishing session
               testing the regex against the figures rather than reading it.

               A CHANGE can honestly be any size: logistics net income going
               $89K to $269K really is +202%. A LEVEL cannot. Changes are drawn
               inside a `.delta` tag, so this walks text nodes and skips those,
               then bounds what is left. Measured across all six industries,
               every view level and every page, exactly one level in the whole
               build passes 100%: tech's net retention at 103%, which legitimately
               does. 125 leaves that alone with room to spare and still catches
               both of the defects above. */
            wild: (() => {
              const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
              const out = [];
              let n;
              while ((n = walk.nextNode())) {
                if (n.parentElement && n.parentElement.closest('.delta')) continue;
                for (const m of (n.nodeValue || '').matchAll(/(-?[\d,]+(?:\.\d+)?)\s*%/g)) {
                  const v = Number(m[1].replace(/,/g, ''));
                  if (Number.isFinite(v) && Math.abs(v) > 125) out.push(m[0]);
                }
              }
              return out.slice(0, 3);
            })(),
          };
        });

        ok(seen.page === p, `${ind}/${role}/${p}: routed`, seen.page);
        ok(!seen.broken, `${ind}/${role}/${p}: drew without throwing`);
        ok(seen.len > 180, `${ind}/${role}/${p}: has content`, `${seen.len} chars`);
        ok(seen.panels > 0, `${ind}/${role}/${p}: has a panel`);
        ok(!seen.nan, `${ind}/${role}/${p}: no NaN, undefined or Infinity on the page`);
        ok(seen.wild.length === 0,
          `${ind}/${role}/${p}: no level past 125% (a position summed as a flow)`,
          seen.wild.join(', '));
        ok(seen.overflow <= 1, `${ind}/${role}/${p}: no sideways scroll at 1440`, String(seen.overflow));

        /* ⛔ No panel left with a hole in it. `balanceRows()` stretches a row's
           cards to one bottom edge, which is what removes the dead space Matt
           reported three times, and un-stretches any card it cannot honestly
           fill. If that guard stops firing, the hole moves INSIDE the card,
           which is the 830px defect the Core BI audit paid for once already.

           ⛔ Measure the BODY, not the panel. The foot is pinned to the bottom
           edge, so a stretched panel's lowest drawing child is its own bottom
           and the slack reads zero however empty it is. The first cut of this
           measurement was fooled exactly that way and reported a clean build
           with 1,810px of empty card on it. */
        const holes = await page.evaluate(() => {
          const out = [];
          for (const panel of document.querySelectorAll('#page .grid > .panel')) {
            const body = panel.querySelector('.panel-body');
            if (!body) continue;
            const box = body.getBoundingClientRect();
            if (box.height < 40) continue;
            let low = box.top;
            for (const kid of body.querySelectorAll('*')) {
              const k = kid.getBoundingClientRect();
              if (!k.height && !k.width) continue;
              if (k.bottom > low) low = k.bottom;
            }
            const gap = Math.round(box.bottom - low);
            if (gap > 340) out.push(`${(panel.querySelector('h3') || {}).textContent || '?'} ${gap}px`);
          }
          return out;
        });
        ok(holes.length === 0, `${ind}/${role}/${p}: no panel left with a hole in it`,
          holes.slice(0, 2).join(', '));

        /* ⛔ AND NO ROW LEFT WITH A COLUMN OF NOTHING DOWN ITS SIDE.

           The check above catches a hole INSIDE a card. This one catches the
           hole BESIDE it, which is what Matt actually kept seeing. Both are
           needed: `balanceRows()` trades one for the other, so a change that
           fixes either by breaking the other has to fail.

           Measured from NATURAL heights, because `.grid` stretches its
           children and stretched siblings all report the row's height, which
           is a comparison that can never find a mismatch. */
        const ragged = await page.evaluate(() => {
          const ps = [...document.querySelectorAll('#page .grid > .panel')];
          /* ⛔ PUT BACK EXACTLY WHAT WAS THERE, NOT WHAT YOU ADDED.

             This read adds `.unstretch` to measure natural heights, and the
             first cut took it off again afterwards. `balanceRows` sets that
             same class as its own decision, so the removal wiped the fix on
             every panel that had been corrected, and every check that runs
             after this one was reading a page the gate itself had broken: the
             pooled-white check below failed on nine panels that were measured
             correct seconds earlier in isolation. Save the className, restore
             the className. */
          const had = ps.map(e => e.className);
          for (const e of ps) e.classList.add('unstretch');
          void document.body.offsetHeight;
          const info = ps.map(e => ({
            t: ((e.querySelector('h3') || {}).textContent || '?').trim().slice(0, 30),
            h: e.getBoundingClientRect().height, top: Math.round(e.getBoundingClientRect().top),
          }));
          ps.forEach((e, i) => { e.className = had[i]; });
          void document.body.offsetHeight;
          const rows = [];
          for (const k of info) {
            const r = rows.find(x => Math.abs(x.top - k.top) < 8);
            if (r) r.items.push(k); else rows.push({ top: k.top, items: [k] });
          }
          return rows.filter(r => r.items.length > 1)
            .map(r => ({ mis: Math.round(Math.max(...r.items.map(x => x.h)) - Math.min(...r.items.map(x => x.h))),
              who: r.items.map(x => x.t).join(' + ') }))
            .filter(r => r.mis > 300)
            .map(r => `${r.who} (${r.mis}px)`);
        });
        ok(ragged.length === 0, `${ind}/${role}/${p}: no row left ragged`,
          ragged.slice(0, 2).join(', '));

        /* ⛔ EVERY PANEL EITHER SHARES ITS SLACK OR ENDS AT ITS CONTENT.

           This is the dead-space invariant, and it is deliberately STRUCTURAL
           rather than a number. The previous guards each named a threshold
           (320px for the hole, 250px for the widen), and the publishing
           session was right that a threshold measured against today's build
           is a constant fitted to its own data: the gaps stopped at 233px
           against a 250px floor, so the rule could never fire on the thing
           Matt kept raising.

           What is actually true has no number in it. A panel with slack has
           exactly two honest outcomes: share the room above and below its
           content, or end where its content ends. Anything else is white
           pooled under the content, which is what reads as a hole. So the
           check asks which outcome each panel took, and a panel that took
           neither fails however many pixels it happens to be. */
        const unresolved = await page.evaluate(() => {
          const out = [];
          for (const panel of document.querySelectorAll('#page .grid > .panel')) {
            const body = panel.querySelector('.panel-body');
            if (!body) continue;
            const box = body.getBoundingClientRect();
            if (box.height < 40) continue;
            let low = box.top;
            for (const kid of body.querySelectorAll('*')) {
              const k = kid.getBoundingClientRect();
              if (!k.height && !k.width) continue;
              if (k.bottom > low) low = k.bottom;
            }
            const gap = Math.round(box.bottom - low);
            if (gap <= 70) continue;
            const cs = getComputedStyle(body);
            const centred = cs.display === 'flex' && cs.justifyContent === 'center';
            if (panel.classList.contains('unstretch') || centred) continue;
            out.push(`${((panel.querySelector('h3') || {}).textContent || '?').trim().slice(0, 30)} (${gap}px pooled)`);
          }
          return out;
        });
        ok(unresolved.length === 0,
          `${ind}/${role}/${p}: every panel with slack shares it or ends at its content`,
          unresolved.slice(0, 2).join(', '));

        /* ⛔ NO GRID LEAVES A LAST ROW HOLDING ONE OF THREE.

           `auto-fit` has a third outcome nobody wants. The three ratio dials
           placed two and dropped the third onto a row of its own between 428px
           and 492px of grid, which showed at 1024 and 960, ordinary laptop
           widths. A last row holding one of three is the ragged bottom this
           build spent the day removing one floor up, so it fails here too,
           and the rule is structural: either every row is full or there is one
           item per row.

           ⚠️ Scoped to a UNIFORM track. The first cut swept `#page .grid` too
           and failed on four pages, wrongly: that grid is a column-span
           layout, so a last row holding one panel is a deliberate full-width
           panel and not an orphan at all. The rule only means anything where
           every item has the same width, so that is the condition, read off
           the items themselves rather than from a list of class names.

           ⚠️ AND THE WIDTH TEST IS NOT WHAT BOUNDS THIS CHECK. The publishing
           session swept every container on every page, ignoring the two
           selectors: 2,989 have three or more uniform-width children across
           more than one row, 8 orphan their last item, and this check catches
           none of them. All 8 are variable-length lists where an orphan cannot
           be avoided (nine items cannot fill a two-wide track), so no defect
           is missed. But "uniform width" READS as a general rule and is not
           one: what actually bounds this check is the two selectors, and the
           width test is a class list in disguise.

           The property that makes the dials different is that they are a
           fixed, small, COMPLETE set whose count the layout can choose to
           match, and nothing in the DOM distinguishes "three items because
           there are three ratios" from "seven items because there are seven
           trucks". So this stays selector-scoped on purpose, and a new set of
           known count has to be named here to be guarded. Saying so is the
           whole point: the wording above, left alone, would have told whoever
           adds a fourth dial set that they were already covered. */
        const orphans = await page.evaluate(() => {
          const out = [];
          for (const g of document.querySelectorAll('#page .dials, #page .grid')) {
            const kids = [...g.children].filter(k => k.getBoundingClientRect().height > 4);
            if (kids.length < 3) continue;
            const ws = kids.map(k => Math.round(k.getBoundingClientRect().width));
            if (Math.max(...ws) - Math.min(...ws) > 2) continue;   /* not a uniform track */
            const rows = [];
            for (const k of kids) {
              const t = Math.round(k.getBoundingClientRect().top);
              const r = rows.find(x => Math.abs(x.t - t) < 6);
              if (r) r.n++; else rows.push({ t, n: 1 });
            }
            if (rows.length < 2) continue;
            const counts = rows.map(r => r.n);
            const last = counts[counts.length - 1];
            if (counts[0] > 1 && last === 1 && counts.slice(0, -1).every(n => n === counts[0])) {
              out.push(`${g.className} ${JSON.stringify(counts)}`);
            }
          }
          return out;
        });
        ok(orphans.length === 0, `${ind}/${role}/${p}: no grid orphans its last item`,
          orphans.slice(0, 2).join(', '));

        /* ⛔ A FILED ROW KEEPS BOTH FACTS THAT IDENTIFY IT.

           A filing is named `<place> - <date> <type>` and the row used to cut
           the end of the string, which is the type: the publishing session
           measured 196px shown of 371px needed at 1024, so nearly half went
           and what went was the only part that tells one filing from the next.
           Place and type are now both on the line and the date has moved to
           the meta row.

           Read from the rects the text PAINTS, not from clientWidth: a span
           inside a `-webkit-box` reports clientWidth 0, which made the first
           version of this measurement report every row as fine. */
        const filed = await page.evaluate(() => {
          const out = [];
          for (const row of document.querySelectorAll('#page .jf-row')) {
            const n = row.querySelector('.jf-n');
            if (!n) continue;
            const box = n.getBoundingClientRect();
            const shown = el => el && [...el.getClientRects()].length > 0 &&
              [...el.getClientRects()].every(r => r.bottom <= box.bottom + 1 && r.top >= box.top - 1);
            const t = row.querySelector('.jf-t'), h = row.querySelector('.jf-h');
            if (!t) continue;                       /* a name off the pattern stays whole */
            if (n.scrollHeight > n.clientHeight + 1) { out.push(`clamped: ${t.textContent}`); continue; }
            if (!shown(t)) out.push(`type cut: ${t.textContent}`);
            else if (!shown(h)) out.push(`place cut: ${h && h.textContent}`);
          }
          return out;
        });
        ok(filed.length === 0, `${ind}/${role}/${p}: a filed row keeps its place and its type`,
          filed.slice(0, 2).join(', '));

        /* ⛔ NO CHART LABEL SITS ON ANOTHER.

           Matt, twice in one pass: *"this is bad. i literally cannot read any
           of it"* on a 48-point scatter whose every dot was named, and
           *"overlapping text on the graph"* on a slope chart printing "Net
           income" over "EBITDA". Both looked like data and read like damage,
           and the gate had nothing to say about either.

           Seven separate causes behind one symptom, every one of them found by
           this measurement rather than by reading the code: labelling every
           point of a crowded scatter, a slope chart with no collision pass,
           an axis thinned by COUNT instead of by the room each label has, a
           wrapped waterfall label whose two lines were closer than the text is
           tall, a scatter rule caption competing with point labels, a slope
           label climbing into the column heading, and a two-line stack label.
           A rule that reads well at 1440 can collide at 1100, so this runs at
           whatever width the gate is using and the sweep covers both. */
        const collisions = await page.evaluate(() => {
          const els = [...document.querySelectorAll('#page svg text')]
            .map(e => ({ t: e.textContent.trim(), r: e.getBoundingClientRect() }))
            .filter(o => o.r.width && o.r.height);
          const out = [];
          for (let a = 0; a < els.length; a++) {
            for (let b = a + 1; b < els.length; b++) {
              const x = els[a].r, z = els[b].r;
              if (x.left < z.right - 1 && z.left < x.right - 1
                && x.top < z.bottom - 1 && z.top < x.bottom - 1) {
                out.push(`${els[a].t} / ${els[b].t}`);
              }
            }
          }
          return out;
        });
        ok(collisions.length === 0, `${ind}/${role}/${p}: no chart label sits on another`,
          collisions.slice(0, 2).join(' , '));

        /* ⛔ A figure strip is never a grid child. `.strip` is its own flex row
           and `.grid` is a twelve-column layout, so a strip placed inside the
           grid collapses into one column and lies across the panel beside it.
           I shipped that bug on Pipeline, fixed it, and then wrote it again on
           Work in progress, which is what a gate is for. */
        const strayStrip = await page.evaluate(() =>
          document.querySelectorAll('#page .grid > .strip').length);
        ok(strayStrip === 0, `${ind}/${role}/${p}: no figure strip inside the panel grid`,
          `${strayStrip} found`);

        /* ⛔ THE HOVER READOUT HAS TO AGREE WITH THE CHART IT DESCRIBES.

           Matt: *"all items should be interactive. when i hover over an item,
           it needs to show data on each line or dot or whatever"*. The readout
           carries its figures as data written at draw time, so the one defect
           it can have is DRIFT: a series whose values no longer line up with
           the labels, which would report September's figure under October's
           name and look entirely plausible doing it.

           Checked structurally on every page, and driven for real once per
           industry below, because a readout that parses but never appears is
           the same as no readout. */
        const hoverBad = await page.evaluate(() => {
          const out = [];
          for (const svg of document.querySelectorAll('#page svg[data-hover]')) {
            let d;
            try { d = JSON.parse(svg.dataset.hover); } catch { out.push('unparseable'); continue; }
            if (!Array.isArray(d.labels) || !d.labels.length) { out.push('no labels'); continue; }
            if (!Number.isFinite(d.padL) || !Number.isFinite(d.iw)) { out.push('no plot box'); continue; }
            for (const sr of d.series || []) {
              if (!sr.name) out.push('a series with no name');
              if ((sr.values || []).length !== d.labels.length) {
                out.push(`${sr.name}: ${(sr.values || []).length} values against ${d.labels.length} labels`);
              }
            }
          }
          return out;
        });
        ok(hoverBad.length === 0, `${ind}/${role}/${p}: the hover readout lines up with its chart`,
          hoverBad.slice(0, 2).join(', '));

        /* ⛔ A schedule's axis, its today line and its bars must measure from
           the SAME box. The first cut positioned the axis and the line against
           the whole row, which is wider than the bars' column, and nudged them
           with a hard-coded margin: the line landed on May 2027 on a page as of
           October 2026, seven months out, against bars drawn correctly. Three
           things on one axis is three chances to drift, so the gate checks they
           still share an edge. */
        const sched = await page.evaluate(() => {
          const axis = document.querySelector('.gt-axis .gt-track');
          const bar = document.querySelector('.gt-rows .gt-row:not(.gt-nowrow) .gt-track');
          const now = document.querySelector('.gt-now');
          if (!axis || !bar) return null;
          const a = axis.getBoundingClientRect(), b = bar.getBoundingClientRect();
          const out = { dx: Math.round(Math.abs(a.left - b.left)),
            dw: Math.round(Math.abs(a.width - b.width)), nowIn: true };
          if (now) {
            const n = now.getBoundingClientRect();
            out.nowIn = n.left >= b.left - 2 && n.left <= b.right + 2;
          }
          return out;
        });
        if (sched) {
          ok(sched.dx <= 1 && sched.dw <= 1,
            `${ind}/${role}/${p}: the schedule's axis and its bars share one box`,
            `left off by ${sched.dx}px, width off by ${sched.dw}px`);
          ok(sched.nowIn, `${ind}/${role}/${p}: the schedule's today line is on its own axis`);
        }
        ok(errors.length === 0, `${ind}/${role}/${p}: console clean`, errors.slice(0, 2).join(' | '));

        /* a level that may not see money must not leak a single currency mark */
        const money = await page.evaluate(`window.__hub.settings().roles
          .find(r => r.id === '${role}').money`);
        if (money === 'none' && p !== 'settings') {
          ok(seen.dollars === 0, `${ind}/${role}/${p}: no currency at a no-money level`,
            `${seen.dollars} dollar signs`);
        }
      }
      console.log(`  ${role.padEnd(12)} ${pages.length} pages`);
    }

    /* back to the top level for the remaining checks */
    await page.evaluate("window.__hub.pick('role', 'exec')");

    /* the basis buttons must move the figures on a page that offers them */
    await page.evaluate("window.__hub.go('fin-dash')");
    const byBasis = {};
    for (const b of ['month', 'ytd', 'ttm', 'fy']) {
      await page.evaluate(`window.__hub.pick('basis', '${b}')`);
      byBasis[b] = await page.evaluate("window.__hub.sum('rev')");
    }
    const distinct = new Set(Object.values(byBasis).map(v => Math.round(v)));
    ok(distinct.size >= 3, `${ind}: the basis switch actually moves revenue`,
      JSON.stringify(byBasis));
    await page.evaluate("window.__hub.pick('basis', 'ytd')");

    /* a company pick must narrow the figures, never widen them */
    const all = await page.evaluate("window.__hub.sum('rev')");
    const entIds = await page.evaluate('window.__hub.settings(), window.__hub.months().length');
    ok(entIds === 30, `${ind}: thirty months reachable`, String(entIds));

    /* both themes must render */
    for (const theme of ['dark', 'light']) {
      errors.length = 0;
      await page.evaluate(`window.__hub.pick('theme', '${theme}')`);
      await page.waitForTimeout(80);
      const bg = await page.evaluate(
        "getComputedStyle(document.body).backgroundColor");
      ok(!!bg && bg !== 'rgba(0, 0, 0, 0)', `${ind}: ${theme} theme paints a background`, bg);
      ok(errors.length === 0, `${ind}: ${theme} theme console clean`, errors[0] || '');
    }

    /* the drill-down. It is a hidden page, so the page walk above never opens
       it, and a row that invites a click has to reward one. */
    {
      errors.length = 0;
      await page.evaluate("window.__hub.pick('role', 'exec')");
      await page.evaluate("window.__hub.go('ops-units')");
      await page.waitForTimeout(120);
      const opened = await page.evaluate(() => {
        const row = document.querySelector('tbody tr[data-click]');
        if (!row) return null;
        row.click();
        return row.dataset.click;
      });
      ok(!!opened, `${ind}: a unit row opens something`);
      await page.waitForTimeout(220);
      const seen = await page.evaluate(() => {
        const host = document.getElementById('page');
        const text = host.innerText || '';
        return {
          page: window.__hub.page(),
          len: text.length,
          panels: host.querySelectorAll('.panel').length,
          charts: host.querySelectorAll('svg.chart').length,
          nan: /NaN|undefined|Infinity/.test(text),
          notInScope: text.includes('not in this view level'),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      ok(seen.page === 'ops-detail', `${ind}: the click lands on the drill-down`, seen.page);
      ok(!seen.notInScope, `${ind}: the unit it opened is in scope`);
      ok(seen.panels >= 4, `${ind}: the drill-down rewards the click`, `${seen.panels} panels`);
      ok(seen.charts >= 2, `${ind}: the drill-down draws`, `${seen.charts} charts`);
      ok(seen.len > 400, `${ind}: the drill-down has content`, `${seen.len} chars`);
      ok(!seen.nan, `${ind}: no NaN on the drill-down`);
      ok(seen.overflow <= 1, `${ind}: the drill-down does not scroll sideways`, String(seen.overflow));
      ok(errors.length === 0, `${ind}: drill-down console clean`, errors[0] || '');
    }

    /* presentation mode: one panel per screen, arrows advance, Escape leaves */
    for (const p of ['fin-dash', 'ops-home']) {
      errors.length = 0;
      await page.evaluate(`window.__hub.go('${p}')`);
      await page.waitForTimeout(110);
      const on = await page.evaluate('window.__hub.present()');
      await page.waitForTimeout(160);
      const seen = await page.evaluate(() => {
        const slides = [...document.querySelectorAll('[data-slide]')];
        const shown = slides.filter(e => getComputedStyle(e).display !== 'none');
        return {
          on: window.__hub.presenting(),
          of: window.__hub.slide().of,
          shown: shown.length,
          text: shown.length ? (shown[0].innerText || '').length : 0,
          chromeBar: !!document.getElementById('present-bar'),
          railHidden: getComputedStyle(document.getElementById('rail')).display === 'none',
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      ok(on && seen.on, `${ind}/${p}: presentation mode opens`);
      ok(seen.of > 1, `${ind}/${p}: more than one slide`, String(seen.of));
      ok(seen.shown === 1, `${ind}/${p}: exactly one slide on screen`, String(seen.shown));
      ok(seen.text > 40, `${ind}/${p}: the slide on screen has content`, `${seen.text} chars`);
      ok(seen.chromeBar, `${ind}/${p}: the presenter bar is drawn`);
      ok(seen.railHidden, `${ind}/${p}: the rail is out of the way`);
      ok(seen.overflow <= 1, `${ind}/${p}: no sideways scroll while presenting`, String(seen.overflow));

      /* every slide must draw something: a blank slide in front of a board is
         the failure this check exists for, and it has already caught one */
      let blanks = 0;
      for (let i = 0; i < seen.of; i++) {
        await page.evaluate(`window.__hub.slide(${i})`);
        await page.waitForTimeout(60);
        const len = await page.evaluate(() => {
          const el = document.querySelector('[data-current="true"]');
          if (!el) return 0;
          if (getComputedStyle(el).display === 'none') return 0;
          const r = el.getBoundingClientRect();
          return r.width > 100 && r.height > 100 ? (el.innerText || '').length : 0;
        });
        if (len < 20) blanks++;
      }
      ok(blanks === 0, `${ind}/${p}: no blank slides`, `${blanks} of ${seen.of} blank`);

      await page.evaluate('window.__hub.slide(0)');
      const moved = await page.evaluate('window.__hub.slideNext()');
      ok(moved === 1, `${ind}/${p}: advancing moves the slide`, String(moved));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(120);
      ok(!(await page.evaluate('window.__hub.presenting()')),
        `${ind}/${p}: Escape leaves presentation mode`);
      ok(errors.length === 0, `${ind}/${p}: presentation console clean`, errors[0] || '');
    }

    /* the phone */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate('window.__hub.chooser(true)');
    await page.waitForTimeout(220);
    const chPhone = await page.evaluate(
      'document.documentElement.scrollWidth - document.documentElement.clientWidth');
    ok(chPhone <= 1, `${ind}: the chooser does not scroll sideways at 390`, String(chPhone));
    await page.evaluate('window.__hub.chooser(false)');
    await page.waitForTimeout(120);
    for (const p of ['fin-dash', 'ops-units', 'settings']) {
      await page.evaluate(`window.__hub.go('${p}')`);
      await page.waitForTimeout(110);
      const over = await page.evaluate(
        'document.documentElement.scrollWidth - document.documentElement.clientWidth');
      ok(over <= 1, `${ind}/${p}: no sideways scroll at 390`, String(over));
    }
    await page.setViewportSize({ width: 1440, height: 950 });

    if (shots) {
      for (const p of ['home', 'fin-dash', 'ops-home', 'ops-units', 'settings']) {
        await page.evaluate(`window.__hub.go('${p}')`);
        await page.waitForTimeout(220);
        await page.screenshot({ path: path.join(SHOTS, `${ind}-${p}.png`), fullPage: false });
      }
    }
  }

  /* the settings console: every tab draws, and a brand change reaches the page */
  console.log('\nsettings');
  await page.evaluate("window.__hub.go('settings')");
  for (const tab of ['brand', 'conns', 'levels', 'modules', 'deploy']) {
    errors.length = 0;
    await page.evaluate(`window.__hub.pick('tab', '${tab}')`);
    await page.waitForTimeout(130);
    const seen = await page.evaluate(() => ({
      len: (document.getElementById('page').innerText || '').length,
      broken: (document.getElementById('page').innerText || '').includes('could not be drawn'),
    }));
    ok(!seen.broken && seen.len > 300, `settings/${tab}: draws`, `${seen.len} chars`);
    ok(errors.length === 0, `settings/${tab}: console clean`, errors[0] || '');
  }

  /* a connector toggle must change what the configuration exports */
  await page.evaluate("window.__hub.pick('tab', 'conns')");
  await page.waitForTimeout(160);
  const before = await page.evaluate('window.__hub.connected().length');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-act="disconnect"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(140);
  const after = await page.evaluate('window.__hub.connected().length');
  ok(after === before - 1, 'disconnecting a connector removes it from the configuration',
    `${before} then ${after}`);

  /* the exported configuration must be the real shape */
  const cfg = await page.evaluate('window.__hub.config()');
  ok(!!cfg.brand && !!cfg.client && Array.isArray(cfg.connectors) && Array.isArray(cfg.roles),
    'the exported configuration carries brand, client, connectors and levels');

  await browser.close();
  server.close();

  console.log(`\n${checks - failures} of ${checks} checks pass`);
  if (failures) {
    console.log(`${failures} FAILED`);
    process.exit(1);
  }
  console.log('ALL CHECKS PASS');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
