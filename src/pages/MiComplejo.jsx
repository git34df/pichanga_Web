import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DISTRITOS, TIPOS, nombreDistrito } from '../data/canchas';
import {
  actualizarCancha,
  actualizarComplejo,
  borrarCancha,
  crearCancha,
  crearComplejo,
  miComplejo,
  slugDesdeNombre,
} from '../data/catalogo';
import { useAuth } from '../context/AuthContext';
import { useCatalogo } from '../context/CatalogoContext';
import { CabeceraPanel } from '../components/CabeceraPanel';

const SERVICIOS = [
  'Césped sintético',
  'Techado',
  'Iluminación',
  'Estacionamiento',
  'Duchas',
  'Vestuarios',
  'Cafetín',
];

const VACIO = { nombre: '', distritoSlug: DISTRITOS[0].slug, direccion: '', descripcion: '', servicios: [] };

export default function MiComplejo() {
  const { usuario } = useAuth();
  const { recargar } = useCatalogo();

  const [complejo, setComplejo] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let vigente = true;
    miComplejo(usuario).then(({ datos }) => {
      if (!vigente) return;
      setComplejo(datos);
      if (datos) {
        setForm({
          nombre: datos.nombre,
          distritoSlug: datos.distritoSlug,
          direccion: datos.direccion,
          descripcion: datos.descripcion,
          servicios: datos.servicios,
        });
      }
      setCargando(false);
    });
    return () => {
      vigente = false;
    };
  }, [usuario]);

  function cambiar(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  function alternarServicio(s) {
    setForm((f) => ({
      ...f,
      servicios: f.servicios.includes(s)
        ? f.servicios.filter((x) => x !== s)
        : [...f.servicios, s],
    }));
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);

    if (complejo) {
      const { error } = await actualizarComplejo(complejo.slug, { ...form, estado: complejo.estado });
      setAviso(error ? { tipo: 'error', texto: error } : { tipo: 'ok', texto: 'Datos actualizados.' });
    } else {
      const { datos, error } = await crearComplejo(form, usuario?.id);
      if (error) setAviso({ tipo: 'error', texto: error });
      else {
        setComplejo(datos);
        setAviso({ tipo: 'ok', texto: 'Complejo creado. Ahora agrega tus canchas.' });
      }
    }

    await recargar();
    setGuardando(false);
  }

  if (cargando) {
    return (
      <div className="panel">
        <CabeceraPanel nombre={usuario?.nombre} />
        <main className="panel__main">
          <p className="texto-gris texto-sm">Cargando tu complejo…</p>
        </main>
      </div>
    );
  }

  const completo = form.nombre.trim().length > 2 && form.direccion.trim().length > 5;

  return (
    <div className="panel">
      <CabeceraPanel nombre={complejo?.nombre ?? usuario?.nombre} />

      <main className="panel__main">
        <h1 style={{ fontSize: 25, fontWeight: 700 }}>
          {complejo ? 'Datos de tu complejo' : 'Registra tu complejo'}
        </h1>
        <p className="texto-gris texto-sm" style={{ marginTop: 6, maxWidth: 620, lineHeight: 1.5 }}>
          {complejo
            ? 'Esta es la información que ven los jugadores en tu ficha pública.'
            : 'Antes de recibir reservas necesitamos los datos de tu complejo. Luego agregarás tus canchas con sus precios.'}
        </p>

        {aviso && (
          <p
            role="status"
            className="texto-sm"
            style={{
              marginTop: 16,
              maxWidth: 620,
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

        <form className="tarjeta mt-20" style={{ maxWidth: 620, padding: 20 }} onSubmit={guardar}>
          <div className="apilar gap-12">
            <div className="campo">
              <label className="campo__label" htmlFor="nombre">
                Nombre del complejo
              </label>
              <input
                id="nombre"
                className="campo__input"
                value={form.nombre}
                onChange={cambiar('nombre')}
                required
              />
              {!complejo && form.nombre && (
                <span className="texto-gris texto-xs">
                  Tu dirección pública será /local/{slugDesdeNombre(form.nombre)}
                </span>
              )}
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="distrito">
                Distrito
              </label>
              <select
                id="distrito"
                className="campo__select"
                value={form.distritoSlug}
                onChange={cambiar('distritoSlug')}
              >
                {DISTRITOS.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="direccion">
                Dirección
              </label>
              <input
                id="direccion"
                className="campo__input"
                value={form.direccion}
                onChange={cambiar('direccion')}
                required
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                className="campo__input"
                style={{ height: 80, padding: '10px 12px', resize: 'vertical' }}
                value={form.descripcion}
                onChange={cambiar('descripcion')}
              />
            </div>

            <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
              <legend className="campo__label" style={{ marginBottom: 8 }}>
                Servicios
              </legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SERVICIOS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="chip"
                    aria-pressed={form.servicios.includes(s)}
                    onClick={() => alternarServicio(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <button
            type="submit"
            className="btn btn--primario"
            style={{ width: 'auto', marginTop: 20 }}
            disabled={!completo || guardando}
          >
            {guardando ? 'Guardando…' : complejo ? 'Guardar cambios' : 'Registrar complejo'}
          </button>
        </form>

        {complejo && <Canchas complejo={complejo} onCambio={recargar} />}

        {complejo && (
          <p className="texto-gris texto-sm mt-20">
            Tu ficha pública:{' '}
            <Link to={`/local/${complejo.slug}`}>
              /local/{complejo.slug}
            </Link>{' '}
            · {nombreDistrito(complejo.distritoSlug)}
          </p>
        )}
      </main>
    </div>
  );
}

const CANCHA_VACIA = { codigo: '', nombre: '', tipo: 'futbol-7', precio: '' };

function Canchas({ complejo, onCambio }) {
  const [canchas, setCanchas] = useState(complejo.canchas);
  const [nueva, setNueva] = useState(CANCHA_VACIA);
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  async function refrescar() {
    const { datos } = await miComplejo({ id: complejo.propietarioId, localSlug: complejo.slug });
    setCanchas(datos?.canchas ?? []);
    await onCambio();
  }

  async function agregar(e) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    const { error: err } = await crearCancha(complejo.slug, nueva);
    if (err) setError(err);
    else {
      setNueva(CANCHA_VACIA);
      await refrescar();
    }
    setOcupado(false);
  }

  async function cambiarPrecio(cancha, precio) {
    await actualizarCancha(cancha.uuid, { ...cancha, precio });
    await refrescar();
  }

  async function alternarActiva(cancha) {
    await actualizarCancha(cancha.uuid, { ...cancha, activa: !cancha.activa });
    await refrescar();
  }

  async function quitar(cancha) {
    await borrarCancha(cancha.uuid);
    await refrescar();
  }

  return (
    <section className="tarjeta mt-20" style={{ maxWidth: 820, padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Tus canchas</h2>
      <p className="texto-gris texto-sm" style={{ marginTop: 6, lineHeight: 1.5 }}>
        El precio es por hora en horario pico. Las horas valle aplican el 25% de descuento
        automáticamente, de lunes a jueves entre 2 y 6 p.m.
      </p>

      {canchas.length === 0 ? (
        <p className="texto-gris texto-sm mt-16">
          Todavía no tienes canchas. Mientras no agregues al menos una, tu complejo no aparece en
          las búsquedas.
        </p>
      ) : (
        <div className="tabla-scroll mt-16">
          <table className="calendario" style={{ minWidth: 620 }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left' }}>Código</th>
                <th scope="col" style={{ textAlign: 'left' }}>Nombre</th>
                <th scope="col" style={{ textAlign: 'left' }}>Tipo</th>
                <th scope="col" style={{ textAlign: 'left' }}>Precio (S/)</th>
                <th scope="col" style={{ textAlign: 'left' }}>Estado</th>
                <th scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {canchas.map((c) => (
                <tr key={c.uuid ?? c.id}>
                  <th scope="row" style={{ textAlign: 'left' }}>{c.id}</th>
                  <td>{c.nombre}</td>
                  <td>{c.tipoNombre}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      className="campo__input"
                      style={{ height: 36, width: 100, fontSize: 13 }}
                      defaultValue={c.precio}
                      aria-label={`Precio de ${c.nombre}`}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v > 0 && v !== c.precio) cambiarPrecio(c, v);
                      }}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="chip"
                      aria-pressed={c.activa}
                      onClick={() => alternarActiva(c)}
                    >
                      {c.activa ? 'Visible' : 'Oculta'}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--neutro"
                      style={{ width: 'auto', minHeight: 34, fontSize: 12.5 }}
                      onClick={() => quitar(c)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        className="mt-20"
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}
        onSubmit={agregar}
      >
        <div className="campo" style={{ width: 110 }}>
          <label className="campo__label" htmlFor="codigo">Código</label>
          <input
            id="codigo"
            className="campo__input"
            placeholder="c3"
            value={nueva.codigo}
            onChange={(e) => setNueva((n) => ({ ...n, codigo: e.target.value }))}
            required
          />
        </div>
        <div className="campo" style={{ width: 190 }}>
          <label className="campo__label" htmlFor="cnombre">Nombre</label>
          <input
            id="cnombre"
            className="campo__input"
            placeholder="Cancha 3"
            value={nueva.nombre}
            onChange={(e) => setNueva((n) => ({ ...n, nombre: e.target.value }))}
            required
          />
        </div>
        <div className="campo" style={{ width: 150 }}>
          <label className="campo__label" htmlFor="ctipo">Tipo</label>
          <select
            id="ctipo"
            className="campo__select"
            value={nueva.tipo}
            onChange={(e) => setNueva((n) => ({ ...n, tipo: e.target.value }))}
          >
            {TIPOS.filter((t) => t.id !== 'todos').map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
        <div className="campo" style={{ width: 120 }}>
          <label className="campo__label" htmlFor="cprecio">Precio (S/)</label>
          <input
            id="cprecio"
            type="number"
            min="1"
            className="campo__input"
            placeholder="140"
            value={nueva.precio}
            onChange={(e) => setNueva((n) => ({ ...n, precio: e.target.value }))}
            required
          />
        </div>
        <button type="submit" className="btn btn--primario" style={{ width: 'auto' }} disabled={ocupado}>
          {ocupado ? 'Agregando…' : 'Agregar cancha'}
        </button>
      </form>

      {error && (
        <p role="alert" className="texto-sm" style={{ marginTop: 12, color: '#A32015' }}>
          {error}
        </p>
      )}
    </section>
  );
}
