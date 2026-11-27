import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Movil, TopBar } from '../components/Layout';
import { IconoCancha } from '../components/Iconos';
import { buscarLocal, fechaLegible } from '../data/canchas';
import { useReserva } from '../context/ReservaContext';
import { useAuth } from '../context/AuthContext';
import { eventos } from '../lib/analytics';

const METODOS = [
  { id: 'yape', nombre: 'Yape', nota: 'Sin comisión' },
  { id: 'plin', nombre: 'Plin', nota: 'Sin comisión' },
  { id: 'tarjeta', nombre: 'Tarjeta de débito o crédito', nota: 'Visa, Mastercard' },
];

export default function Checkout() {
  const navegar = useNavigate();
  const { borrador, confirmar } = useReserva();
  const { usuario } = useAuth();
  const [metodo, setMetodo] = useState('yape');
  // Los datos de contacto vienen de la cuenta, pero siguen siendo editables
  // por si el partido lo coordina otra persona del grupo.
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [celular, setCelular] = useState(usuario?.celular ?? '');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  // Sin borrador no hay nada que pagar: el usuario entró por URL directa.
  if (!borrador) return <Navigate to="/" replace />;

  const completo = nombre.trim().length > 2 && celular.trim().length >= 9;

  async function pagar(e) {
    e.preventDefault();
    if (!completo || procesando) return;
    setProcesando(true);
    setError(null);

    const { reserva, error: err } = await confirmar(metodo, {
      nombre: nombre.trim(),
      celular: celular.trim(),
    });

    if (err || !reserva) {
      setProcesando(false);
      setError(err ?? 'No pudimos registrar la reserva. Inténtalo de nuevo.');
      return;
    }

    const local = buscarLocal(reserva.localSlug);
    eventos.compra({
      codigo: reserva.codigo,
      local,
      cancha: { nombre: reserva.canchaNombre },
      total: reserva.total,
      metodoPago: metodo,
    });
    navegar(`/reserva/confirmada?codigo=${reserva.codigo}`, { replace: true });
  }

  return (
    <Movil>
      <TopBar volverA={`/local/${borrador.localSlug}/horarios`} titulo="Confirmar y pagar" />

      <form className="movil__cuerpo" style={{ paddingTop: 16 }} onSubmit={pagar}>
        {/* En móvil el resumen va arriba; en escritorio, fijo a la derecha. */}
        <div className="dos-columnas dos-columnas--lateral-primero">
          <div>
            <h2 className="seccion-titulo">Método de pago</h2>
            <fieldset
              className="apilar gap-8"
              style={{ border: 0, padding: 0, margin: '10px 0 0', minWidth: 0 }}
            >
              <legend className="sr-only">Método de pago</legend>
              {METODOS.map((m) => (
                <label key={m.id} className={`pago ${metodo === m.id ? 'pago--activo' : ''}`}>
                  <input
                    type="radio"
                    name="pago"
                    value={m.id}
                    checked={metodo === m.id}
                    onChange={() => setMetodo(m.id)}
                  />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{m.nombre}</span>
                  <span className="texto-gris texto-xs">{m.nota}</span>
                </label>
              ))}
            </fieldset>

            <h2 className="seccion-titulo" style={{ marginTop: 22 }}>
              Tus datos
            </h2>
            <div className="apilar gap-10" style={{ marginTop: 10 }}>
              <div className="campo">
                <label className="campo__label" htmlFor="nombre">
                  Nombre y apellido
                </label>
                <input
                  id="nombre"
                  className="campo__input"
                  type="text"
                  autoComplete="name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="campo">
                <label className="campo__label" htmlFor="celular">
                  Celular (para la confirmación por WhatsApp)
                </label>
                <input
                  id="celular"
                  className="campo__input"
                  type="tel"
                  autoComplete="tel"
                  placeholder="987 654 321"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  color: '#A32015',
                  background: '#FDECEA',
                  border: '1px solid #F5C2BC',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                {error}
              </p>
            )}

            <div style={{ marginTop: 20, maxWidth: 420 }}>
              <button type="submit" className="btn btn--primario" disabled={!completo || procesando}>
                {procesando ? 'Procesando…' : `Pagar S/ ${borrador.total.toFixed(2)}`}
              </button>
              <p
                className="texto-gris texto-xs"
                style={{ marginTop: 9, textAlign: 'center', lineHeight: 1.4 }}
              >
                Cancelación sin costo hasta 12 horas antes del partido.
              </p>
            </div>
          </div>

          <aside className="col-lateral">
            <div className="tarjeta">
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 10,
                    background: 'var(--verde-claro)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <IconoCancha size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>
                    {borrador.localNombre}
                  </div>
                  <div className="texto-gris texto-sm" style={{ marginTop: 4 }}>
                    {borrador.canchaNombre}
                  </div>
                  <div className="texto-gris texto-sm" style={{ marginTop: 2 }}>
                    {fechaLegible(borrador.fecha)} · {borrador.horaEtiqueta}
                  </div>
                </div>
              </div>

              <div
                className="apilar gap-6"
                style={{ borderTop: '1px solid #EEEFEA', marginTop: 12, paddingTop: 10 }}
              >
                <div className="resumen-fila">
                  <span className="texto-gris">Alquiler de cancha (1 h)</span>
                  <span>S/ {borrador.precio.toFixed(2)}</span>
                </div>
                <div className="resumen-fila">
                  <span className="texto-gris">Servicio Pichanga.pe</span>
                  <span>S/ {borrador.comision.toFixed(2)}</span>
                </div>
                <div className="resumen-fila resumen-fila--total" style={{ marginTop: 4 }}>
                  <span>Total</span>
                  <span>S/ {borrador.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </Movil>
  );
}