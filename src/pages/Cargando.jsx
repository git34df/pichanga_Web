import { Movil } from '../components/Layout';

export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <Movil>
      <div className="movil__cuerpo" style={{ paddingTop: 80, textAlign: 'center' }}>
        <p className="texto-gris texto-sm">{texto}</p>
      </div>
    </Movil>
  );
}
