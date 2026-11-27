import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ReservaProvider } from './context/ReservaContext';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import { iniciarAnalytics, registrarVista } from './lib/analytics';
import Home from './pages/Home';
import Resultados from './pages/Resultados';
import Ficha from './pages/Ficha';
import Horario from './pages/Horario';
import Checkout from './pages/Checkout';
import Confirmacion from './pages/Confirmacion';
import MisReservas from './pages/MisReservas';
import MiCuenta from './pages/MiCuenta';
import PanelLocal from './pages/PanelLocal';
import ParaLocales from './pages/ParaLocales';
import Login from './pages/Login';
import Registro from './pages/Registro';
import SinPermiso from './pages/SinPermiso';
import NoEncontrado from './pages/NoEncontrado';

const TITULOS = [
  [/^\/$/, 'Inicio — Pichanga.pe'],
  [/^\/canchas\//, 'Listado de canchas — Pichanga.pe'],
  [/^\/local\/[^/]+\/horarios$/, 'Selección de horario — Pichanga.pe'],
  [/^\/local\//, 'Ficha del local — Pichanga.pe'],
  [/^\/reserva\/pago$/, 'Checkout y pago — Pichanga.pe'],
  [/^\/reserva\/confirmada$/, 'Reserva confirmada — Pichanga.pe'],
  [/^\/mis-reservas$/, 'Mis reservas — Pichanga.pe'],
  [/^\/mi-cuenta$/, 'Mi cuenta — Pichanga.pe'],
  [/^\/panel$/, 'Panel del local — Pichanga.pe'],
  [/^\/para-locales$/, 'Pichanga.pe para locales'],
  [/^\/login$/, 'Iniciar sesión — Pichanga.pe'],
  [/^\/registro$/, 'Crear cuenta — Pichanga.pe'],
];

function tituloDe(ruta) {
  return TITULOS.find(([patron]) => patron.test(ruta))?.[1] ?? 'Pichanga.pe';
}

// En una SPA la navegación no recarga la página, así que cada cambio de
// ruta tiene que avisar a GA4 por su cuenta.
function SeguimientoDeRutas() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const titulo = tituloDe(pathname);
    document.title = titulo;
    registrarVista(pathname + search, titulo);
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

export default function App() {
  useEffect(() => {
    iniciarAnalytics();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ReservaProvider>
          <SeguimientoDeRutas />
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/canchas/:distrito" element={<Resultados />} />
            <Route path="/local/:slug" element={<Ficha />} />
            <Route path="/local/:slug/horarios" element={<Horario />} />
            <Route path="/para-locales" element={<ParaLocales />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/sin-permiso" element={<SinPermiso />} />

            {/* Requieren sesión */}
            <Route
              path="/reserva/pago"
              element={
                <RutaProtegida>
                  <Checkout />
                </RutaProtegida>
              }
            />
            <Route
              path="/reserva/confirmada"
              element={
                <RutaProtegida>
                  <Confirmacion />
                </RutaProtegida>
              }
            />
            <Route
              path="/mis-reservas"
              element={
                <RutaProtegida>
                  <MisReservas />
                </RutaProtegida>
              }
            />
            <Route
              path="/mi-cuenta"
              element={
                <RutaProtegida>
                  <MiCuenta />
                </RutaProtegida>
              }
            />

            {/* Solo para cuentas de tipo local */}
            <Route
              path="/panel"
              element={
                <RutaProtegida rol="local">
                  <PanelLocal />
                </RutaProtegida>
              }
            />

            <Route path="*" element={<NoEncontrado />} />
          </Routes>
        </ReservaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
