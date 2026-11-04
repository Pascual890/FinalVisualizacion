import { h, s, COLORES } from '../util.js';

/** Contenedor estándar de un gráfico: <figure> con el svg y la leyenda. */
export function marco(cont, { ancho, alto, etiqueta }) {
  const svg = s('svg', { viewBox: `0 0 ${ancho} ${alto}`, role: 'img', 'aria-label': etiqueta });
  svg.append(defs());
  const figura = h('figure', { class: 'grafico', style: { margin: 0 } }, svg);
  cont.append(figura);
  return { figura, svg };
}

/** Patrones compartidos (rayado de la franja de guerra, rayado de "aparte"). */
function defs() {
  return s('defs', {},
    s('pattern', { id: 'rayado', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      s('rect', { width: 7, height: 7, fill: COLORES.sangre, 'fill-opacity': .05 }),
      s('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: COLORES.sangre, 'stroke-opacity': .22, 'stroke-width': 2 })
    ),
    s('pattern', { id: 'rayado-tinta', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-45)' },
      s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: COLORES.tintaTenue, 'stroke-opacity': .7, 'stroke-width': 2 })
    )
  );
}

/** Leyenda que además oculta/muestra series. */
export function leyenda(items, alCambiar) {
  const lista = h('ul', { class: 'leyenda' });
  items.forEach((item, i) => {
    const boton = h('button', {
      type: 'button',
      'aria-pressed': 'true',
      dataset: item.casa ? { casa: item.casa } : {},
      class: item.casa ? 'marca-dato' : null,
      onclick: () => {
        const activo = boton.getAttribute('aria-pressed') !== 'true';
        boton.setAttribute('aria-pressed', String(activo));
        alCambiar(i, activo);
      }
    }, h('i', { style: { background: item.colorFinal } }), item.etiqueta ?? item.nombre);
    lista.append(h('li', {}, boton));
  });
  return lista;
}

/** Escala lineal. */
export function escala([d0, d1], [r0, r1]) {
  const f = v => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
  f.invertir = r => d0 + ((r - r0) / (r1 - r0 || 1)) * (d1 - d0);
  return f;
}

/** Marcas "redondas" para un eje: 0, 250, 500… */
export function marcas(max, cuantas = 5) {
  const paso0 = max / cuantas;
  const mag = 10 ** Math.floor(Math.log10(paso0));
  const paso = [1, 2, 2.5, 5, 10].map(m => m * mag).find(p => p >= paso0);
  const tope = Math.ceil(max / paso) * paso;
  const lista = [];
  for (let v = 0; v <= tope + 1e-9; v += paso) lista.push(+v.toFixed(6));
  return { lista, tope };
}

/** Anima un número de 0 a 1 durante `ms`, con easing. */
export function animar(ms, fn) {
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducir) { fn(1); return; }
  const t0 = performance.now();
  const paso = t => {
    const p = Math.min(1, (t - t0) / ms);
    fn(1 - (1 - p) ** 3);
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
