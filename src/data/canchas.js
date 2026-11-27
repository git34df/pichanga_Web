// Datos simulados del marketplace. Al conectar un backend real,
// basta con reemplazar las funciones exportadas al final del archivo.

export const DISTRITOS = [
  { slug: 'los-olivos', nombre: 'Los Olivos' },
  { slug: 'san-miguel', nombre: 'San Miguel' },
  { slug: 'santiago-de-surco', nombre: 'Santiago de Surco' },
  { slug: 'ate', nombre: 'Ate' },
];

export const TIPOS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'futbol-5', nombre: 'Fútbol 5' },
  { id: 'futbol-7', nombre: 'Fútbol 7' },
  { id: 'voley', nombre: 'Vóley' },
];

export const LOCALES = [
  {
    slug: 'la-bombonera',
    nombre: 'Complejo La Bombonera',
    distritoSlug: 'los-olivos',
    direccion: 'Av. Antúnez de Mayolo 1240, Los Olivos',
    rating: 4.7,
    resenas: 128,
    distanciaKm: 1.2,
    servicios: ['Césped sintético', 'Iluminación', 'Estacionamiento', 'Duchas'],
    descripcion:
      'Complejo con dos canchas techadas parcialmente, abierto de 2 p.m. a medianoche todos los días.',
    canchas: [
      { id: 'c1', nombre: 'Cancha 1', tipo: 'futbol-7', tipoNombre: 'Fútbol 7', precio: 140 },
      { id: 'c2', nombre: 'Cancha 2', tipo: 'futbol-5', tipoNombre: 'Fútbol 5', precio: 110 },
    ],
    opiniones: [
      {
        autor: 'Jorge M.',
        puntaje: 4.5,
        texto: 'Buen grass y nunca hay cruce de horarios. El estacionamiento se llena los viernes.',
      },
      {
        autor: 'Lucía R.',
        puntaje: 5,
        texto: 'Las duchas funcionan y la iluminación es pareja. Ideal para jugar tarde.',
      },
    ],
  },
  {
    slug: 'grass-pro-center',
    nombre: 'Grass Pro Center',
    distritoSlug: 'los-olivos',
    direccion: 'Jr. Las Palmeras 455, Los Olivos',
    rating: 4.4,
    resenas: 76,
    distanciaKm: 2.0,
    servicios: ['Techado', 'Iluminación', 'Vestuarios'],
    descripcion: 'Cancha techada, buena opción para los meses de garúa.',
    canchas: [
      { id: 'c1', nombre: 'Cancha A', tipo: 'futbol-7', tipoNombre: 'Fútbol 7', precio: 120 },
      { id: 'c2', nombre: 'Cancha B', tipo: 'futbol-5', tipoNombre: 'Fútbol 5', precio: 95 },
    ],
    opiniones: [
      { autor: 'Diego C.', puntaje: 4, texto: 'Precio justo y la cancha techada salva los partidos de invierno.' },
    ],
  },
  {
    slug: 'club-mercurio',
    nombre: 'Club Deportivo Mercurio',
    distritoSlug: 'los-olivos',
    direccion: 'Av. Universitaria 3890, Los Olivos',
    rating: 4.2,
    resenas: 54,
    distanciaKm: 2.6,
    servicios: ['Césped sintético', 'Estacionamiento', 'Cafetín'],
    descripcion: 'Complejo grande con canchas de fútbol y una losa de vóley.',
    canchas: [
      { id: 'c1', nombre: 'Cancha 1', tipo: 'futbol-7', tipoNombre: 'Fútbol 7', precio: 100 },
      { id: 'c2', nombre: 'Losa', tipo: 'voley', tipoNombre: 'Vóley', precio: 70 },
    ],
    opiniones: [
      { autor: 'Ana P.', puntaje: 4, texto: 'La losa de vóley está bien mantenida y casi siempre hay cupo.' },
    ],
  },
  {
    slug: 'arena-maranga',
    nombre: 'Arena Maranga',
    distritoSlug: 'san-miguel',
    direccion: 'Av. La Marina 2250, San Miguel',
    rating: 4.6,
    resenas: 94,
    distanciaKm: 1.8,
    servicios: ['Césped sintético', 'Iluminación', 'Duchas', 'Cafetín'],
    descripcion: 'A dos cuadras del parque Maranga, con estacionamiento vigilado.',
    canchas: [
      { id: 'c1', nombre: 'Cancha Norte', tipo: 'futbol-5', tipoNombre: 'Fútbol 5', precio: 110 },
      { id: 'c2', nombre: 'Cancha Sur', tipo: 'futbol-7', tipoNombre: 'Fútbol 7', precio: 135 },
    ],
    opiniones: [
      { autor: 'Renzo V.', puntaje: 5, texto: 'La mejor de la zona. Reservar con anticipación los jueves.' },
    ],
  },
  {
    slug: 'sport-center-pro',
    nombre: 'Sport Center Pro',
    distritoSlug: 'san-miguel',
    direccion: 'Calle Comandante Jiménez 180, San Miguel',
    rating: 4.5,
    resenas: 61,
    distanciaKm: 2.4,
    servicios: ['Techado', 'Vestuarios'],
    descripcion: 'Dos canchas de fútbol 5 techadas, pensadas para partidos rápidos.',
    canchas: [{ id: 'c1', nombre: 'Cancha 1', tipo: 'futbol-5', tipoNombre: 'Fútbol 5', precio: 110 }],
    opiniones: [
      { autor: 'Marco T.', puntaje: 4.5, texto: 'Buena atención y siempre hay balones de repuesto.' },
    ],
  },
  {
    slug: 'monterrico-futbol',
    nombre: 'Monterrico Fútbol Club',
    distritoSlug: 'santiago-de-surco',
    direccion: 'Av. Primavera 1420, Santiago de Surco',
    rating: 4.8,
    resenas: 143,
    distanciaKm: 3.1,
    servicios: ['Césped sintético', 'Iluminación', 'Estacionamiento', 'Duchas', 'Cafetín'],
    descripcion: 'Tres canchas profesionales con graderías y transmisión en vivo opcional.',
    canchas: [
      { id: 'c1', nombre: 'Cancha 1', tipo: 'futbol-7', tipoNombre: 'Fútbol 7', precio: 180 },
      { id: 'c2', nombre: 'Cancha 2', tipo: 'futbol-7', tipoNombre: 'Fútbol 7', precio: 180 },
      { id: 'c3', nombre: 'Cancha 3', tipo: 'futbol-5', tipoNombre: 'Fútbol 5', precio: 140 },
    ],
    opiniones: [
      { autor: 'Sebastián L.', puntaje: 5, texto: 'Nivel profesional, aunque el precio es el más alto de la zona.' },
    ],
  },
  {
    slug: 'vitarte-sport',
    nombre: 'Vitarte Sport',
    distritoSlug: 'ate',
    direccion: 'Carretera Central km 7, Ate',
    rating: 4.1,
    resenas: 38,
    distanciaKm: 4.0,
    servicios: ['Césped sintético', 'Iluminación'],
    descripcion: 'Opción económica con buena disponibilidad entre semana.',
    canchas: [
      { id: 'c1', nombre: 'Cancha 1', tipo: 'futbol-7', tipoNombre: 'Fútbol 7', precio: 90 },
      { id: 'c2', nombre: 'Losa', tipo: 'voley', tipoNombre: 'Vóley', precio: 60 },
    ],
    opiniones: [
      { autor: 'Kevin A.', puntaje: 4, texto: 'Precio imbatible. El acceso en hora punta es lento.' },
    ],
  },
];

export const HORAS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

// --- utilidades ---

export function nombreDistrito(slug) {
  return DISTRITOS.find((d) => d.slug === slug)?.nombre ?? slug;
}

export function buscarLocal(slug) {
  return LOCALES.find((l) => l.slug === slug) ?? null;
}

export function localesPorDistrito(distritoSlug, tipo = 'todos') {
  return LOCALES.filter(
    (l) =>
      l.distritoSlug === distritoSlug &&
      (tipo === 'todos' || l.canchas.some((c) => c.tipo === tipo)),
  );
}

// Hash estable: la misma combinación siempre devuelve la misma disponibilidad,
// para que la interfaz no cambie entre renders.
function semilla(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function esHoraValle(fechaISO, hora) {
  const dia = new Date(`${fechaISO}T12:00:00`).getDay(); // 0 domingo … 6 sábado
  return dia >= 1 && dia <= 4 && hora >= 14 && hora < 18;
}

export function precioDeHora(cancha, fechaISO, hora) {
  return esHoraValle(fechaISO, hora) ? Math.round(cancha.precio * 0.75) : cancha.precio;
}

export function etiquetaHora(hora) {
  const sufijo = hora < 12 ? 'a.m.' : 'p.m.';
  const h12 = hora > 12 ? hora - 12 : hora;
  return `${h12}:00 ${sufijo}`;
}

export function disponibilidad(localSlug, canchaId, fechaISO) {
  const cancha = buscarLocal(localSlug)?.canchas.find((c) => c.id === canchaId);
  if (!cancha) return [];
  return HORAS.map((hora) => {
    const s = semilla(`${localSlug}|${canchaId}|${fechaISO}|${hora}`);
    // Las horas pico (18–22) se llenan más que las horas valle.
    const umbral = hora >= 18 && hora <= 22 ? 70 : 35;
    return {
      hora,
      etiqueta: etiquetaHora(hora),
      precio: precioDeHora(cancha, fechaISO, hora),
      valle: esHoraValle(fechaISO, hora),
      libre: s % 100 >= umbral,
    };
  });
}

export function cuposLibres(local, fechaISO) {
  return local.canchas.reduce(
    (total, cancha) => total + disponibilidad(local.slug, cancha.id, fechaISO).filter((h) => h.libre).length,
    0,
  );
}

export function precioDesde(local) {
  return Math.min(...local.canchas.map((c) => c.precio));
}

// toISOString() convierte a UTC y en Lima (UTC-5) adelantaría un día
// después de las 7 p.m.; por eso la fecha se arma con los valores locales.
export function aISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function hoyISO() {
  return aISO(new Date());
}

export function proximosDias(cantidad = 5, desde = new Date()) {
  const DOW = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  return Array.from({ length: cantidad }, (_, i) => {
    const d = new Date(desde);
    d.setDate(d.getDate() + i);
    return { iso: aISO(d), dow: DOW.at(d.getDay()), num: String(d.getDate()) };
  });
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function fechaLegible(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return `${DIAS.at(d.getDay())} ${d.getDate()} ${MESES.at(d.getMonth())}`;
}
