import { h, s, texto, num, bordeIrregular } from '../util.js';
import { barra, rastro, titulo } from './comun.js';

/**
 * La hoja de noticias que leía el comerciante del mercado de Aldemar. A la
 * izquierda la noticia, que se pierde bajo el hollín de la esquina quemada; a la derecha,
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
        h('p', {}, texto(d.texto), ' ', d.resto)),
      h('figure', { class: 'guardias' },
        h('figcaption', {}, h('strong', {}, g.titulo), h('span', {}, g.sub)),
        h('p', { class: 'guardias__leyenda', 'aria-hidden': 'true' },
          h('span', {}, h('i', { class: 'guardias__parte--afueras' }), 'En las afueras'),
          h('span', {}, h('i', { class: 'guardias__parte--ciudades' }), 'En las ciudades')),
        h('ol', { class: 'guardias__dias' }, filas),
        h('p', { class: 'guardias__pie' }, g.pie))
    ),
    mugre()
  );

  const vista = h('main', { class: 'vista doc' },
    barra(ctx),
    rastro(),
    titulo(d.titulo, d.sub),
    h('div', { class: 'con-sombra' }, hoja)
  );
  vista.montado = () => bordeIrregular(hoja, { semilla: 41, amplitud: 3.4, paso: 10, quemado: 'bl', radio: 200, estira: 1.7 });
  return vista;
}

/**
 * Hollín y manchas alrededor de la quemadura: ruido fractal convertido en
 * manchas pardas (grandes) y motas (pequeñas). El CSS lo desvanece al
 * alejarse de la esquina. Se pinta una sola vez, no se anima.
 */
function mugre() {
  const capa = (id, frecuencia, octavas, semilla, alfa) => [
    s('filter', { id, x: 0, y: 0, width: '100%', height: '100%' },
      s('feTurbulence', { type: 'fractalNoise', baseFrequency: frecuencia, numOctaves: octavas, seed: semilla }),
      s('feColorMatrix', { values: `0 0 0 0 .12  0 0 0 0 .075  0 0 0 0 .04  ${alfa}` })),
    s('rect', { width: '100%', height: '100%', filter: `url(#${id})` })
  ];
  return s('svg', { class: 'noticia__mugre', 'aria-hidden': 'true', preserveAspectRatio: 'none' },
    ...capa('mugre-manchas', '.011 .017', 4, 9, '4.2 0 0 0 -1.7'),
    ...capa('mugre-motas', '.55', 2, 4, '8 0 0 0 -4.3'));
}
