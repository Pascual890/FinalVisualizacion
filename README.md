# Archivo de Cregon

Producto final de Visualización de datos. El archivo del reino de Cregon quedó
abandonado después de la caída de los nobles; el usuario entra y explora lo que
quedó: la denuncia, la carta del reino, el censo, las cuentas, el libro de
tierras, el libro de linajes, el libro de la guardia, la crónica y la daga.
La historia de Aaron y Leo solo aparece en las notas a lápiz de Leo.

Es un sitio estático (HTML, CSS y JavaScript, sin librerías): los gráficos se
dibujan en SVG a mano para que tengan el mismo trazo de tinta que el resto.

## Cómo abrirlo

Usa módulos ES y `fetch`, así que **no funciona con doble clic** (`file://`).

```bash
python serve.py
```

Luego abrir <http://localhost:8000> (`python serve.py 8010` para otro puerto).
`serve.py` es el servidor de Python sin caché, para que al guardar se vea el
cambio con una recarga normal.

## Publicar en GitHub Pages

Subir la carpeta a un repositorio y activar Pages desde la rama principal
(carpeta raíz). Las rutas usan `#` (`#/doc/censo`), así que funcionan igual en
local y en Pages. El archivo `.nojekyll` debe quedarse.

## Estructura

```
index.html               Página única; carga fuentes, CSS y js/main.js
css/base.css             Colores, tipografías, papel (texturas, bordes, dobleces, quemaduras), lápiz de Leo
css/escritorio.css       Portada y mesa en perspectiva (libros con grosor, vela, relicario vacío)
css/documento.css        Libro abierto (retícula de cada libro, tapa, hoja que gira), denuncia,
                         carta, relicario, crónica, hoja de Leo, bandeja de documentos
css/graficos.css         Ejes, barras, líneas, escudos, mapas
data/documentos.json     Qué hay en la mesa y dónde (posición, giro, tapa)
data/casas.json          Las 12 casas nobles y cuándo cayó cada una
data/ciudades.json       Ciudades del mapa (coordenadas, habitantes, riqueza)
data/docs/<id>.json      El contenido de cada documento, página por página
assets/cregon.svg        Mapa del reino (viene de la página de Cregon)
assets/netherbane/       Piezas del dibujo de la infografía, recortadas (hoja, guarda, empuñadura,
                         pomo, lupas, daga entera, emblema de Cerbero)
assets/texturas/         Papel, manchas, madera y grafito (generadas con herramientas/texturas.py)
herramientas/texturas.py Vuelve a generar las texturas (pip install numpy pillow)
js/main.js               Carga los datos, decide qué vista mostrar y abre los documentos desde la mesa
js/apertura.js           El documento "vuela" desde su sitio en la mesa (técnica FLIP)
js/marcas.js             Trazos a lápiz: círculos, flechas, subrayados, tachones
js/estado.js             Noble seguido, notas encontradas, rastro de documentos
js/util.js               Crear elementos, colores, enlaces, tooltip, emblemas, bordes irregulares
js/graficos/*.js         Un archivo por tipo de gráfico (lineas, barras, circular, escudos, mapa)
js/vistas/*.js           Portada, escritorio (+ polvo), libro, denuncia, carta, relicario, crónica, hoja de Leo
```

## Profundidad sin WebGL

La mesa, los libros, la caja del relicario y las capas de la hoja son CSS 3D
(`perspective`, `preserve-3d`), no Three.js: cargan al instante y funcionan
en móvil. En pantallas de menos de 820 px la mesa se convierte en una pila sin
perspectiva. Si el sistema tiene activado "reducir movimiento", las
animaciones (vela, polvo, libros que se abren, hojas que giran) se apagan.

## Editar el contenido

Casi todo se cambia en `data/docs/*.json`, sin tocar el código.

- **Enlaces en el texto**: `[Vareck](noble:vareck)` lleva al Libro de linajes,
  `[Aldemar](lugar:aldemar)` a la Carta del reino, `[la daga](daga)` al
  Relicario y `[Censo](doc:censo)` a cualquier documento.
- **Notas de Leo**: `"nota": { "id": "único", "texto": "…" }` en cualquier
  página. Con `"sobre"` se coloca encima de un dato (un año en las líneas, una
  etiqueta en barras/anillo, una ciudad en el mapa, una fecha en la lista) y
  con `"marca"` (`circulo`, `flecha`, `subrayado`) Leo lo señala a lápiz. En la
  denuncia, `"tacha"` tacha una palabra. Cada nota encontrada destapa una línea
  de la hoja de Leo (`data/docs/leo.json`).
- **Páginas de un libro**: cada objeto de `paginas` es una página. Van en orden
  de año. `grafico.tipo` puede ser `lineas`, `barras`, `anillo`, `tarta`,
  `escudos` o `mapa` (con `modo`: `proporcional` o `zonas`).
- **Netherbane**: en `data/docs/relicario.json`, cada pieza tiene su posición
  `separada` (la de la infografía) y `armada`, en píxeles del dibujo original.

### Pendiente (borradores)

- `data/docs/cronica.json` — momentos provisionales: poner los del storyboard.
- `data/docs/leo.json` — la hoja de Leo; el cuento todavía no está completo.
- `data/casas.json` — nombres de las 9 casas caídas.
- Emblemas de Vandel (árbol) y Voss (torre): provisionales, en `js/util.js`.
- Las frases de las notas de Leo son propuestas.

## Lenguaje gráfico

| Uso | Color |
| --- | --- |
| Fondo de la sala | Hollín `#1C1712` |
| Papel / páginas | Pergamino `#E6D7B8`, Hoja `#F3E9D2` |
| Texto | Tinta `#2B1D0E`, Tinta tenue `#6E5A45` |
| Vareck, la daga, tachones, números de sección | Sangre `#8A2F1F` |
| Vandel / Voss (solo en gráficos) | Verde bosque `#3F5A3A` / Lapislázuli `#2F4A6D` |
| Lo que se toca (hover, enlaces, seguir) | Luz de vela `#E9B35F` |
| Notas de Leo | Lápiz `#4A4038` |

Tipografías: Cinzel Decorative (portada y nombre de Netherbane), Cinzel
(títulos), EB Garamond (texto y números), IM Fell English (la voz del registro:
capitulares, fechas, fuentes) y Reenie Beanie (la mano de Leo). Las páginas y
las piezas se numeran en romanos, como en la infografía.
