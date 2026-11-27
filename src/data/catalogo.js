// Acceso a las tablas `locales` y `canchas`.
//
// Hasta la versión anterior el catálogo estaba escrito a mano en canchas.js.
// Ahora vive en la base y cada complejo pertenece a la cuenta que lo creó.
// En modo demo se sigue usando el catálogo del archivo, para que el proyecto
// funcione sin Supabase configurado.

import { modoDemo, supabase } from '../lib/supabase';
import { LOCALES as SEMILLA, nombreTipo } from './canchas';

function aLocal(fila, canchas) {
  return {
    slug: fila.slug,
    nombre: fila.nombre,
    distritoSlug: fila.distrito_slug,
    direccion: fila.direccion,
    descripcion: fila.descripcion ?? '',
    servicios: fila.servicios ?? [],
    rating: Number(fila.rating ?? 0),
    resenas: fila.resenas ?? 0,
    distanciaKm: Number(fila.distancia_km ?? 0),
    estado: fila.estado,
    propietarioId: fila.propietario_id ?? null,
    opiniones: [],
    canchas: (canchas ?? [])
      .filter((c) => c.local_slug === fila.slug && c.activa !== false)
      .map(aCancha),
  };
}

function aCancha(fila) {
  return {
    id: fila.codigo,
    uuid: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    tipoNombre: nombreTipo(fila.tipo),
    precio: Number(fila.precio),
    activa: fila.activa !== false,
  };
}

// En modo demo el catálogo ya está en el código, así que se puede usar desde
// el primer render y la pantalla nunca muestra un estado de carga.
export function catalogoInicial() {
  return modoDemo ? SEMILLA : [];
}

// Carga el catálogo público completo. Son pocos registros, así que una sola
// consulta al arrancar evita una por pantalla.
export async function cargarCatalogo() {
  if (modoDemo) return { datos: SEMILLA, error: null };

  const [resLocales, resCanchas] = await Promise.all([
    supabase.from('locales').select('*').order('rating', { ascending: false }),
    supabase.from('canchas').select('*').order('codigo'),
  ]);

  if (resLocales.error) return { datos: [], error: resLocales.error.message };
  if (resCanchas.error) return { datos: [], error: resCanchas.error.message };

  return {
    datos: resLocales.data.map((l) => aLocal(l, resCanchas.data)),
    error: null,
  };
}

// El complejo del usuario que tiene la sesión abierta, publicado o no.
// Recibe el usuario y no solo su id porque en modo demo el vínculo se
// resuelve por el slug que trae la cuenta de prueba.
export async function miComplejo(usuario) {
  if (!usuario) return { datos: null, error: null };

  if (modoDemo) {
    const demo = SEMILLA.find((l) => l.slug === usuario.localSlug) ?? null;
    return { datos: demo ? { ...demo, propietarioId: usuario.id } : null, error: null };
  }

  const { data, error } = await supabase
    .from('locales')
    .select('*')
    .eq('propietario_id', usuario.id)
    .maybeSingle();

  if (error) return { datos: null, error: error.message };
  if (!data) return { datos: null, error: null };

  const { data: canchas } = await supabase
    .from('canchas')
    .select('*')
    .eq('local_slug', data.slug)
    .order('codigo');

  return { datos: aLocal(data, canchas ?? []), error: null };
}

// Convierte el nombre del complejo en un slug para la URL pública.
export function slugDesdeNombre(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export async function crearComplejo(datos, usuarioId) {
  if (modoDemo) return { datos: null, error: 'No disponible en modo demo.' };

  let slug = slugDesdeNombre(datos.nombre);
  if (!slug) return { datos: null, error: 'El nombre no es válido.' };

  // Si el slug ya existe se le añade un sufijo: dos complejos pueden
  // llamarse parecido y no deben chocar en la URL.
  const { data: tomados } = await supabase.from('locales').select('slug').like('slug', `${slug}%`);
  if (tomados?.some((t) => t.slug === slug)) slug = `${slug}-${tomados.length + 1}`;

  const { data, error } = await supabase
    .from('locales')
    .insert({
      slug,
      propietario_id: usuarioId,
      nombre: datos.nombre.trim(),
      distrito_slug: datos.distritoSlug,
      direccion: datos.direccion.trim(),
      descripcion: datos.descripcion?.trim() || null,
      servicios: datos.servicios ?? [],
      estado: 'publicado',
    })
    .select()
    .single();

  if (error) return { datos: null, error: error.message };
  return { datos: aLocal(data, []), error: null };
}

export async function actualizarComplejo(slug, datos) {
  if (modoDemo) return { error: 'No disponible en modo demo.' };

  const { error } = await supabase
    .from('locales')
    .update({
      nombre: datos.nombre.trim(),
      distrito_slug: datos.distritoSlug,
      direccion: datos.direccion.trim(),
      descripcion: datos.descripcion?.trim() || null,
      servicios: datos.servicios ?? [],
      estado: datos.estado,
    })
    .eq('slug', slug);

  return { error: error ? error.message : null };
}

export async function crearCancha(localSlug, datos) {
  if (modoDemo) return { datos: null, error: 'No disponible en modo demo.' };

  const { data, error } = await supabase
    .from('canchas')
    .insert({
      local_slug: localSlug,
      codigo: datos.codigo.trim().toLowerCase(),
      nombre: datos.nombre.trim(),
      tipo: datos.tipo,
      precio: Number(datos.precio),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { datos: null, error: 'Ya tienes una cancha con ese código.' };
    return { datos: null, error: error.message };
  }
  return { datos: aCancha(data), error: null };
}

export async function actualizarCancha(uuid, datos) {
  if (modoDemo) return { error: 'No disponible en modo demo.' };

  const { error } = await supabase
    .from('canchas')
    .update({
      nombre: datos.nombre.trim(),
      tipo: datos.tipo,
      precio: Number(datos.precio),
      activa: datos.activa,
    })
    .eq('id', uuid);

  return { error: error ? error.message : null };
}

export async function borrarCancha(uuid) {
  if (modoDemo) return { error: 'No disponible en modo demo.' };
  const { error } = await supabase.from('canchas').delete().eq('id', uuid);
  return { error: error ? error.message : null };
}
