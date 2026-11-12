import { s, colorDe, cantidad, tip, COLORES } from '../util.js';
import { marco, animar } from './comun.js';

/**
 * Barras horizontales (Cuentas del tesorero: riqueza de cada casa).
 * spec: { unidad, items: [{etiqueta, valor, casa?, color?, aparte?}] }
 * Un item con `aparte: true` se dibuja separado y rayado, como comparación.
 */
const W = 660, FILA = 68, M = { t: 18, r: 176, l: 8 };

export default function barras(cont, spec) {
  const items = spec.items.map(it => ({ ...it, colorFinal: colorDe(it) }));
  const separaciones = items.filter(it => it.aparte).length ? 22 : 0;
  const H = M.t + items.length * FILA + separaciones + 8;
  const { svg } = marco(cont, { ancho: W, alto: H, etiqueta: `Barras: ${items.map(i => `${i.etiqueta}, ${cantidad(i.valor, spec.unidad)}`).join('. ')}` });

  const max = Math.max(...items.map(i => i.valor));
  const largo = v => (v / max) * (W - M.l - M.r);
  const posiciones = [];
  let yy = M.t;

  items.forEach((it, i) => {
    if (it.aparte) {
      svg.append(s('line', { x1: M.l, x2: W - 8, y1: yy + 6, y2: yy + 6, stroke: COLORES.tinta, 'stroke-opacity': .25, 'stroke-dasharray': '4 4' }));
      yy += separaciones;
    }
    const g = s('g', { class: 'marca-dato', tabindex: 0, dataset: it.casa ? { casa: it.casa } : {} });
    const barra = s('rect', {
      class: 'barra-dato', x: M.l, y: yy + 26, height: 22, width: 0,
      fill: it.aparte ? 'url(#rayado-tinta)' : it.colorFinal,
      stroke: it.aparte ? COLORES.tintaTenue : 'none'
    });
    g.append(
      s('text', { class: 'etiqueta', x: M.l, y: yy + 18 }, it.etiqueta),
      barra,
      s('text', { class: `valor${it.aparte ? ' valor--fuera' : ''}`, x: M.l + largo(it.valor) + 10, y: yy + 43 }, cantidad(it.valor, spec.unidad))
    );
    const mostrar = ev => tip(ev, it.etiqueta, cantidad(it.valor, spec.unidad));
    g.addEventListener('pointermove', mostrar);
    g.addEventListener('pointerleave', () => tip(null));
    svg.append(g);
    posiciones.push({ etiqueta: it.etiqueta, y: yy + 37, x: M.l + largo(it.valor) });
    // crecer al entrar
    setTimeout(() => animar(900, p => barra.setAttribute('width', largo(it.valor) * p)), 80 + i * 120);
    yy += FILA;
  });

  return {
    ancla(sobre) {
      const p = posiciones.find(p => p.etiqueta === sobre);
      return p ? { x: p.x / W, y: p.y / H } : null;
    },
    svg
  };
}
