import { Link } from 'react-router-dom';
import { Movil, NavInferior } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function SinPermiso() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <Movil>
      <div className="movil__cuerpo" style={{ paddingTop: 70, textAlign: 'center' }}>
        <h1 style={{ fontSize: 23, fontWeight: 700 }}>Esta sección no es para tu cuenta</h1>
        <p className="texto-gris texto-sm" style={{ marginTop: 10, lineHeight: 1.5 }}>
          Entraste como {usuario?.nombre || usuario?.email}, una cuenta de jugador. El panel es solo
          para los complejos deportivos afiliados.
        </p>
        <div className="apilar gap-10" style={{ marginTop: 20 }}>
          <Link to="/" className="btn btn--primario">
            Volver al buscador
          </Link>
          <Link to="/para-locales" className="btn btn--neutro">
            Quiero registrar un local
          </Link>
          <button type="button" className="btn btn--neutro" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </div>
      <NavInferior />
    </Movil>
  );
}
