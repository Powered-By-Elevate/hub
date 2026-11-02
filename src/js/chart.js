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
      fill="${v < 0 ? negColor : c}" rx="2"><title>${esc(name)} · ${esc(labels[i] || '')}: ${esc(fmt(v))}</title></rect>`;
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
    svg += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" style="font-size:10px">${esc(centerLabel)}</text>`;
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
      fill="${p.color || seriesColour(i % 6)}" opacity=".78" stroke="var(--paper)" stroke-width="1.4">
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
  return svg + `<div class="chart-legend" style="margin-top:12px">
    <span>${esc(fmt(lo))}</span>
    ${[0.04, 0.3, 0.5, 0.75, 0.96].map(t =>
      `<i style="background:var(--accent);opacity:${band(t)};width:22px;height:11px;
        border-radius:2px;display:inline-block"></i>`).join('')}
    <span>${esc(fmt(hi))}</span>
    <span class="muted">${esc(label || 'lower')} to the left, higher to the right</span>
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

function trim(s, n) {
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
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
    return `<div class="mult" ${r.click ? `data-click="${esc(r.click)}" tabindex="0"` : ''}>
      <div class="mult-head"><b>${esc(trim(r.name, 20))}</b>
        <span class="${up ? 'delta up' : 'delta down'}">${esc(show(last))}</span></div>
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
        out += `<text x="${tx}" y="${(cy + 13).toFixed(1)}" text-anchor="${anchor}"
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

  let svg = `<svg class="chart dial" viewBox="0 0 ${size} ${size}"
    style="width:100%;max-width:${size}px;height:auto" role="img">`;
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

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${height}" style="width:100%;height:auto" role="img">`;
  svg += `<line x1="${x0}" x2="${x0}" y1="${padT}" y2="${padT + ih}" stroke="var(--rule)"/>`;
  svg += `<line x1="${x1}" x2="${x1}" y1="${padT}" y2="${padT + ih}" stroke="var(--rule)"/>`;
  svg += `<text x="${x0}" y="${padT - 14}" text-anchor="middle"
    style="font-size:12px;font-weight:600;fill:var(--ink-faint)">${esc(from)}</text>`;
  svg += `<text x="${x1}" y="${padT - 14}" text-anchor="middle"
    style="font-size:12px;font-weight:600;fill:var(--ink-faint)">${esc(to)}</text>`;

  rows.forEach((r, i) => {
    if (!Number.isFinite(r.from) || !Number.isFinite(r.to)) return;
    const up = r.to >= r.from;
    const c = r.color || (up ? 'var(--good)' : 'var(--bad)');
    svg += `<line x1="${x0}" y1="${y(r.from).toFixed(1)}" x2="${x1}" y2="${y(r.to).toFixed(1)}"
      stroke="${c}" stroke-width="2.2" opacity=".85"
      ><title>${esc(r.name)}: ${esc(fmt(r.from))} to ${esc(fmt(r.to))}</title></line>`;
    svg += `<circle cx="${x0}" cy="${y(r.from).toFixed(1)}" r="4" fill="${c}"/>`;
    svg += `<circle cx="${x1}" cy="${y(r.to).toFixed(1)}" r="4" fill="${c}"/>`;
    svg += `<text x="${x0 - 10}" y="${(y(r.from) + 4).toFixed(1)}" text-anchor="end"
      style="font-size:11.5px">${esc(r.name)}</text>`;
    svg += `<text x="${x1 + 10}" y="${(y(r.to) + 4).toFixed(1)}"
      style="font-size:11.5px">${esc(fmt(r.to))}</text>`;
  });
  svg += `</svg>`;
  return svg;
}
