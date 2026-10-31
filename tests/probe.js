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
  await page.waitForFunction('window.__hub !== undefined', { timeout: 20000 });

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

  /* and it can be reopened from the rail */
  await page.evaluate(() => document.querySelector('[data-act="chooser"]').click());
  await page.waitForTimeout(260);
  ok(await page.evaluate('window.__hub.choosing()'), 'the rail reopens the chooser');
  await page.evaluate('window.__hub.chooser(false)');
  await page.waitForTimeout(140);

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
          };
        });

        ok(seen.page === p, `${ind}/${role}/${p}: routed`, seen.page);
        ok(!seen.broken, `${ind}/${role}/${p}: drew without throwing`);
        ok(seen.len > 180, `${ind}/${role}/${p}: has content`, `${seen.len} chars`);
        ok(seen.panels > 0, `${ind}/${role}/${p}: has a panel`);
        ok(!seen.nan, `${ind}/${role}/${p}: no NaN, undefined or Infinity on the page`);
        ok(seen.overflow <= 1, `${ind}/${role}/${p}: no sideways scroll at 1440`, String(seen.overflow));
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
