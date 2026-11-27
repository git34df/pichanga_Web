import { Link } from 'react-router-dom';
import { Movil, NavInferior, TopBar } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useReserva } from '../context/ReservaContext';

export default function MiCuenta() {
  const { usuario, cerrarSesion, modoDemo } = useAuth();
  const { reservas } = useReserva();

  return (
    <Movil ancho="angosto">
      <TopBar titulo="Mi cuenta" subtitulo={usuario?.email} />

      <div className="movil__cuerpo" style={{ paddingTop: 16, paddingBottom: 20 }}>
        <div className="tarjeta apilar gap-12">
          <div>
            <div className="texto-gris texto-xs">Nombre</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>
              {usuario?.nombre || '—'}
            </div>
          </div>
          <div>
            <div className="texto-gris texto-xs">Celular</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>
              {usuario?.celular || '—'}
            </div>
          </div>
          <div>
            <div className="texto-gris texto-xs">Tipo de cuenta</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>
              {usuario?.rol}
            </div>
          </div>
        </div>

        <div className="tarjeta mt-16 fila-entre">
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Reservas hechas</div>
            <div className="texto-gris texto-sm" style={{ marginTop: 2 }}>
              En este navegador
            </div>
          </div>
          <div style={{ fontFamily: 'var(--titulo)', fontSize: 26, fontWeight: 700 }}>
            {reservas.length}
          </div>
        </div>

        <div className="apilar gap-10 mt-20">
          <Link to="/mis-reservas" className="btn btn--contorno">
            Ver mis reservas
          </Link>
          <button type="button" className="btn btn--neutro" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>

        {modoDemo && (
          <p className="texto-gris texto-xs mt-16" style={{ lineHeight: 1.5, textAlign: 'center' }}>
            Modo demo: la sesión se simula en este navegador.
          </p>
        )}
      </div>

      <NavInferior />
    </Movil>
  );
}
