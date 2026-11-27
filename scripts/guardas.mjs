// Verifica el control de acceso: monta la aplicación completa en jsdom,
// navega a rutas privadas con distintas sesiones y comprueba a dónde llega.
//
//   node scripts/guardas.mjs

import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
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

const JUGADOR = {
  id: 'demo-1',
  email: 'jugador@pichanga.pe',
  nombre: 'Jorge',
  celular: '987654321',
  rol: 'jugador',
  localSlug: null,
};
const LOCAL = {
  id: 'demo-2',
  email: 'local@pichanga.pe',
  nombre: 'La Bombonera',
  celular: '987111222',
  rol: 'local',
  localSlug: 'la-bombonera',
};
// Cuenta de local creada pero todavía sin complejo asignado.
const LOCAL_SIN_ASIGNAR = { ...LOCAL, id: 'demo-3', localSlug: null };

async function visitar(ruta, sesion) {
  dom.window.localStorage.clear();
  if (sesion) dom.window.localStorage.setItem('pichanga:sesion-demo', JSON.stringify(sesion));
  dom.window.history.pushState({}, '', ruta);

  const contenedor = dom.window.document.getElementById('root');
  const root = createRoot(contenedor);
  await act(async () => {
    root.render(React.createElement(App));
  });
  const texto = contenedor.textContent ?? '';
  const url = dom.window.location.pathname + dom.window.location.search;
  await act(async () => root.unmount());
  return { texto, url };
}

const CASOS = [
  ['Sin sesión, /panel', '/panel', null, 'Iniciar sesión'],
  ['Sin sesión, /mis-reservas', '/mis-reservas', null, 'Iniciar sesión'],
  ['Sin sesión, /reserva/pago', '/reserva/pago', null, 'Iniciar sesión'],
  ['Sin sesión, /mi-cuenta', '/mi-cuenta', null, 'Iniciar sesión'],
  ['Jugador, /panel', '/panel', JUGADOR, 'no es para tu cuenta'],
  ['Jugador, /mis-reservas', '/mis-reservas', JUGADOR, 'Mis reservas'],
  ['Jugador, /mi-cuenta', '/mi-cuenta', JUGADOR, 'Mi cuenta'],
  ['Local con complejo, /panel', '/panel', LOCAL, 'Calendario de ocupación'],
  ['Local sin asignar, /panel', '/panel', LOCAL_SIN_ASIGNAR, 'Tu cuenta está en revisión'],
  ['Público: /', '/', null, 'Tu cancha'],
  ['Público: /para-locales', '/para-locales', null, 'Tus canchas llenas'],
  ['Público: ficha del local', '/local/la-bombonera', null, 'La Bombonera'],
];

let fallos = 0;

for (const [nombre, ruta, sesion, esperado] of CASOS) {
  try {
    const { texto, url } = await visitar(ruta, sesion);
    if (texto.includes(esperado)) {
      console.log(`✓ ${nombre} → ${url}`);
    } else {
      console.log(`✗ ${nombre} → ${url} — no encontró "${esperado}"`);
      console.log(`   recibido: ${texto.slice(0, 120).replace(/\s+/g, ' ')}`);
      fallos += 1;
    }
  } catch (e) {
    console.log(`✗ ${nombre}: ${e.message}`);
    fallos += 1;
  }
}

// La redirección debe conservar el destino para volver tras iniciar sesión.
const { url: urlLogin } = await visitar('/mis-reservas', null);
if (urlLogin.includes('redirect=%2Fmis-reservas')) {
  console.log('✓ La redirección guarda el destino original');
} else {
  console.log(`✗ La redirección no guarda el destino: ${urlLogin}`);
  fallos += 1;
}

await servidor.close();
console.log(fallos === 0 ? '\nControl de acceso correcto.' : `\n${fallos} caso(s) fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
