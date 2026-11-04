import { s, aleatorio } from './util.js';

/**
 * Trazos a lápiz de Leo: círculos, flechas, subrayados y tachones dibujados
 * "a mano" (con temblor) en SVG. Se dibujan solos al aparecer.
 */

/** Capa SVG que cubre un contenedor (en píxeles del contenedor). */
export function capaTrazos(ancho, alto) {
  return s('svg', { class: 'capa-trazos', viewBox: `0 0 ${ancho} ${alto}`, 'aria-hidden': 'true' });
}

/** Añade un trazo a la capa, con la animación de dibujarse. */
export function trazar(capa, d, retraso = .3) {
  const camino = s('path', { class: 'trazo trazo--dibujar', d });
  camino.style.setProperty('--retraso', `${retraso}s`);
  capa.append(camino);
  const largo = camino.getTotalLength?.() || 400;
  camino.style.setProperty('--largo', Math.ceil(largo));
  return camino;
}

/** Óvalo a mano: algo más de una vuelta, que no cierra exacto. */
export function circulo(cx, cy, rx, ry, semilla = 3) {
  const azar = aleatorio(semilla);
  const giro = (azar() - .5) * .5;
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = -0.4 + (i / 40) * (Math.PI * 2 + .7);
    const temblor = 1 + (azar() - .5) * .08 + Math.sin(t * 3) * .03;
    const x = Math.cos(t) * rx * temblor, y = Math.sin(t) * ry * temblor;
    pts.push([cx + x * Math.cos(giro) - y * Math.sin(giro), cy + x * Math.sin(giro) + y * Math.cos(giro)]);
  }
  return suave(pts);
}

/** Flecha curva de (x0, y0) a (x1, y1) con su punta. */
export function flecha(x0, y0, x1, y1, semilla = 5) {
  const azar = aleatorio(semilla);
  const mx = (x0 + x1) / 2 + (y1 - y0) * .25 + (azar() - .5) * 10;
  const my = (y0 + y1) / 2 - (x1 - x0) * .25;
  const ang = Math.atan2(y1 - my, x1 - mx);
  const l = 13;
  const p1 = [x1 - l * Math.cos(ang - .45), y1 - l * Math.sin(ang - .45)];
  const p2 = [x1 - l * Math.cos(ang + .45), y1 - l * Math.sin(ang + .45)];
  return `M${x0},${y0} Q${mx},${my} ${x1},${y1} M${p1} L${x1},${y1} L${p2}`;
}

/** Subrayado ondulado bajo un ancho dado. */
export function subrayado(x0, x1, y, semilla = 7) {
  const azar = aleatorio(semilla);
  const pts = [];
  for (let x = x0; x <= x1; x += 14) pts.push([x, y + (azar() - .5) * 3]);
  pts.push([x1 + 4, y - 3]);
  return suave(pts);
}

/** Tachón: dos o tres pasadas en zigzag apretado. */
export function tachon(ancho, alto, semilla = 9) {
  const azar = aleatorio(semilla);
  const y = alto / 2;
  let d = `M${-2},${y + 2}`;
  for (let x = 0; x <= ancho; x += 9) d += ` L${x},${y + (azar() - .5) * 5 - 1}`;
  d += ` M${ancho + 2},${y - 3}`;
  for (let x = ancho; x >= 0; x -= 11) d += ` L${x},${y + (azar() - .5) * 6 + 1}`;
  return d;
}

function suave(pts) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], [nx, ny] = pts[i + 1];
    d += ` Q${x.toFixed(1)},${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)},${((y + ny) / 2).toFixed(1)}`;
  }
  const u = pts.at(-1);
  return `${d} L${u[0].toFixed(1)},${u[1].toFixed(1)}`;
}
