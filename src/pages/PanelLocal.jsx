import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { etiquetaHora, fechaLegible, HORAS, proximosDias } from '../data/canchas';
import { miComplejo } from '../data/catalogo';
import { CabeceraPanel } from '../components/CabeceraPanel';
import { listarReservasDeLocal } from '../data/reservas';
import { bloquear, claveRanura, desbloquear, listarBloqueos } from '../data/bloqueos';
import { useAuth } from '../context/AuthContext';
import { useReserva } from '../context/ReservaContext';
import { modoDemo } from '../lib/supabase';

const COMISION_PCT = 0.08;

export default function PanelLocal() {
  const { usuario } = useAuth();
  const { reservas: reservasDemo } = useReserva();

  const dias = useMemo(() => proximosDias(7), []);
  // El complejo ya no se asigna desde el perfil: es el que esta cuenta creó.
  const [local, setLocal] = useState(null);
  const [cargandoLocal, setCargandoLocal] = useState(true);
  const localSlug = local?.slug ?? null;
  const [canchaId, setCanchaId] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [cargando, setCargando] = useState(!modoDemo);
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(null);

  // Sin selección explícita se muestra la primera cancha: se deriva en el
  // render en vez de fijarla con un efecto, que provocaría un render extra.
  const cancha = local?.canchas.find((c) => c.id === canchaId) ?? local?.canchas[0];

  useEffect(() => {
    let vigente = true;
    miComplejo(usuario).then(({ datos }) => {
      if (!vigente) return;
      setLocal(datos);
      setCargandoLocal(false);
    });
    return () => {
      vigente = false;
    };
  }, [usuario]);

  const recargarBloqueos = useCallback(async () => {
    if (!localSlug) return;
    const { datos } = await listarBloqueos(localSlug, dias[0].iso);
    setBloqueos(datos);
  }, [localSlug, dias]);

  useEffect(() => {
    if (!localSlug) return undefined;

    // En modo demo las reservas del propio navegador hacen de datos del local.
    if (modoDemo) {
      setReservas(reservasDemo.filter((r) => r.localSlug === localSlug));
      setCargando(false);
      recargarBloqueos();
      return undefined;
    }

    let vigente = true;
    setCargando(true);
    Promise.all([listarReservasDeLocal(localSlug, dias[0].iso), listarBloqueos(localSlug, dias[0].iso)]).then(
      ([res, blo]) => {
        if (!vigente) return;
        setReservas(res.datos);
        setBloqueos(blo.datos);
        setCargando(false);
      },
    );
    return () => {
      vigente = false;
    };
  }, [localSlug, dias, reservasDemo, recargarBloqueos]);

  // Índices por "fecha|hora" para pintar el calendario sin recorrer
  // los arreglos en cada celda.
  const porRanura = useMemo(
    () =>
      new Map(
        reservas
          .filter((r) => !cancha || r.canchaId === cancha.id)
          .map((r) => [claveRanura(r.fecha, r.hora), r]),
      ),
    [reservas, cancha],
  );

  const bloqueadas = useMemo(
    () =>
      new Set(
        bloqueos
          .filter((b) => !cancha || b.canchaId === cancha.id)
          .map((b) => claveRanura(b.fecha, b.hora)),
      ),
    [bloqueos, cancha],
  );

  const metricas = useMemo(() => {
    const delaCancha = reservas.filter((r) => !cancha || r.canchaId === cancha.id);
    const totales = dias.length * HORAS.length;
    const ingresos = delaCancha.reduce((suma, r) => suma + r.precio, 0);
    return {
      ocupadas: delaCancha.length,
      totales,
      disponibles: totales - delaCancha.length - bloqueadas.size,
      ocupacion: totales ? Math.round((delaCancha.length / totales) * 100) : 0,
      ingresos,
      comision: Math.round(ingresos * COMISION_PCT),
      bloqueadas: bloqueadas.size,
      valleLibres: dias.reduce((suma, d) => {
        const diaSemana = new Date(`${d.iso}T12:00:00`).getDay();
        if (diaSemana < 1 || diaSemana > 4) return suma;
        const libres = [14, 15, 16, 17].filter(
          (h) => !porRanura.has(claveRanura(d.iso, h)) && !bloqueadas.has(claveRanura(d.iso, h)),
        ).length;
        return suma + libres;
      }, 0),
    };
  }, [reservas, cancha, dias, porRanura, bloqueadas]);

  async function alternarBloqueo(fecha, hora) {
    if (!cancha || guardando) return;
    const clave = claveRanura(fecha, hora);
    setGuardando(clave);
    setAviso(null);

    const datos = { localSlug, canchaId: cancha.id, fecha, hora };

    if (bloqueadas.has(clave)) {
      const { error } = await desbloquear(datos);
      if (error) setAviso({ tipo: 'error', texto: error });
      else setAviso({ tipo: 'ok', texto: `Liberaste ${fechaLegible(fecha)} a las ${etiquetaHora(hora)}.` });
    } else {
      const { error } = await bloquear({ ...datos, motivo: null }, usuario?.id);
      if (error) setAviso({ tipo: 'error', texto: error });
      else setAviso({ tipo: 'ok', texto: `Bloqueaste ${fechaLegible(fecha)} a las ${etiquetaHora(hora)}.` });
    }

    await recargarBloqueos();
    setGuardando(null);
  }

  if (cargandoLocal) {
    return (
      <div className="panel">
        <CabeceraPanel nombre={usuario?.nombre} />
        <main className="panel__main">
          <p className="texto-gris texto-sm">Cargando tu complejo…</p>
        </main>
      </div>
    );
  }

  // Cuenta de local que todavía no ha registrado su complejo.
  if (!local) {
    return (
      <div className="panel">
        <CabeceraPanel nombre={usuario?.nombre} />
        <main className="panel__main">
          <div className="tarjeta" style={{ maxWidth: 560, padding: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Aún no registras tu complejo</h1>
            <p className="texto-gris texto-sm" style={{ marginTop: 10, lineHeight: 1.55 }}>
              Para recibir reservas necesitas registrar tu complejo y cargar tus canchas con sus
              precios. Toma un par de minutos y lo puedes editar cuando quieras.
            </p>
            <Link to="/panel/complejo" className="btn btn--primario" style={{ marginTop: 18, width: 'auto' }}>
              Registrar mi complejo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="panel">
      <CabeceraPanel nombre={local.nombre} />

      <main className="panel__main">
        <div className="fila-entre" style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 25, fontWeight: 700 }}>Próximos 7 días</h1>
            <p className="texto-gris texto-sm" style={{ marginTop: 6 }}>
              {local.canchas.length} canchas · {metricas.totales} horas publicadas
            </p>
          </div>
        </div>

        <div className="kpis mt-20">
          <Kpi
            label="Ocupación"
            valor={`${metricas.ocupacion}%`}
            nota={`${metricas.ocupadas} de ${metricas.totales} horas`}
          />
          <Kpi label="Disponibles" valor={metricas.disponibles} nota={`${metricas.bloqueadas} bloqueadas`} />
          <Kpi
            label="Ingresos"
            valor={`S/ ${metricas.ingresos.toLocaleString('es-PE')}`}
            nota={`Comisión: S/ ${metricas.comision}`}
          />
          <Kpi label="Horas valle libres" valor={metricas.valleLibres} nota="Lun a jue, 2 a 6 p.m." alerta />
        </div>

        <section className="tarjeta mt-20" style={{ borderRadius: 'var(--r-xl)', padding: 20 }}>
          <div className="fila-entre" style={{ flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Calendario de ocupación</h2>
              <p className="texto-gris texto-sm" style={{ marginTop: 4 }}>
                Haz clic en una hora libre para bloquearla, y en una bloqueada para liberarla.
              </p>
            </div>
            <div className="leyenda">
              <span>
                <i style={{ background: 'var(--verde)' }} />
                Reservado
              </span>
              <span>
                <i style={{ background: 'var(--blanco)', border: '1px solid var(--linea-fuerte)' }} />
                Libre
              </span>
              <span>
                <i style={{ background: 'var(--ocupado)' }} />
                Bloqueado
              </span>
            </div>
          </div>

          <div className="chips" style={{ marginTop: 14 }} role="group" aria-label="Elegir cancha">
            {local.canchas.map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip"
                aria-pressed={c.id === cancha?.id}
                onClick={() => setCanchaId(c.id)}
              >
                {c.nombre} · {c.tipoNombre}
              </button>
            ))}
          </div>

          {aviso && (
            <p
              role="status"
              className="texto-sm"
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 10,
                lineHeight: 1.45,
                color: aviso.tipo === 'error' ? '#A32015' : 'var(--verde-osc)',
                background: aviso.tipo === 'error' ? '#FDECEA' : 'var(--verde-claro)',
                border: `1px solid ${aviso.tipo === 'error' ? '#F5C2BC' : 'var(--verde)'}`,
              }}
            >
              {aviso.texto}
            </p>
          )}

          {cargando ? (
            <p className="texto-gris texto-sm mt-16">Cargando reservas…</p>
          ) : (
            <div className="tabla-scroll">
              <table className="calendario">
                <caption className="texto-gris texto-sm" style={{ textAlign: 'left', paddingBottom: 8 }}>
                  Ocupación por hora y día — {cancha?.nombre}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: 'left', width: 90 }}>
                      Hora
                    </th>
                    {dias.map((d) => (
                      <th key={d.iso} scope="col">
                        {d.dow} {d.num}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.map((hora) => (
                    <tr key={hora}>
                      <th scope="row">{etiquetaHora(hora)}</th>
                      {dias.map((d) => {
                        const clave = claveRanura(d.iso, hora);
                        const reserva = porRanura.get(clave);
                        const bloqueada = bloqueadas.has(clave);

                        // Una hora reservada no se puede tocar: ya hay alguien
                        // que pagó por ella.
                        if (reserva) {
                          return (
                            <td key={d.iso}>
                              <div className="celda celda--reservado" title={`Reserva ${reserva.codigo}`}>
                                {reserva.codigo}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={d.iso}>
                            <button
                              type="button"
                              className={`celda celda--boton celda--${bloqueada ? 'bloqueado' : 'libre'}`}
                              disabled={guardando === clave}
                              aria-pressed={bloqueada}
                              aria-label={`${etiquetaHora(hora)} del ${fechaLegible(d.iso)}: ${
                                bloqueada ? 'bloqueada, clic para liberar' : 'libre, clic para bloquear'
                              }`}
                              onClick={() => alternarBloqueo(d.iso, hora)}
                            >
                              {guardando === clave ? '…' : bloqueada ? 'Bloqueado' : 'Libre'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Kpi({ label, valor, nota, alerta }) {
  return (
    <div className={`kpi ${alerta ? 'kpi--alerta' : ''}`}>
      <div className="kpi__label">{label}</div>
      <div className="kpi__valor">{valor}</div>
      <div className="kpi__nota">{nota}</div>
    </div>
  );
}
