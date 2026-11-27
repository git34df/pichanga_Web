// Horarios que el local cierra por mantenimiento, torneos o uso propio.
//
// Igual que el resto de la capa de datos, estas funciones devuelven
// { datos, error } y funcionan tanto contra Supabase como en modo demo,
// donde los bloqueos se guardan en localStorage.

import { modoDemo, supabase } from '../lib/supabase';

const CLAVE = 'pichanga:bloqueos';

export function claveRanura(fecha, hora) {
  return `${fecha}|${hora}`;
}

// --- modo demo ---

function leerDemo() {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : [];
  } catch {
    return [];
  }
}

function guardarDemo(lista) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Almacenamiento bloqueado: el bloqueo vive solo en memoria.
  }
}

function mismo(b, { localSlug, canchaId, fecha, hora }) {
  return (
    b.localSlug === localSlug && b.canchaId === canchaId && b.fecha === fecha && b.hora === hora
  );
}

// --- API ---

export async function listarBloqueos(localSlug, desdeISO) {
  if (modoDemo) {
    const datos = leerDemo().filter(
      (b) => b.localSlug === localSlug && (!desdeISO || b.fecha >= desdeISO),
    );
    return { datos, error: null };
  }

  let consulta = supabase.from('bloqueos').select('*').eq('local_slug', localSlug);
  if (desdeISO) consulta = consulta.gte('fecha', desdeISO);

  const { data, error } = await consulta;
  if (error) return { datos: [], error: error.message };

  return {
    datos: data.map((f) => ({
      id: f.id,
      localSlug: f.local_slug,
      canchaId: f.cancha_id,
      fecha: f.fecha,
      hora: f.hora,
      motivo: f.motivo,
    })),
    error: null,
  };
}

export async function bloquear({ localSlug, canchaId, fecha, hora, motivo }, usuarioId) {
  if (modoDemo) {
    const lista = leerDemo();
    if (lista.some((b) => mismo(b, { localSlug, canchaId, fecha, hora }))) {
      return { datos: null, error: 'Esa hora ya está bloqueada.' };
    }
    const nuevo = { id: `demo-${Date.now()}`, localSlug, canchaId, fecha, hora, motivo };
    guardarDemo([...lista, nuevo]);
    return { datos: nuevo, error: null };
  }

  const { data, error } = await supabase
    .from('bloqueos')
    .insert({
      local_slug: localSlug,
      cancha_id: canchaId,
      fecha,
      hora,
      motivo: motivo || null,
      creado_por: usuarioId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { datos: null, error: 'Esa hora ya está bloqueada.' };
    // El trigger de la base impide bloquear sobre una reserva pagada.
    if (error.message.includes('reserva pagada')) {
      return { datos: null, error: 'Esa hora ya tiene una reserva pagada.' };
    }
    return { datos: null, error: error.message };
  }

  return {
    datos: {
      id: data.id,
      localSlug: data.local_slug,
      canchaId: data.cancha_id,
      fecha: data.fecha,
      hora: data.hora,
      motivo: data.motivo,
    },
    error: null,
  };
}

export async function desbloquear({ localSlug, canchaId, fecha, hora }) {
  if (modoDemo) {
    guardarDemo(leerDemo().filter((b) => !mismo(b, { localSlug, canchaId, fecha, hora })));
    return { error: null };
  }

  const { error } = await supabase
    .from('bloqueos')
    .delete()
    .eq('local_slug', localSlug)
    .eq('cancha_id', canchaId)
    .eq('fecha', fecha)
    .eq('hora', hora);

  return { error: error ? error.message : null };
}

// Horas bloqueadas tal como las ve un jugador. Contra Supabase esto ya va
// incluido en la función horarios_ocupados(); solo hace falta en modo demo,
// donde no hay base que las una.
export function horasBloqueadasDemo(localSlug, canchaId, fecha) {
  return leerDemo()
    .filter((b) => b.localSlug === localSlug && b.canchaId === canchaId && b.fecha === fecha)
    .map((b) => b.hora);
}
