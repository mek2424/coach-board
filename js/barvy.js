// Barvy (převzato z Editoru map): paleta, odvozené odstíny, ladicí barvy a kontrast.

// Trenérova tabulka: paleta dresů a pomůcek (místo palety ČT z Editoru map).
export const PALETA = [
  '#c62828', '#ef6c2f', '#f2c200', '#2e9e48', '#1ea7d8', '#1f4fa8',
  '#7b3fbf', '#e0559a', '#1b2430', '#8a8f9e', '#ffffff',
];
export const PALETA_CT = PALETA;



const ctx = document.createElement('canvas').getContext('2d');

// Libovolný zápis barvy CSS → {r,g,b,a}, nebo null.
export function rozeber(barva) {
  if (typeof barva !== 'string') return null;
  ctx.fillStyle = '#010203';
  ctx.fillStyle = barva;
  const s = ctx.fillStyle;
  if (s === '#010203' && barva.trim().toLowerCase() !== '#010203') return null;
  if (s.startsWith('#')) {
    return { r: parseInt(s.slice(1, 3), 16), g: parseInt(s.slice(3, 5), 16), b: parseInt(s.slice(5, 7), 16), a: 1 };
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x));
  return { r, g, b, a };
}

const h2 = (x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0');
export const naHex = ({ r, g, b }) => `#${h2(r)}${h2(g)}${h2(b)}`;
export function hex(barva) {
  const c = rozeber(barva);
  return c ? naHex(c) : null;
}

export function smichej(a, b, t) {
  const x = rozeber(a); const y = rozeber(b);
  if (!x || !y) return a;
  return naHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}

function naHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  let h = 0; let s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}
function zHsl({ h, s, l }) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return naHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

// Světlejší, tmavší a tlumené odstíny jedné barvy.
export function odstiny(barva) {
  return {
    svetlejsi: [0.88, 0.75, 0.6, 0.45, 0.3, 0.15].map((t) => smichej(barva, '#ffffff', t)),
    tmavsi: [0.2, 0.4, 0.6].map((t) => smichej(barva, '#000000', t)),
    tlumene: [0.25, 0.45, 0.65].map((t) => smichej(barva, '#8a8f9e', t)),
    papirove: [0.9, 0.94, 0.97].map((t) => smichej(barva, '#f6f3ec', t)),
  };
}

// Barvy, které k vybrané ladí (podle barevného kruhu), zarovnané na nejbližší
// barvu palety ČT, pokud je dost blízko.
export function ladici(barva) {
  const c = rozeber(barva);
  if (!c) return [];
  const hsl = naHsl(c);
  const nav = [
    ['Doplňková', 180], ['Sousední −30°', -30], ['Sousední +30°', 30],
    ['Rozdělená −150°', -150], ['Rozdělená +150°', 150], ['Trojice +120°', 120],
  ];
  return nav.map(([nazev, posun]) => {
    const navrh = zHsl({ ...hsl, h: hsl.h + posun, s: Math.max(hsl.s, 0.25) });
    const blizka = nejblizsiZPalety(navrh);
    return { nazev, barva: blizka.vzdalenost < 60 ? blizka.barva : navrh, zPalety: blizka.vzdalenost < 60 };
  });
}

export function nejblizsiZPalety(barva) {
  const c = rozeber(barva);
  let nej = { barva: PALETA_CT[0], vzdalenost: Infinity };
  for (const p of PALETA_CT) {
    const d = rozeber(p);
    const v = Math.hypot(c.r - d.r, c.g - d.g, c.b - d.b);
    if (v < nej.vzdalenost) nej = { barva: p, vzdalenost: v };
  }
  return nej;
}

function jas(c) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
// Kontrastní poměr podle WCAG (1–21).
export function kontrast(a, b) {
  const x = rozeber(a); const y = rozeber(b);
  if (!x || !y) return null;
  const [l1, l2] = [jas(x), jas(y)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
}
