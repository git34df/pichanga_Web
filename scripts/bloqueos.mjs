// Verifica el bloqueo de horarios: entra al panel como local, hace clic en
// una hora libre y comprueba que queda bloqueada, y que un segundo clic la
// libera. Corre en modo demo, sin tocar Supabase.
//
//   node scripts/bloqueos.mjs

import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/panel',
  pretendToBeVisual: true,
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.localStorage = dom.window.localStorage;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const servidor = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

const React = (await import('react')).default;
const { act } = await import('react');
const { createRoot } = await import('react-dom/client');
const { default: App } = await servidor.ssrLoadModule('/src/App.jsx');

const LOCAL = {
  id: 'demo-2',
  email: 'local@pichanga.pe',
  nombre: 'La Bombonera',
  celular: '987111222',
  rol: 'local',
  localSlug: 'la-bombonera',
};

dom.window.localStorage.clear();
dom.window.localStorage.setItem('pichanga:sesion-demo', JSON.stringify(LOCAL));

const contenedor = dom.window.document.getElementById('root');
const root = createRoot(contenedor);
await act(async () => {
  root.render(React.createElement(App));
});

let fallos = 0;
const comprobar = (nombre, condicion, detalle = '') => {
  if (condicion) {
    console.log(`✓ ${nombre}`);
  } else {
    console.log(`✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
    fallos += 1;
  }
};

const libres = () => [...contenedor.querySelectorAll('button.celda--libre')];
const bloqueadas = () => [...contenedor.querySelectorAll('button.celda--bloqueado')];
const guardados = () => JSON.parse(dom.window.localStorage.getItem('pichanga:bloqueos') ?? '[]');

comprobar('El panel pinta celdas de hora accionables', libres().length > 0, `encontradas ${libres().length}`);
comprobar('No hay bloqueos al empezar', guardados().length === 0);

// Las horas con reserva pagada no deben ser botones.
const reservadas = contenedor.querySelectorAll('button.celda--reservado');
comprobar('Una hora reservada no se puede alterar', reservadas.length === 0);

const objetivo = libres().at(0);
const etiqueta = objetivo?.getAttribute('aria-label') ?? '';

await act(async () => {
  objetivo.click();
});

comprobar('Un clic bloquea la hora', bloqueadas().length === 1, `bloqueadas: ${bloqueadas().length}`);
comprobar('El bloqueo queda guardado', guardados().length === 1);
comprobar(
  'El bloqueo apunta a la cancha correcta',
  guardados().at(0)?.localSlug === 'la-bombonera' && guardados().at(0)?.canchaId === 'c1',
  JSON.stringify(guardados().at(0)),
);
comprobar('Se avisa al usuario', contenedor.textContent.includes('Bloqueaste'));

await act(async () => {
  bloqueadas().at(0).click();
});

comprobar('Un segundo clic la libera', bloqueadas().length === 0);
comprobar('El bloqueo se borra del almacenamiento', guardados().length === 0);
comprobar('Se avisa de la liberación', contenedor.textContent.includes('Liberaste'));

await act(async () => root.unmount());
await servidor.close();

console.log(`\nHora probada: ${etiqueta.slice(0, 60)}`);
console.log(fallos === 0 ? 'Bloqueo de horarios correcto.' : `${fallos} comprobación(es) fallaron.`);
process.exit(fallos === 0 ? 0 : 1);