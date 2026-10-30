/* Start here, and the three lighter modules. Start here is the page a buyer
   lands on, so it carries the industry switch, the figures that matter today,
   and a door to each place. */

import * as F from '../fmt.js';
import * as C from '../chart.js';
import * as U from '../ui.js';
import { esc, icon, brandMark, connTile, INDUSTRY_ICON } from '../icons.js';

export function start(ctx) {
  const { q, s, cfg } = ctx;
  const ind = s.industry;
  const role = s.role;
  const w = q.window();
  const rev = q.revenue(w);
  const kpis = ind.kpis.slice(0, 5);

  /* one door per module first, then fill from what is left: a map of the whole
     product reads better here than the first six pages of one module */
  const offered = s.pages().filter(p => !['home', 'settings'].includes(p.id));
  const firstOfModule = [];
  const seenModule = new Set();
  for (const p of offered) {
    if (seenModule.has(p.module)) continue;
    seenModule.add(p.module);
    firstOfModule.push(p);
  }
  const doors = firstOfModule
    .concat(offered.filter(p => !firstOfModule.includes(p)))
    .slice(0, 6)
    .map(p => `<button class="door" data-act="go" data-arg="${esc(p.id)}">
      <span class="door-ico">${icon(p.icon || 'grid', 17)}</span>
      <b>${esc(p.name)}</b>
      <span>${esc(doorWhy(p.id, ind))}</span>
    </button>`).join('');

  const connected = Object.keys(s.data.connectors).map(id => s.connector(id)).filter(Boolean);
  const live = connected.filter(c => c.status === 'live');

  return `<section class="cover">
    <div class="cover-greet">${esc(greeting())} · ${esc(role.name)} view</div>
    <h1>${esc(ind.headline.label)} is ${esc(U.display(q.kpi(ind.headline.metric)))}</h1>
    <p>${esc(s.data.company)} at ${esc(F.monthName(q.view.month, true))}.
      ${q.view.month > q.closed
        ? 'This month is still tentative: the ledger is closed through ' + esc(F.monthName(q.closed, true)) + '.'
        : 'Signed off through ' + esc(F.monthName(q.closed, true)) + '.'}</p>
  </section>` +
    U.strip(kpis.map(id => {
      const k = q.kpi(id);
      return { label: k.label, value: U.display(k), note: k.note ? esc(k.note) : '' };
    })) +
    `<div class="grid">` +
    U.panel({
      col: 12, title: 'Where to go',
      note: `Six places, cut to what a ${esc(role.name.toLowerCase())} may see.`,
      body: `<div class="doors">${doors}</div>`,
    }) +
    U.panel({
      col: 7, title: 'Revenue, twelve months',
      body: C.bars({
        values: q.months.slice(-12).map(m => q.revenue([m])),
        labels: q.months.slice(-12).map(m => F.monthName(m)),
        fmt: v => F.money(v), height: 230,
      }),
    }) +
    U.panel({
      col: 5, title: 'What this Hub is reading',
      note: 'Every figure on every page comes from one of these.',
      body: connected.length ? `<div class="rows">${connected.map(c => `
        <div class="row-item">
          ${connTile(c)}
          <span class="grow"><b>${esc(c.name)}</b>
            <div class="sub">${esc(cfg.connectors.categories.find(k => k.id === c.cat).name)}
              · ${esc(c.api)}</div></span>
          <span class="tag ${c.status === 'live' ? 'good' : c.status === 'built' ? 'warn' : ''}">
            <i class="dot"></i>${esc(statusWord(c.status))}</span>
        </div>`).join('')}</div>`
        : `<div class="empty">Nothing is connected yet. Settings &rsaquo; Integrations.</div>`,
      foot: `${live.length} of ${connected.length} have been run against a real company’s data in production.`,
      right: U.btn('Connect more', { act: 'go', arg: 'settings', sm: true }),
    }) +
    U.panel({
      col: 12, title: 'The same build, another industry',
      note: 'One codebase. The company, the brand, the unit of work, the measures and the connected software all move together.',
      right: U.btn('See all six', { act: 'chooser', kind: 'primary', ico: 'grid', sm: true }),
      body: `<div class="ind-strip">${cfg.industries.industries.map(i => {
        const b = cfg.brands.brands[i.brand];
        const on = i.id === s.data.industry;
        return `<button class="ind-chip" data-act="industry" data-arg="${esc(i.id)}"
          aria-current="${on}" style="--c:${b.palette.accent}">
          <span class="m">${brandMark(b, 22)}</span>
          <span><b>${esc(i.short)}</b><span>${esc(i.unit.collection)}</span></span>
        </button>`;
      }).join('')}</div>`,
    }) + `</div>`;
}

function doorWhy(id, ind) {
  return {
    'fin-dash': 'The one page a chief executive opens',
    'fin-pl': 'The statement, line by line, against last year',
    'fin-margin': 'Which work is carrying the company and which is diluting it',
    'fin-budget': 'The plan against what happened, over the months the plan covers',
    'fin-cash': 'Cash, what customers owe, and what is owed out',
    'fin-balance': 'The position as of the month',
    'fin-statements': 'The packs, generated from the same facts',
    'fin-close': 'What is signed off and what is waiting',
    'ops-home': `How the ${ind.unit.many} are running`,
    'ops-units': `Every ${ind.unit.one}, with the money on it`,
    'ops-second': 'The operational read behind the revenue',
    'people-home': 'Headcount, labour cost and turnover',
    'pipeline-home': 'What is coming, and what it is worth weighted',
    'docs-home': 'The paperwork behind the figures',
  }[id] || '';
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function statusWord(status) {
  return { live: 'Live', built: 'Adapter built', catalogued: 'Available' }[status] || status;
}

/* ------------------------------------------------------------------ people */

export function people(ctx) {
  const { q, s } = ctx;
  const p = q.data.people;
  const w = q.window();
  const labour = q.sum('labour', w);
  const rev = q.sum('rev', w) || 1;

  return U.pageHead({
    eyebrow: 'People',
    title: 'People & labour',
    answer: `<b>${F.num(p.headcount)}</b> people, with payroll and benefits at
      <b>${F.money(labour)}</b> over the window, or <b>${F.pct(labour / rev * 100)}</b> of revenue.
      Turnover is running at <b>${F.pct(p.turnover)}</b> a year, and
      <b>${F.num(p.open)}</b> roles are open.`,
  }) + U.fresh(q, s) + `<div class="grid">` +
    U.panel({
      col: 5, title: 'By department',
      body: C.hbars({
        rows: p.departments.map(d => ({ name: d.name, value: d.fte })),
        fmt: v => F.num(v),
      }),
      foot: `Revenue per head is ${F.money(rev * (12 / Math.max(1, w.length)) / p.headcount)} a year.`,
    }) +
    U.panel({
      col: 7, title: 'Payroll against revenue',
      note: 'The question is whether labour grows with the work or ahead of it.',
      body: C.line({
        series: [
          { name: 'Revenue', values: q.series('rev', q.months.slice(-18)) },
          { name: 'Payroll & benefits', values: q.series('labour', q.months.slice(-18)) },
        ],
        labels: q.months.slice(-18).map(m => F.monthName(m)), fmt: v => F.money(v), height: 250,
      }),
    }) +
    U.panel({
      col: 12, title: 'Where this comes from',
      body: connectorNote(s, 'people', 'Headcount and labour cost arrive from the payroll system. Until one is connected these figures are the sample set.'),
    }) + `</div>`;
}

/* ---------------------------------------------------------------- pipeline */

export function pipeline(ctx) {
  const { q, s } = ctx;
  const p = q.data.pipeline;
  const total = p.rows.reduce((a, r) => a + r.value, 0);
  const weighted = p.rows.reduce((a, r) => a + r.weighted, 0);
  const byStage = p.stages.map(st => ({
    name: st,
    value: p.rows.filter(r => r.stage === st).reduce((a, r) => a + r.value, 0),
  }));

  return U.pageHead({
    eyebrow: 'Pipeline',
    title: 'Pipeline',
    answer: `<b>${F.money(total)}</b> of open opportunity across <b>${p.rows.length}</b> pursuits,
      <b>${F.money(weighted)}</b> of it weighted by stage.
      ${esc(p.note)}`,
  }) + `<div class="grid">` +
    U.panel({
      col: 5, title: 'By stage',
      body: C.hbars({ rows: byStage, fmt: v => F.money(v) }),
      foot: 'Stage weights are the build’s until a company sets its own, and the page says so rather than implying they are the company’s.',
    }) +
    U.panel({
      col: 7, title: 'Every pursuit', pad: false,
      body: U.table({
        cols: [{ name: 'Opportunity' }, { name: 'Stage' }, { name: 'Owner' },
        { name: 'Value', n: true }, { name: 'Weighted', n: true }, { name: 'Expected', n: true }],
        rows: p.rows.slice().sort((a, b) => b.weighted - a.weighted).map(r => ({
          cells: [`<b>${esc(r.name)}</b>`, U.statusTag(r.stage, r.stage === 'Won' ? 'good' : ''),
          esc(r.owner), F.money(r.value), F.money(r.weighted), esc(F.monthName(r.close, true))],
        })),
      }),
    }) +
    U.panel({
      col: 12, title: 'Where this comes from',
      body: connectorNote(s, 'crm', 'Pipeline is read from the CRM. It never enters a statement: a pursuit is not a fact.'),
    }) + `</div>`;
}

/* --------------------------------------------------------------- documents */

export function docs(ctx) {
  const { q, s } = ctx;
  const d = q.data.docs;
  return U.pageHead({
    eyebrow: 'Documents',
    title: 'Documents',
    answer: `<b>${F.num(d.count)}</b> documents indexed, each one readable only by the people who
      can already read it in the source system. The index carries no copies: it points at the
      file where it lives.`,
  }) + `<div class="grid">` +
    U.panel({
      col: 6, title: 'Recently filed',
      body: `<div class="rows">${d.recent.map(r => `
        <div class="row-item">${icon('doc', 17)}
          <span class="grow"><b>${esc(r.name)}</b><div class="sub">${esc(r.when)} · ${esc(r.by)}</div></span>
          <span class="btn sm ghost">${icon('link', 14)}Open</span>
        </div>`).join('')}</div>`,
    }) +
    U.panel({
      col: 6, title: 'How the index works',
      body: `<ol class="steps">
        <li><b>Read, never copy.</b> The index records a pointer and the file stays where it is,
          so storage does not double and nothing is migrated.</li>
        <li><b>One slice per set of readers.</b> Rows are grouped by who can read them, and a
          viewer is served only the slices they hold permission on.</li>
        <li><b>Named by convention.</b> A filed document leads with its project, then its date,
          then its type, so a list sorts into something a person can scan.</li>
        <li><b>The page trims itself.</b> Two people on the same page see different rows, which is
          a permission decision, not a filter.</li>
      </ol>` + connectorNote(s, 'docs', 'Nothing is indexed until a document store is connected.'),
    }) + `</div>`;
}

function connectorNote(s, cat, fallback) {
  const on = s.connectedIn(cat);
  if (!on.length) return `<div class="empty">${esc(fallback)}</div>`;
  return `<div class="rows">${on.map(c => `
    <div class="row-item">${connTile(c)}
      <span class="grow"><b>${esc(c.name)}</b><div class="sub">${esc(c.auth)} · ${esc(c.api)}</div></span>
      <span class="tag ${c.status === 'live' ? 'good' : c.status === 'built' ? 'warn' : ''}">
        <i class="dot"></i>${esc(statusWord(c.status))}</span>
    </div>`).join('')}</div>`;
}

export const miscPages = {
  home: start, 'people-home': people, 'pipeline-home': pipeline, 'docs-home': docs,
};
