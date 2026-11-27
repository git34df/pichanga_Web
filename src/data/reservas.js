// Acceso a la tabla `reservas` de Supabase.
//
// Todas las funciones devuelven { datos, error } y nunca lanzan, para que las
// pantallas puedan mostrar un mensaje en vez de romperse. En modo demo no se
// llama a ninguna de estas funciones: ReservaContext usa localStorage.

import { supabase } from '../lib/supabase';

// La base usa snake_case; el resto de la aplicación, camelCase.
function aReserva(fila) {
  return {
    id: fila.id,
    codigo: fila.codigo,
    localSlug: fila.local_slug,
    localNombre: fila.local_nombre,
    direccion: fila.direccion,
    canchaId: fila.cancha_id,
    canchaNombre: fila.cancha_nombre,
    fecha: fila.fecha,
    hora: fila.hora,
    precio: Number(fila.precio),
    comision: Number(fila.comision),
    total: Number(fila.total),
    metodoPago: fila.metodo_pago,
    contacto: { nombre: fila.contacto_nombre, celular: fila.contacto_celular },
    creadaEn: fila.creada_en,
  };
}

function aFila(reserva, usuarioId) {
  return {
    usuario_id: usuarioId,
    local_slug: reserva.localSlug,
    local_nombre: reserva.localNombre,
    direccion: reserva.direccion,
    cancha_id: reserva.canchaId,
    cancha_nombre: reserva.canchaNombre,
    fecha: reserva.fecha,
    hora: reserva.hora,
    precio: reserva.precio,
    comision: reserva.comision,
    total: reserva.total,
    metodo_pago: reserva.metodoPago,
    codigo: reserva.codigo,
    contacto_nombre: reserva.contacto?.nombre ?? null,
    contacto_celular: reserva.contacto?.celular ?? null,
  };
}

export async function listarReservasDeUsuario(usuarioId) {
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('creada_en', { ascending: false });

  if (error) return { datos: [], error: error.message };
  return { datos: data.map(aReserva), error: null };
}

// Las políticas de seguridad ya limitan esta consulta a las reservas del
// complejo del usuario: aunque se pida otro local_slug, la base no lo devuelve.
export async function listarReservasDeLocal(localSlug, desdeISO) {
  let consulta = supabase.from('reservas').select('*').eq('local_slug', localSlug);
  if (desdeISO) consulta = consulta.gte('fecha', desdeISO);

  const { data, error } = await consulta.order('fecha', { ascending: true });
  if (error) return { datos: [], error: error.message };
  return { datos: data.map(aReserva), error: null };
}

export async function crearReserva(reserva, usuarioId) {
  const { data, error } = await supabase
    .from('reservas')
    .insert(aFila(reserva, usuarioId))
    .select()
    .single();

  if (error) {
    // 23505 es violación de restricción única: alguien tomó ese horario primero.
    if (error.code === '23505' && error.message.includes('sin_cruce')) {
      return { datos: null, error: 'Alguien acaba de reservar ese horario. Elige otro.' };
    }
    return { datos: null, error: error.message };
  }
  return { datos: aReserva(data), error: null };
}

// Devuelve solo las horas tomadas, a través de una función de la base que no
// expone quién reservó. Se usa para marcar la grilla de horarios.
export async function horariosOcupados(localSlug, canchaId, fechaISO) {
  const { data, error } = await supabase.rpc('horarios_ocupados', {
    p_local: localSlug,
    p_cancha: canchaId,
    p_fecha: fechaISO,
  });

  if (error) return { datos: [], error: error.message };
  return { datos: data.map((f) => f.hora), error: null };
}
