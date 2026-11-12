import { h, texto, num, bordeIrregular } from '../util.js';
import { barra, rastro, titulo } from './comun.js';

/**
 * La hoja de noticias que leía el comerciante del mercado de Aldemar. A la
 * izquierda la noticia, que se corta donde el papel está quemado; a la derecha,
 * dónde estaban los guardias de la casa Vareck cada día: una barra por día,
 * partida entre las afueras y las ciudades.
 */
export default function noticia(ctx) {
  const d = ctx.docs.noticia;
  const g = d.guardias;

  const filas = g.dias.map((dia, i) => {
    const parte = (clave, nombre) => h('span', {
      class: `guardias__parte guardias__parte--${clave}`,
      style: { '--ancho': `${(dia[clave] / g.total) * 100}%`, '--i': i },
      title: `${dia.fecha}: ${num.format(dia[clave])} guardias en ${nombre}`
    }, dia[clave] / g.total > .12 ? num.format(dia[clave]) : null);
    return h('li', { class: i === g.dias.length - 1 ? 'is-hoy' : null },
      h('span', { class: 'guardias__dia' }, h('b', {}, dia.fecha), h('small', {}, dia.hecho)),
      h('span', {
        class: 'guardias__barra', role: 'img',
        'aria-label': `${dia.fecha}: ${dia.afueras} guardias en las afueras y ${dia.ciudades} en las ciudades`
      }, parte('afueras', 'las afueras'), parte('ciudades', 'las ciudades'))
    );
  });

  const hoja = h('article', { class: 'noticia papel papel--viejo doblada', 'data-abrir': '' },
    h('header', { class: 'noticia__cabecera' },
      h('span', { class: 'noticia__nombre' }, d.cabecera),
      h('span', { class: 'noticia__fecha' }, d.fecha)),
    h('h2', { class: 'noticia__titular' }, d.titular),
    h('div', { class: 'noticia__cuerpo' },
      h('div', { class: 'noticia__texto' },
        h('p', {}, texto(d.texto))),
      h('figure', { class: 'guardias' },
        h('figcaption', {}, h('strong', {}, g.titulo), h('span', {}, g.sub)),
        h('p', { class: 'guardias__leyenda', 'aria-hidden': 'true' },
          h('span', {}, h('i', { class: 'guardias__parte--afueras' }), 'En las afueras'),
          h('span', {}, h('i', { class: 'guardias__parte--ciudades' }), 'En las ciudades')),
        h('ol', { class: 'guardias__dias' }, filas),
        h('p', { class: 'guardias__pie' }, g.pie))
    )
  );

  const vista = h('main', { class: 'vista doc' },
    barra(ctx),
    rastro(),
    titulo(d.titulo, d.sub),
    h('div', { class: 'con-sombra' }, hoja)
  );
  vista.montado = () => bordeIrregular(hoja, { semilla: 41, amplitud: 3.4, paso: 10, quemado: 'bl', radio: 120 });
  return vista;
}
