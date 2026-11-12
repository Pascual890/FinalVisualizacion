import { h, texto, bordeIrregular } from '../util.js';
import { barra, rastro, flecha } from './comun.js';

/**
 * La denuncia: la hoja suelta por la que empieza todo.
 */
export default function denuncia(ctx) {
  const d = ctx.docs.denuncia;
  const parrafo = h('p', { class: 'hoja-suelta__texto' }, texto(d.texto));

  const hoja = h('article', { class: 'hoja-suelta papel papel--trapo doblada', 'data-abrir': '' },
    h('h1', {}, d.titulo),
    h('div', { class: 'pagina__anio' }, d.fuente),
    parrafo,
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

  vista.montado = () => bordeIrregular(hoja, { semilla: 3, amplitud: 2.6, quemado: 'tl', radio: 90 });
  return vista;
}
