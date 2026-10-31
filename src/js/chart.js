/* Charts, hand-drawn in SVG.

   No chart library. Everything here draws into a viewBox and scales with the
   panel, every mark carries a <title> so a hover always says what it is, and
   line charts additionally take a cursor guideline wired by wire().

   Series colours come from the validated dataviz palette on :root, never from
   a brand accent, because a brand colour has no contrast guarantee. */

import { esc, hash } from './icons.js';

const W = 720;
let uid = 0;

export function seriesColour(i) {
  const css = getComputedStyle(document.documentElement);
  const v = css.getPropertyValue(`--s${i % 6}`).trim();
  return v || ['#2B7CC4', '#B87D0C', '#0093A1', '#8B5CD6', '#C2408B', '#A2551F'][i % 6];
}

function niceMax(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
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

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto"
    data-chart="line" data-id="${id}" role="img">`;
  svg += `<g class="axis">`;
  for (const t of ticks(lo, hi)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`;
    svg += `<text x="${padL - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${esc(fmt(t))}</text>`;
  }
  svg += `</g>`;
  if (lo < 0) svg += `<line class="zero" x1="${padL}" x2="${W - padR}" y1="${y(0)}" y2="${y(0)}"/>`;

  const step = Math.max(1, Math.ceil(labels.length / 9));
  labels.forEach((l, i) => {
    if (i % step && i !== labels.length - 1) return;
    svg += `<text x="${x(i).toFixed(1)}" y="${height - 7}" text-anchor="middle">${esc(l)}</text>`;
  });

  for (const m of markers) {
    const mx = x(m.at);
    svg += `<line x1="${mx}" x2="${mx}" y1="${padT}" y2="${padT + ih}"
      stroke="var(--ink-faint)" stroke-dasharray="4 3" opacity=".6"/>`;
    if (m.label) svg += `<text x="${mx + 4}" y="${padT + 10}" fill="var(--ink-faint)">${esc(m.label)}</text>`;
  }

  series.forEach((s, si) => {
    const c = s.colour || seriesColour(si);
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
      svg += `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${labels.length > 18 ? 2 : 3}"
        fill="${c}"><title>${esc(s.name)} · ${esc(labels[i] || '')}: ${esc(fmt(v))}</title></circle>`;
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
    `<span><i style="background:${s.colour || seriesColour(i)}${s.dash ? ';opacity:.6' : ''}"></i>${esc(s.name)}</span>`
  ).join('') + `</div>`;
}

/* ------------------------------------------------------------------- bars */

export function bars(opts) {
  const {
    values = [], labels = [], height = 220, fmt = v => v, colour = null,
    target = null, overlay = null, overlayName = 'Budget', name = 'Actual',
    negativeOk = true,
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
  const c = colour || seriesColour(0);

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto" role="img">`;
  svg += `<g class="axis">`;
  for (const t of ticks(lo, hi)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`;
    svg += `<text x="${padL - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${esc(fmt(t))}</text>`;
  }
  svg += `</g>`;
  if (lo < 0) svg += `<line class="zero" x1="${padL}" x2="${W - padR}" y1="${y(0)}" y2="${y(0)}"/>`;

  const step = Math.max(1, Math.ceil(values.length / 12));
  values.forEach((v, i) => {
    const bx = padL + bw * i + bw * 0.18;
    const w = bw * 0.64;
    const top = Math.min(y(v), y(0)), h = Math.max(1.5, Math.abs(y(v) - y(0)));
    svg += `<rect x="${bx.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
      fill="${v < 0 ? 'var(--bad)' : c}" rx="2"><title>${esc(name)} · ${esc(labels[i] || '')}: ${esc(fmt(v))}</title></rect>`;
    if (overlay && Number.isFinite(overlay[i])) {
      svg += `<line x1="${(bx - w * 0.1).toFixed(1)}" x2="${(bx + w * 1.1).toFixed(1)}"
        y1="${y(overlay[i]).toFixed(1)}" y2="${y(overlay[i]).toFixed(1)}"
        stroke="var(--ink)" stroke-width="2" opacity=".75"><title>${esc(overlayName)} · ${esc(labels[i] || '')}: ${esc(fmt(overlay[i]))}</title></line>`;
    }
    if (i % step === 0 || i === values.length - 1) {
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

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto" role="img">`;
  svg += `<g class="axis">`;
  for (const t of ticks(0, hi)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`;
    svg += `<text x="${padL - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${esc(fmt(t))}</text>`;
  }
  svg += `</g>`;
  const step = Math.max(1, Math.ceil(rows.length / 12));
  rows.forEach((r, i) => {
    let acc = 0;
    const bx = padL + bw * i + bw * 0.18, w = bw * 0.64;
    keys.forEach((k, ki) => {
      const v = Math.max(0, r[k] || 0);
      if (v <= 0) return;
      const top = y(acc + v), h = Math.max(0.8, y(acc) - y(acc + v));
      svg += `<rect x="${bx.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
        fill="${seriesColour(ki)}" rx="1.5"><title>${esc(names[k] || k)} · ${esc(labels[i] || '')}: ${esc(fmt(v))}</title></rect>`;
      acc += v;
    });
    if (i % step === 0 || i === rows.length - 1) {
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
  const { parts = [], size = 190, fmt = v => v, centre = null, centreLabel = '' } = opts;
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
      fill="${p.colour || seriesColour(i)}"><title>${esc(p.name)}: ${esc(fmt(p.value))} (${(frac * 100).toFixed(1)}%)</title></path>`;
    a0 = a1;
  });
  if (centre !== null) {
    svg += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" class="readout" style="font-size:17px">${esc(centre)}</text>`;
    svg += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" style="font-size:10px">${esc(centreLabel)}</text>`;
  }
  svg += `</svg>`;
  return svg;
}

export function donutLegend(parts, fmt = v => v) {
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
  return `<div class="rows">` + parts.map((p, i) => `
    <div class="row-item" style="padding:7px 10px">
      <i class="dot" style="background:${p.colour || seriesColour(i)};width:9px;height:9px;flex:0 0 9px"></i>
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
    svg += `<text x="${mid}" y="${height - 26}" text-anchor="middle">${esc(words.slice(0, 2).join(' '))}</text>`;
    if (words.length > 2) svg += `<text x="${mid}" y="${height - 15}" text-anchor="middle">${esc(words.slice(2).join(' '))}</text>`;
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
        <i style="width:${w.toFixed(1)}%;background:${neg ? 'var(--bad)' : (r.colour || seriesColour(r.band ?? 0))}"></i>
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

export function spark(values, { width = 62, height = 20, colour = null } = {}) {
  const v = values.filter(Number.isFinite);
  if (v.length < 2) return '';
  const lo = Math.min(...v), hi = Math.max(...v);
  const span = hi - lo || 1;
  const pts = v.map((d, i) => `${(i / (v.length - 1) * width).toFixed(1)},${(height - (d - lo) / span * height).toFixed(1)}`);
  const up = v[v.length - 1] >= v[0];
  const c = colour || (up ? 'var(--good)' : 'var(--bad)');
  return `<svg class="strip-spark" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
    <polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;
}

/* ---------------------------------------------------------------- scatter */

export function scatter(opts) {
  const { points = [], height = 260, xFmt = v => v, yFmt = v => v, xLabel = '', yLabel = '' } = opts;
  if (!points.length) return `<div class="empty">Nothing to draw yet.</div>`;
  const padL = 60, padR = 18, padT = 16, padB = 40;
  const iw = W - padL - padR, ih = height - padT - padB;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const xhi = niceMax(Math.max(...xs)), yhi = niceMax(Math.max(...ys));
  const xlo = Math.min(0, ...xs), ylo = Math.min(0, ...ys);
  const X = v => padL + (v - xlo) / (xhi - xlo || 1) * iw;
  const Y = v => padT + ih - (v - ylo) / (yhi - ylo || 1) * ih;
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto" role="img">`;
  svg += `<g class="axis">`;
  for (const t of ticks(ylo, yhi)) {
    svg += `<line x1="${padL}" x2="${W - padR}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}"/>`;
    svg += `<text x="${padL - 8}" y="${(Y(t) + 3.5).toFixed(1)}" text-anchor="end">${esc(yFmt(t))}</text>`;
  }
  for (const t of ticks(xlo, xhi)) {
    svg += `<text x="${X(t).toFixed(1)}" y="${height - 22}" text-anchor="middle">${esc(xFmt(t))}</text>`;
  }
  svg += `</g>`;
  points.forEach((p, i) => {
    svg += `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.r || 6}"
      fill="${p.colour || seriesColour(i % 6)}" opacity=".78" stroke="var(--paper)" stroke-width="1.4">
      <title>${esc(p.name)} · ${esc(xLabel)} ${esc(xFmt(p.x))} · ${esc(yLabel)} ${esc(yFmt(p.y))}</title></circle>`;
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
export function wire(root) {
  root.querySelectorAll('svg[data-chart="line"]').forEach(svg => {
    const hit = svg.querySelector('rect.hit');
    const cursor = svg.querySelector('g.cursor');
    if (!hit || !cursor || svg.dataset.wired) return;
    svg.dataset.wired = '1';
    const move = ev => {
      const box = svg.getBoundingClientRect();
      const scale = W / box.width;
      const px = (ev.clientX - box.left) * scale;
      cursor.style.display = '';
      cursor.querySelector('line').setAttribute('x1', px);
      cursor.querySelector('line').setAttribute('x2', px);
    };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerleave', () => { cursor.style.display = 'none'; });
  });
}
