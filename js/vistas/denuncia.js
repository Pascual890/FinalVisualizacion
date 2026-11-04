import { h, texto, bordeIrregular } from '../util.js';
import { capaTrazos, trazar, tachon } from '../marcas.js';
import { barra, rastro, notaLeo, flecha } from './comun.js';

/**
 * La denuncia: la hoja suelta por la que empieza todo. Leo tachó a lápiz
 * "desconocido" y escribió encima quién fue.
 */
export default function denuncia(ctx) {
  const d = ctx.docs.denuncia;
  const parrafo = h('p', { class: 'hoja-suelta__texto' }, texto(d.texto));
  const tachado = d.nota.tacha ? envolver(parrafo, d.nota.tacha) : null;
  if (tachado) tachado.append(notaLeo(d.nota, { giro: -7 }));

  const hoja = h('article', { class: 'hoja-suelta papel papel--trapo doblada', 'data-abrir': '' },
    h('h1', {}, d.titulo),
    h('div', { class: 'pagina__anio' }, d.fuente),
    parrafo,
    tachado ? null : notaLeo(d.nota, { giro: -6 }),
    h('span', { class: 'lacre', 'aria-hidden': 'true' })
  );

  const vista = h('main', { class: 'vista doc' },
    barra(ctx),
    rastro(),
    h('div', { class: 'con-sombra' }, hoja),
    h('nav', { class: 'hilo', 'aria-label': 'Seguir el hilo' },
      h('h2', {}, 'Seguir el hilo'),
      h('ul', {}, d.seguir.map(l => h('li', {}, h('a', { class: 'boton', href: l.href }, l.texto, h('span', { style: { transform: 'scaleX(-1)', display: 'inline-flex' } }, flecha())))))
    )
  );

  vista.montado = () => {
    bordeIrregular(hoja, { semilla: 3, amplitud: 2.6, quemado: 'tl', radio: 90 });
    if (tachado) {
      const r = tachado.getBoundingClientRect();
      const capa = capaTrazos(r.width + 16, r.height + 12);
      tachado.append(capa);
      trazar(capa, tachon(r.width + 16, r.height + 12), .2);
    }
  };
  return vista;
}

/** Envuelve la primera aparición de `palabra` en un <span class="tachado">. */
function envolver(contenedor, palabra) {
  const recorrido = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT);
  for (let nodo = recorrido.nextNode(); nodo; nodo = recorrido.nextNode()) {
    const i = nodo.textContent.indexOf(palabra);
    if (i < 0) continue;
    const resto = nodo.splitText(i);
    resto.splitText(palabra.length);
    const span = h('span', { class: 'tachado' }, resto.textContent);
    resto.replaceWith(span);
    return span;
  }
  return null;
}
