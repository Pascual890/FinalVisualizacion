import { s, tip, COLORES, COLOR_CASA, FORMA_ESCUDO } from '../util.js';
import { marco } from './comun.js';

/**
 * Casas en pie (Libro de linajes): una fila de 12 escudos por año.
 * Es un gráfico de barras hecho de unidades: las casas en pie a la izquierda,
 * las caídas tachadas a la derecha. spec: { cortes: [1207, 1210, 1218] }
 */
const W = 540, FILA = 92, M = { t: 14, l: 50, r: 62 };

export default function escudos(cont, spec, ctx) {
  const casas = ordenar(ctx.casas);
  const H = M.t + spec.cortes.length * FILA;
  const { svg } = marco(cont, { ancho: W, alto: H, etiqueta: `Casas en pie: ${spec.cortes.map(a => `${a}: ${enPie(casas, a)}`).join(', ')}` });
  const paso = (W - M.l - M.r) / casas.length;
  const escala = (paso - 6) / 60;

  spec.cortes.forEach((anio, fila) => {
    const y = M.t + fila * FILA;
    const cuantas = enPie(casas, anio);
    svg.append(
      s('text', { class: 'fila-anio', x: 0, y: y + 38 }, anio),
      s('text', { class: 'fila-cuenta', x: W, y: y + 38, 'text-anchor': 'end' }, `${cuantas} casas`)
    );
    casas.forEach((casa, i) => {
      const caida = casa.cae != null && casa.cae <= anio;
      const recien = caida && casa.cae === anio;
      const color = COLOR_CASA[casa.id] ?? COLORES.tintaTenue;
      const g = s('g', {
        class: `escudo marca-dato${caida ? ' escudo--caido' : ''}`,
        tabindex: 0,
        transform: `translate(${M.l + i * paso + 3} ${y}) scale(${escala})`,
        dataset: COLOR_CASA[casa.id] ? { casa: casa.id } : {}
      },
        s('path', { class: 'forma', d: FORMA_ESCUDO, fill: color, stroke: COLORES.tinta, 'stroke-opacity': .35, 'stroke-width': 1.5 }),
        caida ? null : s('text', { x: 30, y: 44, 'text-anchor': 'middle', 'font-family': 'Cinzel, serif', 'font-size': 24, fill: COLORES.pergamino }, casa.nombre[0])
      );
      if (recien) {
        // tachón a mano en el año en que cayó
        const tachon = s('path', { class: 'tachon', d: 'M8 12 L52 60 M52 14 L10 58', fill: 'none', 'vector-effect': 'non-scaling-stroke' });
        tachon.style.animationDelay = `${400 + fila * 500 + i * 60}ms`;
        g.append(tachon);
      }
      const texto = caida ? `Cayó antes de ${casa.cae}: ${casa.nota}.` : `En pie en ${anio}.`;
      g.addEventListener('pointermove', ev => tip(ev, `Casa ${casa.nombre}`, texto));
      g.addEventListener('pointerleave', () => tip(null));
      svg.append(g);
    });
  });

  return { svg };
}

const enPie = (casas, anio) => casas.filter(c => c.cae == null || c.cae > anio).length;

/** En pie primero; luego las que cayeron más tarde; al final las primeras en caer. */
function ordenar(casas) {
  return [...casas].sort((a, b) => (b.cae ?? 9999) - (a.cae ?? 9999));
}
