import { Link } from 'react-router-dom';
import { IconoCancha } from './Iconos';
import { cuposLibres, precioDesde } from '../data/canchas';

export default function LocalCard({ local, fecha, onClick }) {
  const libres = fecha ? cuposLibres(local, fecha) : null;
  const tipos = [...new Set(local.canchas.map((c) => c.tipoNombre))].join(' y ');

  return (
    <Link to={`/local/${local.slug}`} className="local-card" onClick={onClick}>
      <div className="local-card__fila">
        <div className="local-card__foto">
          <IconoCancha size={30} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fila-entre" style={{ alignItems: 'flex-start' }}>
            <div className="local-card__nombre">{local.nombre}</div>
            {libres !== null && (
              <span className={`etiqueta ${libres > 0 ? 'etiqueta--libre' : 'etiqueta--lleno'}`}>
                {libres > 0 ? `${libres} libres` : 'lleno'}
              </span>
            )}
          </div>
          <div className="local-card__meta">
            {tipos} · {local.servicios[0].toLowerCase()} · {local.distanciaKm} km
          </div>
          <div className="local-card__meta">
            {local.rating.toFixed(1).replace('.', ',')} ★ ({local.resenas} reseñas)
          </div>
          <div className="local-card__precio">
            Desde S/ {precioDesde(local)}{' '}
            <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--gris)' }}>la hora</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
