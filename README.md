# Pichanga.pe

Marketplace de reserva de canchas deportivas en Lima. Proyecto del curso
**E-Business y Analítica Web** (UPN) — implementación del prototipo descrito en
los capítulos I al III del informe.

React 19 + Vite + React Router. Datos simulados en el frontend.

---

## Levantar el proyecto

```bash
npm install
npm run dev
```

Abre http://localhost:5173

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve el build local, para revisarlo antes de desplegar |
| `npm run lint` | Linter |
| `npm run smoke` | Monta cada pantalla y verifica que renderiza sin errores |
| `npm run guardas` | Comprueba el control de acceso: quién puede entrar a cada ruta |
| `npm test` | Las dos anteriores, en orden |

---

## Rutas y control de acceso

| Ruta | Pantalla | Acceso | Etapa del embudo |
| --- | --- | --- | --- |
| `/` | Home con buscador | Pública | 1–2 Descubrimiento y exploración |
| `/canchas/:distrito` | Listado de canchas del distrito | Pública | 2 Exploración |
| `/local/:slug` | Ficha del local | Pública | 3 Selección |
| `/local/:slug/horarios` | Selección de día y hora | Pública | 3 Selección |
| `/para-locales` | Landing para complejos deportivos | Pública | Captación de oferta |
| `/login` | Iniciar sesión | Pública | — |
| `/registro` | Crear cuenta (`?rol=local` para locales) | Pública | — |
| `/reserva/pago` | Checkout y pago | **Con sesión** | 4 Conversión |
| `/reserva/confirmada` | Comprobante de la reserva | **Con sesión** | 5 Confirmación |
| `/mis-reservas` | Historial y re-reserva en un clic | **Con sesión** | 6 Post-reserva |
| `/mi-cuenta` | Datos del usuario y cierre de sesión | **Con sesión** | — |
| `/panel` | Panel del local (escritorio) | **Rol `local`** | Lado de la oferta |

Las rutas de distrito (`/canchas/los-olivos`) son las páginas indexables que el
capítulo II plantea como puerta de entrada de SEO local.

### Cómo funcionan las guardas

`src/components/RutaProtegida.jsx` envuelve cada ruta privada:

- Sin sesión redirige a `/login?redirect=<destino>`, y al entrar el usuario
  vuelve exactamente a donde iba.
- Con `rol="local"`, una cuenta de jugador que intente abrir `/panel` termina en
  `/sin-permiso` en vez de ver datos que no le corresponden.
- Mientras se comprueba la sesión muestra un estado de carga, para que no
  aparezca el login por un instante antes de reconocer al usuario.

El flujo de reserva exige sesión al pasar al pago, no antes: el usuario puede
buscar, comparar y elegir horario como invitado. Al pulsar *Continuar al pago*
sin sesión, el horario elegido queda guardado y se recupera tras iniciar sesión.

> **Importante para producción:** las guardas del frontend son de experiencia de
> usuario, no de seguridad. Cualquiera puede leer el JavaScript y ver qué rutas
> existen. La protección real tiene que estar en el servidor: en Supabase, con
> políticas de Row Level Security sobre las tablas. Este proyecto no las incluye
> porque los datos de canchas son simulados y viven en el frontend.

---

## Autenticación con Supabase

La sesión se maneja con **Supabase Auth** (correo y contraseña). El rol de cada
usuario —`jugador` o `local`— se guarda en el `user_metadata` al registrarse.

### Modo demo

**Si no configuras Supabase, la aplicación igual funciona.** Entra en modo demo:
la sesión se simula en `localStorage` y la pantalla de login muestra dos cuentas
de prueba:

| Cuenta | Correo | Contraseña |
| --- | --- | --- |
| Jugador | `jugador@pichanga.pe` | `demo1234` |
| Local | `local@pichanga.pe` | `demo1234` |

Sirve para revisar todo el flujo sin crear nada. En cuanto existan las variables
de entorno, el modo demo se apaga solo.

### Configurar Supabase real

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo.
   El plan gratuito alcanza de sobra.
2. Ve a **Project Settings → API** y copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. Pégalas en `.env.local` (y en las variables de entorno de Vercel).
4. En **Authentication → Providers**, deja habilitado *Email*.
5. En **Authentication → Sign In / Providers → Email**, decide si exiges
   confirmación por correo. Para una demostración de clase conviene
   **desactivarla**: así el registro deja la sesión abierta de inmediato. Con la
   confirmación activada, la app muestra el aviso de "revisa tu correo", que
   también está implementado.

La clave `anon` es pública por diseño: va en el navegador y no es un secreto.
Lo que protege los datos son las políticas de Row Level Security, no esa clave.

### Las tablas

El esquema completo está en [`supabase/esquema.sql`](supabase/esquema.sql).
Pégalo en el **SQL Editor** de Supabase y ejecútalo. Crea dos tablas:

**`perfiles`** — una fila por usuario, creada automáticamente por un trigger al
registrarse. Guarda el rol (`jugador` o `local`), nombre, celular y, para las
cuentas de local, el `local_slug` del complejo que administran.

**`reservas`** — las reservas confirmadas. Tiene una restricción `unique` sobre
`(local_slug, cancha_id, fecha, hora)`: es la base de datos, y no el frontend,
la que garantiza que dos personas no reserven la misma cancha a la misma hora.

Políticas de Row Level Security:

| Quién | Puede |
| --- | --- |
| Cualquier usuario | Leer y editar su propio perfil, pero **solo** las columnas `nombre` y `celular` |
| Jugador | Leer sus reservas e insertar reservas a su nombre |
| Local | Leer las reservas cuyo `local_slug` coincide con el de su perfil |
| Nadie desde el cliente | Modificar o borrar reservas, ni cambiar su propio rol |

La disponibilidad se consulta con la función `horarios_ocupados()`, que devuelve
únicamente las horas tomadas. Así la grilla puede marcar lo ocupado sin exponer
quién reservó ni su teléfono.

### Por qué `local_slug` se asigna a mano

El trigger que crea el perfil copia el rol, el nombre y el celular desde el
formulario, pero **nunca el `local_slug`**. Si lo copiara, cualquiera podría
registrarse diciendo que administra La Bombonera y leer sus reservas.

Una cuenta de local sin `local_slug` ve una pantalla de "cuenta en revisión" en
lugar del panel. Para asignarlo: **Table Editor → perfiles**, y escribe el slug
en esa fila. En un producto real ahí iría un flujo de verificación del negocio.

---

## Conectar Google Analytics 4

1. En Google Analytics, crea una propiedad y un flujo de datos **Web**. Copia el
   ID de medición, con formato `G-XXXXXXXXXX`.
2. En local, copia `.env.example` como `.env.local` y pega el ID:

   ```
   VITE_GA_ID=G-XXXXXXXXXX
   ```

3. En Vercel: **Settings → Environment Variables → Add**, nombre `VITE_GA_ID`,
   valor tu ID, y vuelve a desplegar. Vite inyecta las variables en tiempo de
   compilación, así que un cambio de variable exige un redeploy nuevo.

Sin ID configurado la aplicación funciona igual y los eventos se imprimen en la
consola del navegador, lo que sirve para verificarlos antes de publicar.

### Eventos que se envían

Están centralizados en `src/lib/analytics.js`, uno por etapa del embudo del
capítulo II:

| Evento | Cuándo se dispara | Parámetros principales |
| --- | --- | --- |
| `page_view` | Cada cambio de ruta (enviado a mano, porque es una SPA) | `page_path`, `page_title` |
| `sign_up` | Al crear una cuenta | `method`, `rol` |
| `login` | Al iniciar sesión | `method`, `rol` |
| `search` | Al enviar el buscador de la home | `search_term`, `fecha`, `hora` |
| `view_search_results` | Al cargar el listado o cambiar de filtro | `search_term`, `tipo_cancha`, `cantidad_resultados` |
| `view_item` | Al abrir la ficha de un local | `items[]`, `value` |
| `select_slot` | Al elegir un horario libre | `fecha`, `hora`, `es_hora_valle`, `value` |
| `begin_checkout` | Al pasar al pago | `value`, `items[]` |
| `purchase` | Al completar el pago | `transaction_id`, `value`, `payment_type` |
| `booking_confirmed` | Al mostrarse el comprobante | `transaction_id` |
| `share_payment_link` | Al compartir el pago con el grupo | `transaction_id` |
| `rebook_click` | Al repetir una reserva anterior | `item_id` |

En GA4, marca `purchase` como **evento clave** (antes "conversión") desde
**Administrar → Eventos**. El embudo del capítulo VI se arma en
**Explorar → Exploración de embudo** con la secuencia
`view_search_results → view_item → select_slot → begin_checkout → purchase`.

> Ten en cuenta que GA4 puede tardar hasta 24 horas en mostrar datos en los
> informes estándar. Para verificar que los eventos llegan, usa el **DebugView**,
> que es inmediato.

---

## Desplegar en Vercel

1. Sube el proyecto a un repositorio de GitHub.
2. En Vercel: **Add New → Project** e importa el repositorio.
3. Vercel detecta Vite solo. Confirma:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Agrega la variable `VITE_GA_ID` antes del primer despliegue.
5. **Deploy**.

El archivo `vercel.json` ya incluye la reescritura que necesita una SPA: sin
ella, entrar directo a `/canchas/los-olivos` devolvería 404 porque el servidor
buscaría un archivo con ese nombre.

---

## Estructura

```
src/
├─ main.jsx                 punto de entrada
├─ App.jsx                  rutas y seguimiento de vistas en GA4
├─ index.css                tokens de diseño y estilos
├─ data/canchas.js          datos simulados y lógica de disponibilidad
├─ lib/analytics.js         capa de GA4 y catálogo de eventos
├─ lib/supabase.js          cliente de Supabase y detección de modo demo
├─ context/
│  ├─ AuthContext.jsx       sesión, rol y modo demo
│  └─ ReservaContext.jsx    estado de la reserva entre pantallas
├─ components/
│  ├─ RutaProtegida.jsx     guarda de rutas privadas
│  └─ Layout, LocalCard, Iconos
└─ pages/                   una pantalla por archivo
```

Las pantallas nunca llaman a Supabase directamente: todo pasa por `useAuth()`,
que expone la misma interfaz en modo demo y en modo real. Por eso cambiar de
proveedor de autenticación afectaría a un solo archivo.

### Cambiar los datos simulados por un backend

Toda la simulación vive en `src/data/canchas.js`. Las pantallas solo consumen
sus funciones exportadas (`localesPorDistrito`, `buscarLocal`, `disponibilidad`,
`cuposLibres`). Para conectar una API real basta con reemplazar el cuerpo de esas
funciones por llamadas `fetch` y volverlas asíncronas; ninguna pantalla accede al
arreglo `LOCALES` directamente.

La disponibilidad se genera con un hash estable, no con números aleatorios: la
misma combinación de local, cancha, fecha y hora devuelve siempre el mismo
resultado, para que la interfaz no cambie entre renders ni entre recargas.

---

## Decisiones de diseño

- **Mobile-first.** Las pantallas públicas se limitan a 430 px de ancho y se
  centran en pantallas grandes. El panel del local sí es de escritorio.
- **Colores.** Verde #15683D como principal, amarillo #F2C230 para avisos y
  oportunidades comerciales, fondo hueso #F6F5F1.
- **Accesibilidad.** Controles nativos (`button`, `a`, `input` con su `label`),
  objetivos táctiles de 44 px o más, y estados de la grilla de horarios que se
  distinguen por luminosidad además de por color.
- **Persistencia.** Las reservas se guardan en `localStorage` para que el
  historial sobreviva a una recarga. Si el navegador lo bloquea (modo incógnito),
  la aplicación sigue funcionando en memoria.
