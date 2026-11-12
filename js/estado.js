/**
 * Estado de la visita: a qué noble se sigue, qué documentos se han abierto y el rastro de documentos
 * recorridos. Se guarda en el navegador para que no se pierda al recargar.
 */

const CLAVE = 'archivo-cregon';

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) ?? {}; } catch { return {}; }
}
function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      seguido: estado.seguido,
      vistos: [...estado.vistos]
    }));
  } catch { /* sin almacenamiento: la visita simplemente no se recuerda */ }
}

const previo = leer();

export const estado = {
  seguido: previo.seguido ?? null,          // id de casa
  vistos: new Set(previo.vistos ?? []),     // ids de documentos abiertos
  rastro: []                                // [{ id, titulo, href }]
};

const oyentes = new Set();
export function alCambiar(fn) { oyentes.add(fn); return () => oyentes.delete(fn); }
function avisar() { guardar(); oyentes.forEach(fn => fn(estado)); }

/** ¿Hay algo de una visita anterior? */
export function hayProgreso() {
  return estado.vistos.size > 0 || estado.seguido !== null;
}

/** Olvida la visita: documentos abiertos, casa seguida y rastro. */
export function reiniciar() {
  estado.seguido = null;
  estado.vistos.clear();
  estado.rastro = [];
  avisar();
}

export function seguir(casa) {
  estado.seguido = estado.seguido === casa ? null : casa;
  avisar();
}

export function marcarVisto(id) {
  if (estado.vistos.has(id)) return;
  estado.vistos.add(id);
  guardar();
}

/**
 * Rastro: si se llega a un documento desde el escritorio, empieza de nuevo;
 * si se llega desde un enlace dentro de otro documento, se añade al final.
 * Volver a un documento del rastro lo recorta hasta ahí.
 */
let corte = false;
/** El próximo documento empieza un rastro nuevo (se saltó desde la bandeja). */
export function cortarRastro() { corte = true; }

export function pisar(paso, desdeEscritorio) {
  if (desdeEscritorio || (corte && paso.id !== estado.rastro.at(-1)?.id)) { corte = false; estado.rastro = [paso]; return; }
  corte = false;
  const i = estado.rastro.findIndex(p => p.id === paso.id);
  if (i >= 0) estado.rastro = estado.rastro.slice(0, i + 1).map((p, j) => (j === i ? paso : p));
  else estado.rastro.push(paso);
}
