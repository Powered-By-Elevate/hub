/* ---------------------------------------------------------------- colour

   ⛔ ONE PLACE THAT DECIDES WHETHER TEXT READS, AND BOTH THE APP AND THE
      GATE IMPORT IT.

   The build had no contrast check at all until 2026-11-02, and the first one
   added was arithmetic over the stylesheet tokens. That is exact but it only
   sees what the stylesheet declares, and the publishing session's pixel sweep
   found four failures in precisely the gap it cannot reach:

     .page-eyebrow   dark   1.96 to 3.06:1   the brand colour used as ink
     .pf-bar label   light  1.83 to 2.77:1   --ink inside a saturated fill
     .panel-foot     dark   4.09 to 4.37:1   --ink-faint on --tint
     .agepill        dark   3.67 to 4.26:1   --warn and --bad used as ink

   Every one of them is a colour that does not exist in the stylesheet: it is
   the client's brand, mixed at runtime in `Settings.apply()`. `--tint` is the
   clearest case, declared in CSS and computed in JavaScript, where which one
   wins depends on the route taken into the theme. That is the same shape as an
   exclusion list drifting from the DOM it describes and a dial cap emitted
   inline, and it is why this module exists: the derivation is the only source,
   the runtime calls it, and the gate calls the same functions with the same
   brands so a failure is caught without a browser.

   The rule throughout: A FILL KEEPS THE BRAND COLOUR, INK GETS A DERIVED ONE.
   Lifting `--accent` itself would repaint every bar and button to fix a label. */

const hex = c => {
  const s = String(c).trim().replace(/^#/, '');
  const f = s.length === 3 ? s.split('').map(x => x + x).join('') : s;
  return [0, 2, 4].map(i => parseInt(f.substr(i, 2), 16));
};
const toHex = ([r, g, b]) => '#' + [r, g, b]
  .map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');

export function luminance(c) {
  const v = hex(c).map(x => x / 255)
    .map(x => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

export function contrast(a, b) {
  const l1 = luminance(a), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/* Toward white or toward black, whichever the surface needs, in sRGB steps
   that keep the hue recognisable. A brand teal stays a teal: it only gets
   light enough to read. Returns the original when it already clears, so a
   brand that was designed with contrast in mind is never touched. */
export function readable(ink, surface, need = 4.5) {
  if (contrast(ink, surface) >= need) return String(ink);
  const target = luminance(surface) > 0.18 ? [0, 0, 0] : [255, 255, 255];
  const from = hex(ink);
  let best = toHex(target);
  for (let t = 0.04; t <= 1.0001; t += 0.04) {
    const c = toHex(from.map((v, i) => v + (target[i] - v) * t));
    if (contrast(c, surface) >= need) { best = c; break; }
  }
  return best;
}

/* Text sitting INSIDE a saturated fill has no hue choice to make: it is the
   dark ink or the light one, whichever reads on that fill. `.pf-bar`'s label
   was `--ink` over a red status bar at 1.83:1. */
export function onFill(fill, darkInk = '#16202e', lightInk = '#ffffff') {
  return contrast(darkInk, fill) >= contrast(lightInk, fill) ? darkInk : lightInk;
}

/* Lift an ink until it clears on EVERY surface named, not just the first.
   Walks the surfaces and keeps lifting from the result each time, so the
   answer satisfies all of them rather than the last one checked. */
export function worst(ink, surfaces, need = 4.5) {
  let out = String(ink);
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const s of surfaces) {
      const next = readable(out, s, need);
      if (next !== out) { out = next; changed = true; }
    }
    if (!changed) break;
  }
  return out;
}

export function mix(a, b, t) {
  const x = hex(a), y = hex(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

/* The surfaces a brand actually paints, per theme. `tint` is the one the
   stylesheet never sees. The others match the tokens in hub.css and are
   repeated here so the derivation is self-contained and testable. */
export const SURFACE = {
  light: { paper: '#ffffff', ground: '#eef2f7', groundDeep: '#e2e9f1' },
  dark: { paper: '#161d27', ground: '#0e141c', groundDeep: '#0a0f15' },
};
export const INK = {
  light: { ink: '#16202e', soft: '#3a4860', faint: '#5b6a7a' },
  dark: { ink: '#e8edf4', soft: '#a8b5c6', faint: '#7d8b9d' },
};

/* The semantic colours, which are the stylesheet's and not the brand's, but
   are used BOTH as a fill and as ink. `.agepill` wears them as ink and read
   3.67 to 4.26:1 in dark. Same rule: the fill keeps the colour, the ink gets
   a derived one. */
export const SEMANTIC = {
  light: { good: '#1a7d4f', warn: '#9a6512', bad: '#ad2f32' },
  dark: { good: '#4cc08a', warn: '#d8a443', bad: '#e2706f' },
};

/* Everything `Settings.apply()` sets that depends on the brand. One function,
   so the gate can assert the same values the page will wear. */
export function brandVars(palette, theme) {
  const s = SURFACE[theme], k = INK[theme], sem = SEMANTIC[theme];
  /* ⛔ The tint has to let the FAINT ink read on it, because the panel foot
     sits there. In dark it is the navy lightened, so it is pushed back toward
     the panel until faint clears rather than being left where it looked nice. */
  let tint = theme === 'dark' ? mix(palette.navy, '#ffffff', 0.1) : palette.tint;
  for (let i = 0; i < 24 && contrast(k.faint, tint) < 4.5; i++) {
    tint = mix(tint, theme === 'dark' ? '#000000' : '#ffffff', 0.08);
  }
  return {
    '--tint': tint,
    /* ink variants: the brand and the semantics, lifted to read on the ground.
       Measured against the DEEPEST surface they can land on, so one value is
       safe everywhere rather than safe on the page and failing on the rail. */
    '--accent-ink': worst(palette.accent, [s.ground, s.groundDeep]),
    '--accent-ink-deep': readable(palette.accent, s.groundDeep),
    '--accent-on-tint': readable(palette.accent, tint),
    '--on-accent': onFill(palette.accent),
    /* ⛔ Derived against the WORSE of the two surfaces it can land on, which
       is why `worst()` exists. The agepill wears these on `--tint` and read
       3.67:1 in dark while the same colour on the deep ground passed, so a
       value derived against one surface is only safe on that surface. */
    '--good-ink': worst(sem.good, [s.groundDeep, tint]),
    '--warn-ink': worst(sem.warn, [s.groundDeep, tint]),
    '--bad-ink': worst(sem.bad, [s.groundDeep, tint]),
    '--on-bad': onFill(sem.bad),
    '--on-good': onFill(sem.good),
    '--on-warn': onFill(sem.warn),
  };
}
