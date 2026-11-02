/* The operations module. One engine, six shapes: the columns, the second page
   and the unit detail all come from the industry profile, which is what makes
   the same build read as a construction dashboard and a fleet dashboard. */

import * as F from '../fmt.js';
import * as C from '../chart.js';
import * as U from '../ui.js';
import { esc, icon } from '../icons.js';
import { motif } from '../scenes.js';

const mN = m => F.monthName(m);

/* The table columns per industry. Each is {name, n, get(row, ctx)}. */
const COLUMNS = {
  construction: [
    { name: 'Contract', n: true, get: r => F.money(r.f.contract) },
    { name: 'Earned', n: true, get: r => F.money(r.f.earned) },
    { name: 'Billed', n: true, get: r => F.money(r.f.billed) },
    { name: 'Over / under', n: true, get: r => {
      const v = (r.f.billed || 0) - (r.f.earned || 0);
      return `<span class="delta ${v >= 0 ? 'up' : 'down'}">${F.money(v, { sign: true })}</span>`;
    } },
    { name: 'Complete', n: true, get: r => bar(r.f.pct, 100, F.pct(r.f.pct, 0)) },
    { name: 'Cost at completion', n: true, get: r => {
      const p = (r.f.pct || 0) / 100;
      const proj = p > 0.05 ? (r.f.cost || 0) / p : (r.f.estCost || 0);
      const v = proj - (r.f.estCost || 0);
      return `<span class="delta ${v > 0 ? 'down' : 'up'}">${F.money(v, { sign: true })}</span>`;
    } },
  ],
  education: [
    { name: 'Grades', get: r => esc(r.grades || '') },
    { name: 'Enrolled', n: true, get: r => F.num(r.f.enrolled) },
    { name: 'Seats', n: true, get: r => F.num(r.f.capacity) },
    { name: 'Filled', n: true, get: r => bar(r.f.enrolled, r.f.capacity, F.pct(r.f.capacity ? r.f.enrolled / r.f.capacity * 100 : 0, 0)) },
    { name: 'Staff', n: true, get: r => F.num(r.f.staff, 1) },
    { name: 'Per student', n: true, get: r => F.exact(r.f.funding) },
    { name: 'Cost per student', n: true, get: r => F.exact(r.f.costPer) },
  ],
  retail: [
    { name: 'Format', get: r => esc(r.format || '') },
    { name: 'Sales', n: true, get: r => F.money(r.f.sales) },
    { name: 'Sq ft', n: true, get: r => r.f.sqft ? F.num(r.f.sqft) : '—' },
    { name: 'Per sq ft', n: true, get: r => r.f.sqft ? F.exact(r.f.sales * 12 / r.f.sqft) : '—' },
    { name: 'Margin', n: true, get: r => F.pct(r.f.margin, 1) },
    { name: 'Visitors', n: true, get: r => F.num(r.f.traffic) },
    { name: 'Conversion', n: true, get: r => F.pct(r.f.conv, 1) },
  ],
  industrial: [
    { name: 'Plant', get: r => esc(r.plant || '') },
    { name: 'Produced', n: true, get: r => F.num(r.f.produced) },
    { name: 'Scrap', n: true, get: r => `${F.num(r.f.scrap)} <span class="muted">(${F.pct(r.f.produced ? r.f.scrap / r.f.produced * 100 : 0, 1)})</span>` },
    { name: 'Hours run', n: true, get: r => F.num(r.f.hoursRun, 0) },
    { name: 'OEE', n: true, get: r => bar(r.f.oee, 100, F.pct(r.f.oee, 1)) },
    { name: 'Cost per unit', n: true, get: r => F.exact(r.f.cpu, 2) },
  ],
  logistics: [
    { name: 'Terminal', get: r => esc(r.terminal || '') },
    { name: 'Loads', n: true, get: r => F.num(r.f.loads) },
    { name: 'Miles', n: true, get: r => F.num(r.f.miles) },
    { name: 'Rev / mile', n: true, get: r => F.exact(r.f.miles ? r.f.linehaul / r.f.miles : 0, 2) },
    { name: 'Fuel + maint / mile', n: true, get: r => F.exact(r.f.miles ? (r.f.fuel + r.f.maint) / r.f.miles : 0, 2) },
    { name: 'Deadhead', n: true, get: r => F.pct(r.f.deadhead, 1) },
    { name: 'On time', n: true, get: r => bar(r.f.onTime, 100, F.pct(r.f.onTime, 1)) },
  ],
  tech: [
    { name: 'ARR', n: true, get: r => F.money(r.f.arr) },
    { name: 'New ARR', n: true, get: r => F.money(r.f.newArr) },
    { name: 'Churn', n: true, get: r => `<span class="delta down">${F.money(r.f.churn)}</span>` },
    { name: 'Seats', n: true, get: r => F.num(r.f.seats) },
    { name: 'CAC', n: true, get: r => F.exact(r.f.cac) },
    { name: 'Gross margin', n: true, get: r => F.pct(r.f.gm, 1) },
  ],
};

function bar(v, max, label) {
  const w = max ? Math.min(100, Math.max(0, v / max * 100)) : 0;
  return `<span style="display:flex;align-items:center;gap:7px;justify-content:flex-end">
    <span class="bar-cell" style="width:62px"><i style="width:${w.toFixed(0)}%"></i></span>
    <span class="nowrap">${label}</span></span>`;
}

/* ------------------------------------------------------------------- home */

export function home(ctx) {
  const { q, s } = ctx;
  const ind = s.industry;
  const rows = q.unitRows();
  const w = q.window();
  const name = (ind.pages && ind.pages['ops-home'] && ind.pages['ops-home'].name) || 'Operations';

  const byStatus = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  const ranked = rows.map(r => ({
    name: r.short || r.name,
    value: headlineOf(q, r, ind, w),
    id: r.id,
  })).sort((a, b) => b.value - a.value);

  const flagged = flags(q, rows, ind);

  return U.verdict({
    title: opsVerdict(ctx, rows, flagged),
    body: `${esc(ind.tagline)}. ${rows.length} ${esc(ind.unit.many)} in scope, ` +
      Object.entries(byStatus).map(([k, v]) => `${v} ${esc(k.toLowerCase())}`).join(', ') + '.',
    figs: headFigs(q, s, ind),
  }) + `<div class="grid">` +
    U.panel({
      col: 7, title: `${esc(ind.unit.collection)} by size`,
      note: `Revenue over the window, largest first. Click a row to open it.`,
      body: C.hbars({
        rows: ranked.slice(0, 12).map(r => ({ name: r.name, value: r.value })),
        fmt: v => F.money(v),
      }),
    }) +
    U.panel({
      col: 5, title: 'What needs a look',
      note: flagged.length ? 'Each line is a rule, not an opinion.' : 'Nothing is outside its band.',
      body: flagged.length
        ? `<div class="rows">${flagged.map(f => `
          <div class="row-item" data-click="unit:${esc(f.id)}" style="cursor:pointer">
            <span class="tag ${f.kind}"><i class="dot"></i>${esc(f.tag)}</span>
            <span class="grow"><b>${esc(f.name)}</b><div class="sub">${f.why}</div></span>
          </div>`).join('')}</div>`
        : `<div class="empty">Every ${esc(ind.unit.one)} is inside its band this month.</div>`,
      foot: `${flagged.length} of ${rows.length} ${esc(ind.unit.many)} flagged.`,
    }) +
    U.panel({
      col: 12, title: 'The whole picture, month by month',
      body: C.line({
        series: [{ name: headlineName(ind), values: q.months.slice(-18).map(m => headlineTotal(q, ind, m)) }],
        labels: q.months.slice(-18).map(mN), fmt: v => headlineFmt(ind, v), height: 240, legend: false,
      }),
    }) + `</div>`;
}

function headFigs(q, s, ind) {
  return ind.kpis.slice(0, 4).map(id => {
    const k = q.kpi(id);
    return { label: k.label, value: U.display(k) };
  });
}

function opsVerdict(ctx, rows, flagged) {
  const { q, s } = ctx;
  const ind = s.industry;
  const k = q.kpi(ind.headline.metric);
  const lead = `${esc(ind.headline.label)} is <b>${U.display(k)}</b>`;
  if (!flagged.length) return `${lead}, and every ${esc(ind.unit.one)} is inside its band.`;
  const first = flagged[0];
  return `${lead}. <b>${esc(first.name)}</b> is the one to look at: ${first.why}` +
    (flagged.length > 1 ? ` ${flagged.length - 1} other${flagged.length > 2 ? 's' : ''} are flagged.` : '');
}

function headlineOf(q, r, ind, w) {
  let t = 0;
  for (const m of w) t += q.fact(r.id, 'rev', m) || 0;
  return Math.round(t * 100) / 100;
}

function headlineName(ind) {
  return { construction: 'Earned revenue', education: 'Students enrolled', retail: 'Net sales',
    industrial: 'Units produced', logistics: 'Miles', tech: 'ARR' }[ind.id];
}

function headlineTotal(q, ind, m) {
  const key = { construction: 'rev', education: 'enrolled', retail: 'sales',
    industrial: 'produced', logistics: 'miles', tech: 'arr' }[ind.id];
  return q.factSum(key, [m]);
}

function headlineFmt(ind, v) {
  return ['education', 'industrial', 'logistics'].includes(ind.id) ? F.num(v) : F.money(v);
}

/* Rules, per industry. A flag names the figure that tripped it. */
function flags(q, rows, ind) {
  const out = [];
  const month = q.view.month;
  for (const r of rows) {
    const f = r.f || {};
    const add = (tag, kind, why) => out.push({ id: r.id, name: r.name, tag, kind, why });
    if (ind.id === 'construction') {
      const p = (f.pct || 0) / 100;
      const proj = p > 0.05 ? (f.cost || 0) / p : 0;
      if (proj && f.estCost && proj > f.estCost * 1.05) {
        add('Overrun', 'bad', `projected to finish <b>${F.money(proj - f.estCost)}</b> over the estimate`);
      } else if ((f.earned || 0) - (f.billed || 0) > (f.contract || 0) * 0.04) {
        add('Under-billed', 'warn', `<b>${F.money(f.earned - f.billed)}</b> of work is done and not invoiced`);
      }
    } else if (ind.id === 'education') {
      const fill = f.capacity ? f.enrolled / f.capacity : 1;
      if (fill < 0.7 || fill < 0.85) {
        add('Seats empty', fill < 0.7 ? 'bad' : 'warn',
          `<b>${F.num(f.capacity - f.enrolled)}</b> seats open at
           <b>${F.pct(fill * 100, 0)}</b> full, worth
           <b>${F.money((f.capacity - f.enrolled) * (f.funding || 0))}</b> of funding`);
      }
    } else if (ind.id === 'retail') {
      if (f.margin && f.margin < ind.model.gm * 100 - 6) {
        add('Margin down', 'bad', `margin of <b>${F.pct(f.margin)}</b> against a company
          ${F.pct(ind.model.gm * 100)}`);
      }
    } else if (ind.id === 'industrial') {
      if (f.oee && f.oee < 62) add('Downtime', 'bad', `OEE of <b>${F.pct(f.oee)}</b>, with
        <b>${F.num((f.hoursAvl || 0) - (f.hoursRun || 0), 0)}</b> hours lost`);
      else if (f.produced && f.scrap / f.produced > 0.04) {
        add('Scrap', 'warn', `scrap at <b>${F.pct(f.scrap / f.produced * 100)}</b>`);
      }
    } else if (ind.id === 'logistics') {
      const rpm = f.miles ? f.linehaul / f.miles : 0;
      const cpm = f.miles ? (f.fuel + f.maint) / f.miles : 0;
      if (rpm && cpm / rpm > 0.42) {
        add('Cost per mile', 'bad', `fuel and maintenance are <b>${F.pct(cpm / rpm * 100, 0)}</b>
          of the revenue the truck earns`);
      } else if (f.onTime && f.onTime < 90) {
        add('Service', 'warn', `on time <b>${F.pct(f.onTime)}</b>`);
      }
    } else if (ind.id === 'tech') {
      if (f.arr && f.churn / f.arr > 0.014) {
        add('Churn', 'bad', `<b>${F.money(f.churn)}</b> churned this month, which is
          <b>${F.pct(f.churn / f.arr * 100, 2)}</b> of the product’s ARR`);
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ units */

export function units(ctx) {
  const { q, s } = ctx;
  const ind = s.industry;
  const cols = COLUMNS[ind.id] || [];
  const rows = q.unitRows();
  const name = (ind.pages && ind.pages['ops-units'] && ind.pages['ops-units'].name) || ind.unit.collection;

  return U.pageHead({
    eyebrow: 'Operations',
    title: name,
    motif: motif(ind.id, s.data.brand.palette),
    answer: `Every ${esc(ind.unit.one)} in scope as of <b>${esc(F.monthName(q.view.month, true))}</b>.
      A position is read as of the month, not summed over the window. Click any row for the arithmetic behind it.`,
  }) + U.fresh(q, s) + `<div class="grid">` +
    U.panel({
      col: 12, pad: false,
      right: U.btn('Download', { act: 'export-units', ico: 'download', sm: true }),
      title: `${rows.length} ${esc(ind.unit.many)}`,
      note: `Owner shown as the ${esc((ind.unit.owner || 'manager').toLowerCase())} responsible.`,
      body: U.table({
        maxHeight: '620px',
        cols: [{ name: ind.unit.key, w: '22%' }, { name: 'Status' }, ...cols],
        rows: rows.map(r => ({
          click: `unit:${r.id}`,
          cells: [
            `<b>${esc(r.name)}</b><div class="sub">${esc(r.owner)}</div>`,
            U.statusTag(r.status, statusKind(r.status)),
            ...cols.map(c => c.get(r, ctx)),
          ],
        })),
      }),
    }) + `</div>`;
}

function statusKind(status) {
  if (/complete|closed/i.test(status)) return '';
  if (/shop|hold|beta/i.test(status)) return 'warn';
  return 'good';
}

/* --------------------------------------------------------- second ops page */

export function second(ctx) {
  const { q, s } = ctx;
  const ind = s.industry;
  const name = (ind.pages && ind.pages['ops-second'] && ind.pages['ops-second'].name) || 'Performance';
  const fn = {
    construction: backlog, education: enrolment, retail: category,
    industrial: throughput, logistics: lanes, tech: retention,
  }[ind.id] || backlog;
  return U.pageHead({ eyebrow: 'Operations', title: name, answer: fn.answer(ctx),
    motif: motif(ind.id, s.data.brand.palette) })
    + U.fresh(q, s) + `<div class="grid">${fn(ctx)}</div>`;
}

/* --- construction: backlog and schedule */
function backlog(ctx) {
  const { q, s } = ctx;
  const rows = q.unitRows().filter(r => r.status !== 'Complete');
  const remaining = rows.map(r => ({
    name: r.short || r.name,
    value: (r.f.contract || 0) - (r.f.earned || 0),
    note: F.pct(r.f.pct, 0),
    id: r.id,
  })).sort((a, b) => b.value - a.value);
  const total = remaining.reduce((a, r) => a + r.value, 0);
  const burn = q.factSum('rev', q.months.slice(-3)) / 3;

  return U.panel({
    col: 7, title: 'Backlog by job',
    note: 'What is left to earn on each open contract, and how far through it is.',
    body: C.hbars({ rows: remaining, fmt: v => F.money(v) }),
    foot: `At the last three months’ pace of ${F.money(burn)} a month, the backlog is
      ${F.num(burn ? total / burn : 0, 1)} months of work.`,
  }) + U.panel({
    col: 5, title: 'Completion spread',
    note: 'Where the open contracts sit. A cluster near the end means revenue falls off unless the pipeline lands.',
    body: C.bars({
      values: [0, 0, 0, 0, 0].map((_, i) =>
        rows.filter(r => (r.f.pct || 0) >= i * 20 && (r.f.pct || 0) < (i + 1) * 20).length),
      labels: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
      fmt: v => F.num(v), height: 230, negativeOk: false,
    }),
  }) + U.panel({
    col: 12, title: 'Billing against work done',
    note: 'A bar above the line is billed ahead of the work, below it is work not yet invoiced.',
    body: C.hbars({
      rows: q.unitRows().map(r => ({
        name: r.short || r.name, value: (r.f.billed || 0) - (r.f.earned || 0),
      })).sort((a, b) => a.value - b.value),
      fmt: v => F.money(v),
    }),
  });
}
backlog.answer = ctx => {
  const { q } = ctx;
  const open = q.unitRows().filter(r => r.status !== 'Complete');
  const total = open.reduce((a, r) => a + (r.f.contract || 0) - (r.f.earned || 0), 0);
  const burn = q.factSum('rev', q.months.slice(-3)) / 3;
  return `<b>${F.money(total)}</b> of contracted work is still to be earned across
    <b>${open.length}</b> open contracts, which at the current pace is
    <b>${F.num(burn ? total / burn : 0, 1)} months</b> of revenue.`;
};

/* --- education: enrolment */
function enrolment(ctx) {
  const { q } = ctx;
  const rows = q.unitRows();
  const months = q.months.slice(-24);
  return U.panel({
    col: 7, title: 'Enrolment by campus',
    note: 'Enrolled against seats. The gap is funding not collected.',
    body: C.hbars({
      rows: rows.map(r => ({
        name: r.short, value: r.f.enrolled || 0, mark: r.f.capacity,
        note: F.pct(r.f.capacity ? r.f.enrolled / r.f.capacity * 100 : 0, 0),
        color: (r.f.enrolled / (r.f.capacity || 1)) < 0.85 ? 'var(--warn)' : 'var(--accent)',
      })),
      fmt: v => F.num(v), max: Math.max(...rows.map(r => r.f.capacity || 0)),
    }),
    foot: 'The tick on each bar is that campus’s capacity.',
  }) + U.panel({
    col: 5, title: 'Cost against funding, per student',
    note: 'A campus below the line costs more to run than it is funded for.',
    body: C.scatter({
      points: rows.map(r => ({ name: r.name, x: r.f.funding || 0, y: r.f.costPer || 0 })),
      xFmt: v => F.exact(v), yFmt: v => F.exact(v),
      xLabel: 'Funding per student', yLabel: 'Cost per student', height: 300,
    }),
  }) + U.panel({
    col: 12, title: 'Enrolment over two years',
    body: C.line({
      series: [
        { name: 'Enrolled', values: months.map(m => q.factSum('enrolled', [m])) },
        { name: 'Seats', values: months.map(m => q.factSum('capacity', [m])), dash: true, area: false },
      ],
      labels: months.map(mN), fmt: v => F.num(v), height: 240,
    }),
  });
}
enrolment.answer = ctx => {
  const { q } = ctx;
  const e = q.factAt('enrolled'), c = q.factAt('capacity');
  const low = q.unitRows().filter(r => r.f.capacity && r.f.enrolled / r.f.capacity < 0.85);
  return `<b>${F.num(e)}</b> of <b>${F.num(c)}</b> seats are filled.
    ${low.length ? `<b>${low.length}</b> ${low.length === 1 ? 'campus is' : 'campuses are'} under 85%, worth
      <b>${F.money(low.reduce((a, r) => a + (r.f.capacity - r.f.enrolled) * (r.f.funding || 0), 0))}</b>
      of funding.` : 'Every campus is above 85% full.'}`;
};

/* --- retail: category and basket */
function category(ctx) {
  const { q } = ctx;
  const rows = q.unitRows();
  const months = q.months.slice(-18);
  return U.panel({
    col: 6, title: 'Sales per square foot',
    note: 'Annualised, selling area only, so a flagship and a mall unit can be compared.',
    body: C.hbars({
      rows: rows.filter(r => r.f.sqft).map(r => ({
        name: r.short, value: r.f.sales * 12 / r.f.sqft, note: r.format,
      })).sort((a, b) => b.value - a.value),
      fmt: v => F.exact(v),
    }),
  }) + U.panel({
    col: 6, title: 'Traffic against conversion',
    note: 'A store with traffic and no conversion is a different problem from one with neither.',
    body: C.scatter({
      points: rows.filter(r => r.f.sqft).map(r => ({ name: r.name, x: r.f.traffic || 0, y: r.f.conv || 0 })),
      xFmt: v => F.num(v), yFmt: v => F.pct(v, 0),
      xLabel: 'Visitors', yLabel: 'Conversion', height: 290,
    }),
  }) + U.panel({
    col: 12, title: 'Sales and margin together',
    body: C.line({
      series: [
        { name: 'Net sales', values: months.map(m => q.factSum('sales', [m])) },
      ],
      labels: months.map(mN), fmt: v => F.money(v), height: 230, legend: false,
    }),
    foot: 'The seasonal peak is November and December, which is why a month-on-month read is misleading here and a year-on-year read is not.',
  });
}
category.answer = ctx => {
  const { q } = ctx;
  const sp = q.kpi('salesPerSqft'), bk = q.kpi('basket');
  const rows = q.unitRows().filter(r => r.f.sqft);
  const best = rows.slice().sort((a, b) => (b.f.sales / b.f.sqft) - (a.f.sales / a.f.sqft))[0];
  return `The estate trades at <b>${F.exact(sp.value)}</b> per square foot on a
    <b>${F.exact(bk.value, 2)}</b> basket. <b>${esc(best ? best.name : '')}</b> is the densest at
    <b>${F.exact(best ? best.f.sales * 12 / best.f.sqft : 0)}</b>.`;
};

/* --- industrial: throughput */
function throughput(ctx) {
  const { q } = ctx;
  const rows = q.unitRows();
  const months = q.months.slice(-18);
  const lost = rows.reduce((a, r) => a + ((r.f.hoursAvl || 0) - (r.f.hoursRun || 0)), 0);
  return U.panel({
    col: 7, title: 'OEE by line',
    note: 'Availability times quality. The mark is the plant target of 80%.',
    body: C.hbars({
      rows: rows.map(r => ({
        name: r.short, value: r.f.oee || 0, mark: 80, note: r.plant,
        color: (r.f.oee || 0) < 62 ? 'var(--bad)' : ((r.f.oee || 0) < 75 ? 'var(--warn)' : 'var(--good)'),
      })).sort((a, b) => a.value - b.value),
      fmt: v => F.pct(v, 1), max: 100,
    }),
    foot: `<b>${F.num(lost, 0)}</b> machine hours were available and not run this month.`,
  }) + U.panel({
    col: 5, title: 'Scrap against cost per unit',
    note: 'Scrap and unit cost move together, which is the argument for fixing quality before buying capacity.',
    body: C.scatter({
      points: rows.map(r => ({
        name: r.name, x: r.f.produced ? r.f.scrap / r.f.produced * 100 : 0, y: r.f.cpu || 0,
      })),
      xFmt: v => F.pct(v, 1), yFmt: v => F.exact(v, 2),
      xLabel: 'Scrap rate', yLabel: 'Cost per unit', height: 300,
    }),
  }) + U.panel({
    col: 12, title: 'Units produced and scrapped',
    body: C.stack({
      rows: months.map(m => ({ good: q.factSum('produced', [m]) - q.factSum('scrap', [m]), scrap: q.factSum('scrap', [m]) })),
      keys: ['good', 'scrap'], names: { good: 'Good units', scrap: 'Scrap' },
      labels: months.map(mN), fmt: v => F.num(v), height: 240,
    }),
  });
}
throughput.answer = ctx => {
  const { q } = ctx;
  const o = q.kpi('oee'), sc = q.kpi('scrapRate');
  const worst = q.unitRows().slice().sort((a, b) => (a.f.oee || 0) - (b.f.oee || 0))[0];
  return `The lines ran at <b>${F.pct(o.value)}</b> effectiveness with
    <b>${F.pct(sc.value)}</b> scrap. <b>${esc(worst ? worst.name : '')}</b> is the constraint at
    <b>${F.pct(worst ? worst.f.oee : 0)}</b>, which is
    <b>${F.num(worst ? (worst.f.hoursAvl - worst.f.hoursRun) : 0, 0)}</b> hours lost in the month.`;
};

/* --- logistics: lanes and service */
function lanes(ctx) {
  const { q } = ctx;
  const rows = q.unitRows();
  const byLane = {};
  for (const r of rows) {
    const l = r.lane || 'Unassigned';
    byLane[l] ||= { miles: 0, rev: 0, loads: 0, cost: 0 };
    byLane[l].miles += r.f.miles || 0;
    byLane[l].rev += r.f.linehaul || 0;
    byLane[l].loads += r.f.loads || 0;
    byLane[l].cost += (r.f.fuel || 0) + (r.f.maint || 0);
  }
  const laneRows = Object.entries(byLane).map(([name, v]) => ({
    name, value: v.miles ? v.rev / v.miles : 0,
    note: `${F.num(v.loads)} loads`,
    color: (v.miles ? v.rev / v.miles : 0) < 2.1 ? 'var(--warn)' : 'var(--accent)',
  })).sort((a, b) => b.value - a.value);

  return U.panel({
    col: 6, title: 'Revenue per mile by lane',
    note: `A lane under ${F.exact(2.1, 2)} is not paying for itself once overhead is counted.`,
    body: C.hbars({ rows: laneRows, fmt: v => F.exact(v, 2) }),
  }) + U.panel({
    col: 6, title: 'Deadhead against revenue per mile',
    note: 'Empty miles are the cheapest margin available: they cost fuel and earn nothing.',
    body: C.scatter({
      points: rows.map(r => ({
        name: r.name, x: r.f.deadhead || 0, y: r.f.miles ? r.f.linehaul / r.f.miles : 0,
      })),
      xFmt: v => F.pct(v, 0), yFmt: v => F.exact(v, 2),
      xLabel: 'Deadhead', yLabel: 'Revenue per mile', height: 290,
    }),
  }) + U.panel({
    col: 12, title: 'Trucks ranked by what they keep',
    note: 'Revenue per mile less fuel and maintenance per mile. Before overhead.',
    body: C.hbars({
      rows: rows.map(r => ({
        name: r.short,
        value: r.f.miles ? (r.f.linehaul - r.f.fuel - r.f.maint) / r.f.miles : 0,
        note: `${F.num(r.f.miles)} mi`,
      })).sort((a, b) => a.value - b.value),
      fmt: v => F.exact(v, 2),
    }),
  });
}
lanes.answer = ctx => {
  const { q } = ctx;
  const rpm = q.kpi('revPerMile'), dh = q.kpi('deadhead'), ot = q.kpi('onTime');
  return `Every mile earned <b>${F.exact(rpm.value, 2)}</b>, with
    <b>${F.pct(dh.value)}</b> of miles run empty and
    <b>${F.pct(ot.value)}</b> of loads delivered on time.
    Taking deadhead down a single point is worth
    <b>${F.money(q.factSum('miles', q.window()) * 0.01 * rpm.value)}</b> over this window.`;
};

/* --- tech: retention */
function retention(ctx) {
  const { q } = ctx;
  const months = q.months.slice(-24);
  const rows = q.unitRows();
  return U.panel({
    col: 7, title: 'ARR movement',
    note: 'New against churned, month by month. The net is what the business actually gained.',
    body: C.stack({
      rows: months.map(m => ({ newArr: q.factSum('newArr', [m]), churn: q.factSum('churn', [m]) })),
      keys: ['newArr', 'churn'], names: { newArr: 'New ARR', churn: 'Churned ARR' },
      labels: months.map(mN), fmt: v => F.money(v), height: 250,
    }),
  }) + U.panel({
    col: 5, title: 'By product',
    note: 'ARR and the churn running against it.',
    body: C.hbars({
      rows: rows.map(r => ({
        name: r.short, value: r.f.arr || 0,
        note: F.pct(r.f.arr ? r.f.churn / r.f.arr * 100 : 0, 2) + ' churn',
      })).sort((a, b) => b.value - a.value),
      fmt: v => F.money(v),
    }),
  }) + U.panel({
    col: 12, title: 'ARR and seats',
    body: C.line({
      series: [
        { name: 'ARR', values: months.map(m => q.factSum('arr', [m])) },
      ],
      labels: months.map(mN), fmt: v => F.money(v), height: 230, legend: false,
    }),
    foot: `Seats stand at ${F.num(q.factAt('seats'))}, which is
      ${F.exact(q.factAt('seats') ? q.factAt('arr') / q.factAt('seats') : 0)} of ARR each.`,
  });
}
retention.answer = ctx => {
  const { q } = ctx;
  const nrr = q.kpi('nrr'), arr = q.kpi('arr'), cac = q.kpi('cacPayback');
  return `ARR of <b>${F.money(arr.value)}</b> at <b>${F.pct(nrr.value, 0)}</b> net retention.
    A customer pays back its acquisition cost in <b>${F.num(cac.value, 1)} months</b>.`;
};

/* ------------------------------------------------------------------ detail */

export function detail(ctx) {
  const { q, s, arg } = ctx;
  const ind = s.industry;
  const u = q.units.find(x => x.id === arg) || q.allUnits.find(x => x.id === arg);
  if (!u) {
    return U.pageHead({ eyebrow: 'Operations', title: 'Not in scope' }) +
      `<section class="panel"><div class="empty">That ${esc(ind.unit.one)} is not in this
      view level\u2019s scope. A unit-scoped role sees only its own.</div></section>`;
  }
  const month = q.view.month;
  const prevMonth = q.months[Math.max(0, q.months.indexOf(month) - 1)];
  const f = (q.uf[month] || {})[u.id] || {};
  const prev = (q.uf[prevMonth] || {})[u.id] || {};
  const months = q.months.slice(-18);
  const measures = ind.measures;
  const verdictText = unitVerdict(q, u, f, ind);
  const entity = (q.entities.find(e => e.id === u.entity) || {}).name || u.entity;

  const fmtOf = m => v => m.unit === 'usd' ? F.money(v)
    : m.unit === 'pct' ? F.pct(v, 1) : F.num(v);

  return U.verdict({
    title: verdictText.title,
    body: verdictText.body,
    figs: measures.slice(0, 4).map(m => ({
      label: m.name, value: fmtOf(m)(f[m.id]),
    })),
  }) + `<div class="grid">` +

    /* the chain that produces this unit's result, as a bridge */
    U.panel({
      col: 7, title: 'How it arrives',
      note: 'The arithmetic behind the headline, in the order it happens.',
      body: C.waterfall({ items: chain(u, f, ind), fmt: v => F.money(v), height: 260 }),
      foot: chainNote(u, f, ind),
    }) +

    U.panel({
      col: 5, title: 'This month against last', pad: false,
      note: `${esc(F.monthName(month, true))} beside ${esc(F.monthName(prevMonth, true))}.`,
      body: U.table({
        cols: [{ name: 'Measure' }, { name: 'Now', n: true }, { name: 'Last', n: true },
        { name: 'Change', n: true }],
        rows: measures.map(m => {
          const now = f[m.id], was = prev[m.id];
          const pc = Number.isFinite(now) && Number.isFinite(was) && was !== 0
            ? (now - was) / Math.abs(was) * 100 : NaN;
          return {
            cells: [esc(m.name), fmtOf(m)(now), fmtOf(m)(was), F.deltaTag(pc)],
          };
        }),
      }),
      foot: `${esc(u.status)} \u00b7 ${esc(u.owner)} \u00b7 booked to ${esc(entity)}`,
    }) +

    U.panel({
      col: 12, title: 'Eighteen months',
      note: 'Every measure this ' + esc(ind.unit.one) + ' carries, on its own scale.',
      body: C.multiples({
        rows: measures.map(m => ({
          name: m.name,
          fmt: fmtOf(m),                 /* each measure keeps its own units */
          values: months.map(mm => q.fact(u.id, m.id, mm) ?? null),
        })),
        fmt: v => F.num(v, 0), labels: months.map(mN), shared: false,
      }),
    }) +

    U.panel({
      col: 12, title: `Against the other ${esc(ind.unit.many)}`,
      note: 'This one is marked. A single figure means little without the spread it sits in.',
      body: C.hbars({
        rows: q.unitRows().map(r => ({
          name: r.short || r.name,
          value: r.f.rev || 0,
          color: r.id === u.id ? 'var(--accent)' : 'var(--rule)',
          note: r.id === u.id ? 'this one' : '',
        })).sort((a, b) => b.value - a.value),
        fmt: v => F.money(v),
      }),
      foot: (() => {
        const rows = q.unitRows().map(r => r.f.rev || 0).sort((a, b) => b - a);
        const mine = f.rev || 0;
        const rank = rows.indexOf(mine) + 1;
        return rank > 0
          ? `Ranked ${rank} of ${rows.length} by revenue this month.`
          : 'Not carrying revenue this month.';
      })(),
    }) + `</div>`;
}

/* The chain from the top line to what is left, per industry. Every step is a
   figure the page already shows elsewhere, so a reader can check it. */
function chain(u, f, ind) {
  switch (ind.id) {
    case 'construction': {
      const pct = (f.pct || 0) / 100;
      const cost = f.cost || 0;
      return [
        { name: 'Contract', value: f.contract || 0, total: true },
        { name: 'Not yet earned', value: -((f.contract || 0) - (f.earned || 0)) },
        { name: 'Earned', value: f.earned || 0, total: true },
        { name: 'Cost to date', value: -cost },
        { name: 'Margin so far', value: (f.earned || 0) - cost, total: true },
      ];
    }
    case 'education': {
      const rev = (f.enrolled || 0) * (f.funding || 0);
      const cost = (f.enrolled || 0) * (f.costPer || 0);
      return [
        { name: 'Seats', value: (f.capacity || 0) * (f.funding || 0), total: true },
        { name: 'Empty seats', value: -(((f.capacity || 0) - (f.enrolled || 0)) * (f.funding || 0)) },
        { name: 'Funding', value: rev, total: true },
        { name: 'Cost to run', value: -cost },
        { name: 'Left over', value: rev - cost, total: true },
      ];
    }
    case 'retail': {
      const sales = f.sales || 0;
      const cogs = sales * (1 - (f.margin || 0) / 100);
      return [
        { name: 'Net sales', value: sales, total: true },
        { name: 'Cost of goods', value: -cogs },
        { name: 'Gross profit', value: sales - cogs, total: true },
      ];
    }
    case 'industrial': {
      const made = (f.produced || 0) - (f.scrap || 0);
      const cpu = f.cpu || 0;
      return [
        { name: 'Produced', value: (f.produced || 0) * cpu, total: true },
        { name: 'Scrapped', value: -((f.scrap || 0) * cpu) },
        { name: 'Good output', value: made * cpu, total: true },
      ];
    }
    case 'logistics': {
      const rev = f.linehaul || 0;
      return [
        { name: 'Linehaul', value: rev, total: true },
        { name: 'Fuel', value: -(f.fuel || 0) },
        { name: 'Maintenance', value: -(f.maint || 0) },
        { name: 'Before overhead', value: rev - (f.fuel || 0) - (f.maint || 0), total: true },
      ];
    }
    default: {
      const arr = f.arr || 0;
      return [
        { name: 'ARR a year ago', value: arr - (f.newArr || 0) + (f.churn || 0), total: true },
        { name: 'New', value: f.newArr || 0 },
        { name: 'Churned', value: -(f.churn || 0) },
        { name: 'ARR now', value: arr, total: true },
      ];
    }
  }
}

function chainNote(u, f, ind) {
  switch (ind.id) {
    case 'construction':
      return `Cost is to date, not at completion, so the margin here is what the job has
        banked rather than what it will finish on.`;
    case 'education':
      return `An empty seat costs the same to keep as a full one, which is why the gap is
        drawn as money rather than as a count.`;
    case 'retail':
      return `Before store payroll and occupancy, which sit in overhead rather than on the store.`;
    case 'industrial':
      return `Scrap is priced at the same unit cost as good output, because it consumed it.`;
    case 'logistics':
      return `Fuel and maintenance only. Driver pay, insurance and overhead sit above this.`;
    default:
      return `Expansion is counted inside new ARR, a stated sample assumption rather than a
        reading from a billing system.`;
  }
}

function unitVerdict(q, u, f, ind) {
  const name = esc(u.name);
  switch (ind.id) {
    case 'construction': {
      const p = (f.pct || 0) / 100;
      const proj = p > 0.05 ? (f.cost || 0) / p : (f.estCost || 0);
      const v = proj - (f.estCost || 0);
      const ou = (f.billed || 0) - (f.earned || 0);
      return {
        title: `${name} is <b>${F.pct(f.pct, 0)}</b> complete and projected to finish
          <b>${F.money(Math.abs(v))}</b> ${v > 0 ? 'over' : 'under'} its estimate.`,
        body: `Of a <b>${F.money(f.contract)}</b> contract, <b>${F.money(f.earned)}</b> has been earned and
          <b>${F.money(f.billed)}</b> invoiced, so billing is
          ${ou >= 0 ? `<b>${F.money(ou)}</b> ahead of the work` : `<b>${F.money(-ou)}</b> behind it`}.`,
      };
    }
    case 'education':
      return {
        title: `${name} has <b>${F.num(f.enrolled)}</b> of <b>${F.num(f.capacity)}</b> seats filled.`,
        body: `Funding runs <b>${F.exact(f.funding)}</b> a student against
          <b>${F.exact(f.costPer)}</b> of cost, with
          <b>${F.num(f.staff, 1)}</b> staff, or one for every
          <b>${F.num(f.staff ? f.enrolled / f.staff : 0, 1)}</b> students.`,
      };
    case 'retail':
      return {
        title: `${name} sold <b>${F.money(f.sales)}</b> at <b>${F.pct(f.margin)}</b> margin.`,
        body: f.sqft
          ? `That is <b>${F.exact(f.sales * 12 / f.sqft)}</b> per square foot annualised, from
             <b>${F.num(f.traffic)}</b> visitors converting at <b>${F.pct(f.conv, 1)}</b>.`
          : `Online, so there is no selling area to divide by.`,
      };
    case 'industrial':
      return {
        title: `${name} ran at <b>${F.pct(f.oee)}</b> and made each unit for <b>${F.exact(f.cpu, 2)}</b>.`,
        body: `<b>${F.num(f.produced)}</b> units produced, <b>${F.num(f.scrap)}</b> scrapped
          (<b>${F.pct(f.produced ? f.scrap / f.produced * 100 : 0, 1)}</b>), over
          <b>${F.num(f.hoursRun, 0)}</b> of <b>${F.num(f.hoursAvl, 0)}</b> available hours.`,
      };
    case 'logistics': {
      const rpm = f.miles ? f.linehaul / f.miles : 0;
      const cpm = f.miles ? (f.fuel + f.maint) / f.miles : 0;
      return {
        title: `${name} earned <b>${F.exact(rpm, 2)}</b> a mile and spent
          <b>${F.exact(cpm, 2)}</b> on fuel and maintenance.`,
        body: `<b>${F.num(f.loads)}</b> loads over <b>${F.num(f.miles)}</b> miles,
          <b>${F.pct(f.deadhead, 1)}</b> of them empty, <b>${F.pct(f.onTime, 1)}</b> delivered on time.`,
      };
    }
    default:
      return {
        title: `${name} carries <b>${F.money(f.arr)}</b> of ARR.`,
        body: `<b>${F.money(f.newArr)}</b> was added and <b>${F.money(f.churn)}</b> churned this month,
          across <b>${F.num(f.seats)}</b> paid seats at a <b>${F.exact(f.cac)}</b> cost to acquire.`,
      };
  }
}



/* ------------------------------------------------------------ the grid page

   Twelve months by unit, as a heatmap and as small multiples. This is the
   view that answers "which one, and since when", which a line chart with
   twenty series cannot. */

const GRID = {
  construction: { key: 'pct', name: 'Percent complete', fmt: v => F.pct(v, 0), good: 'high',
    says: 'how far through each contract is' },
  education: { key: 'enrolled', name: 'Students enrolled', fmt: v => F.num(v), good: 'high',
    says: 'how full each campus has been' },
  retail: { key: 'sales', name: 'Net sales', fmt: v => F.money(v), good: 'high',
    says: 'how each store has traded' },
  industrial: { key: 'oee', name: 'OEE', fmt: v => F.pct(v, 0), good: 'high',
    says: 'how effectively each line has run' },
  logistics: { key: 'onTime', name: 'On time', fmt: v => F.pct(v, 0), good: 'high',
    says: 'how each truck has served' },
  tech: { key: 'arr', name: 'ARR', fmt: v => F.money(v), good: 'high',
    says: 'how each product has grown' },
};

export function grid(ctx) {
  const { q, s } = ctx;
  const ind = s.industry;
  const g = GRID[ind.id] || GRID.construction;
  const months = q.months.slice(-12);
  const units = q.units;
  const name = (ind.pages && ind.pages['ops-grid'] && ind.pages['ops-grid'].name) || 'Performance grid';

  const rows = units.map(u => ({
    name: u.short || u.name,
    click: `unit:${u.id}`,
    values: months.map(m => q.fact(u.id, g.key, m)),
  })).filter(r => r.values.some(Number.isFinite));

  if (!rows.length) {
    return U.pageHead({ eyebrow: 'Operations', title: name, motif: motif(ind.id, s.data.brand.palette) }) +
      `<section class="panel"><div class="empty">No ${esc(ind.unit.many)} in scope carry
       ${esc(g.name.toLowerCase())} over these months.</div></section>`;
  }

  /* who moved, and by how much, over the window */
  const movers = rows.map(r => {
    const vals = r.values.filter(Number.isFinite);
    const from = vals[0], to = vals[vals.length - 1];
    return { name: r.name, from, to, change: to - from,
      pct: from ? (to - from) / Math.abs(from) * 100 : NaN };
  }).sort((a, b) => a.change - b.change);

  const worst = movers[0], best = movers[movers.length - 1];
  const lastCol = rows.map(r => r.values[r.values.length - 1]).filter(Number.isFinite);
  const spread = Math.max(...lastCol) - Math.min(...lastCol);

  return U.pageHead({
    eyebrow: 'Operations',
    title: name,
    motif: motif(ind.id, s.data.brand.palette),
    answer: `Twelve months of <b>${esc(g.name.toLowerCase())}</b>, ${esc(g.says)}.
      <b>${esc(best.name)}</b> improved most (${esc(g.fmt(best.from))} to <b>${esc(g.fmt(best.to))}</b>)
      and <b>${esc(worst.name)}</b> moved the other way
      (${esc(g.fmt(worst.from))} to <b>${esc(g.fmt(worst.to))}</b>).
      The spread across ${esc(ind.unit.many)} this month is <b>${esc(g.fmt(spread))}</b>.`,
  }) + U.fresh(q, s) + `<div class="grid">` +
    U.panel({
      col: 12, title: `${esc(g.name)} by ${esc(ind.unit.one)}, month by month`,
      note: 'One cell per reading, darker for higher. Click a row to open it.',
      body: C.heatmap({
        rows, cols: months.map(m => F.monthName(m).split(' ')[0]),
        fmt: g.fmt, label: g.name.toLowerCase(), good: g.good,
      }),
      foot: `${rows.length} ${esc(ind.unit.many)} over ${months.length} months to
        ${esc(F.monthName(months[months.length - 1], true))},
        ${F.num(rows.length * months.length)} readings. Color says more or less, not better
        or worse: these measures carry no target.`,
    }) +
    U.panel({
      col: 7, title: `Each ${esc(ind.unit.one)} on one scale`,
      note: 'Every chart shares an axis, so the shapes can be compared rather than only read.',
      body: C.multiples({
        rows: rows.map(r => ({ ...r, note: '' })),
        fmt: g.fmt, labels: months.map(mN),
      }),
    }) +
    U.panel({
      col: 5, title: 'What moved', pad: false,
      note: `From ${esc(F.monthName(months[0], true))} to ${esc(F.monthName(months[months.length - 1], true))}.`,
      body: U.table({
        cols: [{ name: ind.unit.key }, { name: 'Then', n: true }, { name: 'Now', n: true },
        { name: 'Change', n: true }],
        rows: movers.slice().reverse().map(m => ({
          cells: [esc(m.name), g.fmt(m.from), g.fmt(m.to),
          F.deltaTag(m.pct, { invert: g.good !== 'high' })],
        })),
      }),
    }) + `</div>`;
}



/* =========================================================================
   Three more places in Operations. Each has a job: what needs attention,
   who is carrying it, and what the calendar does to it.
   ========================================================================= */

/* The rules each industry runs, said in words. A dashboard that flags things
   without saying what it flags on is asking to be trusted rather than read. */
const RULES = {
  construction: [
    'Projected cost at completion more than 5% over the estimate',
    'More than 4% of the contract earned and not yet invoiced',
  ],
  education: ['A campus under 70% of its seats, which is serious',
    'A campus under 85% of its seats'],
  retail: ['Margin more than 6 points under the company'],
  industrial: ['OEE under 62%', 'Scrap over 4% of what was produced'],
  logistics: [
    'Fuel and maintenance over 42% of what the truck earns',
    'On time under 90%',
  ],
  tech: ['Monthly churn over 1.4% of the product’s ARR'],
};

export function watch(ctx) {
  const { q, s } = ctx;
  const ind = s.industry;
  const rows = q.unitRows();
  const found = flags(q, rows, ind);
  const bad = found.filter(f => f.kind === 'bad');
  const warn = found.filter(f => f.kind === 'warn');
  const byTag = {};
  for (const f of found) (byTag[f.tag] ||= []).push(f);

  return U.verdict({
    title: found.length
      ? `<b>${found.length}</b> of <b>${rows.length}</b> ${esc(ind.unit.many)} are outside their
         band, <b>${bad.length}</b> of them badly.`
      : `Every one of <b>${rows.length}</b> ${esc(ind.unit.many)} is inside its band this month.`,
    body: found.length
      ? `Each line is a rule, not an opinion, and the rules are listed below. Click any
         ${esc(ind.unit.one)} to see the arithmetic that tripped it.`
      : `The rules are listed below, so an empty list can be read rather than taken on trust.`,
    figs: [
      { label: 'Flagged', value: String(found.length) },
      { label: 'Serious', value: String(bad.length) },
      { label: 'Worth a look', value: String(warn.length) },
      { label: `Clear`, value: String(rows.length - found.length) },
    ],
  }) + `<div class="grid">` +
    U.panel({
      col: 8, title: 'What tripped',
      note: found.length ? 'Grouped by rule, worst first.' : '',
      body: found.length
        ? Object.entries(byTag).sort((a, b) =>
            (b[1][0].kind === 'bad' ? 1 : 0) - (a[1][0].kind === 'bad' ? 1 : 0))
          .map(([tag, list]) => `
            <h4 style="margin:14px 0 8px;font-size:13.5px">${U.statusTag(tag, list[0].kind)}
              <span class="muted" style="font-weight:400">${list.length}
              ${list.length === 1 ? esc(ind.unit.one) : esc(ind.unit.many)}</span></h4>
            <div class="rows">${list.map(f => `
              <div class="row-item" data-click="unit:${esc(f.id)}" style="cursor:pointer">
                <span class="grow"><b>${esc(f.name)}</b><div class="sub">${f.why}</div></span>
                ${icon('arrow', 15)}
              </div>`).join('')}</div>`).join('')
        : `<div class="empty">Nothing is outside its band. The month is clean.</div>`,
    }) +
    U.panel({
      col: 4, title: 'The rules',
      note: `What this ${esc(ind.unit.one)} list is tested against.`,
      body: `<ol class="steps">${(RULES[ind.id] || []).map(r =>
        `<li>${esc(r)}</li>`).join('')}</ol>`,
      foot: `A company sets its own thresholds at deployment. These are the build’s, and
        the page says so rather than implying they are yours.`,
    }) + `</div>`;
}

/* ------------------------------------------------------------ who carries */

export function people(ctx) {
  const { q, s } = ctx;
  const ind = s.industry;
  const w = q.window();
  const rows = q.unitRows();
  const found = flags(q, rows, ind);
  const flagged = new Set(found.map(f => f.id));

  const byOwner = {};
  for (const r of rows) {
    const o = (byOwner[r.owner] ||= { name: r.owner, units: 0, rev: 0, flags: 0, names: [] });
    o.units += 1;
    o.names.push(r.short || r.name);
    o.flags += flagged.has(r.id) ? 1 : 0;
    for (const m of w) o.rev += q.fact(r.id, 'rev', m) || 0;
  }
  const owners = Object.values(byOwner).sort((a, b) => b.rev - a.rev);
  if (!owners.length) {
    return U.pageHead({ eyebrow: 'Operations', title: 'Who carries what' }) +
      `<section class="panel"><div class="empty">Nothing is assigned in this scope.</div></section>`;
  }
  const most = owners[0], least = owners[owners.length - 1];
  const name = (ind.pages && ind.pages['ops-people'] && ind.pages['ops-people'].name) || 'Who carries what';
  const avg = owners.reduce((a, o) => a + o.rev, 0) / owners.length;

  return U.pageHead({
    eyebrow: 'Operations',
    title: name,
    motif: motif(ind.id, s.data.brand.palette),
    answer: `<b>${owners.length}</b> people carry <b>${rows.length}</b> ${esc(ind.unit.many)}
      between them. <b>${esc(most.name)}</b> carries the most at <b>${F.money(most.rev)}</b>
      over the window, <b>${esc(least.name)}</b> the least at <b>${F.money(least.rev)}</b>,
      and the spread between them is <b>${F.ratio(least.rev ? most.rev / least.rev : 0)}</b>.
      ${found.length ? `<b>${found.length}</b> flagged ${found.length === 1
        ? esc(ind.unit.one) : esc(ind.unit.many)} sit across
        <b>${owners.filter(o => o.flags).length}</b> of them.` : ''}`,
  }) + U.fresh(q, s) + `<div class="grid">` +
    U.panel({
      col: 7, title: 'Load',
      note: 'Revenue over the window. The mark is the average, so a bar short of it is carrying less than its share.',
      body: C.hbars({
        rows: owners.map(o => ({
          name: o.name, value: o.rev, mark: avg,
          note: `${o.units} ${o.units === 1 ? ind.unit.one : ind.unit.many}`,
          color: o.flags ? 'var(--warn)' : 'var(--accent)',
        })),
        fmt: v => F.money(v),
      }),
      foot: 'Amber marks someone with at least one flagged ' + esc(ind.unit.one) + '.',
    }) +
    U.panel({
      col: 5, title: 'By person', pad: false,
      body: U.table({
        cols: [{ name: (ind.unit.owner || 'Owner') }, { name: ind.unit.collection, n: true },
        { name: 'Revenue', n: true }, { name: 'Flagged', n: true }],
        rows: owners.map(o => ({
          cells: [
            `<b>${esc(o.name)}</b><div class="sub">${esc(o.names.slice(0, 3).join(', '))}${o.names.length > 3 ? ` and ${o.names.length - 3} more` : ''}</div>`,
            String(o.units), F.money(o.rev),
            o.flags ? U.statusTag(String(o.flags), 'warn') : '<span class="muted">none</span>',
          ],
        })),
      }),
    }) + `</div>`;
}

/* --------------------------------------------------------------- the year */

export function season(ctx) {
  const { q, s } = ctx;
  const ind = s.industry;
  const months = q.months;
  const key = { construction: 'rev', education: 'enrolled', retail: 'sales',
    industrial: 'produced', logistics: 'miles', tech: 'arr' }[ind.id] || 'rev';
  const label = { construction: 'Earned revenue', education: 'Students enrolled',
    retail: 'Net sales', industrial: 'Units produced', logistics: 'Miles',
    tech: 'ARR' }[ind.id] || 'Revenue';
  const money = ['rev', 'sales', 'arr'].includes(key);
  const fmt = v => money ? F.money(v) : F.num(v, 0);

  const years = [...new Set(months.map(m => m.slice(0, 4)))].sort();
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rows = years.map(y => ({
    name: y,
    values: MON.map((_, i) => {
      const m = `${y}-${String(i + 1).padStart(2, '0')}`;
      return months.includes(m) ? q.factSum(key, [m]) : null;
    }),
  }));

  /* the calendar's own shape: each month against the average month */
  const index = MON.map((_, i) => {
    const vals = rows.map(r => r.values[i]).filter(Number.isFinite);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });
  const mean = index.filter(Number.isFinite).reduce((a, b) => a + b, 0)
    / index.filter(Number.isFinite).length;
  const shape = index.map(v => Number.isFinite(v) ? (v / mean - 1) * 100 : null);
  const peak = MON[shape.indexOf(Math.max(...shape.filter(Number.isFinite)))];
  const trough = MON[shape.indexOf(Math.min(...shape.filter(Number.isFinite)))];
  const swing = Math.max(...shape.filter(Number.isFinite)) - Math.min(...shape.filter(Number.isFinite));

  return U.pageHead({
    eyebrow: 'Operations',
    title: 'Pattern by month',
    motif: motif(ind.id, s.data.brand.palette),
    answer: `<b>${esc(label)}</b> peaks in <b>${esc(peak)}</b> and bottoms in
      <b>${esc(trough)}</b>, a swing of <b>${F.pct(swing, 0)}</b> between them.
      ${swing > 30
        ? 'A business this seasonal cannot be read month on month: the calendar moves it more than the work does.'
        : 'The calendar moves this business less than the work does, so a month-on-month read is fair.'}`,
  }) + U.fresh(q, s) + `<div class="grid">` +
    U.panel({
      col: 12, title: `${esc(label)} by calendar month`,
      note: 'One row per year. Reading down a column shows the same month in different years.',
      body: C.heatmap({
        rows, cols: MON, fmt, label: label.toLowerCase(), rowWidth: 70,
      }),
      foot: `A gap is a month the extract does not reach, not a month of nothing.`,
    }) +
    U.panel({
      col: 12, title: 'The shape of the year',
      note: 'Each calendar month against the average month, averaged over every year in the extract.',
      body: C.bars({
        values: shape.map(v => Number.isFinite(v) ? v : 0), labels: MON,
        fmt: v => F.pct(v, 0), height: 230,
        /* A quiet month is the calendar, not a failure. Red here would say
           February went wrong, and February goes like this every year. */
        color: 'var(--accent)', negColor: 'var(--accent-lift)',
      }),
      foot: `This is why a pace read as a share of the year gone can mislead: by
        ${esc(peak)} a seasonal business is further through its year than the calendar says.`,
    }) + `</div>`;
}

export const opsPages = {
  'ops-home': home, 'ops-watch': watch, 'ops-units': units, 'ops-grid': grid,
  'ops-season': season, 'ops-people': people, 'ops-second': second, 'ops-detail': detail,
};
