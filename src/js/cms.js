/* The settings console: everything a company changes about its own Hub without
   a build. Five tabs, one object behind them, and an export that is the file a
   real deployment is built from.

   The integrations tab is deliberately honest about three states. Live means we
   have run it against a real company's data. Adapter built means the code
   exists and has been tested against fixtures. Available means the vendor's API
   and auth route are confirmed and the adapter is a day or two of work. A demo
   that blurs those three is a demo that gets caught. */

import * as U from './ui.js';
import * as F from './fmt.js';
import { esc, icon, brandMark, connTile } from './icons.js';
import { paletteFrom, contrast, mix } from './settings.js';
import { statusWord } from './pages/misc.js';

const TABS = [
  { id: 'brand', name: 'Brand & identity' },
  { id: 'conns', name: 'Integrations' },
  { id: 'levels', name: 'View levels' },
  { id: 'modules', name: 'Modules & pages' },
  { id: 'deploy', name: 'Configuration file' },
];

export const FONT_PAIRS = [
  { name: 'Newsreader + IBM Plex Sans', display: '"Newsreader", Georgia, serif', body: '"IBM Plex Sans", -apple-system, sans-serif', google: 'Newsreader:ital,wght@0,400;0,600;0,700;1,400|IBM+Plex+Sans:wght@400;500;600;700' },
  { name: 'Archivo + Inter', display: '"Archivo", Impact, sans-serif', body: '"Inter", -apple-system, sans-serif', google: 'Archivo:wght@500;600;700&family=Inter:wght@400;500;600;700' },
  { name: 'Bitter + Source Sans 3', display: '"Bitter", Georgia, serif', body: '"Source Sans 3", -apple-system, sans-serif', google: 'Bitter:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700' },
  { name: 'Fraunces + Nunito Sans', display: '"Fraunces", Georgia, serif', body: '"Nunito Sans", -apple-system, sans-serif', google: 'Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Nunito+Sans:wght@400;500;600;700' },
  { name: 'Oswald + Roboto', display: '"Oswald", Impact, sans-serif', body: '"Roboto", -apple-system, sans-serif', google: 'Oswald:wght@500;600;700&family=Roboto:wght@400;500;700' },
  { name: 'Barlow Condensed + Barlow', display: '"Barlow Condensed", Impact, sans-serif', body: '"Barlow", -apple-system, sans-serif', google: 'Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700' },
  { name: 'Space Grotesk + Inter', display: '"Space Grotesk", Helvetica, sans-serif', body: '"Inter", -apple-system, sans-serif', google: 'Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700' },
  { name: 'Playfair Display + Montserrat', display: '"Playfair Display", Georgia, serif', body: '"Montserrat", -apple-system, sans-serif', google: 'Playfair+Display:wght@500;600;700&family=Montserrat:wght@400;500;600;700' },
  { name: 'DM Serif Display + DM Sans', display: '"DM Serif Display", Georgia, serif', body: '"DM Sans", -apple-system, sans-serif', google: 'DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;700' },
];

export function settings(ctx) {
  const { s } = ctx;
  const tab = ctx.subtab || 'brand';
  const body = {
    brand: brandTab, conns: connsTab, levels: levelsTab,
    modules: modulesTab, deploy: deployTab,
  }[tab](ctx);

  return U.pageHead({
    eyebrow: 'Settings',
    title: 'Settings',
    answer: `Everything on this page is configuration, not code. Change it here and the whole
      dashboard follows; export it and the same dashboard is built for a real deployment.`,
  }) + `<div class="set-grid">
    <nav class="set-nav">${TABS.map(t =>
    `<button data-act="settab" data-arg="${t.id}" aria-current="${t.id === tab}">${esc(t.name)}</button>`).join('')}
      <hr class="r">
      <button data-act="reset-settings" style="color:var(--bad)">Reset to the sample</button>
    </nav>
    <div>${body}</div>
  </div>`;
}

/* ------------------------------------------------------------------- brand */

function brandTab(ctx) {
  const { s, cfg } = ctx;
  const d = s.data;
  const p = d.brand.palette;
  const onWhite = contrast(p.accent, '#ffffff');
  const pair = FONT_PAIRS.find(f => f.display === d.brand.type.display);

  return U.panel({
    title: 'Identity',
    note: 'The company name, the mark and the two typefaces. A client’s own logo replaces the drawn monogram the moment it is uploaded.',
    body: `<div class="grid" style="gap:20px">
      <div class="col-6">
        <div class="field">
          <label for="f-company">Company name</label>
          <input id="f-company" type="text" value="${esc(d.company)}" data-bind="company">
          <div class="hint">Shown in the rail, the window title and every pack.</div>
        </div>
        <div class="field">
          <label for="f-mono">Monogram</label>
          <input id="f-mono" type="text" maxlength="3" value="${esc(d.brand.mono)}" data-bind="brand.mono"
            style="width:88px">
          <div class="hint">Used until a logo is uploaded.</div>
        </div>
        <div class="field">
          <label>Typefaces</label>
          <select data-bind="fontpair">
            ${FONT_PAIRS.map((f, i) =>
    `<option value="${i}" ${pair === f ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}
          </select>
          <div class="hint">Display face for headings and figures, body face for everything else.
            A client’s own faces go in here by name once they are licensed.</div>
        </div>
        <div class="field">
          <label>Theme</label>
          <div class="basis">
            <button data-act="theme" data-arg="light" aria-pressed="${d.theme === 'light'}">Light</button>
            <button data-act="theme" data-arg="dark" aria-pressed="${d.theme === 'dark'}">Dark</button>
          </div>
          <div class="hint">Both are checked for contrast. Chart colours change between them on purpose.</div>
        </div>
      </div>
      <div class="col-6">
        <div class="field">
          <label>Logo</label>
          <div class="drop" id="logo-drop">
            ${d.brand.logo
      ? `<img src="${esc(d.brand.logo)}" alt="" style="max-height:62px;max-width:100%">
                 <div style="margin-top:9px">${U.btn('Remove', { act: 'logo-clear', sm: true })}</div>`
      : `${icon('download', 22)}<div style="margin-top:7px">Drop a PNG or SVG here, or
                 <label style="color:var(--accent);cursor:pointer;text-decoration:underline">choose a file
                 <input type="file" id="logo-file" accept="image/*" hidden></label></div>
                 <div class="hint">Stays in this browser. A real deployment takes the file itself.</div>`}
          </div>
        </div>
        <div class="field">
          <label>Current mark</label>
          <div style="display:flex;align-items:center;gap:14px;padding:12px;background:var(--navy);border-radius:12px">
            <span class="rail-mark" style="width:42px;height:42px;flex:0 0 42px">
              ${d.brand.logo ? `<img src="${esc(d.brand.logo)}" alt="">` : brandMark(d.brand, 42)}</span>
            <div style="color:#fff">
              <div style="font-family:var(--font-display);font-weight:600">${esc(d.company)}</div>
              <div style="font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;opacity:.6">
                ${esc(d.productName)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  }) + U.panel({
    title: 'Colour',
    note: 'Set one brand colour and the rest is derived to stay readable, or set each by hand. Chart colours are deliberately not brand colours: a brand hex carries no contrast guarantee, so the series palette is fixed and validated.',
    body: `<div class="field">
        <label for="f-accent">Brand colour</label>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input id="f-accent" type="color" value="${esc(p.accent)}" data-bind="accent-pick">
          <input type="text" value="${esc(p.accent)}" data-bind="accent-hex" style="width:112px">
          ${U.btn('Derive the rest', { act: 'derive', kind: 'primary', sm: true, ico: 'bolt' })}
          <span class="tag ${onWhite >= 4.5 ? 'good' : 'warn'}"><i class="dot"></i>
            ${onWhite.toFixed(1)}:1 on white${onWhite >= 4.5 ? '' : ' — text on this needs care'}</span>
        </div>
      </div>
      <div class="swatches" style="margin:16px 0 4px">
        ${['accent', 'accentDeep', 'accentLift', 'tint', 'navy'].map(k => `
          <div class="swatch">
            <input type="color" value="${esc(p[k])}" data-bind="pal.${k}">
            <div>${esc(k)}</div>
            <div style="font-family:ui-monospace,monospace;font-size:10px">${esc(p[k])}</div>
          </div>`).join('')}
      </div>
      <hr class="r">
      <div class="field">
        <label>Start from a sample brand</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${Object.entries(cfg.brands.brands).map(([key, b]) => `
            <button class="btn sm" data-act="usebrand" data-arg="${esc(key)}"
              style="border-color:${b.palette.accent}">
              <i class="dot" style="background:${b.palette.accent};width:9px;height:9px"></i>${esc(b.name)}
            </button>`).join('')}
        </div>
      </div>`,
  });
}

/* ------------------------------------------------------------ integrations */

function connsTab(ctx) {
  const { s, cfg } = ctx;
  const cats = cfg.connectors.categories;
  const counts = cats.map(c => ({ c, on: s.connectedIn(c.id).length, all: s.connectorsIn(c.id).length }));
  const missing = counts.filter(x => !x.on && x.all);

  const header = U.panel({
    title: 'What this Hub reads',
    note: 'Nine categories. Switch one on and its figures go live on the pages that use it; switch it off and those pages say so rather than showing a number from nowhere.',
    body: `<div class="strip" style="margin:4px 0 0">
      ${counts.map(x => `<div class="strip-item">
        <div class="strip-label">${esc(x.c.name)}</div>
        <div class="strip-value">${x.on}<span class="u">/${x.all}</span></div>
        <div class="strip-note">${!x.all ? 'Nothing in this category applies to this industry'
      : x.on ? esc(s.connectedIn(x.c.id).map(k => k.name).join(', '))
        : (x.c.required ? '<b style="color:var(--bad)">Required</b>' : 'Not connected')}</div>
      </div>`).join('')}
    </div>`,
    foot: missing.length
      ? `${missing.length} ${missing.length === 1 ? 'category has' : 'categories have'} nothing connected.
         Where a company runs nothing at all, the recommended option in each category below is the one we put forward.`
      : 'Every category has something behind it.',
  });

  const sections = cats.map(cat => {
    const list = s.connectorsIn(cat.id);
    if (!list.length) return '';
    const on = list.filter(c => s.isOn(c.id));
    const recs = list.filter(c => c.recommend);
    return `<section class="cat">
      <div class="cat-head">
        <h3>${esc(cat.name)}</h3>
        ${on.length ? U.statusTag(`${on.length} connected`, 'good')
      : U.statusTag(cat.required ? 'Required, nothing connected' : 'Nothing connected', cat.required ? 'bad' : '')}
      </div>
      <p class="blurb">${esc(cat.blurb)}${!on.length && recs.length
      ? ` <b>If you run none of these, we would put forward ${esc(recs.map(r => r.name).join(' or '))}.</b>` : ''}</p>
      <div class="conns">
        ${list.sort(sortConns).map(c => connCard(c, s)).join('')}
      </div>
    </section>`;
  }).join('');

  return header + `<div style="margin-top:22px">${sections}</div>`;
}

function sortConns(a, b) {
  const rank = { live: 0, built: 1, catalogued: 2 };
  if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
  if (!!b.recommend !== !!a.recommend) return b.recommend ? 1 : -1;
  return a.name.localeCompare(b.name);
}

function connCard(c, s) {
  const on = s.isOn(c.id);
  return `<article class="conn" data-on="${on}">
    <div class="conn-top">
      ${connTile(c)}
      <div style="min-width:0">
        <div class="conn-name">${esc(c.name)}</div>
        <div class="conn-meta">${esc(c.api)}</div>
      </div>
    </div>
    <div class="conn-note">${esc(c.note)}</div>
    <div class="conn-foot">
      <span class="tag ${c.status === 'live' ? 'good' : c.status === 'built' ? 'warn' : ''}">
        <i class="dot"></i>${esc(statusWord(c.status))}</span>
      ${c.recommend ? `<span class="tag">${icon('bolt', 12)}We recommend</span>` : ''}
      ${on
      ? U.btn('Disconnect', { act: 'disconnect', arg: c.id, sm: true })
      : U.btn('Connect', { act: 'connect', arg: c.id, kind: 'primary', sm: true, ico: 'link' })}
    </div>
  </article>`;
}

/* The sheet a Connect button opens. Real auth route, real scopes, real steps. */
export function connectSheet(c, s) {
  const steps = stepsFor(c);
  return `<div class="sheet">
    <div class="sheet-head">
      ${connTile(c)}
      <div style="flex:1">
        <h3 style="font-size:17px">Connect ${esc(c.name)}</h3>
        <div class="muted small">${esc(c.auth)} · ${esc(c.api)}</div>
      </div>
      <button class="btn ghost sm" data-act="sheet-close">${icon('close', 15)}</button>
    </div>
    <div class="sheet-body">
      <p style="margin-top:0">${esc(c.note)}</p>
      <h4 style="margin:18px 0 10px;font-size:13.5px">What happens when you connect</h4>
      <ol class="steps">${steps.map(x => `<li>${x}</li>`).join('')}</ol>
      <h4 style="margin:18px 0 8px;font-size:13.5px">What it is granted</h4>
      <div class="scopes">${esc(scopesFor(c))}</div>
      <p class="muted small" style="margin:12px 0 0">
        Read only. Nothing in this product writes to a source system unless a company asks for a
        specific write and signs off on it.
      </p>
      ${c.status !== 'live' ? `<p class="small" style="margin:14px 0 0;padding:10px 12px;
        background:var(--warn-tint);color:var(--warn);border-radius:9px">
        ${c.status === 'built'
      ? 'The adapter for this one is written and tested against fixtures. Pointing it at a live tenant is configuration, not development.'
      : 'This one is catalogued: the API and the auth route are confirmed, the adapter is not written yet. Connecting it here switches the sample data on so you can see the shape it would take.'}
      </p>` : ''}
    </div>
    <div class="sheet-foot">
      <button class="btn ghost" data-act="sheet-close">Cancel</button>
      ${U.btn('Connect', { act: 'connect-go', arg: c.id, kind: 'primary', ico: 'link' })}
    </div>
  </div>`;
}

function stepsFor(c) {
  const auth = c.auth.toLowerCase();
  if (auth.includes('oauth')) {
    return [
      `You are sent to <b>${esc(c.name)}</b> to sign in as yourself.`,
      `${esc(c.name)} asks you to approve the read scopes listed below. Nothing else is requested.`,
      `The token comes back to the Hub and is stored encrypted. The password never reaches us.`,
      `A first read runs immediately so you can see the figures land, then it refreshes on the schedule you set.`,
    ];
  }
  if (auth.includes('certificate')) {
    return [
      `Your IT provider issues a certificate for the Hub’s application registration.`,
      `An administrator grants the read permissions below, scoped to the sites and companies you name.`,
      `The private key is held as a secret, never in a file beside the code.`,
      `A first read proves the grant, and the result is written into the dashboard’s feed table.`,
    ];
  }
  if (auth.includes('api key') || auth.includes('token')) {
    return [
      `You create a read-only key inside ${esc(c.name)}.`,
      `Paste it here once. It is stored encrypted and never shown again.`,
      `We read on a schedule and record every read, so a figure can always be traced to the pull that produced it.`,
      `Revoking the key in ${esc(c.name)} stops the Hub reading, immediately and completely.`,
    ];
  }
  return [
    `A read-only user is created in ${esc(c.name)} for the Hub.`,
    `The credentials are stored as secrets.`,
    `A first read runs and ties its totals to a report you already trust before anything goes on a page.`,
    `From then on it reads on a schedule.`,
  ];
}

function scopesFor(c) {
  const map = {
    'sage-intacct': 'Web Services: GL account balances, GL detail, dimensions, close dates. Read only.',
    quickbooks: 'com.intuit.quickbooks.accounting (read). Reports, accounts, classes, locations.',
    procore: 'Projects, budgets, change events, commitments. Read only, company-scoped.',
    sharepoint: 'Sites.Selected (Graph + SharePoint REST), read only, limited to the sites you name.',
    'ms-teams': 'Team.ReadBasic.All, Channel.ReadBasic.All, ChannelMessage.Read.All (read).',
    outlook: 'Mail.ReadBasic, Calendars.Read (read).',
    'ms-planner': 'Tasks.Read, Group.Read.All (read).',
    monday: 'boards:read, items:read (API-Version 2026-07).',
    slack: 'channels:read, chat:write (delivery only, to channels you pick).',
    stripe: 'Restricted key: charges, subscriptions, invoices — read.',
    adp: 'Workers and payroll output, read, over mutual TLS.',
  };
  return map[c.id] || `${c.name} read scopes only: the records this dashboard shows and nothing beside them.`;
}

/* ------------------------------------------------------------- view levels */

function levelsTab(ctx) {
  const { s, cfg } = ctx;
  const roles = s.data.roles;
  const pageCat = cfg.product.pages;

  return U.panel({
    title: 'View levels',
    note: 'A page is offered to a level when the page’s rank is at or below the level’s. Move a rank and the rail changes for everyone at that level. Rename them to your own titles: these are starting points, not a fixed hierarchy.',
    body: U.table({
      cols: [{ name: 'Level', w: '20%' }, { name: 'Example titles', w: '26%' },
      { name: 'Rank', n: true, w: '9%' }, { name: 'Scope', w: '13%' }, { name: 'Money', w: '14%' },
      { name: 'Pages', n: true, w: '8%' }, { name: '', w: '10%' }],
      rows: roles.map((r) => {
        const count = countPages(s, r);
        return {
          cells: [
            `<input type="text" value="${esc(r.name)}" data-bind="role.${r.id}.name" style="width:100%;min-width:136px">`,
            `<span class="muted small titles" title="${esc((r.titles || []).join(', '))}"
              >${esc((r.titles || []).join(', '))}</span>`,
            `<input type="number" min="0" max="100" value="${r.rank}" data-bind="role.${r.id}.rank"
              style="width:62px;text-align:right">`,
            `<select data-bind="role.${r.id}.scope">${Object.entries(cfg.roles.scopes).map(([k, v]) =>
              `<option value="${k}" ${r.scope === k ? 'selected' : ''} title="${esc(v)}">${esc(k)}</option>`).join('')}</select>`,
            `<select data-bind="role.${r.id}.money">${Object.entries(cfg.roles.money).map(([k, v]) =>
              `<option value="${k}" ${r.money === k ? 'selected' : ''} title="${esc(v)}">${esc(k)}</option>`).join('')}</select>`,
            `<b>${count}</b>`,
            `<button class="btn sm ghost" data-act="try-role" data-arg="${esc(r.id)}">Try it</button>`,
          ],
        };
      }),
    }),
    foot: `Scope decides how much of the company a level sees, money decides whether currency is
      shown at all, and rank decides which pages are offered. The three are independent on purpose:
      a supervisor can see every page for their own crew with no money on any of them.`,
  }) + U.panel({
    title: 'What each level reaches',
    note: 'The page catalogue and the rank each page needs.',
    body: U.table({
      cols: [{ name: 'Page' }, { name: 'Module' }, { name: 'Rank needed', n: true }, { name: 'Levels that reach it' }],
      rows: Object.entries(pageCat).filter(([k, p]) => !k.startsWith('$') && !p.hidden).map(([id, p]) => ({
        cells: [esc(p.name), esc(cfg.product.modules[p.module].name), String(p.rank),
        `<span class="muted small">${esc(s.data.roles.filter(r =>
          (r.allow || []).includes(id) || (p.rank <= r.rank && !(r.deny || []).includes(id)))
          .map(r => r.name).join(', ') || 'nobody')}</span>`],
      })),
    }),
  });
}

function countPages(s, role) {
  const saved = s.data.role;
  s.data.role = role.id;
  const n = s.pages().length;
  s.data.role = saved;
  return n;
}

/* ----------------------------------------------------------------- modules */

function modulesTab(ctx) {
  const { s, cfg } = ctx;
  const mods = cfg.product.modules;
  const pages = cfg.product.pages;
  return U.panel({
    title: 'Modules',
    note: 'Switch a module off and it leaves the rail for everyone. The financial module is the product; the rest are there when a company wants them.',
    body: `<div class="rows">${Object.entries(mods).filter(([k]) => !k.startsWith('$'))
      .sort((a, b) => a[1].order - b[1].order).map(([id, m]) => {
      const list = Object.entries(pages).filter(([k, p]) => !k.startsWith('$') && p.module === id && !p.hidden);
      const on = s.data.modules[id] !== false;
      const locked = id === 'finance' || id === 'settings';
      return `<div class="row-item">
        <span class="tag ${on ? 'good' : ''}"><i class="dot"></i>${on ? 'On' : 'Off'}</span>
        <span class="grow"><b>${esc(m.name)}</b>
          <div class="sub">${list.map(([, p]) => esc(p.name)).join(' · ') || 'no pages'}</div></span>
        ${locked
        ? `<span class="muted small">always on</span>`
        : U.btn(on ? 'Switch off' : 'Switch on', { act: 'module', arg: id, sm: true })}
      </div>`;
    }).join('')}</div>`,
  });
}

/* ------------------------------------------------------------- deploy tab */

function deployTab(ctx) {
  const { s } = ctx;
  const json = s.exportJSON();
  return U.panel({
    title: 'The configuration file',
    note: 'This is the whole of a client’s Hub: brand, modules, connected software, view levels. Hand this file to the build and the dashboard comes out branded, connected and role-scoped, with no code touched.',
    right: U.btn('Download', { act: 'export-config', kind: 'primary', ico: 'download', sm: true }),
    body: `<div class="field">
        <textarea rows="18" readonly style="font-family:ui-monospace,Menlo,monospace;font-size:11.5px">${esc(json)}</textarea>
      </div>
      <div class="field">
        <label>Load a configuration</label>
        <textarea rows="4" id="import-json" placeholder="Paste a configuration file here"></textarea>
        <div style="margin-top:8px">${U.btn('Load it', { act: 'import-config', ico: 'arrow' })}</div>
      </div>`,
    foot: 'Settings live in this browser while you are trying things. A real deployment carries the file.',
  }) + U.panel({
    title: 'What a deployment actually involves',
    body: `<ol class="steps">
      <li><b>Brand.</b> The kit goes in: logo files, the palette, the two typefaces. An hour, and
        it is the part a client notices first.</li>
      <li><b>The ledger.</b> One accounting connection, read only, tied to a report the company
        already trusts, cell by cell, before a single figure goes on a page.</li>
      <li><b>The unit of work.</b> Jobs, campuses, stores, lines, trucks, products: whichever one
        this company divides its money by. This is the decision the whole dashboard hangs on.</li>
      <li><b>View levels.</b> The company’s own titles, mapped to the levels, with the ranks
        moved to suit. Usually one meeting.</li>
      <li><b>Everything else.</b> Task management, documents, communication, pipeline: switched on
        one at a time, each one earning its place rather than arriving as a bundle.</li>
    </ol>`,
    foot: 'A month closes on a signature, never on the calendar. That rule is in the product, not in a policy document.',
  });
}
