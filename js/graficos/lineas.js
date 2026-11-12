import { h, s, colorDe, cantidad, nombreUnidad, tip } from '../util.js';
import { marco, leyenda, escala, marcas } from './comun.js';

/**
 * Líneas en el tiempo (Cuentas del tesorero, Libro de la guardia).
 * spec: { labels, series: [{nombre, color, valores}], unidad, franja?, cambio? }
 * Con `cambio: true` se puede ver la diferencia con el año anterior.
 */
const W = 660, H = 380, M0 = { t: 34, r: 24, b: 48, l: 64 };

export default function lineas(cont, spec) {
  let modo = 'valores';
  // las cifras en monedas son más largas: el eje necesita más margen
  // y con varias series, cada una lleva su nombre a la derecha de su último punto
  const M = { ...M0, l: spec.unidad === 'mil monedas' ? 112 : M0.l, r: spec.series.length > 1 ? 118 : M0.r };
  const visibles = spec.series.map(() => true);
  const series = spec.series.map(se => ({ ...se, colorFinal: colorDe(se) }));

  if (spec.cambio) {
    const opciones = [['valores', 'Por año'], ['cambio', 'Cambio anual']];
    const botones = opciones.map(([v, t]) => h('button', {
      type: 'button', class: 'boton boton--papel', 'aria-pressed': String(v === modo),
      onclick: () => { modo = v; botones.forEach((b, i) => b.setAttribute('aria-pressed', String(opciones[i][0] === modo))); dibujar(); }
    }, t));
    cont.append(h('div', { class: 'controles', role: 'group', 'aria-label': 'Qué mostrar' }, botones));
  }

  const { figura, svg } = marco(cont, { ancho: W, alto: H, etiqueta: `Gráfico de líneas: ${series.map(x => x.nombre).join(', ')}` });
  if (series.length > 1) figura.append(leyenda(series, (i, activo) => { visibles[i] = activo; dibujar(); }));

  const capa = s('g');
  svg.append(capa);
  let x, y;

  function valoresDe(se) {
    if (modo === 'valores') return se.valores;
    return se.valores.map((v, i) => (i === 0 ? null : v - se.valores[i - 1]));
  }

  function dibujar() {
    capa.replaceChildren();
    const activas = series.filter((_, i) => visibles[i]);
    const todos = activas.flatMap(valoresDe).filter(v => v != null);
    const min = Math.min(0, ...todos);
    const { lista, tope } = marcas(Math.max(...todos, 1));
    x = escala([spec.labels[0], spec.labels.at(-1)], [M.l, W - M.r]);
    y = escala([min, tope], [H - M.b, M.t]);

    // franja de la guerra
    if (spec.franja) {
      const { desde, hasta, texto } = spec.franja;
      capa.append(s('g', { class: 'franja' },
        s('rect', { x: x(desde), y: M.t, width: x(hasta) - x(desde), height: H - M.t - M.b }),
        s('text', { x: (x(desde) + x(hasta)) / 2, y: M.t - 8, 'text-anchor': 'middle' }, texto)
      ));
    }

    // rejilla y eje Y
    const ejeY = s('g', { class: 'eje' });
    const rejilla = s('g', { class: 'rejilla' });
    lista.forEach(v => {
      rejilla.append(s('line', { x1: M.l, x2: W - M.r, y1: y(v), y2: y(v) }));
      ejeY.append(s('text', { x: M.l - 10, y: y(v) + 4, 'text-anchor': 'end' }, cantidad(v, spec.unidad, { corto: true })));
    });
    if (min < 0) capa.append(s('line', { x1: M.l, x2: W - M.r, y1: y(0), y2: y(0), stroke: '#2b1d0e', 'stroke-opacity': .5 }));
    capa.append(rejilla, ejeY, s('text', { class: 'unidad', x: 0, y: M.t - 14 }, modo === 'cambio' ? `${nombreUnidad(spec.unidad)} de más o de menos` : nombreUnidad(spec.unidad)));

    // eje X: un año sí y otro no, contando desde el último
    const ejeX = s('g', { class: 'eje' }, s('line', { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b }));
    spec.labels.forEach((anio, i) => {
      if ((spec.labels.length - 1 - i) % 2) return;
      ejeX.append(s('text', { x: x(anio), y: H - M.b + 24, 'text-anchor': 'middle' }, anio));
    });
    capa.append(ejeX);

    // las líneas
    series.forEach((se, i) => {
      if (!visibles[i]) return;
      const vals = valoresDe(se);
      const d = vals.map((v, j) => (v == null ? null : `${x(spec.labels[j])},${y(v)}`)).filter(Boolean);
      const camino = s('path', {
        class: 'linea-dato linea-dato--dibujar marca-dato',
        d: `M${d.join('L')}`, stroke: se.colorFinal,
        dataset: se.casa ? { casa: se.casa } : {}
      });
      capa.append(camino);
      const largo = camino.getTotalLength?.() || 2000;
      camino.style.setProperty('--largo', largo);
      const ultimo = vals.length - 1;
      capa.append(s('circle', { class: 'punto-dato', cx: x(spec.labels[ultimo]), cy: y(vals[ultimo]), r: 4.5, fill: se.colorFinal }));
      if (series.length > 1) {
        // el nombre va a la derecha del último punto, fuera del trazo; si dos series
        // terminan muy juntas, la de abajo baja un poco para no montarse
        const yFin = y(vals[ultimo]);
        const encima = activas.some(o => o !== se && valoresDe(o)[ultimo] > vals[ultimo] && Math.abs(y(valoresDe(o)[ultimo]) - yFin) < 20);
        capa.append(s('text', { class: 'valor', x: W - M.r + 12, y: yFin + (encima ? 18 : 5), fill: se.colorFinal }, se.nombre));
      }
    });

    // lectura al pasar el cursor
    const cursor = s('line', { class: 'cursor-linea', y1: M.t, y2: H - M.b, visibility: 'hidden' });
    const puntos = s('g', { 'pointer-events': 'none' });
    const zona = s('rect', { class: 'zona-hover', x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b });
    const leer = ev => {
      const caja = svg.getBoundingClientRect();
      const px = ((ev.touches?.[0] ?? ev).clientX - caja.left) * (W / caja.width);
      const j = Math.max(0, Math.min(spec.labels.length - 1, Math.round((px - M.l) / ((W - M.l - M.r) / (spec.labels.length - 1)))));
      const anio = spec.labels[j];
      cursor.setAttribute('x1', x(anio)); cursor.setAttribute('x2', x(anio));
      cursor.setAttribute('visibility', 'visible');
      puntos.replaceChildren();
      const filas = [];
      series.forEach((se, i) => {
        const v = valoresDe(se)[j];
        if (!visibles[i] || v == null) return;
        puntos.append(s('circle', { class: 'punto-dato', cx: x(anio), cy: y(v), r: 5, fill: se.colorFinal }));
        const signo = modo === 'cambio' && v > 0 ? '+' : '';
        filas.push(h('div', {}, `${se.nombre}: ${signo}${cantidad(v, spec.unidad)}`));
      });
      tip(ev, String(anio), filas.length ? filas : 'sin dato');
    };
    zona.addEventListener('pointermove', leer);
    zona.addEventListener('pointerleave', () => { cursor.setAttribute('visibility', 'hidden'); puntos.replaceChildren(); tip(null); });
    capa.append(cursor, puntos, zona);
  }

  dibujar();

  return {
    /** Posición de un año dentro del gráfico. Devuelve % del gráfico. */
    ancla(sobre) {
      const j = spec.labels.indexOf(sobre);
      if (j < 0) return null;
      const se = series[0];
      return { x: x(sobre) / W, y: y(valoresDe(se)[j] ?? 0) / H };
    },
    svg
  };
}
