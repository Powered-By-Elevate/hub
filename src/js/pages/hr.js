/* The HR tab (Matt, 2026-11-04: "i want to build a paycor dupe but one that makes more sense
   for our build in the demo ... the standard HR and then HR tracking and visuals").

   Paycor's core modules at a smaller scale, read from one roster so every page agrees with
   People & labor: the directory, time off, hiring and onboarding, compliance and training,
   reviews and benefits. Payroll itself stays with the payroll provider: tax filing and moving
   money are what a company buys, and this tab reads them rather than replacing them. The
   teardown that shaped it is os-vault/wiki/research/paycor-teardown.md. */
import * as F from '../fmt.js';
import * as C from '../chart.js';
import * as U from '../ui.js';
import { esc } from '../icons.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = iso => { const [, m, d] = iso.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const span = (a, b) => (a === b ? day(a) : `${day(a)} to ${day(b)}`);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const hr = q => q.data.people.hr;
const tenure = (h, r) => daysBetween(r.s, h.asOf) / 365;

function source(s) {
  const on = s.connectedIn('people');
  return U.panel({
    col: 12, title: 'Where this comes from',
    body: `<div class="empty">${on.length
      ? `Employee records arrive from ${esc(on.map(c => c.name).join(', '))}. Requests and approvals made here go back to it, so the payroll system stays the record.`
      : 'Employee records arrive from the payroll or HR system. Until one is connected these are the sample set.'}</div>`,
  });
}

/* ---------------------------------------------------------------- directory */

function directory(ctx) {
  const { q, s } = ctx;
  const h = hr(q), all = h.roster;
  const depts = q.data.people.departments.map(d => d.name);
  const pick = (ctx.subtab || '').startsWith('dir:') ? ctx.subtab.slice(4) : '';
  const rows = pick ? all.filter(r => r.d === pick) : all;
  const ft = all.filter(r => r.ty === 'Full time').length;
  const pt = all.filter(r => r.ty === 'Part time').length;
  const seasonal = all.length - ft - pt;
  const avgTen = all.reduce((a, r) => a + tenure(h, r), 0) / all.length;
  const newQ = all.filter(r => daysBetween(r.s, h.asOf) <= 90).length;
  const leave = all.filter(r => r.st === 'On leave').length;
  const bands = [['Under 1 year', 0, 1], ['1 to 3 years', 1, 3], ['3 to 5 years', 3, 5], ['5 to 10 years', 5, 10], ['10 years or more', 10, 99]];

  return U.pageHead({
    eyebrow: 'HR', title: 'Directory',
    answer: `<b>${F.num(all.length)}</b> people across <b>${depts.length}</b> departments,
      <b>${F.num(ft)}</b> of them full time. The average tenure is <b>${avgTen.toFixed(1)}</b> years,
      and <b>${F.num(newQ)}</b> joined in the last 90 days.`,
  }) + U.strip([
    { label: 'People', value: F.num(all.length), note: `${leave} on leave` },
    { label: 'Full time', value: F.num(ft), note: F.pct(ft / all.length * 100, 0) + ' of the team' },
    { label: 'Part time and seasonal', value: F.num(pt + seasonal), note: `${pt} part time, ${seasonal} seasonal` },
    { label: 'Average tenure', value: `${avgTen.toFixed(1)} yrs`, note: 'from start date' },
    { label: 'New in 90 days', value: F.num(newQ), note: 'still onboarding or just finished' },
  ]) + `<div class="grid">` +
    U.panel({
      col: 6, ico: 'people', title: 'Who works where',
      note: 'Each department split by how people are employed.',
      body: C.hbars({
        rows: depts.map(d => {
          const mine = all.filter(r => r.d === d);
          const f = mine.filter(r => r.ty === 'Full time').length;
          return { name: d, value: mine.length, note: `${f} full time, ${mine.length - f} other` };
        }).sort((a, b) => b.value - a.value), fmt: v => F.num(v),
      }),
    }) +
    U.panel({
      col: 6, ico: 'clock', title: 'How long people stay',
      note: 'Everyone on the team by years since their start date.',
      body: C.bars({
        values: bands.map(([, lo, hi]) => all.filter(r => tenure(h, r) >= lo && tenure(h, r) < hi).length),
        labels: bands.map(b => b[0]), fmt: v => F.num(v), height: 210, negativeOk: false, name: 'People',
      }),
    }) +
    U.panel({
      col: 12, ico: 'list', title: pick ? `${pick}` : 'Everyone', pad: false,
      note: 'Name, role, manager and start date, the record a manager looks up most.',
      right: `<div class="chips">${['', ...depts].map(d =>
        `<button class="btn sm ${d === pick ? 'primary' : 'ghost'}" data-act="settab" data-arg="dir:${esc(d)}">${esc(d || 'All')}</button>`).join('')}</div>`,
      body: U.table({
        maxHeight: '520px',
        cols: [{ name: 'Name', w: '22%' }, { name: 'Role' }, { name: 'Department' }, { name: 'Location' },
          { name: 'Manager' }, { name: 'Type' }, { name: 'Started', n: true }],
        rows: rows.slice().sort((a, b) => a.d.localeCompare(b.d) || (a.mgr ? 1 : 0) - (b.mgr ? 1 : 0) || a.n.localeCompare(b.n)).map(r => ({
          click: `person:${r.id}`, cells: [`<b>${esc(r.n)}</b>${r.st !== 'Active' ? ` <span class="tag warn">${esc(r.st)}</span>` : ''}`,
            esc(r.t), esc(r.d), esc(r.loc), esc(r.mgr || 'Leadership'), esc(r.ty),
            `<span style="white-space:nowrap">${MON[Number(r.s.slice(5, 7)) - 1]} ${r.s.slice(0, 4)}</span>`],
        })),
      }),
      foot: `${F.num(rows.length)} ${rows.length === 1 ? 'person' : 'people'}${pick ? ` in ${esc(pick)}` : ''}.`,
    }) + source(s) + `</div>`;
}

/* ----------------------------------------------------------------- time off */

function timeoff(ctx) {
  const { q, s } = ctx;
  const h = hr(q), t = h.timeoff, marks = ctx.tasks || {};
  const state = p => marks[`${p.id}-${p.from}:pto`];
  const waiting = t.pending.filter(p => !state(p));
  const outToday = t.out.filter(o => o.from <= h.asOf && o.to >= h.asOf);
  const liability = t.balances.reduce((a, b) => a + b.liability, 0);
  const avgBal = t.balances.reduce((a, b) => a + b.avg, 0) / t.balances.length;
  /* the next fourteen days as columns, each person a row, so overlaps in one team are visible */
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(h.asOf); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10);
  });

  return U.pageHead({
    eyebrow: 'HR', title: 'Time off',
    answer: `<b>${waiting.length}</b> ${waiting.length === 1 ? 'request is' : 'requests are'} waiting on a manager,
      <b>${outToday.length}</b> ${outToday.length === 1 ? 'person is' : 'people are'} out today, and unused paid time off
      is carried at <b>${F.money(liability)}</b>.`,
  }) + U.strip([
    { label: 'Waiting on approval', value: F.num(waiting.length), note: `${t.pending.length - waiting.length} decided here` },
    { label: 'Out today', value: F.num(outToday.length), note: `${t.out.length} out in the next two weeks` },
    { label: 'Average balance', value: `${avgBal.toFixed(0)} hrs`, note: 'full-time staff' },
    { label: 'Time off liability', value: F.money(liability), note: 'unused hours at pay rate' },
  ]) + `<div class="grid">` +
    U.panel({
      col: 12, ico: 'check', title: 'Requests to approve', pad: false,
      note: 'Approve or decline here and the decision goes back to the payroll system with the hours.',
      body: U.table({
        cols: [{ name: 'Who', w: '24%' }, { name: 'Department' }, { name: 'Kind' }, { name: 'When' },
          { name: 'Days', n: true }, { name: 'Asked', n: true }, { name: '' }],
        rows: t.pending.map(p => {
          const st = state(p), key = `${p.id}-${p.from}`;
          return {
            cls: st ? 'muted' : '', click: `person:${p.id}`,
            cells: [`<b>${esc(p.n)}</b>`, esc(p.d), esc(p.k), span(p.from, p.to), F.num(p.days),
              p.asked ? `${p.asked}d ago` : 'today',
              st ? `<span class="tag ${st === 'done' ? 'good' : 'bad'}">${st === 'done' ? 'Approved' : 'Declined'}</span>
                 <button class="btn sm ghost" data-act="task" data-arg="${st}:${esc(key)}:pto">Undo</button>`
                : `<button class="btn sm primary" data-act="task" data-arg="done:${esc(key)}:pto">Approve</button>
                 <button class="btn sm ghost" data-act="task" data-arg="snooze:${esc(key)}:pto">Decline</button>`],
          };
        }),
      }),
    }) +
    U.panel({
      col: 12, ico: 'clock', title: 'Who is out, the next two weeks', pad: false,
      note: 'Each row a person, each column a day, so two people out from one team at once stands out.',
      body: `<div class="scroll"><table class="t cal"><thead><tr><th style="width:22%">Who</th>${days.map(d =>
        `<th class="n">${'SMTWTFS'[new Date(d + 'T12:00').getDay()]}<br>${Number(d.slice(8))}</th>`).join('')}</tr></thead><tbody>${t.out.filter(o => o.to >= days[0] && o.from <= days[13]).map(o =>
        `<tr><td><b>${esc(o.n)}</b><div class="sub">${esc(o.d)} · ${esc(o.k)}</div></td>${days.map(d =>
          `<td class="n">${d >= o.from && d <= o.to ? '<i class="cal-on" title="Out"></i>' : ''}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div>`,
    }) +
    U.panel({
      col: 12, ico: 'bars', title: 'Balances by department', pad: false,
      note: 'Average hours banked per full-time person, the share of this year’s accrual used, and what the banked hours are worth.',
      body: U.table({
        cols: [{ name: 'Department' }, { name: 'Avg banked', n: true }, { name: 'Used this year', n: true }, { name: 'Liability', n: true }],
        rows: t.balances.map(b => ({ cells: [`<b>${esc(b.d)}</b>`, `${b.avg} hrs`, F.pct(b.used, 0), F.money(b.liability)] })),
      }),
      foot: `${F.money(liability)} in total. A balance high in one team usually means people there cannot get away.`,
    }) + source(s) + `</div>`;
}

/* ------------------------------------------------------- hiring & onboarding */

function hiring(ctx) {
  const { q, s } = ctx;
  const h = hr(q), g = h.hiring;
  const stages = ['Applied', 'Screened', 'Interviewed', 'Offer'];
  const tot = stages.map((_, i) => g.reqs.reduce((a, r) => a + r.stages[i], 0));
  const offers = tot[3];
  const steps = g.steps.length;
  const behind = g.onboarding.filter(o => o.done < steps && daysBetween(o.s, h.asOf) > 21);

  return U.pageHead({
    eyebrow: 'HR', title: 'Hiring & onboarding',
    answer: `<b>${g.reqs.length}</b> open roles have <b>${F.num(tot[0])}</b> applicants between them and
      <b>${offers}</b> ${offers === 1 ? 'offer' : 'offers'} out. Roles fill in <b>${g.timeToFill}</b> days on average, and
      <b>${g.onboarding.length}</b> new hires are working through onboarding${behind.length ? `, <b>${behind.length}</b> of them behind` : ''}.`,
  }) + U.strip([
    { label: 'Open roles', value: F.num(g.reqs.length), note: 'from People & labor' },
    { label: 'Applicants', value: F.num(tot[0]), note: `${tot[2]} interviewed` },
    { label: 'Days to fill', value: F.num(g.timeToFill), note: 'average, last 12 months' },
    { label: 'Offers accepted', value: F.pct(g.accept, 0), note: 'last 12 months' },
    { label: 'Onboarding', value: F.num(g.onboarding.length), note: `${behind.length} behind schedule` },
  ]) + `<div class="grid">` +
    U.panel({
      col: 6, ico: 'funnel', title: 'The whole funnel',
      note: 'Every open role added together, stage by stage.',
      body: C.hbars({ rows: stages.map((st, i) => ({ name: st, value: tot[i] })), fmt: v => F.num(v) }),
      foot: `${F.pct(tot[1] / Math.max(1, tot[0]) * 100, 0)} of applicants pass the screen and ${F.pct(tot[2] / Math.max(1, tot[1]) * 100, 0)} of those reach an interview.`,
    }) +
    U.panel({
      col: 6, ico: 'people', title: 'Where hires come from',
      note: 'Open roles by the source sending their strongest applicants.',
      body: C.hbars({ rows: [...new Set(g.reqs.map(r => r.src))].map(src => ({ name: src, value: g.reqs.filter(r => r.src === src).length }))
        .sort((a, b) => b.value - a.value), fmt: v => F.num(v) }),
    }) +
    U.panel({
      col: 12, ico: 'list', title: 'Each open role', pad: false,
      note: 'Where every role stands, how long it has been open and where its best applicants came from.',
      body: U.table({
        cols: [{ name: 'Role', w: '30%' }, { name: 'Open', n: true }, ...stages.map(st => ({ name: st, n: true })), { name: 'Source' }],
        rows: g.reqs.map(r => ({
          cells: [`<b>${esc(r.t)}</b><div class="sub">${esc(r.d)}</div>`,
            `<span class="agepill ${r.days > 120 ? 'bad' : r.days > 60 ? 'warn' : ''}">${r.days}d</span>`,
            ...r.stages.map((n, i) => (i === 3 && n ? `<span class="tag good">${n}</span>` : F.num(n))), esc(r.src)],
        })),
      }),
    }) +
    U.panel({
      col: 12, ico: 'check', title: 'New hires, onboarding', pad: false,
      note: `Each new hire against the ${steps} steps everyone completes, from offer to training. A step left open past three weeks is the one HR chases.`,
      body: U.table({
        cols: [{ name: 'New hire', w: '24%' }, { name: 'Started', n: true }, { name: 'Progress', w: '30%' }, { name: 'Next step' }],
        rows: g.onboarding.map(o => {
          const late = o.done < steps && daysBetween(o.s, h.asOf) > 21;
          return {
            click: link(h, o.n), cells: [`<b>${esc(o.n)}</b><div class="sub">${esc(o.t)} · ${esc(o.d)}</div>`, day(o.s),
              `<div class="meter"><i style="width:${(o.done / steps * 100).toFixed(0)}%"></i></div><div class="sub">${o.done} of ${steps}</div>`,
              o.done >= steps ? '<span class="tag good">Complete</span>'
                : `<span class="tag ${late ? 'bad' : 'warn'}">${esc(g.steps[o.done])}</span>`],
          };
        }),
      }),
    }) + source(s) + `</div>`;
}

/* --------------------------------------------------- compliance & training */

function compliance(ctx) {
  const { q, s } = ctx;
  const h = hr(q), c = h.compliance;
  const lapsed = c.expiring.filter(e => e.due < h.asOf);
  const soon = c.expiring.filter(e => e.due >= h.asOf && daysBetween(h.asOf, e.due) <= 30);
  const gaps = c.gaps.reduce((a, g) => a + g.n, 0);
  const low = c.courses.slice().sort((a, b) => a.pct - b.pct)[0];

  return U.pageHead({
    eyebrow: 'HR', title: 'Compliance & training',
    answer: `<b>${lapsed.length}</b> ${lapsed.length === 1 ? 'certification has' : 'certifications have'} lapsed and
      <b>${soon.length}</b> more expire within 30 days. <b>${gaps}</b> records have a paperwork gap, and
      ${esc(low.c)} is the furthest behind at <b>${F.pct(low.pct, 0)}</b> complete.`,
  }) + U.strip([
    { label: 'Lapsed', value: F.num(lapsed.length), note: 'certifications past due' },
    { label: 'Due in 30 days', value: F.num(soon.length), note: `${c.expiring.length} due in 90` },
    { label: 'Paperwork gaps', value: F.num(gaps), note: `${c.gaps.filter(g => g.n).length} kinds` },
    { label: 'Training complete', value: F.pct(c.courses.reduce((a, x) => a + x.pct, 0) / c.courses.length, 0), note: 'average across required courses' },
  ]) + `<div class="grid">` +
    U.panel({
      col: 12, ico: 'shield', title: 'Certifications coming due', pad: false,
      note: 'Every license and certification that has lapsed or lapses within 90 days, soonest first.',
      body: U.table({
        cols: [{ name: 'Who', w: '28%' }, { name: 'Certification' }, { name: 'Due', n: true }, { name: '', n: true }],
        rows: c.expiring.map(e => {
          const d = daysBetween(h.asOf, e.due);
          return {
            click: link(h, e.n), cells: [`<b>${esc(e.n)}</b><div class="sub">${esc(e.d)}</div>`, esc(e.c), day(e.due),
              d < 0 ? `<span class="tag bad">${-d}d over</span>` : `<span class="agepill ${d <= 30 ? 'warn' : ''}">${d}d</span>`],
          };
        }),
      }),
    }) +
    U.panel({
      col: 5, ico: 'doc', title: 'Paperwork gaps',
      note: 'Records missing something the company is required to hold or should.',
      body: C.hbars({ rows: c.gaps.map(g => ({ name: g.k, value: g.n })), fmt: v => F.num(v) }),
    }) +
    U.panel({
      col: 7, ico: 'check', title: 'Required training', pad: false,
      note: 'Each required course by the share of the team that has finished it and when it is due.',
      body: U.table({
        cols: [{ name: 'Course', w: '32%' }, { name: 'Complete', w: '40%' }, { name: '', n: true }, { name: 'Due', n: true }],
        rows: c.courses.map(x => ({
          cells: [`<b>${esc(x.c)}</b>`,
            `<div class="meter${x.pct < 75 ? ' bad' : x.pct < 90 ? ' warn' : ''}"><i style="width:${Math.min(100, x.pct).toFixed(0)}%"></i></div>`,
            F.pct(x.pct, 0), day(x.due)],
        })),
      }),
    }) + source(s) + `</div>`;
}

/* ------------------------------------------------------- reviews & benefits */

function reviews(ctx) {
  const { q, s } = ctx;
  const h = hr(q), r = h.reviews, b = h.benefits;
  const hc = h.roster.length;
  const mgrAvg = r.byDept.reduce((a, d) => a + d.mgr, 0) / r.byDept.length;
  const slow = r.byDept.slice().sort((a, b2) => a.mgr - b2.mgr)[0];
  const toGo = daysBetween(h.asOf, r.due);
  const labels = ['Needs improvement', 'Developing', 'Meets', 'Exceeds', 'Outstanding'];

  return U.pageHead({
    eyebrow: 'HR', title: 'Reviews & benefits',
    answer: `The ${esc(r.cycle)} is due in <b>${toGo}</b> days and managers have finished <b>${F.pct(mgrAvg, 0)}</b> of theirs,
      ${esc(slow.d)} the furthest behind. Open enrollment runs ${span(b.window[0], b.window[1])}, and
      <b>${F.num(b.elected)}</b> of <b>${F.num(b.eligible)}</b> eligible people have made their choices.`,
  }) + U.strip([
    { label: 'Manager reviews done', value: F.pct(mgrAvg, 0), note: `due ${day(r.due)}` },
    { label: 'Goals on track', value: F.pct(r.goals[0] / hc * 100, 0), note: `${F.num(r.goals[2])} off track` },
    { label: 'On medical', value: F.pct(b.medical / b.eligible * 100, 0), note: `of ${F.num(b.eligible)} eligible` },
    { label: 'Saving for retirement', value: F.pct(b.retire / b.eligible * 100, 0), note: 'contributing to the plan' },
    { label: 'Enrollment made', value: `${F.num(b.elected)} of ${F.num(b.eligible)}`, note: `window closes ${day(b.window[1])}` },
  ]) + `<div class="grid">` +
    U.panel({
      col: 7, ico: 'bars', title: 'Review progress by department', pad: false,
      note: 'Self reviews and manager reviews, each as a share of the department.',
      body: U.table({
        cols: [{ name: 'Department', w: '28%' }, { name: 'Self review', w: '30%' }, { name: 'Manager review', w: '30%' }],
        rows: r.byDept.map(d => ({
          cells: [`<b>${esc(d.d)}</b>`,
            `<div class="meter"><i style="width:${d.self}%"></i></div><div class="sub">${d.self}%</div>`,
            `<div class="meter${d.mgr < 40 ? ' bad' : d.mgr < 70 ? ' warn' : ''}"><i style="width:${d.mgr}%"></i></div><div class="sub">${d.mgr}%</div>`],
        })),
      }),
    }) +
    U.panel({
      col: 5, ico: 'shield', title: 'Benefits enrollment',
      note: `Full-time staff on each plan. Open enrollment runs ${span(b.window[0], b.window[1])}.`,
      body: C.hbars({
        rows: [{ name: 'Medical', value: b.medical, note: F.pct(b.medical / b.eligible * 100, 0) },
          { name: 'Dental', value: b.dental, note: F.pct(b.dental / b.eligible * 100, 0) },
          { name: 'Retirement plan', value: b.retire, note: F.pct(b.retire / b.eligible * 100, 0) },
          { name: 'Enrollment made', value: b.elected, note: F.pct(b.elected / b.eligible * 100, 0) }],
        fmt: v => F.num(v), max: b.eligible,
      }),
    }) +
    U.panel({
      col: 6, ico: 'target', title: 'How ratings fall',
      note: 'Last cycle’s ratings across the whole team.',
      body: C.bars({ values: r.ratings, labels: labels.map(l => l.split(' ')[0]), fmt: v => F.num(v), height: 200, negativeOk: false, name: 'People' }),
      foot: `${F.pct((r.ratings[3] + r.ratings[4]) / hc * 100, 0)} rated above expectations, ${F.pct(r.ratings[0] / hc * 100, 0)} on a plan to improve.`,
    }) +
    U.panel({
      col: 6, ico: 'target', title: 'Goals',
      note: 'Every goal set this year by where it stands.',
      body: C.donut({
        parts: [{ name: 'On track', value: r.goals[0], color: 'var(--good)' }, { name: 'At risk', value: r.goals[1], color: 'var(--warn)' },
          { name: 'Off track', value: r.goals[2], color: 'var(--bad)' }],
        fmt: v => F.num(v), center: F.num(r.goals.reduce((a, x) => a + x, 0)), centerLabel: 'goals',
      }) + C.donutLegend([{ name: 'On track', value: r.goals[0], color: 'var(--good)' }, { name: 'At risk', value: r.goals[1], color: 'var(--warn)' },
        { name: 'Off track', value: r.goals[2], color: 'var(--bad)' }], v => F.num(v)),
    }) + source(s) + `</div>`;
}


/* ------------------------------------------------------------ employee profile */

/* Details no roster carries (job history, pay, documents, contacts) are drawn from a
   generator seeded by the employee id, so a person reads the same on every visit and
   in every view without the extract carrying 400 full records. */
function seeded(id) {
  let x = 0;
  for (const ch of id) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}
const byName = (h, n) => h.roster.find(r => r.n === n);
const link = (h, n) => { const r = byName(h, n); return r ? `person:${r.id}` : ''; };

function person(ctx) {
  const { q, s } = ctx;
  const h = hr(q), p = q.data.people;
  const r = h.roster.find(x => x.id === ctx.arg) || h.roster[0];
  const rnd = seeded(r.id);
  const dept = p.departments.find(d => d.name === r.d) || p.departments[0];
  const yrs = tenure(h, r);
  const lead = !r.mgr;
  /* Base pay starts from the industry's typical seat (costPerHead) and moves with seniority.
     A department's all-in cost carries taxes, benefits and direct labor, so it is never read as a salary. */
  const base = Math.round(p.costPerHead * (lead ? 1.35 : 0.62 + rnd() * 0.4) * (1 + Math.min(10, yrs) * 0.015) / 500) * 500;
  const hourly = r.ty !== 'Full time';
  const rate = hourly ? Math.round(base / 2080 * 0.9 * 100) / 100 : null;

  /* effective-dated history, newest first: hire, then a raise most years, a promotion now and then */
  const hist = [];
  let pay = base;
  const startY = Number(r.s.slice(0, 4)), nowY = Number(h.asOf.slice(0, 4));
  for (let y = nowY; y > startY; y--) {
    if (daysBetween(r.s, `${y}-03-01`) < 180) continue;
    const promo = rnd() < 0.12;
    const pctUp = promo ? 0.08 + rnd() * 0.06 : 0.025 + rnd() * 0.025;
    hist.push({ date: `${y}-${String(1 + Math.floor(rnd() * 3)).padStart(2, '0')}-01`, what: promo ? 'Promotion' : 'Annual increase', pay, pct: pctUp * 100 });
    pay = Math.round(pay / (1 + pctUp) / 100) * 100;
  }
  hist.push({ date: r.s, what: 'Hired', pay, pct: null });

  const reports = h.roster.filter(x => x.mgr === r.n);
  const pend = h.timeoff.pending.filter(x => x.id === r.id);
  const outs = h.timeoff.out.filter(x => x.n === r.n);
  const certs = h.compliance.expiring.filter(x => x.n === r.n);
  const onb = h.hiring.onboarding.find(x => x.n === r.n);
  const rating = ['Needs improvement', 'Developing', 'Meets expectations', 'Exceeds expectations', 'Outstanding'][Math.min(4, Math.floor(rnd() * 5 * 0.9 + 0.5))];
  const fresh = yrs < 0.5;
  const enrolled = r.ty === 'Full time'
    ? [['Medical', rnd() < 0.82 ? (rnd() < 0.5 ? 'Employee + family' : 'Employee only') : 'Waived'],
       ['Dental', rnd() < 0.74 ? 'Enrolled' : 'Waived'], ['Retirement plan', rnd() < 0.64 ? `${3 + Math.floor(rnd() * 6)}% of pay` : 'Not contributing']]
    : [['Benefits', 'Not eligible (not full time)']];
  const docs = [['Offer letter', r.s, 'Signed'], ['I-9', r.s, 'Verified'], ['W-4', yrs > 3 ? `${nowY - 4}-01-15` : r.s, yrs > 3 ? 'Update due' : 'On file'],
    ['Handbook acknowledgement', r.s, rnd() < 0.06 ? 'Not signed' : 'Signed'], ['Direct deposit', r.s, 'On file']];
  const initials = r.n.split(' ').map(w => w[0]).join('').slice(0, 2);

  return `<header class="page-head person-head"><div class="avatar">${esc(initials)}</div><div>
      <div class="page-eyebrow">${esc(r.d)}</div>
      <h1 class="page-title">${esc(r.n)}</h1>
      <p class="page-answer">${esc(r.t)} at ${esc(r.loc)}, ${yrs < 1 ? `${Math.max(1, Math.round(yrs * 12))} months` : `${yrs.toFixed(1)} years`} in.
        ${lead ? `Leads ${esc(r.d)} with <b>${reports.length}</b> direct reports.` : `Reports to ${esc(r.mgr)}.`}
        ${r.st !== 'Active' ? `<span class="tag warn">${esc(r.st)}</span>` : ''}</p></div></header>` +
    U.strip([
      { label: 'Employment', value: r.ty, note: `since ${day(r.s)} ${r.s.slice(0, 4)}` },
      { label: hourly ? 'Pay rate' : 'Salary', value: hourly ? (F.state.money === 'none' ? '—' : `$${rate.toFixed(2)}`) : F.money(base), note: hourly ? 'an hour' : 'a year' },
      { label: 'Time off banked', value: r.pto ? `${r.pto} hrs` : 'None', note: r.pto ? `${(r.pto / 8).toFixed(1)} days` : 'not accruing' },
      { label: 'Last review', value: rating.split(' ')[0], note: rating },
    ]) + `<div class="grid">` +
    U.panel({
      col: 7, ico: 'list', title: 'Job & pay history', pad: false,
      note: 'Every change to the job or the pay, effective-dated, newest first.',
      body: U.table({
        cols: [{ name: 'Effective', n: true }, { name: 'Change' }, { name: 'Pay', n: true }, { name: 'Raise', n: true }],
        rows: hist.map(x => ({ cells: [`<span style="white-space:nowrap">${day(x.date)} ${x.date.slice(0, 4)}</span>`,
          x.what === 'Promotion' ? '<span class="tag good">Promotion</span>' : esc(x.what), F.money(x.pay), x.pct ? F.pct(x.pct, 1) : '—'] })),
      }),
    }) +
    U.panel({
      col: 5, ico: 'people', title: 'Who and where',
      body: `<div class="kv">${[
        ['Employee ID', r.id], ['Department', r.d], ['Location', r.loc], ['Manager', r.mgr || 'Leadership'],
        ['Start date', `${day(r.s)} ${r.s.slice(0, 4)}`], ['Work email', `${r.n.toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.')}@${(q.data.meta.company || 'company').toLowerCase().replace(/[^a-z]/g, '')}.com`],
        ['Emergency contact', rnd() < 0.05 ? '<span class="tag bad">Missing</span>' : 'On file'],
      ].map(([k, v]) => `<div><span>${esc(k)}</span><b>${String(v).startsWith('<') ? v : esc(v)}</b></div>`).join('')}</div>`,
    }) +
    U.panel({
      col: 6, ico: 'clock', title: 'Time off',
      body: `<div class="kv"><div><span>Banked</span><b>${r.pto ? `${r.pto} hrs` : 'Not accruing'}</b></div></div>` +
        ([...pend.map(x => `<div class="row-item"><span class="grow"><b>${esc(x.k)}</b><div class="sub">${span(x.from, x.to)}</div></span><span class="tag warn">Waiting</span></div>`),
          ...outs.map(x => `<div class="row-item"><span class="grow"><b>${esc(x.k)}</b><div class="sub">${span(x.from, x.to)}</div></span><span class="tag good">Approved</span></div>`)].join('')
          || '<div class="empty">Nothing booked.</div>'),
    }) +
    U.panel({
      col: 6, ico: 'shield', title: fresh && onb ? 'Onboarding' : 'Certifications & training',
      body: fresh && onb
        ? `<div class="meter"><i style="width:${(onb.done / h.hiring.steps.length * 100).toFixed(0)}%"></i></div>
           <div class="sub">${onb.done} of ${h.hiring.steps.length} steps</div><div class="rows">${h.hiring.steps.map((st, i) =>
            `<div class="row-item"><span class="grow">${esc(st)}</span><span class="tag ${i < onb.done ? 'good' : ''}">${i < onb.done ? 'Done' : 'Open'}</span></div>`).join('')}</div>`
        : (certs.map(c => { const d = daysBetween(h.asOf, c.due); return `<div class="row-item"><span class="grow"><b>${esc(c.c)}</b><div class="sub">due ${day(c.due)}</div></span>
            <span class="tag ${d < 0 ? 'bad' : d <= 30 ? 'warn' : ''}">${d < 0 ? `${-d}d over` : `${d}d`}</span></div>`; }).join('')
          || '<div class="empty">Nothing coming due in the next 90 days.</div>') +
          `<div class="sub" style="margin-top:8px">Required training: ${rnd() < 0.8 ? 'all complete' : '1 course open'}.</div>`,
    }) +
    U.panel({
      col: 6, ico: 'target', title: 'Benefits',
      body: `<div class="kv">${enrolled.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`,
    }) +
    U.panel({
      col: 6, ico: 'doc', title: 'Documents',
      body: `<div class="rows">${docs.map(([k, d, st]) => `<div class="row-item"><span class="grow"><b>${esc(k)}</b><div class="sub">${day(d)} ${d.slice(0, 4)}</div></span>
        <span class="tag ${st === 'Not signed' || st === 'Update due' ? 'warn' : 'good'}">${esc(st)}</span></div>`).join('')}</div>`,
    }) +
    (reports.length ? U.panel({
      col: 12, ico: 'people', title: `Direct reports (${reports.length})`, pad: false,
      body: U.table({
        maxHeight: '360px',
        cols: [{ name: 'Name', w: '28%' }, { name: 'Role' }, { name: 'Location' }, { name: 'Type' }, { name: 'Started', n: true }],
        rows: reports.map(x => ({ click: `person:${x.id}`, cells: [`<b>${esc(x.n)}</b>`, esc(x.t), esc(x.loc), esc(x.ty),
          `<span style="white-space:nowrap">${MON[Number(x.s.slice(5, 7)) - 1]} ${x.s.slice(0, 4)}</span>`] })),
      }),
    }) : '') + source(s) + `</div>`;
}

/* ------------------------------------------------------------------ HR home */

const ini = n => n.split(' ').map(w => w[0]).join('').slice(0, 2);
const face = (r, sz = 34) => `<span class="face" style="width:${sz}px;height:${sz}px">${esc(ini(r.n))}</span>`;

function home(ctx) {
  const { q, s, go } = ctx;
  const h = hr(q), p = q.data.people, marks = ctx.tasks || {};
  const all = h.roster;
  const waiting = h.inbox.filter(i => !marks[inboxKey(i)]);
  const outToday = h.timeoff.out.filter(o => o.from <= h.asOf && o.to >= h.asOf);
  const week = new Date(h.asOf); week.setDate(week.getDate() + 6);
  const wk = week.toISOString().slice(0, 10);
  const outWeek = h.timeoff.out.filter(o => o.from <= wk && o.to >= h.asOf);

  /* anniversaries from start dates, birthdays from a per-person seed, next 30 days (BambooHR) */
  const md = iso => iso.slice(5);
  const until = iso => { const d = new Date(`${h.asOf.slice(0, 4)}-${md(iso)}T12:00`); let n = Math.round((d - new Date(h.asOf + 'T12:00')) / 864e5); if (n < 0) n += 365; return n; };
  const cel = [];
  for (const r of all) {
    const yrs = Number(h.asOf.slice(0, 4)) - Number(r.s.slice(0, 4)) + (md(r.s) < md(h.asOf) ? 1 : 0);
    const a = until(r.s);
    if (a <= 30 && yrs >= 1) cel.push({ r, days: a, what: `${yrs} year${yrs > 1 ? 's' : ''} at the company`, kind: 'anniv' });
    const rnd = seeded(r.id + 'b');
    const bd = `2000-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`;
    const b = until(bd);
    if (b <= 14) cel.push({ r, days: b, what: 'Birthday', kind: 'bday' });
  }
  cel.sort((a, b) => a.days - b.days);

  /* the health score (Paylocity's index): five parts, each 0 to 100, with the action that lifts it */
  const c = h.compliance;
  const lapsed = c.expiring.filter(e => e.due < h.asOf).length;
  const steps = h.hiring.steps.length;
  const behind = h.hiring.onboarding.filter(o => o.done < steps && daysBetween(o.s, h.asOf) > 21).length;
  const mgrAvg = h.reviews.byDept.reduce((a, d) => a + d.mgr, 0) / h.reviews.byDept.length;
  const parts = [
    { k: 'Retention', v: Math.max(0, Math.min(100, 100 - p.turnover * 1.1)), act: 'See who is leaving and why', page: 'people-home' },
    { k: 'Compliance', v: Math.max(0, 100 - lapsed * 9 - c.gaps.reduce((a, g) => a + g.n, 0) * 1.5), act: `Renew ${lapsed} lapsed certifications`, page: 'hr-compliance' },
    { k: 'Onboarding', v: Math.max(0, 100 - behind * 15), act: `Chase ${behind} new hire${behind === 1 ? '' : 's'} behind on paperwork`, page: 'hr-hiring' },
    { k: 'Reviews', v: mgrAvg, act: 'Nudge managers on open reviews', page: 'hr-reviews' },
    { k: 'Engagement', v: Math.max(0, Math.min(100, 50 + h.pulse.enps * 1.2)), act: 'Read this quarter’s pulse comments', page: 'hr-home' },
  ];
  const score = Math.round(parts.reduce((a, x) => a + x.v, 0) / parts.length);
  const todo = parts.slice().sort((a, b) => a.v - b.v).slice(0, 3);

  return U.pageHead({
    eyebrow: 'HR', title: 'HR home',
    answer: `<b>${waiting.length}</b> ${waiting.length === 1 ? 'approval waits' : 'approvals wait'} on someone,
      <b>${outToday.length}</b> ${outToday.length === 1 ? 'person is' : 'people are'} out today and <b>${cel.length}</b> celebrations are coming up.
      The people health score is <b>${score}</b>, held back most by ${esc(todo[0].k.toLowerCase())}.`,
  }) + U.strip([
    { label: 'People', value: F.num(all.length), note: `${F.num(p.departments.length)} departments` },
    { label: 'Waiting in the inbox', value: F.num(waiting.length), note: `${h.inbox.length - waiting.length} decided` },
    { label: 'Out this week', value: F.num(outWeek.length), note: `${outToday.length} today` },
    { label: 'eNPS', value: (h.pulse.enps > 0 ? '+' : '') + h.pulse.enps, note: `${h.pulse.responded}% responded` },
    { label: 'Health score', value: `${score}`, note: 'out of 100' },
  ]) + `<div class="grid">` +
    U.panel({
      col: 6, ico: 'gauge', title: 'People health score',
      note: 'Five parts, each out of 100. The weakest three come with the action that lifts them.',
      body: C.hbars({ rows: parts.map(x => ({ name: x.k, value: Math.round(x.v) })), fmt: v => F.num(v), max: 100 }) +
        `<div class="rows" style="margin-top:12px">${todo.map((t, i) => `<div class="row-item"><span class="tk-n">${i + 1}</span>
          <span class="grow"><b>${esc(t.act)}</b><div class="sub">${esc(t.k)} at ${Math.round(t.v)}</div></span>
          ${U.btn('Open', { act: 'go', arg: t.page, sm: true })}</div>`).join('')}</div>`,
    }) +
    U.panel({
      col: 6, ico: 'clock', title: 'Who’s out this week',
      note: 'Everyone away in the next seven days, so a team can plan around it.',
      body: outWeek.length ? `<div class="rows">${outWeek.slice(0, 7).map(o => {
        const r = byName(h, o.n) || { n: o.n, id: '' };
        return `<div class="row-item" data-click="person:${esc(r.id)}">${face(r)}<span class="grow"><b>${esc(o.n)}</b>
          <div class="sub">${esc(o.d)} · ${esc(o.k)}</div></span><span class="sub">${span(o.from, o.to)}</span></div>`;
      }).join('')}</div>` : '<div class="empty">Everyone is in this week.</div>',
    }) +
    U.panel({
      col: 6, ico: 'flag', title: 'Celebrations',
      note: 'Work anniversaries in the next 30 days and birthdays in the next two weeks.',
      body: cel.length ? `<div class="rows">${cel.slice(0, 6).map(x => `<div class="row-item" data-click="person:${esc(x.r.id)}">${face(x.r)}
        <span class="grow"><b>${esc(x.r.n)}</b><div class="sub">${esc(x.what)}</div></span>
        <span class="tag ${x.kind === 'anniv' ? 'good' : ''}">${x.days === 0 ? 'Today' : `in ${x.days}d`}</span></div>`).join('')}</div>`
        : '<div class="empty">Nothing in the next month.</div>',
      foot: cel.length > 6 ? `${cel.length - 6} more in the next month.` : '',
    }) +
    U.panel({
      col: 6, ico: 'pulse', title: 'How people feel',
      note: 'The quarterly one-question pulse: how likely are you to recommend working here. Comments are sorted into themes.',
      body: C.line({ series: [{ name: 'eNPS', values: h.pulse.history }], labels: h.pulse.history.map((_, i) => `Q${((i + 2) % 4) + 1}`),
        fmt: v => (v > 0 ? '+' : '') + Math.round(v), height: 190, legend: false, zeroBase: false }) +
        C.hbars({ rows: h.pulse.themes.map(([k, v]) => ({ name: k, value: Math.round(v * 100) })), fmt: v => (v > 0 ? '+' : '') + v }),
      foot: `${h.pulse.promoters}% promoters, ${h.pulse.detractors}% detractors. Theme bars run from negative to positive sentiment.`,
    }) + source(s) + `</div>`;
}

/* -------------------------------------------------------------------- inbox */

/* Time-off items share their decision with the Time off page, so approving in either place shows in both. */
function inboxKey(i) { return i.kind === 'Time off' ? `${i.id.slice(4)}:pto` : `${i.id}:inbox`; }

function inbox(ctx) {
  const { q, s } = ctx;
  const h = hr(q), marks = ctx.tasks || {};
  const items = h.inbox;
  const state = i => marks[inboxKey(i)];
  const waiting = items.filter(i => !state(i));
  const kinds = [...new Set(items.map(i => i.kind))];
  const word = { done: ['Approved', 'good'], snooze: ['Denied', 'bad'], back: ['Sent back', 'warn'] };

  const nice = t => t.replace(/\d{4}-\d{2}-\d{2}/g, d => day(d));
  const card = (i, n) => {
    const st = state(i), [k, tag] = inboxKey(i).split(':');
    const tc = i.kind === 'Timecard';
    const btn = (what, label, primary) => `<button class="btn sm ${primary ? 'primary' : 'ghost'}" data-act="task" data-arg="${what}:${esc(k)}:${tag}">${label}</button>`;
    return `<div class="tk${st ? ` tk-${st === 'done' ? 'done' : 'snooze'}` : ''}">
      <span class="tk-n">${n + 1}</span>
      <span class="tk-main">
        <span class="tk-meta"><span class="tag">${esc(i.kind)}</span><i>${i.age ? `${i.age}d waiting` : 'new today'}</i></span>
        <b data-click="person:${esc(i.pid)}" style="cursor:pointer">${esc(i.who)}</b>
        <span class="tk-why">${esc(nice(i.what))}</span>
        <span class="steps">${i.steps.map(([step, who, ago], n) => `<span class="step ${ago !== null ? 'done' : n === i.steps.findIndex(x => x[2] === null) ? 'now' : ''}">
          <i></i>${esc(step)}<em>${esc(who)}${ago !== null ? `, ${ago ? `${ago}d ago` : 'today'}` : ''}</em></span>`).join('')}</span>
        <span class="sub">Routed to ${esc(i.route)}</span>
      </span>
      <span class="tk-do">${st ? `<span class="tag ${word[st][1]}">${word[st][0]}</span>${btn(st, 'Undo')}`
        : tc ? `${U.btn('Clear exceptions', { act: 'go', arg: 'hr-attendance', sm: true })}`
          : `${btn('done', 'Approve', true)}${btn('back', 'Send back')}${btn('snooze', 'Deny')}`}</span>
    </div>`;
  };

  return U.pageHead({
    eyebrow: 'HR', title: 'Inbox',
    answer: `<b>${waiting.length}</b> of <b>${items.length}</b> requests wait on a decision. Time off, pay changes, job changes
      and timecards all land here, each showing who has acted and who is next.`,
  }) + U.strip(kinds.map(k => {
    const all = items.filter(i => i.kind === k);
    return { label: k, value: F.num(all.filter(i => !state(i)).length), note: `of ${all.length}` };
  })) + `<div class="grid">` +
    U.panel({
      col: 12, ico: 'check', title: 'Waiting on a decision', pad: false,
      note: 'Oldest first. A send back needs a reason in a real deployment and returns the request to whoever started it.',
      body: `<div class="tasks">${items.filter(i => !state(i)).map(card).join('') || '<div class="empty">Nothing waiting. Every request is decided.</div>'}</div>`,
    }) +
    (items.length > waiting.length ? U.panel({
      col: 12, ico: 'list', title: 'Decided in this session', pad: false,
      body: `<div class="tasks">${items.filter(i => state(i)).map(card).join('')}</div>`,
    }) : '') + source(s) + `</div>`;
}

/* -------------------------------------------------------- time & attendance */

function attendance(ctx) {
  const { q, s } = ctx;
  const h = hr(q), a = h.attendance, marks = ctx.tasks || {};
  const cleared = c => !c.exc.length || marks[`${c.id}:tcx`] === 'done';
  const approved = c => c.approved || marks[`${c.id}:tc`] === 'done';
  const open = a.cards.filter(c => !approved(c));
  const blocked = open.filter(c => !cleared(c));
  const ot = a.cards.reduce((x, c) => x + c.ot, 0);
  const next = pts => a.ladder.find(([t]) => pts < t);
  const near = a.cards.filter(c => { const n = next(c.pts); return n && n[0] - c.pts <= 4; });

  return U.pageHead({
    eyebrow: 'HR', title: 'Time & attendance',
    answer: `The pay period ${span(a.from, a.to)} has <b>${open.length}</b> timecards to approve, <b>${blocked.length}</b> of them
      blocked by exceptions that have to be cleared first. The team logged <b>${F.num(Math.round(ot))}</b> overtime hours, and
      <b>${near.length}</b> ${near.length === 1 ? 'person is' : 'people are'} within four points of an attendance warning.`,
  }) + U.strip([
    { label: 'To approve', value: F.num(open.length), note: `of ${a.cards.length} hourly cards` },
    { label: 'Blocked by exceptions', value: F.num(blocked.length), note: 'clear before approving' },
    { label: 'Overtime hours', value: F.num(Math.round(ot)), note: 'this period' },
    { label: 'Near a warning', value: F.num(near.length), note: 'within 4 points' },
  ]) + `<div class="grid">` +
    U.panel({
      col: 12, ico: 'check', title: 'Team timecards', pad: false,
      note: 'Approve stays locked on a card until its exceptions are cleared, so a bad punch never reaches payroll.',
      body: U.table({
        maxHeight: '560px',
        cols: [{ name: 'Who', w: '24%' }, { name: 'Regular', n: true }, { name: 'Overtime', n: true }, { name: 'Exceptions' },
          { name: 'Points', n: true }, { name: '' }],
        rows: a.cards.map(c => {
          const ok = cleared(c), done = approved(c);
          return {
            click: `person:${c.id}`, cls: done ? 'muted' : '',
            cells: [`<b>${esc(c.n)}</b><div class="sub">${esc(c.d)}</div>`, `${c.reg.toFixed(1)}h`, c.ot ? `<span class="tag warn">${c.ot.toFixed(1)}h</span>` : '—',
              c.exc.length ? c.exc.map(e => `<span class="tag ${ok ? '' : 'bad'}">${esc(e)}${ok ? ', cleared' : ''}</span>`).join(' ') : '<span class="sub">None</span>',
              F.num(c.pts),
              done ? '<span class="tag good">Approved</span>'
                : ok ? `<button class="btn sm primary" data-act="task" data-arg="done:${esc(c.id)}:tc">Approve</button>`
                  : `<button class="btn sm" data-act="task" data-arg="done:${esc(c.id)}:tcx">Clear ${c.exc.length}</button>`],
          };
        }),
      }),
    }) +
    U.panel({
      col: 6, ico: 'flag', title: 'Attendance points',
      note: `Points over the trailing 30 days. ${a.ladder.map(([t, w]) => `${t} is a ${w.toLowerCase()}`).join(', ')}.`,
      body: C.hbars({ rows: a.cards.slice().sort((x, y) => y.pts - x.pts).slice(0, 8).map(c => ({ name: c.n, value: c.pts })),
        fmt: v => `${v} pts`, max: a.ladder[a.ladder.length - 1][0] }),
      foot: near.length ? `Within four points of a warning: ${near.slice(0, 5).map(c => `${esc(c.n)} (${next(c.pts)[0] - c.pts} to a ${esc(next(c.pts)[1].toLowerCase())})`).join(', ')}${near.length > 5 ? ` and ${near.length - 5} more` : ''}.` : 'Nobody is near a warning.',
    }) +
    U.panel({
      col: 6, ico: 'bars', title: 'Who is carrying the overtime',
      note: 'Overtime hours this period, highest first. Steady overtime on one person is a staffing gap, not a bonus.',
      body: C.hbars({ rows: a.cards.filter(c => c.ot).sort((x, y) => y.ot - x.ot).slice(0, 8).map(c => ({ name: c.n, value: c.ot })), fmt: v => `${v.toFixed(1)}h` }),
    }) + source(s) + `</div>`;
}

/* ----------------------------------------------------------- payroll preview */

function payroll(ctx) {
  const { q, s } = ctx;
  const h = hr(q), pr = h.payroll, marks = ctx.tasks || {};
  const seen = v => marks[`${v.id}:var`];
  const open = pr.variances.filter(v => !seen(v));
  const left = daysBetween(h.asOf, pr.runBy);
  const approved = marks['run:payroll'] === 'done';

  return U.pageHead({
    eyebrow: 'HR', title: 'Payroll preview',
    answer: `The next run pays <b>${F.num(pr.people)}</b> people on <b>${day(pr.payday)}</b> and has to be approved by <b>${day(pr.runBy)}</b>,
      ${left} days from now. The payroll provider will debit <b>${F.money(pr.debit)}</b>, and <b>${open.length}</b>
      ${open.length === 1 ? 'paycheck moved' : 'paychecks moved'} enough to look at first.`,
  }) + `<div class="paydates">
      <div><span>Approve by</span><b>${day(pr.runBy)}</b><em>${left} days left</em></div>
      <div><span>Payday</span><b>${day(pr.payday)}</b><em>${F.num(pr.people)} people</em></div>
      <div class="go">${approved ? '<span class="tag good">Approved, sent to the payroll provider</span>'
        : open.length ? `<button class="btn" disabled>Approve payroll</button><em>Review ${open.length} flagged paycheck${open.length === 1 ? '' : 's'} first</em>`
          : '<button class="btn primary" data-act="task" data-arg="done:run:payroll">Approve payroll</button><em>Every flag reviewed</em>'}</div>
    </div><div class="grid">` +
    U.panel({
      col: 5, ico: 'wallet', title: 'What will leave the bank',
      note: 'The liability preview: exactly what the provider pulls, and where it goes.',
      body: `<div class="kv">${[['Net pay to employees', pr.net], ['Employee taxes withheld', pr.taxesEe], ['Employer taxes', pr.taxesEr], ['Benefits and retirement deductions', pr.deductions]]
        .map(([k, v]) => `<div><span>${esc(k)}</span><b>${F.money(v)}</b></div>`).join('')}
        <div class="kv-total"><span>Debit on ${day(pr.runBy)}</span><b>${F.money(pr.debit)}</b></div></div>`,
      foot: 'The Hub previews and approves. Tax filing and moving the money stay with the payroll provider.',
    }) +
    U.panel({
      col: 7, ico: 'bars', title: 'Gross to net',
      note: 'This run’s gross pay and what comes out of it before it reaches people.',
      body: C.hbars({ rows: [{ name: 'Gross pay', value: pr.gross }, { name: 'Taxes withheld', value: pr.taxesEe },
        { name: 'Deductions', value: pr.deductions }, { name: 'Net pay', value: pr.net }], fmt: v => F.money(v) }),
    }) +
    U.panel({
      col: 12, ico: 'flag', title: 'Paychecks that moved', pad: false,
      note: 'Each paycheck more than 5% off the last run, with the reason. Review every one before the run can be approved.',
      body: U.table({
        cols: [{ name: 'Who', w: '24%' }, { name: 'Why' }, { name: 'Last run', n: true }, { name: 'This run', n: true }, { name: 'Change', n: true }, { name: '' }],
        rows: pr.variances.map(v => {
          const st = seen(v), pct = (v.now - v.last) / v.last * 100;
          return {
            click: `person:${v.id}`, cls: st ? 'muted' : '',
            cells: [`<b>${esc(v.n)}</b><div class="sub">${esc(v.d)}</div>`, `<span class="tag ${pct < 0 ? 'warn' : ''}">${esc(v.why)}</span>`,
              F.money(v.last), F.money(v.now), `<span class="delta ${pct > 0 ? 'up' : 'down'}">${pct > 0 ? '+' : ''}${pct.toFixed(0)}%</span>`,
              st ? `<span class="tag ${st === 'done' ? 'good' : ''}">${st === 'done' ? 'Correct' : 'Dismissed'}</span>`
                : `<button class="btn sm primary" data-act="task" data-arg="done:${esc(v.id)}:var">Looks right</button>
                   <button class="btn sm ghost" data-act="task" data-arg="snooze:${esc(v.id)}:var">Dismiss</button>`],
          };
        }),
      }),
    }) + source(s) + `</div>`;
}

export const hrPages = {
  'hr-directory': directory, 'hr-time': timeoff, 'hr-hiring': hiring,
  'hr-compliance': compliance, 'hr-reviews': reviews, 'hr-person': person,
  'hr-home': home, 'hr-inbox': inbox, 'hr-attendance': attendance, 'hr-payroll': payroll,
};
