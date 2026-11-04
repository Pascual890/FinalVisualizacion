import { h, s, texto, bordeIrregular } from '../util.js';
import { barra, rastro, notaLeo } from './comun.js';

/**
 * Relicario: la hoja de registro de Netherbane, con el dibujo de la
 * infografía. La daga entra armada y se separa sobre su eje en las cinco
 * piezas (I–V). Tocar una pieza muestra su registro; la hoja tiene sus tres
 * capas de metal en 3D y el pomo esconde la gema, que solo se ve "a través
 * del metal" con la lupa.
 */
const GIRO = 3950;   // la daga se dibuja vertical y se acuesta: (x, y) → (GIRO - y, x)
const VIEWBOX = '0 130 3140 1250';

export default function relicario(ctx) {
  const d = ctx.docs.relicario;
  const piezas = d.partes.filter(p => p.imagen);
  const porId = Object.fromEntries(d.partes.map(p => [p.id, p]));
  let elegida = null;

  // --- el escenario: la daga acostada en SVG ------------------------------
  const grupo = s('g', { class: 'daga', transform: `translate(${GIRO} 0) rotate(90)` });
  const nodos = {};
  piezas.forEach(p => {
    const g = s('g', {
      class: 'pieza', tabindex: 0, role: 'button', 'aria-label': `${p.numero}. ${p.nombre}`,
      dataset: { id: p.id },
      style: { '--armada': `${p.armada.y - p.separada.y}px` }
    }, s('image', { href: `assets/netherbane/${p.imagen}.webp`, x: p.separada.x, y: p.separada.y, width: p.w, height: p.h }));
    grupo.append(g);
    nodos[p.id] = g;
  });

  const etiquetas = s('g', { class: 'rotulos' });
  d.partes.forEach((p, i) => etiquetas.append(rotulo(p, porId, i)));
  const lupas = s('g', { class: 'marcas-lupa' },
    marcaLupa(GIRO - 1690, 722, 'hoja', 'Ver las capas de la hoja'),
    marcaLupa(GIRO - (3520 + 220), 578 + 147, 'pomo', 'Mirar dentro del pomo'));

  const svg = s('svg', { viewBox: VIEWBOX, class: 'escenario', role: 'group', 'aria-label': 'Netherbane y sus cinco piezas' },
    s('line', { class: 'eje', x1: 40, x2: 3100, y1: 727, y2: 727 }), grupo, etiquetas, lupas);

  const armar = h('button', { type: 'button', class: 'boton boton--papel', 'aria-pressed': 'false', onclick: () => separar(!svg.classList.contains('is-separada')) }, 'Armar la daga');
  const detalle = h('div', { class: 'reliquia__detalle' });

  const hoja = h('article', { class: 'reliquia papel papel--viejo', 'data-abrir': '' },
    h('header', { class: 'reliquia__cabecera' },
      h('div', {},
        h('p', { class: 'reliquia__ante' }, d.antetitulo),
        h('h1', { class: 'reliquia__nombre' }, d.nombre),
        h('p', { class: 'reliquia__lema' }, d.lema),
        ornamento(),
        h('p', { class: 'reliquia__texto' }, texto(d.texto))
      ),
      h('img', { class: 'reliquia__entera', src: 'assets/netherbane/daga.webp', alt: 'Netherbane entera' })
    ),
    h('div', { class: 'reliquia__escenario' },
      h('h2', { class: 'reliquia__seccion' }, 'Las cinco piezas'),
      svg,
      h('div', { class: 'reliquia__acciones' }, armar, h('span', {}, 'Toca una pieza para leer su registro.'))
    ),
    detalle
  );

  const vista = h('main', { class: 'vista doc' }, barra(ctx), rastro(), h('div', { class: 'con-sombra' }, hoja));

  function separar(si) {
    svg.classList.toggle('is-separada', si);
    armar.textContent = si ? 'Armar la daga' : 'Separar las piezas';
    armar.setAttribute('aria-pressed', String(!si));
  }

  function elegir(id) {
    elegida = id === 'espiga' ? 'espiga' : id;
    Object.entries(nodos).forEach(([k, g]) => g.classList.toggle('is-elegida', k === id || (id === 'espiga' && k === 'hoja')));
    etiquetas.querySelectorAll('.rotulo').forEach(r => r.classList.toggle('is-elegido', r.dataset.id === id));
    pintarDetalle();
  }

  function pintarDetalle() {
    const p = porId[elegida];
    const ficha = p
      ? h('section', { class: 'reliquia__ficha' },
          h('h3', {}, h('span', { class: 'num' }, p.numero), p.nombre),
          h('p', {}, p.texto))
      : h('section', { class: 'reliquia__ficha' },
          h('h3', {}, 'Netherbane'),
          h('p', {}, 'Cinco piezas de metal, madera y cuero. Elige una para leer qué es y para qué sirve.'));
    const lista = h('nav', { class: 'reliquia__indice', 'aria-label': 'Piezas' }, d.partes.map(x => h('button', {
      type: 'button', class: 'boton boton--papel', 'aria-pressed': String(x.id === elegida), onclick: () => elegir(x.id)
    }, h('span', { class: 'num' }, x.numero), x.nombre)));

    let extra;
    if (elegida === 'hoja' || elegida === 'espiga') extra = capas(d.capas);
    else if (elegida === 'pomo') extra = gema(d);
    else extra = h('section', { class: 'reliquia__extra reliquia__extra--vacio' },
      h('p', {}, 'La hoja guarda tres capas de metal y el pomo una gema que no está a la vista. Busca las lupas sobre el dibujo.'));
    detalle.replaceChildren(h('div', {}, ficha, lista), extra);
  }

  Object.entries(nodos).forEach(([id, g]) => {
    g.addEventListener('click', () => elegir(id));
    g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); elegir(id); } });
  });
  etiquetas.addEventListener('click', ev => { const r = ev.target.closest('.rotulo'); if (r) elegir(r.dataset.id); });
  lupas.addEventListener('click', ev => {
    const m = ev.target.closest('.marca-lupa');
    if (!m) return;
    elegir(m.dataset.id);
    detalle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  vista.montado = () => {
    bordeIrregular(hoja, { semilla: 5, amplitud: 3, paso: 14, quemado: 'bl', radio: 130 });
    pintarDetalle();
    // entra armada y se separa sobre su eje
    setTimeout(() => separar(true), 900);
  };
  return vista;
}

/** Rótulo de una pieza: número romano en rojo, nombre y línea guía con punto. */
function rotulo(p, porId, i) {
  const base = p.imagen ? p : porId[p.punto.pieza];
  const yDibujo = p.imagen ? p.separada.y + p.h / 2 : base.separada.y + base.h * p.punto.y;
  const X = GIRO - yDibujo;
  const arriba = i % 2 === 0;
  const borde = arriba ? base.separada.x - 20 : base.separada.x + base.w + 20;
  const Y = arriba ? 300 : 1250;
  return s('g', { class: 'rotulo', dataset: { id: p.id }, role: 'button', tabindex: 0, 'aria-label': `${p.numero}. ${p.nombre}` },
    s('line', { class: 'rotulo__linea', x1: X, x2: X, y1: borde, y2: arriba ? Y + 34 : Y - 92 }),
    s('circle', { class: 'rotulo__punto', cx: X, cy: borde, r: 14 }),
    s('text', { class: 'rotulo__texto', x: X, y: Y, 'text-anchor': 'middle' },
      s('tspan', { class: 'rotulo__num' }, `${p.numero} `), p.nombre.toUpperCase())
  );
}

/** Círculo de lupa sobre el dibujo (como en la infografía). */
function marcaLupa(x, y, id, etiqueta) {
  return s('g', { class: 'marca-lupa', dataset: { id }, role: 'button', tabindex: 0, 'aria-label': etiqueta, transform: `translate(${x} ${y})` },
    s('circle', { r: 72, class: 'marca-lupa__aro' }),
    s('path', { d: 'M50 50 L96 96', class: 'marca-lupa__mango' }));
}

function ornamento() {
  return s('svg', { class: 'reliquia__ornamento', viewBox: '0 0 360 20', 'aria-hidden': 'true' },
    s('path', { d: 'M0 10 H160 M200 10 H360', stroke: 'currentColor', 'stroke-width': 1.5 }),
    s('path', { d: 'M180 1 L184 7 L190 10 L184 13 L180 19 L176 13 L170 10 L176 7 Z', fill: 'currentColor' }));
}

/* --------------------------------------------------------------------------
   Las tres capas de la hoja, como láminas en 3D que se separan
   -------------------------------------------------------------------------- */
function capas(c) {
  const losa = h('div', { class: 'losa' }, c.lista.map((m, i) => h('div', {
    class: 'losa__capa', style: { '--i': i, '--c': m.color }, dataset: { i }
  }, h('span', { class: 'losa__canto losa__canto--frente' }), h('span', { class: 'losa__canto losa__canto--lado' }))));
  const escena = h('div', { class: 'losa-escena', 'aria-hidden': 'true' }, losa);
  const lista = h('ul', { class: 'capas-lista' }, c.lista.map((m, i) => h('li', {
    onpointerenter: () => losa.dataset.foco = i, onpointerleave: () => delete losa.dataset.foco
  }, h('i', { style: { background: m.color } }), h('div', {}, h('strong', {}, m.nombre), h('span', {}, m.texto)))));
  const boton = h('button', {
    type: 'button', class: 'boton boton--papel', 'aria-pressed': 'false',
    onclick: () => { const si = !escena.classList.contains('is-abierta'); escena.classList.toggle('is-abierta', si); boton.setAttribute('aria-pressed', String(si)); boton.textContent = si ? 'Juntar las capas' : 'Separar las capas'; }
  }, 'Separar las capas');
  // la losa gira un poco con el cursor
  escena.addEventListener('pointermove', ev => {
    const r = escena.getBoundingClientRect();
    losa.style.setProperty('--gx', `${((ev.clientY - r.top) / r.height - .5) * -14}deg`);
    losa.style.setProperty('--gz', `${((ev.clientX - r.left) / r.width - .5) * 24}deg`);
  });
  setTimeout(() => boton.click(), 700);
  return h('section', { class: 'reliquia__extra' },
    h('h3', { class: 'reliquia__seccion' }, c.titulo),
    h('p', {}, c.texto),
    h('div', { class: 'capas-cuerpo' }, escena, lista),
    boton);
}

/* --------------------------------------------------------------------------
   La gema escondida: la lupa deja ver a través del metal
   -------------------------------------------------------------------------- */
function gema(d) {
  const metal = h('span', { class: 'lupa-gema__metal' });
  const lupa = h('div', { class: 'lupa-gema' },
    h('img', { src: 'assets/netherbane/lupa-gema.webp', alt: 'El pomo por dentro: el emblema de Cerbero y, detrás, la espinela rosa' }),
    metal);
  const mover = ev => {
    const r = metal.getBoundingClientRect();
    metal.style.setProperty('--px', `${ev.clientX - r.left}px`);
    metal.style.setProperty('--py', `${ev.clientY - r.top}px`);
    metal.style.setProperty('--rh', '78px');
  };
  lupa.addEventListener('pointermove', mover);
  lupa.addEventListener('pointerdown', mover);
  lupa.addEventListener('pointerleave', () => metal.style.setProperty('--rh', '0px'));
  const boton = h('button', {
    type: 'button', class: 'boton boton--papel', 'aria-pressed': 'false',
    onclick: () => { const si = !lupa.classList.contains('is-transparente'); lupa.classList.toggle('is-transparente', si); boton.setAttribute('aria-pressed', String(si)); }
  }, 'Mirar a través del metal');
  return h('section', { class: 'reliquia__extra' },
    h('h3', { class: 'reliquia__seccion' }, d.gema.titulo),
    h('p', {}, d.gema.texto),
    h('div', { class: 'gema-cuerpo' }, lupa, notaLeo(d.nota, { giro: -6, clase: 'gema-nota' })),
    h('p', { class: 'reliquia__ayuda' }, 'Pasa el cursor por el pomo para ver detrás del metal.'),
    boton);
}
