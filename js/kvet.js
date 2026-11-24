// Květ barev – převzato z Editoru map (knihovna Blossom Color Picker, MIT).
// Režimy lístků: Paleta (dresy a pomůcky) · Odstíny vybrané barvy · Spektrum.
// Lístek z palety vrací vždy přesný odstín (knihovna počítá v HSL a jinak by ho o kousek posunula).

import { BlossomColorPicker, hexToHsl, lightnessToSliderValue } from './vendor/blossom-color-picker.js';
import { PALETA, odstiny, hex, smichej, rozeber, kontrast } from './barvy.js';

export const REZIMY = [
  ['paleta', 'Paleta'],
  ['odstiny', 'Odstíny'],
  ['spektrum', 'Spektrum'],
];

export function barvyRezimu(rezim, zaklad) {
  if (rezim === 'paleta') return unikatni([...PALETA, ...PALETA.map((b) => smichej(b, '#ffffff', 0.55))]);
  if (rezim === 'odstiny') {
    const o = odstiny(zaklad);
    return unikatni([zaklad, ...o.svetlejsi, ...o.tmavsi, ...o.tlumene, ...o.papirove]);
  }
  return null; // spektrum = výchozí barvy knihovny
}
const unikatni = (seznam) => [...new Set(seznam.map((b) => hex(b)).filter(Boolean))];

const vzdalenost = (a, b) => {
  const x = rozeber(a); const y = rozeber(b);
  return x && y ? Math.hypot(x.r - y.r, x.g - y.g, x.b - y.b) : Infinity;
};

function hodnotaZHex(b) {
  const { h, s, l } = hexToHsl(b);
  return { hue: h, saturation: lightnessToSliderValue(l), lightness: l, originalSaturation: s, alpha: 100, layer: 'outer' };
}

export function vytvorKvet(prvek, { barva, rezim = 'paleta', naVyber, naZavreni, velikostStredu = 30 }) {
  let aktualni = hex(barva) || '#1f4fa8';
  let listky = barvyRezimu(rezim, aktualni);
  let potlacit = false;
  const picker = new BlossomColorPicker(prvek, {
    colors: listky || undefined,
    defaultValue: hodnotaZHex(aktualni),
    initialExpanded: false,
    collapsible: true,
    showCoreColor: true,
    adaptivePositioning: true,
    sliderPosition: 'right',
    petalSize: 32,
    coreSize: velikostStredu,
    animationDuration: 280,
    onCollapse: () => naZavreni?.(),
    onChange: (c) => {
      if (potlacit) return;
      let vysledek = c.hex.toLowerCase();
      const nejblizsi = (listky || []).reduce((nej, b) => {
        const d = vzdalenost(b, vysledek);
        return d < nej.d ? { b, d } : nej;
      }, { b: null, d: Infinity });
      if (nejblizsi.d < 7) vysledek = nejblizsi.b;
      aktualni = vysledek;
      naVyber(vysledek);
    },
  });
  const nastavBarvu = (b) => {
    const x = hex(b);
    if (!x) return;
    aktualni = x;
    potlacit = true;
    picker.setValue(hodnotaZHex(x));
    potlacit = false;
  };
  return {
    nastavBarvu,
    nastavRezim(novy, zaklad = aktualni) {
      listky = barvyRezimu(novy, zaklad);
      potlacit = true;
      picker.setOptions({ colors: listky || undefined });
      picker.setValue(hodnotaZHex(aktualni));
      potlacit = false;
    },
    zavri() { picker.collapse(); },
    znic() { picker.destroy(); },
    kontejner: () => prvek.querySelector('.bcp-container'),
    rozkvet: () => picker.expand(),
  };
}

export { kontrast, hex };
