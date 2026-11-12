import { h, s, cargarSvg, bordeIrregular, COLORES } from '../util.js';
import { estado } from '../estado.js';
import { barra } from './comun.js';
import { polvo } from './polvo.js';

/**
 * La mesa del archivo en perspectiva. Cada documento es un objeto con
 * grosor; la vela (arriba a la izquierda) decide la luz y las sombras.
 * Al tocar un objeto se guarda su posición en pantalla para que el documento
 * se abra "desde" la mesa (ver main.js).
 */
let origenApertura = null;
/** Devuelve (y olvida) desde dónde se abrió el último documento. */
export function tomarOrigen() { const o = origenApertura; origenApertura = null; return o; }

const DECORADO = [
  { tipo: 'vela', x: 3, y: 3, ancho: 5.5 },
  { tipo: 'tintero', x: 89, y: 52, ancho: 4 },
  { tipo: 'pluma', x: 79, y: 60, ancho: 13, giro: -24 }
];

export default function escritorio(ctx) {
  const tablero = h('div', { class: 'tablero' });
  DECORADO.forEach(d => tablero.append(decorado(d)));
  ctx.documentos.forEach(doc => tablero.append(objeto(doc, ctx)));

  const etiqueta = h('div', { class: 'etiqueta-mesa papel', 'aria-hidden': 'true' });
  const lienzoPolvo = h('canvas', { class: 'polvo', 'aria-hidden': 'true' });
  const escena = h('div', { class: 'escena' },
    tablero,
    h('div', { class: 'penumbra' }), h('div', { class: 'resplandor' }),
    lienzoPolvo, etiqueta,
    h('p', { class: 'escritorio__ayuda' }, 'Toca un documento para abrirlo. Empieza por la denuncia.')
  );

  const vista = h('main', { class: 'vista escritorio' },
    barra(ctx, { volver: false, colofon: true }),
    h('h1', { class: 'oculto-visual' }, 'Escritorio del archivo'),
    escena
  );

  // etiquetas nítidas en pantalla al pasar por un objeto
  tablero.querySelectorAll('.obj').forEach(obj => {
    const mostrar = () => {
      const r = obj.querySelector('.obj__pieza').getBoundingClientRect();
      const e = escena.getBoundingClientRect();
      etiqueta.replaceChildren(h('strong', {}, obj.dataset.titulo), obj.dataset.resumen ?? '');
      etiqueta.style.left = `${r.left + r.width / 2 - e.left}px`;
      etiqueta.style.top = `${r.top - e.top}px`;
      etiqueta.classList.add('is-visible');
    };
    let espera = null;
    obj.addEventListener('pointerenter', () => { espera = setTimeout(mostrar, 120); });
    obj.addEventListener('focus', mostrar);
    ['pointerleave', 'blur'].forEach(ev => obj.addEventListener(ev, () => { clearTimeout(espera); etiqueta.classList.remove('is-visible'); }));
    const recordar = () => { origenApertura = { id: obj.dataset.id, rect: obj.querySelector('.obj__pieza').getBoundingClientRect() }; };
    obj.addEventListener('click', ev => {
      // con modificadores (abrir en otra pestaña) o sin cámara, el enlace sigue solo
      if (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || !hayCamara()) { recordar(); return; }
      ev.preventDefault();
      if (escena.classList.contains('is-acercando')) return;
      clearTimeout(espera);
      etiqueta.classList.remove('is-visible');
      acercar(escena, tablero, obj).then(() => { recordar(); location.hash = obj.getAttribute('href'); }, () => {});
    });
  });

  vista.montado = ({ previa } = {}) => {
    if (matchMedia('(max-width: 820px)').matches) return;
    situarVela(escena, tablero);
    // al volver de un documento, la cámara se aleja desde donde estaba ese objeto
    const dejado = previa?.vista === 'doc' && tablero.querySelector(`a.obj[data-id="${previa.id}"]`);
    if (dejado && hayCamara()) alejar(escena, tablero, dejado);
    const pararPolvo = polvo(lienzoPolvo, escena, () => escena.classList.contains('is-acercando'));
    const pararMesa = asomarseConCursor(escena, tablero);
    vista.desmontar = () => { pararPolvo(); pararMesa(); };
  };
  return vista;
}

/* --------------------------------------------------------------------------
   Objetos
   -------------------------------------------------------------------------- */
function objeto(doc, ctx) {
  const pieza = h('div', { class: 'obj__pieza' });
  const a = h('a', {
    class: `obj obj--${doc.forma}${doc.entrada ? ' obj--entrada' : ''}${estado.vistos.has(doc.id) ? ' is-visto' : ''}`,
    href: `#/doc/${doc.id}`,
    style: { '--x': doc.x, '--y': doc.y, '--giro': doc.giro, '--ancho': doc.ancho },
    dataset: { id: doc.id, titulo: doc.titulo, resumen: doc.resumen ?? doc.sub ?? '' },
    'aria-label': `${doc.titulo}${doc.sub ? `, ${doc.sub}` : ''}${doc.resumen ? `. ${doc.resumen}` : ''}`
  }, h('span', { class: 'obj__sombra', 'aria-hidden': 'true' }), pieza);

  if (doc.forma === 'libro') {
    const paginas = doc.paginas ?? ctx.docs[doc.id].paginas?.length ?? 2;
    const grosor = 10 + paginas * 6;
    a.style.setProperty('--t', `${grosor}px`);
    pieza.classList.add('libro3d', `tapa--${doc.tapa}`);
    pieza.append(
      h('span', { class: 'cara cara--lomo' }),
      h('span', { class: 'cara cara--frente' }),
      h('span', { class: 'cara cara--derecha' }),
      h('span', { class: 'libro3d__tapa' },
        h('span', { class: 'libro3d__filete' }),
        h('span', { class: 'libro3d__titulo' }, doc.titulo),
        h('span', { class: 'libro3d__sub' }, doc.sub),
        h('span', { class: 'libro3d__filete' }))
    );
  }

  if (doc.forma === 'papel') {
    const d = ctx.docs.denuncia;
    const hoja = h('div', { class: 'papel papel--trapo doblada papel-mesa' },
      h('h2', { class: 'denuncia-mini__titulo' }, doc.titulo),
      h('p', {}, d.texto.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')));
    pieza.append(hoja, h('span', { class: 'lacre', 'aria-hidden': 'true' }));
    requestAnimationFrame(() => bordeIrregular(hoja, { semilla: 3 }));
  }

  if (doc.forma === 'mapa') {
    const hoja = h('div', { class: 'papel papel--viejo doblada carta-mini' },
      h('h2', { class: 'carta-mini__titulo' }, doc.titulo),
      h('span', { class: 'carta-mini__sub' }, doc.sub));
    pieza.append(hoja);
    cartaMini(ctx).then(svg => { hoja.append(svg); bordeIrregular(hoja, { semilla: 11, quemado: 'tr', radio: 70 }); });
  }

  if (doc.forma === 'recado') {
    // la nota de verdad, en pequeño: saludo, primer párrafo y firma
    const d = ctx.docs[doc.id];
    const hoja = h('div', { class: 'papel papel--trapo doblada recado-mesa' },
      h('span', { class: 'recado-mesa__dorso', 'aria-hidden': 'true' }, 'Cien monedas'),
      h('span', { class: 'recado-mesa__texto', 'aria-hidden': 'true' },
        h('span', {}, d.saludo),
        h('span', {}, d.parrafos[0]),
        h('span', { class: 'recado-mesa__firma' }, d.firma.split(',')[0])));
    pieza.append(hoja);
    requestAnimationFrame(() => bordeIrregular(hoja, { semilla: 29, amplitud: 3 }));
  }

  if (doc.forma === 'noticia') {
    const renglones = anchos => h('span', { class: 'noticia-mesa__lineas', 'aria-hidden': 'true' }, anchos.map(w => h('i', { style: { width: `${w}%` } })));
    const hoja = h('div', { class: 'papel papel--viejo doblada noticia-mesa' },
      h('span', { class: 'noticia-mesa__nombre' }, ctx.docs[doc.id].cabecera),
      h('span', { class: 'noticia-mesa__titular' }, ctx.docs[doc.id].titular),
      h('span', { class: 'noticia-mesa__columnas' }, renglones([96, 100, 92, 100, 70]), renglones([100, 88, 100, 94, 100])));
    pieza.append(hoja);
    requestAnimationFrame(() => bordeIrregular(hoja, { semilla: 41, amplitud: 3, quemado: 'bl', radio: 40, estira: 1.7 }));
  }

  if (doc.forma === 'caja') {
    a.style.setProperty('--t', '1px');
    pieza.classList.add('caja3d');
    pieza.append(
      h('span', { class: 'caja3d__fondo' }),
      h('span', { class: 'caja3d__huella', 'aria-hidden': 'true' }),
      h('span', { class: 'caja3d__pared caja3d__pared--fondo' }),
      h('span', { class: 'caja3d__pared caja3d__pared--izq' }),
      h('span', { class: 'caja3d__pared caja3d__pared--der' }),
      h('span', { class: 'caja3d__pared caja3d__pared--frente' }),
      h('span', { class: 'caja3d__tapa' }, h('span', { class: 'caja3d__tapa-dentro' }, h('span', { class: 'caja3d__placa' }, 'NETHERBANE')))
    );
  }
  return a;
}

function decorado(d) {
  const estilo = { '--x': d.x, '--y': d.y, '--giro': d.giro ?? 0, '--ancho': d.ancho };
  if (d.tipo === 'vela') {
    return h('div', { class: 'obj decorado vela-obj', style: estilo, 'aria-hidden': 'true' },
      h('div', { class: 'obj__pieza vela' },
        h('span', { class: 'vela__plato' }),
        h('span', { class: 'vela__cuerpo' }, h('span', { class: 'vela__llama' }))));
  }
  if (d.tipo === 'tintero') {
    return h('div', { class: 'obj decorado', style: estilo, 'aria-hidden': 'true' },
      h('span', { class: 'obj__sombra', style: { borderRadius: '50%' } }),
      h('div', { class: 'obj__pieza tintero' }, [0, 1, 2, 3, 4].map(n => h('i', { style: { '--n': n } }))));
  }
  return h('div', { class: 'obj decorado', style: estilo, 'aria-hidden': 'true' },
    h('div', { class: 'obj__pieza pluma' }, pluma()));
}

/** Pluma de ave, vista desde arriba. */
function pluma() {
  return s('svg', { viewBox: '0 0 200 40' },
    s('path', { d: 'M6 22 C60 4 130 2 196 14 C150 18 110 26 70 32 C44 34 20 30 6 22 Z', fill: '#d9cdb4', stroke: '#8c7d63', 'stroke-width': 1 }),
    s('path', { d: 'M2 23 L196 14', stroke: '#6b5d47', 'stroke-width': 1.6 }),
    ...Array.from({ length: 22 }, (_, i) => s('path', { d: `M${30 + i * 7} ${21 - i * .35} l6 ${i % 2 ? -9 : 9}`, stroke: '#a89a80', 'stroke-width': .7 }))
  );
}

/** Contorno del reino con las ciudades como puntos (sin datos). */
async function cartaMini(ctx) {
  const completo = await cargarSvg('assets/cregon.svg');
  const reino = completo.querySelector('#reino');
  const frontera = completo.querySelector('#frontera');
  return s('svg', { viewBox: '40 30 800 740', 'aria-hidden': 'true' },
    s('path', { d: reino.getAttribute('d'), fill: 'rgba(110,90,69,.08)', stroke: COLORES.tinta, 'stroke-width': 3, 'stroke-linejoin': 'round' }),
    frontera ? s('path', { d: frontera.getAttribute('d'), fill: 'none', stroke: COLORES.tinta, 'stroke-width': 2, 'stroke-dasharray': '6 6', 'stroke-opacity': .5 }) : null,
    // solo ubicación: todas las ciudades iguales, en tinta
    ctx.ciudades.map(c => s('circle', { cx: c.x, cy: c.y, r: 8, fill: COLORES.tinta }))
  );
}

/* --------------------------------------------------------------------------
   Luz y movimiento
   -------------------------------------------------------------------------- */
/** La penumbra se centra en la llama, donde quiera que quede en pantalla. */
function situarVela(escena, tablero) {
  const llama = tablero.querySelector('.vela__llama');
  const colocar = () => {
    const r = llama.getBoundingClientRect(), e = escena.getBoundingClientRect();
    escena.style.setProperty('--vx', `${((r.left + r.width / 2 - e.left) / e.width) * 100}%`);
    escena.style.setProperty('--vy', `${((r.top + r.height - e.top) / e.height) * 100}%`);
  };
  colocar();
  setTimeout(colocar, 500);
}

/* --------------------------------------------------------------------------
   Cámara: al tocar un objeto la mesa se acerca a él y se endereza un poco
   antes de abrir el documento (que sigue sobre la misma mesa, ver fondo.js);
   al volver, se aleja desde ese mismo objeto.
   -------------------------------------------------------------------------- */
const ACERCAMIENTO = 1.8;
const MESA_CERCA = 'translateX(-50%) rotateX(30deg)';

const hayCamara = () => !matchMedia('(max-width: 820px), (prefers-reduced-motion: reduce)').matches;

/**
 * Centro del objeto dentro de la escena, como transform-origin. Se mide con
 * la mesa ya enderezada: así el objeto queda quieto en pantalla mientras crece.
 */
function foco(escena, tablero, obj) {
  tablero.style.transform = MESA_CERCA;
  const p = obj.querySelector('.obj__pieza').getBoundingClientRect(), e = escena.getBoundingClientRect();
  tablero.style.transform = '';
  return `${p.left + p.width / 2 - e.left}px ${p.top + p.height / 2 - e.top}px`;
}

function acercar(escena, tablero, obj) {
  // si la cámara todavía se estaba alejando, termina antes de medir el objeto
  [escena, tablero].forEach(n => n.getAnimations().forEach(a => a.finish()));
  const origen = foco(escena, tablero, obj);
  escena.classList.add('is-acercando');
  obj.classList.add('is-elegido');
  // acelera hasta el corte: el fondo del documento recoge el movimiento y lo frena
  const op = { duration: 560, easing: 'cubic-bezier(.55,.05,.75,.3)', fill: 'forwards' };
  tablero.animate([{ transform: MESA_CERCA }], op);
  return escena.animate([
    { transformOrigin: origen, transform: 'scale(1)' },
    { transformOrigin: origen, transform: `scale(${ACERCAMIENTO})` }
  ], op).finished;
}

function alejar(escena, tablero, obj) {
  const origen = foco(escena, tablero, obj);
  const op = { duration: 950, easing: 'cubic-bezier(.2,.7,.2,1)' };
  tablero.animate([{ transform: MESA_CERCA, offset: 0 }], op);
  escena.animate([
    { transformOrigin: origen, transform: `scale(${ACERCAMIENTO})` },
    { transformOrigin: origen, transform: 'scale(1)' }
  ], op);
}

/**
 * La cámara se asoma un poco hacia el cursor, como quien mueve la cabeza:
 * la mesa no se inclina, solo se corre unos píxeles al lado contrario.
 * Se usa la propiedad `translate` (no hereda ni toca el transform de la
 * cámara), así que cada cuadro solo recompone la mesa.
 */
const ASOMO = { x: 24, y: 14 };   // píxeles, de un borde de la pantalla al otro

function asomarseConCursor(escena, tablero) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  let objetivo = { x: 0, y: 0 }, actual = { x: 0, y: 0 }, cuadro = null;
  const mover = ev => {
    objetivo = { x: ev.clientX / innerWidth - .5, y: ev.clientY / innerHeight - .5 };
    if (!cuadro) cuadro = requestAnimationFrame(paso);
  };
  const paso = () => {
    actual.x += (objetivo.x - actual.x) * .06;
    actual.y += (objetivo.y - actual.y) * .06;
    tablero.style.translate = `${(-actual.x * ASOMO.x).toFixed(2)}px ${(-actual.y * ASOMO.y).toFixed(2)}px`;
    cuadro = Math.abs(objetivo.x - actual.x) + Math.abs(objetivo.y - actual.y) > .001 ? requestAnimationFrame(paso) : null;
  };
  escena.addEventListener('pointermove', mover);
  return () => { escena.removeEventListener('pointermove', mover); cancelAnimationFrame(cuadro); };
}
