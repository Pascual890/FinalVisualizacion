/**
 * Utilidades compartidas: crear elementos, colores, números, enlaces en el
 * texto de los registros y el tooltip.
 */

export const NS = 'http://www.w3.org/2000/svg';

/** Crea un elemento HTML. `hijos` puede ser texto, nodos o arrays. */
export function h(tag, attrs = {}, ...hijos) {
  const nodo = document.createElement(tag);
  aplicar(nodo, attrs);
  agregar(nodo, hijos);
  return nodo;
}

/** Crea un elemento SVG. */
export function s(tag, attrs = {}, ...hijos) {
  const nodo = document.createElementNS(NS, tag);
  aplicar(nodo, attrs);
  agregar(nodo, hijos);
  return nodo;
}

function aplicar(nodo, attrs) {
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') nodo.setAttribute('class', v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, val] of Object.entries(v)) {
        if (p.startsWith('--')) nodo.style.setProperty(p, val);
        else nodo.style[p] = val;
      }
    }
    else if (k.startsWith('on') && typeof v === 'function') nodo.addEventListener(k.slice(2), v);
    else if (k === 'html') nodo.innerHTML = v;
    else if (k === 'dataset') Object.assign(nodo.dataset, v);
    else nodo.setAttribute(k, v === true ? '' : v);
  }
}

function agregar(nodo, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo == null || hijo === false) continue;
    nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
}

/* --------------------------------------------------------------------------
   Colores (los mismos tokens que css/base.css)
   -------------------------------------------------------------------------- */
export const COLORES = {
  pergamino: '#e6d7b8', hoja: '#f3e9d2', tinta: '#2b1d0e', tintaTenue: '#6e5a45',
  sangre: '#8a2f1f', oro: '#b8862b', bosque: '#3f5a3a', lapis: '#2f4a6d',
  hollin: '#1c1712', madera: '#3a2a1c', polvo: '#cfc4ac', quemado: '#6a4024',
  lapiz: '#4a4038', vela: '#e9b35f'
};

/** Color de cada casa: Vareck en sangre, Vandel en verde, Voss en azul. */
export const COLOR_CASA = { vareck: COLORES.sangre, vandel: COLORES.bosque, voss: COLORES.lapis };

/** Color de un item de gráfico: por casa, por nombre de token o tal cual. */
export function colorDe(item, porDefecto = COLORES.tinta) {
  if (item.casa && COLOR_CASA[item.casa]) return COLOR_CASA[item.casa];
  if (item.color) return COLORES[item.color] ?? item.color;
  return porDefecto;
}

export const num = new Intl.NumberFormat('es-ES');

/* --------------------------------------------------------------------------
   Enlaces en el texto: [Vareck](noble:vareck), [Aldemar](lugar:aldemar),
   [la daga](daga), [Censo](doc:censo)
   -------------------------------------------------------------------------- */
const PATRON = /\[([^\]]+)\]\((noble|lugar|daga|doc)(?::([\w-]+))?\)/g;

export function rutaDeRef(tipo, id) {
  if (tipo === 'noble') return `#/doc/linajes/${id}`;
  if (tipo === 'lugar') return `#/doc/carta/${id}`;
  if (tipo === 'daga') return '#/doc/relicario';
  return `#/doc/${id}`;
}

/** Convierte el texto de un registro en nodos, con los nombres como enlaces. */
export function texto(cadena = '') {
  const nodos = [];
  let ultimo = 0;
  for (const m of cadena.matchAll(PATRON)) {
    if (m.index > ultimo) nodos.push(cadena.slice(ultimo, m.index));
    const [, etiqueta, tipo, id] = m;
    nodos.push(h('a', {
      class: `ref ref--${tipo}`,
      href: rutaDeRef(tipo, id),
      dataset: tipo === 'noble' ? { casa: id } : {}
    }, etiqueta));
    ultimo = m.index + m[0].length;
  }
  if (ultimo < cadena.length) nodos.push(cadena.slice(ultimo));
  return nodos;
}

/** Todas las referencias de un texto, para saber en qué libros aparece algo. */
export function referencias(cadena = '') {
  return [...cadena.matchAll(PATRON)].map(m => ({ tipo: m[2], id: m[3] }));
}

/* --------------------------------------------------------------------------
   Tooltip único
   -------------------------------------------------------------------------- */
let tipNodo;
export function tip(evento, titulo, cuerpo = '') {
  if (!tipNodo) {
    tipNodo = h('div', { class: 'tip papel', role: 'status' });
    document.body.append(tipNodo);
  }
  if (!evento) { tipNodo.classList.remove('is-visible'); return; }
  tipNodo.replaceChildren(h('strong', {}, titulo), cuerpo);
  const { clientX: x, clientY: y } = evento.touches?.[0] ?? evento;
  const ancho = tipNodo.offsetWidth, alto = tipNodo.offsetHeight;
  const izq = Math.min(window.innerWidth - ancho - 12, x + 16);
  const arriba = y - alto - 14 < 8 ? y + 18 : y - alto - 14;
  tipNodo.style.left = `${Math.max(8, izq)}px`;
  tipNodo.style.top = `${arriba}px`;
  tipNodo.classList.add('is-visible');
}

/** Posición de un elemento en el viewport, para el tooltip al enfocar con teclado. */
export function eventoDe(nodo) {
  const r = nodo.getBoundingClientRect();
  return { clientX: r.left + r.width / 2, clientY: r.top };
}

/* --------------------------------------------------------------------------
   Emblemas de las casas: medallones de oro, como el pomo de Netherbane.
   El de Vareck (Cerbero) es el dibujo de la infografía; los otros dos son
   provisionales, dibujados con el mismo esquema.
   -------------------------------------------------------------------------- */
export const FORMA_ESCUDO = 'M4 4 H56 V30 C56 50 42 62 30 68 C18 62 4 50 4 30 Z';

const FIGURAS = {
  arbol: 'M50 18 C36 18 30 30 33 38 C25 42 28 55 38 54 L46 54 L45 76 L55 76 L54 54 L62 54 C72 55 75 42 67 38 C70 30 64 18 50 18 Z',
  torre: 'M34 78 V40 H38 V31 H44 V40 H47 V31 H53 V40 H56 V31 H62 V40 H66 V78 Z M45 78 V64 C45 58 55 58 55 64 V78 Z'
};

export function emblema(casa, { ancho = 60 } = {}) {
  const etiqueta = `Emblema de la casa ${casa.nombre}`;
  if (casa.emblema === 'cerbero') {
    return h('img', { src: 'assets/netherbane/emblema-vareck.webp', width: ancho, height: ancho, alt: etiqueta, class: 'emblema' });
  }
  const color = COLOR_CASA[casa.id] ?? COLORES.tintaTenue;
  const id = `oro-${casa.id}`;
  return s('svg', { viewBox: '0 0 100 100', width: ancho, role: 'img', 'aria-label': etiqueta, class: 'emblema' },
    s('defs', {}, s('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 },
      s('stop', { offset: 0, 'stop-color': '#c9a94a' }),
      s('stop', { offset: .45, 'stop-color': '#efe0a2' }),
      s('stop', { offset: .55, 'stop-color': '#c6a440' }),
      s('stop', { offset: 1, 'stop-color': '#a5832a' }))),
    s('circle', { cx: 50, cy: 50, r: 45, fill: `url(#${id})`, stroke: '#1a1410', 'stroke-width': 5 }),
    FIGURAS[casa.emblema]
      ? s('path', { d: FIGURAS[casa.emblema], fill: color, stroke: '#1a1410', 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'fill-rule': 'evenodd' })
      : s('text', { x: 50, y: 62, 'text-anchor': 'middle', 'font-family': 'Cinzel, serif', 'font-size': 34, fill: color }, casa.nombre[0])
  );
}

/* --------------------------------------------------------------------------
   Papel con bordes de verdad: un clip-path con el borde irregular y, si se
   pide, una esquina comida por el fuego. Se recalcula al cambiar de tamaño.
   -------------------------------------------------------------------------- */

/** Números pseudoaleatorios repetibles (mulberry32). */
export function aleatorio(semilla = 1) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ESQUINAS = {
  // esquina: [x, y] relativos (0 o 1), ángulo de entrada y de salida del arco
  tl: [0, 0, 90, 0], tr: [1, 0, 180, 90], br: [1, 1, -90, -180], bl: [0, 1, 0, -90]
};

export function bordeIrregular(el, { semilla = 7, amplitud = 2.4, paso = 12, quemado = null, radio = 110 } = {}) {
  const pintar = () => {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    const azar = aleatorio(semilla);
    let pts = [];
    const lado = (x0, y0, x1, y1, nx, ny) => {
      const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / paso));
      for (let i = 0; i < n; i++) {
        const t = i / n, d = azar() * amplitud;
        pts.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d]);
      }
    };
    lado(0, 0, w, 0, 0, 1); lado(w, 0, w, h, -1, 0); lado(w, h, 0, h, 0, -1); lado(0, h, 0, 0, 1, 0);

    if (quemado) {
      const [ex, ey, a0, a1] = ESQUINAS[quemado];
      const cx = ex * w, cy = ey * h;
      const R = Math.min(radio, w * .22, h * .3);
      const fase = azar() * 6, fase2 = azar() * 6;
      // el ruido se apaga en los extremos para que el arco empalme con el borde
      const r = (th, k) => R * (1 + Math.sin(k * Math.PI) * (.2 * Math.sin(3 * th + fase) + .1 * Math.sin(8 * th + fase2) + .08 * (azar() - .5)));
      const arco = [];
      for (let i = 0; i <= 30; i++) {
        const k = i / 30, th = (a0 + (a1 - a0) * k) * Math.PI / 180, rr = r(th, k);
        arco.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
      }
      const fuera = p => Math.hypot(p[0] - cx, p[1] - cy) > R;
      if (quemado === 'tl') pts = [...pts.filter(fuera), ...arco];
      else {
        const i = pts.findIndex(p => !fuera(p));
        pts = [...pts.slice(0, i).filter(fuera), ...arco, ...pts.slice(i).filter(fuera)];
      }
      el.classList.add('chamuscado');
      el.dataset.esquina = quemado;
      el.style.setProperty('--q-r', `${R * 1.45}px`);
    }
    el.style.clipPath = `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
  };
  pintar();
  if (window.ResizeObserver) new ResizeObserver(pintar).observe(el);
  return el;
}

/** Carga un SVG externo como nodo (para el mapa). Se guarda en caché. */
const cacheSvg = new Map();
export async function cargarSvg(url) {
  if (!cacheSvg.has(url)) cacheSvg.set(url, fetch(url).then(r => r.text()));
  const doc = new DOMParser().parseFromString(await cacheSvg.get(url), 'image/svg+xml');
  return document.importNode(doc.documentElement, true);
}
