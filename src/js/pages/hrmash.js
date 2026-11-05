/* The HR mashup (Matt, 2026-11-05: "this isnt a mashup of all the top competitors in the HR
   marketplace....this feels like something you personally made", then "comparison page and then
   rebuild").

   Each screen copies the LAYOUT of the platform that does that job best, not just its rule:
     HR home       BambooHR's home: profile and balances left, the company feed in the middle,
                   Who's out and Celebrations down the right
     Inbox         Workday's inbox: the list on the left, the business process open on the right
                   with its process history and Approve, Send back, Deny
     Employee      Rippling's employee record: the person and their apps down the left, the open
                   app's sections on the right
     Timecards     ADP and UKG's team timecard: people down the side, days across, exceptions in
                   the cell, approve locked until a card is clean
     Run payroll   Gusto's run payroll: hours and earnings, time off, then review and submit
     Org chart     Workday's org chart with a what-if: move people and watch headcount, span and
                   cost before anything is sent
     Talent review Workday's calibration nine-box: drag people between boxes, the talent card beside
     Onboarding    Gusto's onboarding checklist, with BambooHR's new-hire view and Get to know you
     Reports       Rippling's report builder: pick fields, group, filter, preview

   No vendor's name, logo or wording ships on a page: the layouts are borrowed, the brand is the
   client's. Every figure comes from the same generated roster as the rest of the HR tab
   (build_hr in data/gen.py). The comparison of each borrowed screen against the real one is
   os-vault/wiki/research/hr-mashup-spec.md and the comparison artifact it links. */
import * as F from '../fmt.js';
import * as C from '../chart.js';
import * as U from '../ui.js';
import { esc, icon } from '../icons.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const day = iso => { const [, m, d] = iso.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const dayY = iso => `${day(iso)}, ${iso.slice(0, 4)}`;
const wday = iso => WD[new Date(`${iso}T12:00:00`).getDay()];
const span = (a, b) => (a === b ? day(a) : `${day(a)} to ${day(b)}`);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const hr = q => q.data.people.hr;
const ini = n => n.split(' ').map(w => w[0]).join('').slice(0, 2);
const face = (n, sz = 32, cls = '') => `<span class="face ${cls}" style="width:${sz}px;height:${sz}px;font-size:${Math.round(sz * 0.36)}px">${esc(ini(n))}</span>`;
const nice = t => t.replace(/\d{4}-\d{2}-\d{2}/g, d => day(d));
const noMoney = () => F.state.money === 'none';
const rate$ = v => (noMoney() ? '—' : `$${v.toFixed(2)}`);

function seeded(id) {
  let x = 0;
  for (const ch of id) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}

/* One person's pay, the same wherever it is read (profile, payroll, org-chart cost, reports).
   It starts from the industry's typical seat and moves with seniority. A department's all-in
   cost carries taxes, benefits and direct labor, so it is never read as a salary. */
function payOf(q, r) {
  const h = hr(q), p = q.data.people;
  const rnd = seeded(`${r.id}:pay`);
  const yrs = daysBetween(r.s, h.asOf) / 365;
  const lead = !r.mgr;
  const base = Math.round(p.costPerHead * (lead ? 1.35 : 0.62 + rnd() * 0.4) * (1 + Math.min(10, yrs) * 0.015) / 500) * 500;
  const hourly = r.ty !== 'Full time';
  return { base, hourly, rate: Math.round(base / 2080 * 0.9 * 100) / 100, yrs, lead };
}

/* ------------------------------------------------------------- view state */

/* What a viewer has picked or moved on these screens. It lives in memory for the visit only:
   a what-if org move or a nine-box placement is a scenario, never a record, and a static demo
   has nowhere shared to keep one. Inbox and timecard decisions use the shared task store
   instead, so they agree with the Time off page. */
const S = {
  ptab: 'overview', isel: '', ifilt: '', ibox: 'actions', pstep: 1, psubmitted: false, hours: {},
  tsel: '', tplace: {}, tdept: '', odept: '', omoving: '', oplan: false, omoves: {}, osent: false,
  onsel: '', onview: 'admin', ondone: {}, rf: ['n', 'd', 't', 'ty', 's'], rg: '', rfilt: '', rview: 'table',
  tcwk: 0, tccell: '', tcfix: {},
};

export function hrAct(arg) {
  const at = arg.indexOf(':');
  const k = at < 0 ? arg : arg.slice(0, at), v = at < 0 ? '' : arg.slice(at + 1);
  switch (k) {
    case 'ptab': S.ptab = v; break;
    case 'isel': S.isel = v; break;
    case 'ifilt': S.ifilt = S.ifilt === v ? '' : v; S.isel = ''; break;
    case 'ibox': S.ibox = v; S.isel = ''; break;
    case 'pstep': S.pstep = Number(v); break;
    case 'psubmit': S.psubmitted = true; break;
    case 'preset': S.psubmitted = false; S.pstep = 1; S.hours = {}; break;
    case 'tsel': S.tsel = S.tsel === v ? '' : v; break;
    case 'tbox': if (S.tsel) { S.tplace[S.tsel] = Number(v); } break;
    case 'tdept': S.tdept = v; S.tsel = ''; break;
    case 'treset': S.tplace = {}; break;
    case 'odept': S.odept = S.odept === v ? '' : v; break;
    case 'oplan': S.oplan = !S.oplan; S.omoving = ''; break;
    case 'omove': S.omoving = S.omoving === v ? '' : v; break;
    case 'oto': if (S.omoving) { S.omoves[S.omoving] = v; S.omoving = ''; S.osent = false; } break;
    case 'oundo': delete S.omoves[v]; break;
    case 'oreset': S.omoves = {}; S.omoving = ''; S.osent = false; break;
    case 'osend': S.osent = true; break;
    case 'onsel': S.onsel = v; break;
    case 'onview': S.onview = v; break;
    case 'ontog': S.ondone[v] = !S.ondone[v]; break;
    case 'rf': S.rf = S.rf.includes(v) ? S.rf.filter(x => x !== v) : [...S.rf, v]; break;
    case 'rg': S.rg = S.rg === v ? '' : v; break;
    case 'rfilt': S.rfilt = S.rfilt === v ? '' : v; break;
    case 'rview': S.rview = v; break;
    case 'tcwk': S.tcwk = Number(v); S.tccell = ''; break;
    case 'tccell': S.tccell = S.tccell === v ? '' : v; break;
    case 'tcfix': S.tcfix[v] = true; break;
    default: break;
  }
}

/* Delegated once on the page host, which survives every render: drag and drop for the
   nine-box and the org chart, the hour fields on Run payroll, and the reason a send back needs. */
export function hrWire(host, render) {
  if (host.dataset.hrWired) return;
  host.dataset.hrWired = '1';
  host.addEventListener('dragstart', ev => {
    const el = ev.target.closest('[data-drag]');
    if (!el) return;
    ev.dataTransfer.setData('text/plain', el.dataset.drag);
    ev.dataTransfer.effectAllowed = 'move';
  });
  host.addEventListener('dragover', ev => { if (ev.target.closest('[data-drop]')) ev.preventDefault(); });
  host.addEventListener('drop', ev => {
    const zone = ev.target.closest('[data-drop]');
    if (!zone) return;
    ev.preventDefault();
    const what = ev.dataTransfer.getData('text/plain');
    const [kind, id] = what.split('|');
    const [zkind, to] = zone.dataset.drop.split('|');
    if (kind === 'nb' && zkind === 'nb') { S.tsel = id; hrAct(`tbox:${to}`); render(); }
    if (kind === 'org' && zkind === 'org') { S.omoving = id; hrAct(`oto:${to}`); render(); }
  });
  host.addEventListener('change', ev => {
    const f = ev.target.closest('[data-hours]');
    if (!f) return;
    const v = Math.max(0, Math.min(120, Number(f.value) || 0));
    S.hours[f.dataset.hours] = v;
    render();
  });
  host.addEventListener('input', ev => {
    if (ev.target.id !== 'wd-comment') return;
    const back = host.querySelector('[data-needs-reason]');
    if (back) back.disabled = !ev.target.value.trim();
  });
}

function source(s) {
  const on = s.connectedIn('people');
  return `<p class="mash-src">${on.length
    ? `Employee records arrive from ${esc(on.map(c => c.name).join(', '))}, and decisions made here go back to it, so the payroll system stays the record.`
    : 'Employee records arrive from the payroll or HR system. Until one is connected these are the sample set.'}</p>`;
}

/* ------------------------------------------------------- HR home (BambooHR) */

function celebrations(h) {
  const out = [];
  const now = h.asOf;
  for (const r of h.roster) {
    const rnd = seeded(`${r.id}:bday`);
    const m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28);
    const y = Number(now.slice(0, 4));
    for (const yy of [y, y + 1]) {
      const b = `${yy}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const gap = daysBetween(now, b);
      if (gap >= 0 && gap <= 21) out.push({ r, when: b, gap, what: 'Birthday' });
    }
    const yrs = y - Number(r.s.slice(0, 4));
    for (const yy of [y, y + 1]) {
      const a = `${yy}${r.s.slice(4)}`;
      const gap = daysBetween(now, a);
      const n = yy - Number(r.s.slice(0, 4));
      if (gap >= 0 && gap <= 21 && n >= 1) out.push({ r, when: a, gap, what: `${n} year${n === 1 ? '' : 's'}` });
    }
    void yrs;
  }
  return out.sort((a, b) => a.gap - b.gap);
}

function home(ctx) {
  const { q, s } = ctx;
  const h = hr(q), marks = ctx.tasks || {};
  const company = q.data.meta.company || 'the company';
  const waiting = h.inbox.filter(i => !marks[inboxKey(i)]);
  const in7 = addDays(h.asOf, 7);
  const outs = h.timeoff.out.concat(h.timeoff.pending.filter(p => marks[`${p.id}-${p.from}:pto`] === 'done'))
    .filter(o => o.to >= h.asOf && o.from <= in7);
  const today = outs.filter(o => o.from <= h.asOf);
  const tomorrow = outs.filter(o => o.from === addDays(h.asOf, 1));
  const later = outs.filter(o => o.from > addDays(h.asOf, 1));
  const cel = celebrations(h).slice(0, 7);
  const lead = h.roster.find(r => r.d === 'Accounting' && !r.mgr) || h.roster.find(r => !r.mgr) || h.roster[0];
  const myPto = lead.pto || 0;
  const certs = h.compliance.expiring.filter(c => daysBetween(h.asOf, c.due) <= 14);
  const newHires = h.hiring.onboarding;
  const byN = n => h.roster.find(r => r.n === n);

  const outRow = o => { const r = byN(o.n); return `<button class="bh-who" ${r ? `data-click="person:${esc(r.id)}"` : ''}>${face(o.n, 30)}<span><b>${esc(o.n)}</b>
    <i>${esc(o.k)} · ${span(o.from, o.to)}</i></span></button>`; };
  const group = (t, list) => `<div class="bh-grp"><h5>${t}</h5>${list.length ? list.map(outRow).join('') : '<p class="bh-none">Nobody</p>'}</div>`;

  const feed = [
    ...waiting.slice(0, 4).map(i => ({ ico: 'check', t: `${i.kind === 'Time off' ? 'Approve a time off request' : `Review a ${i.kind.toLowerCase()}`} from ${i.who}`,
      sub: nice(i.what), act: `data-act="hr" data-arg="isel:${esc(i.id)}"`, go: 'hr-inbox', when: i.age ? `${i.age}d` : 'today' })),
    ...newHires.map(n => ({ ico: 'people', t: `Welcome ${n.n}, our new ${n.t.toLowerCase()} in ${n.d}`, sub: `Starts ${wday(n.s)}, ${day(n.s)}. ${n.done} of ${h.hiring.steps.length} onboarding steps done.`, go: 'hr-onboarding', when: day(n.s) })),
    ...certs.slice(0, 3).map(c => ({ ico: 'shield', t: `${c.c} for ${c.n} ${daysBetween(h.asOf, c.due) < 0 ? 'has lapsed' : `is due ${day(c.due)}`}`, sub: 'Renew before the next shift on site.', go: 'hr-compliance', when: day(c.due) })),
    { ico: 'chat', t: `The ${MON[Number(h.asOf.slice(5, 7)) - 1]} pulse closed with an eNPS of ${h.pulse.enps > 0 ? '+' : ''}${h.pulse.enps}`, sub: `${h.pulse.responded}% responded. Most mentioned: ${h.pulse.themes.slice(0, 2).map(t => t[0]).join(' and ').toLowerCase()}.`, go: 'hr-reviews', when: 'this week' },
  ];

  return `<div class="bh">
    <aside class="bh-left">
      <section class="bh-card bh-me">${face(lead.n, 64, 'big')}<div><h2>Hi, ${esc(lead.n.split(' ')[0])}</h2><p>${esc(lead.t)}</p></div></section>
      <section class="bh-card"><h4>My time off</h4>
        <div class="bh-bal"><div><b>${Math.round(myPto * 0.7)}</b><span>hours vacation available</span></div>
        <div><b>${Math.round(myPto * 0.3)}</b><span>hours sick available</span></div></div>
        <button class="btn sm" data-act="go" data-arg="hr-time">Request time off</button></section>
      <section class="bh-card"><h4>Shortcuts</h4>
        <button class="bh-link" data-act="go" data-arg="hr-directory">Employee directory</button>
        <button class="bh-link" data-act="go" data-arg="hr-org">Org chart</button>
        <button class="bh-link" data-act="go" data-arg="hr-reports">Reports</button>
        <button class="bh-link" data-act="go" data-arg="hr-payroll">Run payroll</button></section>
    </aside>
    <main class="bh-mid">
      <header class="bh-hello"><span class="page-eyebrow">HR</span><h1 class="page-title">What's happening at ${esc(company)}</h1>
        <p class="page-answer"><b>${waiting.length}</b> requests wait on you, <b>${today.length}</b> ${today.length === 1 ? 'person is' : 'people are'} out today and
        <b>${newHires.length}</b> ${newHires.length === 1 ? 'person starts' : 'people start'} soon.</p></header>
      <section class="bh-card bh-feed panel"><h4>My to-dos and company news</h4>
        ${feed.map(f => `<div class="bh-item"><span class="bh-ico">${icon(f.ico, 16)}</span><div><b>${esc(f.t)}</b><p>${esc(f.sub)}</p></div>
          <div class="bh-act"><i>${esc(f.when)}</i><button class="btn sm ghost" data-act="go" data-arg="${f.go}">Open</button></div></div>`).join('')}</section>
      <section class="bh-card"><h4>Welcome to the team</h4><div class="bh-new">${newHires.map(n => `<div>${face(n.n, 46)}<b>${esc(n.n)}</b><span>${esc(n.t)}</span><i>Starts ${day(n.s)}</i></div>`).join('') || '<p class="bh-none">No one starting this month.</p>'}</div></section>
    </main>
    <aside class="bh-right">
      <section class="bh-card"><h4>Who's out</h4>${group('Today', today)}${group('Tomorrow', tomorrow)}${group('Next seven days', later)}</section>
      <section class="bh-card"><h4>Celebrations</h4>${cel.map(c => `<button class="bh-who" data-click="person:${esc(c.r.id)}">${face(c.r.n, 30)}<span><b>${esc(c.r.n)}</b>
        <i>${c.what === 'Birthday' ? 'Birthday' : `${esc(c.what)} at ${esc(company)}`} · ${c.gap === 0 ? 'today' : day(c.when)}</i></span></button>`).join('') || '<p class="bh-none">Nothing in the next three weeks.</p>'}</section>
    </aside></div>` + source(s);
}

/* -------------------------------------------------------- Inbox (Workday) */

function inboxKey(i) { return i.kind === 'Time off' ? `${i.id.slice(4)}:pto` : `${i.id}:inbox`; }
const TITLE = { 'Time off': 'Time Off Request', 'Pay change': 'Request Compensation Change', 'Job change': 'Change Job', Timecard: 'Review Time' };

function inbox(ctx) {
  const { q, s } = ctx;
  const h = hr(q), marks = ctx.tasks || {};
  const st = i => marks[inboxKey(i)];
  const word = { done: ['Approved', 'good'], snooze: ['Denied', 'bad'], back: ['Sent back', 'warn'] };
  const kinds = [...new Set(h.inbox.map(i => i.kind))];
  const pool = h.inbox.filter(i => (S.ibox === 'actions' ? !st(i) : st(i)) && (!S.ifilt || i.kind === S.ifilt));
  const sel = pool.find(i => i.id === S.isel) || pool[0];
  const waiting = h.inbox.filter(i => !st(i)).length;
  const decided = h.inbox.length - waiting;

  const list = pool.map(i => `<button class="wd-row${sel && i.id === sel.id ? ' on' : ''}" data-act="hr" data-arg="isel:${esc(i.id)}">
      <b>${esc(TITLE[i.kind] || i.kind)}: ${esc(i.who)}</b>
      <span>${st(i) ? `<span class="tag ${word[st(i)][1]}">${word[st(i)][0]}</span>` : esc(nice(i.what))}</span>
      <i>${i.age ? `${i.age} day${i.age === 1 ? '' : 's'} ago` : 'Today'}</i></button>`).join('')
    || `<p class="wd-empty">${S.ibox === 'actions' ? 'Nothing waiting. Every request is decided.' : 'Nothing decided yet.'}</p>`;

  let detail = '<div class="wd-detail"><p class="wd-empty">Pick a request on the left.</p></div>';
  if (sel) {
    const [k, tag] = inboxKey(sel).split(':');
    const now = sel.steps.findIndex(x => x[2] === null);
    const started = sel.steps[0];
    const tc = sel.kind === 'Timecard';
    const decision = st(sel);
    const hist = sel.steps.map(([step, who, ago], n) => {
      const done = ago !== null;
      const status = done ? 'Completed' : decision && n === now ? word[decision][0] : n === now ? 'Awaiting action' : 'Not started';
      return `<tr><td>${esc(TITLE[sel.kind] || sel.kind)}</td><td>${esc(step)}</td><td><span class="tag ${done || decision === 'done' ? 'good' : n === now ? 'warn' : ''}">${status}</span></td>
        <td>${done ? (ago ? day(addDays(h.asOf, -ago)) : 'Today') : decision && n === now ? 'Today' : ''}</td><td>${esc(who)}</td></tr>`;
    }).join('');
    detail = `<div class="wd-detail">
      <header><h2>${esc(TITLE[sel.kind] || sel.kind)}: ${esc(sel.who)}</h2>
        <p>${decision ? `<span class="tag ${word[decision][1]}">${word[decision][0]}</span>` : `Awaiting your action: <b>${tc ? 'Review' : 'Approval'}</b>`}</p></header>
      <dl class="wd-fields">
        <div><dt>For</dt><dd><button class="lnk" data-click="person:${esc(sel.pid)}">${esc(sel.who)}</button></dd></div>
        <div><dt>Overall process</dt><dd>${esc(TITLE[sel.kind] || sel.kind)}</dd></div>
        <div><dt>Initiated by</dt><dd>${esc(started[1])}</dd></div>
        <div><dt>Initiated on</dt><dd>${dayY(addDays(h.asOf, -(started[2] || 0)))}</dd></div>
        <div><dt>Routed to</dt><dd>${esc(sel.route)}</dd></div>
        <div><dt>Due</dt><dd>${dayY(addDays(h.asOf, Math.max(1, 3 - (sel.age || 0))))}</dd></div>
      </dl>
      <section class="wd-sec"><h4>Details</h4><p>${esc(nice(sel.what))}</p></section>
      <section class="wd-sec"><h4>Process history</h4><div class="scroll"><table class="t wd-hist"><thead><tr><th>Process</th><th>Step</th><th>Status</th><th>Completed on</th><th>Person</th></tr></thead><tbody>${hist}</tbody></table></div></section>
      ${decision ? `<footer class="wd-foot"><button class="btn sm" data-act="task" data-arg="${decision}:${esc(k)}:${tag}">Undo</button></footer>`
        : tc ? `<footer class="wd-foot">${U.btn('Open the timecard', { act: 'go', arg: 'hr-attendance', kind: 'primary', sm: true })}</footer>`
          : `<section class="wd-sec"><h4>Comment</h4><textarea id="wd-comment" rows="2" placeholder="A reason is required to send this back"></textarea></section>
        <footer class="wd-foot">
          <button class="btn primary" data-act="task" data-arg="done:${esc(k)}:${tag}">Approve</button>
          <button class="btn" data-needs-reason disabled data-act="task" data-arg="back:${esc(k)}:${tag}">Send Back</button>
          <button class="btn" data-act="task" data-arg="snooze:${esc(k)}:${tag}">Deny</button>
          <button class="btn ghost" data-act="hr" data-arg="isel:">Cancel</button></footer>`}
    </div>`;
  }

  return U.pageHead({
    eyebrow: 'HR', title: 'Inbox',
    answer: `<b>${waiting}</b> of <b>${h.inbox.length}</b> requests wait on a decision. Each opens with who started it, who has acted and who is next.`,
  }) + `<div class="wd panel">
    <aside class="wd-list">
      <div class="wd-tabs"><button class="${S.ibox === 'actions' ? 'on' : ''}" data-act="hr" data-arg="ibox:actions">Actions <span>${waiting}</span></button>
        <button class="${S.ibox === 'archive' ? 'on' : ''}" data-act="hr" data-arg="ibox:archive">Archive <span>${decided}</span></button></div>
      <div class="wd-filters">${kinds.map(kd => `<button class="hx-chip${S.ifilt === kd ? ' on' : ''}" data-act="hr" data-arg="ifilt:${esc(kd)}">${esc(kd)}</button>`).join('')}</div>
      <div class="wd-items">${list}</div>
    </aside>${detail}</div>` + source(s);
}

/* ------------------------------------------------- Employee record (Rippling) */

const APPS = [['overview', 'Overview'], ['employment', 'Employment'], ['pay', 'Compensation'], ['time', 'Time off'],
  ['benefits', 'Benefits'], ['docs', 'Documents'], ['devices', 'Devices & apps'], ['team', 'Team']];

function person(ctx) {
  const { q, s } = ctx;
  const h = hr(q);
  const r = h.roster.find(x => x.id === ctx.arg) || h.roster[0];
  const rnd = seeded(r.id);
  const pay = payOf(q, r);
  const company = q.data.meta.company || 'Company';
  const domain = company.toLowerCase().replace(/[^a-z]/g, '') || 'company';
  const reports = h.roster.filter(x => x.mgr === r.n);
  const pend = h.timeoff.pending.filter(x => x.id === r.id);
  const outs = h.timeoff.out.filter(x => x.n === r.n);
  const certs = h.compliance.expiring.filter(x => x.n === r.n);
  const onb = h.hiring.onboarding.find(x => x.n === r.n);
  const tab = APPS.some(a => a[0] === S.ptab) ? S.ptab : 'overview';
  const tenureTxt = pay.yrs < 1 ? `${Math.max(1, Math.round(pay.yrs * 12))} months` : `${pay.yrs.toFixed(1)} years`;
  const fields = (title, rows) => `<section class="rp-sec"><h3>${esc(title)}</h3><dl>${rows.map(([k, v]) =>
    `<div><dt>${esc(k)}</dt><dd>${String(v).startsWith('<') ? v : esc(v)}</dd></div>`).join('')}</dl></section>`;

  /* effective-dated history, newest first */
  const hist = [];
  let cur = pay.base;
  const startY = Number(r.s.slice(0, 4)), nowY = Number(h.asOf.slice(0, 4));
  const hr2 = seeded(`${r.id}:hist`);
  for (let y = nowY; y > startY; y--) {
    if (daysBetween(r.s, `${y}-03-01`) < 180) continue;
    const promo = hr2() < 0.12;
    const up = promo ? 0.08 + hr2() * 0.06 : 0.025 + hr2() * 0.025;
    hist.push({ date: `${y}-${String(1 + Math.floor(hr2() * 3)).padStart(2, '0')}-01`, what: promo ? 'Promotion' : 'Merit increase', pay: cur, pct: up * 100 });
    cur = Math.round(cur / (1 + up) / 100) * 100;
  }
  hist.push({ date: r.s, what: 'Hire', pay: cur, pct: null });
  const payShown = v => (pay.hourly ? rate$(Math.round(v / 2080 * 0.9 * 100) / 100) + (noMoney() ? '' : ' / hr') : F.money(v));

  const body = {
    overview: fields('Basic information', [['Preferred name', r.n.split(' ')[0]], ['Work email', `${r.n.toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.')}@${domain}.com`],
      ['Employee ID', r.id], ['Employment status', r.st]]) +
      fields('Role', [['Title', r.t], ['Department', r.d], ['Manager', r.mgr ? `<button class="lnk" data-click="person:${esc(h.roster.find(x => x.n === r.mgr)?.id || '')}">${esc(r.mgr)}</button>` : 'Leadership'],
        ['Work location', r.loc], ['Start date', dayY(r.s)], ['Tenure', tenureTxt]]) +
      fields('Emergency contact', [['Status', rnd() < 0.05 ? '<span class="tag bad">Missing</span>' : 'On file']]),
    employment: fields('Employment', [['Employment type', r.ty], ['FLSA status', pay.hourly ? 'Non-exempt' : 'Exempt'], ['Pay schedule', 'Every other week'],
      ['Start date', dayY(r.s)], ['Probation', pay.yrs < 0.25 ? 'In probation' : 'Complete']]) +
      `<section class="rp-sec"><h3>Job history</h3><div class="scroll"><table class="t"><thead><tr><th>Effective</th><th>Change</th><th>Title</th></tr></thead><tbody>${hist.map(x =>
        `<tr><td>${dayY(x.date)}</td><td>${x.what === 'Promotion' ? '<span class="tag good">Promotion</span>' : esc(x.what)}</td><td>${esc(r.t)}</td></tr>`).join('')}</tbody></table></div></section>`,
    pay: fields('Current compensation', [[pay.hourly ? 'Hourly rate' : 'Annual salary', pay.hourly ? rate$(pay.rate) : F.money(pay.base)],
      ['Pay frequency', 'Every other week'], ['Last change', hist.length > 1 ? dayY(hist[0].date) : 'At hire']]) +
      `<section class="rp-sec"><h3>Compensation history</h3><div class="scroll"><table class="t"><thead><tr><th>Effective</th><th>Reason</th><th class="n">Pay</th><th class="n">Change</th></tr></thead><tbody>${hist.map(x =>
        `<tr><td>${dayY(x.date)}</td><td>${esc(x.what)}</td><td class="n">${payShown(x.pay)}</td><td class="n">${x.pct ? F.pct(x.pct, 1) : '—'}</td></tr>`).join('')}</tbody></table></div></section>`,
    time: fields('Balances', [['Vacation', r.pto ? `${Math.round(r.pto * 0.7)} hours` : 'Not accruing'], ['Sick', r.pto ? `${Math.round(r.pto * 0.3)} hours` : 'Not accruing'], ['Policy', r.ty === 'Full time' ? 'Full time accrual' : 'Not eligible']]) +
      `<section class="rp-sec"><h3>Requests</h3>${[...pend.map(x => `<div class="rp-line"><span>${esc(x.k)}, ${span(x.from, x.to)}</span><span class="tag warn">Waiting</span></div>`),
        ...outs.map(x => `<div class="rp-line"><span>${esc(x.k)}, ${span(x.from, x.to)}</span><span class="tag good">Approved</span></div>`)].join('') || '<p class="rp-none">Nothing booked.</p>'}</section>`,
    benefits: r.ty === 'Full time'
      ? fields('Enrolled plans', [['Medical', rnd() < 0.82 ? (rnd() < 0.5 ? 'Employee + family' : 'Employee only') : 'Waived'], ['Dental', rnd() < 0.74 ? 'Enrolled' : 'Waived'],
        ['Vision', rnd() < 0.6 ? 'Enrolled' : 'Waived'], ['Retirement plan', rnd() < 0.64 ? `${3 + Math.floor(rnd() * 6)}% of pay` : 'Not contributing'], ['Life insurance', '1x salary, company paid']])
      : fields('Benefits', [['Eligibility', 'Not eligible (not full time)']]),
    docs: `<section class="rp-sec"><h3>Documents</h3>${[['Offer letter', r.s, 'Signed'], ['Form I-9', r.s, 'Verified'], ['Form W-4', pay.yrs > 3 ? `${nowY - 4}-01-15` : r.s, pay.yrs > 3 ? 'Update due' : 'On file'],
      ['Handbook acknowledgement', r.s, rnd() < 0.06 ? 'Not signed' : 'Signed'], ['Direct deposit', r.s, 'On file'], ...certs.map(c => [c.c, c.due, daysBetween(h.asOf, c.due) < 0 ? 'Expired' : 'Expiring'])]
      .map(([k, d, st]) => `<div class="rp-line"><span><b>${esc(k)}</b><i>${dayY(d)}</i></span><span class="tag ${/Not|due|Exp/.test(st) ? 'warn' : 'good'}">${esc(st)}</span></div>`).join('')}</section>`,
    devices: (() => {
      const apps = ['people', 'finance', 'ops', 'docs', 'crm', 'comms'].flatMap(c => { try { return s.connectedIn(c); } catch { return []; } }).map(c => c.name);
      const office = r.d !== 'Field';
      return fields('Devices', [['Laptop', office || r.mgr === null ? (rnd() < 0.5 ? 'Dell Latitude 5450' : 'MacBook Air 13') : 'None assigned'],
        ['Phone', !office || r.mgr === null ? 'iPhone 15, company line' : 'None assigned'], ['Asset tag', `IT-${r.id.slice(1)}`]]) +
        `<section class="rp-sec"><h3>App access</h3><div class="rp-apps">${(apps.length ? apps : ['Email and calendar']).map(a => `<span class="hx-chip on">${esc(a)}</span>`).join('')}</div>
        <p class="rp-none">Given at hire and taken back on the last day, from this record.</p></section>`;
    })(),
    team: `<section class="rp-sec"><h3>${reports.length ? `Direct reports (${reports.length})` : 'Team'}</h3>${(reports.length ? reports : h.roster.filter(x => x.mgr === r.mgr && x.id !== r.id).slice(0, 12))
      .map(x => `<button class="rp-line rp-person" data-click="person:${esc(x.id)}"><span>${face(x.n, 28)}<b>${esc(x.n)}</b><i>${esc(x.t)}</i></span><span class="sub">${esc(x.loc)}</span></button>`).join('')
      || '<p class="rp-none">No one else reports here.</p>'}</section>`,
  }[tab];

  return `<div class="rp">
    <aside class="rp-side">
      <div class="rp-id">${face(r.n, 72, 'big')}<h1>${esc(r.n)}</h1><p>${esc(r.t)}</p><p class="sub">${esc(r.d)} · ${esc(r.loc)}</p>
        <span class="tag ${r.st === 'Active' ? 'good' : 'warn'}">${esc(r.st)}</span></div>
      <dl class="rp-facts"><div><dt>Manager</dt><dd>${esc(r.mgr || 'Leadership')}</dd></div><div><dt>Started</dt><dd>${dayY(r.s)}</dd></div>
        <div><dt>Type</dt><dd>${esc(r.ty)}</dd></div>${onb ? `<div><dt>Onboarding</dt><dd>${onb.done} of ${h.hiring.steps.length} steps</dd></div>` : ''}</dl>
      <nav class="rp-apps-nav">${APPS.map(([k, n]) => `<button class="${k === tab ? 'on' : ''}" data-act="hr" data-arg="ptab:${k}">${esc(n)}</button>`).join('')}</nav>
    </aside>
    <main class="rp-main"><header class="rp-head"><h2>${esc(APPS.find(a => a[0] === tab)[1])}</h2>
      <div class="rp-actions"><button class="btn sm" data-act="go" data-arg="hr-inbox">Request a change</button></div></header>${body}</main>
  </div>` + source(s);
}

/* ------------------------------------------------ Timecards (ADP and UKG) */

function cardDays(a, c) {
  const days = [];
  for (let d = a.from; d <= a.to; d = addDays(d, 1)) days.push(d);
  const work = days.filter(d => !['Sat', 'Sun'].includes(wday(d)));
  const rnd = seeded(`${c.id}:days`);
  const per = c.reg / work.length;
  const cells = days.map(d => ({ d, reg: 0, ot: 0, exc: '' }));
  let left = c.reg;
  work.forEach((d, i) => {
    const cell = cells.find(x => x.d === d);
    const v = i === work.length - 1 ? left : Math.round((per + (rnd() - 0.5) * 1.2) * 10) / 10;
    cell.reg = Math.max(0, Math.round(v * 10) / 10); left -= cell.reg;
  });
  let ot = c.ot;
  const otDays = work.filter(() => rnd() < 0.35);
  otDays.forEach((d, i) => { const v = i === otDays.length - 1 ? ot : Math.round(ot / otDays.length * 10) / 10; cells.find(x => x.d === d).ot = v; ot -= v; });
  c.exc.forEach((e, i) => { const d = work[Math.floor(rnd() * work.length)]; const cell = cells.find(x => x.d === d); cell.exc = cell.exc || e; cell.ei = i; });
  return cells;
}

function attendance(ctx) {
  const { q, s } = ctx;
  const h = hr(q), a = h.attendance, marks = ctx.tasks || {};
  const fixed = (c, i) => S.tcfix[`${c.id}|${i}`] || marks[`${c.id}:tcx`] === 'done';
  const cleared = c => c.exc.every((_, i) => fixed(c, i));
  const approved = c => c.approved || marks[`${c.id}:tc`] === 'done';
  const rows = a.cards.map(c => ({ c, cells: cardDays(a, c) }));
  const wk = S.tcwk === 1 ? 1 : 0;
  const shown = rows[0].cells.slice(wk * 7, wk * 7 + 7);
  const open = a.cards.filter(c => !approved(c));
  const blocked = open.filter(c => !cleared(c));
  const ready = open.filter(c => cleared(c));
  const [selId, selDay] = (S.tccell || '').split('|');
  const sel = rows.find(r => r.c.id === selId);
  const cell = sel && sel.cells.find(x => x.d === selDay);
  const next = pts => a.ladder.find(([t]) => pts < t);

  const grid = `<div class="scroll"><table class="tc"><thead><tr><th class="tc-who">Employee</th>${shown.map(x =>
    `<th class="${['Sat', 'Sun'].includes(wday(x.d)) ? 'we' : ''}">${wday(x.d)}<i>${day(x.d)}</i></th>`).join('')}<th>Week</th><th>Period</th><th>Status</th></tr></thead><tbody>${rows.map(({ c, cells }) => {
    const wkCells = cells.slice(wk * 7, wk * 7 + 7);
    const wkTot = wkCells.reduce((x, y) => x + y.reg + y.ot, 0);
    const done = approved(c), ok = cleared(c);
    return `<tr class="${done ? 'muted' : ''}"><td class="tc-who"><button class="lnk" data-click="person:${esc(c.id)}">${esc(c.n)}</button><i>${esc(c.d)}</i></td>${wkCells.map(x => {
      const bad = x.exc && !fixed(c, x.ei);
      const on = S.tccell === `${c.id}|${x.d}`;
      const hrs = x.reg + x.ot;
      return `<td class="tc-cell${bad ? ' bad' : x.exc ? ' fixed' : ''}${x.ot ? ' ot' : ''}${on ? ' on' : ''}${['Sat', 'Sun'].includes(wday(x.d)) ? ' we' : ''}">
        <button data-act="hr" data-arg="tccell:${esc(c.id)}|${x.d}" title="${bad ? esc(x.exc) : ''}">${hrs ? hrs.toFixed(1) : '—'}${bad ? '<b>!</b>' : ''}</button></td>`;
    }).join('')}<td class="n">${wkTot.toFixed(1)}</td><td class="n">${(c.reg + c.ot).toFixed(1)}${c.ot ? `<i class="ot-n">${c.ot.toFixed(1)} OT</i>` : ''}</td>
      <td>${done ? '<span class="tag good">Approved</span>' : ok ? `<button class="btn sm primary" data-act="task" data-arg="done:${esc(c.id)}:tc">Approve</button>`
        : `<span class="tag bad">${c.exc.filter((_, i) => !fixed(c, i)).length} to fix</span>`}</td></tr>`;
  }).join('')}</tbody></table></div>`;

  const punch = cell ? (() => {
    const c = sel.c, rnd = seeded(`${c.id}|${cell.d}`);
    const inM = 6 * 60 + 30 + Math.floor(rnd() * 70);
    const hrsTot = cell.reg + cell.ot;
    const outM = inM + Math.round(hrsTot * 60) + 30;
    const t = m => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${m < 720 ? 'AM' : 'PM'}`;
    const bad = cell.exc && !fixed(c, cell.ei);
    const missOut = /miss/i.test(cell.exc || '');
    return `<div class="tc-punch"><header><b>${esc(c.n)}</b> · ${wday(cell.d)}, ${day(cell.d)}${cell.exc ? ` · <span class="tag ${bad ? 'bad' : 'good'}">${esc(cell.exc)}${bad ? '' : ', fixed'}</span>` : ''}</header>
      ${hrsTot ? `<div class="tc-punches"><div><span>In</span><b>${t(inM)}</b></div><div><span>Meal</span><b>30 min</b></div><div><span>Out</span><b>${bad && missOut ? '<span class="tag bad">Missing</span>' : t(outM)}</b></div>
        <div><span>Regular</span><b>${cell.reg.toFixed(1)}h</b></div><div><span>Overtime</span><b>${cell.ot.toFixed(1)}h</b></div></div>` : '<p class="rp-none">No punches. Not scheduled.</p>'}
      ${bad ? `<button class="btn sm primary" data-act="hr" data-arg="tcfix:${esc(c.id)}|${cell.ei}">${missOut ? 'Add the missing punch' : 'Mark reviewed'}</button>` : ''}</div>`;
  })() : '<div class="tc-punch"><p class="rp-none">Pick a day to see its punches. A red cell is an exception that blocks approval.</p></div>';

  return U.pageHead({
    eyebrow: 'HR', title: 'Timecards',
    answer: `Pay period ${span(a.from, a.to)}: <b>${open.length}</b> timecards to approve, <b>${blocked.length}</b> blocked by exceptions
      and <b>${ready.length}</b> ready.`,
  }) + `<div class="tc-bar">
      <div class="hx-seg"><button class="${wk === 0 ? 'on' : ''}" data-act="hr" data-arg="tcwk:0">Week of ${day(a.from)}</button><button class="${wk === 1 ? 'on' : ''}" data-act="hr" data-arg="tcwk:1">Week of ${day(addDays(a.from, 7))}</button></div>
      <span class="tc-key"><i class="k bad"></i>Exception <i class="k ot"></i>Overtime <i class="k fixed"></i>Fixed</span>
    </div><div class="grid">` +
    U.panel({ col: 12, ico: 'clock', title: 'Team timecard', pad: false, body: grid + punch,
      note: 'A card can be approved only once every exception on it is fixed, so a bad punch never reaches payroll.' }) +
    U.panel({
      col: 6, ico: 'flag', title: 'Attendance points',
      note: `Trailing 30 days. ${a.ladder.map(([t, w]) => `${t} is a ${w.toLowerCase()}`).join(', ')}.`,
      body: C.hbars({ rows: a.cards.slice().sort((x, y) => y.pts - x.pts).slice(0, 8).map(c => ({ name: c.n, value: c.pts })), fmt: v => `${v} pts`, max: a.ladder[a.ladder.length - 1][0] }),
      foot: (() => { const near = a.cards.filter(c => { const n = next(c.pts); return n && n[0] - c.pts <= 4; }); return near.length ? `Close to a warning: ${near.slice(0, 4).map(c => esc(c.n)).join(', ')}${near.length > 4 ? ` and ${near.length - 4} more` : ''}.` : 'Nobody is close to a warning.'; })(),
    }) +
    U.panel({ col: 6, ico: 'bars', title: 'Overtime this period', note: 'Steady overtime on one person is a staffing gap.',
      body: C.hbars({ rows: a.cards.filter(c => c.ot).sort((x, y) => y.ot - x.ot).slice(0, 8).map(c => ({ name: c.n, value: c.ot })), fmt: v => `${v.toFixed(1)}h` }) }) +
    `</div>` + source(s);
}

/* ------------------------------------------------------ Run payroll (Gusto) */

function payroll(ctx) {
  const { q, s } = ctx;
  const h = hr(q), pr = h.payroll, a = h.attendance, marks = ctx.tasks || {};
  const seen = v => marks[`${v.id}:var`];
  const flags = pr.variances.filter(v => !seen(v));
  const crew = a.cards.map(c => ({ c, r: h.roster.find(x => x.id === c.id) })).filter(x => x.r).map(x => ({ ...x, pay: payOf(q, x.r) }));
  const hourly = crew.filter(x => x.pay.hourly);
  const salaried = h.roster.length - crew.length;
  const hrsOf = (id, kind, dflt) => (S.hours[`${id}|${kind}`] ?? dflt);
  const delta = hourly.reduce((t, x) => t + (hrsOf(x.c.id, 'reg', x.c.reg) - x.c.reg) * x.pay.rate + (hrsOf(x.c.id, 'ot', x.c.ot) - x.c.ot) * x.pay.rate * 1.5, 0);
  const k = (pr.gross + delta) / pr.gross;
  const T = { gross: pr.gross + delta, taxesEe: pr.taxesEe * k, deductions: pr.deductions * k, net: pr.net * k, taxesEr: pr.taxesEr * k };
  T.debit = T.net + T.taxesEe + T.taxesEr + T.deductions;
  const left = daysBetween(h.asOf, pr.runBy);
  const step = S.psubmitted ? 4 : S.pstep;
  const pto = h.timeoff.out.filter(o => o.from <= a.to && o.to >= a.from);
  const stepper = `<ol class="gs-steps">${['Hours and earnings', 'Time off', 'Review and submit'].map((t, i) =>
    `<li class="${step > i + 1 ? 'done' : step === i + 1 ? 'now' : ''}"><button ${S.psubmitted ? 'disabled' : `data-act="hr" data-arg="pstep:${i + 1}"`}><span>${step > i + 1 ? '✓' : i + 1}</span>${t}</button></li>`).join('')}</ol>`;
  const head = `<div class="gs-head"><div><span class="page-eyebrow">Regular payroll</span><h1 class="page-title">Run payroll</h1>
      <p>Pay period ${span(a.from, a.to)} · Pay day ${wday(pr.payday)}, ${day(pr.payday)}</p></div>
      <div class="gs-due ${left <= 1 ? 'late' : ''}"><b>Run by ${wday(pr.runBy)}, ${day(pr.runBy)}</b><span>to pay your team on time</span></div></div>`;

  let body = '';
  if (step === 1) {
    body = `<section class="panel gs-card"><header><h3>Hours and additional earnings</h3><p>Everyone on a timecard this period. Change an hourly person's hours and the totals follow.</p></header>
      <div class="scroll"><table class="t gs-t"><thead><tr><th>Employee</th><th class="n">Regular hours</th><th class="n">Overtime hours</th><th class="n">Rate</th><th class="n">Gross pay</th></tr></thead><tbody>${crew.map(x => {
        if (!x.pay.hourly) {
          return `<tr><td><button class="lnk" data-click="person:${esc(x.c.id)}">${esc(x.c.n)}</button><i class="sub"> ${esc(x.r.t)}</i></td>
            <td class="n" colspan="2"><span class="tag">Salaried, ${x.c.reg.toFixed(1)}h on the timecard</span></td><td class="n">${F.money(x.pay.base)} / yr</td><td class="n">${F.money(x.pay.base / 26)}</td></tr>`;
        }
        const reg = hrsOf(x.c.id, 'reg', x.c.reg), ot = hrsOf(x.c.id, 'ot', x.c.ot);
        return `<tr><td><button class="lnk" data-click="person:${esc(x.c.id)}">${esc(x.c.n)}</button><i class="sub"> ${esc(x.r.t)}</i></td>
          <td class="n"><input class="gs-in" type="number" step="0.1" min="0" data-hours="${esc(x.c.id)}|reg" value="${reg}" aria-label="Regular hours for ${esc(x.c.n)}"></td>
          <td class="n"><input class="gs-in" type="number" step="0.1" min="0" data-hours="${esc(x.c.id)}|ot" value="${ot}" aria-label="Overtime hours for ${esc(x.c.n)}"></td>
          <td class="n">${rate$(x.pay.rate)}</td><td class="n">${F.money(reg * x.pay.rate + ot * x.pay.rate * 1.5)}</td></tr>`;
      }).join('')}</tbody></table></div>
      <p class="gs-note">${F.num(salaried)} more people are paid their regular salary and need nothing here.</p></section>`;
  } else if (step === 2) {
    body = `<section class="panel gs-card"><header><h3>Time off</h3><p>Approved time off that falls in this pay period, paid from each person's balance.</p></header>
      ${pto.length ? `<div class="scroll"><table class="t"><thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th class="n">Hours</th></tr></thead><tbody>${pto.map(o => {
        const d = Math.min(daysBetween(o.from, o.to) + 1, 10);
        return `<tr><td>${esc(o.n)}</td><td>${esc(o.k)}</td><td>${span(o.from, o.to)}</td><td class="n">${d * 8}</td></tr>`;
      }).join('')}</tbody></table></div>` : '<p class="rp-none">No time off in this period.</p>'}</section>`;
  } else if (step === 3) {
    body = `<div class="gs-review">
      <section class="panel gs-card gs-total"><span>Total payroll</span><b>${F.money(T.debit)}</b>
        <p>Debited ${wday(pr.runBy)}, ${day(pr.runBy)} · Employees paid ${wday(pr.payday)}, ${day(pr.payday)}</p>
        <dl>${[['Employee net pay', T.net], ['Employee taxes withheld', T.taxesEe], ['Employer taxes', T.taxesEr], ['Benefits and deductions', T.deductions]]
          .map(([kk, v]) => `<div><dt>${esc(kk)}</dt><dd>${F.money(v)}</dd></div>`).join('')}</dl></section>
      <section class="panel gs-card"><header><h3>Paychecks that changed</h3><p>More than 5% off the last run. Review each one before you submit.</p></header>
        ${pr.variances.map(v => {
          const st = seen(v), pct = (v.now - v.last) / v.last * 100;
          return `<div class="gs-flag${st ? ' seen' : ''}"><div><b>${esc(v.n)}</b><span class="tag ${pct < 0 ? 'warn' : ''}">${esc(v.why)}</span></div>
            <div class="gs-amt">${F.money(v.last)} → ${F.money(v.now)} <i class="delta ${pct > 0 ? 'up' : 'down'}">${pct > 0 ? '+' : ''}${pct.toFixed(0)}%</i></div>
            <div>${st ? `<span class="tag ${st === 'done' ? 'good' : ''}">${st === 'done' ? 'Looks right' : 'Dismissed'}</span>`
              : `<button class="btn sm" data-act="task" data-arg="done:${esc(v.id)}:var">Looks right</button>`}</div></div>`;
        }).join('')}</section></div>`;
  } else {
    body = `<section class="panel gs-card gs-done"><span class="gs-check">✓</span><h3>Payroll submitted</h3>
      <p><b>${F.money(T.debit)}</b> will be debited on ${wday(pr.runBy)}, ${day(pr.runBy)}, and ${F.num(pr.people)} people will be paid on ${wday(pr.payday)}, ${day(pr.payday)}.</p>
      <p class="sub">The payroll provider files the taxes and moves the money. This screen approves the run and keeps the receipt.</p>
      <button class="btn sm" data-act="hr" data-arg="preset">Start over</button></section>`;
  }

  const foot = step === 4 ? '' : `<div class="gs-foot">
    ${step > 1 ? `<button class="btn" data-act="hr" data-arg="pstep:${step - 1}">Back</button>` : '<span></span>'}
    <span class="gs-run">Total so far <b>${F.money(T.debit)}</b></span>
    ${step < 3 ? `<button class="btn primary" data-act="hr" data-arg="pstep:${step + 1}">Save and continue</button>`
      : flags.length ? `<button class="btn primary" disabled>Submit payroll</button><span class="gs-why">Review ${flags.length} changed paycheck${flags.length === 1 ? '' : 's'} first</span>`
        : `<button class="btn primary" data-act="hr" data-arg="psubmit">Submit payroll</button>`}</div>`;
  return `<div class="gs">${head}${stepper}${body}${foot}</div>` + source(s);
}

/* --------------------------------------------------------- Org chart (Workday) */

function org(ctx) {
  const { q, s } = ctx;
  const h = hr(q);
  const leads = h.roster.filter(r => !r.mgr);
  const moved = Object.fromEntries(Object.entries(S.omoves).filter(([id]) => h.roster.some(r => r.id === id)));
  const mgrOf = r => moved[r.id] || r.mgr;
  const team = lead => h.roster.filter(r => r.mgr && mgrOf(r) === lead.n);
  const before = lead => h.roster.filter(r => r.mgr === lead.n);
  const cost = list => list.reduce((t, r) => t + payOf(q, r).base * 1.28, 0);
  const open = leads.find(l => l.d === S.odept) || null;
  const moves = Object.entries(moved).map(([id, to]) => ({ r: h.roster.find(x => x.id === id), to }));
  const company = q.data.meta.company || 'Company';
  const ceo = 'Leadership team';

  const leadCard = l => {
    const n = team(l).length, b = before(l).length;
    const target = S.oplan && S.omoving && mgrOf(h.roster.find(r => r.id === S.omoving)) !== l.n;
    return `<div class="oc-node${open && open.n === l.n ? ' on' : ''}${target ? ' target' : ''}" data-drop="org|${esc(l.n)}">
      <button class="oc-open" data-act="hr" data-arg="odept:${esc(l.d)}">${face(l.n, 40)}<b>${esc(l.n)}</b><span>${esc(l.t)}</span>
      <i>${esc(l.d)} · ${n} report${n === 1 ? '' : 's'}${n !== b ? ` <em class="delta ${n > b ? 'up' : 'down'}">${n > b ? '+' : ''}${n - b}</em>` : ''}</i></button>
      ${target ? `<button class="btn sm primary" data-act="hr" data-arg="oto:${esc(l.n)}">Move here</button>` : ''}</div>`;
  };
  const members = open ? team(open) : [];
  const scenario = moves.length ? `<section class="oc-scn"><header><h3>Scenario</h3><p>${moves.length} move${moves.length === 1 ? '' : 's'}, not yet sent. Nothing changes until it is approved.</p></header>
      ${moves.map(m => `<div class="oc-mv"><span><b>${esc(m.r.n)}</b> from ${esc(m.r.mgr)} to ${esc(m.to)}</span><button class="btn sm ghost" data-act="hr" data-arg="oundo:${esc(m.r.id)}">Undo</button></div>`).join('')}
      <div class="scroll"><table class="t"><thead><tr><th>Team</th><th class="n">Headcount</th><th class="n">Span</th><th class="n">Cost a year</th></tr></thead><tbody>${leads.filter(l => team(l).length !== before(l).length).map(l => {
        const b = before(l), a = team(l), dc = cost(a) - cost(b);
        return `<tr><td>${esc(l.d)}</td><td class="n">${b.length} → <b>${a.length}</b></td><td class="n">${b.length} → ${a.length}</td><td class="n"><span class="delta ${dc > 0 ? 'up' : 'down'}">${dc > 0 ? '+' : ''}${F.money(dc)}</span></td></tr>`;
      }).join('')}</tbody></table></div>
      <div class="oc-btns">${S.osent ? '<span class="tag good">Sent to the inbox as job changes</span>' : '<button class="btn sm primary" data-act="hr" data-arg="osend">Send for approval</button>'}
        <button class="btn sm ghost" data-act="hr" data-arg="oreset">Discard</button></div></section>` : '';

  return U.pageHead({
    eyebrow: 'HR', title: 'Org chart',
    answer: `${esc(company)} runs as <b>${leads.length}</b> teams under the leadership team, <b>${F.num(h.roster.length)}</b> people in all.
      Open a team to see who is in it. Plan a change to try moves before anyone is told.`,
  }) + `<div class="oc-bar"><button class="btn sm ${S.oplan ? 'primary' : ''}" data-act="hr" data-arg="oplan">${S.oplan ? 'Planning a change' : 'Plan a change'}</button>
      ${S.oplan ? `<span class="sub">${S.omoving ? 'Now pick the team to move them to, or drag them onto it.' : 'Pick Move on anyone below, or drag them onto another team.'}</span>` : ''}</div>
    <div class="oc panel">
      <div class="oc-root"><div class="oc-node top">${face(company, 44)}<b>${esc(ceo)}</b><span>${esc(company)}</span></div></div>
      <div class="oc-row">${leads.map(leadCard).join('')}</div>
      ${open ? `<section class="oc-team"><header><h3>${esc(open.d)}</h3><p>${members.length} people report to ${esc(open.n)}</p></header>
        <div class="oc-grid">${members.map(m => `<div class="oc-person${S.omoving === m.id ? ' moving' : ''}${moved[m.id] ? ' moved' : ''}" ${S.oplan ? `draggable="true" data-drag="org|${esc(m.id)}"` : ''}>
          <button class="oc-p" data-click="person:${esc(m.id)}">${face(m.n, 30)}<span><b>${esc(m.n)}</b><i>${esc(m.t)}</i></span></button>
          ${S.oplan ? `<button class="btn sm ${S.omoving === m.id ? 'primary' : 'ghost'}" data-act="hr" data-arg="omove:${esc(m.id)}">${S.omoving === m.id ? 'Moving' : 'Move'}</button>` : ''}</div>`).join('')}</div></section>`
        : '<p class="oc-hint">Open a team above to see its people.</p>'}
    </div>${scenario}` + source(s);
}

/* ------------------------------------------------- Talent review (Workday nine-box) */

const BOX = [ // index = potential(0 low..2 high) * 3 + performance(0 low..2 high)
  'Underperformer', 'Effective', 'Trusted professional',
  'Dilemma', 'Core contributor', 'High performer',
  'Enigma', 'Growth talent', 'Future leader',
];

function talent(ctx) {
  const { q, s } = ctx;
  const h = hr(q);
  const depts = [...new Set(h.roster.map(r => r.d))];
  const dept = depts.includes(S.tdept) ? S.tdept : depts[0];
  const people = h.roster.filter(r => r.d === dept && r.st === 'Active');
  const home = r => { const rnd = seeded(`${r.id}:nb`); const perf = Math.min(2, Math.floor(rnd() * 2.6 + 0.3)); const pot = Math.min(2, Math.floor(rnd() * 2.4 + (payOf(q, r).yrs < 3 ? 0.5 : 0.1))); return pot * 3 + perf; };
  const at = r => (S.tplace[r.id] ?? home(r));
  const sel = people.find(r => r.id === S.tsel);
  const movedN = people.filter(r => S.tplace[r.id] !== undefined && S.tplace[r.id] !== home(r)).length;
  const order = [6, 7, 8, 3, 4, 5, 0, 1, 2];
  const cells = order.map(i => {
    const inBox = people.filter(r => at(r) === i);
    const tone = i === 8 || i === 7 || i === 5 ? 'hi' : i === 0 || i === 3 ? 'lo' : '';
    return `<div class="nb-box ${tone}${sel ? ' can' : ''}" data-drop="nb|${i}" ${sel ? `data-act="hr" data-arg="tbox:${i}"` : ''}>
      <header><b>${BOX[i]}</b><span>${inBox.length}</span></header>
      <div class="nb-chips">${inBox.map(r => `<button class="nb-chip${sel && sel.id === r.id ? ' on' : ''}${S.tplace[r.id] !== undefined && S.tplace[r.id] !== home(r) ? ' moved' : ''}" draggable="true" data-drag="nb|${esc(r.id)}" data-act="hr" data-arg="tsel:${esc(r.id)}" title="${esc(r.n)}">${face(r.n, 22)}<span>${esc(r.n.split(' ')[0])} ${esc(r.n.split(' ')[1]?.[0] || '')}.</span></button>`).join('')}</div></div>`;
  }).join('');

  const card = sel ? (() => {
    const p = payOf(q, sel), rnd = seeded(`${sel.id}:tc`);
    const i = at(sel), was = home(sel);
    const risk = rnd() < 0.2 ? ['High', 'bad'] : rnd() < 0.5 ? ['Medium', 'warn'] : ['Low', 'good'];
    return `<aside class="nb-card panel">${face(sel.n, 56, 'big')}<h3>${esc(sel.n)}</h3><p>${esc(sel.t)}</p>
      <dl><div><dt>Box</dt><dd>${BOX[i]}</dd></div><div><dt>Performance</dt><dd>${['Low', 'Medium', 'High'][i % 3]}</dd></div><div><dt>Potential</dt><dd>${['Low', 'Medium', 'High'][Math.floor(i / 3)]}</dd></div>
        <div><dt>Flight risk</dt><dd><span class="tag ${risk[1]}">${risk[0]}</span></dd></div><div><dt>Tenure</dt><dd>${p.yrs.toFixed(1)} years</dd></div><div><dt>Manager</dt><dd>${esc(sel.mgr || 'Leadership')}</dd></div></dl>
      ${i !== was ? `<p class="nb-moved">Moved in this session from ${BOX[was]}.</p>` : '<p class="sub">Pick a box, or drag the chip, to move them.</p>'}
      <button class="btn sm" data-click="person:${esc(sel.id)}">Open the full record</button></aside>`;
  })() : `<aside class="nb-card panel empty"><p>Pick someone in the grid to see their talent card, then pick a box to move them.</p></aside>`;

  return U.pageHead({
    eyebrow: 'HR', title: 'Talent review',
    answer: `Calibrating <b>${esc(dept)}</b>: <b>${people.length}</b> people placed by performance and potential${movedN ? `, <b>${movedN}</b> moved in this session` : ''}.
      Leaders move people between boxes until they agree, then the placements feed succession and pay.`,
  }) + `<div class="nb-bar">${depts.map(d => `<button class="hx-chip${d === dept ? ' on' : ''}" data-act="hr" data-arg="tdept:${esc(d)}">${esc(d)}</button>`).join('')}
      ${movedN ? '<button class="btn sm ghost" data-act="hr" data-arg="treset">Reset moves</button>' : ''}</div>
    <div class="nb"><div class="nb-wrap"><span class="nb-y">Potential</span><div class="nb-grid">${cells}</div><span class="nb-x">Performance</span></div>${card}</div>` + source(s);
}

/* ------------------------------------------------------- Onboarding (Gusto) */

const ONB = [ // [step, who completes it, section]
  ['Offer signed', 'Employee', 'Before day one'], ['Personal details', 'Employee', 'Before day one'], ['Tax forms', 'Employee', 'Before day one'],
  ['Direct deposit', 'Employee', 'Before day one'], ['I-9 and E-Verify', 'Admin', 'Before day one'], ['Handbook acknowledged', 'Employee', 'First week'],
  ['Benefits enrollment', 'Employee', 'First week'], ['Equipment and accounts', 'Admin', 'Before day one'], ['Training assigned', 'Admin', 'First week'],
];

function onboarding(ctx) {
  const { q, s } = ctx;
  const h = hr(q);
  const hires = h.hiring.onboarding;
  const company = q.data.meta.company || 'the company';
  if (!hires.length) return U.pageHead({ eyebrow: 'HR', title: 'Onboarding', answer: 'Nobody is onboarding right now.' }) + source(s);
  const sel = hires.find(x => x.n === S.onsel) || hires[0];
  const isDone = (n, i) => (S.ondone[`${n.n}|${i}`] !== undefined ? S.ondone[`${n.n}|${i}`] : i < n.done);
  const doneN = n => ONB.filter((_, i) => isDone(n, i)).length;
  const r = h.roster.find(x => x.n === sel.n);
  const rnd = seeded(`${sel.n}:gtky`);
  const mgr = h.roster.find(x => !x.mgr && x.d === sel.d);
  const until = daysBetween(h.asOf, sel.s);

  const list = hires.map(n => `<button class="ob-hire${n.n === sel.n ? ' on' : ''}" data-act="hr" data-arg="onsel:${esc(n.n)}">${face(n.n, 34)}
    <span><b>${esc(n.n)}</b><i>${esc(n.t)} · starts ${day(n.s)}</i><span class="meter"><i style="width:${(doneN(n) / ONB.length * 100).toFixed(0)}%"></i></span></span>
    <em>${doneN(n)}/${ONB.length}</em></button>`).join('');

  const sections = [...new Set(ONB.map(x => x[2]))];
  const admin = sections.map(sec => `<section class="ob-sec"><h4>${sec}</h4>${ONB.map((x, i) => [x, i]).filter(([x]) => x[2] === sec).map(([x, i]) => {
    const d = isDone(sel, i);
    return `<button class="ob-item${d ? ' done' : ''}" data-act="hr" data-arg="ontog:${esc(sel.n)}|${i}"><span class="ob-box">${d ? '✓' : ''}</span>
      <span><b>${esc(x[0])}</b><i>${x[1] === 'Employee' ? `${esc(sel.n.split(' ')[0])} completes` : 'You complete'}</i></span><span class="tag ${d ? 'good' : ''}">${d ? 'Done' : 'To do'}</span></button>`;
  }).join('')}</section>`).join('');

  const mine = ONB.map((x, i) => [x, i]).filter(([x]) => x[1] === 'Employee');
  const employee = `<div class="ob-emp"><div class="ob-welcome"><h3>Welcome to ${esc(company)}, ${esc(sel.n.split(' ')[0])}!</h3>
      <p>We're glad you're here. Finish these before ${wday(sel.s)}, ${day(sel.s)} and your first day will be about the work, not the paperwork.</p></div>
    <div class="ob-cols"><section class="ob-sec"><h4>Your to-do list</h4>${mine.map(([x, i]) => `<div class="ob-item${isDone(sel, i) ? ' done' : ''}"><span class="ob-box">${isDone(sel, i) ? '✓' : ''}</span><span><b>${esc(x[0])}</b></span>
      ${isDone(sel, i) ? '<span class="tag good">Done</span>' : '<span class="btn sm primary">Start</span>'}</div>`).join('')}</section>
    <section class="ob-sec"><h4>Your first day</h4><dl class="ob-dl"><div><dt>When</dt><dd>${wday(sel.s)}, ${day(sel.s)} at 8:00 AM</dd></div><div><dt>Where</dt><dd>${esc(r ? r.loc : 'Head office')}</dd></div>
      <div><dt>Your manager</dt><dd>${esc(mgr ? mgr.n : 'Your team lead')}</dd></div><div><dt>Bring</dt><dd>Two forms of ID for the I-9</dd></div></dl>
      <h4>Get to know you</h4><dl class="ob-dl"><div><dt>Hometown</dt><dd>${['Greenville', 'Charlotte', 'Asheville', 'Columbia', 'Knoxville', 'Atlanta'][Math.floor(rnd() * 6)]}</dd></div>
      <div><dt>Outside work</dt><dd>${['Fishing and the lake', 'Coaching youth soccer', 'Woodworking', 'Trail running', 'Cooking for a crowd', 'Restoring an old truck'][Math.floor(rnd() * 6)]}</dd></div>
      <div><dt>Ask me about</dt><dd>${['My last big project', 'The best barbecue in town', 'Learning a second language', 'My dog, Biscuit'][Math.floor(rnd() * 4)]}</dd></div></dl></section></div></div>`;

  return U.pageHead({
    eyebrow: 'HR', title: 'Onboarding',
    answer: `<b>${hires.length}</b> ${hires.length === 1 ? 'person is' : 'people are'} onboarding. ${esc(sel.n)} ${until > 1 ? `starts in ${until} days` : until === 1 ? 'starts tomorrow' : until === 0 ? 'starts today' : until === -1 ? 'started yesterday' : `started ${-until} days ago`} with
      <b>${doneN(sel)}</b> of ${ONB.length} steps done.`,
  }) + `<div class="ob"><aside class="ob-list"><h4>New hires</h4>${list}</aside>
    <main class="ob-main panel"><header class="ob-head"><div>${face(sel.n, 48)}<div><h2>${esc(sel.n)}</h2><p>${esc(sel.t)} · ${esc(sel.d)} · starts ${wday(sel.s)}, ${day(sel.s)}</p></div></div>
      <div class="hx-seg"><button class="${S.onview !== 'employee' ? 'on' : ''}" data-act="hr" data-arg="onview:admin">Your checklist</button><button class="${S.onview === 'employee' ? 'on' : ''}" data-act="hr" data-arg="onview:employee">What ${esc(sel.n.split(' ')[0])} sees</button></div></header>
      <div class="meter big"><i style="width:${(doneN(sel) / ONB.length * 100).toFixed(0)}%"></i></div>
      ${S.onview === 'employee' ? employee : admin}</main></div>` + source(s);
}

/* -------------------------------------------------------- Reports (Rippling) */

function reports(ctx) {
  const { q, s } = ctx;
  const h = hr(q);
  const FIELDS = [
    ['Employee', [['n', 'Name'], ['id', 'Employee ID'], ['st', 'Status']]],
    ['Job', [['d', 'Department'], ['t', 'Title'], ['mgr', 'Manager'], ['loc', 'Location']]],
    ['Employment', [['ty', 'Employment type'], ['s', 'Start date'], ['ten', 'Tenure (years)']]],
    ['Pay and time', [['pay', 'Annual pay'], ['pto', 'Time off banked']]],
  ];
  const name = Object.fromEntries(FIELDS.flatMap(([, f]) => f));
  const val = (r, f) => f === 'ten' ? daysBetween(r.s, h.asOf) / 365 : f === 'pay' ? (payOf(q, r).hourly ? payOf(q, r).rate * 2080 : payOf(q, r).base) : f === 'mgr' ? (r.mgr || 'Leadership') : r[f];
  const show = (f, v) => f === 'ten' ? v.toFixed(1) : f === 'pay' ? F.money(v) : f === 's' ? `<span style="white-space:nowrap">${dayY(v)}</span>` : f === 'pto' ? `${v} hrs` : esc(String(v));
  const depts = [...new Set(h.roster.map(r => r.d))];
  const rows = h.roster.filter(r => !S.rfilt || r.d === S.rfilt);
  const cols = S.rf.filter(f => name[f]);
  const groupable = ['d', 'ty', 'loc', 'st', 'mgr'];
  const g = groupable.includes(S.rg) ? S.rg : '';
  let preview;
  if (g) {
    const groups = {};
    for (const r of rows) { const key = val(r, g); (groups[key] = groups[key] || []).push(r); }
    const list = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    preview = S.rview === 'chart'
      ? C.hbars({ rows: list.slice(0, 12).map(([k, v]) => ({ name: k, value: v.length })), fmt: v => `${v} people` })
      : `<div class="scroll"><table class="t"><thead><tr><th>${esc(name[g])}</th><th class="n">People</th><th class="n">Average tenure</th><th class="n">Total annual pay</th></tr></thead><tbody>${list.map(([k, v]) =>
        `<tr><td>${esc(k)}</td><td class="n">${v.length}</td><td class="n">${(v.reduce((t, r) => t + val(r, 'ten'), 0) / v.length).toFixed(1)}</td><td class="n">${F.money(v.reduce((t, r) => t + val(r, 'pay'), 0))}</td></tr>`).join('')}</tbody></table></div>`;
  } else {
    preview = `<div class="scroll" style="max-height:520px"><table class="t"><thead><tr>${cols.map(f => `<th class="${['ten', 'pay', 'pto'].includes(f) ? 'n' : ''}">${esc(name[f])}</th>`).join('')}</tr></thead><tbody>${rows.slice(0, 40).map(r =>
      `<tr data-click="person:${esc(r.id)}">${cols.map(f => `<td class="${['ten', 'pay', 'pto'].includes(f) ? 'n' : ''}">${show(f, val(r, f))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      ${rows.length > 40 ? `<p class="gs-note">Showing 40 of ${rows.length} rows. The export carries all of them.</p>` : ''}`;
  }

  return U.pageHead({
    eyebrow: 'HR', title: 'Reports',
    answer: `Build a report from any field on the employee record. <b>${rows.length}</b> people match${S.rfilt ? ` in ${esc(S.rfilt)}` : ''}, and pay columns show only for levels allowed to see pay.`,
  }) + `<div class="rb"><aside class="rb-fields"><h4>Fields</h4>${FIELDS.map(([cat, fs]) => `<section><h5>${esc(cat)}</h5>${fs.map(([k, n]) =>
      `<label class="rb-f"><input type="checkbox" data-act="hr" data-arg="rf:${k}" ${S.rf.includes(k) ? 'checked' : ''}><span>${esc(n)}</span></label>`).join('')}</section>`).join('')}</aside>
    <main class="rb-main panel"><div class="rb-bar">
      <div class="rb-row"><span class="rb-lab">Columns</span>${cols.map(f => `<button class="hx-chip on" data-act="hr" data-arg="rf:${f}">${esc(name[f])} ×</button>`).join('') || '<span class="sub">Pick fields on the left</span>'}</div>
      <div class="rb-row"><span class="rb-lab">Group by</span>${groupable.map(f => `<button class="hx-chip${g === f ? ' on' : ''}" data-act="hr" data-arg="rg:${f}">${esc(name[f])}</button>`).join('')}</div>
      <div class="rb-row"><span class="rb-lab">Filter</span>${depts.map(d => `<button class="hx-chip${S.rfilt === d ? ' on' : ''}" data-act="hr" data-arg="rfilt:${esc(d)}">${esc(d)}</button>`).join('')}</div>
      ${g ? `<div class="rb-row"><span class="rb-lab">Show as</span><div class="hx-seg"><button class="${S.rview !== 'chart' ? 'on' : ''}" data-act="hr" data-arg="rview:table">Table</button><button class="${S.rview === 'chart' ? 'on' : ''}" data-act="hr" data-arg="rview:chart">Chart</button></div></div>` : ''}
    </div><section class="rb-prev">${preview}</section></main></div>` + source(s);
}

export const mashPages = {
  'hr-home': home, 'hr-inbox': inbox, 'hr-person': person, 'hr-attendance': attendance, 'hr-payroll': payroll,
  'hr-org': org, 'hr-talent': talent, 'hr-onboarding': onboarding, 'hr-reports': reports,
};
