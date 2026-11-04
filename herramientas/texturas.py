"""
Genera las texturas del archivo (papel, manchas y madera) en assets/texturas/.

    python herramientas/texturas.py

Son ruido filtrado con FFT, así que se repiten sin costuras. Las texturas de
papel son grises claras para usarlas con `background-blend-mode: multiply`
sobre el color de cada papel. Requiere: pip install numpy pillow
"""
from pathlib import Path
import numpy as np
from PIL import Image

SALIDA = Path(__file__).resolve().parent.parent / 'assets' / 'texturas'
SALIDA.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(1218)


def ruido(n, beta, ancho=None, estirar=1):
    """Ruido 1/f^beta, repetible en los bordes. `ancho` permite texturas no
    cuadradas; `estirar` > 1 alarga el ruido en horizontal (vetas)."""
    w = ancho or n
    fy = np.fft.fftfreq(n)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    f = np.sqrt((fx * estirar) ** 2 + fy ** 2)
    f[0, 0] = 1
    espectro = np.fft.fft2(rng.standard_normal((n, w))) / f ** beta
    r = np.real(np.fft.ifft2(espectro))
    return (r - r.mean()) / r.std()


def guardar(nombre, valores, calidad=82):
    img = Image.fromarray(np.clip(valores * 255, 0, 255).astype(np.uint8))
    img.save(SALIDA / f'{nombre}.webp', 'WEBP', quality=calidad, method=6)
    print('ok', nombre, img.size)


def fibras(n, cuantas, largo, grosor=1):
    """Fibras cortas en todas direcciones (no rayas horizontales)."""
    capa = np.zeros((n, n))
    for _ in range(cuantas):
        x, y = rng.uniform(0, n, 2)
        ang = rng.uniform(0, np.pi)
        curva = rng.normal(0, .02)
        l = rng.uniform(largo * .4, largo)
        intensidad = rng.uniform(.3, 1)
        for t in np.linspace(0, l, int(l * 2)):
            a = ang + curva * t
            px, py = int(x + np.cos(a) * t) % n, int(y + np.sin(a) * t) % n
            for g in range(grosor):
                capa[(py + g) % n, px] = max(capa[(py + g) % n, px], intensidad)
    return capa


# --- papel: moteado suave + grano fino + fibras -----------------------------
N = 512
moteado = ruido(N, 1.6)
grano = ruido(N, .35)
fib = fibras(N, 900, 26)
papel = 0.93 + 0.025 * moteado + 0.022 * grano - 0.05 * fib
guardar('papel', papel)

# --- manchas: humedad y suciedad, grandes y escasas ----------------------------
M = 1024
base = ruido(M, 2.2)
manchas = np.clip((base - 1.1) * 0.6, 0, 1)            # solo los picos
bordes = np.clip(1 - np.abs(base - 1.1) * 6, 0, 1)      # anillo de la mancha (marea)
detalle = ruido(M, 1.2)
valor = 1 - 0.10 * manchas - 0.06 * bordes - 0.025 * np.clip(detalle, 0, None)
guardar('manchas', valor)

# --- madera oscura de la mesa: vetas estiradas en horizontal ----------------
H, W = 512, 1024
anchas = ruido(H, 1.4, W, estirar=14)          # bandas de crecimiento
finas = ruido(H, 0.7, W, estirar=30)           # vetas finas
poros = ruido(H, 0.2, W, estirar=4)            # poro
nudos = ruido(H, 2.2, W)                       # variación de tono grande
madera = 0.40 + 0.07 * anchas + 0.045 * finas + 0.02 * poros + 0.05 * nudos
rgb = np.stack([madera * 1.0, madera * 0.72, madera * 0.50], -1) * 0.6
guardar('madera', rgb, calidad=80)

# --- grafito: máscara con transparencia para que el lápiz se vea granulado ----
G = 256
g = ruido(G, .3) * .55 + ruido(G, 1.1) * .25
alfa = np.clip(0.78 + 0.22 * g, 0.25, 1)
rgba = np.dstack([np.zeros((G, G, 3)), alfa[..., None]]) * 255
img = Image.fromarray(rgba.astype(np.uint8), 'RGBA')
img.save(SALIDA / 'grafito.webp', 'WEBP', quality=85, lossless=False, method=6)
print('ok grafito', img.size)
