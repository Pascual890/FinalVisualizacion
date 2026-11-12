import { h, bordeIrregular } from '../util.js';
import { barra, titulo } from './comun.js';

/**
 * Créditos: de qué cuento sale el archivo y de dónde vienen los datos.
 * Es la única página que habla desde fuera de Cregon.
 */
export default function colofon(ctx) {
  const hoja = h('article', { class: 'colofon papel papel--vitela' },
    h('p', { class: 'colofon__antes' }, 'Basado en el cuento'),
    h('h2', { class: 'colofon__cuento' }, 'Sin familia no importa el emblema'),
    h('p', { class: 'colofon__autor' }, 'por Pascualtobias Rendon'),
    h('p', {}, 'Cregon no existe y sus datos son ficticios. Parten de lo que dice el cuento y se completaron para que los documentos coincidan entre sí.'),
    h('p', { class: 'colofon__pie' }, 'Producto final de Visualización de datos')
  );

  const vista = h('main', { class: 'vista doc' },
    barra(ctx),
    titulo('Créditos', 'sobre este archivo'),
    h('div', { class: 'con-sombra' }, hoja)
  );
  vista.montado = () => bordeIrregular(hoja, { semilla: 53, amplitud: 2.6 });
  return vista;
}
