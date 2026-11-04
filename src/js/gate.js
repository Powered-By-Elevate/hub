/* The two doors in front of a client's Hub.

   Each client gets a
   dedicated Launchpad with logins that show different views, such as finance
   or HR, hosted where the team picks a client and sees all of their data.

   So there are two screens, and neither is a permission system of its own:

   - The SIGN-IN is a client's front door, in that client's brand. A real
     deployment signs people in with Microsoft and maps each person to a view
     level by job title. The demo has no sign-in, so it says so and offers
     sample people instead, each tied to one level in config/roles.json.
   - The CONSOLE is Elevate's own view: every client as a card with figures
     from that client's own extract, and one click into any of them at the
     top level.

   ⛔ Both only ever SET the view level. What a level may see is still decided
   where it always was: pages in settings.js, scope in query.js, money in
   fmt.js. A sample person is a level with a name on it, nothing more. */

import * as F from './fmt.js';
import { Q } from './query.js';
import { esc, icon, brandMark, INDUSTRY_ICON } from './icons.js';
import { scene } from './scenes.js';
import { spark } from './chart.js';

export function scopeWord(role) {
  return { all: 'every company', company: 'one company', units: 'assigned units only',
    own: 'own work only' }[role.scope] || role.scope;
}

export function moneyWord(role) {
  return { full: 'all figures', operating: 'operating figures', unit: 'unit figures',
    none: 'no currency' }[role.money] || role.money;
}

/* The top level a client has. Staff enter at it. Found by rank rather than by
   id, because a client can rename every level in the console. */
export function topRole(roles) {
  return roles.slice().sort((a, b) => b.rank - a.rank)[0];
}

/* The sample people at one company. A person whose level was deleted in the
   console is dropped, and a level renamed there shows its new name. */
export function people(cfg, roles, ind) {
  const spec = (cfg.roles && cfg.roles.signin) || {};
  const list = spec.people || [];
  const names = spec.names || [];
  const at = Math.max(0, cfg.industries.industries.findIndex(i => i.id === ind.id));
  return list.map((p, i) => {
    const role = roles.find(r => r.id === p.role);
    if (!role) return null;
    const name = names.length ? names[(at * list.length + i) % names.length] : `Sample person ${i + 1}`;
    return {
      name, role: role.id, level: role, lands: p.lands,
      title: p.title || cap(ind.unit.owner || role.name),
    };
  }).filter(Boolean);
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function initials(name) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function pageName(cfg, ind, id) {
  const over = (ind.pages || {})[id];
  return (over && over.name) || (cfg.product.pages[id] || {}).name || id;
}

/* --------------------------------------------------------------- the host */

export function show(html, kind) {
  let host = document.getElementById('gate');
  if (!host) {
    host = document.createElement('div');
    host.id = 'gate';
    document.body.appendChild(host);
  }
  host.innerHTML = html;
  host.dataset.kind = kind;
  host.hidden = false;
  document.body.classList.add('gated');
  window.scrollTo({ top: 0 });
  /* the entrance, never for a robot, so the gate measures the settled screen */
  const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.webdriver;
  if (!quiet) {
    host.querySelectorAll('[data-rise]').forEach((el, i) => {
      el.style.animationDelay = `${40 + i * 50}ms`;
      el.classList.add('enter');
    });
  }
  return host;
}

export function hide() {
  const host = document.getElementById('gate');
  if (host) { host.hidden = true; host.innerHTML = ''; }
  document.body.classList.remove('gated');
}

export function open() {
  const host = document.getElementById('gate');
  if (!host || host.hidden) return null;
  return host.dataset.kind || null;
}

/* ------------------------------------------------------------ the sign-in */

export function signin({ cfg, s, q, ind, tenant, note }) {
  const brand = s.data.brand;
  const company = s.data.company;
  const who = people(cfg, s.data.roles, ind);
  const ents = q.entities;
  const closed = q.closed ? F.monthName(q.closed, true) : '';
  return `<div class="sg" data-kind="signin">
    <header class="gate-top" data-rise>
      <span class="gate-prod">${esc(s.data.productName)} <span>${esc(cfg.product.product.vendor)}</span></span>
      <span class="gate-links">
        ${tenant ? '' : `<button class="gate-link" data-act="chooser">${icon('grid', 14)}Another company</button>
        <button class="gate-link" data-act="console">${icon('shield', 14)}Elevate staff</button>`}
      </span>
    </header>
    <div class="sg-card" data-rise>
      <section class="sg-brand">
        <span class="sg-scene">${scene(ind.id, brand.palette, { height: 230 })}</span>
        <span class="sg-mark">${brand.logo ? `<img src="${esc(brand.logo)}" alt="">` : brandMark(brand, 56)}</span>
        <h1>${esc(company)}</h1>
        <p>${esc(ind.tagline)}</p>
        <ul class="sg-facts">
          <li><b>${ents.length}</b> ${ents.length === 1 ? 'company' : 'companies'}</li>
          <li><b>${q.allUnits.length}</b> ${esc(ind.unit.many)}</li>
          ${closed ? `<li>Signed off through <b>${esc(closed)}</b></li>` : ''}
        </ul>
      </section>
      <section class="sg-form">
        <div class="sg-eyebrow">Sign in</div>
        <h2>Your ${esc(s.data.productName)}, at your level</h2>
        <button class="sg-ms" data-act="ms-signin">${msLogo()}<span>Sign in with Microsoft</span></button>
        <p class="sg-small">${note
    ? `<b>This demo has no sign-in.</b> A deployment opens ${esc(company)}'s own Microsoft 365 here, with its two-factor and access rules. Pick a sample person below instead.`
    : `A deployment signs people in through ${esc(company)}'s own Microsoft 365, so its two-factor and access rules apply. Each person lands at the level their job title maps to.`}</p>
        <div class="sg-or"><span>Demo sign-in</span></div>
        ${who.length ? `<div class="sg-people">
          ${who.map((p, i) => person(cfg, ind, p, i)).join('')}
        </div>` : `<p class="sg-small">No sample people are set up for this Hub.</p>`}
        <p class="sg-foot">This is a demo sign-in. Every name here is invented, and picking one sets the view level and nothing more.</p>
      </section>
    </div>
  </div>`;
}

function person(cfg, ind, p, i) {
  const none = p.level.money === 'none';
  return `<button class="sg-person" data-act="signin-as" data-arg="${i}">
    <span class="sg-av">${esc(initials(p.name))}</span>
    <span class="sg-who">
      <b>${esc(p.name)}</b>
      <span>${esc(p.title)} · opens on ${esc(pageName(cfg, ind, p.lands))}</span>
    </span>
    <span class="sg-level${none ? ' none' : ''}">${esc(p.level.name)}<small>${esc(moneyWord(p.level))}</small></span>
    <span class="sg-go">${icon('arrow', 15)}</span>
  </button>`;
}

function msLogo() {
  return `<svg viewBox="0 0 21 21" width="18" height="18" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>`;
}

/* ------------------------------------------------------------ the console */

/* One row per client, every figure read from that client's own extract through
   the same Q the pages use. The money level is raised to full only while these
   strings are made, then put back, so a no-money level never inherits it. */
export function clients(cfg, data, roles) {
  const top = topRole(roles);
  const was = F.state.money;
  F.setMoneyLevel('full');
  try {
    return cfg.industries.industries.filter(ind => data[ind.id]).map(ind => {
      const q = new Q(data[ind.id], ind);
      const month = q.months[q.months.length - 1];
      q.setView({ role: top, entity: '*', basis: 'ytd', month });
      const figs = (ind.kpis || []).map(id => {
        try { return q.kpi(id); } catch (err) { return null; }
      }).filter(k => k && Number.isFinite(k.value)).slice(0, 3);
      const fin = (ind.connected || {}).finance;
      const conn = (cfg.connectors.connectors || []).find(c => c.id === fin);
      return {
        ind, q, month, figs,
        brand: cfg.brands.brands[ind.brand] || cfg.brands.brands.default,
        revenue: q.kpi('revenue').value,
        spark: q.series('rev', q.months.slice(-12)),
        tentative: !q.closed || month > q.closed,
        finance: conn ? conn.name : '',
        search: [ind.company, ind.name, ind.short, conn ? conn.name : '',
          ...q.entities.map(e => e.name)].join(' ').toLowerCase(),
      };
    });
  } finally {
    F.setMoneyLevel(was);
  }
}

export function console_({ cfg, rows, display }) {
  const was = F.state.money;
  F.setMoneyLevel('full');
  try {
    const ents = rows.reduce((t, r) => t + r.q.entities.length, 0);
    const units = rows.reduce((t, r) => t + r.q.allUnits.length, 0);
    const open = rows.filter(r => r.tentative).length;
    const rev = rows.reduce((t, r) => t + r.revenue, 0);
    return `<div class="ec" data-kind="console">
      <header class="gate-top" data-rise>
        <span class="gate-prod">${esc(cfg.product.product.name)} <span>${esc(cfg.product.product.vendor)}</span></span>
        <span class="gate-links"><span class="gate-badge">${icon('shield', 13)}Staff view</span></span>
      </header>
      <div class="ec-head" data-rise>
        <div>
          <div class="sg-eyebrow">Elevate console</div>
          <h1>Every client, in one place.</h1>
          <p>Open any client's Hub at full access, or open their sign-in to see it the way one of their people does.</p>
        </div>
        <label class="ec-search">${icon('search', 16)}
          <input type="search" data-bind="gate-search" placeholder="Find a client, company or system"
            aria-label="Find a client" autocomplete="off"></label>
      </div>
      <div class="ec-stats" data-rise>
        ${stat('Clients', rows.length, '')}
        ${stat('Companies', ents, `${units.toLocaleString('en-US')} units of work between them`)}
        ${stat('Revenue this year', F.figure(F.usd(rev)), 'Across every client, year to date')}
        ${stat('Waiting on a close', open, open === 1 ? 'client with a tentative month' : 'clients with a tentative month')}
      </div>
      <div class="ec-grid">
        ${rows.map(r => card(r, display)).join('')}
      </div>
      <p class="ec-none" hidden>No client matches that.</p>
      <footer class="ec-foot">${esc(cfg.product.demoNotice)} The console is Elevate's view of its clients. A client never sees it.</footer>
    </div>`;
  } finally {
    F.setMoneyLevel(was);
  }
}

function stat(label, value, note) {
  return `<div class="ec-stat"><span>${esc(label)}</span><b>${value}</b>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
}

function card(r, display) {
  const p = r.brand.palette;
  const ind = r.ind;
  return `<article class="ec-card" data-rise data-search="${esc(r.search)}" data-client="${esc(ind.id)}"
    style="--w-accent:${p.accent};--w-deep:${p.navy};--w-lift:${p.accentLift};--w-tint:${p.tint}">
    <div class="ec-band">
      <span class="ec-scene">${scene(ind.id, p, { height: 112 })}</span>
      <span class="ec-mark">${brandMark(r.brand, 36)}</span>
      <span class="ec-id"><b>${esc(ind.company)}</b><span>${esc(ind.short || ind.name)}</span></span>
      <span class="ec-ico">${icon(INDUSTRY_ICON[ind.id] || 'grid', 19)}</span>
    </div>
    <div class="ec-figs">
      ${r.figs.map(k => `<div><span>${esc(k.label)}</span><b>${F.figure(display(k))}</b></div>`).join('')}
    </div>
    <div class="ec-meta">
      <span class="ec-trend">${spark(r.spark, { width: 72, height: 22, color: p.accent })}<small>Revenue, 12 months</small></span>
      <span class="tag${r.tentative ? ' warn' : ' good'}">${r.tentative
    ? `${esc(F.monthName(r.month, true))} tentative` : `Signed off through ${esc(F.monthName(r.q.closed, true))}`}</span>
    </div>
    <div class="ec-sub">${r.q.entities.length} ${r.q.entities.length === 1 ? 'company' : 'companies'}
      · ${r.q.allUnits.length} ${esc(ind.unit.many)}${r.finance ? ` · ${esc(r.finance)}` : ''}</div>
    <div class="ec-acts">
      <button class="btn primary sm" data-act="staff-enter" data-arg="${esc(ind.id)}">Open at full access ${icon('arrow', 14)}</button>
      <button class="btn ghost sm" data-act="signin" data-arg="${esc(ind.id)}">Client sign-in</button>
    </div>
  </article>`;
}

/* The search filters cards already drawn. Nothing is refetched or redrawn. */
export function filter(text) {
  const host = document.getElementById('gate');
  if (!host) return 0;
  const want = String(text || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const el of host.querySelectorAll('.ec-card')) {
    const hit = want.every(w => el.dataset.search.includes(w));
    el.hidden = !hit;
    if (hit) shown++;
  }
  const none = host.querySelector('.ec-none');
  if (none) none.hidden = shown > 0;
  return shown;
}
