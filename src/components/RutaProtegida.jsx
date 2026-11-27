import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Movil } from './Layout';

// Envuelve una ruta privada. Si no hay sesión, manda a /login recordando
// a dónde quería ir el usuario para devolverlo ahí después de entrar.
// Con `rol`, además exige que la sesión sea de ese tipo de usuario.
export default function RutaProtegida({ rol, children }) {
  const { autenticado, rol: rolActual, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <Movil>
        <div className="movil__cuerpo" style={{ paddingTop: 80, textAlign: 'center' }}>
          <p className="texto-gris texto-sm">Comprobando tu sesión…</p>
        </div>
      </Movil>
    );
  }

  if (!autenticado) {
    const destino = ubicacion.pathname + ubicacion.search;
    const sufijoRol = rol === 'local' ? '&rol=local' : '';
    return <Navigate to={`/login?redirect=${encodeURIComponent(destino)}${sufijoRol}`} replace />;
  }

  if (rol && rolActual !== rol) {
    return <Navigate to="/sin-permiso" replace />;
  }

  return children;
}
