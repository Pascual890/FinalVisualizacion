import { h, s, texto, bordeIrregular } from '../util.js';
import { barra, rastro, notaLeo } from './comun.js';

/**
 * Relicario: la caja de la mesa, abierta y vista desde arriba. Está vacía
 * desde 1218: en el terciopelo solo queda la huella de Netherbane, y sobre
 * ella aparece el dibujo del registro (el de la infografía). La daga entra
 * armada, encajada en su huella, y se alza en relieve (ver relieve() abajo).
 * Al separarla gira hasta quedar de frente y se abre sobre su eje en las
 * cinco piezas (I–V). Tocar una pieza muestra su registro en la hoja de abajo;
 * la hoja de la daga tiene sus tres capas de metal en 3D y el pomo esconde la
 * gema, que solo se ve "a través del metal" con la lupa.
 */
const GIRO = 3950;   // la daga se dibuja vertical y se acuesta: (x, y) → (GIRO - y, x)
const VISTA = { y: 130, ancho: 3140, alto: 1250 };   // lo que se ve del dibujo
const VIEWBOX = `0 ${VISTA.y} ${VISTA.ancho} ${VISTA.alto}`;

export default function relicario(ctx) {
  const d = ctx.docs.relicario;
  const meta = ctx.documentos.find(x => x.id === 'relicario');
  const piezas = d.partes.filter(p => p.imagen);
  const porId = Object.fromEntries(d.partes.map(p => [p.id, p]));
  let elegida = null;
  let separada = false;
  let turno = 0;   // cada orden de armar o separar deja sin efecto a la anterior

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

  // la huella: la silueta de la daga armada, hundida en el terciopelo. Es un
  // dibujo aparte y quieto, para no repintar su desenfoque cuando las piezas se mueven
  const huella = s('svg', { viewBox: VIEWBOX, class: 'huella', 'aria-hidden': 'true' },
    s('g', { transform: `translate(${GIRO} 0) rotate(90)` },
      piezas.map(p => s('image', { href: `assets/netherbane/${p.imagen}.webp`, x: p.armada.x, y: p.armada.y, width: p.w, height: p.h }))));

  // la daga en relieve solo mientras está armada; en pantallas estrechas o con
  // movimiento reducido, el dibujo plano hace todo el trabajo
  const dosD = matchMedia('(max-width: 820px), (prefers-reduced-motion: reduce)').matches;
  const daga3d = dosD ? null : relieve(piezas, () => separar(true));

  const AYUDA = { armada: 'Arrastra la daga para girarla o tócala para separar sus piezas.', separada: 'Toca una pieza para leer su registro.' };
  const ayuda = h('span', {}, daga3d ? AYUDA.armada : AYUDA.separada);
  const armar = h('button', { type: 'button', class: 'boton', 'aria-pressed': String(!!daga3d), onclick: () => separar(!separada) }, daga3d ? 'Separar las piezas' : 'Armar la daga');
  const detalle = h('div', { class: 'reliquia__detalle' });

  const caja = h('section', { class: `caja-abierta${daga3d ? ' en-3d' : ''}`, 'data-abrir': '' },
    h('div', { class: 'caja-abierta__tapa' },
      h('div', { class: 'caja-abierta__placa' },
        h('p', {}, d.antetitulo),
        h('h1', {}, d.nombre))),
    h('div', { class: 'caja-abierta__cuerpo' },
      h('div', { class: 'caja-abierta__terciopelo' }, huella, svg, daga3d?.nodo),
      h('div', { class: 'caja-abierta__frente' },
        h('div', { class: 'caja-abierta__acciones' }, armar, ayuda),
        h('span', { class: 'caja-abierta__vacia' }, `${meta.sub} · dibujo del registro`))));

  const presentacion = h('article', { class: 'reliquia papel papel--viejo' },
    h('p', { class: 'reliquia__lema' }, d.lema),
    ornamento(),
    h('p', { class: 'reliquia__texto' }, texto(d.texto)));
  const registro = h('article', { class: 'reliquia papel papel--trapo' },
    h('h2', { class: 'reliquia__seccion' }, 'Las cinco piezas'),
    detalle);

  const vista = h('main', { class: 'vista doc' }, barra(ctx), rastro(),
    h('div', { class: 'relicario' }, caja,
      h('div', { class: 'relicario__hojas con-sombra' }, presentacion, registro)));

  /**
   * Con relieve, las dos dagas se relevan estando de frente, donde coinciden:
   * la de relieve gira, se cambia por el dibujo y este se abre (y al revés).
   */
  async function separar(si) {
    const yo = ++turno;
    separada = si;
    armar.textContent = si ? 'Armar la daga' : 'Separar las piezas';
    armar.setAttribute('aria-pressed', String(!si));
    ayuda.textContent = !si && daga3d ? AYUDA.armada : AYUDA.separada;
    if (!daga3d) { svg.classList.toggle('is-separada', si); return; }
    if (si) {
      await daga3d.bajar();
      if (yo !== turno) return;
      caja.classList.remove('en-3d');
      svg.classList.add('is-separada');
    } else {
      svg.classList.remove('is-separada');
      await Promise.all(svg.getAnimations({ subtree: true }).map(a => a.finished)).catch(() => {});
      if (yo !== turno) return;
      caja.classList.add('en-3d');
      daga3d.alzar();
    }
  }

  function elegir(id) {
    if (!separada) separar(true);
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
    bordeIrregular(presentacion, { semilla: 5, amplitud: 3, paso: 14, quemado: 'br', radio: 60 });
    bordeIrregular(registro, { semilla: 9, amplitud: 3, paso: 14 });
    pintarDetalle();
    // la caja llega vacía, la daga aparece en su huella y se alza; sin relieve,
    // el dibujo se separa solo para que se vean las piezas y sus rótulos
    setTimeout(() => { if (separada) return; daga3d ? daga3d.alzar() : separar(true); }, 1200);
  };
  return vista;
}

/* --------------------------------------------------------------------------
   La daga en relieve. No es un modelo: como el tintero de la mesa, cada pieza
   son unas pocas copias del dibujo apiladas en profundidad (las de atrás,
   oscuras, forman el canto) y un brillo recortado con su silueta. Para que no
   pese, se gira solo el contenedor: la tarjeta gráfica recompone las capas y
   no se repinta nada. Las capas no reciben el cursor: la zona de toque es fija,
   así no se escapa del puntero al girar (como en los objetos de la mesa).
   -------------------------------------------------------------------------- */
const REPOSO = { alto: 3, x: 20, y: -22, z: -4 };
const DE_FRENTE = { alto: 0, x: 0, y: 0, z: 0 };
const GIRO_MAX = { x: [0, 40], y: [-36, 36] };
// grosor en % del ancho de la caja; brillo según lo que refleja cada material
const PIEZAS_3D = {
  hoja: { capas: 4, grosor: .8, brillo: .55 },
  guarda: { capas: 5, grosor: 1.2, brillo: .6 },
  empunadura: { capas: 6, grosor: 1.8, brillo: .14 },
  pomo: { capas: 5, grosor: 1.6, brillo: .5 }
};
const ALTO_DIBUJO = 4000;
const pct = n => `${(n * 100).toFixed(3)}%`;
const limitar = (n, [min, max]) => Math.min(max, Math.max(min, n));

function relieve(piezas, alTocar) {
  const brillos = [];
  const eje = h('div', { class: 'daga3d__eje', style: { left: pct(GIRO / VISTA.ancho), top: pct(-VISTA.y / VISTA.alto) } },
    piezas.map(p => {
      const { capas, grosor, brillo } = PIEZAS_3D[p.id];
      const src = `assets/netherbane/${p.imagen}.webp`;
      const lugar = { left: pct(p.armada.x / VISTA.ancho), top: pct(p.armada.y / ALTO_DIBUJO), width: pct(p.w / VISTA.ancho), height: pct(p.h / ALTO_DIBUJO) };
      const hondo = i => `translateZ(${(grosor * (.5 - i / (capas - 1))).toFixed(3)}cqw)`;
      const luz = h('i', { style: { '--b': brillo } });
      brillos.push(luz);
      return [
        Array.from({ length: capas }, (_, i) => h('img', {
          src, alt: '',
          style: { ...lugar, transform: hondo(i), filter: i ? `brightness(${(.6 - .3 * i / (capas - 1)).toFixed(2)})` : null }
        })),
        h('span', { class: 'daga3d__brillo', style: { ...lugar, transform: `${hondo(0)} translateZ(.1cqw)`, maskImage: `url(${src})`, webkitMaskImage: `url(${src})` } }, luz)
      ];
    }));
  const pose = h('div', { class: 'daga3d__pose' }, eje);
  const toque = h('div', { class: 'daga3d__toque' });
  const nodo = h('div', { class: 'daga3d', 'aria-hidden': 'true' }, pose, toque);

  let giro = { ...REPOSO };
  const poner = g => {
    pose.style.transform = `translateZ(${g.alto}cqw) rotateX(${g.x}deg) rotateY(${g.y}deg) rotateZ(${g.z}deg)`;
    // el reflejo corre por el metal según hacia dónde mira la daga (su franja
    // está en el centro de un degradado tres veces más alto que la pieza)
    const reflejo = `translateY(${(-33.3 + g.y * .37).toFixed(1)}%)`;
    brillos.forEach(b => { b.style.transform = reflejo; });
  };
  const terminar = () => Promise.all(pose.getAnimations().map(a => a.finished)).catch(() => {});
  poner(DE_FRENTE);

  // arrastrar la gira; tocarla sin arrastrar la separa
  let agarre = null, cuadro = null;
  toque.addEventListener('pointerdown', ev => {
    agarre = { x: ev.clientX, y: ev.clientY, giro: { ...giro }, movida: false };
    toque.setPointerCapture(ev.pointerId);
    pose.style.transition = 'none';
    brillos.forEach(b => { b.style.transition = 'none'; });
  });
  toque.addEventListener('pointermove', ev => {
    if (!agarre) return;
    const dx = ev.clientX - agarre.x, dy = ev.clientY - agarre.y;
    if (Math.hypot(dx, dy) > 5) agarre.movida = true;
    giro = { ...giro, x: limitar(agarre.giro.x - dy * .3, GIRO_MAX.x), y: limitar(agarre.giro.y + dx * .3, GIRO_MAX.y) };
    cuadro ??= requestAnimationFrame(() => { cuadro = null; poner(giro); });
  });
  const soltar = () => {
    if (!agarre) return;
    const tocada = !agarre.movida;
    agarre = null;
    pose.style.transition = '';
    brillos.forEach(b => { b.style.transition = ''; });
    if (tocada) alTocar();
  };
  toque.addEventListener('pointerup', soltar);
  toque.addEventListener('pointercancel', () => { if (agarre) agarre.movida = true; soltar(); });

  return {
    nodo,
    alzar() { giro = { ...REPOSO }; nodo.classList.add('is-alzada'); poner(giro); return terminar(); },
    bajar() { nodo.classList.remove('is-alzada'); poner(DE_FRENTE); return terminar(); }
  };
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
