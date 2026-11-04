import { h } from './util.js';

/**
 * El documento abierto sale desde donde estaba en la mesa (técnica FLIP):
 * se mide dónde estaba el objeto y dónde queda el documento, y se anima la
 * diferencia. La vista marca con [data-abrir] el elemento que viaja.
 */
const reducir = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function abrirDesde(origen, vista, destino = vista.querySelector('[data-abrir]'), duracion = 700) {
  if (!origen || !destino || reducir()) return Promise.resolve();
  const a = origen.rect, b = destino.getBoundingClientRect();
  if (!b.width || !b.height) return Promise.resolve();
  const desde = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
  return destino.animate(
    [{ transform: desde, transformOrigin: '0 0', opacity: .6 }, { transform: 'none', transformOrigin: '0 0', opacity: 1 }],
    { duration: duracion, easing: 'cubic-bezier(.55,.05,.25,1)' }
  ).finished.catch(() => {});
}

/**
 * Tapa de un libro cerrado (la misma cara que tiene en la mesa) con la guarda
 * jaspeada por dentro. Es lo que viaja desde la mesa antes de abrirse.
 */
export function tapaDeLibro({ titulo, sub, tapa }) {
  const filete = () => h('span', { class: 'libro3d__filete' });
  return h('div', { class: `tapa-abre tapa--${tapa}`, 'aria-hidden': 'true' },
    h('div', { class: 'tapa-abre__cara libro3d__tapa' },
      filete(), h('span', { class: 'libro3d__titulo' }, titulo), h('span', { class: 'libro3d__sub' }, sub), filete()),
    h('div', { class: 'tapa-abre__cara tapa-abre__cara--detras' }));
}

/**
 * Abre la tapa sobre su bisagra (borde izquierdo) y la quita al terminar.
 * Si el libro tiene página izquierda, `cuerpo` se recorta para que esa mitad
 * solo aparezca por debajo de la tapa a medida que esta pasa por encima:
 * nunca se ve una página antes de que la tapa termine de abrir.
 */
export function girarTapa(tapa, cuerpo = null, duracion = 1000) {
  if (reducir()) { tapa.remove(); return Promise.resolve(); }
  const op = { duration: duracion, easing: 'cubic-bezier(.55,.05,.25,1)' };
  // la guarda se desvanece al final, cuando la tapa ya está acostada a la izquierda
  tapa.querySelector('.tapa-abre__cara--detras').animate([{ opacity: 1, offset: .8 }, { opacity: 0 }], { ...op, fill: 'forwards' });
  if (cuerpo) {
    // dónde cae el borde libre de la tapa (en % del ancho del libro) según cuánto giró;
    // el lomo está en el 55,55 % (ver .pliego) y la tapa mide el resto
    const LOMO = 55.55, ANCHO = 100 - LOMO;
    // (con un poco de margen hacia el lomo, para ir siempre por detrás del borde)
    const borde = p => Math.min(LOMO, LOMO + ANCHO * Math.cos(Math.PI * p) + 1.5);
    const recorte = izq => `inset(-80px -80px -80px ${izq.toFixed(2)}%)`;
    const pasos = [0, .5, .6, .7, .8, .85].map(p => ({ offset: p, clipPath: recorte(borde(p)) }));
    // el margen exterior de la página izquierda (que la tapa no cubre) aparece con la guarda
    cuerpo.animate([...pasos, { offset: 1, clipPath: recorte(0) }], op);
  }
  return tapa.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], { ...op, fill: 'forwards' })
    .finished.then(() => tapa.remove(), () => tapa.remove());
}
