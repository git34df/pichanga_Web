// Prueba de humo: monta cada pantalla en jsdom y verifica que renderiza
// sin lanzar errores. No reemplaza pruebas de integración, pero detecta
// imports rotos, hooks mal usados y accesos a datos inexistentes.
//
//   node scripts/smoke.mjs

import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
// En Node 22 globalThis.navigator es solo de lectura: hay que redefinirla.
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.localStorage = dom.window.localStorage;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const servidor = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

const errores = [];
const errorOriginal = console.error;
console.error = (...args) => {
  errores.push(args.map(String).join(' '));
  errorOriginal(...args);
};

// Las dependencias se cargan con import normal (vite las externaliza en SSR);
// solo el código del proyecto pasa por ssrLoadModule para que se transforme el JSX.
const React = (await import('react')).default;
const { renderToString } = await import('react-dom/server');
const { MemoryRouter, Routes, Route } = await import('react-router-dom');
const { ReservaProvider } = await servidor.ssrLoadModule('/src/context/ReservaContext.jsx');
const { AuthProvider } = await servidor.ssrLoadModule('/src/context/AuthContext.jsx');
const { CatalogoProvider } = await servidor.ssrLoadModule('/src/context/CatalogoContext.jsx');

const PANTALLAS = [
  ['Home', '/src/pages/Home.jsx', '/', '/', 'Tu cancha'],
  ['Resultados', '/src/pages/Resultados.jsx', '/canchas/:distrito', '/canchas/los-olivos', 'Los Olivos'],
  ['Ficha', '/src/pages/Ficha.jsx', '/local/:slug', '/local/la-bombonera', 'La Bombonera'],
  ['Horario', '/src/pages/Horario.jsx', '/local/:slug/horarios', '/local/la-bombonera/horarios', 'Elige tu horario'],
  ['MisReservas', '/src/pages/MisReservas.jsx', '/mis-reservas', '/mis-reservas', 'Mis reservas'],
  // Sin sesión no hay local asignado: debe mostrar el estado de cuenta en revisión.
  ['PanelLocal (sin complejo)', '/src/pages/PanelLocal.jsx', '/panel', '/panel', null],
  ['MiComplejo', '/src/pages/MiComplejo.jsx', '/panel/complejo', '/panel/complejo', null],
  ['Ingresos', '/src/pages/Ingresos.jsx', '/panel/ingresos', '/panel/ingresos', null],
  ['NoEncontrado', '/src/pages/NoEncontrado.jsx', '*', '/ruta-inexistente', 'No encontramos'],
  ['Login', '/src/pages/Login.jsx', '/login', '/login', 'Iniciar sesión'],
  ['Registro jugador', '/src/pages/Registro.jsx', '/registro', '/registro', 'Crear cuenta'],
  ['Registro local', '/src/pages/Registro.jsx', '/registro', '/registro?rol=local', 'Registra tu local'],
  ['ParaLocales', '/src/pages/ParaLocales.jsx', '/para-locales', '/para-locales', 'para locales'],
  ['MiCuenta', '/src/pages/MiCuenta.jsx', '/mi-cuenta', '/mi-cuenta', 'Mi cuenta'],
  ['SinPermiso', '/src/pages/SinPermiso.jsx', '/sin-permiso', '/sin-permiso', 'no es para tu cuenta'],
  // Sin reserva en curso estas dos redirigen al inicio: basta con que no lancen error.
  ['Checkout (sin reserva)', '/src/pages/Checkout.jsx', '/reserva/pago', '/reserva/pago', null],
  ['Confirmacion (sin reserva)', '/src/pages/Confirmacion.jsx', '/reserva/confirmada', '/reserva/confirmada', null],
  // Guarda de ruta: sin sesión debe redirigir en lugar de mostrar el panel.
  ['RutaProtegida', '/src/components/RutaProtegida.jsx', '/panel', '/panel', null],
];

let fallos = 0;

for (const [nombre, modulo, patron, ruta, esperado] of PANTALLAS) {
  try {
    const { default: Pantalla } = await servidor.ssrLoadModule(modulo);
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [ruta] },
        React.createElement(
          AuthProvider,
          null,
          React.createElement(
            CatalogoProvider,
            null,
            React.createElement(
            ReservaProvider,
            null,
            React.createElement(
              Routes,
              null,
              React.createElement(Route, { path: patron, element: React.createElement(Pantalla) }),
            ),
          ),
          ),
        ),
      ),
    );
    if (esperado !== null && !html.includes(esperado)) {
      console.log(`✗ ${nombre}: renderizó, pero no contiene "${esperado}"`);
      fallos += 1;
    } else {
      console.log(`✓ ${nombre} (${ruta})`);
    }
  } catch (e) {
    console.log(`✗ ${nombre}: ${e.message}`);
    fallos += 1;
  }
}

await servidor.close();
console.error = errorOriginal;

const relevantes = errores.filter((e) => !e.includes('useLayoutEffect'));
if (relevantes.length) {
  console.log(`\n${relevantes.length} advertencia(s) de React:`);
  relevantes.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 200)));
}

console.log(fallos === 0 ? '\nTodas las pantallas renderizan.' : `\n${fallos} pantalla(s) con problemas.`);
process.exit(fallos === 0 ? 0 : 1);
