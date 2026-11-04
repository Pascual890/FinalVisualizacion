import { h } from '../util.js';

/**
 * Fondo de los documentos: la misma mesa del escritorio, vista más de cerca.
 * Madera con menos inclinación, la vela arriba a la izquierda (fuera de
 * cuadro), penumbra y resplandor. Sin polvo: detrás de los papeles casi no
 * se veía y obligaba a redibujar toda la pantalla mientras se lee.
 * Es un solo nodo que vive entre vistas, para que al saltar de un documento
 * a otro la mesa no parpadee.
 */
let fondo, madera, ocultar = null;

const quieta = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function crear() {
  madera = h('div', { class: 'fondo-mesa__madera' });
  fondo = h('div', { class: 'fondo-mesa', 'aria-hidden': 'true' },
    madera, h('div', { class: 'penumbra' }), h('div', { class: 'resplandor' }));
  document.body.prepend(fondo);
}

/**
 * Muestra u oculta la mesa de fondo. Si se llega desde el escritorio, la
 * cámara termina de bajar: la mesa se endereza y se aleja un poco.
 */
export function mostrarFondo(activo, { desdeMesa = false } = {}) {
  if (!fondo) crear();
  clearTimeout(ocultar);
  if (!activo) {
    // se quita cuando la vista nueva ya cubrió la pantalla (ver .vista en base.css)
    ocultar = setTimeout(() => fondo.classList.remove('is-activo'), 450);
    return;
  }
  const yaEstaba = fondo.classList.contains('is-activo');
  fondo.classList.add('is-activo');
  if (desdeMesa && !yaEstaba && !quieta()) {
    madera.animate([{ transform: 'rotateX(30deg) scale(1.3)', offset: 0 }],
      { duration: 1100, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }
}

/** Luz de la vela sobre el papel: más cálida cerca de la llama, más oscura lejos. */
export function luzVela() {
  return h('div', { class: 'luz-vela', 'aria-hidden': 'true' });
}
