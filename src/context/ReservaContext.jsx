import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { modoDemo } from '../lib/supabase';
import { crearReserva, listarReservasDeUsuario } from '../data/reservas';
import { useAuth } from './AuthContext';

const ReservaContext = createContext(null);

const CLAVE = 'pichanga:reservas';
const COMISION = 5; // S/ por reserva, según el modelo de ingresos del capítulo I

// --- almacenamiento del modo demo ---

function leerGuardadas() {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : [];
  } catch {
    return [];
  }
}

function guardar(reservas) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(reservas));
  } catch {
    // Modo incógnito o almacenamiento lleno: la reserva sigue viva en memoria.
  }
}

function nuevoCodigo() {
  return `PCH-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function ReservaProvider({ children }) {
  const { usuario } = useAuth();
  const [borrador, setBorrador] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [ultima, setUltima] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Las reservas se recargan cada vez que cambia la sesión: cerrar sesión
  // vacía la lista, y entrar con otra cuenta trae las de esa cuenta.
  useEffect(() => {
    let vigente = true;

    if (!usuario) {
      setReservas([]);
      return undefined;
    }

    if (modoDemo) {
      setReservas(leerGuardadas());
      return undefined;
    }

    setCargando(true);
    listarReservasDeUsuario(usuario.id).then(({ datos }) => {
      if (!vigente) return;
      setReservas(datos);
      setCargando(false);
    });

    return () => {
      vigente = false;
    };
  }, [usuario]);

  const iniciarBorrador = useCallback((datos) => {
    setBorrador({ ...datos, comision: COMISION, total: datos.precio + COMISION });
  }, []);

  const limpiarBorrador = useCallback(() => setBorrador(null), []);

  const confirmar = useCallback(
    async (metodoPago, contacto) => {
      if (!borrador || !usuario) return { reserva: null, error: 'No hay una reserva en curso.' };

      const reserva = {
        ...borrador,
        metodoPago,
        contacto,
        codigo: nuevoCodigo(),
        creadaEn: new Date().toISOString(),
      };

      if (modoDemo) {
        const siguientes = [reserva, ...reservas].slice(0, 20);
        setReservas(siguientes);
        guardar(siguientes);
        setBorrador(null);
        setUltima(reserva);
        return { reserva, error: null };
      }

      const { datos, error } = await crearReserva(reserva, usuario.id);
      if (error) return { reserva: null, error };

      setReservas((previas) => [datos, ...previas]);
      setBorrador(null);
      setUltima(datos);
      return { reserva: datos, error: null };
    },
    [borrador, reservas, usuario],
  );

  const valor = useMemo(
    () => ({
      borrador,
      reservas,
      ultima,
      cargando,
      iniciarBorrador,
      limpiarBorrador,
      confirmar,
      COMISION,
    }),
    [borrador, reservas, ultima, cargando, iniciarBorrador, limpiarBorrador, confirmar],
  );

  return <ReservaContext.Provider value={valor}>{children}</ReservaContext.Provider>;
}

export function useReserva() {
  const ctx = useContext(ReservaContext);
  if (!ctx) throw new Error('useReserva debe usarse dentro de ReservaProvider');
  return ctx;
}
