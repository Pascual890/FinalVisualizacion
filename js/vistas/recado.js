import { h, texto, bordeIrregular } from '../util.js';
import { barra, rastro, titulo } from './comun.js';

/**
 * El recado del dueño del potrero donde dormían Aaron y Leo, escrito con tinta
 * al dorso del aviso de la casa Vareck. Por detrás se trasluce el aviso.
 */
export default function recado(ctx) {
  const d = ctx.docs.recado;
  const hoja = h('article', { class: 'recado papel papel--trapo doblada', 'data-abrir': '' },
    h('div', { class: 'recado__dorso', 'aria-hidden': 'true' }, d.dorso.map(l => h('span', {}, l))),
    h('p', { class: 'recado__fecha' }, d.fecha),
    h('p', { class: 'recado__saludo' }, d.saludo),
    d.parrafos.map(p => h('p', {}, texto(p))),
    h('p', { class: 'recado__firma' }, d.firma)
  );

  const vista = h('main', { class: 'vista doc' },
    barra(ctx),
    rastro(),
    titulo(d.titulo, d.sub),
    h('div', { class: 'con-sombra' }, hoja)
  );
  vista.montado = () => bordeIrregular(hoja, { semilla: 29, amplitud: 3.8, paso: 10, quemado: 'br', radio: 70 });
  return vista;
}
