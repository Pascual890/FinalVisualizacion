import { h, texto, referencias, bordeIrregular } from '../util.js';
import { dibujar } from '../graficos/index.js';
import { barra, rastro, notaLeo, titulo } from './comun.js';

/**
 * Carta del reino: mapa de ubicación, sin datos. Tocar un lugar dice qué es y
 * en qué libros aparece (se calcula buscando el lugar en todos los registros).
 */
export default function carta(ctx, _id, lugarId) {
  const d = ctx.docs.carta;
  const lugares = [...ctx.ciudades, ...ctx.fuera];
  const lienzo = h('div', { style: { position: 'relative' } });
  const capas = h('div', { class: 'carta__capas', role: 'group', 'aria-label': 'Mostrar en el mapa' });
  const panel = h('aside', { class: 'carta__panel papel', 'aria-live': 'polite' });
  let mapa;

  const vista = h('main', { class: 'vista doc' },
    barra(ctx),
    rastro(),
    titulo(d.titulo, `año ${d.anio}`),
    h('section', { class: 'carta con-sombra' },
      h('div', { class: 'carta__mapa papel papel--viejo doblada', 'data-abrir': '' }, capas, lienzo),
      panel
    )
  );

  function elegir(id) {
    const l = lugares.find(x => x.id === id);
    mapa?.elegir(id);
    if (!l) {
      panel.replaceChildren(h('h2', {}, 'El reino'), h('p', {}, texto(d.texto)));
      return;
    }
    if (location.hash !== `#/doc/carta/${id}`) history.replaceState(null, '', `#/doc/carta/${id}`);
    const apariciones = dondeAparece(ctx, id);
    panel.replaceChildren(...[
      h('h2', {}, l.nombre),
      h('p', { class: 'tipo' }, l.tipo),
      h('p', {}, l.texto),
      apariciones.length
        ? [h('p', { style: { fontStyle: 'italic', color: 'var(--tinta-tenue)', fontSize: '.95rem' } }, 'Aparece en:'),
           h('ul', { class: 'aparece' }, apariciones.map(a => h('li', {}, h('a', { href: a.href }, a.libro, h('small', {}, a.pagina)))))]
        : h('p', { style: { fontStyle: 'italic', color: 'var(--tinta-tenue)' } }, 'No aparece en ningún otro libro.')
    ].flat());
  }

  vista.montado = async () => {
    bordeIrregular(vista.querySelector('.carta__mapa'), { semilla: 11, amplitud: 3, quemado: 'tr', radio: 120 });
    bordeIrregular(panel, { semilla: 13 });
    mapa = await dibujar(lienzo, { tipo: 'mapa', modo: 'ubicacion' }, { ...ctx, alElegir: elegir });
    d.capas.forEach(c => {
      let activa = c.activa;
      mapa.capa(c.id, activa);
      const boton = h('button', {
        type: 'button', class: 'boton boton--papel', 'aria-pressed': String(activa),
        onclick: () => {
          activa = !activa;
          boton.setAttribute('aria-pressed', String(activa));
          mapa.capa(c.id, activa);
          nota.hidden = !(c.nota && activa);
          if (c.nota && activa && !nota.firstChild) nota.append(notaLeo(d.nota, { giro: -8, clase: 'nota-flotante' }));
        }
      }, c.texto);
      capas.append(boton);
    });
    const nota = h('div', { hidden: true, style: { position: 'absolute', left: '6%', top: '74%' } });
    lienzo.append(nota);
    elegir(lugarId);
  };
  vista.esDoc = otro => otro === 'carta';
  vista.irA = elegir;
  return vista;
}

/** Busca un lugar en todos los registros del archivo. */
function dondeAparece(ctx, id) {
  const lista = [];
  for (const meta of ctx.documentos) {
    const doc = ctx.docs[meta.id];
    if (meta.id === 'carta') continue;
    const paginas = doc.paginas ?? [{ ...doc, id: null, titulo: doc.titulo }];
    for (const p of paginas) {
      const enTexto = JSON.stringify(p).match(/\[[^\]]+\]\([^)]+\)/g)?.join(' ') ?? '';
      const enMapa = p.grafico?.tipo === 'mapa';
      if (referencias(enTexto).some(r => r.tipo === 'lugar' && r.id === id) || (enMapa && ctx.ciudades.some(c => c.id === id))) {
        lista.push({ libro: doc.titulo, pagina: p.paginas ? '' : (p.titulo !== doc.titulo ? p.titulo : ''), href: `#/doc/${meta.id}${p.id ? `/${p.id}` : ''}` });
      }
    }
  }
  return lista;
}
