import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function CabeceraPanel({ nombre }) {
  const { cerrarSesion } = useAuth();

  return (
    <header className="panel__barra">
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <Link
          to="/"
          style={{
            fontFamily: 'var(--titulo)',
            fontWeight: 700,
            fontSize: 19,
            textDecoration: 'none',
            color: 'var(--tinta)',
          }}
        >
          Pichanga<span style={{ color: 'var(--verde)' }}>.pe</span>{' '}
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--gris)' }}>para locales</span>
        </Link>

        <nav className="panel__nav" aria-label="Secciones del panel">
          <NavLink to="/panel" end>
            Calendario
          </NavLink>
          <NavLink to="/panel/ingresos">Ingresos</NavLink>
          <NavLink to="/panel/complejo">Mi complejo</NavLink>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="texto-gris texto-sm">{nombre}</span>
        <button
          type="button"
          className="btn btn--neutro"
          style={{ width: 'auto', minHeight: 38 }}
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
