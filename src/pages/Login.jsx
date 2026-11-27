import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Movil, TopBar } from '../components/Layout';
import { CUENTAS_DE_PRUEBA, useAuth } from '../context/AuthContext';

export default function Login() {
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const { iniciarSesion, autenticado, rol, modoDemo } = useAuth();

  const redirect = params.get('redirect') ?? '';
  const rolPedido = params.get('rol');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (autenticado) {
    const destino = redirect || (rol === 'local' ? '/panel' : '/');
    return <Navigate to={destino} replace />;
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { error: err } = await iniciarSesion(email, password);
    setEnviando(false);
    if (err) {
      setError(err);
      return;
    }
    navegar(redirect || '/', { replace: true });
  }

  const urlRegistro = `/registro${rolPedido === 'local' ? '?rol=local' : ''}`;

  return (
    <Movil ancho="angosto">
      <TopBar volverA="/" titulo="Iniciar sesión" />

      <form className="movil__cuerpo" style={{ paddingTop: 20, paddingBottom: 24 }} onSubmit={enviar}>
        <p className="texto-gris texto-sm" style={{ lineHeight: 1.5 }}>
          {rolPedido === 'local'
            ? 'Entra con la cuenta de tu complejo deportivo para ver el calendario y los ingresos.'
            : 'Necesitas una cuenta para confirmar la reserva y guardar tu historial.'}
        </p>

        <div className="apilar gap-12" style={{ marginTop: 18 }}>
          <div className="campo">
            <label className="campo__label" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              className="campo__input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="texto-sm" style={{ marginTop: 16, textAlign: 'center' }}>
          ¿No tienes cuenta?{' '}
          <Link to={urlRegistro} style={{ fontWeight: 600 }}>
            Créala aquí
          </Link>
        </p>

        {modoDemo && (
          <div className="tarjeta mt-20" style={{ background: 'var(--amarillo-bg)', borderColor: 'var(--amarillo)' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--amarillo-ink)' }}>Modo demo</h2>
            <p className="texto-xs" style={{ marginTop: 6, lineHeight: 1.5, color: 'var(--amarillo-ink)' }}>
              No hay credenciales de Supabase configuradas, así que la sesión se simula en este navegador.
              Puedes entrar con:
            </p>
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: 'var(--amarillo-ink)' }}>
              {CUENTAS_DE_PRUEBA.map((c) => (
                <li key={c.email} className="texto-xs" style={{ marginBottom: 4 }}>
                  <strong>{c.rol}:</strong> {c.email} / {c.password}
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Movil>
  );
}