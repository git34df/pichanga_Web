// Capa de Google Analytics 4.
//
// El ID de medición se lee de la variable de entorno VITE_GA_ID
// (archivo .env.local en desarrollo, variables de entorno en Vercel).
// Si no hay ID configurado, los eventos se imprimen en consola para
// poder verificarlos durante el desarrollo.

const GA_ID = import.meta.env.VITE_GA_ID;
const DEBUG = import.meta.env.DEV;

let iniciado = false;

export function iniciarAnalytics() {
  if (iniciado) return;
  iniciado = true;

  window.dataLayer = window.dataLayer || [];
  // gtag debe usar `arguments`, no rest params: así lo exige el snippet oficial.
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());

  if (!GA_ID) {
    if (DEBUG) {
      console.info('[GA4] Sin VITE_GA_ID: los eventos solo se registran en consola.');
    }
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // send_page_view en false: las vistas se envían manualmente desde el
  // router, porque en una SPA la navegación no recarga la página.
  gtag('config', GA_ID, { send_page_view: false });
}

export function registrarVista(ruta, titulo) {
  if (DEBUG) console.debug('[GA4] page_view', ruta, titulo);
  if (!window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: ruta,
    page_title: titulo,
    page_location: window.location.href,
  });
}

export function registrarEvento(nombre, parametros = {}) {
  if (DEBUG) console.debug('[GA4]', nombre, parametros);
  if (!window.gtag) return;
  window.gtag('event', nombre, parametros);
}

// --- Eventos del embudo definidos en el capítulo II del informe ---

export const eventos = {
  // Sesión
  registro: ({ metodo, rol }) => registrarEvento('sign_up', { method: metodo, rol }),

  inicioSesion: ({ metodo, rol }) => registrarEvento('login', { method: metodo, rol }),

  // Etapa 2 — Exploración
  busqueda: ({ distrito, fecha, hora }) =>
    registrarEvento('search', { search_term: distrito, fecha, hora }),

  verResultados: ({ distrito, tipo, cantidad }) =>
    registrarEvento('view_search_results', {
      search_term: distrito,
      tipo_cancha: tipo,
      cantidad_resultados: cantidad,
    }),

  // Etapa 3 — Selección
  verLocal: (local) =>
    registrarEvento('view_item', {
      currency: 'PEN',
      value: Math.min(...local.canchas.map((c) => c.precio)),
      items: [
        {
          item_id: local.slug,
          item_name: local.nombre,
          item_category: local.distritoSlug,
        },
      ],
    }),

  elegirHorario: ({ local, cancha, fecha, hora, precio }) =>
    registrarEvento('select_slot', {
      item_id: local.slug,
      cancha: cancha.nombre,
      fecha,
      hora,
      es_hora_valle: hora < 18,
      value: precio,
      currency: 'PEN',
    }),

  // Etapa 4 — Checkout y pago
  iniciarCheckout: ({ local, cancha, total }) =>
    registrarEvento('begin_checkout', {
      currency: 'PEN',
      value: total,
      items: [{ item_id: local.slug, item_name: local.nombre, item_variant: cancha.nombre }],
    }),

  compra: ({ codigo, local, cancha, total, metodoPago }) =>
    registrarEvento('purchase', {
      transaction_id: codigo,
      currency: 'PEN',
      value: total,
      payment_type: metodoPago,
      items: [{ item_id: local.slug, item_name: local.nombre, item_variant: cancha.nombre }],
    }),

  // Etapa 5 — Confirmación
  reservaConfirmada: ({ codigo, local }) =>
    registrarEvento('booking_confirmed', { transaction_id: codigo, item_id: local.slug }),

  // Etapa 6 — Post-reserva
  compartirPago: ({ codigo }) => registrarEvento('share_payment_link', { transaction_id: codigo }),

  reReserva: ({ local }) => registrarEvento('rebook_click', { item_id: local }),

  resenaEnviada: ({ local, puntaje }) =>
    registrarEvento('review_submitted', { item_id: local, puntaje }),
};
