-- Pichanga.pe — esquema de base de datos
--
-- Pégalo completo en el SQL Editor de Supabase y ejecútalo una sola vez.
-- Crea las tablas `perfiles` y `reservas`, sus políticas de seguridad,
-- el trigger que crea el perfil al registrarse y la función que expone
-- la disponibilidad sin revelar datos personales.

-- ====================================================================
-- PERFILES
-- ====================================================================

create table public.perfiles (
  id         uuid primary key references auth.users on delete cascade,
  rol        text not null default 'jugador' check (rol in ('jugador','local')),
  nombre     text,
  celular    text,
  local_slug text,
  creado_en  timestamptz not null default now()
);

alter table public.perfiles enable row level security;

create policy "perfil propio: leer" on public.perfiles
  for select using (auth.uid() = id);

create policy "perfil propio: editar" on public.perfiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- El usuario solo puede cambiar su nombre y celular. Sin esta restricción
-- de columnas, la política de UPDATE le permitiría ascenderse a 'local'
-- o asignarse el complejo de otro.
revoke update on public.perfiles from authenticated;
grant update (nombre, celular) on public.perfiles to authenticated;

-- Crea el perfil automáticamente al registrarse.
-- NO copia local_slug desde el cliente: ese dato lo asigna un administrador
-- tras verificar que la persona realmente administra ese complejo.
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, rol, nombre, celular)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'rol', 'jugador'),
    new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'celular'
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ====================================================================
-- RESERVAS
-- ====================================================================

create table public.reservas (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references auth.users on delete cascade,
  local_slug       text not null,
  local_nombre     text not null,
  direccion        text,
  cancha_id        text not null,
  cancha_nombre    text not null,
  fecha            date not null,
  hora             smallint not null check (hora between 0 and 23),
  precio           numeric(8,2) not null,
  comision         numeric(8,2) not null,
  total            numeric(8,2) not null,
  metodo_pago      text,
  codigo           text not null unique,
  contacto_nombre  text,
  contacto_celular text,
  creada_en        timestamptz not null default now(),

  -- Impide que dos personas reserven la misma cancha a la misma hora.
  -- La garantía vive en la base, no en el frontend.
  constraint sin_cruce unique (local_slug, cancha_id, fecha, hora)
);

create index reservas_por_usuario on public.reservas (usuario_id, creada_en desc);
create index reservas_por_local on public.reservas (local_slug, fecha);

alter table public.reservas enable row level security;

create policy "el jugador ve las suyas" on public.reservas
  for select using (auth.uid() = usuario_id);

create policy "el local ve las de su complejo" on public.reservas
  for select using (
    exists (
      select 1 from public.perfiles p
      where p.id = auth.uid()
        and p.rol = 'local'
        and p.local_slug = reservas.local_slug
    )
  );

create policy "crear la propia" on public.reservas
  for insert with check (auth.uid() = usuario_id);

-- Sin políticas de UPDATE ni DELETE, nadie puede modificar ni borrar una
-- reserva desde el cliente: con RLS activado, lo que no se permite se niega.

-- ====================================================================
-- DISPONIBILIDAD PÚBLICA
-- ====================================================================

-- Devuelve solo las horas tomadas de una cancha en una fecha. Es
-- `security definer` para poder leer reservas ajenas, pero no expone
-- ninguna columna con datos personales.
create or replace function public.horarios_ocupados(
  p_local text,
  p_cancha text,
  p_fecha date
)
returns table (hora smallint)
language sql
security definer
set search_path = public
as $$
  select r.hora
  from public.reservas r
  where r.local_slug = p_local
    and r.cancha_id = p_cancha
    and r.fecha = p_fecha;
$$;

grant execute on function public.horarios_ocupados(text, text, date)
  to anon, authenticated;
