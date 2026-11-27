import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Movil, NavInferior, TopBar } from '../components/Layout';
import LocalCard from '../components/LocalCard';
import {
  TIPOS,
  etiquetaHora,
  fechaLegible,
  hoyISO,
  nombreDistrito,
} from '../data/canchas';
import { useCatalogo } from '../context/CatalogoContext';
import { eventos } from '../lib/analytics';

export default function Resultados() {
  const { distrito } = useParams();
  const [params] = useSearchParams();
  const fecha = params.get('fecha') ?? hoyISO();
  const hora = Number(params.get('hora') ?? 20);
  const [tipo, setTipo] = useState('todos');
  const { porDistrito, cargando } = useCatalogo();

  const locales = porDistrito(distrito, tipo);

  useEffect(() => {
    if (cargando) return;
    eventos.verResultados({ distrito, tipo, cantidad: locales.length });
  }, [distrito, tipo, locales.length, cargando]);

  return (
    <Movil>
      <TopBar
        volverA="/"
        titulo={nombreDistrito(distrito)}
        subtitulo={`${fechaLegible(fecha)} · ${etiquetaHora(hora)} · ${locales.length} locales`}
      />

      <div className="banda-filtros">
        <div className="chips" role="group" aria-label="Filtrar por tipo de cancha">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="chip"
              aria-pressed={tipo === t.id}
              onClick={() => setTipo(t.id)}
            >
              {t.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="movil__cuerpo" style={{ paddingTop: 16 }}>
        {cargando ? (
          <p className="texto-gris texto-sm">Cargando canchas…</p>
        ) : locales.length === 0 ? (
          <div className="tarjeta" style={{ textAlign: 'center', padding: '28px 18px' }}>
            <p style={{ fontSize: 15, fontWeight: 600 }}>No hay canchas con ese filtro</p>
            <p className="texto-gris texto-sm" style={{ marginTop: 6, lineHeight: 1.45 }}>
              Prueba con otro tipo de cancha o cambia de distrito desde el buscador.
            </p>
          </div>
        ) : (
          <div className="rejilla">
            {locales.map((local) => (
              <LocalCard key={local.slug} local={local} fecha={fecha} />
            ))}
          </div>
        )}
      </div>

      <NavInferior />
    </Movil>
  );
}
