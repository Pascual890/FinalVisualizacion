/**
 * Polvo flotando en la luz de la vela. Un canvas ligero: unas pocas decenas
 * de motas que se mueven despacio y brillan más cerca de la llama.
 * Devuelve una función para detenerlo.
 */
export function polvo(canvas, escena) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const ctx = canvas.getContext('2d');
  let w = 0, hgt = 0, cuadro;

  // a resolución normal aunque la pantalla sea retina: las motas son difusas
  // y el lienzo, que se sube entero en cada cuadro, pesa hasta 4 veces menos
  const medir = () => {
    w = escena.clientWidth; hgt = escena.clientHeight;
    canvas.width = w; canvas.height = hgt;
  };
  medir();
  const motas = Array.from({ length: 70 }, () => ({
    x: Math.random() * w, y: Math.random() * hgt,
    r: .4 + Math.random() * 1.5,
    vx: (Math.random() - .5) * .12, vy: -.03 - Math.random() * .1,
    fase: Math.random() * Math.PI * 2
  }));

  // dónde está la llama (lo calcula escritorio.js en --vx / --vy); se relee de vez en cuando
  let vx = w * .18, vy = hgt * .22, n = 0;
  const leerVela = () => {
    const css = getComputedStyle(escena);
    vx = parseFloat(css.getPropertyValue('--vx')) / 100 * w || vx;
    vy = parseFloat(css.getPropertyValue('--vy')) / 100 * hgt || vy;
  };
  const dibujar = t => {
    if (n++ % 60 === 0) leerVela();
    ctx.clearRect(0, 0, w, hgt);
    for (const m of motas) {
      m.x += m.vx + Math.sin(t / 2400 + m.fase) * .08;
      m.y += m.vy;
      if (m.y < -5) { m.y = hgt + 5; m.x = Math.random() * w; }
      if (m.x < -5) m.x = w + 5; else if (m.x > w + 5) m.x = -5;
      const cerca = Math.max(0, 1 - Math.hypot(m.x - vx, m.y - vy) / (w * .45));
      const alfa = .05 + cerca * .5 * (.6 + .4 * Math.sin(t / 700 + m.fase));
      ctx.fillStyle = `rgba(255, 220, 160, ${alfa})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
    }
    cuadro = requestAnimationFrame(dibujar);
  };
  cuadro = requestAnimationFrame(dibujar);
  window.addEventListener('resize', medir);
  return () => { cancelAnimationFrame(cuadro); window.removeEventListener('resize', medir); };
}
