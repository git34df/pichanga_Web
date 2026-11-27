"""Comprueba que cada navegacion genere exactamente un page_view.

    python3 scripts/verificar_ga.py

Lee window.dataLayer directamente, asi que no necesita que la etiqueta de
Google llegue a cargarse: gtag encola ahi antes de que el script externo
responda.
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
PUERTO = 8766


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        destino = Path(super().translate_path(path))
        if destino.is_file() or destino.is_dir():
            return str(destino)
        return str(DIST / "index.html")

    def log_message(self, *_):
        pass


LEER = """() => (window.dataLayer || [])
    .filter(e => e[0] === 'event' && e[1] === 'page_view')
    .map(e => e[2] && e[2].page_path)"""

fallos = 0


def comprobar(nombre, ok, detalle=""):
    global fallos
    print(f"{'OK ' if ok else 'XX '} {nombre}" + ("" if ok or not detalle else f" -- {detalle}"))
    if not ok:
        fallos += 1


def main():
    socketserver.TCPServer.allow_reuse_address = True
    handler = functools.partial(Handler, directory=str(DIST))
    servidor = socketserver.TCPServer(("127.0.0.1", PUERTO), handler)
    threading.Thread(target=servidor.serve_forever, daemon=True).start()

    with sync_playwright() as p:
        navegador = p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pagina = navegador.new_page()
        pagina.route("**googletagmanager.com/**", lambda ruta: ruta.abort())

        pagina.goto(f"http://127.0.0.1:{PUERTO}/", wait_until="load")
        pagina.wait_for_timeout(500)

        vistas = pagina.evaluate(LEER)
        comprobar("La vista de entrada se registra", len(vistas) == 1, str(vistas))
        comprobar("Apunta a la ruta correcta", vistas[:1] == ["/"], str(vistas))

        pagina.click("text=Buscar canchas")
        pagina.wait_for_timeout(500)
        vistas = pagina.evaluate(LEER)
        comprobar("Una navegacion suma una sola vista", len(vistas) == 2, str(vistas))

        pagina.go_back()
        pagina.wait_for_timeout(500)
        vistas = pagina.evaluate(LEER)
        comprobar("Volver atras suma una sola vista", len(vistas) == 3, str(vistas))

        print("\nRutas registradas:", vistas)
        navegador.close()

    servidor.shutdown()
    print("Medicion de vistas correcta." if fallos == 0 else f"{fallos} comprobacion(es) fallaron.")
    sys.exit(0 if fallos == 0 else 1)


if __name__ == "__main__":
    main()
