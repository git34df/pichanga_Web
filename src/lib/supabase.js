import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sin credenciales configuradas la aplicación entra en MODO DEMO: la sesión se
// simula en localStorage para que el proyecto se pueda levantar y revisar sin
// crear antes un proyecto en Supabase. Los pasos de configuración están en el
// README; en cuanto existan las dos variables, este módulo usa Supabase real.
export const modoDemo = !URL || !ANON_KEY;

export const supabase = modoDemo ? null : createClient(URL, ANON_KEY);

if (modoDemo && import.meta.env.DEV) {
  console.info(
    '[auth] Modo demo: sin VITE_SUPABASE_URL ni VITE_SUPABASE_ANON_KEY. ' +
      'La sesión se simula en este navegador.',
  );
}
