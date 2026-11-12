import { h, s } from '../util.js';
import { estado, seguir, cortarRastro } from '../estado.js';

/** Barra superior: nombre del archivo y a quién se sigue. */
export function barra(ctx, { volver = true, colofon = false } = {}) {
  const fin = h('div', { class: 'barra__fin' });
  const nodo = h('header', { class: volver ? 'barra barra--volver' : 'barra' },
    volver ? h('a', { class: 'volver', href: '#/archivo' }, flecha(), h('span', {}, 'Volver', h('span', { class: 'volver__resto' }, ' a la mesa'))) : null,
    h('a', { class: 'marca', href: '#/archivo', 'aria-label': 'Archivo de Cregon: volver al escritorio' },
      h('span', { class: 'marca__nombre' }, 'Archivo de Cregon'),
      h('span', { class: 'marca__sub' }, 'lo que quedó después de la caída')
    ),
    fin
  );
  const pintar = () => {
    fin.replaceChildren(...[
      estado.seguido ? sello(ctx) : null,
      colofon ? h('a', { class: 'barra__colofon', href: '#/creditos' }, 'Créditos') : null
    ].filter(Boolean));
  };
  pintar();
  nodo.actualizar = pintar;
  return nodo;
}

function sello(ctx) {
  const casa = ctx.casas.find(c => c.id === estado.seguido);
  return h('span', { class: 'siguiendo' },
    h('a', { href: `#/doc/linajes/${casa.id}`, style: { textDecoration: 'none' } }, `Siguiendo a ${casa.nombre}`),
    h('button', { type: 'button', 'aria-label': `Dejar de seguir a ${casa.nombre}`, onclick: () => seguir(casa.id) }, '×')
  );
}

export function flecha() {
  return s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'aria-hidden': 'true' },
    s('path', { d: 'M10 3 L5 8 L10 13' }));
}

/** Rastro de documentos recorridos. */
export function rastro() {
  if (estado.rastro.length < 2) return null;
  return h('nav', { class: 'rastro', 'aria-label': 'Documentos recorridos' },
    h('ol', {}, estado.rastro.map((p, i) => h('li', {},
      i === estado.rastro.length - 1
        ? h('span', { 'aria-current': 'page' }, p.titulo)
        : h('a', { href: p.href }, p.titulo)
    )))
  );
}

/** Título grande del documento. */
export function titulo(texto, sub) {
  return h('div', { class: 'doc__titulo' }, h('h1', {}, texto), sub ? h('span', {}, sub) : null);
}

/** Número romano (para páginas y folios, como en la infografía). */
export function romano(n) {
  const tabla = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = '';
  for (const [v, l] of tabla) while (n >= v) { r += l; n -= v; }
  return r;
}

/** Bandeja inferior: todos los documentos, para saltar sin volver a la mesa. */
export function bandeja(ctx, actual) {
  return h('nav', { class: 'bandeja', 'aria-label': 'Documentos del archivo' },
    ctx.documentos.map(d => h('a', {
      href: `#/doc/${d.id}`,
      onclick: cortarRastro,
      'aria-current': d.id === actual ? 'page' : null,
      class: d.tapa ? `tapa--${d.tapa}` : null
    }, h('i', { class: d.forma === 'libro' ? null : d.forma === 'caja' ? 'es-caja' : 'es-papel', 'aria-hidden': 'true' }), d.corto ?? d.titulo))
  );
}
