"""Sirve dist/ con fallback de SPA y toma capturas con Chrome.

    python3 scripts/capturas.py [ancho]

Sirve para revisar el resultado real, no el que uno supone al escribir el CSS.
"""

import functools
import http.server
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
DIST = RAIZ / "dist"
SALIDA = RAIZ / "capturas"
PUERTO = 8765


class Handler(http.server.SimpleHTTPRequestHandler):
    """Cualquier ruta desconocida devuelve index.html, como hace Vercel."""

    def translate_path(self, path):
        destino = Path(super().translate_path(path))
        if destino.is_file() or destino.is_dir():
            return str(destino)
        return str(DIST / "index.html")

    def log_message(self, *_):
        pass


def servir():
    socketserver.TCPServer.allow_reuse_address = True
    handler = functools.partial(Handler, directory=str(DIST))
    servidor = socketserver.TCPServer(("127.0.0.1", PUERTO), handler)
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    return servidor


PANTALLAS = [
    ("home", "/"),
    ("listado", "/canchas/san-miguel"),
    ("ficha", "/local/sport-center-pro"),
    ("horarios", "/local/sport-center-pro/horarios"),
    ("login", "/login"),
    ("para-locales", "/para-locales"),
]


def main():
    ancho = int(sys.argv[1]) if len(sys.argv) > 1 else 1440
    alto = 900 if ancho >= 900 else 844
    etiqueta = "escritorio" if ancho >= 900 else "movil"

    SALIDA.mkdir(exist_ok=True)
    servidor = servir()

    with sync_playwright() as p:
        navegador = p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pagina = navegador.new_page(viewport={"width": ancho, "height": alto})

        for nombre, ruta in PANTALLAS:
            pagina.goto(f"http://127.0.0.1:{PUERTO}{ruta}", wait_until="networkidle")
            pagina.wait_for_timeout(350)
            destino = SALIDA / f"{etiqueta}-{nombre}.png"
            pagina.screenshot(path=str(destino), full_page=False)
            print(f"{destino.name}")

        navegador.close()

    servidor.shutdown()


if __name__ == "__main__":
    main()
