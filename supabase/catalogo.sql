-- Pichanga.pe — catálogo autogestionado por los locales
--
-- Ejecuta este archivo DESPUÉS de esquema.sql y bloqueos.sql.
--
-- Mueve locales y canchas del frontend a la base. El cambio de fondo es de
-- quién es el dueño del registro: antes los locales existían antes que las
-- cuentas y un administrador asignaba cuál le tocaba a cada una; ahora el
-- complejo nace de la cuenta que lo crea, y las políticas se escriben contra
-- ese propietario. Así nadie puede reclamar un complejo ajeno.

-- ====================================================================
-- LOCALES
-- ====================================================================

create table public.locales (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  propietario_id uuid references auth.users on delete set null,
  nombre        text not null,
  distrito_slug text not null,
  direccion     text not null,
  descripcion   text,
  servicios     text[] not null default '{}',
  rating        numeric(2,1) not null default 0,
  resenas       integer not null default 0,
  distancia_km  numeric(4,1) not null default 0,
  estado        text not null default 'en_revision'
                check (estado in ('en_revision','publicado','pausado')),
  creado_en     timestamptz not null default now()
);

create index locales_por_distrito on public.locales (distrito_slug, estado);
create index locales_por_propietario on public.locales (propietario_id);

alter table public.locales enable row level security;

-- Cualquiera puede ver los complejos publicados: es el catálogo público.
create policy "catálogo público" on public.locales
  for select using (estado = 'publicado');

-- El dueño ve el suyo aunque todavía no esté publicado.
create policy "el dueño ve el suyo" on public.locales
  for select using (propietario_id = auth.uid());

-- Solo una cuenta de tipo local puede crear un complejo, y solo a su nombre.
create policy "el local crea el suyo" on public.locales
  for insert with check (
    propietario_id = auth.uid()
    and exists (select 1 from public.perfiles p
                where p.id = auth.uid() and p.rol = 'local')
  );

create policy "el dueño edita el suyo" on public.locales
  for update using (propietario_id = auth.uid())
  with check (propietario_id = auth.uid());

-- El propietario no puede reasignarse un complejo ajeno ni tocar la
-- reputación, que debe venir de las reseñas y no de quien las recibe.
revoke update on public.locales from authenticated;
grant update (nombre, direccion, descripcion, servicios, distrito_slug, estado)
  on public.locales to authenticated;

-- ====================================================================
-- CANCHAS
-- ====================================================================

create table public.canchas (
  id          uuid primary key default gen_random_uuid(),
  local_slug  text not null references public.locales(slug) on delete cascade,
  codigo      text not null,
  nombre      text not null,
  tipo        text not null check (tipo in ('futbol-5','futbol-7','voley')),
  precio      numeric(8,2) not null check (precio > 0),
  activa      boolean not null default true,
  creado_en   timestamptz not null default now(),

  constraint codigo_unico_por_local unique (local_slug, codigo)
);

create index canchas_por_local on public.canchas (local_slug, activa);

alter table public.canchas enable row level security;

create policy "canchas de complejos publicados" on public.canchas
  for select using (
    exists (select 1 from public.locales l
            where l.slug = canchas.local_slug and l.estado = 'publicado')
  );

create policy "el dueño ve las suyas" on public.canchas
  for select using (
    exists (select 1 from public.locales l
            where l.slug = canchas.local_slug and l.propietario_id = auth.uid())
  );

create policy "el dueño crea las suyas" on public.canchas
  for insert with check (
    exists (select 1 from public.locales l
            where l.slug = canchas.local_slug and l.propietario_id = auth.uid())
  );

create policy "el dueño edita las suyas" on public.canchas
  for update using (
    exists (select 1 from public.locales l
            where l.slug = canchas.local_slug and l.propietario_id = auth.uid())
  );

create policy "el dueño borra las suyas" on public.canchas
  for delete using (
    exists (select 1 from public.locales l
            where l.slug = canchas.local_slug and l.propietario_id = auth.uid())
  );

-- ====================================================================
-- SIEMBRA
-- ====================================================================
--
-- El catálogo que hasta ahora vivía en src/data/canchas.js, con los mismos
-- slugs, códigos de cancha y precios. Es deliberado: las reservas ya hechas
-- guardan local_slug y cancha_id, y los eventos ya enviados a Analytics usan
-- esos mismos identificadores. Cambiarlos invalidaría los datos recogidos.
--
-- Estos siete quedan sin propietario y publicados: son el catálogo inicial
-- de la plataforma. Los que registren los usuarios nacerán a su nombre.

insert into public.locales
  (slug, nombre, distrito_slug, direccion, rating, resenas, distancia_km, servicios, descripcion)
values
  ('la-bombonera', 'Complejo La Bombonera', 'los-olivos', 'Av. Antúnez de Mayolo 1240, Los Olivos', 4.7, 128, 1.2, '{"Césped sintético","Iluminación","Estacionamiento","Duchas"}', 'Complejo con dos canchas techadas parcialmente, abierto de 2 p.m. a medianoche todos los días.'),
  ('grass-pro-center', 'Grass Pro Center', 'los-olivos', 'Jr. Las Palmeras 455, Los Olivos', 4.4, 76, 2.0, '{"Techado","Iluminación","Vestuarios"}', 'Cancha techada, buena opción para los meses de garúa.'),
  ('club-mercurio', 'Club Deportivo Mercurio', 'los-olivos', 'Av. Universitaria 3890, Los Olivos', 4.2, 54, 2.6, '{"Césped sintético","Estacionamiento","Cafetín"}', 'Complejo grande con canchas de fútbol y una losa de vóley.'),
  ('arena-maranga', 'Arena Maranga', 'san-miguel', 'Av. La Marina 2250, San Miguel', 4.6, 94, 1.8, '{"Césped sintético","Iluminación","Duchas","Cafetín"}', 'A dos cuadras del parque Maranga, con estacionamiento vigilado.'),
  ('sport-center-pro', 'Sport Center Pro', 'san-miguel', 'Calle Comandante Jiménez 180, San Miguel', 4.5, 61, 2.4, '{"Techado","Vestuarios"}', 'Dos canchas de fútbol 5 techadas, pensadas para partidos rápidos.'),
  ('monterrico-futbol', 'Monterrico Fútbol Club', 'santiago-de-surco', 'Av. Primavera 1420, Santiago de Surco', 4.8, 143, 3.1, '{"Césped sintético","Iluminación","Estacionamiento","Duchas","Cafetín"}', 'Tres canchas profesionales con graderías y transmisión en vivo opcional.'),
  ('vitarte-sport', 'Vitarte Sport', 'ate', 'Carretera Central km 7, Ate', 4.1, 38, 4.0, '{"Césped sintético","Iluminación"}', 'Opción económica con buena disponibilidad entre semana.')
on conflict (slug) do nothing;

update public.locales set estado = 'publicado' where propietario_id is null;

insert into public.canchas (local_slug, codigo, nombre, tipo, precio)
values
  ('la-bombonera', 'c1', 'Cancha 1', 'futbol-7', 140),
  ('la-bombonera', 'c2', 'Cancha 2', 'futbol-5', 110),
  ('grass-pro-center', 'c1', 'Cancha A', 'futbol-7', 120),
  ('grass-pro-center', 'c2', 'Cancha B', 'futbol-5', 95),
  ('club-mercurio', 'c1', 'Cancha 1', 'futbol-7', 100),
  ('club-mercurio', 'c2', 'Losa', 'voley', 70),
  ('arena-maranga', 'c1', 'Cancha Norte', 'futbol-5', 110),
  ('arena-maranga', 'c2', 'Cancha Sur', 'futbol-7', 135),
  ('sport-center-pro', 'c1', 'Cancha 1', 'futbol-5', 110),
  ('monterrico-futbol', 'c1', 'Cancha 1', 'futbol-7', 180),
  ('monterrico-futbol', 'c2', 'Cancha 2', 'futbol-7', 180),
  ('monterrico-futbol', 'c3', 'Cancha 3', 'futbol-5', 140),
  ('vitarte-sport', 'c1', 'Cancha 1', 'futbol-7', 90),
  ('vitarte-sport', 'c2', 'Losa', 'voley', 60)
on conflict (local_slug, codigo) do nothing;

-- ====================================================================
-- EL PERFIL YA NO GUARDA EL LOCAL ASIGNADO
-- ====================================================================
--
-- local_slug en perfiles queda obsoleto: el vínculo ahora es locales.propietario_id.
-- Se conserva la columna para no romper lo que ya hay, pero las políticas de
-- reservas y bloqueos pasan a mirar la propiedad del complejo.

drop policy if exists "el local ve las de su complejo" on public.reservas;
create policy "el local ve las de su complejo" on public.reservas
  for select using (
    exists (select 1 from public.locales l
            where l.slug = reservas.local_slug and l.propietario_id = auth.uid())
  );

drop policy if exists "el local ve sus bloqueos" on public.bloqueos;
create policy "el local ve sus bloqueos" on public.bloqueos
  for select using (
    exists (select 1 from public.locales l
            where l.slug = bloqueos.local_slug and l.propietario_id = auth.uid())
  );

drop policy if exists "el local bloquea en su complejo" on public.bloqueos;
create policy "el local bloquea en su complejo" on public.bloqueos
  for insert with check (
    creado_por = auth.uid()
    and exists (select 1 from public.locales l
                where l.slug = bloqueos.local_slug and l.propietario_id = auth.uid())
  );

drop policy if exists "el local libera sus bloqueos" on public.bloqueos;
create policy "el local libera sus bloqueos" on public.bloqueos
  for delete using (
    exists (select 1 from public.locales l
            where l.slug = bloqueos.local_slug and l.propietario_id = auth.uid())
  );
