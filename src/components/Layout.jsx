import { Link, NavLink } from 'react-router-dom';
import { IconoAgenda, IconoBuscar, IconoCuenta, IconoVolver } from './Iconos';
import { useAuth } from '../context/AuthContext';

// Contenedor de las pantallas de cliente.
// En móvil es una columna de 430 px; a partir de 900 px ocupa el ancho real
// de la pantalla y la navegación pasa a la barra superior.
//
// `ancho="angosto"` limita el contenido a 540 px en escritorio: se usa en las
// pantallas que son un formulario corto (login, registro, landing de locales),
// donde estirar el texto a 1120 px lo haría ilegible.
export function Movil({ children, ancho }) {
  return (
    <div className={`movil${ancho ? ` movil--${ancho}` : ''}`}>
      <TopNav />
      {children}
    </div>
  );
}

function TopNav() {
  const { autenticado, rol } = useAuth();

  return (
    <header className="topnav">
      <div className="topnav__inner">
        <Link to="/" className="topnav__logo">
          Pichanga<span>.pe</span>
        </Link>

        <nav className="topnav__links" aria-label="Navegación principal">
          <NavLink to="/" end>
            Buscar
          </NavLink>
          <NavLink to="/mis-reservas">Mis reservas</NavLink>
          {rol === 'local' && <NavLink to="/panel">Mi local</NavLink>}
        </nav>

        <div className="topnav__acciones">
          {rol !== 'local' && (
            <Link to="/para-locales" className="btn btn--neutro btn--auto">
              Soy un local
            </Link>
          )}
          <Link
            to={autenticado ? '/mi-cuenta' : '/login'}
            className="btn btn--primario btn--auto"
          >
            {autenticado ? 'Mi cuenta' : 'Entrar'}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function TopBar({ titulo, subtitulo, volverA }) {
  return (
    <header className="topbar">
      {volverA && (
        <Link to={volverA} className="topbar__volver" aria-label="Volver">
          <IconoVolver />
        </Link>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="topbar__titulo">{titulo}</div>
        {subtitulo && <div className="topbar__sub">{subtitulo}</div>}
      </div>
    </header>
  );
}

export function NavInferior() {
  const { autenticado, rol } = useAuth();

  // El tercer ítem cambia según quién esté mirando: un local va a su panel,
  // un jugador a su cuenta, y quien no tiene sesión a la pantalla de entrada.
  const tercero =
    rol === 'local'
      ? { to: '/panel', texto: 'Mi local' }
      : autenticado
        ? { to: '/mi-cuenta', texto: 'Cuenta' }
        : { to: '/login', texto: 'Entrar' };

  return (
    <nav className="navinf" aria-label="Navegación principal">
      <NavLink to="/" className="navinf__item" end>
        <IconoBuscar />
        Buscar
      </NavLink>
      <NavLink to="/mis-reservas" className="navinf__item">
        <IconoAgenda />
        Reservas
      </NavLink>
      <NavLink to={tercero.to} className="navinf__item">
        <IconoCuenta />
        {tercero.texto}
      </NavLink>
    </nav>
  );
}

export function BarraInferior({ children, className = '' }) {
  return <div className={`movil__pie ${className}`}>{children}</div>;
}

// Versión de escritorio de la barra de acción: la misma información, pero
// como tarjeta fija en la columna lateral en vez de barra pegada abajo.
export function CajaLateral({ children }) {
  return (
    <aside className="col-lateral solo-escritorio">
      <div className="caja-accion">{children}</div>
    </aside>
  );
}
