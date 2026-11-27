import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Movil, TopBar } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Registro() {
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const { registrar, autenticado, rol: rolSesion } = useAuth();

  const rol = params.get('rol') === 'local' ? 'local' : 'jugador';
  const redirect = params.get('redirect') ?? '';
  const esLocal = rol === 'local';

  const [form, setForm] = useState({ nombre: '', celular: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (autenticado && !aviso) {
    return <Navigate to={redirect || (rolSesion === 'local' ? '/panel' : '/')} replace />;
  }

  function cambiar(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { error: err, requiereConfirmacion } = await registrar({ ...form, rol });
    setEnviando(false);

    if (err) {
      setError(err);
      return;
    }
    if (requiereConfirmacion) {
      setAviso('Te enviamos un correo para confirmar la cuenta. Ábrelo y luego inicia sesión.');
      return;
    }
    navegar(redirect || (esLocal ? '/panel/complejo' : '/'), { replace: true });
  }

  if (aviso) {
    return (
      <Movil ancho="angosto">
        <TopBar volverA="/login" titulo="Revisa tu correo" />
        <div className="movil__cuerpo" style={{ paddingTop: 30 }}>
          <div className="tarjeta">
            <p className="texto-sm" style={{ lineHeight: 1.5 }}>
              {aviso}
            </p>
          </div>
          <Link to="/login" className="btn btn--primario" style={{ marginTop: 18 }}>
            Ir a iniciar sesión
          </Link>
        </div>
      </Movil>
    );
  }

  return (
    <Movil ancho="angosto">
      <TopBar
        volverA={esLocal ? '/para-locales' : '/login'}
        titulo={esLocal ? 'Registra tu local' : 'Crear cuenta'}
      />

      <form className="movil__cuerpo" style={{ paddingTop: 20, paddingBottom: 24 }} onSubmit={enviar}>
        <p className="texto-gris texto-sm" style={{ lineHeight: 1.5 }}>
          {esLocal
            ? 'Publica tus canchas y recibe reservas pagadas por adelantado. Sin comisión los primeros tres meses.'
            : 'Con tu cuenta guardas el historial y repites tus reservas habituales en un clic.'}
        </p>

        <div className="apilar gap-12" style={{ marginTop: 18 }}>
          <div className="campo">
            <label className="campo__label" htmlFor="nombre">
              {esLocal ? 'Nombre del complejo' : 'Nombre y apellido'}
            </label>
            <input
              id="nombre"
              className="campo__input"
              type="text"
              autoComplete={esLocal ? 'organization' : 'name'}
              value={form.nombre}
              onChange={cambiar('nombre')}
              required
            />
          </div>
          <div className="campo">
            <label className="campo__label" htmlFor="celular">
              Celular
            </label>
            <input
              id="celular"
              className="campo__input"
              type="tel"
              autoComplete="tel"
              placeholder="987 654 321"
              value={form.celular}
              onChange={cambiar('celular')}
              required
            />
          </div>
          <div className="campo">
            <label className="campo__label" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              className="campo__input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={cambiar('email')}
              required
            />
          </div>
          <div className="campo">
            <label className="campo__label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              className="campo__input"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={form.password}
              onChange={cambiar('password')}
              required
            />
            <span className="texto-gris texto-xs">Mínimo 6 caracteres.</span>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              marginTop: 14,
              fontSize: 13,
              color: '#A32015',
              background: '#FDECEA',
              border: '1px solid #F5C2BC',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primario" style={{ marginTop: 18 }} disabled={enviando}>
          {enviando ? 'Creando cuenta…' : esLocal ? 'Registrar mi local' : 'Crear cuenta'}
        </button>

        <p className="texto-sm" style={{ marginTop: 16, textAlign: 'center' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Inicia sesión
          </Link>
        </p>
      </form>
    </Movil>
  );
}
