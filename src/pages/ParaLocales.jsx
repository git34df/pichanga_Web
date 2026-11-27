import { Link } from 'react-router-dom';
import { Movil, TopBar } from '../components/Layout';
import { IconoCancha } from '../components/Iconos';
import { useAuth } from '../context/AuthContext';

const BENEFICIOS = [
  {
    titulo: 'Llena tus horas valle',
    texto: 'Promocionamos de lunes a jueves entre 2 y 6 p.m., la franja que hoy se queda vacía.',
  },
  {
    titulo: 'Cobra por adelantado',
    texto: 'Toda reserva se paga en línea, así que las cancelaciones de último minuto dejan de costarte.',
  },
  {
    titulo: 'Olvídate del cuaderno',
    texto: 'Un calendario por cancha, con bloqueos y tarifas por franja horaria.',
  },
  {
    titulo: 'Mide lo que pasa',
    texto: 'Ocupación, ingresos y comisiones de la semana en una sola pantalla.',
  },
];

export default function ParaLocales() {
  const { autenticado, rol } = useAuth();

  return (
    <Movil ancho="angosto">
      <TopBar volverA="/" titulo="Pichanga.pe para locales" />

      <div className="movil__cuerpo" style={{ paddingTop: 20, paddingBottom: 28 }}>
        <div
          style={{
            background: 'var(--verde)',
            color: '#FFF',
            borderRadius: 'var(--r-xl)',
            padding: '22px 20px',
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15 }}>
            Tus canchas llenas,
            <br />
            sin perseguir por WhatsApp.
          </h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.45, marginTop: 10, opacity: 0.9 }}>
            Publica tu disponibilidad y recibe reservas pagadas. Comisión del 8% por reserva, y los
            primeros tres meses sin comisión.
          </p>
        </div>

        <div className="apilar gap-10 mt-20">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} className="tarjeta" style={{ display: 'flex', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--verde-claro)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                <IconoCancha size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 14.5, fontWeight: 600 }}>{b.titulo}</h2>
                <p className="texto-gris texto-sm" style={{ marginTop: 4, lineHeight: 1.45 }}>
                  {b.texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="apilar gap-10 mt-24">
          {autenticado && rol === 'local' ? (
            <Link to="/panel" className="btn btn--primario">
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link to="/registro?rol=local" className="btn btn--primario">
                Registrar mi local
              </Link>
              <Link to="/login?rol=local&redirect=%2Fpanel" className="btn btn--contorno">
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </Movil>
  );
}