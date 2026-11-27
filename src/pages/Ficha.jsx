import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarraInferior, CajaLateral, Movil, TopBar } from '../components/Layout';
import { IconoCancha } from '../components/Iconos';
import { nombreDistrito, precioDesde } from '../data/canchas';
import { useCatalogo } from '../context/CatalogoContext';
import { eventos } from '../lib/analytics';
import NoEncontrado from './NoEncontrado';
import Cargando from './Cargando';

export default function Ficha() {
  const { slug } = useParams();
  const { buscar, cargando } = useCatalogo();
  const local = buscar(slug);

  useEffect(() => {
    if (local) eventos.verLocal(local);
  }, [local]);

  if (cargando) return <Cargando />;
  if (!local) return <NoEncontrado />;

  // El bloque de precio y reserva se muestra en dos sitios según el ancho:
  // barra fija abajo en móvil, tarjeta en la columna lateral en escritorio.
  const accion = (
    <>
      <div style={{ flex: 'none' }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--titulo)' }}>
          S/ {precioDesde(local)}
        </div>
        <div className="texto-gris texto-xs">desde, por hora</div>
      </div>
      <Link to={`/local/${local.slug}/horarios`} className="btn btn--primario" style={{ flex: 1 }}>
        Ver horarios
      </Link>
    </>
  );

  return (
    <Movil>
      <TopBar
        volverA={`/canchas/${local.distritoSlug}`}
        titulo={local.nombre}
        subtitulo={nombreDistrito(local.distritoSlug)}
      />

      <div className="ficha-hero">
        <IconoCancha size={54} />
        <span
          style={{
            position: 'absolute',
            right: 16,
            bottom: 14,
            background: 'rgba(18,23,15,0.72)',
            color: '#FFF',
            fontSize: 11,
            fontWeight: 500,
            padding: '5px 9px',
            borderRadius: 7,
          }}
        >
          Fotos del local
        </span>
      </div>

      <div className="movil__cuerpo" style={{ paddingTop: 16 }}>
        <div className="dos-columnas">
          <div>
            <p className="texto-gris texto-sm">{local.direccion}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {local.rating.toFixed(1).replace('.', ',')} ★
              </span>
              <span className="texto-gris texto-sm">{local.resenas} reseñas</span>
              <span
                style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--linea-fuerte)' }}
              />
              <span className="texto-gris texto-sm">{local.distanciaKm} km</span>
            </div>

            <p className="texto-sm" style={{ marginTop: 12, lineHeight: 1.5, maxWidth: '62ch' }}>
              {local.descripcion}
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {local.servicios.map((s) => (
                <span
                  key={s}
                  style={{
                    border: '1px solid var(--linea)',
                    background: 'var(--blanco)',
                    borderRadius: 999,
                    padding: '6px 11px',
                    fontSize: 12,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="tarjeta mt-16">
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Canchas disponibles</h2>
              {local.canchas.map((cancha, i) => (
                <div
                  key={cancha.id}
                  className="fila-entre"
                  style={{
                    padding: '10px 0',
                    borderBottom: i < local.canchas.length - 1 ? '1px solid #EEEFEA' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 500 }}>
                      {cancha.nombre} · {cancha.tipoNombre}
                    </div>
                    <div className="texto-gris texto-xs" style={{ marginTop: 2 }}>
                      Precio por hora en horario pico
                    </div>
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--verde)' }}>
                    S/ {cancha.precio}
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 15, fontWeight: 600, marginTop: 20, marginBottom: 10 }}>
              Lo que dicen los jugadores
            </h2>
            <div className="rejilla">
              {local.opiniones.map((o) => (
                <div key={o.autor} className="tarjeta">
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {o.autor} · {o.puntaje.toFixed(1).replace('.', ',')} ★
                  </div>
                  <p className="texto-gris texto-sm" style={{ marginTop: 6, lineHeight: 1.45 }}>
                    {o.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <CajaLateral>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>{accion}</div>
            <p className="texto-gris texto-xs" style={{ marginTop: 12, lineHeight: 1.45 }}>
              Cancelación sin costo hasta 12 horas antes del partido.
            </p>
          </CajaLateral>
        </div>
      </div>

      <BarraInferior className="solo-movil">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>{accion}</div>
      </BarraInferior>
    </Movil>
  );
}
