import { h, s } from '../util.js';
import { hayProgreso, reiniciar } from '../estado.js';

export default function portada() {
  // si ya hay una visita guardada se puede seguir donde se dejó o empezar de cero
  const volviendo = hayProgreso();
  return h('main', { class: 'vista portada' },
    h('div', { class: 'portada__contenido' },
      h('p', { class: 'portada__antes' }, 'Reino de Cregon · año 1218'),
      h('h1', { class: 'portada__titulo' }, 'Archivo de Cregon'),
      s('svg', { class: 'portada__filete', viewBox: '0 0 340 14', 'aria-hidden': 'true' },
        s('path', { d: 'M0 7 H150 M190 7 H340', stroke: 'currentColor', 'stroke-width': 1 }),
        s('path', { d: 'M170 1 L176 7 L170 13 L164 7 Z', fill: 'currentColor' })
      ),
      h('p', { class: 'portada__sub' }, 'lo que quedó después de la caída de los nobles'),
      h('a', { class: 'boton portada__entrar', href: '#/archivo' }, volviendo ? 'Continuar' : 'Entrar'),
      volviendo ? h('a', { class: 'portada__reiniciar', href: '#/archivo', onclick: reiniciar }, 'Empezar de nuevo') : null
    ),
    h('p', { class: 'portada__pie' }, 'Visualización de datos · producto final')
  );
}
