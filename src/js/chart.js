/* Charts, hand-drawn in SVG.

   No chart library. Everything here draws into a viewBox and scales with the
   panel, every mark carries a <title> so a hover always says what it is, and
   line charts additionally take a cursor guideline wired by wire().

   Series colors come from the validated dataviz palette on :root, never from
   a brand accent, because a brand color has no contrast guarantee. */

import { esc, hash } from './icons.js';

const W = 720;
let uid = 0;

export function seriesColour(i) {
  const css = getComputedStyle(document.documentElement);
  const v = css.getPropertyValue(`--s${i % 6}`).trim();
  return v || ['#2B7CC4', '#B87D0C', '#0093A1', '#8B5CD6', '#C2408B', '#A2551F'][i % 6];
}

export function niceMax(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  /* ⛔ The ladder used to jump 5 -> 10, so a series peaking at 5.5M was drawn
     against a 10M axis and the bars filled barely half the panel. That is the
     "small puzzle piece in a big empty space" Matt named on Start here
     (2026-11-02), and it was in EVERY bar and line chart in the build, not
     just that one. The rungs between keep the axis a round number while
     letting the data fill the plot. */
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => n <= x) || 10;
  return step * mag;
}

function ticks(min, max, count = 4) {
  const out = [];
  for (let i = 0; i <= count; i++) out.push(min + (max - min) * i / count);
  return out;
}

/* ------------------------------------------------------------------- line */

export function line(opts) {
  const {
    series = [], labels = [], height = 230, fmt = v => v, area = true,
    zeroBase = true, legend = true, markers = [],
  } = opts;
  const id = 'c' + (++uid);
  const padL = 56, padR = 14, padT = 14, padB = 26;
  const iw = W - padL - padR, ih = height - padT - padB;
  const all = series.flatMap(s => s.values.filter(v => Number.isFinite(v)));
  if (!all.length) return `<div class="empty">Nothing to draw yet.</div>`;
  let lo = Math.min(...all), hi = Math.max(...all);
  if (zeroBase && lo > 0) lo = 0;
  if (lo === hi) { hi = hi || 1; lo = Math.min(0, lo); }
  const pad = (hi - lo) * 0.08;
  hi = hi + pad; lo = lo < 0 ? lo - pad : lo;
  const x = i => padL + (labels.length < 2 ? iw / 2 : iw * i / (labels.length - 1));
  const y = v => padT + ih - (v - lo) / (hi - lo) * ih;

  /* What the cursor needs: the plot box and one formatted value per series per
     point. Written as data rather than recomputed on every pointermove, so the
     readout cannot disagree with the line it is describing. */
  const hover = JSON.stringify({
    padL, iw, step: 'point', labels,
    series: series.map((sr, si) => ({
      name: sr.name, color: sr.color || seriesColour(si),
      values: sr.values.map(v => Number.isFinite(v) ? fmt(v) : null),
    })),
  });
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto"
    data-chart="line" data-id="${id}" role="img" data-hover="${esc(hover)}">`;
  svg += `<g class="axis">`;
  for (const t of ticks(lo, hi)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`;
    svg += `<text x="${padL - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${esc(fmt(t))}</text>`;
  }
  svg += `</g>`;
  if (lo < 0) svg += `<line class="zero" x1="${padL}" x2="${W - padR}" y1="${y(0)}" y2="${y(0)}"/>`;

  /* By width, not by count: see tickStep. A line chart in a narrow panel was
     drawing "Sep 26" on top of "Oct 26" for the same reason bars was. */
  const step = tickStep(labels, labels.length > 1 ? iw / (labels.length - 1) : iw);
  labels.forEach((l, i) => {
    if (i % step) return;
    svg += `<text x="${x(i).toFixed(1)}" y="${height - 7}" text-anchor="middle">${esc(l)}</text>`;
  });

  for (const m of markers) {
    const mx = x(m.at);
    svg += `<line x1="${mx}" x2="${mx}" y1="${padT}" y2="${padT + ih}"
      stroke="var(--ink-faint)" stroke-dasharray="4 3" opacity=".6"/>`;
    if (m.label) svg += `<text x="${mx + 4}" y="${padT + 10}" fill="var(--ink-faint)">${esc(m.label)}</text>`;
  }

  series.forEach((s, si) => {
    const c = s.color || seriesColour(si);
    const pts = s.values.map((v, i) => Number.isFinite(v) ? `${x(i).toFixed(1)},${y(v).toFixed(1)}` : null)
      .filter(Boolean);
    if (!pts.length) return;
    if (area && series.length <= 2 && s.area !== false) {
      const base = y(Math.max(lo, 0)).toFixed(1);
      svg += `<path d="M${pts[0].split(',')[0]},${base} L${pts.join(' L')} L${pts[pts.length - 1].split(',')[0]},${base} Z"
        fill="${c}" opacity=".1"/>`;
    }
    svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${c}"
      stroke-width="${s.dash ? 1.8 : 2.4}" stroke-linejoin="round" stroke-linecap="round"
      ${s.dash ? 'stroke-dasharray="5 4"' : ''}/>`;
    s.values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      /* `.pt` and its index: the readout lifts the dot at the month under the
         cursor so the eye lands on the right one. No title, because the
         position readout covers every series at once and a per-dot tooltip
         would answer a narrower question a second later. */
      svg += `<circle class="pt" data-i="${i}" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}"
        r="${labels.length > 18 ? 2 : 3}" fill="${c}"/>`;
    });
  });

  svg += `<g class="cursor" style="display:none"><line class="hover-line" y1="${padT}" y2="${padT + ih}"/></g>`;
  svg += `<rect x="${padL}" y="${padT}" width="${iw}" height="${ih}" fill="transparent" class="hit"/>`;
  svg += `</svg>`;
  if (legend && series.length > 1) svg += legendOf(series);
  return svg;
}

function legendOf(series) {
  return `<div class="chart-legend">` + series.map((s, i) =>
    `<span><i style="background:${s.color || seriesColour(i)}${s.dash ? ';opacity:.6' : ''}"></i>${esc(s.name)}</span>`
  ).join('') + `</div>`;
}

/* ------------------------------------------------------------------- bars */

export function bars(opts) {
  const {
    values = [], labels = [], height = 220, fmt = v => v, color = null,
    target = null, overlay = null, overlayName = 'Budget', name = 'Actual',
    negativeOk = true, negColor = 'var(--bad)',
  } = opts;
  if (!values.length) return `<div class="empty">Nothing to draw yet.</div>`;
  const padL = 56, padR = 14, padT = 14, padB = 26;
  const iw = W - padL - padR, ih = height - padT - padB;
  const all = values.concat(overlay || []).concat(target ? [target] : []).filter(Number.isFinite);
  let hi = niceMax(Math.max(...all, 0));
  let lo = negativeOk ? Math.min(0, Math.min(...all)) : 0;
  if (lo < 0) lo = -niceMax(Math.abs(lo));
  if (hi === lo) hi = lo + 1;
  const bw = iw / values.length;
  const y = v => padT + ih - (v - lo) / (hi - lo) * ih;
  const c = color || seriesColour(0);

  /* A bar sits in a BAND, not on a point, so the index is the band under the
     cursor. The readout carries the bar, the overlay line where there is one
     and the target where there is one, because all three are at that month. */
  const hover = JSON.stringify({
    padL, iw, step: 'band', labels,
    series: [{ name, color: c, values: values.map(v => Number.isFinite(v) ? fmt(v) : null) }]
      .concat(overlay ? [{
        name: overlayName, color: 'var(--ink)',
        values: overlay.map(v => Number.isFinite(v) ? fmt(v) : null),
      }] : [])
      .concat(Number.isFinite(target) ? [{
        name: 'Target', color: 'var(--warn)', values: values.map(() => fmt(target)),
      }] : []),
  });
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto"
    role="img" data-hover="${esc(hover)}">`;
  svg += `<g class="cursor" style="display:none"><line class="hover-line" y1="${padT}" y2="${padT + ih}"/></g>`;
  svg += `<g class="axis">`;
  for (const t of ticks(lo, hi)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`;
    svg += `<text x="${padL - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${esc(fmt(t))}</text>`;
  }
  svg += `</g>`;
  if (lo < 0) svg += `<line class="zero" x1="${padL}" x2="${W - padR}" y1="${y(0)}" y2="${y(0)}"/>`;

  /* ⛔ THIN THE AXIS BY WIDTH, NOT BY COUNT.

     `ceil(n/12)` keeps twelve labels however little room each one has, so a
     twelve-month axis in a narrow panel printed "Sep 26" touching "Oct 26".
     What decides whether two labels collide is the space per bar against the
     width of the text, so that is what the step is computed from. The last
     label is dropped rather than drawn on top of its neighbour: a label that
     overlaps another is worse than a label that is not there, because the
     reader cannot tell which value it belongs to. */
  const step = tickStep(labels, bw);
  values.forEach((v, i) => {
    const bx = padL + bw * i + bw * 0.18;
    const w = bw * 0.64;
    const top = Math.min(y(v), y(0)), h = Math.max(1.5, Math.abs(y(v) - y(0)));
    svg += `<rect x="${bx.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
      fill="${v < 0 ? negColor : c}" rx="2"/>`;
    if (overlay && Number.isFinite(overlay[i])) {
      svg += `<line x1="${(bx - w * 0.1).toFixed(1)}" x2="${(bx + w * 1.1).toFixed(1)}"
        y1="${y(overlay[i]).toFixed(1)}" y2="${y(overlay[i]).toFixed(1)}"
        stroke="var(--ink)" stroke-width="2" opacity=".75"/>`;
    }
    if (i % step === 0) {
      svg += `<text x="${(padL + bw * i + bw / 2).toFixed(1)}" y="${height - 7}" text-anchor="middle">${esc(labels[i] || '')}</text>`;
    }
  });
  if (target !== null && Number.isFinite(target)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${y(target).toFixed(1)}" y2="${y(target).toFixed(1)}"
      stroke="var(--warn)" stroke-width="1.6" stroke-dasharray="6 4"><title>Target ${esc(fmt(target))}</title></line>`;
  }
  svg += `</svg>`;
  if (overlay) {
    svg += `<div class="chart-legend"><span><i style="background:${c}"></i>${esc(name)}</span>
      <span><i style="background:var(--ink);height:3px;border-radius:2px"></i>${esc(overlayName)}</span></div>`;
  }
  return svg;
}

/* ------------------------------------------------------------ stacked bars */

export function stack(opts) {
  const { rows = [], keys = [], labels = [], height = 240, fmt = v => v, names = {} } = opts;
  if (!rows.length) return `<div class="empty">Nothing to draw yet.</div>`;
  const padL = 56, padR = 14, padT = 14, padB = 26;
  const iw = W - padL - padR, ih = height - padT - padB;
  const totals = rows.map(r => keys.reduce((a, k) => a + Math.max(0, r[k] || 0), 0));
  const hi = niceMax(Math.max(...totals, 1));
  const bw = iw / rows.length;
  const y = v => padT + ih - v / hi * ih;

  /* Every band of the stack at the month under the cursor, so a reader sees
     what made up that column instead of hunting one segment at a time. */
  const hover = JSON.stringify({
    padL, iw, step: 'band', labels,
    series: keys.map((k, ki) => ({
      name: names[k] || k, color: seriesColour(ki),
      values: rows.map(r => Number.isFinite(r[k]) ? fmt(r[k]) : null),
    })),
  });
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto"
    role="img" data-hover="${esc(hover)}">`;
  svg += `<g class="cursor" style="display:none"><line class="hover-line" y1="${padT}" y2="${padT + ih}"/></g>`;
  svg += `<g class="axis">`;
  for (const t of ticks(0, hi)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`;
    svg += `<text x="${padL - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${esc(fmt(t))}</text>`;
  }
  svg += `</g>`;
  /* By width, not by count: see tickStep. */
  const step = tickStep(labels, bw);
  rows.forEach((r, i) => {
    let acc = 0;
    const bx = padL + bw * i + bw * 0.18, w = bw * 0.64;
    keys.forEach((k, ki) => {
      const v = Math.max(0, r[k] || 0);
      if (v <= 0) return;
      const top = y(acc + v), h = Math.max(0.8, y(acc) - y(acc + v));
      svg += `<rect x="${bx.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
        fill="${seriesColour(ki)}" rx="1.5"/>`;
      acc += v;
    });
    if (i % step === 0) {
      svg += `<text x="${(padL + bw * i + bw / 2).toFixed(1)}" y="${height - 7}" text-anchor="middle">${esc(labels[i] || '')}</text>`;
    }
  });
  svg += `</svg>`;
  svg += `<div class="chart-legend">` + keys.map((k, ki) =>
    `<span><i style="background:${seriesColour(ki)}"></i>${esc(names[k] || k)}</span>`).join('') + `</div>`;
  return svg;
}

/* ------------------------------------------------------------------ donut */

export function donut(opts) {
  const { parts = [], size = 190, fmt = v => v, center = null, centerLabel = '' } = opts;
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0);
  if (total <= 0) return `<div class="empty">Nothing to draw yet.</div>`;
  const r = size / 2 - 10, ir = r * 0.62, cx = size / 2, cy = size / 2;
  let a0 = -Math.PI / 2;
  let svg = `<svg class="chart donut" viewBox="0 0 ${size} ${size}"
    style="width:100%;max-width:${size}px;height:auto" role="img">`;
  parts.forEach((p, i) => {
    const frac = Math.max(0, p.value) / total;
    const a1 = a0 + frac * Math.PI * 2;
    const big = frac > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1);
    const xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0);
    svg += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${big} 1 ${x1.toFixed(1)},${y1.toFixed(1)}
      L${xi1.toFixed(1)},${yi1.toFixed(1)} A${ir},${ir} 0 ${big} 0 ${xi0.toFixed(1)},${yi0.toFixed(1)} Z"
      fill="${p.color || seriesColour(i)}"><title>${esc(p.name)}: ${esc(fmt(p.value))} (${(frac * 100).toFixed(1)}%)</title></path>`;
    a0 = a1;
  });
  if (center !== null) {
    svg += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" class="readout" style="font-size:17px">${esc(center)}</text>`;
    /* 18 below the figure, not 14. A 17px figure's box measures 24px tall, not
       the ~20 its font size suggests, so 14 left one pixel of overlap on the
       word under it. Measured, not reasoned: "9.6%" bottom 836.7 against
       "kept" top 835.7. */
    svg += `<text x="${cx}" y="${cy + 18}" text-anchor="middle" style="font-size:10px">${esc(centerLabel)}</text>`;
  }
  svg += `</svg>`;
  return svg;
}

export function donutLegend(parts, fmt = v => v) {
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
  return `<div class="rows">` + parts.map((p, i) => `
    <div class="row-item" style="padding:7px 10px">
      <i class="dot" style="background:${p.color || seriesColour(i)};width:9px;height:9px;flex:0 0 9px"></i>
      <span class="grow">${esc(p.name)}</span>
      <b class="nowrap">${esc(fmt(p.value))}</b>
      <span class="muted nowrap" style="min-width:46px;text-align:right">${(p.value / total * 100).toFixed(1)}%</span>
    </div>`).join('') + `</div>`;
}

/* -------------------------------------------------------------- waterfall */

export function waterfall(opts) {
  const { items = [], height = 250, fmt = v => v } = opts;
  if (!items.length) return `<div class="empty">Nothing to draw yet.</div>`;
  const padL = 56, padR = 14, padT = 18, padB = 44;
  const iw = W - padL - padR, ih = height - padT - padB;
  let acc = 0; const tops = [];
  for (const it of items) {
    if (it.total) { tops.push({ from: 0, to: it.value }); acc = it.value; }
    else { tops.push({ from: acc, to: acc + it.value }); acc += it.value; }
  }
  const all = tops.flatMap(t => [t.from, t.to]);
  const hi = niceMax(Math.max(...all, 0)), lo = Math.min(0, ...all);
  const bw = iw / items.length;
  const y = v => padT + ih - (v - lo) / (hi - lo) * ih;

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto" role="img">`;
  svg += `<g class="axis">`;
  for (const t of ticks(lo, hi)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`;
    svg += `<text x="${padL - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${esc(fmt(t))}</text>`;
  }
  svg += `</g>`;
  items.forEach((it, i) => {
    const t = tops[i];
    const bx = padL + bw * i + bw * 0.16, w = bw * 0.68;
    const top = Math.min(y(t.from), y(t.to)), h = Math.max(1.5, Math.abs(y(t.to) - y(t.from)));
    const fill = it.total ? 'var(--navy)' : (it.value >= 0 ? 'var(--good)' : 'var(--bad)');
    svg += `<rect x="${bx.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
      fill="${fill}" rx="2"><title>${esc(it.name)}: ${esc(fmt(it.value))}</title></rect>`;
    if (i < items.length - 1 && !items[i + 1].total) {
      svg += `<line x1="${(bx + w).toFixed(1)}" x2="${(padL + bw * (i + 1) + bw * 0.16).toFixed(1)}"
        y1="${y(t.to).toFixed(1)}" y2="${y(t.to).toFixed(1)}" stroke="var(--rule)" stroke-dasharray="2 2"/>`;
    }
    const words = String(it.name).split(' ');
    const mid = (padL + bw * i + bw / 2).toFixed(1);
    /* A wrapped label's two lines were 11 units apart for text about 12 tall,
       so "Cost of" sat on "revenue" by a pixel on every dashboard. */
    const two = words.length > 2;
    /* 17 viewBox units between the lines, not 11. The chart scales down in a
       narrow panel, so a gap that clears the text at full width does not
       clear it at three quarters: measured at 9.9px of gap for 11px of text
       on education's dashboard, which is one pixel of overlap and still
       reads as broken. */
    svg += `<text x="${mid}" y="${height - (two ? 31 : 22)}" text-anchor="middle">${esc(words.slice(0, 2).join(' '))}</text>`;
    if (two) svg += `<text x="${mid}" y="${height - 14}" text-anchor="middle">${esc(words.slice(2).join(' '))}</text>`;
    svg += `<text x="${mid}" y="${(top - 5).toFixed(1)}" text-anchor="middle" class="readout"
      style="font-size:10.5px">${esc(fmt(it.value))}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

/* ----------------------------------------------------------- ranked h-bars */

export function hbars(opts) {
  const { rows = [], fmt = v => v, max = null, showNeg = true, height = 18, gap = 7 } = opts;
  if (!rows.length) return `<div class="empty">Nothing to draw yet.</div>`;
  const hi = max !== null ? max : Math.max(...rows.map(r => Math.abs(r.value)), 1);
  return `<div class="rows" style="gap:${gap}px">` + rows.map((r, i) => {
    const w = Math.abs(r.value) / hi * 100;
    const neg = r.value < 0 && showNeg;
    return `<div class="row-item" style="padding:6px 10px;gap:10px">
      <span class="grow nowrap" style="max-width:40%;overflow:hidden;text-overflow:ellipsis"
        title="${esc(r.name)}">${esc(r.name)}</span>
      <span class="bar-cell" style="flex:1;height:${height}px">
        <i style="width:${w.toFixed(1)}%;background:${neg ? 'var(--bad)' : (r.color || seriesColour(r.band ?? 0))}"></i>
        ${r.mark !== undefined ? `<u style="left:${(Math.abs(r.mark) / hi * 100).toFixed(1)}%"></u>` : ''}
      </span>
      <b class="nowrap" style="min-width:74px;text-align:right">${esc(fmt(r.value))}</b>
      ${r.note ? `<span class="muted small nowrap" style="min-width:62px;text-align:right">${r.note}</span>` : ''}
    </div>`;
  }).join('') + `</div>`;
}

/* ----------------------------------------------------------------- bullet */

export function bullet(opts) {
  const { value, target, fmt = v => v, label = '', height = 44 } = opts;
  const hi = niceMax(Math.max(value, target) * 1.12);
  const w = W, padL = 2, iw = w - 4;
  const x = v => padL + Math.max(0, v) / hi * iw;
  return `<svg class="chart" viewBox="0 0 ${w} ${height}" style="width:100%;height:auto" role="img">
    <rect x="${padL}" y="${height / 2 - 11}" width="${iw}" height="22" fill="var(--rule-soft)" rx="4"/>
    <rect x="${padL}" y="${height / 2 - 11}" width="${(x(value) - padL).toFixed(1)}" height="22"
      fill="var(--accent)" rx="4"><title>${esc(label)}: ${esc(fmt(value))}</title></rect>
    <line x1="${x(target).toFixed(1)}" x2="${x(target).toFixed(1)}" y1="${height / 2 - 16}" y2="${height / 2 + 16}"
      stroke="var(--ink)" stroke-width="2.6"><title>Target ${esc(fmt(target))}</title></line>
    <text x="${padL + 8}" y="${height / 2 + 5}" fill="#fff" style="font-size:11.5px;font-weight:600">${esc(fmt(value))}</text>
    <text x="${(x(target) + 7).toFixed(1)}" y="${height / 2 - 20}" style="font-size:10.5px">${esc(fmt(target))}</text>
  </svg>`;
}

/* ------------------------------------------------------------------ spark */

export function spark(values, { width = 62, height = 20, color = null } = {}) {
  const v = values.filter(Number.isFinite);
  if (v.length < 2) return '';
  const lo = Math.min(...v), hi = Math.max(...v);
  const span = hi - lo || 1;
  const pts = v.map((d, i) => `${(i / (v.length - 1) * width).toFixed(1)},${(height - (d - lo) / span * height).toFixed(1)}`);
  const up = v[v.length - 1] >= v[0];
  const c = color || (up ? 'var(--good)' : 'var(--bad)');
  return `<svg class="strip-spark" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
    <polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;
}

/* ---------------------------------------------------------------- scatter */

export function scatter(opts) {
  const { points = [], height = 260, xFmt = v => v, yFmt = v => v, xLabel = '', yLabel = '',
    /* `rule` draws a reference line across the plot: the house margin, a
       target, a break-even. Without it a reader has to hold the comparison
       figure in their head while scanning the dots, which is the whole job the
       chart was supposed to do for them. */
    rule = null, ruleLabel = '' } = opts;
  if (!points.length) return `<div class="empty">Nothing to draw yet.</div>`;
  const padL = 60, padR = 18, padT = 16, padB = 40;
  const iw = W - padL - padR, ih = height - padT - padB;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const xhi = niceMax(Math.max(...xs)), yhi = niceMax(Math.max(...ys));
  const xlo = Math.min(0, ...xs), ylo = Math.min(0, ...ys);
  const X = v => padL + (v - xlo) / (xhi - xlo || 1) * iw;
  const Y = v => padT + ih - (v - ylo) / (yhi - ylo || 1) * ih;
  /* Every label already drawn, so a later one can avoid it. Declared with
     the rest of the geometry because the rule's caption is placed before the
     points and must share the list. */
  const placedLabels = [];

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto" role="img">`;
  svg += `<g class="axis">`;
  for (const t of ticks(ylo, yhi)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}"/>`;
    svg += `<text x="${padL - 8}" y="${(Y(t) + 3.5).toFixed(1)}" text-anchor="end">${esc(yFmt(t))}</text>`;
    /* ⛔ An axis tick is a label and a point label can land on one. The first
       collision pass only compared point labels with each other, and a point
       near the left edge put a name straight through "15%". */
    const tick = String(yFmt(t));
    placedLabels.push({ x: padL - 8 - tick.length * 2.7, y: Y(t) + 3.5,
      half: tick.length * 2.7 + 4 });
  }
  for (const t of ticks(xlo, xhi)) {
    svg += `<text x="${X(t).toFixed(1)}" y="${height - 22}" text-anchor="middle">${esc(xFmt(t))}</text>`;
  }
  svg += `</g>`;
  if (Number.isFinite(rule) && rule >= ylo && rule <= yhi) {
    svg += `<line class="sc-rule" x1="${padL}" x2="${W - padR}"
      y1="${Y(rule).toFixed(1)}" y2="${Y(rule).toFixed(1)}"/>`;
    svg += `<text class="sc-rule-t" x="${W - padR - 4}" y="${(Y(rule) - 6).toFixed(1)}"
      text-anchor="end">${esc(ruleLabel || yFmt(rule))}</text>`;
    /* the rule's caption competes for space with the point labels, so it is
       placed first and they avoid it rather than landing on it */
    const cap = String(ruleLabel || yFmt(rule));
    placedLabels.push({ x: W - padR - 4 - cap.length * 2.9, y: Y(rule) - 6, half: cap.length * 2.9 + 4 });
  }
  /* ⛔ WHICH POINTS GET A LABEL.

     Labelling every point is right for six project managers and catastrophic
     for forty-eight trucks: Matt's screenshot of logistics Margin & drivers is
     a solid band of overlapping text with no figure readable in it. *"this is
     bad. i literally cannot read any of it"*.

     So a small set is labelled whole, and a large one is labelled only where a
     label earns its place: the extremes, which are the points a reader is
     looking for anyway. Everything else keeps its hover title, so nothing is
     lost, and the band in the middle stays a band instead of becoming mush.

     Colour follows the same reasoning. With six points the series colours tell
     one from another; with forty-eight they cycle and say nothing, so a large
     set is drawn in one colour and the chart stops implying a grouping it does
     not have. */
  const LABEL_ALL = 9;
  let labelled;
  if (points.length <= LABEL_ALL) {
    labelled = new Set(points.map((_, i) => i));
  } else {
    const byY = points.map((p, i) => i).sort((a, b) => points[b].y - points[a].y);
    const byX = points.map((p, i) => i).sort((a, b) => points[b].x - points[a].x);
    labelled = new Set([byY[0], byY[1], byY[byY.length - 1], byY[byY.length - 2],
      byX[0], byX[byX.length - 1]].filter(i => i !== undefined));
  }
  const many = points.length > LABEL_ALL;
  points.forEach((p, i) => {
    const who = p.name || p.label || '';
    svg += `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.r || (many ? 5 : 6)}"
      fill="${p.color || (many ? 'var(--accent)' : seriesColour(i % 6))}"
      opacity="${many ? '.6' : '.78'}" stroke="var(--paper)" stroke-width="1.4">
      <title>${esc(who)} · ${esc(xLabel)} ${esc(xFmt(p.x))} · ${esc(yLabel)} ${esc(yFmt(p.y))}</title></circle>`;
    if (who && labelled.has(i)) {
      /* Even the extremes can land on each other. A label that would overlap
         one already drawn is dropped rather than stacked: the dot and its
         hover title still carry the point, and two names written over each
         other carry neither. */
      const tx = X(p.x), ty = Y(p.y) - 11;
      const half = who.length * 2.9 + 4;
      const clash = placedLabels.some(q =>
        Math.abs(q.y - ty) < 12 && Math.abs(q.x - tx) < half + q.half);
      if (!clash) {
        placedLabels.push({ x: tx, y: ty, half });
        svg += `<text class="sc-pt" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}"
          text-anchor="middle">${esc(who)}</text>`;
      }
    }
  });
  svg += `<text x="${W / 2}" y="${height - 5}" text-anchor="middle">${esc(xLabel)}</text>`;
  svg += `<text x="12" y="${padT + ih / 2}" text-anchor="middle" transform="rotate(-90 12 ${padT + ih / 2})">${esc(yLabel)}</text>`;
  svg += `</svg>`;
  return svg;
}

/* ------------------------------------------------------------------- wire */

/* Give every line chart a cursor guideline. Called once after a page renders.
   Pointer only: a page that never gets a pointer is unaffected, and nothing
   here waits on visible time, because a headless browser has none. */
/* ===========================================================================
   HOVER: every chart answers the cursor.

   Matt, 2026-11-02: *"all items should be interactive. when i hover over an
   item, it needs to show data on each line or dot or whatever"*.

   Before this, a line chart moved a bare guideline with no figures on it, and
   everything else relied on the browser's own `<title>` tooltip: a grey box
   that waits a second, cannot be styled, shows one mark at a time, and on a
   two-line chart never tells you what the OTHER line was doing at the same
   month, which is the whole question that chart exists to answer.

   One mechanism, two shapes, because charts come in two kinds:

   1. An X-INDEXED chart (line, bars, stack) answers for a POSITION: the month
      under the cursor, with every series' value at that month, so the reader
      compares rather than guesses. It carries its figures as `data-hover`.
   2. A MARK chart (donut, scatter, heatmap, waterfall, slope, bars within a
      row list) answers for the THING under the cursor. Any element carrying
      `data-r` reports it, in SVG or in plain HTML, so the schedule's rows and
      the churn strip work the same way without knowing about this file.

   ⛔ The native `<title>` tooltip is REMOVED at wire time rather than left to
   appear a second later underneath the real readout. Its text becomes the
   mark's `data-r` and its `aria-label`, so what a screen reader gets is
   unchanged and what a pointer gets is ours.

   The handler is delegated from the page root, so it survives a re-render
   without rewiring, and it reads geometry only on the frames it has to. */

let tip = null;

function tipEl() {
  if (tip && tip.isConnected) return tip;
  tip = document.createElement('div');
  /* ⛔ `hoverout`, NOT `readout`. `.readout` already means "a value drawn
     inside a chart" (the donut's centre figure, the waterfall's bar labels),
     and giving the tooltip the same name made one selector mean two things
     again, hours after `.delta` taught exactly that lesson. It cost an hour:
     every test that asked the document for `.readout` found a waterfall's SVG
     text first and reported the feature broken on the pages that have one. */
  tip.className = 'hoverout';
  tip.setAttribute('role', 'status');
  tip.setAttribute('aria-live', 'polite');
  tip.hidden = true;
  document.body.append(tip);
  return tip;
}

function showTip(html, ev) {
  const el = tipEl();
  el.innerHTML = html;
  el.hidden = false;
  /* Measured, then placed: the box has to exist before its width is known, and
     it flips rather than running off the edge of a narrow window. */
  const b = el.getBoundingClientRect();
  const pad = 14;
  let left = ev.clientX + pad;
  let top = ev.clientY + pad;
  if (left + b.width > window.innerWidth - 8) left = ev.clientX - b.width - pad;
  if (top + b.height > window.innerHeight - 8) top = ev.clientY - b.height - pad;
  el.style.left = `${Math.max(8, left)}px`;
  el.style.top = `${Math.max(8, top)}px`;
}

function hideTip() {
  if (tip) { tip.hidden = true; }
}

/* `<title>` becomes `data-r`, once, so the native tooltip never fires. */
function liftTitles(root) {
  for (const t of root.querySelectorAll('svg title')) {
    const owner = t.parentElement;
    const text = (t.textContent || '').trim();
    t.remove();
    if (!owner || !text) continue;
    if (!owner.dataset.r) owner.dataset.r = text;
    if (!owner.getAttribute('aria-label')) owner.setAttribute('aria-label', text);
  }
  /* The same for plain HTML marks, whose native tooltip is a `title=`. */
  for (const el of root.querySelectorAll('[title]:not([data-keep-title])')) {
    const text = el.getAttribute('title');
    if (!text) continue;
    el.removeAttribute('title');
    if (!el.dataset.r) el.dataset.r = text;
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', text);
  }
}

/* A readout for one mark: whatever the chart wrote, split on the separator it
   already used so the name reads as a heading and the figures as rows. */
function markHTML(text) {
  const bits = String(text).split(' · ');
  const head = bits.shift();
  return `<b>${esc(head)}</b>${bits.length
    ? `<div class="ro-rows">${bits.map(x => `<div>${esc(x)}</div>`).join('')}</div>` : ''}`;
}

/* A readout for a position: the label, then one row per series, each with the
   series' own colour so a reader matches it to the line without counting. */
function indexHTML(data, i) {
  return `<b>${esc(data.labels[i] || '')}</b>
    <div class="ro-rows">${data.series.map(sr => `
      <div class="ro-row">
        <i style="background:${esc(sr.color || 'var(--accent)')}"></i>
        <span>${esc(sr.name)}</span>
        <em>${esc(sr.values[i] === undefined || sr.values[i] === null ? '—' : sr.values[i])}</em>
      </div>`).join('')}</div>`;
}

export function wire(root) {
  liftTitles(root);
  if (root.dataset.hoverWired) return;
  root.dataset.hoverWired = '1';

  const move = ev => {
    const mark = ev.target.closest ? ev.target.closest('[data-r]') : null;
    if (mark) { showTip(markHTML(mark.dataset.r), ev); return; }

    const svg = ev.target.closest ? ev.target.closest('svg[data-hover]') : null;
    if (!svg) { hideTip(); clearCursor(root); return; }

    let data;
    try { data = JSON.parse(svg.dataset.hover); } catch { hideTip(); return; }
    const box = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const scale = vb.width / box.width;
    const px = (ev.clientX - box.left) * scale;
    const n = data.labels.length;
    if (!n) { hideTip(); return; }
    /* Nearest index by the chart's own plot geometry, which it wrote down, so
       this never has to know how a particular chart lays its points out. */
    const t = (px - data.padL) / Math.max(1, data.iw);
    const i = Math.max(0, Math.min(n - 1,
      Math.round(data.step === 'band' ? t * n - 0.5 : t * (n - 1))));
    showTip(indexHTML(data, i), ev);

    const cursor = svg.querySelector('g.cursor');
    if (cursor) {
      const cx = data.padL + (data.step === 'band'
        ? data.iw * (i + 0.5) / n : (n < 2 ? data.iw / 2 : data.iw * i / (n - 1)));
      cursor.style.display = '';
      for (const ln of cursor.querySelectorAll('line')) {
        ln.setAttribute('x1', cx); ln.setAttribute('x2', cx);
      }
    }
    for (const dot of svg.querySelectorAll('.pt')) {
      dot.classList.toggle('on', Number(dot.dataset.i) === i);
    }
  };

  root.addEventListener('pointermove', move, { passive: true });
  root.addEventListener('pointerleave', () => { hideTip(); clearCursor(root); });
  /* A touch is a tap, not a hover: show the readout and let the next tap
     elsewhere clear it, rather than leaving a box stranded on screen. */
  root.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'touch') move(ev);
  }, { passive: true });
  addEventListener('scroll', hideTip, { passive: true });
}

function clearCursor(root) {
  for (const c of root.querySelectorAll('svg g.cursor')) c.style.display = 'none';
  for (const d of root.querySelectorAll('svg .pt.on')) d.classList.remove('on');
}

/* ---------------------------------------------------------------- heatmap */

/* rows x months, one cell per reading. The shape a person scans for "which
   one, and since when", which no line chart with twenty series can answer. */
export function heatmap(opts) {
  const {
    rows = [], cols = [], fmt = v => v, height = null,
    label = '', good = 'high', rowWidth = 150,
  } = opts;
  if (!rows.length || !cols.length) return `<div class="empty">Nothing to draw yet.</div>`;

  const all = rows.flatMap(r => r.values.filter(Number.isFinite));
  if (!all.length) return `<div class="empty">Nothing to draw yet.</div>`;
  const lo = Math.min(...all), hi = Math.max(...all);
  const span = hi - lo || 1;

  const cell = 28, gap = 3;
  const w = rowWidth + cols.length * (cell + gap) + 10;
  const h = (height || (rows.length * (cell + gap) + 34));
  const step = Math.max(1, Math.ceil(cols.length / 12));

  let svg = `<svg class="chart" viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" role="img">`;
  cols.forEach((c, i) => {
    if (i % step && i !== cols.length - 1) return;
    svg += `<text x="${rowWidth + i * (cell + gap) + cell / 2}" y="20" text-anchor="middle"
      style="font-size:10px">${esc(c)}</text>`;
  });
  rows.forEach((r, ri) => {
    const y = 30 + ri * (cell + gap);
    svg += `<text x="${rowWidth - 10}" y="${y + cell * 0.68}" text-anchor="end"
      style="font-size:11.5px">${esc(trim(r.name, 22))}</text>`;
    r.values.forEach((v, ci) => {
      const x = rowWidth + ci * (cell + gap);
      if (!Number.isFinite(v)) {
        svg += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3"
          fill="var(--rule-soft)" opacity=".5"/>`;
        return;
      }
      const t = (v - lo) / span;                      /* 0 worst .. 1 best */
      const score = good === 'high' ? t : 1 - t;
      svg += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3"
        fill="var(--accent)" opacity="${band(score)}"><title>${esc(r.name)} · ${esc(cols[ci])}: ${esc(fmt(v))}</title></rect>`;
    });
  });
  svg += `</svg>`;
  /* The key. Matt, 2026-11-02, on this exact grid: *"job progress build makes
     absolutely no sense and it needs some kind of key to explain what you are
     trying to state"*. The old key read "percent complete to the left, higher
     to the right", which describes the swatches and explains nothing about the
     grid. A key has to say what one cell IS, what the shade means, and what it
     deliberately does not mean. */
  return svg + `<div class="hm-key">
    <div class="hm-ramp">
      <span>${esc(fmt(lo))}</span>
      ${[0.04, 0.3, 0.5, 0.75, 0.96].map(t =>
        `<i style="opacity:${band(t)}"></i>`).join('')}
      <span>${esc(fmt(hi))}</span>
    </div>
    <p>One square is one month's ${esc(label || 'reading')} for that row. The paler the
      square the lower the reading, the more solid the higher.
      ${good === 'high' ? '' : 'Lower is the better end here. '}Shade says
      <b>more or less</b>, never better or worse: this measure carries no target,
      and a red-to-green grid would claim one.</p>
  </div>`;
}

/* A five-step ramp in the brand's own color, not a red-to-green one.

   A heatmap of a LEVEL says more or less, not good or bad: a contract that is
   20% complete is not failing, and coloring it red says it is. Red and green
   are for a measure with a target, which these grids do not carry. Five steps
   rather than a smooth gradient, so a reader can name the step a cell is in. */
function band(score) {
  const steps = [0.16, 0.34, 0.54, 0.76, 1];
  const i = Math.min(steps.length - 1, Math.max(0, Math.floor(score * steps.length)));
  return steps[i];
}

/* Trim from the MIDDLE, not the end.

   ⛔ "Stonebridge Logistics Park" and "Stonebridge Logistics Center" both cut
   to "Stonebridge Logistics…" and the grid showed two different contracts
   under one label, which is worse than useless: a reader picks the wrong row.
   The distinguishing part of a name is usually its tail, so both ends survive. */
/* How many labels an axis can show without them touching.

   `slot` is the viewBox width each label gets. A character of the axis font is
   about 5.4 viewBox units wide, and labels need a gap between them, so the step
   is how many slots the widest label needs. Measured rather than assumed: a
   twelve-month axis in a narrow panel was drawing "Sep 26" on top of "Oct 26"
   because the old step counted labels and never looked at the room. */
function tickStep(labels, slot) {
  const widest = labels.reduce((m, l) => Math.max(m, String(l || '').length), 0);
  const need = widest * 5.4 + 10;
  return Math.max(1, Math.ceil(need / Math.max(1, slot)));
}

function trim(s, n) {
  s = String(s);
  if (s.length <= n) return s;
  const tail = Math.max(4, Math.floor((n - 1) * 0.38));
  const head = n - 1 - tail;
  return s.slice(0, head) + '…' + s.slice(s.length - tail);
}

/* --------------------------------------------------------- small multiples */

/* One tiny chart per unit, all on the same scale, so the shapes are
   comparable at a glance. Twenty of these beat one chart with twenty lines. */
export function multiples(opts) {
  const { rows = [], fmt = v => v, labels = [], shared = true } = opts;
  if (!rows.length) return `<div class="empty">Nothing to draw yet.</div>`;
  const all = rows.flatMap(r => r.values.filter(Number.isFinite));
  const gLo = Math.min(...all, 0), gHi = Math.max(...all, 1);

  return `<div class="multiples">` + rows.map((r, i) => {
    const vals = r.values.filter(Number.isFinite);
    const lo = shared ? gLo : Math.min(...vals, 0);
    const hi = shared ? gHi : Math.max(...vals, 1);
    const span = (hi - lo) || 1;
    const W = 150, H = 44;
    const pts = r.values.map((v, j) => Number.isFinite(v)
      ? `${(j / Math.max(1, r.values.length - 1) * W).toFixed(1)},${(H - (v - lo) / span * H).toFixed(1)}`
      : null).filter(Boolean);
    const show = r.fmt || fmt;
    const last = vals[vals.length - 1];
    const first = vals[0];
    const up = last >= first;
    /* A small multiple is a chart in its own right, so it answers like one:
       what it is, where it started, where it is now, and which way it went. */
    const first0 = vals[0], last0 = vals[vals.length - 1];
    const dir = !Number.isFinite(first0) || !Number.isFinite(last0) ? ''
      : last0 > first0 ? ' · rising' : last0 < first0 ? ' · falling' : ' · flat';
    const rd = `${r.name} · ${Number.isFinite(first0) ? show(first0) : '—'} to ${Number.isFinite(last0) ? show(last0) : '—'}${dir}`;
    return `<div class="mult" data-r="${esc(rd)}" ${r.click ? `data-click="${esc(r.click)}" tabindex="0"` : ''}>
      <div class="mult-head"><b>${esc(trim(r.name, 20))}</b>
        <span class="lastval ${up ? 'up' : 'down'}">${esc(show(last))}</span></div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"
        style="width:100%;height:44px">
        <polyline points="${pts.join(' ')}" fill="none" stroke="${seriesColour(i % 6)}"
          stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      </svg>
      ${r.note ? `<div class="mult-note">${r.note}</div>` : ''}
    </div>`;
  }).join('') + `</div>`;
}

/* --------------------------------------------------------------- two sided */

/* Two stacked columns on one scale. For a balance sheet this says in a glance
   what a table of thirty rows says slowly: what the money is in, what it is
   owed to, and that the two sides are the same height. */
export function twoSided(opts) {
  const { left = {}, right = {}, fmt = v => v, height = 340 } = opts;
  const lTotal = left.parts.reduce((a, p) => a + Math.max(0, p.value), 0);
  const rTotal = right.parts.reduce((a, p) => a + Math.max(0, p.value), 0);
  const hi = Math.max(lTotal, rTotal) || 1;
  if (!hi) return `<div class="empty">Nothing to draw yet.</div>`;

  /* Labels sit OUTSIDE the bars. Inside, white on a mid-tone fill measures
     about 3:1, and a value a reader has to squint at is worse than no value. */
  const W = 860, padT = 36, padB = 34;
  const ih = height - padT - padB;
  const colW = 170, lx = 215, rx = W - 215 - colW;

  const column = (side, x, total, offset, labelsOn) => {
    let acc = 0, out = '';
    side.parts.forEach((p, idx) => {
      const i = idx + offset;
      const v = Math.max(0, p.value);
      if (v <= 0) return;
      const h = v / hi * ih;
      const y = padT + ih - (acc + v) / hi * ih;
      out += `<rect x="${x}" y="${y.toFixed(1)}" width="${colW}" height="${Math.max(1, h).toFixed(1)}"
        fill="${seriesColour(i)}" rx="2"
        ><title>${esc(p.name)}: ${esc(fmt(v))} (${(v / total * 100).toFixed(1)}%)</title></rect>`;
      if (h > 26) {
        const tx = labelsOn === 'left' ? x - 14 : x + colW + 14;
        const anchor = labelsOn === 'left' ? 'end' : 'start';
        const cy = y + h / 2;
        out += `<text x="${tx}" y="${(cy - 3).toFixed(1)}" text-anchor="${anchor}"
          style="font-size:11.5px;fill:var(--ink-faint)">${esc(p.name)}</text>`;
        out += `<text x="${tx}" y="${(cy + 16).toFixed(1)}" text-anchor="${anchor}"
          style="font-size:14px;font-weight:700;fill:var(--ink)"
          >${esc(fmt(v))}</text>`;
        out += `<line x1="${labelsOn === 'left' ? x - 9 : x + colW + 9}" x2="${labelsOn === 'left' ? x : x + colW}"
          y1="${cy.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="var(--rule)"/>`;
      }
      acc += v;
    });
    out += `<text x="${x + colW / 2}" y="${padT - 16}" text-anchor="middle"
      style="font-size:12.5px;font-weight:600;fill:var(--ink)">${esc(side.name)}</text>`;
    out += `<text x="${x + colW / 2}" y="${height - 12}" text-anchor="middle"
      style="font-size:14px;font-weight:700;fill:var(--ink)">${esc(fmt(total))}</text>`;
    return out;
  };

  const tie = Math.abs(lTotal - rTotal);
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto" role="img">`;
  svg += `<line x1="24" x2="${W - 24}" y1="${padT + ih}" y2="${padT + ih}" stroke="var(--rule)"/>`;
  svg += column(left, lx, lTotal, 0, 'left');
  svg += column(right, rx, rTotal, left.parts.length, 'right');
  svg += `<path d="M${lx + colW + 10} ${padT + ih / 2}h${rx - lx - colW - 20}"
    stroke="var(--rule)" stroke-dasharray="4 4"/>`;
  svg += `<text x="${(lx + colW + rx) / 2}" y="${padT + ih / 2 - 9}" text-anchor="middle"
    style="font-size:11.5px;fill:var(--ink-faint)">${tie < 1 ? 'balances' : 'out by ' + esc(fmt(tie))}</text>`;
  svg += `</svg>`;
  return svg;
}

/* -------------------------------------------------------------------- dial */

/* One ratio, its band, and where it sits. A number in a box says 1.84; this
   says 1.84 and whether that is comfortable. */
export function dial(opts) {
  const {
    value, min = 0, max = 3, bands = [], fmt = v => v.toFixed(2),
    label = '', note = '', size = 190,
  } = opts;
  if (!Number.isFinite(value)) return `<div class="empty">Not available.</div>`;
  const r = size / 2 - 16, cx = size / 2, cy = size / 2 + 6;
  const a0 = Math.PI * 0.86, a1 = Math.PI * 2.14;          /* open at the bottom */
  const at = v => a0 + (Math.max(min, Math.min(max, v)) - min) / (max - min) * (a1 - a0);
  const pt = (a, rad) => `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
  const arc = (from, to, rad, w, color, op = 1) => {
    const big = (to - from) > Math.PI ? 1 : 0;
    return `<path d="M${pt(from, rad)} A${rad},${rad} 0 ${big} 1 ${pt(to, rad)}"
      fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
  };

  /* ⛔ The cap goes through a custom property so the container can govern it.
     This emitted a bare `max-width:${size}px`, and an inline style beats a
     stylesheet rule, so `.dials svg.dial { max-width: ... }` was a dead
     declaration: the property fed the grid track and nothing else, while the
     comment beside it claimed it fed both. The fallback keeps a dial used
     outside a `.dials` grid drawing at its own size. */
  let svg = `<svg class="chart dial" viewBox="0 0 ${size} ${size}"
    style="width:100%;max-width:var(--dial-cap, ${size}px);height:auto" role="img">`;
  svg += arc(a0, a1, r, 13, 'var(--rule-soft)');
  for (const b of bands) {
    svg += arc(at(b.from), at(b.to), r, 13, b.color || 'var(--rule)', .9);
  }
  svg += arc(a0, at(value), r, 13, 'var(--accent)');
  const tip = at(value);
  svg += `<circle cx="${cx + r * Math.cos(tip)}" cy="${cy + r * Math.sin(tip)}" r="7"
    fill="var(--paper)" stroke="var(--accent)" stroke-width="3"/>`;
  svg += `<text x="${cx}" y="${cy + 2}" text-anchor="middle"
    style="font-size:24px;font-weight:700;fill:var(--ink)"
    font-family="var(--font-display)">${esc(fmt(value))}</text>`;
  svg += `<text x="${cx}" y="${cy + 22}" text-anchor="middle"
    style="font-size:10.5px;fill:var(--ink-faint)">${esc(label)}</text>`;
  svg += `</svg>`;
  return svg + (note ? `<p class="small muted" style="text-align:center;margin:8px 0 0">${note}</p>` : '');
}

/* ------------------------------------------------------------------- slope */

/* Two periods, one line per item. A reader follows the line rather than
   comparing two bars that sit apart, which is what a year-on-year read is. */
export function slope(opts) {
  const { rows = [], fmt = v => v, from = 'Then', to = 'Now', height = 320 } = opts;
  if (!rows.length) return `<div class="empty">Nothing to draw yet.</div>`;
  const all = rows.flatMap(r => [r.from, r.to]).filter(Number.isFinite);
  const lo = Math.min(...all, 0), hi = Math.max(...all);
  const span = (hi - lo) || 1;
  const W = 720, padT = 34, padB = 26, padL = 150, padR = 150;
  const ih = height - padT - padB;
  const y = v => padT + ih - (v - lo) / span * ih;
  const x0 = padL, x1 = W - padR;

  /* LABELS DO NOT SIT ON TOP OF EACH OTHER.

     Two statement lines a few thousand dollars apart land on the same pixel
     row, and the chart printed "Net income" over "EBITDA" and "$1.4M" over
     "$1.3M" on Matt's screen: *"overlapping text on the graph"*. A chart whose
     labels collide is worse than a table, because it looks like data and reads
     like damage.

     Each side is laid out on its own: sort by the position each label wants,
     walk down pushing any that would touch its neighbour, then walk back up if
     the pushing ran past the bottom. The DOT stays on the real value and only
     the text moves, with a hairline joining the two wherever they separated,
     so nothing is misreported. */
  const place = (wanted) => {
    /* 17 units, not 14. A text box is about 1.2x its font size, so an 11.5
       font needs ~14 just to touch: measured, 14 still collided. */
    const MIN = 17;
    const order = wanted.map((v, i) => ({ i, want: v, at: v }))
      .sort((a, b) => a.want - b.want);
    for (let k = 1; k < order.length; k++) {
      if (order[k].at - order[k - 1].at < MIN) order[k].at = order[k - 1].at + MIN;
    }
    const over = order.length ? order[order.length - 1].at - (padT + ih) : 0;
    if (over > 0) {
      for (const o of order) o.at -= over;
      for (let k = order.length - 2; k >= 0; k--) {
        if (order[k + 1].at - order[k].at < MIN) order[k].at = order[k + 1].at - MIN;
      }
    }
    /* ⛔ And not into the column heading above the plot. The first pass pushed
       labels DOWN and then, when they ran off the bottom, lifted the whole
       stack: the topmost one climbed into "October 2026" and collided with it
       instead of with another value. A ceiling is as necessary as a floor. */
    const under = order.length ? padT + 2 - order[0].at : 0;
    if (under > 0) for (const o of order) o.at += under;
    const out = [];
    for (const o of order) out[o.i] = o.at;
    return out;
  };

  const live = rows.filter(r => Number.isFinite(r.from) && Number.isFinite(r.to));
  const leftAt = place(live.map(r => y(r.from)));
  const rightAt = place(live.map(r => y(r.to)));

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto" role="img">`;
  svg += `<line x1="${x0}" x2="${x0}" y1="${padT}" y2="${padT + ih}" stroke="var(--rule)"/>`;
  svg += `<line x1="${x1}" x2="${x1}" y1="${padT}" y2="${padT + ih}" stroke="var(--rule)"/>`;
  svg += `<text x="${x0}" y="${padT - 14}" text-anchor="middle"
    style="font-size:12px;font-weight:600;fill:var(--ink-faint)">${esc(from)}</text>`;
  svg += `<text x="${x1}" y="${padT - 14}" text-anchor="middle"
    style="font-size:12px;font-weight:600;fill:var(--ink-faint)">${esc(to)}</text>`;

  live.forEach((r, i) => {
    const up = r.to >= r.from;
    const c = r.color || (up ? 'var(--good)' : 'var(--bad)');
    const ly = y(r.from), ry = y(r.to);
    svg += `<line x1="${x0}" y1="${ly.toFixed(1)}" x2="${x1}" y2="${ry.toFixed(1)}"
      stroke="${c}" stroke-width="2.2" opacity=".85"
      ><title>${esc(r.name)}: ${esc(fmt(r.from))} to ${esc(fmt(r.to))}</title></line>`;
    svg += `<circle cx="${x0}" cy="${ly.toFixed(1)}" r="4" fill="${c}"/>`;
    svg += `<circle cx="${x1}" cy="${ry.toFixed(1)}" r="4" fill="${c}"/>`;
    if (Math.abs(leftAt[i] - ly) > 1.5) {
      svg += `<line x1="${x0 - 7}" y1="${ly.toFixed(1)}" x2="${x0 - 7}" y2="${leftAt[i].toFixed(1)}"
        stroke="${c}" stroke-width="1" opacity=".4"/>`;
    }
    if (Math.abs(rightAt[i] - ry) > 1.5) {
      svg += `<line x1="${x1 + 7}" y1="${ry.toFixed(1)}" x2="${x1 + 7}" y2="${rightAt[i].toFixed(1)}"
        stroke="${c}" stroke-width="1" opacity=".4"/>`;
    }
    svg += `<text x="${x0 - 12}" y="${(leftAt[i] + 4).toFixed(1)}" text-anchor="end"
      style="font-size:11.5px">${esc(r.name)}</text>`;
    svg += `<text x="${x1 + 12}" y="${(rightAt[i] + 4).toFixed(1)}"
      style="font-size:11.5px">${esc(fmt(r.to))}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

/* Joiners and leavers under a headcount line.

   ⛔ It is drawn in the LINE CHART'S OWN GEOMETRY and not as a row of flex
   divs. The first cut was a flex row, so its columns sat at (i+0.5)/n while
   the line's points sit at i/(n-1) with a 56-unit left gutter: every bar was
   a little way from the month it belonged to, and the reader would have read
   the wrong month's churn against the line above it. Two charts that share an
   axis have to share the arithmetic that draws the axis. */
export function churn({ labels = [], up = [], down = [], height = 54 }) {
  const padL = 56, padR = 14;
  const iw = W - padL - padR;
  const peak = Math.max(1, ...up, ...down);
  const half = (height - 10) / 2;
  const x = i => padL + (labels.length < 2 ? iw / 2 : iw * i / (labels.length - 1));
  const bw = Math.max(4, Math.min(18, iw / Math.max(1, labels.length) * 0.52));
  const mid = height / 2;
  const bars = labels.map((lab, i) => {
    const hUp = (up[i] || 0) / peak * half;
    const hDn = (down[i] || 0) / peak * half;
    const cx = x(i) - bw / 2;
    return `<g><title>${lab}: ${up[i] || 0} joined, ${down[i] || 0} left</title>
      <rect x="${cx.toFixed(1)}" y="${(mid - hUp).toFixed(1)}" width="${bw.toFixed(1)}"
        height="${Math.max(1, hUp).toFixed(1)}" rx="2" class="ch-up"/>
      <rect x="${cx.toFixed(1)}" y="${mid.toFixed(1)}" width="${bw.toFixed(1)}"
        height="${Math.max(1, hDn).toFixed(1)}" rx="2" class="ch-dn"/></g>`;
  }).join('');
  return `<svg class="chart churn-svg" viewBox="0 0 ${W} ${height}" preserveAspectRatio="none"
    role="img" aria-label="People who joined and left each month">
    ${bars}<line x1="${padL}" x2="${W - padR}" y1="${mid}" y2="${mid}" class="ch-axis"/></svg>`;
}
