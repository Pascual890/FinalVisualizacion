import { s, colorDe, num, tip } from '../util.js';
import { marco, animar } from './comun.js';

/**
 * Anillo (Censo) y tarta (Libro de tierras).
 * spec: { tipo: 'anillo'|'tarta', unidad, centro?: {valor, texto}, items: [{etiqueta, valor, casa?, color?}] }
 */
const W = 660, H = 330, CX = 165, CY = 165, R = 140;

export default function circular(cont, spec) {
  const anillo = spec.tipo === 'anillo';
  const r0 = anillo ? 86 : 0;
  const items = spec.items.map(it => ({ ...it, colorFinal: colorDe(it) }));
  const total = items.reduce((a, b) => a + b.valor, 0);
  const { svg } = marco(cont, { ancho: W, alto: H, etiqueta: `${anillo ? 'Anillo' : 'Tarta'}: ${items.map(i => `${i.etiqueta} ${i.valor}`).join(', ')}` });

  const capa = s('g');
  svg.append(capa);
  const sectores = items.map(it => {
    const p = s('path', { class: 'sector marca-dato', fill: it.colorFinal, tabindex: 0, dataset: it.casa ? { casa: it.casa } : {} });
    const pct = Math.round((it.valor / total) * 100);
    const cuerpo = spec.unidad === '%' ? `${it.valor} de cada 100 partes` : `${num.format(it.valor)} ${spec.unidad} · ${pct} %`;
    p.addEventListener('pointermove', ev => tip(ev, it.etiqueta, cuerpo));
    p.addEventListener('pointerleave', () => tip(null));
    capa.append(p);
    return p;
  });

  const arco = (a0, a1) => {
    const pt = (a, r) => [CX + r * Math.sin(a), CY - r * Math.cos(a)];
    const grande = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
    if (!r0) return `M${CX},${CY} L${x0},${y0} A${R},${R} 0 ${grande} 1 ${x1},${y1} Z`;
    const [x2, y2] = pt(a1, r0), [x3, y3] = pt(a0, r0);
    return `M${x0},${y0} A${R},${R} 0 ${grande} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${grande} 0 ${x3},${y3} Z`;
  };

  animar(1100, p => {
    let a = 0;
    items.forEach((it, i) => {
      const da = (it.valor / total) * Math.PI * 2 * p;
      sectores[i].setAttribute('d', arco(a, a + Math.max(da, 0.0001)));
      a += da;
    });
  });

  if (anillo && spec.centro) {
    svg.append(
      s('text', { class: 'centro-valor', x: CX, y: CY + 6, 'text-anchor': 'middle' }, spec.centro.valor),
      s('text', { class: 'centro-texto', x: CX, y: CY + 28, 'text-anchor': 'middle' }, spec.centro.texto)
    );
  }

  // leyenda con valores, a la derecha
  const posiciones = [];
  const x0 = 350;
  const paso = Math.min(56, (H - 20) / items.length);
  const y0 = CY - ((items.length - 1) * paso) / 2;
  items.forEach((it, i) => {
    const y = y0 + i * paso;
    const pct = Math.round((it.valor / total) * 100);
    const g = s('g', { class: 'marca-dato', dataset: it.casa ? { casa: it.casa } : {} },
      s('rect', { x: x0, y: y - 12, width: 16, height: 16, fill: it.colorFinal }),
      s('text', { class: 'etiqueta', x: x0 + 26, y: y + 1 }, it.etiqueta),
      s('text', { class: 'valor valor--fuera', x: x0 + 26, y: y + 20 },
        spec.unidad === '%' ? `${it.valor} %` : `${num.format(it.valor)} ${spec.unidad} · ${pct} %`)
    );
    svg.append(g);
    posiciones.push({ etiqueta: it.etiqueta, x: x0 + 26, y: y + 20 });
  });

  return {
    ancla(sobre) {
      const p = posiciones.find(p => p.etiqueta === sobre);
      return p ? { x: p.x / W, y: p.y / H } : null;
    },
    svg
  };
}
