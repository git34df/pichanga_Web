import { Link, useNavigate } from 'react-router-dom';
import { Movil, NavInferior, TopBar } from '../components/Layout';
import { IconoCancha } from '../components/Iconos';
import { buscarLocal, fechaLegible, proximosDias } from '../data/canchas';
import { useReserva } from '../context/ReservaContext';
import { eventos } from '../lib/analytics';

export default function MisReservas() {
  const { reservas, iniciarBorrador } = useReserva();
  const navegar = useNavigate();

  // Ruta de re-reserva: salta del paso 6 al paso 4 del flujo, conservando
  // local, cancha y hora, y moviendo la fecha a la misma semana siguiente.
  function repetir(reserva) {
    const local = buscarLocal(reserva.localSlug);
    if (!local) return;
    const siguiente = proximosDias(8).at(7)?.iso ?? reserva.fecha;
    iniciarBorrador({ ...reserva, fecha: siguiente });
    eventos.reReserva({ local: reserva.localSlug });
    navegar('/reserva/pago');
  }

  return (
    <Movil>
      <TopBar titulo="Mis reservas" subtitulo={`${reservas.length} en tu historial`} />

      <div className="movil__cuerpo" style={{ paddingTop: 16, paddingBottom: 20 }}>
        {reservas.length === 0 ? (
          <div className="tarjeta" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <IconoCancha size={34} />
            <p style={{ fontSize: 15, fontWeight: 600, marginTop: 12 }}>Todavía no reservas nada</p>
            <p className="texto-gris texto-sm" style={{ marginTop: 6, lineHeight: 1.45 }}>
              Cuando reserves una cancha aparecerá aquí, lista para repetirse en un clic.
            </p>
            <Link to="/" className="btn btn--primario" style={{ marginTop: 16 }}>
              Buscar canchas
            </Link>
          </div>
        ) : (
          <div className="rejilla">
            {reservas.map((r) => (
              <div key={r.codigo} className="tarjeta">
                <div className="fila-entre" style={{ alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{r.localNombre}</div>
                    <div className="texto-gris texto-sm" style={{ marginTop: 4 }}>
                      {r.canchaNombre}
                    </div>
                    <div className="texto-gris texto-sm" style={{ marginTop: 2 }}>
                      {fechaLegible(r.fecha)} · {r.horaEtiqueta}
                    </div>
                  </div>
                  <span className="etiqueta etiqueta--libre">{r.codigo}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button type="button" className="btn btn--neutro" onClick={() => repetir(r)}>
                    Repetir reserva
                  </button>
                  <Link to={`/local/${r.localSlug}`} className="btn btn--neutro">
                    Ver local
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NavInferior />
    </Movil>
  );
}