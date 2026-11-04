import lineas from './lineas.js';
import barras from './barras.js';
import circular from './circular.js';
import escudos from './escudos.js';
import mapa from './mapa.js';

/** Qué función dibuja cada `tipo` de gráfico de los JSON. */
export const GRAFICOS = { lineas, barras, anillo: circular, tarta: circular, escudos, mapa };

export async function dibujar(cont, spec, ctx) {
  const fn = GRAFICOS[spec.tipo];
  if (!fn) throw new Error(`Gráfico desconocido: ${spec.tipo}`);
  return fn(cont, spec, ctx);
}
