import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CabeceraPanel } from '../components/CabeceraPanel';
import { aISO, etiquetaHora, fechaLegible, hoyISO } from '../data/canchas';
import { miComplejo } from '../data/catalogo';
import { listarReservasDeLocal } from '../data/reservas';
import { useAuth } from '../context/AuthContext';
import { useReserva } from '../context/ReservaContext';
import { modoDemo } from '../lib/supabase';

const COMISION_PCT = 0.08;

const RANGOS = [
  { id: 7, nombre: 'Últimos 7 días' },
  { id: 30, nombre: 'Últimos 30 días' },
  { id: 90, nombre: 'Últimos 90 días' },
];

function desdeHace(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return aISO(d);
}

const soles = (n) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Ingresos() {
  const { usuario } = useAuth();
  const { reservas: reservasDemo } = useReserva();

  const [local, setLocal] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [rango, setRango] = useState(30);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    miComplejo(usuario).then(({ datos }) => {
      if (vigente) setLocal(datos);
    });
    return () => {
      vigente = false;
    };
  }, [usuario]);

  useEffect(() => {
    if (!local) return undefined;
    const desde = desdeHace(rango);

    if (modoDemo) {
      setReservas(reservasDemo.filter((r) => r.localSlug === local.slug && r.fecha >= desde));
      setCargando(false);
      return undefined;
    }

    let vigente = true;
    setCargando(true);
    listarReservasDeLocal(local.slug, desde).then(({ datos }) => {
      if (!vigente) return;
      setReservas(datos);
      setCargando(false);
    });
    return () => {
      vigente = false;
    };
  }, [local, rango, reservasDemo]);

  const resumen = useMemo(() => {
    const bruto = reservas.reduce((s, r) => s + r.precio, 0);
    const comision = bruto * COMISION_PCT;

    // Reparto por cancha, de mayor a menor ingreso.
    const porCancha = new Map();
    reservas.forEach((r) => {
      const actual = porCancha.get(r.canchaNombre) ?? { reservas: 0, bruto: 0 };
      porCancha.set(r.canchaNombre, {
        reservas: actual.reservas + 1,
        bruto: actual.bruto + r.precio,
      });
    });

    const porMetodo = new Map();
    reservas.forEach((r) => {
      porMetodo.set(r.metodoPago ?? '—', (porMetodo.get(r.metodoPago ?? '—') ?? 0) + 1);
    });

    return {
      bruto,
      comision,
      neto: bruto - comision,
      cantidad: reservas.length,
      ticket: reservas.length ? bruto / reservas.length : 0,
      porCancha: [...porCancha.entries()].sort((a, b) => b[1].bruto - a[1].bruto),
      porMetodo: [...porMetodo.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [reservas]);

  if (!local) {
    return (
      <div className="panel">
        <CabeceraPanel nombre={usuario?.nombre} />
        <main className="panel__main">
          <div className="tarjeta" style={{ maxWidth: 560, padding: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Aún no registras tu complejo</h1>
            <p className="texto-gris texto-sm" style={{ marginTop: 10, lineHeight: 1.55 }}>
              Cuando lo registres y empieces a recibir reservas, aquí verás tus ingresos.
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
            <h1 style={{ fontSize: 25, fontWeight: 700 }}>Ingresos</h1>
            <p className="texto-gris texto-sm" style={{ marginTop: 6 }}>
              Desde {fechaLegible(desdeHace(rango))} hasta hoy
            </p>
          </div>
          <div className="chips" role="group" aria-label="Rango de fechas">
            {RANGOS.map((r) => (
              <button
                key={r.id}
                type="button"
                className="chip"
                aria-pressed={rango === r.id}
                onClick={() => setRango(r.id)}
              >
                {r.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="kpis mt-20">
          <Kpi label="Ingreso bruto" valor={soles(resumen.bruto)} nota={`${resumen.cantidad} reservas`} />
          <Kpi label="Comisión Pichanga" valor={soles(resumen.comision)} nota="8% por reserva pagada" />
          <Kpi label="Ingreso neto" valor={soles(resumen.neto)} nota="Lo que recibes tú" />
          <Kpi label="Ticket promedio" valor={soles(resumen.ticket)} nota="Por reserva" />
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 20, alignItems: 'flex-start' }}>
          <section className="tarjeta" style={{ flex: '1 1 380px', padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Por cancha</h2>
            {resumen.porCancha.length === 0 ? (
              <p className="texto-gris texto-sm mt-12">Sin reservas en este rango.</p>
            ) : (
              <table className="calendario mt-16" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: 'left' }}>Cancha</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Reservas</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Bruto</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.porCancha.map(([nombre, d]) => (
                    <tr key={nombre}>
                      <th scope="row" style={{ textAlign: 'left' }}>{nombre}</th>
                      <td>{d.reservas}</td>
                      <td>{soles(d.bruto)}</td>
                      <td>{resumen.bruto ? Math.round((d.bruto / resumen.bruto) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="tarjeta" style={{ flex: '1 1 260px', padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Por método de pago</h2>
            {resumen.porMetodo.length === 0 ? (
              <p className="texto-gris texto-sm mt-12">Sin datos.</p>
            ) : (
              <div className="apilar gap-10 mt-16">
                {resumen.porMetodo.map(([metodo, n]) => (
                  <div key={metodo} className="fila-entre">
                    <span className="texto-sm" style={{ textTransform: 'capitalize' }}>{metodo}</span>
                    <span className="texto-sm" style={{ fontWeight: 600 }}>
                      {n} ({Math.round((n / resumen.cantidad) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="tarjeta mt-20" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Detalle de reservas</h2>
          {cargando ? (
            <p className="texto-gris texto-sm mt-12">Cargando…</p>
          ) : reservas.length === 0 ? (
            <p className="texto-gris texto-sm mt-12">
              No hay reservas en este rango. Prueba ampliándolo o comparte tu ficha pública.
            </p>
          ) : (
            <div className="tabla-scroll">
              <table className="calendario" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: 'left' }}>Código</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Fecha</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Hora</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Cancha</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Pago</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Bruto</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr key={r.codigo}>
                      <th scope="row" style={{ textAlign: 'left' }}>{r.codigo}</th>
                      <td>{fechaLegible(r.fecha)}</td>
                      <td>{etiquetaHora(r.hora)}</td>
                      <td>{r.canchaNombre}</td>
                      <td style={{ textTransform: 'capitalize' }}>{r.metodoPago}</td>
                      <td>{soles(r.precio)}</td>
                      <td>{soles(r.precio * COMISION_PCT)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="texto-gris texto-xs mt-16" style={{ lineHeight: 1.5 }}>
          Los montos corresponden a reservas pagadas en línea desde {hoyISO() === desdeHace(rango) ? 'hoy' : fechaLegible(desdeHace(rango))}.
          La comisión del 8% se descuenta en la liquidación semanal.
        </p>
      </main>
    </div>
  );
}

function Kpi({ label, valor, nota }) {
  return (
    <div className="kpi">
      <div className="kpi__label">{label}</div>
      <div className="kpi__valor" style={{ fontSize: 26 }}>{valor}</div>
      <div className="kpi__nota">{nota}</div>
    </div>
  );
}
