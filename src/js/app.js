/* The shell: load the configuration, mount the rail, the tab column and the
   top bar, then route to a page.

   Two measured rules are built in. The pickers are listboxes drawn in the page,
   never a native select, because a native popup is painted outside the document
   and a screenshot cannot capture it. And a basis button that would not change
   a single figure on the page is shown disabled with its reason, rather than
   offered and then doing nothing. */

import { Settings, paletteFrom } from './settings.js';
import { Q, loadData } from './query.js';
import * as F from './fmt.js';
import * as C from './chart.js';
import * as U from './ui.js';
import { esc, icon, brandMark } from './icons.js';
import { financePages } from './pages/finance.js';
import { opsPages } from './pages/ops.js';
import { miscPages } from './pages/misc.js';
import { settings as settingsPage, connectSheet, FONT_PAIRS } from './cms.js';
import * as Chooser from './chooser.js';
import * as Present from './present.js';
import * as World from './world.js';

const BASIS = [
  { id: 'month', name: 'Month' }, { id: 'ytd', name: 'YTD' },
  { id: 'ttm', name: 'TTM' }, { id: 'fy', name: 'FY' },
];

const PAGES = { ...financePages, ...opsPages, ...miscPages, settings: settingsPage };

const app = {
  cfg: null, s: null, q: null, data: {},
  page: 'home', arg: null, subtab: 'brand', menu: null, sheet: null,
};

/* --------------------------------------------------------------- bootstrap */

async function boot() {
  const base = document.body.dataset.base || '';
  const [product, brands, industries, connectors, roles] = await Promise.all(
    ['product', 'brands', 'industries', 'connectors', 'roles']
      .map(n => fetch(`${base}config/${n}.json`, { cache: 'no-cache' }).then(r => {
        if (!r.ok) throw new Error(`config/${n}.json: ${r.status}`);
        return r.json();
      })));

  app.cfg = { product, brands, industries, connectors, roles };
  /* read before Settings.load() consumes it: a returning viewer keeps their
     demo, a first-time one is shown the front door */
  let firstVisit = true;
  try { firstVisit = !localStorage.getItem('hub.settings.v2'); } catch (err) { /* blocked store */ }
  await Chooser.loadCards(base);
  app.s = new Settings(app.cfg).load();
  app.s.apply();
  await useIndustry(app.s.data.industry, true);

  World.start();
  window.addEventListener('hashchange', () => { readHash(); render(); });
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.person) {
      ev.preventDefault(); addPerson(ev.target.dataset.person); return;
    }
    if (ev.target.matches('input, textarea, select')) return;
    if (Present.key(ev)) { ev.preventDefault(); return; }
    if (ev.key === 'Escape') { closeMenu(); closeSheet(); }
  });

  readHash();
  render();
  window.__hub = api();
  if (firstVisit || location.hash === '#/choose') openChooser(firstVisit);
}

async function useIndustry(id, first = false) {
  if (!app.data[id]) app.data[id] = await loadData(id, document.body.dataset.base || '');
  const ind = app.cfg.industries.industries.find(i => i.id === id);
  app.q = new Q(app.data[id], ind);
  const d = app.s.data;
  const months = app.q.months;
  if (!d.month || !months.includes(d.month)) d.month = months[months.length - 1];
  app.q.setView({ role: app.s.role, entity: d.entity, basis: d.basis, month: d.month });
  F.setMoneyLevel(app.s.role.money);
  if (!first) app.s.save();
}

function readHash() {
  const h = location.hash.replace(/^#\/?/, '');
  if (!h) return;
  const [page, arg] = h.split('/');
  if (PAGES[page]) { app.page = page; app.arg = arg ? decodeURIComponent(arg) : null; }
}

function startPresenting() {
  closeMenu();
  closeSheet();
  const ok = Present.enter({ s: app.s, pageId: () => app.page });
  if (!ok) {
    /* a page with nothing to present says so rather than blanking */
    const host = document.getElementById('page');
    host.insertAdjacentHTML('afterbegin',
      `<div id="demo-note">${icon('flag', 15)}<span>There is nothing on this page to present.</span>
       <button data-act="hide-note">\u00d7</button></div>`);
  }
}

function openChooser(firstTime = false) {
  Chooser.show(app.cfg, async id => {
    if (id !== app.s.data.industry) {
      app.s.useIndustry(id);
      await useIndustry(id);
      go('home');
    } else {
      /* Picking the demo that is already loaded still has to be remembered.
         Construction is the default, so a first-time viewer who picks the
         first card used to leave no record of having chosen at all, and every
         reload put the front door back over whatever page they were on
         (measured on the live site 2026-10-31). Choosing is the event worth
         saving, not changing. */
      app.s.save();
    }
    render();
  }, firstTime ? null : app.s.data.industry);
}

function go(page, arg = null) {
  app.page = page; app.arg = arg;
  const hash = `#/${page}${arg ? '/' + encodeURIComponent(arg) : ''}`;
  if (location.hash !== hash) location.hash = hash; else render();
}

/* ------------------------------------------------------------------ render */

function render() {
  const s = app.s, q = app.q;
  F.setMoneyLevel(s.role.money);
  q.setView({ role: s.role, entity: s.data.entity, basis: s.data.basis, month: s.data.month });

  const pages = s.pages();
  if (!pages.find(p => p.id === app.page) && app.page !== 'ops-detail') {
    app.page = pages[0] ? pages[0].id : 'home';
  }

  document.getElementById('rail').innerHTML = rail(pages);
  document.getElementById('tabs').innerHTML = tabs(pages);
  document.getElementById('bar').innerHTML = bar();

  const ctx = { q, s, cfg: app.cfg, arg: app.arg, subtab: app.subtab, go, strip: stripIds() };
  const host = document.getElementById('page');
  let html = '';
  try {
    html = (PAGES[app.page] || PAGES.home)(ctx);
  } catch (err) {
    html = `<section class="panel"><div class="empty">
      <b>That page could not be drawn.</b><br>${esc(err.message)}</div></section>`;
    console.error(err);
  }
  host.innerHTML = (s.data.showDemoNote ? demoNote() : '') + html;
  C.wire(host);
  U.wireStrip(host, (slot, id) => { placeKpi(slot, id); render(); });
  World.arm(host);
  if (Present.isOn()) Present.collect();
  host.scrollIntoView({ block: 'start' });
  window.scrollTo({ top: 0 });
}

function demoNote() {
  return `<div id="demo-note">${icon('flag', 15)}
    <span>${esc(app.q.data.meta.notice)}</span>
    <button data-act="hide-note" aria-label="Hide">×</button></div>`;
}

function rail(pages) {
  const s = app.s;
  const mods = s.modulesWithPages();
  const open = (PAGES[app.page] && app.cfg.product.pages[app.page])
    ? app.cfg.product.pages[app.page].module : 'start';
  return `<div class="rail-head">
      <span class="rail-mark">${s.data.brand.logo
      ? `<img src="${esc(s.data.brand.logo)}" alt="">` : brandMark(s.data.brand, 34)}</span>
      <div><div class="rail-name">${esc(s.data.company)}</div>
        <div class="rail-sub">${esc(s.data.productName)}</div></div>
    </div>
    <div class="rail-places">
      ${mods.map(m => `<button class="place" data-act="go" data-arg="${esc(m.pages[0].id)}"
        aria-current="${m.id === open}">
        <span class="place-ico">${icon(m.pages[0].icon || 'grid', 18)}</span>
        <span>${esc(m.name)}</span>
        ${m.pages.length > 1 ? `<span class="place-count">${m.pages.length}</span>` : ''}
      </button>`).join('')}
    </div>
    <div class="rail-foot">
      <b>${esc(s.role.name)}</b><br>
      ${esc(scopeWord(s))} · ${esc(moneyWord(s))}
    </div>`;
}

function scopeWord(s) {
  return { all: 'every company', company: 'one company', units: 'assigned units only', own: 'own work only' }[s.role.scope];
}

function moneyWord(s) {
  return { full: 'all figures', operating: 'operating figures', unit: 'unit figures', none: 'no currency' }[s.role.money];
}

function tabs(pages) {
  const open = app.cfg.product.pages[app.page]
    ? app.cfg.product.pages[app.page].module
    : (app.page === 'ops-detail' ? 'ops' : 'start');
  const mine = pages.filter(p => p.module === open);
  const mod = app.cfg.product.modules[open];
  if (!mine.length) return '';
  return `<div class="tabs-title">${esc(mod ? mod.name : '')}</div>` +
    mine.map(p => `<button class="tab" data-act="go" data-arg="${esc(p.id)}"
      aria-current="${p.id === app.page}">${esc(p.name)}</button>`).join('') +
    (open === 'settings' ? '' : `<hr class="r">
      <div class="tabs-title">Period</div>
      <button class="tab opens" data-act="menu" data-arg="month" aria-haspopup="listbox"
        aria-current="false"><span>${esc(F.monthName(app.s.data.month, true))}</span>
        ${icon('caret', 13)}</button>`);
}

function bar() {
  const s = app.s, q = app.q;
  const ents = [{ id: '*', name: allLabel(q) }, ...q.entities];
  const ent = ents.find(e => e.id === (s.data.entity || '*')) || ents[0];
  const moves = q.basisMoves(app.page);

  return `<button class="btn ghost sm menu-toggle" data-act="rail-toggle">${icon('menu', 18)}</button>
    <button class="pill" data-act="menu" data-arg="entity" aria-expanded="${app.menu === 'entity'}">
      <span class="pill-mark">${brandMark(s.data.brand, 18)}</span>
      <span class="pill-label">Company</span><b>${esc(short(ent.name))}</b>${caret()}
    </button>
    <button class="pill" data-act="menu" data-arg="month" aria-expanded="${app.menu === 'month'}">
      <span class="pill-label">As of</span><b>${esc(F.monthName(s.data.month, true))}</b>
      ${s.data.month > q.closed ? `<span class="tag warn" style="padding:1px 7px">tentative</span>` : ''}
      ${caret()}
    </button>
    <div class="basis" role="group" aria-label="Basis">
      ${BASIS.map(b => {
    const dead = !moves && b.id !== 'month';
    return `<button data-act="basis" data-arg="${b.id}" aria-pressed="${s.data.basis === b.id}"
          ${dead ? 'disabled title="This page reads a position as of its month, so a window would not change a figure on it"' : ''}
        >${b.name}</button>`;
  }).join('')}
    </div>
    <span class="bar-gap"></span>
    <button class="pill" data-act="menu" data-arg="role" aria-expanded="${app.menu === 'role'}">
      <span class="pill-label">Viewing as</span><b>${esc(s.role.name)}</b>${caret()}
    </button>
    <span class="bar-tools">
      <button class="btn ghost sm" data-act="theme-toggle" title="Light or dark">
        ${icon(s.data.theme === 'dark' ? 'sun' : 'moon', 17)}</button>
      <button class="btn ghost sm" data-act="present" title="Present this page, one panel at a time">
        ${icon('grid', 17)}</button>
      <button class="btn ghost sm" data-act="print" title="Print this page">${icon('print', 17)}</button>
      <button class="btn ghost sm" data-act="go" data-arg="settings" title="Settings">${icon('gear', 17)}</button>
    </span>`;
}

/* One company is not "all 1 companies". */
function allLabel(q) {
  const n = q.entities.length;
  return n === 1 ? 'The whole company' : `All ${n} companies`;
}

function short(name) {
  return name.length > 26 ? name.slice(0, 24) + '…' : name;
}

function caret() {
  return `<svg class="caret" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6">
    <path d="M2 4l3 3 3-3"/></svg>`;
}

/* ------------------------------------------------------------------ menus */

function openMenu(kind, anchor) {
  closeMenu();
  app.menu = kind;
  const el = document.createElement('div');
  el.className = 'menu';
  el.id = 'menu';
  el.innerHTML = menuBody(kind);
  document.body.appendChild(el);
  const box = anchor.getBoundingClientRect();
  el.style.top = `${Math.min(box.bottom + 6, window.innerHeight - el.offsetHeight - 10)}px`;
  el.style.left = `${Math.min(box.left, window.innerWidth - el.offsetWidth - 10)}px`;
  const first = el.querySelector('.menu-item');
  if (first) first.focus();
  document.getElementById('bar').innerHTML = bar();
}

/* The five ids the strip carries. A client's choice wins, the industry's own
   list is the default, and an id the current industry cannot resolve is
   dropped rather than rendered as a dash: switching industries leaves stale
   ids behind, and a strip of dashes reads as a broken build. */
/* Put a metric in a slot. ⛔ If it already sits in another slot the two SWAP
   rather than the metric appearing twice: a strip showing the same figure in
   two places is a worse strip than the one the client started with, and
   nothing about "pick what goes here" implies "and lose what you had". Both
   routes into this choice, the strip's own picker and the settings console,
   go through here so they cannot behave differently. */
function placeKpi(slot, id) {
  const next = stripIds();
  const already = next.indexOf(id);
  if (already > -1 && already !== slot) next[already] = next[slot];
  next[slot] = id;
  app.s.data.kpiStrip = next;
  app.s.save();
}

/* Put a person at a level. Shared by the Add button and the Enter key, so the
   two cannot behave differently. */
function addPerson(roleId) {
  const box = document.querySelector(`[data-person="${roleId}"]`);
  const who = (box?.value || '').trim();
  if (!who) { box?.focus(); return; }
  const r = app.s.data.roles.find(x => x.id === roleId);
  if (!r) return;
  r.people = [...(r.people || []), who];
  app.s.save(); render();
}

function stripIds() {
  const q = app.q, ok = new Set(q.kpiIds());
  const want = (app.s.data.kpiStrip || []).filter(id => ok.has(id));
  const fill = (app.q.ind.kpis || []).filter(id => ok.has(id) && !want.includes(id));
  return [...want, ...fill].slice(0, 5);
}

function menuBody(kind) {
  const s = app.s, q = app.q;
  if (kind && kind.startsWith('kpi:')) {
    /* Which figure sits in this slot. A client swaps any of the five for any
       metric their industry resolves, and the choice exports with the rest of
       the configuration, so the next deployment opens on their figures and not
       on ours. */
    const slot = Number(kind.slice(4));
    const chosen = stripIds();
    return `<div class="menu-head">Show in this slot</div>` + q.kpiIds().map(id => {
      const k = q.kpi(id);
      const elsewhere = chosen.indexOf(id);
      return `<button class="menu-item" data-act="pick-kpi" data-arg="${slot}:${esc(id)}"
        aria-selected="${chosen[slot] === id}">
        <span>${esc(k.label)}<small>${esc(U.display(k))}${
        elsewhere > -1 && elsewhere !== slot ? ` · swaps with slot ${elsewhere + 1}` : ''}</small></span>
      </button>`;
    }).join('');
  }
  if (kind === 'entity') {
    const rows = [{ id: '*', name: allLabel(q), kind: 'Consolidated' }, ...q.entities];
    const allowed = s.role.scope === 'all';
    return `<div class="menu-head">Company</div>` + rows.map(e => {
      const dead = !allowed && e.id === '*';
      return `<button class="menu-item" data-act="pick-entity" data-arg="${esc(e.id)}"
        aria-selected="${(s.data.entity || '*') === e.id}" ${dead ? 'disabled' : ''}>
        <span class="pill-mark">${brandMark(s.data.brand, 18)}</span>
        <span>${esc(e.name)}<small>${esc(dead ? 'Not at this view level' : (e.kind || ''))}</small></span>
      </button>`;
    }).join('');
  }
  if (kind === 'month') {
    return `<div class="menu-head">As of</div>` + q.months.slice().reverse().map(m =>
      `<button class="menu-item" data-act="pick-month" data-arg="${m}"
        aria-selected="${s.data.month === m}">
        <span>${esc(F.monthName(m, true))}
        <small>${m > q.closed ? 'tentative, not yet signed off' : 'signed off'}</small></span>
      </button>`).join('');
  }
  if (kind === 'role') {
    return `<div class="menu-head">View level</div>` + s.data.roles.map(r =>
      `<button class="menu-item" data-act="pick-role" data-arg="${esc(r.id)}"
        aria-selected="${s.data.role === r.id}">
        <span>${esc(r.name)}<small>${esc((r.titles || []).slice(0, 3).join(', '))}</small></span>
      </button>`).join('') +
      `<div class="menu-sep"></div>
       <button class="menu-item" data-act="go" data-arg="settings"><span>Edit the levels…</span></button>`;
  }
  return '';
}

function closeMenu() {
  const el = document.getElementById('menu');
  if (el) el.remove();
  app.menu = null;
}

function openSheet(html) {
  let wrap = document.getElementById('sheet-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'sheet-wrap';
    document.body.appendChild(wrap);
  }
  wrap.hidden = false;
  wrap.innerHTML = html;
}

function closeSheet() {
  const wrap = document.getElementById('sheet-wrap');
  if (wrap) { wrap.hidden = true; wrap.innerHTML = ''; }
}

/* ----------------------------------------------------------------- events */

async function onClick(ev) {
  const row = ev.target.closest('[data-click]');
  const el = ev.target.closest('[data-act]');

  if (!el && !row) {
    if (app.menu && !ev.target.closest('#menu')) closeMenu();
    if (ev.target.id === 'sheet-wrap') closeSheet();
    return;
  }

  if (row && !el) {
    const [kind, arg] = row.dataset.click.split(':');
    if (kind === 'unit') go('ops-detail', arg);
    return;
  }

  const act = el.dataset.act, arg = el.dataset.arg;
  switch (act) {
    case 'go': closeMenu(); closeSheet(); go(arg); break;
    case 'chooser': closeMenu(); closeSheet(); openChooser(); break;
    case 'menu': openMenu(arg, el); break;
    case 'rail-toggle': document.getElementById('rail').classList.toggle('open'); break;
    case 'pick-entity': app.s.data.entity = arg; app.s.save(); closeMenu(); render(); break;
    case 'pick-month': app.s.data.month = arg; app.s.save(); closeMenu(); render(); break;
    case 'pick-role': app.s.data.role = arg; app.s.save(); closeMenu(); render(); break;
    case 'pick-kpi': {
      const [slot, id] = arg.split(':');
      placeKpi(Number(slot), id);
      closeMenu(); render(); break;
    }
    case 'try-role': app.s.data.role = arg; app.s.save(); go('fin-dash'); break;
    case 'basis': app.s.data.basis = arg; app.s.save(); render(); break;
    case 'theme': app.s.data.theme = arg; app.s.save().apply(); render(); break;
    case 'theme-toggle':
      app.s.data.theme = app.s.data.theme === 'dark' ? 'light' : 'dark';
      app.s.save().apply(); render(); break;
    case 'print': window.print(); break;
    case 'present': startPresenting(); break;
    case 'present-next': Present.next(); break;
    case 'present-prev': Present.prev(); break;
    case 'present-exit': Present.exit(); break;
    case 'level-add': {
      /* A new level starts between the two least senior, because a level
         someone adds is nearly always a narrower one, and it must not land
         above the owner by accident. */
      const rs = app.s.data.roles.slice().sort((a, b) => b.rank - a.rank);
      const low = rs[rs.length - 1], above = rs[rs.length - 2] || low;
      app.s.data.roles.push({
        id: `level-${Date.now().toString(36)}`,
        name: 'New level', titles: [],
        rank: Math.max(1, Math.round((low.rank + above.rank) / 2)),
        scope: low.scope, money: low.money, people: [],
      });
      app.s.save(); render(); break;
    }
    case 'level-del': {
      app.s.data.roles = app.s.data.roles.filter(r => r.id !== arg);
      if (app.s.data.role === arg) app.s.data.role = app.s.data.roles[0].id;
      app.s.save(); render(); break;
    }
    case 'level-up':
    case 'level-down': {
      /* Seniority is the ORDER, so moving a level swaps its rank with its
         neighbour's. The number exists for the engine and is never shown. */
      const rs = app.s.data.roles.slice().sort((a, b) => b.rank - a.rank);
      const at = rs.findIndex(r => r.id === arg);
      const to = at + (act === 'level-up' ? -1 : 1);
      if (at < 0 || to < 0 || to >= rs.length) break;
      const a = rs[at], b = rs[to];
      const keep = a.rank; a.rank = b.rank; b.rank = keep;
      app.s.save(); render(); break;
    }
    case 'person-add': addPerson(arg); break;
    case 'person-del': {
      const [rid, idx] = arg.split(':');
      const r = app.s.data.roles.find(x => x.id === rid);
      if (r && r.people) { r.people.splice(Number(idx), 1); app.s.save(); render(); }
      break;
    }
    case 'print-pack': printPack(arg); break;
    case 'hide-note': app.s.data.showDemoNote = false; app.s.save(); render(); break;
    case 'industry':
      app.s.useIndustry(arg);
      await useIndustry(arg);
      go('fin-dash'); render(); break;
    case 'settab': app.subtab = arg; render(); break;
    case 'connect': {
      const c = app.s.connector(arg);
      if (c) openSheet(connectSheet(c, app.s));
      break;
    }
    case 'connect-go': app.s.setConnector(arg, true); closeSheet(); render(); break;
    case 'disconnect': app.s.setConnector(arg, false); render(); break;
    case 'sheet-close': closeSheet(); break;
    case 'module':
      app.s.data.modules[arg] = !app.s.data.modules[arg];
      app.s.save(); render(); break;
    case 'derive': {
      const hex = document.querySelector('[data-bind="accent-hex"]').value;
      app.s.data.brand.palette = paletteFrom(hex);
      app.s.save().apply(); render(); break;
    }
    case 'usebrand': {
      const b = app.cfg.brands.brands[arg];
      if (b) {
        app.s.data.brand = {
          ...app.s.data.brand, name: b.name, mono: b.mono, shape: b.shape,
          palette: { ...b.palette }, type: { ...b.type },
        };
        app.s.data.brandKey = arg;
        app.s.save().apply(); render();
      }
      break;
    }
    case 'logo-clear': app.s.data.brand.logo = null; app.s.save(); render(); break;
    case 'reset-settings':
      app.s.reset(app.s.data.industry);
      await useIndustry(app.s.data.industry);
      render(); break;
    case 'export-config':
      download(`${F.slug(app.s.data.company)}-hub-config.json`, app.s.exportJSON(), 'application/json');
      break;
    case 'import-config': {
      const box = document.getElementById('import-json');
      try {
        app.s.importJSON(box.value);
        await useIndustry(app.s.data.industry);
        render();
      } catch (err) {
        box.value = `Could not read that: ${err.message}\n\n` + box.value;
      }
      break;
    }
    case 'export-units': exportUnits(); break;
    case 'export-quarters': exportQuarters(); break;
    case 'export-pack': exportPack(arg); break;
    case 'sign': {
      const name = (app.q.entities.find(e => e.id === arg) || {}).name || arg;
      openSheet(`<div class="sheet">
        <div class="sheet-head"><div style="flex:1"><h3 style="font-size:17px">Sign off ${esc(name)}</h3>
          <div class="muted small">${esc(F.monthName(app.s.data.month, true))}</div></div></div>
        <div class="sheet-body">
          <p style="margin-top:0">In a live deployment this records your name, your role and the
          time against this company and this month, and the month stops being tentative for
          everyone the moment it is in.</p>
          <p class="muted small">A signature is not a filter: a reopening in the ledger voids it,
          and the page says so rather than carrying on as though the month were closed.</p>
        </div>
        <div class="sheet-foot"><button class="btn ghost" data-act="sheet-close">Close</button>
        ${U.btn('Understood', { act: 'sheet-close', kind: 'primary' })}</div></div>`);
      break;
    }
    default: break;
  }
}

function onChange(ev) {
  const el = ev.target;
  if (el.id === 'logo-file' && el.files && el.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      app.s.data.brand.logo = reader.result;
      app.s.save(); render();
    };
    reader.readAsDataURL(el.files[0]);
    return;
  }
  const bind = el.dataset.bind;
  if (!bind) return;
  if (bind === 'fontpair') {
    const f = FONT_PAIRS[Number(el.value)];
    if (f) {
      app.s.data.brand.type = { display: f.display, body: f.body, google: f.google };
      app.s.save().apply(); render();
    }
    return;
  }
  if (bind.startsWith('kpi.')) {
    /* A slot in the Start here strip, set from the settings console. The same
       store the strip's own picker writes, so the two cannot disagree. */
    placeKpi(Number(bind.split('.')[1]), el.value);
    render();
    return;
  }
  if (bind.startsWith('role.')) {
    const [, id, field] = bind.split('.');
    const role = app.s.roleById(id);
    if (role) {
      role[field] = field === 'rank' ? Number(el.value) : el.value;
      app.s.save(); render();
    }
    return;
  }
  if (bind.startsWith('pal.')) {
    app.s.data.brand.palette[bind.slice(4)] = el.value;
    app.s.save().apply();
    return;
  }
  if (bind === 'company') { app.s.data.company = el.value; app.s.save().apply(); return; }
  if (bind === 'brand.mono') { app.s.data.brand.mono = el.value.toUpperCase(); app.s.save(); render(); return; }
}

function onInput(ev) {
  const bind = ev.target.dataset.bind;
  if (!bind) return;
  if (bind === 'accent-pick' || bind === 'accent-hex') {
    const hex = ev.target.value;
    if (!/^#?[0-9a-f]{6}$/i.test(hex)) return;
    const h = hex.startsWith('#') ? hex : '#' + hex;
    app.s.data.brand.palette.accent = h;
    app.s.save().apply();
    const other = document.querySelector(`[data-bind="${bind === 'accent-pick' ? 'accent-hex' : 'accent-pick'}"]`);
    if (other) other.value = h;
    return;
  }
  if (bind.startsWith('pal.')) {
    app.s.data.brand.palette[bind.slice(4)] = ev.target.value;
    app.s.save().apply();
  }
}

/* ---------------------------------------------------------------- exports */

function download(name, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csv(rows) {
  return rows.map(r => r.map(c => {
    const v = c === null || c === undefined ? '' : String(c);
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(',')).join('\n');
}

function exportUnits() {
  const q = app.q, ind = app.s.industry;
  const keys = ind.measures.map(m => m.id);
  const head = [ind.unit.key, 'Name', 'Status', 'Owner', 'Company', ...ind.measures.map(m => m.name)];
  const rows = q.unitRows().map(r => [r.id, r.name, r.status, r.owner, r.entity,
    ...keys.map(k => r.f[k] ?? '')]);
  download(`${F.slug(app.s.data.company)}-${ind.unit.many}-${app.s.data.month}.csv`,
    csv([head, ...rows]), 'text/csv');
}

function exportQuarters() {
  const q = app.q;
  const months = q.months;
  const rows = [['Quarter', 'Revenue', 'Gross profit', 'Gross margin %', 'EBITDA', 'Net income']];
  for (let i = months.length - 1; i >= 2 && rows.length <= 8; i -= 3) {
    const win = months.slice(i - 2, i + 1);
    const rev = q.sum('rev', win), gp = q.sum('gp', win);
    rows.splice(1, 0, [`Q${Math.ceil(Number(win[2].slice(5)) / 3)} ${win[2].slice(0, 4)}`,
      rev, gp, rev ? (gp / rev * 100).toFixed(2) : '', q.sum('ebitda', win), q.sum('ni', win)]);
  }
  download(`${F.slug(app.s.data.company)}-quarters.csv`, csv(rows), 'text/csv');
}

/* ⛔ Matt, 2026-11-02: *"your statement and packs section is printing csv's
   instead of PDF's"*. It was, and the page called them packs, which is a thing
   you hand to a bank. A static page cannot write a real PDF without pulling in
   a library, but it can PRINT one, which is how Core BI does it: a paper
   layout the browser renders and the reader saves as PDF.

   So the pack now has two honest doors. "Print or save as PDF" builds the
   paper layout and prints it. "Figures as CSV" is named for what it is, for
   the reader who wants the numbers in a spreadsheet rather than a document. */
function printPack(id) {
  const q = app.q, s = app.s, cfg = app.cfg;
  const w = q.window();
  const rev = q.sum('rev', w) || 1;
  const titles = {
    monthly: 'Monthly reporting pack', owner: 'Owner report',
    lender: 'Lender package', board: 'Board summary',
  };
  const money = v => F.money(v);
  const plRows = cfg.product.statement.pl.map(l => {
    const v = q.sum(l.id, w);
    return `<tr><td>${esc(l.name)}</td><td class="n">${money(v)}</td>
      <td class="n">${(v / rev * 100).toFixed(1)}%</td></tr>`;
  }).join('');
  const bsRows = cfg.product.statement.bs.map(l =>
    `<tr><td>${esc(l.name)}</td><td class="n">${money(q.bal(l.id))}</td></tr>`).join('');

  const sheet = document.createElement('div');
  sheet.id = 'pack-print';
  sheet.innerHTML = `
    <header>
      <div>
        <h1>${esc(titles[id] || 'Pack')}</h1>
        <p>${esc(s.data.company)} &middot; ${esc(F.monthName(q.view.month, true))}
          &middot; ${esc(s.data.basis.toUpperCase())}</p>
      </div>
      <span class="pp-mark">${esc(s.data.brand.mono || '')}</span>
    </header>
    <p class="pp-note">Signed off through ${esc(F.monthName(q.closed, true))}.
      ${q.view.month > q.closed
      ? 'This pack includes a month that is not yet signed off, and says so on every figure.'
      : 'Every figure in this pack comes from signed-off months.'}</p>
    <h2>Profit &amp; loss</h2>
    <table><thead><tr><th>Line</th><th class="n">Amount</th><th class="n">Of revenue</th></tr></thead>
      <tbody>${plRows}</tbody></table>
    <h2>Balance sheet <small>as of ${esc(F.monthName(q.view.month, true))}</small></h2>
    <table><thead><tr><th>Line</th><th class="n">Amount</th></tr></thead>
      <tbody>${bsRows}</tbody></table>
    <footer>Generated from the same facts the pages read, so a pack and a page cannot disagree.</footer>`;
  document.body.appendChild(sheet);
  document.body.classList.add('printing-pack');
  const done = () => {
    document.body.classList.remove('printing-pack');
    sheet.remove();
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
  /* a browser that never fires afterprint must not leave the sheet behind */
  setTimeout(() => { if (sheet.isConnected) done(); }, 60000);
}

function exportPack(id) {
  const q = app.q, s = app.s, cfg = app.cfg;
  const w = q.window();
  const lines = cfg.product.statement.pl;
  const rows = [[`${s.data.company} — ${id} pack`],
    [`Basis`, s.data.basis.toUpperCase(), `${w[0]} to ${w[w.length - 1]}`],
    [`Signed off through`, q.closed], [],
    ['Profit & loss', 'Amount', 'Of revenue']];
  const rev = q.sum('rev', w) || 1;
  for (const l of lines) rows.push([l.name, q.sum(l.id, w), (q.sum(l.id, w) / rev * 100).toFixed(2)]);
  rows.push([], ['Balance sheet', `As of ${s.data.month}`]);
  for (const l of cfg.product.statement.bs) rows.push([l.name, q.bal(l.id)]);
  download(`${F.slug(s.data.company)}-${id}-pack-${s.data.month}.csv`, csv(rows), 'text/csv');
}

/* ------------------------------------------------------------------- probe */

/* A script route for a walk: a browser agent that cannot land a click can
   drive the page through these, and a test can assert on what they return. */
function api() {
  return {
    niceMax: C.niceMax,
    strip: () => stripIds(),
    go, render,
    page: () => app.page,
    pages: () => app.s.pages().map(p => p.id),
    industries: () => app.cfg.industries.industries.map(i => i.id),
    cards: () => Chooser.cardsNow(),
    cardValue: id => {
      const c = (Chooser.cardsNow() || []).find(x => x.id === id);
      return c ? Chooser.fmtValue(c) : null;
    },
    chooser: open => {
      if (open === false) { Chooser.hide(); return false; }
      openChooser();
      return true;
    },
    choosing: () => {
      const el = document.getElementById('chooser');
      return !!el && !el.hidden;
    },
    present: on => {
      if (on === false) { Present.exit(); return false; }
      return startPresenting(), Present.isOn();
    },
    presenting: () => Present.isOn(),
    slide: n => {
      if (n === undefined) return { at: Present.index(), of: Present.count() };
      Present.go(n);
      return { at: Present.index(), of: Present.count() };
    },
    slideNext: () => (Present.next(), Present.index()),
    slidePrev: () => (Present.prev(), Present.index()),
    roles: () => app.s.data.roles.map(r => r.id),
    months: () => app.q.months,
    pick: (what, value) => {
      if (what === 'industry') return app.s.useIndustry(value), useIndustry(value).then(render);
      if (what === 'role') { app.s.data.role = value; app.s.save(); render(); return true; }
      if (what === 'entity') { app.s.data.entity = value; app.s.save(); render(); return true; }
      if (what === 'month') { app.s.data.month = value; app.s.save(); render(); return true; }
      if (what === 'basis') { app.s.data.basis = value; app.s.save(); render(); return true; }
      if (what === 'theme') { app.s.data.theme = value; app.s.save().apply(); render(); return true; }
      if (what === 'tab') { app.subtab = value; render(); return true; }
      return false;
    },
    kpi: id => app.q.kpi(id),
    kpis: () => app.s.industry.kpis.map(id => ({ id, ...app.q.kpi(id) })),
    sum: (line, basis) => app.q.sum(line, app.q.window(basis || app.s.data.basis)),
    bal: line => app.q.bal(line),
    unitCount: () => app.q.units.length,
    connected: () => Object.keys(app.s.data.connectors),
    settings: () => app.s.data,
    config: () => JSON.parse(app.s.exportJSON()),
    ties: () => ties(),
  };
}

/* The checks the close page claims. Run from a test, not asserted on trust. */
function ties() {
  const q = app.q;
  const out = [];
  for (const m of q.months) {
    const a = ['cash', 'ar', 'inv', 'oca', 'fa', 'ooa'].reduce((t, l) => t + q.bal(l, m, q.entities.map(e => e.id)), 0);
    const le = ['ap', 'accr', 'cd', 'ltd', 'ocl', 'cap', 're', 'cy'].reduce((t, l) => t + q.bal(l, m, q.entities.map(e => e.id)), 0);
    const rev = q.sum('rev', [m], q.entities.map(e => e.id));
    const urev = q.factSum('rev', [m], q.allUnits);
    out.push({
      month: m,
      balance: Math.round((a - le) * 100) / 100,
      unitsVsRevenue: Math.round((urev - rev) * 100) / 100,
    });
  }
  return {
    worstBalance: Math.max(...out.map(o => Math.abs(o.balance))),
    worstUnits: Math.max(...out.map(o => Math.abs(o.unitsVsRevenue))),
    months: out.length,
  };
}

boot().catch(err => {
  document.getElementById('page').innerHTML =
    `<section class="panel"><div class="empty"><b>The Hub could not start.</b><br>
     ${esc(err.message)}<br><br><span class="muted">Serve this folder over http rather than
     opening the file directly: the configuration and the data are fetched.</span></div></section>`;
  console.error(err);
});
