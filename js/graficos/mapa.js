import { h, s, colorDe, num, tip, eventoDe, cargarSvg, COLORES, COLOR_CASA } from '../util.js';
import { leyenda } from './comun.js';

/**
 * Mapa de Cregon, en tres modos:
 *  · ubicacion    — solo dónde están las cosas (Carta del reino). Sin datos.
 *  · proporcional — un círculo por ciudad, área ∝ dato (Censo, Cuentas).
 *  · zonas        — parcelas de cada casa (Libro de tierras).
 * spec: { modo, medida?, unidad?, zonas? }   ctx: { ciudades, fuera, alElegir? }
 */
const RADIO_MAX = 72;

export default async function mapa(cont, spec, ctx) {
  const figura = h('figure', { class: 'grafico mapa-grafico', style: { margin: 0 } });
  cont.append(figura);
  const svg = await cargarSvg('assets/cregon.svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Mapa del reino de Cregon');
  figura.append(svg);

  const capaCiudades = svg.querySelector('#ciudades');
  const ruta = svg.querySelector('#ruta');
  let api = { svg, figura };

  if (spec.modo === 'zonas') api = { ...api, ...zonas(svg, spec, figura) };

  const medida = spec.modo === 'proporcional' ? spec.medida : null;
  const max = medida ? Math.max(...ctx.ciudades.map(c => c[medida])) : 1;
  const radio = c => (medida ? Math.sqrt(c[medida] / max) * RADIO_MAX : 6);
  const relleno = medida === 'riqueza' ? COLORES.oro : COLORES.tintaTenue;

  // las grandes debajo, las pequeñas encima
  const orden = [...ctx.ciudades].sort((a, b) => radio(b) - radio(a));
  const nodos = new Map();

  orden.forEach((c, i) => {
    // en la Carta (solo ubicación) las ciudades no llevan color de casa ni se
    // apagan al seguir a un noble: lo único resaltado es el lugar elegido
    const casa = medida && c.casa && COLOR_CASA[c.casa] ? c.casa : null;
    const g = s('g', {
      class: medida ? 'ciudad marca-dato' : 'ciudad',
      transform: `translate(${c.x} ${c.y})`,
      tabindex: 0,
      role: 'button',
      'aria-label': medida ? `${c.nombre}: ${num.format(c[medida])} ${spec.unidad}` : c.nombre,
      dataset: casa ? { casa } : {}
    });
    const circulo = s('circle', {
      class: 'ciudad__circulo', r: 0,
      fill: medida ? relleno : COLORES.tinta,
      'fill-opacity': medida ? .55 : 1,
      stroke: COLORES.tinta, 'stroke-width': medida ? 1.2 : 0
    });
    const r = radio(c);
    g.append(s('circle', { class: 'ciudad__anillo', r: r + 9 }), circulo, s('text', { class: 'ciudad__nombre', y: -(r + 8), 'text-anchor': 'middle' }, c.nombre));
    if (medida && r > 26) {
      g.append(s('text', { class: 'valor', y: 5, 'text-anchor': 'middle', 'pointer-events': 'none' }, num.format(c[medida])));
    }
    const titulo = medida ? `${num.format(c[medida])} ${spec.unidad}` : c.tipo;
    g.addEventListener('pointermove', ev => tip(ev, c.nombre, titulo));
    g.addEventListener('pointerleave', () => tip(null));
    g.addEventListener('focus', () => tip(eventoDe(g), c.nombre, titulo));
    g.addEventListener('blur', () => tip(null));
    const elegir = () => ctx.alElegir?.(c.id);
    g.addEventListener('click', elegir);
    g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); elegir(); } });
    capaCiudades.append(g);
    nodos.set(c.id, g);
    // crecer al entrar
    setTimeout(() => { circulo.style.transition = 'r .9s cubic-bezier(.2,.7,.2,1)'; circulo.setAttribute('r', r); circulo.style.r = `${r}px`; }, 60 + i * 70);
  });

  // lugares fuera del reino: se pueden tocar en la Carta
  if (spec.modo === 'ubicacion') {
    ctx.fuera?.forEach(l => {
      const g = s('g', { class: 'ciudad', transform: `translate(${l.x} ${l.y})`, tabindex: 0, role: 'button', 'aria-label': l.nombre },
        s('circle', { class: 'ciudad__anillo', r: 40 }),
        s('circle', { class: 'ciudad__circulo ciudad__circulo--zona', r: 34, fill: 'transparent' }));
      g.addEventListener('click', () => ctx.alElegir?.(l.id));
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter') ctx.alElegir?.(l.id); });
      capaCiudades.append(g);
      nodos.set(l.id, g);
    });
  }

  if (medida) svg.append(leyendaTamanos(max, spec.unidad, relleno));

  return {
    ...api,
    elegir(id) {
      nodos.forEach((g, k) => g.classList.toggle('is-elegida', k === id));
    },
    capa(id, visible) {
      if (id === 'ruta') ruta?.classList.toggle('is-visible', visible);
      if (id === 'frontera') figura.classList.toggle('sin-frontera', !visible);
    },
    ancla(sobre) {
      const c = ctx.ciudades.find(c => c.id === sobre);
      if (!c) return null;
      const vb = svg.viewBox.baseVal;
      return { x: (c.x - vb.x) / vb.width, y: (c.y - vb.y) / vb.height, r: radio(c) / vb.width };
    }
  };
}

/** Tres círculos de referencia en la esquina. */
function leyendaTamanos(max, unidad, relleno) {
  const valores = [max, max / 2, max / 8].map(v => Math.round(v / 100) * 100 || Math.round(v));
  const g = s('g', { transform: 'translate(-180 640)', 'pointer-events': 'none' });
  const base = 120;
  valores.forEach(v => {
    const r = Math.sqrt(v / max) * RADIO_MAX;
    g.append(
      s('circle', { cx: RADIO_MAX, cy: base - r, r, fill: relleno, 'fill-opacity': .18, stroke: COLORES.tinta, 'stroke-width': 1 }),
      s('line', { x1: RADIO_MAX, x2: RADIO_MAX * 2 + 14, y1: base - 2 * r, y2: base - 2 * r, stroke: COLORES.tinta, 'stroke-opacity': .4, 'stroke-dasharray': '2 2' }),
      s('text', { class: 'valor', x: RADIO_MAX * 2 + 18, y: base - 2 * r + 5 }, num.format(v))
    );
  });
  g.append(s('text', { class: 'unidad', x: 0, y: base + 22 }, unidad));
  return g;
}

/**
 * Parcelas: una cuadrícula de puntos dentro del contorno del reino; cada punto
 * va a la casa con el centro más cercano, ajustando pesos hasta que el número
 * de puntos de cada casa coincide con su porcentaje del Libro de tierras.
 */
function zonas(svg, spec, figura) {
  const reino = svg.querySelector('#reino');
  const caja = reino.getBBox();
  const PASO = 15;
  const puntos = [];
  const p = svg.createSVGPoint ? svg.createSVGPoint() : new DOMPoint();
  for (let y = caja.y + PASO / 2; y < caja.y + caja.height; y += PASO) {
    for (let x = caja.x + PASO / 2; x < caja.x + caja.width; x += PASO) {
      p.x = x; p.y = y;
      if (reino.isPointInFill(p)) puntos.push({ x, y });
    }
  }

  const zs = spec.zonas.map(z => ({ ...z, colorFinal: colorDe(z), peso: 0 }));
  const cuota = zs.map(z => (z.valor / 100) * puntos.length);
  const dist = puntos.map(pt => zs.map(z => Math.min(...z.centros.map(([cx, cy]) => Math.hypot(pt.x - cx, pt.y - cy)))));
  let duenos = [];
  const ITER = 300;
  for (let it = 0; it < ITER; it++) {
    duenos = dist.map(d => d.reduce((mejor, v, k) => (v - zs[k].peso < d[mejor] - zs[mejor].peso ? k : mejor), 0));
    const cuenta = zs.map((_, k) => duenos.filter(o => o === k).length);
    // paso pequeño y cada vez menor, para que no oscile
    const paso = 0.08 * (1 - it / ITER) + 0.005;
    zs.forEach((z, k) => { z.peso += (cuota[k] - cuenta[k]) * paso; });
  }

  const capa = s('g', { id: 'zonas' });
  reino.after(capa);
  const grupos = zs.map(z => {
    const g = s('g', { class: 'parcela marca-dato', dataset: z.casa ? { casa: z.casa } : {} });
    g.addEventListener('pointermove', ev => tip(ev, z.etiqueta, figura.classList.contains('is-despues') && z.casa
      ? `${z.valor} de cada 100 partes del reino, sin dueño`
      : `${z.valor} de cada 100 partes del reino`));
    g.addEventListener('pointerleave', () => tip(null));
    capa.append(g);
    return g;
  });
  puntos.forEach((pt, i) => {
    const z = zs[duenos[i]];
    const cuadro = s('rect', { x: pt.x - PASO / 2 + 1.5, y: pt.y - PASO / 2 + 1.5, width: PASO - 3, height: PASO - 3, fill: z.colorFinal, 'fill-opacity': .78, rx: 1.5 });
    cuadro.style.opacity = 0;
    cuadro.style.transition = `opacity .5s ${Math.round((pt.y - caja.y) * 1.4)}ms, fill .9s, fill-opacity .9s`;
    grupos[duenos[i]].append(cuadro);
    requestAnimationFrame(() => requestAnimationFrame(() => { cuadro.style.opacity = 1; }));
  });

  // la leyenda lleva la cifra: el mapa dice dónde, el número dice cuánto
  figura.append(leyenda(zs.map(z => ({ ...z, etiqueta: `${z.etiqueta} · ${z.valor} %` })), (k, activo) => { grupos[k].style.display = activo ? '' : 'none'; }));
  if (spec.despues) despues(figura, spec, zs);
  return {};
}

/**
 * «Después del callejón»: las parcelas de las casas nobles se quedan sin color.
 * Es lo único del archivo que mira más allá de la última página escrita.
 */
function despues(figura, spec, zs) {
  const sinDueno = zs.filter(z => z.casa).reduce((t, z) => t + z.valor, 0);
  const aviso = h('p', { class: 'mapa-despues', hidden: '' }, h('strong', {}, `${sinDueno} %`), h('span', {}, spec.despues.texto));
  const opciones = [[false, spec.despues.antes], [true, spec.despues.boton]];
  const botones = opciones.map(([activo, t]) => h('button', {
    type: 'button', class: 'boton boton--papel', 'aria-pressed': String(!activo),
    onclick: () => {
      botones.forEach((b, i) => b.setAttribute('aria-pressed', String(opciones[i][0] === activo)));
      figura.classList.toggle('is-despues', activo);
      aviso.toggleAttribute('hidden', !activo);
    }
  }, t));
  figura.before(h('div', { class: 'controles', role: 'group', 'aria-label': 'Qué momento mostrar' }, botones));
  figura.append(aviso);
}
