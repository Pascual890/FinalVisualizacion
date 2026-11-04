"""
Servidor local para desarrollo, sin caché.

    python serve.py            -> http://localhost:8000
    python serve.py 8080       -> otro puerto

Igual que `python -m http.server`, pero envía cabeceras Cache-Control: no-store
para que el navegador recargue siempre el CSS y el JS al guardar cambios.
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class SinCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    # Silencia el log de cada petición para no llenar la consola
    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Archivo de Cregon en http://localhost:{puerto}  (Ctrl+C para parar)")
    ThreadingHTTPServer(("", puerto), SinCache).serve_forever()
