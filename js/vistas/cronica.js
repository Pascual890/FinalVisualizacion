import { h, texto, bordeIrregular } from '../util.js';
import { abrirDesde, tapaDeLibro, girarTapa } from '../apertura.js';
import { barra, rastro, notaLeo, titulo } from './comun.js';

/**
 * Crónica del reino: los momentos del storyboard, en orden. En la mesa es un
 * libro, así que al llegar desde ella viaja cerrado y se abre su tapa, como
 * los demás libros (aquí con una sola hoja debajo).
 */
export default function cronica(ctx) {
  const d = ctx.docs.cronica;
  const meta = ctx.documentos.find(x => x.id === 'cronica');
  const ultimo = d.momentos.length - 1;
  const vista = h('main', { class: 'vista doc' },
    barra(ctx),
    rastro(),
    titulo(d.titulo, meta.sub),
    h('div', { class: 'con-sombra cronica__mesa' }, h('article', { class: 'cronica papel papel--viejo', 'data-abrir': '' },
      h('ol', { class: 'linea-tiempo' }, d.momentos.map((m, i) => h('li', { class: `momento${i === ultimo ? ' momento--fin' : ''}` },
        h('span', { class: 'momento__anio' }, m.anio),
        h('span', { class: 'momento__punto', 'aria-hidden': 'true' }),
        h('div', {},
          h('h3', {}, m.titulo),
          h('p', {}, texto(m.texto)),
          m.ver ? h('a', { class: 'ref momento__ver', href: m.ver }, 'ver en el archivo') : null,
          d.nota.sobre === i ? notaLeo(d.nota, { giro: -3 }) : null
        )
      ))),
      h('div', { class: 'pagina-blanca', 'aria-hidden': 'true' })
    ))
  );
  vista.abreSolo = true;   // la apertura la hace la propia crónica (tapa incluida)
  vista.montado = ({ origen } = {}) => {
    const hoja = vista.querySelector('.cronica'), mesa = vista.querySelector('.cronica__mesa');
    bordeIrregular(hoja, { semilla: 17, amplitud: 2.8 });
    if (!origen) return;
    if (matchMedia('(max-width: 900px)').matches) return abrirDesde(origen, vista);   // la hoja viaja sola
    // la tapa cubre la hoja hasta el borde de la pantalla (la hoja es más larga)
    const tapa = tapaDeLibro({ titulo: d.titulo, sub: meta.sub, tapa: meta.tapa });
    const r = hoja.getBoundingClientRect(), m = mesa.getBoundingClientRect();
    Object.assign(tapa.style, {
      left: `${r.left - m.left}px`, top: `${r.top - m.top}px`,
      width: `${r.width}px`, height: `${Math.min(r.height, innerHeight - r.top - 16)}px`
    });
    mesa.append(tapa);
    hoja.style.visibility = 'hidden';
    abrirDesde(origen, vista, tapa, 650).then(() => { hoja.style.visibility = ''; girarTapa(tapa); });
  };
  return vista;
}
