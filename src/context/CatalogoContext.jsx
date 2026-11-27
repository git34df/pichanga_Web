import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cargarCatalogo, catalogoInicial } from '../data/catalogo';
import { modoDemo } from '../lib/supabase';
import { buscarLocal, localesPorDistrito } from '../data/canchas';

const CatalogoContext = createContext(null);

// El catálogo de complejos y canchas se carga una sola vez al arrancar. Son
// pocos registros y las pantallas públicas lo consultan constantemente, así
// que una consulta al inicio sale más barata que una por pantalla.
export function CatalogoProvider({ children }) {
  const [locales, setLocales] = useState(catalogoInicial);
  const [cargando, setCargando] = useState(!modoDemo);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    const { datos, error: err } = await cargarCatalogo();
    setLocales(datos);
    setError(err);
    setCargando(false);
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const valor = useMemo(
    () => ({
      locales,
      cargando,
      error,
      recargar,
      buscar: (slug) => buscarLocal(slug, locales),
      porDistrito: (distrito, tipo) => localesPorDistrito(distrito, tipo, locales),
    }),
    [locales, cargando, error, recargar],
  );

  return <CatalogoContext.Provider value={valor}>{children}</CatalogoContext.Provider>;
}

export function useCatalogo() {
  const ctx = useContext(CatalogoContext);
  if (!ctx) throw new Error('useCatalogo debe usarse dentro de CatalogoProvider');
  return ctx;
}
