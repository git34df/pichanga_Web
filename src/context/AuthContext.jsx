import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { modoDemo, supabase } from '../lib/supabase';
import { eventos } from '../lib/analytics';

const AuthContext = createContext(null);

const CLAVE_DEMO = 'pichanga:sesion-demo';

// Cuentas de prueba del modo demo. En Supabase real estas no existen:
// ahí los usuarios se crean desde el formulario de registro.
const CUENTAS_DEMO = [
  {
    email: 'jugador@pichanga.pe',
    password: 'demo1234',
    nombre: 'Jorge Mendoza',
    celular: '987654321',
    rol: 'jugador',
    localSlug: null,
  },
  {
    email: 'local@pichanga.pe',
    password: 'demo1234',
    nombre: 'Complejo La Bombonera',
    celular: '987111222',
    rol: 'local',
    localSlug: 'la-bombonera',
  },
];

export const CUENTAS_DE_PRUEBA = CUENTAS_DEMO.map(({ email, password, rol }) => ({
  email,
  password,
  rol,
}));

// Normaliza la forma del usuario para que las pantallas no sepan
// si la sesión viene de Supabase o del modo demo.
//
// El rol y el local asignado se leen de la tabla `perfiles`, no del
// user_metadata: ese metadata lo puede modificar el propio cliente, así que no
// sirve para decidir permisos. El metadata solo se usa como respaldo durante
// los milisegundos en que el trigger de registro aún no creó la fila.
async function cargarPerfil(user) {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const base = {
    id: user.id,
    email: user.email,
    nombre: meta.nombre ?? '',
    celular: meta.celular ?? '',
    rol: meta.rol === 'local' ? 'local' : 'jugador',
    localSlug: null,
  };

  const { data, error } = await supabase
    .from('perfiles')
    .select('rol, nombre, celular, local_slug')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return base;

  return {
    ...base,
    nombre: data.nombre ?? base.nombre,
    celular: data.celular ?? base.celular,
    rol: data.rol === 'local' ? 'local' : 'jugador',
    localSlug: data.local_slug ?? null,
  };
}

function leerSesionDemo() {
  try {
    const crudo = window.localStorage.getItem(CLAVE_DEMO);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

function guardarSesionDemo(usuario) {
  try {
    if (usuario) window.localStorage.setItem(CLAVE_DEMO, JSON.stringify(usuario));
    else window.localStorage.removeItem(CLAVE_DEMO);
  } catch {
    // Almacenamiento bloqueado: la sesión vive solo en memoria.
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => (modoDemo ? leerSesionDemo() : null));
  const [cargando, setCargando] = useState(!modoDemo);

  useEffect(() => {
    if (modoDemo) return undefined;

    let vigente = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const perfil = await cargarPerfil(data.session?.user);
      if (!vigente) return;
      setUsuario(perfil);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evento, sesion) => {
      const perfil = await cargarPerfil(sesion?.user);
      if (!vigente) return;
      setUsuario(perfil);
      setCargando(false);
    });

    return () => {
      vigente = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const iniciarSesion = useCallback(async (email, password) => {
    if (modoDemo) {
      const cuenta = CUENTAS_DEMO.find(
        (c) => c.email === email.trim().toLowerCase() && c.password === password,
      );
      if (!cuenta) return { error: 'Correo o contraseña incorrectos.' };
      const { password: _, ...perfil } = cuenta;
      setUsuario(perfil);
      guardarSesionDemo(perfil);
      eventos.inicioSesion({ metodo: 'demo', rol: perfil.rol });
      return { error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: traducir(error.message) };
    // onAuthStateChange se encarga de cargar el perfil completo.
    eventos.inicioSesion({ metodo: 'password', rol: data.user?.user_metadata?.rol ?? 'jugador' });
    return { error: null };
  }, []);

  const registrar = useCallback(async ({ email, password, nombre, celular, rol }) => {
    if (modoDemo) {
      const perfil = {
        id: `demo-${Date.now()}`,
        email: email.trim().toLowerCase(),
        nombre,
        celular,
        rol,
        // En modo demo el local recién creado queda sin complejo asignado,
        // igual que en Supabase: local_slug lo pone un administrador.
        localSlug: null,
      };
      setUsuario(perfil);
      guardarSesionDemo(perfil);
      eventos.registro({ metodo: 'demo', rol });
      return { error: null, requiereConfirmacion: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nombre, celular, rol } },
    });
    if (error) return { error: traducir(error.message), requiereConfirmacion: false };

    eventos.registro({ metodo: 'password', rol });
    // Si el proyecto exige confirmar el correo, signUp no devuelve sesión activa.
    return { error: null, requiereConfirmacion: !data.session };
  }, []);

  const cerrarSesion = useCallback(async () => {
    if (modoDemo) {
      setUsuario(null);
      guardarSesionDemo(null);
      return;
    }
    await supabase.auth.signOut();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      rol: usuario?.rol ?? null,
      localSlug: usuario?.localSlug ?? null,
      autenticado: Boolean(usuario),
      cargando,
      modoDemo,
      iniciarSesion,
      registrar,
      cerrarSesion,
    }),
    [usuario, cargando, iniciarSesion, registrar, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

function traducir(mensaje) {
  const mapa = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'User already registered': 'Ese correo ya tiene una cuenta.',
    'Password should be at least 6 characters.': 'La contraseña debe tener al menos 6 caracteres.',
    'Email not confirmed': 'Confirma tu correo antes de iniciar sesión.',
  };
  return mapa[mensaje] ?? mensaje;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
