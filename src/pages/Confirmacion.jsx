import { useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Movil } from '../components/Layout';
import { IconoCheck } from '../components/Iconos';
import { buscarLocal, fechaLegible } from '../data/canchas';
import { useReserva } from '../context/ReservaContext';
import { eventos } from '../lib/analytics';

const NOMBRE_METODO = { yape: 'Yape', plin: 'Plin', tarjeta: 'tarjeta' };

export default function Confirmacion() {
  const [params] = useSearchParams();
  const codigo = params.get('codigo');
  const { reservas, ultima } = useReserva();
  // `ultima` cubre el instante entre confirmar el pago y que la lista se
  // recargue desde la base; si se llega por enlace directo, se busca en la lista.
  const reserva =
    (ultima?.codigo === codigo ? ultima : null) ??
    reservas.find((r) => r.codigo === codigo) ??
    ultima ??
    reservas[0];

  useEffect(() => {
    if (reserva) {
      const local = buscarLocal(reserva.localSlug);
      if (local) eventos.reservaConfirmada({ codigo: reserva.codigo, local });
    }
  }, [reserva]);

  if (!reserva) return <Navigate to="/" replace />;

  const porPersona = (reserva.total / 10).toFixed(2);

  function compartir() {
    eventos.compartirPago({ codigo: reserva.codigo });
    const texto = `Ya reservé la cancha: ${reserva.localNombre}, ${fechaLegible(reserva.fecha)} a las ${reserva.horaEtiqueta}. Son S/ ${porPersona} cada uno.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  }

  return (
    <Movil ancho="angosto">
      <div className="exito">
        <div className="exito__icono">
          <IconoCheck />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, marginTop: 16 }}>
          ¡Cancha reservada!
        </h1>
        <p style={{ fontSize: 13.5, lineHeight: 1.45, marginTop: 8, opacity: 0.88 }}>
          Te enviamos el comprobante por WhatsApp al {reserva.contacto.celular}.
        </p>
      </div>

      <div className="movil__cuerpo" style={{ paddingTop: 18, paddingBottom: 20 }}>
        <div className="tarjeta" style={{ borderRadius: 'var(--r-xl)', padding: 16 }}>
          <div className="seccion-titulo" style={{ fontSize: 11 }}>
            Código de reserva
          </div>
          <div className="codigo">{reserva.codigo}</div>

          <div
            className="apilar gap-12"
            style={{ borderTop: '1px solid #EEEFEA', marginTop: 14, paddingTop: 13 }}
          >
            <div>
              <div className="texto-gris texto-xs">Local</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>{reserva.localNombre}</div>
              <div className="texto-gris texto-sm" style={{ marginTop: 2 }}>
                {reserva.direccion}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div className="texto-gris texto-xs">Fecha y hora</div>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>
                  {fechaLegible(reserva.fecha)}, {reserva.horaEtiqueta}
                </div>
              </div>
              <div>
                <div className="texto-gris texto-xs">Cancha</div>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>{reserva.canchaNombre}</div>
              </div>
            </div>
            <div>
              <div className="texto-gris texto-xs">
                Pagado con {NOMBRE_METODO[reserva.metodoPago] ?? reserva.metodoPago}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>
                S/ {reserva.total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="tarjeta mt-16">
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>Divide el pago con tu grupo</h2>
          <p className="texto-gris texto-sm" style={{ margin: '6px 0 11px', lineHeight: 1.45 }}>
            Son S/ {porPersona} por cada uno si juegan 10. Envía el enlace y cada quien paga su parte.
          </p>
          <button type="button" className="btn btn--amarillo" onClick={compartir}>
            Enviar enlace por WhatsApp
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <Link to="/mis-reservas" className="btn btn--neutro">
            Mis reservas
          </Link>
          <Link to="/" className="btn btn--contorno">
            Volver al inicio
          </Link>
        </div>
      </div>
    </Movil>
  );
}