import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarraInferior, CajaLateral, Movil, TopBar } from '../components/Layout';
import { IconoAviso } from '../components/Iconos';
import { disponibilidad, fechaLegible, proximosDias } from '../data/canchas';
import { useCatalogo } from '../context/CatalogoContext';
import { useReserva } from '../context/ReservaContext';
import { useAuth } from '../context/AuthContext';
import { modoDemo } from '../lib/supabase';
import { horariosOcupados } from '../data/reservas';
import { horasBloqueadasDemo } from '../data/bloqueos';
import { eventos } from '../lib/analytics';
import NoEncontrado from './NoEncontrado';
import Cargando from './Cargando';

export default function Horario() {
  const { slug } = useParams();
  const navegar = useNavigate();
  const { iniciarBorrador } = useReserva();
  const { autenticado } = useAuth();
  const { buscar, cargando: cargandoCatalogo } = useCatalogo();
  const local = buscar(slug);

  const dias = useMemo(() => proximosDias(5), []);
  const [fecha, setFecha] = useState(dias[0].iso);
  const [canchaId, setCanchaId] = useState('');
  const [horaSel, setHoraSel] = useState(null);
  const [tomadas, setTomadas] = useState([]);

  // El catálogo llega de forma asíncrona, así que la cancha por defecto se
  // deriva en el render en lugar de fijarse al montar.
  const cancha = local?.canchas.find((c) => c.id === canchaId) ?? local?.canchas[0];

  // Las horas ocupadas salen de la ocupación simulada del catálogo más lo
  // que haya en la base: reservas pagadas y horas que el local bloqueó.
  // Contra Supabase la función horarios_ocupados() ya une ambas cosas; en
  // modo demo hay que leer los bloqueos por separado.
  useEffect(() => {
    if (!local || !cancha) return undefined;

    if (modoDemo) {
      setTomadas(horasBloqueadasDemo(local.slug, cancha.id, fecha));
      return undefined;
    }

    let vigente = true;
    horariosOcupados(local.slug, cancha.id, fecha).then(({ datos }) => {
      if (vigente) setTomadas(datos);
    });
    return () => {
      vigente = false;
    };
  }, [local, cancha, fecha]);

  const horarios = useMemo(() => {
    if (!local || !cancha) return [];
    return disponibilidad(local.slug, cancha, fecha).map((h) => ({
      ...h,
      libre: h.libre && !tomadas.includes(h.hora),
    }));
  }, [local, cancha, fecha, tomadas]);

  if (cargandoCatalogo) return <Cargando />;
  if (!local || !cancha) return <NoEncontrado />;

  const elegido = horarios.find((h) => h.hora === horaSel);

  function elegirHora(h) {
    setHoraSel(h.hora);
    eventos.elegirHorario({ local, cancha, fecha, hora: h.hora, precio: h.precio });
  }

  function continuar() {
    if (!elegido) return;
    iniciarBorrador({
      localSlug: local.slug,
      localNombre: local.nombre,
      direccion: local.direccion,
      canchaId: cancha.id,
      canchaNombre: `${cancha.nombre} · ${cancha.tipoNombre}`,
      fecha,
      hora: elegido.hora,
      horaEtiqueta: elegido.etiqueta,
      precio: elegido.precio,
    });
    eventos.iniciarCheckout({ local, cancha, total: elegido.precio + 5 });

    // El borrador queda guardado en el contexto, así que tras iniciar sesión
    // el usuario vuelve al pago sin perder el horario que eligió.
    if (!autenticado) {
      navegar('/login?redirect=%2Freserva%2Fpago');
      return;
    }
    navegar('/reserva/pago');
  }

  // Mismo bloque de resumen y acción para la barra móvil y la columna lateral.
  const accion = (
    <>
      <div className="fila-entre" style={{ marginBottom: 12, alignItems: 'baseline' }}>
        <span className="texto-gris texto-sm">
          {elegido ? `${fechaLegible(fecha)} · ${elegido.etiqueta} · 1 h` : 'Elige un horario libre'}
        </span>
        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--titulo)' }}>
          {elegido ? `S/ ${elegido.precio}` : '—'}
        </span>
      </div>
      <button type="button" className="btn btn--primario" disabled={!elegido} onClick={continuar}>
        Continuar al pago
      </button>
      {!autenticado && (
        <p className="texto-gris texto-xs" style={{ marginTop: 8, textAlign: 'center' }}>
          Te pediremos iniciar sesión para confirmar la reserva.
        </p>
      )}
    </>
  );

  return (
    <Movil>
      <TopBar
        volverA={`/local/${local.slug}`}
        titulo="Elige tu horario"
        subtitulo={`${local.nombre} · ${cancha.nombre}`}
      />

      <div className="movil__cuerpo" style={{ paddingTop: 16 }}>
        <div className="dos-columnas">
          <div>
            {local.canchas.length > 1 && (
              <>
                <h2 className="seccion-titulo">Cancha</h2>
                <div className="chips" style={{ marginTop: 10 }} role="group" aria-label="Elegir cancha">
                  {local.canchas.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="chip"
                      aria-pressed={c.id === cancha.id}
                      onClick={() => {
                        setCanchaId(c.id);
                        setHoraSel(null);
                      }}
                    >
                      {c.nombre} · {c.tipoNombre}
                    </button>
                  ))}
                </div>
              </>
            )}

            <h2 className="seccion-titulo" style={{ marginTop: local.canchas.length > 1 ? 22 : 0 }}>
              Día
            </h2>
            <div className="dias" style={{ marginTop: 10 }} role="group" aria-label="Elegir día">
              {dias.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  className="dia"
                  aria-pressed={d.iso === fecha}
                  onClick={() => {
                    setFecha(d.iso);
                    setHoraSel(null);
                  }}
                >
                  <span className="dia__dow">{d.dow}</span>
                  <span className="dia__num">{d.num}</span>
                </button>
              ))}
            </div>

            <h2 className="seccion-titulo" style={{ marginTop: 22 }}>
              Horarios
            </h2>
            <div className="horas" style={{ marginTop: 10 }}>
              {horarios.map((h) => (
                <button
                  key={h.hora}
                  type="button"
                  className="hora"
                  disabled={!h.libre}
                  aria-pressed={h.hora === horaSel}
                  aria-label={`${h.etiqueta}, ${h.libre ? `S/ ${h.precio}` : 'ocupado'}`}
                  onClick={() => elegirHora(h)}
                >
                  <span>{h.etiqueta}</span>
                  <span className="hora__precio">{h.libre ? `S/ ${h.precio}` : 'Ocupado'}</span>
                </button>
              ))}
            </div>

            <div className="leyenda mt-16">
              <span>
                <i style={{ background: 'var(--verde)' }} />
                Elegido
              </span>
              <span>
                <i style={{ background: 'var(--blanco)', border: '1px solid var(--linea-fuerte)' }} />
                Libre
              </span>
              <span>
                <i style={{ background: 'var(--ocupado)' }} />
                Ocupado
              </span>
            </div>

            <div className="aviso mt-20" style={{ maxWidth: 560 }}>
              <IconoAviso />
              <p>Las horas de 2 a 6 p.m. tienen 25% de descuento de lunes a jueves.</p>
            </div>
          </div>

          <CajaLateral>{accion}</CajaLateral>
        </div>
      </div>

      <BarraInferior className="solo-movil">{accion}</BarraInferior>
    </Movil>
  );
}
