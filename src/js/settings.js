/* The configuration a client owns, and the one function that applies it.

   Everything a company changes about a Hub without a build lives in this
   object: its name, its logo, its colours, its typefaces, which software is
   connected, which modules are on, and what the view levels are called. It
   persists to this browser and exports as a JSON file, which is the file a
   real deployment is built from. That is the CMS: one object, one apply(). */

const KEY = 'hub.settings.v2';

export const SERIES_FALLBACK = {
  light: ['#2B7CC4', '#B87D0C', '#0093A1', '#8B5CD6', '#C2408B', '#A2551F'],
  dark: ['#4A93D6', '#C08611', '#00A8BA', '#8A63D4', '#D9548C', '#B8642A'],
};

export class Settings {
  constructor(cfg) {
    this.cfg = cfg;                 /* product, brands, industries, connectors, roles */
    this.data = this.defaults(cfg.industries.industries[0].id);
    this.listeners = [];
  }

  defaults(industryId) {
    const ind = this.cfg.industries.industries.find(i => i.id === industryId)
      || this.cfg.industries.industries[0];
    const brand = this.cfg.brands.brands[ind.brand] || this.cfg.brands.brands.default;
    const on = {};
    for (const [cat, picked] of Object.entries(ind.connected || {})) {
      const ids = Array.isArray(picked) ? picked : (picked ? [picked] : []);
      for (const id of ids) on[id] = true;
    }
    return {
      industry: industryId,
      company: ind.company,
      brandKey: ind.brand,
      brand: {
        name: brand.name,
        mono: brand.mono,
        shape: brand.shape,
        palette: { ...brand.palette },
        type: { ...brand.type },
        logo: null,            /* a data URL once a client uploads one */
        logoDark: null,
      },
      theme: 'light',
      role: 'exec',
      entity: '*',
      basis: 'ytd',
      month: null,             /* null means the newest month in the extract */
      modules: Object.fromEntries(Object.keys(this.cfg.product.modules)
        .filter(m => !m.startsWith('$')).map(m => [m, true])),
      connectors: on,
      roles: JSON.parse(JSON.stringify(this.cfg.roles.roles)),
      showDemoNote: true,
      productName: this.cfg.product.product.name,
    };
  }

  /* ------------------------------------------------------------ lifecycle */

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.industry) this.data = { ...this.data, ...saved };
      }
    } catch (err) {
      /* a private window, cleared site data, or a blocked store: carry on with
         the defaults rather than failing to render */
    }
    return this;
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (err) { /* ignore */ }
    return this;
  }

  reset(industryId = this.data.industry) {
    this.data = this.defaults(industryId);
    try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
    this.apply();
    this.emit();
    return this;
  }

  /* Switch the whole demo to another industry: company, brand and connected
     software all move together, which is the swap the product is selling. */
  useIndustry(industryId) {
    const keepTheme = this.data.theme;
    const keepRole = this.data.role;
    this.data = this.defaults(industryId);
    this.data.theme = keepTheme;
    this.data.role = keepRole;
    this.save().apply();
    return this;
  }

  on(fn) { this.listeners.push(fn); return this; }
  emit() { for (const fn of this.listeners) fn(this.data); }

  /* --------------------------------------------------------------- apply */

  apply() {
    const d = this.data;
    const root = document.documentElement;
    const p = d.brand.palette;
    root.dataset.theme = d.theme;
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--accent-deep', p.accentDeep);
    root.style.setProperty('--accent-lift', p.accentLift);
    root.style.setProperty('--tint', d.theme === 'dark' ? mix(p.navy, '#ffffff', 0.1) : p.tint);
    root.style.setProperty('--navy', p.navy);
    root.style.setProperty('--font-display', d.brand.type.display);
    root.style.setProperty('--font-body', d.brand.type.body);

    const series = (this.cfg.brands.series || SERIES_FALLBACK)[d.theme] || SERIES_FALLBACK.light;
    series.forEach((c, i) => root.style.setProperty(`--s${i}`, c));

    document.title = `${d.company} · ${d.productName}`;
    this.fonts(d.brand.type.google);
    return this;
  }

  fonts(spec) {
    if (!spec) return;
    const href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
    let link = document.getElementById('brand-fonts');
    if (!link) {
      link = document.createElement('link');
      link.id = 'brand-fonts';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }

  /* -------------------------------------------------------------- helpers */

  get industry() {
    return this.cfg.industries.industries.find(i => i.id === this.data.industry)
      || this.cfg.industries.industries[0];
  }

  get role() {
    return this.data.roles.find(r => r.id === this.data.role) || this.data.roles[0];
  }

  roleById(id) { return this.data.roles.find(r => r.id === id); }

  isOn(connectorId) { return !!this.data.connectors[connectorId]; }

  setConnector(id, on) {
    if (on) this.data.connectors[id] = true;
    else delete this.data.connectors[id];
    this.save();
  }

  connectorsIn(cat) {
    return this.cfg.connectors.connectors.filter(c =>
      c.cat === cat && (!c.industries || c.industries.includes(this.data.industry)));
  }

  connectedIn(cat) { return this.connectorsIn(cat).filter(c => this.isOn(c.id)); }

  connector(id) { return this.cfg.connectors.connectors.find(c => c.id === id); }

  /* Which pages this role is offered, in rail order. A module switched off
     removes its pages for everyone, a rank removes them for one person. */
  pages() {
    const out = [];
    const cat = this.cfg.product.pages;
    const role = this.role;
    const indPages = this.industry.pages || {};
    for (const [id, base] of Object.entries(cat)) {
      if (id.startsWith('$') || base.hidden) continue;
      if (!this.data.modules[base.module]) continue;
      if (indPages[id] === false) continue;
      const over = indPages[id] || {};
      if (role.deny && role.deny.includes(id) && !(role.allow || []).includes(id)) continue;
      const allowed = (role.allow || []).includes(id) || base.rank <= role.rank;
      if (!allowed) continue;
      out.push({ id, ...base, ...over, module: base.module });
    }
    return out;
  }

  modulesWithPages() {
    const pages = this.pages();
    const mods = this.cfg.product.modules;
    const seen = new Map();
    for (const p of pages) {
      if (!seen.has(p.module)) seen.set(p.module, { id: p.module, ...mods[p.module], pages: [] });
      seen.get(p.module).pages.push(p);
    }
    return [...seen.values()].sort((a, b) => a.order - b.order);
  }

  /* the file a real deployment is built from */
  exportJSON() {
    const d = this.data;
    return JSON.stringify({
      $comment: 'A Hub client configuration. Hand this to the build and the dashboard comes out branded, connected and role-scoped.',
      product: d.productName,
      client: { name: d.company, industry: d.industry },
      brand: d.brand,
      modules: d.modules,
      connectors: Object.keys(d.connectors).sort(),
      roles: d.roles,
      defaults: { theme: d.theme, basis: d.basis, role: d.role },
    }, null, 2);
  }

  importJSON(text) {
    const o = JSON.parse(text);
    if (o.client && o.client.industry) this.data.industry = o.client.industry;
    if (o.client && o.client.name) this.data.company = o.client.name;
    if (o.brand) this.data.brand = { ...this.data.brand, ...o.brand };
    if (o.modules) this.data.modules = { ...this.data.modules, ...o.modules };
    if (Array.isArray(o.connectors)) {
      this.data.connectors = Object.fromEntries(o.connectors.map(id => [id, true]));
    }
    if (Array.isArray(o.roles) && o.roles.length) this.data.roles = o.roles;
    if (o.defaults) {
      if (o.defaults.theme) this.data.theme = o.defaults.theme;
      if (o.defaults.role) this.data.role = o.defaults.role;
      if (o.defaults.basis) this.data.basis = o.defaults.basis;
    }
    this.save().apply();
    return this;
  }
}

/* ----------------------------------------------------------------- colour */

export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  if (!A || !B) return a;
  return '#' + [0, 1, 2].map(i =>
    Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join('');
}

export function rgb(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

export function luminance(hex) {
  const c = rgb(hex);
  if (!c) return 0;
  const f = c.map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
}

export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* Derive a usable palette from one brand colour. A client who hands over a
   single hex still gets a complete, readable set rather than a guess. */
export function paletteFrom(accent) {
  const white = '#ffffff';
  let deep = accent, lift = accent;
  for (let t = 0.1; t <= 0.6; t += 0.05) {
    deep = mix(accent, '#000000', t);
    if (contrast(deep, white) >= 5.5) break;
  }
  for (let t = 0.1; t <= 0.7; t += 0.05) {
    lift = mix(accent, white, t);
    if (contrast(lift, '#0e141c') >= 5.5) break;
  }
  return {
    accent: contrast(accent, white) >= 4.5 ? accent : deep,
    accentDeep: mix(accent, '#000000', 0.42),
    accentLift: lift,
    tint: mix(accent, white, 0.92),
    navy: mix(accent, '#07101c', 0.72),
  };
}
