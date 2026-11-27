import { Link } from 'react-router-dom';
import { Movil, NavInferior } from '../components/Layout';

export default function NoEncontrado() {
  return (
    <Movil>
      <div className="movil__cuerpo" style={{ paddingTop: 80, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>No encontramos esa página</h1>
        <p className="texto-gris texto-sm" style={{ marginTop: 10, lineHeight: 1.5 }}>
          El local puede haber salido de la plataforma o el enlace está mal escrito.
        </p>
        <Link to="/" className="btn btn--primario" style={{ marginTop: 20 }}>
          Volver al buscador
        </Link>
      </div>
      <NavInferior />
    </Movil>
  );
}
