/* Shared page furniture: the verdict a page opens on, the figure strip, panels,
   tables. Pages compose these rather than writing markup, so every page in
   every industry carries the same material. */

import { esc, icon } from './icons.js';
import { spark } from './chart.js';
import * as F from './fmt.js';

export function verdict({ title, body, figs = [] }) {
  return `<section class="verdict">
    <h2>${title}</h2>
    ${body ? `<p>${body}</p>` : ''}
    ${figs.length ? `<div class="vstrip">${figs.map(f => `
      <div class="vfig"><div class="vlabel">${esc(f.label)}</div>
      <div class="vvalue">${F.figure(f.value)}</div></div>`).join('')}</div>` : ''}
  </section>`;
}

export function strip(items) {
  return `<div class="strip">${items.map(i => `
    <div class="strip-item">
      <div class="strip-label">${esc(i.label)}</div>
      <div class="strip-value">${F.figure(i.value)}</div>
      ${i.note ? `<div class="strip-note">${i.note}</div>` : ''}
      ${i.spark ? spark(i.spark) : ''}
    </div>`).join('')}</div>`;
}

export function panel({ title, note, right = '', body, foot = '', col = 12, pad = true }) {
  return `<section class="panel col-${col}">
    ${title ? `<div class="panel-head"><div><h3>${esc(title)}</h3>
      ${note ? `<p>${note}</p>` : ''}</div>${right ? `<div class="right">${right}</div>` : ''}</div>` : ''}
    <div class="panel-body" ${pad ? '' : 'style="padding:0"'}>${body}</div>
    ${foot ? `<div class="panel-foot">${foot}</div>` : ''}
  </section>`;
}

export function table({ cols, rows, foot = '', maxHeight = null }) {
  const head = `<tr>${cols.map(c =>
    `<th ${c.n ? 'class="n"' : ''} ${c.w ? `style="width:${c.w}"` : ''}>${esc(c.name)}</th>`).join('')}</tr>`;
  const body = rows.map(r => {
    const attrs = r.click ? ` data-click="${esc(r.click)}" tabindex="0"` : '';
    const cls = r.cls ? ` class="${r.cls}"` : '';
    return `<tr${attrs}${cls}>${r.cells.map((cell, i) =>
      `<td ${cols[i] && cols[i].n ? 'class="n"' : ''}>${cell}</td>`).join('')}</tr>`;
  }).join('');
  const t = `<table class="t"><thead>${head}</thead><tbody>${body}</tbody>${foot ? `<tfoot>${foot}</tfoot>` : ''}</table>`;
  return maxHeight ? `<div class="scroll" style="max-height:${maxHeight}">${t}</div>` : `<div class="scroll">${t}</div>`;
}

export function pageHead({ eyebrow, title, answer, motif = '' }) {
  const body = `<div>
    ${eyebrow ? `<div class="page-eyebrow">${esc(eyebrow)}</div>` : ''}
    <h1 class="page-title">${esc(title)}</h1>
    ${answer ? `<p class="page-answer">${answer}</p>` : ''}
  </div>`;
  return motif
    ? `<header class="page-head with-motif"><span class="head-motif">${motif}</span>${body}</header>`
    : `<header class="page-head">${body}</header>`;
}

export function fresh(q, s) {
  const month = q.view.month;
  const tentative = month > q.closed;
  return `<div class="fresh ${tentative ? 'stale' : ''}">
    <i class="dot"></i>
    <span>${tentative
      ? `<b>${F.monthName(month, true)} is tentative.</b> ${F.monthName(q.closed, true)} is the last month signed off by both finance and the chief executive.`
      : `Signed off through ${F.monthName(q.closed, true)}.`}</span>
    <span class="muted">· ${s.connectedIn('finance').length
      ? `reading ${esc(s.connectedIn('finance')[0].name)}` : 'no ledger connected'}</span>
  </div>`;
}

export function lockedPanel(role, what, col = 12) {
  return `<section class="panel col-${col}"><div class="locked">
    <span class="tag"><i class="dot"></i>Not at this level</span>
    <p class="muted" style="max-width:48ch;margin:0 auto">${esc(what)} is above
    <b>${esc(role.name)}</b>. The level, and what it reaches, is set in Settings &rsaquo; View levels.</p>
  </div></section>`;
}

export function kpiStrip(q, s, ids) {
  return strip(ids.map(id => {
    const k = q.kpi(id);
    return {
      label: k.label,
      value: display(k),
      note: noteOf(k),
      spark: k.spark,
    };
  }));
}

export function display(k) {
  switch (k.display) {
    case 'usd': return F.money(k.value);
    case 'usdExact': return F.money(k.value, {}) === F.HIDDEN_MARK
      ? F.HIDDEN_MARK : F.exact(k.value, k.value < 100 ? 2 : 0);
    case 'pct': return F.pct(k.value, 1);
    case 'num': return F.num(k.value);
    case 'days': return F.num(k.value, 0) + ' days';
    case 'months': return F.num(k.value, 1) + ' mo';
    case 'ratio': return F.ratio(k.value);
    case 'ratio1': return F.num(k.value, 1);
    case 'profitable': return 'None';
    default: return F.num(k.value);
  }
}

function noteOf(k) {
  const bits = [];
  if (Number.isFinite(k.delta)) {
    bits.push(F.deltaTag(k.delta, { invert: !!k.invert, unit: k.deltaUnit === 'pp' ? '%' : '%' })
      + ` <span class="muted">on prior period</span>`);
  }
  if (k.note) bits.push(`<span class="muted">${esc(k.note)}</span>`);
  return bits.join('<br>');
}

export function statusTag(text, kind = '') {
  return `<span class="tag ${kind}"><i class="dot"></i>${esc(text)}</span>`;
}

export function btn(label, { act = '', arg = '', kind = '', ico = '', sm = false } = {}) {
  return `<button class="btn ${kind} ${sm ? 'sm' : ''}" ${act ? `data-act="${esc(act)}"` : ''}
    ${arg ? `data-arg="${esc(arg)}"` : ''}>${ico ? icon(ico, 15) : ''}${esc(label)}</button>`;
}

export function sentence(parts) {
  return parts.filter(Boolean).join(' ');
}
