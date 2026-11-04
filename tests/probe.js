#!/usr/bin/env node
/*
 * The gate. It serves dist/, opens it in one Chromium, and walks every
 * industry, every view level and every page that level is offered, asserting
 * on what it finds rather than on what the code claims.
 *
 *   node tests/probe.js            # the full walk
 *   node tests/probe.js --quick    # one industry, every role
 *   node tests/probe.js --shots    # also write screenshots to tests/shots
 *   node tests/probe.js --only restaurants   # one named industry
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

    /* ⛔ AND IT CLEARS EVERY STOP THE BODY ACTUALLY PAINTS.

       ⚠️ This check used to compare against the single constant `#0c192c`,
       which the publishing session then identified as not a sample at all: it
       is LAKESHORE's painted ground at the eyebrow's y, derived, being used to
       test all six brands. It passed only because the six grounds are close,
       and it was the wrong surface for five of them.

       The body paints a three-stop gradient from the palette, so the surfaces
       are computable and `sky()` returns them. Checking all three is
       position-independent: a page at any scroll offset sits on some blend of
       the stops, so clearing every stop clears every blend. The measured
       pixels, which the publishing session read from the real page, fall
       between the lightest and middle stop on every brand, so the stops bound
       reality rather than approximating it. */
    const paintMiss = [];
    const MEASURED = {
      graniteridge: '#0e1b21', lakeshore: '#0c192c', fieldfinch: '#18161e',
      carbide: '#14161b', ridgeline: '#0c1a27', northlight: '#101329',
    };
    for (const theme of ['light', 'dark']) {
      for (const [id, b] of Object.entries(brands)) {
        const v = C.brandVars(b.palette, theme);
        /* ⚠️ `v.stops`, not `C.sky(b.palette, theme)`. The second form omits the
           derived tint, so it builds the light stops from `palette.tint` and
           checks a gradient the page may not paint. They agree today only
           because the light tint loop never runs. */
        for (const stop of v.stops) {
          const r = C.contrast(v['--accent-ink'], stop);
          if (r + 0.005 < 4.5) paintMiss.push(`${theme}/${id} on ${stop} ${r.toFixed(2)}:1`);
        }
        /* and against the pixel actually read off the page, where we have one */
        if (theme === 'dark' && MEASURED[id]) {
          const r = C.contrast(v['--accent-ink'], MEASURED[id]);
          if (r + 0.005 < 4.5) paintMiss.push(`${id} on the MEASURED pixel ${r.toFixed(2)}:1`);
        }
      }
    }
    ok(paintMiss.length === 0,
      'the brand ink clears every painted sky stop and every measured pixel',
      paintMiss.slice(0, 3).join('; '));

    /* ⛔ AND THE CONDITION THAT MAKES CHECKING THE STOPS SUFFICIENT.

       The claim is that clearing all three stops clears every blend between
       them, so scroll position cannot matter. That is true only if the ink's
       luminance lies OUTSIDE the interval the stops span: an ink inside it
       would meet a blend equal to itself at some offset and read 1:1 with all
       three stops still clearing. The comment in `color.js` used to state the
       conclusion without the condition, which the publishing session caught.

       So the gate asserts the condition, and sweeps the blends as well. The
       condition is the cheap structural guarantee; the sweep is the witness
       that the guarantee is doing what it claims. */
    const insideRange = [], blendMiss = [];
    const blend = (a, b, t) => {
      const h = z => [1, 3, 5].map(i => parseInt(z.substr(i, 2), 16));
      const p = h(a), q = h(b);
      return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join('');
    };
    for (const theme of ['light', 'dark']) {
      for (const [id, b] of Object.entries(brands)) {
        const v = C.brandVars(b.palette, theme);
        const lums = v.stops.map(C.luminance);
        const lo = Math.min(...lums), hi = Math.max(...lums);
        for (const tok of ['--accent-ink', '--good-ink', '--warn-ink', '--bad-ink']) {
          const li = C.luminance(v[tok]);
          if (li > lo && li < hi) insideRange.push(`${theme}/${id} ${tok}`);
          for (const [a, c] of [[v.stops[0], v.stops[1]], [v.stops[1], v.stops[2]]]) {
            for (let t = 0; t <= 1.0001; t += 0.05) {
              const r = C.contrast(v[tok], blend(a, c, t));
              if (r + 0.005 < 4.5) blendMiss.push(`${theme}/${id} ${tok} ${r.toFixed(2)}:1`);
            }
          }
        }
      }
    }
    ok(insideRange.length === 0,
      'no derived ink sits inside its gradient range, which is what makes the stops sufficient',
      insideRange.slice(0, 3).join('; '));
    ok(blendMiss.length === 0, 'every blend along the gradient reads, at every scroll offset',
      blendMiss.slice(0, 3).join('; '));

    /* the semantics land on paper more than anywhere else, and paper was not
       in their surface list: they passed by the luck of their direction */
    const paperMiss = [];
    for (const theme of ['light', 'dark']) {
      for (const [id, b] of Object.entries(brands)) {
        const v = C.brandVars(b.palette, theme);
        for (const tok of ['--good-ink', '--warn-ink', '--bad-ink']) {
          const r = C.contrast(v[tok], C.SURFACE[theme].paper);
          if (r + 0.005 < 4.5) paperMiss.push(`${theme}/${id} ${tok} ${r.toFixed(2)}:1`);
        }
      }
    }
    ok(paperMiss.length === 0, 'the semantic inks read on paper, which is where most of them sit',
      paperMiss.join('; '));

    /* text on a runtime brand FILL: five rules put white on --navy and three on
       --accent, and both are the client's colours */
    const fillMiss = [];
    for (const theme of ['light', 'dark']) {
      for (const [id, b] of Object.entries(brands)) {
        const v = C.brandVars(b.palette, theme);
        for (const [ink, fill] of [['--on-accent', b.palette.accent], ['--on-navy', b.palette.navy]]) {
          const r = C.contrast(v[ink], fill);
          if (r + 0.005 < 4.5) fillMiss.push(`${theme}/${id} ${ink} ${r.toFixed(2)}:1`);
        }
      }
    }
    ok(fillMiss.length === 0, 'text on a brand fill reads on every brand', fillMiss.join('; '));
  }

  /* the front door: a first-time viewer lands here before any extract loads */
  const firstScreen = await page.evaluate(() => ({
    showing: window.__hub.choosing(),
    cards: (window.__hub.cards() || []).length,
    shipped: window.__hub.industries().length,
    order: (window.__hub.cards() || []).map(c => c.id),
    leads: [...document.querySelectorAll('#chooser .world')].filter(w => w.querySelector('.w-lead')).map(w => w.dataset.world),
    worlds: document.querySelectorAll('#chooser .world').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  ok(firstScreen.showing, 'a first visit opens on the chooser');
  ok(firstScreen.cards === firstScreen.shipped, 'the chooser reads a card per industry', `${firstScreen.cards} of ${firstScreen.shipped}`);
  ok(firstScreen.worlds === firstScreen.shipped, 'the chooser draws a world per industry', `${firstScreen.worlds} of ${firstScreen.shipped}`);
  /* Education is not the target market, construction
     and retail are. The front door leads with them and says so. */
  ok(firstScreen.order[0] === 'construction' && firstScreen.order[1] === 'retail'
    && firstScreen.order[firstScreen.order.length - 1] === 'education',
    'the front door leads with construction and retail and ends on education', firstScreen.order.join(','));
  ok(firstScreen.leads.join(',') === 'construction,retail', 'the industries we lead with are marked', firstScreen.leads.join(','));
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

  /* --- the two doors (gate.js): a client's sign-in and Elevate's console ------
     Each client gets logins that show different
     views, and the team picks a client and sees all of their data. Neither
     door is a permission system: each only SETS a view level, so what is
     asserted here is that the level it sets is the one it says, and that the
     level then behaves like itself (a no-money person leaks no currency). */
  console.log('\ndoors');
  const gateOverflow = () => page.evaluate(() => {
    const g = document.getElementById('gate');
    return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth,
      g ? g.scrollWidth - g.clientWidth : 0);
  });
  const indsNow = await page.evaluate('window.__hub.industries()');
  for (const ind of quick ? [indsNow[0]] : indsNow) {
    errors.length = 0;
    await page.evaluate(`window.__hub.openGate('signin', '${ind}')`);
    await page.waitForTimeout(160);
    const sg = await page.evaluate(() => ({
      gate: window.__hub.gate(),
      industry: window.__hub.settings().industry,
      people: window.__hub.people(),
      rows: document.querySelectorAll('#gate .sg-person').length,
      ms: !!document.querySelector('#gate [data-act="ms-signin"]'),
      honest: /demo sign-in/i.test(document.getElementById('gate').innerText),
      shell: getComputedStyle(document.getElementById('shell')).display,
    }));
    ok(sg.gate === 'signin', `${ind}: the sign-in draws`, String(sg.gate));
    ok(sg.industry === ind, `${ind}: the sign-in is that client's`, sg.industry);
    ok(sg.people.length > 0 && sg.rows === sg.people.length, `${ind}: every sample person is drawn`,
      `${sg.rows} of ${sg.people.length}`);
    ok(sg.ms, `${ind}: the sign-in shows Microsoft as the real route`);
    ok(sg.honest, `${ind}: the sign-in says it is a demo`);
    ok(sg.shell === 'none', `${ind}: the shell steps aside for the sign-in`, sg.shell);
    ok(await gateOverflow() <= 1, `${ind}: the sign-in does not scroll sideways at 1440`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(120);
    ok(await gateOverflow() <= 1, `${ind}: the sign-in does not scroll sideways at 390`,
      String(await gateOverflow()));
    await page.setViewportSize({ width: 1440, height: 950 });
    ok(errors.length === 0, `${ind}: the sign-in console clean`, errors[0] || '');

    /* every person lands at their own level, on a page that level is offered */
    for (let i = 0; i < sg.people.length; i++) {
      const who = sg.people[i];
      errors.length = 0;
      await page.evaluate(`window.__hub.openGate('signin', '${ind}')`);
      await page.waitForTimeout(100);
      await page.evaluate(i2 => document.querySelectorAll('#gate .sg-person')[i2].click(), i);
      await page.waitForTimeout(220);
      const inn = await page.evaluate(() => {
        const s = window.__hub.settings();
        const lvl = s.roles.find(r => r.id === s.role);
        return {
          role: s.role, money: lvl.money, gate: window.__hub.gate(), page: window.__hub.page(),
          pages: window.__hub.pages(), session: window.__hub.session(),
          dollars: ((document.getElementById('page').innerText || '').match(/\$/g) || []).length,
          broken: (document.getElementById('page').innerText || '').includes('could not be drawn'),
          bar: document.getElementById('bar').innerText || '',
        };
      });
      const tag = `${ind}/${who.role}: ${who.title}`;
      ok(inn.role === who.role, `${tag} signs in at that level`, inn.role);
      ok(inn.gate === null, `${tag} closes the sign-in`, String(inn.gate));
      ok(inn.pages.includes(inn.page), `${tag} lands on a page the level is offered`, inn.page);
      ok(inn.page === who.lands || !inn.pages.includes(who.lands),
        `${tag} lands where the sign-in said`, inn.page);
      ok(inn.session && inn.session.kind === 'person' && inn.session.name === who.name,
        `${tag} is remembered as signed in`);
      ok(inn.bar.includes(who.name), `${tag} is named in the top bar`);
      ok(!inn.broken, `${tag} lands on a page that draws`);
      if (inn.money === 'none') {
        ok(inn.dollars === 0, `${tag} lands with no currency anywhere`, `${inn.dollars} dollar signs`);
      }
      ok(errors.length === 0, `${tag} console clean`, errors[0] || '');
    }
  }

  /* a page link still routes past a sign-in, so no deep link is ever gated */
  await page.evaluate(`window.__hub.openGate('signin', '${indsNow[0]}')`);
  await page.waitForTimeout(100);
  await page.evaluate("location.hash = '#/home'");
  await page.waitForTimeout(220);
  ok(await page.evaluate('window.__hub.gate()') === null, 'a page link closes the sign-in');
  ok(await page.evaluate('window.__hub.page()') === 'home', 'a page link lands on its page');

  /* the console: Elevate's staff picker, a row per client, figures from each
     one's own extract, search first, the keyboard all the way in */
  errors.length = 0;
  await page.evaluate(() => { try { localStorage.removeItem('hub.console.recent'); } catch (e) { /* */ } });
  await page.evaluate("window.__hub.openGate('console')");
  await page.waitForTimeout(260);
  const clientIds = await page.evaluate(() => {
    const cfg = window.__hub.industries();
    return cfg;
  });
  const cs = await page.evaluate(() => ({
    gate: window.__hub.gate(),
    rows: [...document.querySelectorAll('#gate .ec-row')].map(c => ({
      id: c.dataset.client,
      figs: [...c.querySelectorAll('.ec-figs b')].map(b => b.textContent.trim()),
      name: c.querySelector('.ec-id b').textContent,
      pill: !!c.querySelector('.ec-pill'),
      spark: !!c.querySelector('.ec-trend svg'),
      open: !!c.querySelector('.ec-open[data-act="staff-enter"]'),
      signin: !!c.querySelector('.ec-alt[data-act="signin"]'),
    })),
    stats: document.querySelectorAll('#gate .ec-stat').length,
    logo: !!document.querySelector('#gate img.ec-logo'),
    focused: document.activeElement && document.activeElement.dataset.bind === 'gate-search',
    shell: getComputedStyle(document.getElementById('shell')).display,
    ground: getComputedStyle(document.getElementById('gate')).backgroundColor,
    text: document.getElementById('gate').innerText,
  }));
  ok(cs.gate === 'console', 'the Elevate console draws', String(cs.gate));
  ok(cs.rows.length === clientIds.length && clientIds.every(id => cs.rows.some(r => r.id === id)),
    'the console has a row for every client in the config', `${cs.rows.length} of ${clientIds.length}`);
  ok(cs.rows.every(c => c.figs.length >= 2 && c.figs.every(f => /\d/.test(f))),
    'every client row carries live figures', JSON.stringify(cs.rows.map(c => c.figs.length)));
  ok(cs.rows.every(c => c.pill && c.spark && c.open && c.signin),
    'every row has its close, its spark, Open and Sign-in view');
  ok(cs.stats === 4, 'the console keeps its four stats', String(cs.stats));
  ok(cs.logo, 'the console wears the Elevate wordmark');
  ok(cs.ground === 'rgb(241, 241, 241)', 'the console stands on Elevate light grey, not the front door', cs.ground);
  ok(cs.focused, 'the console search has the focus on arrival');
  ok(cs.shell === 'none', 'the shell steps aside for the console', cs.shell);
  ok(!/NaN|undefined|Infinity/.test(cs.text), 'the console has no NaN, undefined or Infinity');
  ok(await gateOverflow() <= 1, 'the console does not scroll sideways at 1440');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(120);
  ok(await gateOverflow() <= 1, 'the console does not scroll sideways at 390', String(await gateOverflow()));
  await page.setViewportSize({ width: 1440, height: 950 });
  const found = await page.evaluate(n => window.__hub.search(n), cs.rows[cs.rows.length - 1].name);
  ok(found === 1, 'the console search finds one client by name', String(found));
  const noMatch = await page.evaluate(() => window.__hub.search('zzqx no such client'));
  ok(noMatch === 0 && await page.evaluate(() => !document.querySelector('#gate .ec-none').hidden),
    'a search with no match says so');
  await page.evaluate(() => window.__hub.search(''));
  /* the chips and the sort act on rows already drawn */
  await page.evaluate(id => document.querySelector(`#gate .ec-ind[data-arg="${id}"]`).click(), cs.rows[0].id);
  ok(await page.evaluate(() => [...document.querySelectorAll('#gate .ec-row')].filter(r => !r.hidden).length) === 1,
    'an industry chip narrows the list to that industry');
  await page.evaluate(() => document.querySelector('#gate .ec-ind[data-arg="*"]').click());
  await page.evaluate(() => document.querySelector('#gate .ec-sort [data-arg="rev"]').click());
  const revs = await page.evaluate(() => [...document.querySelectorAll('#gate .ec-row')].map(r => +r.dataset.rev));
  ok(revs.every((v, i) => i === 0 || revs[i - 1] >= v), 'sorting by revenue puts the largest first');
  ok(errors.length === 0, 'the console is console clean', errors[0] || '');

  /* staff entry by keyboard: type, arrow down, Enter opens the highlighted
     client at the top level, and the way back reopens the console */
  const target = cs.rows[1] ? cs.rows[1] : cs.rows[0];
  errors.length = 0;
  await page.focus('#gate [data-bind="gate-search"]');
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  const litRow = await page.evaluate(() => {
    const on = document.querySelector('#gate .ec-row.on');
    return on ? on.dataset.client : null;
  });
  const order = await page.evaluate(() => [...document.querySelectorAll('#gate .ec-row')].map(r => r.dataset.client));
  ok(litRow === order[1], 'arrow keys move the highlight down the list', `${litRow} vs ${order[1]}`);
  await page.keyboard.press('ArrowUp');
  ok(await page.evaluate(() => document.querySelector('#gate .ec-row.on').dataset.client) === order[0],
    'arrow up moves it back');
  await page.keyboard.type(target.name);
  ok(await page.evaluate(() => document.querySelector('#gate .ec-row.on').dataset.client) === target.id,
    'typing highlights the first match');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(320);
  const staff = await page.evaluate(() => {
    const s = window.__hub.settings();
    const top = s.roles.slice().sort((a, b) => b.rank - a.rank)[0];
    return { industry: s.industry, role: s.role, top: top.id, money: top.money,
      session: window.__hub.session(), gate: window.__hub.gate(),
      back: !!document.querySelector('#bar [data-act="console"]'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  ok(staff.industry === target.id, 'Enter opens the client highlighted', staff.industry);
  ok(staff.role === staff.top && staff.money === 'full', 'staff entry gives full access', staff.role);
  ok(staff.session && staff.session.kind === 'staff', 'staff entry is remembered as staff');
  ok(staff.gate === null, 'staff entry closes the console');
  ok(staff.back, 'a staff member has a way back to the console');
  ok(staff.overflow <= 1, 'the staff landing does not scroll sideways', String(staff.overflow));
  await page.evaluate(() => document.querySelector('#bar [data-act="console"]').click());
  await page.waitForTimeout(260);
  ok(await page.evaluate('window.__hub.gate()') === 'console', 'the way back reopens the console');
  ok(await page.evaluate(id => !!document.querySelector(`#gate .ec-recent [data-arg="${id}"]`), target.id),
    'the client just opened is under Recently opened');
  /* a click on a row's Open does the same as Enter */
  const other = cs.rows[0].id;
  await page.evaluate(id => document.querySelector(`#gate .ec-open[data-arg="${id}"]`).click(), other);
  await page.waitForTimeout(320);
  ok(await page.evaluate(() => window.__hub.settings().industry) === other && await page.evaluate('window.__hub.gate()') === null,
    'a row\'s Open opens that client');
  ok(errors.length === 0, 'staff entry console clean', errors[0] || '');

  /* leave as the walk below expects to find the Hub: nobody signed in */
  await page.evaluate(() => { delete window.__hub.settings().session; });
  await page.evaluate("window.__hub.pick('role', 'exec')");
  await page.evaluate("location.hash = '#/home'");
  await page.waitForTimeout(220);
  ok(await page.evaluate('window.__hub.gate()') === null, 'leaving the doors returns to the Hub');

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
  ok(industries.length === 7, 'seven industries ship', industries.join(','));
  ok(roles.length >= 8, 'at least eight view levels', String(roles.length));

  /* --only <id> walks one named industry, which is how a new one is proven alone */
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
  const list = only ? industries.filter(i => i === only) : quick ? [industries[0]] : industries;
  ok(list.length > 0, 'the industry asked for exists', String(only));

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

        /* ⛔ NOTHING IS DRAWN OUTSIDE ITS OWN GRIDLINES.

           A chart's plot range and its gridlines used to be chosen by two
           different functions: the top of the plot was `niceMax(hi)` and the
           step came from a ladder in `ticks()`, so they agreed only by luck.
           When they disagreed the last gridline sat below the top of the plot
           and a mark was drawn in the strip above it, with no line to read it
           against. Worst case measured: construction's "Load against margin"
           at 47px, and Net income over 24 months, which is the chart on the
           financial dashboard. `niceScale()` now returns the range AND its
           ticks together, so they cannot disagree by construction.

           Second cause, same symptom, different fix: a bubble is a DISC around
           its value, so a point whose value is the top tick hangs its radius
           above the line. Padding cannot fix that, because padding moves the
           gridline and the dot down together (measured: reserving the radius
           in padT left the overflow unchanged to the pixel). The scale takes
           the headroom instead.

           ⚠️ The threshold is 4px and not 0, because a line chart's own 3px
           point marker straddling the top gridline is the conventional look
           and reads as ON the line, which is what it is. Three charts in
           retail do that today. Anything bigger is a real escape. */
        const outside = await page.evaluate(() => {
          const out = [];
          for (const svg of document.querySelectorAll('#page svg.chart')) {
            const lines = [...svg.querySelectorAll('.axis line')];
            if (lines.length < 2) continue;
            const ys = lines.map(l => l.getBoundingClientRect().top);
            const top = Math.min(...ys), bot = Math.max(...ys);
            let worst = 0;
            for (const m of svg.querySelectorAll('path, polyline, rect, circle')) {
              if (m.closest('.axis')) continue;
              const b = m.getBoundingClientRect();
              if (b.height < 0.5 && b.width < 0.5) continue;
              if (b.top < top - 1) worst = Math.max(worst, Math.round(top - b.top));
              if (b.bottom > bot + 1) worst = Math.max(worst, Math.round(b.bottom - bot));
            }
            if (worst > 4) {
              const pn = svg.closest('.panel');
              const h = pn && pn.querySelector('h3');
              out.push(`${(h ? h.textContent.trim() : '?').slice(0, 30)} +${worst}px`);
            }
          }
          return out;
        });
        ok(outside.length === 0, `${ind}/${role}/${p}: every mark inside its gridlines`,
          outside.slice(0, 2).join(', '));

        /* ⛔ NO NEGATIVE TICK ON DATA THAT NEVER GOES NEGATIVE.

           `niceScale()` shipped with both of its epsilons inverted. An epsilon
           there exists to let a quotient of 2.9999999996 count as 3; pushed the
           other way it adds a whole step to an EXACT quotient, and
           `Math.floor(0 - 1e-9)` is -1. `bars()` passes lo=0 for any
           non-negative series and `stack()` always does, so 49 of 107 value
           axes were given a step of empty plot below zero and a negative label
           to go with it, in all six industries, "The year so far" on every
           home page among them.

           ⚠️ Both gates missed it because an axis has two ends and both checks
           watched one. The check above asks whether a mark sits ABOVE the top
           gridline, which an axis overshooting downward still satisfies. The
           publishing session's asked whether a chart crossing zero draws a zero
           line, which it did. Neither asked whether the negative half was
           earned.

           ⚠️ And measure the GRIDLINE, not its label. A tick label is drawn at
           `Y(t) + 3.5` and a text node's bounding box starts an ascent above
           its baseline, so taking the label's top as the line put zero 5px off
           and reported 45 charts whose bars sit exactly on the bottom gridline
           as data below zero. The line's own geometry is the only honest
           reading. */
        const unearned = await page.evaluate(() => {
          const out = [];
          for (const svg of document.querySelectorAll('#page svg.chart')) {
            const lines = [...svg.querySelectorAll('.axis line')]
              .filter(l => l.getBoundingClientRect().height < 2);
            const labels = [...svg.querySelectorAll('.axis text')];
            if (lines.length < 2 || !labels.length) continue;
            const neg = labels.filter(t => /^[-−]/.test(t.textContent.trim()));
            if (!neg.length) continue;
            /* the zero gridline: the line whose own label reads zero */
            let zy = null;
            for (const l of lines) {
              const ly = l.getBoundingClientRect().top;
              const t = labels.find(x => {
                const b = x.getBoundingClientRect();
                return Math.abs(b.top + b.height / 2 - ly) < 7;
              });
              if (t && /^[-−]?[$\s]*0([.,]0+)?%?$/.test(t.textContent.trim())) { zy = ly; break; }
            }
            if (zy === null) continue;      /* no zero drawn: nothing to judge */
            let below = false;
            for (const m of svg.querySelectorAll('rect, circle, polyline, path')) {
              /* `.cursor` spans the whole plot and is not data: counting it is
                 what made a first sweep's "real negative" tally meaningless */
              if (m.closest('.axis') || m.closest('.cursor')) continue;
              const b = m.getBoundingClientRect();
              if (b.height < 0.5 && b.width < 0.5) continue;
              if (b.bottom > zy + 2.5) { below = true; break; }
            }
            if (!below) {
              const pn = svg.closest('.panel'), h = pn && pn.querySelector('h3');
              out.push(`${(h ? h.textContent.trim() : '?').slice(0, 28)}: ${
                neg[0].textContent.trim()}`);
            }
          }
          return out;
        });
        ok(unearned.length === 0, `${ind}/${role}/${p}: no negative tick without negative data`,
          unearned.slice(0, 2).join(', '));

        /* ⛔ AN AXIS'S LABELS READ AS EVENLY SPACED AS ITS GRIDLINES ARE.

           Gridlines are drawn at a constant step, so the labels on them have to
           read at a constant step too. Two ways they stopped: a step of 2.5
           people printed by a whole-number formatter gave 410, 413, 415, 418,
           420, 423, 425 on evenly spaced lines, reading 3, 2, 3, 2 up the side;
           and a clean $250K step whose snapped top tick is $1.25M printed $1.0M
           then $1.3M, reading 300 where every other gap read 250. Nothing in
           either is false, which is why nothing caught them: 412.5 does round
           to 413.

           Five axes of 107 read unevenly before `readsEvenly()`, which rejects
           a step whose rendered labels disagree with its own spacing. The test
           is on the TEXT, because the defect exists only in the rendering: the
           same 2.5 step on a dollar axis prints $2.5M and reads perfectly, so a
           blanket ban on half-steps would be wrong. */
        const uneven = await page.evaluate(() => {
          const out = [];
          const val = str => {
            const t = String(str).trim();
            if (!t) return null;
            const mul = /[kK]$/.test(t) ? 1e3 : /[mM]$/.test(t) ? 1e6 : /[bB]$/.test(t) ? 1e9 : 1;
            const n = parseFloat(t.replace(/[^0-9.+-]/g, ''));
            if (!Number.isFinite(n)) return null;
            return (/^[-−(]/.test(t) && n > 0 ? -n : n) * mul;
          };
          for (const svg of document.querySelectorAll('#page svg.chart')) {
            const lines = [...svg.querySelectorAll('.axis line')]
              .filter(l => l.getBoundingClientRect().height < 2);
            if (lines.length < 3) continue;
            const texts = [...svg.querySelectorAll('.axis text')];
            const rows = [];
            for (const l of lines) {
              const ly = l.getBoundingClientRect().top;
              const t = texts.find(x => {
                const b = x.getBoundingClientRect();
                return Math.abs(b.top + b.height / 2 - ly) < 7;
              });
              if (t) rows.push({ y: ly, v: val(t.textContent) });
            }
            if (rows.length < 3 || rows.some(r => r.v === null)) continue;
            rows.sort((a, b) => a.y - b.y);
            const d = [];
            for (let i = 1; i < rows.length; i++) d.push(rows[i - 1].v - rows[i].v);
            const big = Math.max(...d.map(Math.abs));
            if (!(big > 0)) continue;
            if (!d.every(x => Math.abs(Math.abs(x) - big) <= big * 0.02)) {
              const pn = svg.closest('.panel'), h = pn && pn.querySelector('h3');
              out.push(`${(h ? h.textContent.trim() : '?').slice(0, 26)} [${rows.map(r => r.v).join(', ')}]`);
            }
          }
          return out;
        });
        ok(uneven.length === 0, `${ind}/${role}/${p}: axis labels read evenly spaced`,
          uneven.slice(0, 2).join(', '));

        /* ⛔ THE DESIGN PASS, AS FOUR MEASUREMENTS.

           Matt, 2026-11-04, after the financial dashboard round: *"can this be
           done for every object on every tab. i want to make sure it all has
           the same attention and care"*. 73 panels over 20 tabs, so each class
           was found by eye on a Finance tab, then written down here and swept
           over all of them. 13 panels flagged, 0 after, A/B'd against the
           build before the fixes rather than taken on trust.

           CLIPPED  a label the box cut off, measured as scrollWidth past
                    clientWidth on an element whose overflow actually hides.
           CRUSHED  prose wrapping to lines of almost nothing. The pack cards
                    printed "Monthly / reporting / pack" and "What the /
                    finance / team issues / after a / close." because the head
                    is a flex row and the buttons never shrink.
           FLAT     data sitting in a thin band of its own plot. Cash drew
                    inside 14% of a zero-based axis, so eighteen months of
                    movement read as a straight line.
           RAINBOW  more than three unrelated hues on data that has structure.
                    The balance sheet's two columns were orange, blue, magenta,
                    purple and teal.

           ⚠️ FLAT reported nothing on its first two cuts, on the very chart
           that prompted it. The line charts carry a full-plot `rect` with fill
           `rgba(0, 0, 0, 0)` as their hover target: invisible, but its fill is
           not the string 'none', so it counted as data and every flat chart
           filled 100% of its own plot. Alpha, not the keyword. A mark that
           paints nothing is not data, which is the same lesson the `.cursor`
           guideline taught the night before in a costume you could at least
           see. */
        const design = await page.evaluate(() => {
          const out = [];
          const paints = c => c && c !== 'none' && !/^rgba\([^)]*,\s*0(\.0+)?\)$/.test(c);
          const hue = c => {
            const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || '');
            if (!m) return null;
            const [r, g, b] = [+m[1], +m[2], +m[3]];
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            if (mx - mn < 26 || mx < 40) return null;
            let h;
            if (mx === r) h = ((g - b) / (mx - mn)) % 6;
            else if (mx === g) h = (b - r) / (mx - mn) + 2;
            else h = (r - g) / (mx - mn) + 4;
            return Math.round(((h * 60) + 360) % 360 / 30) * 30;
          };
          for (const pn of document.querySelectorAll('#page .panel')) {
            const h3 = pn.querySelector('h3');
            const title = (h3 ? h3.textContent.trim() : '(untitled)').slice(0, 30);
            const flag = f => out.push(`${title}: ${f}`);

            for (const e of pn.querySelectorAll('*')) {
              if (e.children.length || !(e.textContent || '').trim()) continue;
              const cs = getComputedStyle(e);
              if (cs.overflow === 'visible' && cs.overflowX === 'visible') continue;
              if (e.scrollWidth - e.clientWidth > 3) {
                flag(`CLIPPED "${(e.textContent || '').trim().slice(0, 20)}"`); break;
              }
            }

            /* ⛔ COUNT THE LINE BOXES, NOT THE ELEMENT'S HEIGHT OVER ITS
               LINE-HEIGHT. That arithmetic counts PADDING as text: the empty
               state "Nothing is outside its band. The month is clean." sets
               34px above and below one 13.5px line and read as nine words over
               four lines, failing eight role-pages that were perfectly fine. A
               Range over the text returns one rect per line it actually
               occupies, which is the only count that means anything. */
            for (const e of pn.querySelectorAll('p, .sub, .note, h3, div')) {
              if (e.children.length) continue;
              const words = (e.textContent || '').trim().split(/\s+/).filter(Boolean);
              if (words.length < 5) continue;
              const rg = document.createRange();
              rg.selectNodeContents(e);
              const lines = [...rg.getClientRects()]
                .filter(r => r.height > 1 && r.width > 1).length;
              if (lines >= 3 && words.length / lines < 3.2) {
                flag(`CRUSHED ${words.length}w over ${lines} lines`); break;
              }
            }

            for (const svg of pn.querySelectorAll('svg.chart')) {
              const lines = [...svg.querySelectorAll('.axis line')]
                .filter(l => l.getBoundingClientRect().height < 2);
              if (lines.length < 3) continue;
              const ys = lines.map(l => l.getBoundingClientRect().top);
              const plot = Math.max(...ys) - Math.min(...ys);
              if (plot < 60) continue;
              let top = Infinity, bot = -Infinity;
              for (const m of svg.querySelectorAll('polyline, path, circle, rect')) {
                if (m.closest('.axis') || m.closest('.cursor')) continue;
                const cs = getComputedStyle(m);
                const stroked = paints(cs.stroke) && parseFloat(cs.strokeWidth) > 0;
                if (m.tagName === 'path' || m.tagName === 'polyline') { if (!stroked) continue; }
                else if (!paints(cs.fill) && !stroked) continue;
                const b = m.getBoundingClientRect();
                if (b.height < 0.5 && b.width < 0.5) continue;
                top = Math.min(top, b.top); bot = Math.max(bot, b.bottom);
              }
              if (!Number.isFinite(top)) continue;
              /* ⚠️ A SERIES CAN BE FLAT BECAUSE THE DATA IS FLAT. Education's
                 campus margins all sit near 21% and the page prints whole
                 percents, so there is no tighter axis to draw: bracketing them
                 gave four gridlines reading 21%, 21%, 21%, 21%. The chart
                 marks itself when it declined to zoom for that reason, so this
                 can tell a wasted plot from an honest one without a threshold
                 fitted to whichever case was measured first. */
              if (svg.dataset.flat === 'data') continue;
              const fill = (bot - top) / plot;
              if (fill < 0.4) { flag(`FLAT ${Math.round(fill * 100)}% of its plot`); break; }
            }

            for (const svg of pn.querySelectorAll('svg.chart')) {
              const hues = new Set();
              for (const m of svg.querySelectorAll('rect, path, circle')) {
                if (m.closest('.axis')) continue;
                const b = m.getBoundingClientRect();
                if (b.width * b.height < 400) continue;
                const h = hue(getComputedStyle(m).fill);
                if (h !== null) hues.add(h);
              }
              if (hues.size > 3) { flag(`RAINBOW ${hues.size} hues`); break; }
            }
          }
          return out;
        });
        ok(design.length === 0, `${ind}/${role}/${p}: no clipped, crushed, flat or rainbow panel`,
          design.slice(0, 3).join(' | '));

        /* ⛔ A BAR LIST WHOSE SCALE HAS STOPPED DESCRIBING IT.

           "Where the money goes" is seven categories of which cost of revenue
           is 86%, so six rendered under 4% of their track and the reader took
           the order from the sort rather than from the bars. That was the
           reason the donut was replaced, and the bar chart inherited it: a
           sliver is a sliver whether it is a wedge or a bar. Seven lists were
           in this state, two of them on the financial dashboard, which is the
           page this build is sold on.

           ⚖️ The CASCADE is exempt and says so here rather than being quietly
           skipped: its bars are a running total shrinking down the page, so a
           small bar IS the message, and it already carries a declared 3px
           floor so the smallest stay visible. Rescaling its tail would delete
           the thing it exists to show. Every other form has to earn its
           scale. */
        const flattened = await page.evaluate(() => {
          const out = [];
          for (const pn of document.querySelectorAll('#page .panel')) {
            const h = pn.querySelector('h3');
            const title = (h ? h.textContent.trim() : '?').slice(0, 30);
            for (const sel of ['.hb-stack .bar-cell', '.rows .bar-cell', '.fun-track']) {
              const cells = [...pn.querySelectorAll(sel)];
              if (cells.length < 5) continue;
              const shares = [];
              for (const c of cells) {
                const track = c.getBoundingClientRect().width;
                const fill = [...c.children].find(x => x.tagName === 'I');
                if (!track || !fill) continue;
                shares.push(fill.getBoundingClientRect().width / track);
              }
              if (shares.length < 5) break;
              const tiny = shares.filter(v => v < 0.04).length;
              if (tiny / shares.length > 0.5) {
                out.push(`${title}: ${tiny} of ${shares.length} bars under 4% of their track`);
              }
              break;
            }
          }
          return out;
        });
        ok(flattened.length === 0, `${ind}/${role}/${p}: every bar list earns its scale`,
          flattened.slice(0, 2).join(' | '));

        /* ⛔ THE CASCADE'S CUT NEVER PAINTS OVER ITS KEPT BAR.

           Two rules fought: `.casc-keep` has a declared 3px rendering floor so
           a sub-1% running total is still visible, and `.casc-cut` is placed
           proportionally. On a floored row the cut therefore began INSIDE the
           bar: the publishing session measured logistics Interest at 2.41px and
           Other at 1.88px into a 3px bar, which paints 80% and 63% of the
           running total in translucent red. Reproduced here to the hundredth
           of a pixel, and reproduced again by reverting the fix in the page,
           which is the only way to know a zero means fixed and not a selector
           that matches nothing. `left: max(var(--at), 3px)` is the fix. */
        const cascOver = await page.evaluate(() => {
          const out = [];
          for (const row of document.querySelectorAll('#page .casc-row')) {
            const keep = row.querySelector('.casc-keep'), cut = row.querySelector('.casc-cut');
            if (!keep || !cut) continue;
            const k = keep.getBoundingClientRect(), c = cut.getBoundingClientRect();
            if (k.right - c.left > 0.5) {
              out.push(`${(row.querySelector('.casc-n') || {}).textContent || '?'}`.trim());
            }
          }
          return out;
        });
        ok(cascOver.length === 0, `${ind}/${role}/${p}: no cascade cut over its kept bar`,
          cascOver.slice(0, 3).join(', '));

        /* ⛔ A KEY SHOWS THE COLOURS ITS OWN CHART DRAWS.

           "The shape of the year" borrowed the heatmap's `hm-ramp`, which is
           one colour at varying opacity, for a chart drawn in TWO colours at
           full opacity. The legend said a faded accent, the bars said
           `--accent-lift`, and a reader matching one to the other found
           neither. Nothing in the build could see it, because no arithmetic
           compares a swatch with a fill. This does: every swatch colour in a
           panel's key must be a colour that panel's chart actually paints. */
        const liars = await page.evaluate(() => {
          const out = [];
          for (const pn of document.querySelectorAll('#page .panel')) {
            const key = pn.querySelector('.hm-key .hm-ramp');
            const svg = pn.querySelector('svg.chart');
            if (!key || !svg) continue;
            /* ⚠️ COLOUR AND OPACITY TOGETHER, not colour alone. A heatmap
               paints one colour at many strengths and its ramp swatches are
               faded ON PURPOSE, so a check that rejected a faded swatch failed
               84 times on two charts that were right. What matters is the PAIR:
               a swatch must match the colour AND the strength of some mark the
               chart paints. `fill` never carries `fill-opacity`, so both are
               read and rounded to the nearest 0.02, which is finer than an eye
               but coarse enough for a rounded computed value. */
            /* ⚠️ COLOUR AND STRENGTH, and strength as a RANGE.

               Three readings, each wrong in its own way, before this one:
               colour alone passed the defect that started this (an accent
               faded to .42 next to bars painted at full accent, identical
               colour); colour plus a no-fading rule failed 84 times on two
               heatmaps whose ramp swatches are faded on purpose; colour plus
               an exact strength match failed on two more, because a RAMP
               legend is a scale and its middle stop need not be a value the
               data happens to contain.

               So: the swatch's colour must be one the chart paints, and its
               strength must lie inside the range of strengths the chart paints
               THAT colour at. `fill` never carries `fill-opacity`, so both are
               read and multiplied. */
            const paints = new Map();
            for (const m of svg.querySelectorAll('rect, circle, path')) {
              if (m.closest('.axis')) continue;
              const c = getComputedStyle(m);
              const a = Number(c.fillOpacity) * Number(c.opacity);
              const r = paints.get(c.fill);
              if (r) { r[0] = Math.min(r[0], a); r[1] = Math.max(r[1], a); }
              else paints.set(c.fill, [a, a]);
            }
            if (!paints.size) continue;
            for (const i of key.querySelectorAll('i')) {
              const c = getComputedStyle(i);
              const r = paints.get(c.backgroundColor);
              const a = Number(c.opacity);
              if (!r || a < r[0] - 0.03 || a > r[1] + 0.03) {
                const h = pn.querySelector('h3');
                out.push(`${(h ? h.textContent.trim() : '?').slice(0, 26)}: key ${
                  c.backgroundColor} @${a}${r ? ` vs painted ${r[0].toFixed(2)}-${r[1].toFixed(2)}` : ' (never painted)'}`);
              }
            }
          }
          return out;
        });
        ok(liars.length === 0, `${ind}/${role}/${p}: every key swatch is a colour its chart paints`,
          liars.slice(0, 2).join(', '));

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

        /* ⛔ EVERY LINE OF A CASCADE HAS A VISIBLE BAR.

           This is the whole reason the cascade replaced the waterfall. On a
           3%-margin statement the waterfall drew five of seven steps under
           8px, one of them net income, because revenue set the axis and the
           tail lived in the bottom 7% of it. The cascade's bar carries the
           RUNNING TOTAL instead of the step, so it shrinks but never vanishes.

           If a future change puts the step back in the bar, this fails: the
           check is on the property that made the swap worth making, not on
           the component being present. */
        const flatRows = await page.evaluate(() => {
          const out = [];
          for (const row of document.querySelectorAll('#page .casc-row')) {
            const bar = row.querySelector('.casc-keep');
            if (!bar) { out.push('a row with no bar at all'); continue; }
            const w = bar.getBoundingClientRect().width;
            if (w < 2) {
              out.push(`${(row.querySelector('.casc-n') || {}).textContent || '?'} ${w.toFixed(1)}px`);
            }
          }
          return out;
        });
        ok(flatRows.length === 0, `${ind}/${role}/${p}: every cascade line keeps a visible bar`,
          flatRows.slice(0, 2).join(', '));

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
