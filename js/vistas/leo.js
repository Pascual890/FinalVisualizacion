import { h, bordeIrregular } from '../util.js';
import { estado } from '../estado.js';
import { barra, rastro, titulo } from './comun.js';

/**
 * La hoja de Leo: lo que no está en ningún registro. Cada nota a lápiz que se
 * encuentra en el archivo destapa una línea; las demás siguen borrosas.
 */
export default function leo(ctx) {
  const d = ctx.docs.leo;
  const total = estado.totalNotas || 1;
  const visibles = Math.floor((estado.notas.size / total) * d.lineas.length);
  const hoja = h('article', { class: 'carta-leo papel papel--trapo doblada', 'data-abrir': '' },
    h('ol', { class: 'carta-leo__lineas' }, d.lineas.map((linea, i) => i < visibles
      ? h('li', { class: 'nota-leo', style: { '--giro': `${(i % 3 - 1) * .6}deg`, animationDelay: `${.3 + i * .25}s` } }, linea)
      : h('li', { class: 'carta-leo__borrosa', 'aria-hidden': 'true' }, linea))),
    visibles >= d.lineas.length ? h('p', { class: 'nota-leo carta-leo__firma' }, `— ${d.firma}`) : null
  );

  const vista = h('main', { class: 'vista doc' },
    barra(ctx),
    rastro(),
    titulo(d.titulo, 'una hoja que no pertenece a ningún libro'),
    h('div', { class: 'con-sombra' }, hoja),
    h('p', { class: 'carta-leo__ayuda' }, visibles >= d.lineas.length
      ? 'Encontraste todas las notas de Leo.'
      : `Has encontrado ${estado.notas.size} de ${total} notas a lápiz. Cada una que encuentres en el archivo hará legible otra línea.`),
    d._borrador ? h('p', { class: 'carta-leo__ayuda borrador' }, 'borrador: el cuento todavía no está completo') : null
  );
  vista.montado = () => bordeIrregular(hoja, { semilla: 21, amplitud: 3.5, paso: 10 });
  return vista;
}
