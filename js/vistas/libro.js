import { h, texto, emblema, COLOR_CASA } from '../util.js';
import { estado, seguir } from '../estado.js';
import { dibujar } from '../graficos/index.js';
import { abrirDesde, tapaDeLibro, girarTapa } from '../apertura.js';
import { barra, rastro, titulo, flecha, romano } from './comun.js';

/**
 * Un libro abierto: cintas con las páginas (en orden de año, con número
 * romano), pliego de dos páginas —izquierda el gráfico, derecha el registro—
 * y botones para hojear. Cada libro tiene su papel y su retícula. Si se llega
 * desde la mesa, el libro viaja hasta su sitio y la tapa se abre; al pasar de
 * página, una hoja gira sobre el lomo.
 */
export default function libro(ctx, id, paginaId) {
  const doc = ctx.docs[id];
  const meta = ctx.documentos.find(d => d.id === id);
  let actual = Math.max(0, doc.paginas.findIndex(p => p.id === paginaId));

  const cintas = h('div', { class: 'cintas', role: 'tablist', 'aria-label': 'Páginas del libro' });
  const pliego = h('div', { class: `pliego papel pliego--${id}`, role: 'tabpanel' });
  const tapa = tapaDeLibro({ titulo: doc.titulo, sub: meta.sub, tapa: meta.tapa });
  const cuerpo = h('div', { class: `libro__cuerpo tapa--${meta.tapa}` }, pliego, tapa);
  const anterior = h('a', { class: 'boton', 'aria-label': 'Página anterior' }, flecha(), 'Anterior');
  const siguiente = h('a', { class: 'boton', 'aria-label': 'Página siguiente' }, 'Siguiente', h('span', { style: { transform: 'scaleX(-1)', display: 'inline-flex' } }, flecha()));
  const folio = h('span', {});

  const cabecera = barra(ctx);
  const vista = h('main', { class: 'vista doc' },
    cabecera,
    rastro(),
    titulo(doc.titulo, meta.sub),
    h('section', { class: 'libro' }, cintas, cuerpo, h('div', { class: 'hojear' }, anterior, folio, siguiente))
  );
  vista.abreSolo = true;   // la apertura la hace el propio libro (tapa incluida)

  const tocaSeguido = p => {
    if (!estado.seguido) return false;
    if (p.noble === estado.seguido) return true;
    const j = JSON.stringify(p);
    return j.includes(`"casa":"${estado.seguido}"`) || j.includes(`noble:${estado.seguido}`);
  };

  function pintarCintas() {
    cintas.replaceChildren(...doc.paginas.map((p, i) => h('a', {
      class: `cinta${tocaSeguido(p) ? ' is-seguido' : ''}`,
      role: 'tab',
      href: `#/doc/${id}/${p.id}`,
      'aria-current': i === actual ? 'page' : null,
      'aria-selected': String(i === actual)
    }, h('b', {}, h('span', { class: 'num' }, romano(i + 1)), p.anio), p.titulo)));
  }

  async function pintar(dir = 0) {
    const p = doc.paginas[actual];
    pintarCintas();
    if (dir) girarHoja(dir);
    const izq = h('div', { class: 'pagina pagina--izq' });
    const der = h('div', { class: 'pagina pagina--der' });
    pliego.querySelectorAll('.pagina').forEach(n => n.remove());
    pliego.prepend(izq, der);
    pliego.classList.remove('is-pasando');
    void pliego.offsetWidth;
    if (dir) pliego.classList.add('is-pasando');

    const prev = doc.paginas[actual - 1], next = doc.paginas[actual + 1];
    anterior.toggleAttribute('disabled', !prev);
    siguiente.toggleAttribute('disabled', !next);
    anterior.href = prev ? `#/doc/${id}/${prev.id}` : '#';
    siguiente.href = next ? `#/doc/${id}/${next.id}` : '#';
    folio.textContent = `folio ${romano(actual + 1)} de ${romano(doc.paginas.length)}`;

    if (p.noble) await paginaNoble(p, izq, der, ctx, () => { cabecera.actualizar(); pintarCintas(); pintar(); });
    else await paginaGrafico(p, izq, der, ctx);

    der.append(h('p', { class: 'pagina__fuente' }, h('span', {}, doc.titulo), h('span', {}, `fol. ${romano(actual + 1)}`)));
    vista.dispatchEvent(new CustomEvent('pintado', { bubbles: true }));
  }

  /** Una hoja de papel gira sobre el lomo, hacia la izquierda o la derecha. */
  function girarHoja(dir) {
    pliego.querySelectorAll('.hoja-gira').forEach(n => n.remove());
    const cara = extra => h('div', { class: `hoja-gira__cara papel ${extra}` });
    const hoja = h('div', { class: `hoja-gira hoja-gira--${dir > 0 ? 'siguiente' : 'anterior'}` }, cara(''), cara('hoja-gira__cara--detras'));
    pliego.append(hoja);
    hoja.addEventListener('animationend', () => hoja.remove(), { once: true });
  }

  vista.montado = ({ origen } = {}) => {
    if (!origen || matchMedia('(max-width: 900px)').matches) { tapa.remove(); return pintar(); }
    // llega desde la mesa: el libro cerrado viaja y, cuando ya llegó y sus
    // páginas están dibujadas, se abre la tapa
    cuerpo.classList.add('is-cerrado');
    const listo = pintar();
    Promise.all([abrirDesde(origen, vista, tapa, 650), listo]).then(() => {
      cuerpo.classList.remove('is-cerrado');
      girarTapa(tapa, cuerpo);
    });
    return listo;
  };
  vista.esDoc = otro => otro === id;
  vista.irA = pid => {
    const i = Math.max(0, doc.paginas.findIndex(p => p.id === pid));
    if (i === actual) return;
    const dir = Math.sign(i - actual);
    actual = i;
    pintar(dir);
  };
  document.addEventListener('keydown', function teclas(ev) {
    if (!vista.isConnected) { document.removeEventListener('keydown', teclas); return; }
    if (ev.target.closest?.('input, textarea')) return;
    if (ev.key === 'ArrowRight' && doc.paginas[actual + 1]) location.hash = `#/doc/${id}/${doc.paginas[actual + 1].id}`;
    if (ev.key === 'ArrowLeft' && doc.paginas[actual - 1]) location.hash = `#/doc/${id}/${doc.paginas[actual - 1].id}`;
  });
  return vista;
}

/* --------------------------------------------------------------------------
   Página con gráfico (o lista) a la izquierda y registro a la derecha
   -------------------------------------------------------------------------- */
async function paginaGrafico(p, izq, der, ctx) {
  izq.append(h('div', { class: 'pagina__anio' }, p.anio), h('h2', { class: 'pagina__titulo' }, p.titulo));

  if (p.grafico) {
    const lienzo = h('div', { style: { position: 'relative' } });
    izq.append(lienzo);
    await dibujar(lienzo, p.grafico, ctx);
  }

  if (p.lista) {
    izq.append(h('ol', { class: 'denuncias' }, p.lista.map(item =>
      h('li', { class: item.destacada ? 'is-destacada' : null }, h('time', {}, item.fecha), h('span', {}, texto(item.texto))))));
  }

  der.append(h('p', { class: 'pagina__registro' }, texto(p.texto)));
  // la cifra que resume la página, en rojo como las rúbricas
  if (p.clave) der.append(h('p', { class: 'pagina__clave' }, h('strong', {}, p.clave.valor), h('span', {}, p.clave.texto)));
}

/* --------------------------------------------------------------------------
   Página de un noble (Libro de linajes)
   -------------------------------------------------------------------------- */
async function paginaNoble(p, izq, der, ctx, alSeguir) {
  const casa = ctx.casas.find(c => c.id === p.noble);
  const color = COLOR_CASA[casa.id];
  izq.append(
    h('div', { class: 'pagina__anio' }, p.anio),
    h('div', { class: 'noble' },
      h('div', { class: 'noble__emblema' }, emblema(casa, { ancho: 124 })),
      h('div', {},
        h('h2', { class: 'pagina__titulo' }, p.titulo),
        h('p', { class: 'noble__lema' }, p.lema),
        h('dl', { class: 'ficha' }, p.ficha.flatMap(f => [
          h('dt', {}, f.clave),
          h('dd', {}, texto(f.valor), f.barra != null
            ? h('span', { class: 'ficha__barra', style: { '--c': color }, 'aria-hidden': 'true' }, h('i', { dataset: { ancho: `${(f.barra / f.max) * 100}%` } }))
            : null)
        ]))
      )
    )
  );
  requestAnimationFrame(() => setTimeout(() => izq.querySelectorAll('.ficha__barra i').forEach(i => { i.style.width = i.dataset.ancho; }), 50));

  const siguiendo = estado.seguido === casa.id;
  const otros = ctx.casas.filter(c => COLOR_CASA[c.id] && c.id !== casa.id);
  der.append(
    h('p', { class: 'pagina__registro' }, texto(p.texto)),
    h('div', {},
      h('button', {
        type: 'button', class: 'boton boton--papel', 'aria-pressed': String(siguiendo),
        onclick: () => { seguir(casa.id); alSeguir(); }
      }, siguiendo ? `Siguiendo a ${casa.nombre}` : `Seguir a ${casa.nombre}`),
      h('p', { style: { margin: '6px 0 0', fontSize: '.9rem', fontStyle: 'italic', color: 'var(--tinta-tenue)' } },
        'Seguir a una casa la resalta en todos los libros del archivo.')
    ),
    h('div', { class: 'otros-nobles' }, 'Sus hermanos:', otros.map(o => h('a', { class: 'ref ref--noble', href: `#/doc/linajes/${o.id}`, dataset: { casa: o.id } }, o.nombre)))
  );
}
