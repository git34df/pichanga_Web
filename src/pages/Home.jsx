import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Movil, NavInferior } from '../components/Layout';
import LocalCard from '../components/LocalCard';
import { DISTRITOS, HORAS, LOCALES, etiquetaHora, hoyISO } from '../data/canchas';
import { eventos } from '../lib/analytics';

export default function Home() {
  const navegar = useNavigate();
  const [distrito, setDistrito] = useState(DISTRITOS[0].slug);
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState(20);

  const destacados = LOCALES.filter((l) => l.rating >= 4.5).slice(0, 3);

  function buscar(e) {
    e.preventDefault();
    eventos.busqueda({ distrito, fecha, hora });
    navegar(`/canchas/${distrito}?fecha=${fecha}&hora=${hora}`);
  }

  return (
    <Movil>
      {/* En escritorio este encabezado lo reemplaza la barra superior. */}
      <header
        className="solo-movil"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 20px 10px',
        }}
      >
        <span style={{ fontFamily: 'var(--titulo)', fontWeight: 700, fontSize: 21 }}>
          Pichanga<span style={{ color: 'var(--verde)' }}>.pe</span>
        </span>
        <Link
          to="/para-locales"
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid var(--linea)',
            background: 'var(--blanco)',
            borderRadius: 999,
            padding: '9px 13px',
            color: 'var(--tinta)',
          }}
        >
          Soy un local
        </Link>
      </header>

      <div className="movil__cuerpo">
        <div className="home-hero">
          <div>
            <h1 className="home-hero__titulo">
              Tu cancha,
              <br />
              en dos minutos.
            </h1>
            <p className="home-hero__bajada">
              Mira qué está libre hoy en Lima y resérvalo pagando en línea.
            </p>
          </div>

          <form className="tarjeta apilar gap-12" style={{ marginTop: 18 }} onSubmit={buscar}>
            <div className="campo">
              <label className="campo__label" htmlFor="distrito">
                Distrito
              </label>
              <select
                id="distrito"
                className="campo__select"
                value={distrito}
                onChange={(e) => setDistrito(e.target.value)}
              >
                {DISTRITOS.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="campo" style={{ flex: 1 }}>
                <label className="campo__label" htmlFor="fecha">
                  Fecha
                </label>
                <input
                  id="fecha"
                  type="date"
                  className="campo__input"
                  value={fecha}
                  min={hoyISO()}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="campo" style={{ flex: 1 }}>
                <label className="campo__label" htmlFor="hora">
                  Hora
                </label>
                <select
                  id="hora"
                  className="campo__select"
                  value={hora}
                  onChange={(e) => setHora(Number(e.target.value))}
                >
                  {HORAS.map((h) => (
                    <option key={h} value={h}>
                      {etiquetaHora(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn--primario">
              Buscar canchas
            </button>
          </form>
        </div>

        <div className="fila-entre" style={{ marginTop: 28, alignItems: 'baseline' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Mejor calificadas</h2>
          <Link
            to={`/canchas/${distrito}?fecha=${fecha}&hora=${hora}`}
            style={{ fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
          >
            Ver todo
          </Link>
        </div>

        <div className="rejilla" style={{ marginTop: 14 }}>
          {destacados.map((local) => (
            <LocalCard key={local.slug} local={local} fecha={fecha} />
          ))}
        </div>
      </div>

      <NavInferior />
    </Movil>
  );
}