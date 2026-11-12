import { estado, alCambiar, marcarVisto, pisar } from './estado.js';
import { bandeja } from './vistas/comun.js';
import portada from './vistas/portada.js';
import escritorio, { tomarOrigen } from './vistas/escritorio.js';
import libro from './vistas/libro.js';
import denuncia from './vistas/denuncia.js';
import carta from './vistas/carta.js';
import relicario from './vistas/relicario.js';
import cronica from './vistas/cronica.js';
import recado from './vistas/recado.js';
import noticia from './vistas/noticia.js';
import colofon from './vistas/colofon.js';
import { abrirDesde } from './apertura.js';
import { mostrarFondo, luzVela } from './vistas/fondo.js';

/**
 * Punto de entrada: carga los datos del archivo y decide qué vista mostrar
 * según la dirección (#/, #/archivo, #/doc/<id>/<página>, #/creditos). Usa rutas con #
 * para que funcione igual en local y en GitHub Pages.
 */
const VISTAS = { libro, denuncia, carta, relicario, cronica, recado, noticia };
const app = document.getElementById('app');
let ctx;
let vistaActual = null;
let rutaAnterior = null;

async function cargar() {
  const json = url => fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.json(); });
  const [{ documentos }, { casas }, { ciudades, fuera }] = await Promise.all([
    json('data/documentos.json'), json('data/casas.json'), json('data/ciudades.json')
  ]);
  const docs = Object.fromEntries(await Promise.all(documentos.map(async d => [d.id, await json(`data/docs/${d.id}.json`)])));
  return { documentos, casas, ciudades, fuera, docs };
}

function leerRuta() {
  const partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!partes.length) return { vista: 'portada' };
  if (partes[0] === 'archivo') return { vista: 'escritorio' };
  if (partes[0] === 'creditos') return { vista: 'colofon' };
  if (partes[0] === 'doc' && ctx.docs[partes[1]]) return { vista: 'doc', id: partes[1], sub: partes[2] ? decodeURIComponent(partes[2]) : undefined };
  return { vista: 'escritorio' };
}

function mostrar() {
  const ruta = leerRuta();
  const previa = rutaAnterior;
  // mismo documento, otra página: se hojea sin rehacer la vista
  if (ruta.vista === 'doc' && vistaActual?.esDoc?.(ruta.id) && vistaActual.irA) {
    vistaActual.irA(ruta.sub);
    anotarRastro(ruta);
    pintarSeguido();
    return;
  }

  let vista;
  if (ruta.vista === 'portada') vista = portada();
  else if (ruta.vista === 'escritorio') vista = escritorio(ctx);
  else if (ruta.vista === 'colofon') vista = colofon(ctx);
  else {
    anotarRastro(ruta);
    marcarVisto(ruta.id);
    const meta = ctx.documentos.find(d => d.id === ruta.id);
    try {
      vista = VISTAS[meta.tipo](ctx, ruta.id, ruta.sub);
      vista.append(luzVela(), bandeja(ctx, ruta.id));
    } catch (err) {
      // casi siempre es una copia vieja del código guardada por el navegador
      console.error(err);
      vista = noSeAbre();
    }
  }
  // los documentos se leen sobre la misma mesa del escritorio
  mostrarFondo(ruta.vista === 'doc' || ruta.vista === 'colofon', { desdeMesa: previa?.vista === 'escritorio' });

  rutaAnterior = ruta;
  vistaActual?.desmontar?.();
  vistaActual = vista;
  app.replaceChildren(vista);
  window.scrollTo(0, 0);
  // si se abrió tocando un objeto de la mesa, el documento sale desde ahí
  const origen = tomarOrigen();
  const listo = vista.montado?.({ origen: origen?.id === ruta.id ? origen : null, previa });
  if (origen?.id === ruta.id && !vista.abreSolo) abrirDesde(origen, vista);
  Promise.resolve(listo).then(pintarSeguido);
  document.title = ruta.vista === 'doc' ? `${ctx.docs[ruta.id].titulo} · Archivo de Cregon` : ruta.vista === 'colofon' ? 'Créditos · Archivo de Cregon' : 'Archivo de Cregon';
}

function noSeAbre() {
  const vista = document.createElement('main');
  vista.className = 'vista doc';
  vista.innerHTML = '<p style="padding:40px;max-width:640px;color:var(--polvo)">Este documento no se pudo abrir. ' +
    'El navegador guardó una versión vieja del archivo. Recarga con Ctrl + F5 (en Mac, Cmd + Shift + R). ' +
    '<a href="#/archivo" style="text-decoration:underline">Volver a la mesa</a></p>';
  return vista;
}

function anotarRastro(ruta) {
  const desdeEscritorio = !rutaAnterior || rutaAnterior.vista !== 'doc';
  pisar({ id: ruta.id, titulo: ctx.docs[ruta.id].titulo, href: location.hash }, desdeEscritorio);
  rutaAnterior = ruta;
}

/** Resalta en toda la vista lo que pertenece a la casa que se sigue. */
function pintarSeguido() {
  const casa = estado.seguido;
  app.querySelectorAll('[data-casa]').forEach(n => n.classList.toggle('is-seguido', n.dataset.casa === casa));
  app.querySelectorAll('.grafico').forEach(g => g.classList.toggle('hay-seguido', !!casa && !!g.querySelector('.marca-dato.is-seguido')));
}

alCambiar(() => {
  app.querySelectorAll('.barra').forEach(b => b.actualizar?.());
  pintarSeguido();
});
app.addEventListener('pintado', pintarSeguido);

cargar().then(datos => {
  ctx = datos;
  window.addEventListener('hashchange', mostrar);
  mostrar();
}).catch(err => {
  console.error(err);
  app.innerHTML = '<p style="padding:40px;max-width:640px">No se pudieron cargar los datos del archivo. ' +
    'Si abriste el archivo con doble clic, sírvelo con <code>python serve.py</code> y entra a ' +
    '<a href="http://localhost:8000">localhost:8000</a>.</p>';
});
