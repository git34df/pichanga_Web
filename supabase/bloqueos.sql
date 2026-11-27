-- Pichanga.pe — bloqueo de horarios
--
-- Ejecuta este archivo DESPUÉS de esquema.sql, en el SQL Editor de Supabase.
-- Agrega la tabla `bloqueos` y reemplaza la función de disponibilidad para
-- que las horas bloqueadas también aparezcan ocupadas para los jugadores.

-- ====================================================================
-- BLOQUEOS
-- ====================================================================

create table public.bloqueos (
  id         uuid primary key default gen_random_uuid(),
  local_slug text not null,
  cancha_id  text not null,
  fecha      date not null,
  hora       smallint not null check (hora between 0 and 23),
  motivo     text,
  creado_por uuid not null references auth.users on delete cascade,
  creado_en  timestamptz not null default now(),

  constraint bloqueo_unico unique (local_slug, cancha_id, fecha, hora)
);

create index bloqueos_por_local on public.bloqueos (local_slug, fecha);

alter table public.bloqueos enable row level security;

-- Un local solo ve, crea y borra bloqueos de su propio complejo. La
-- comprobación mira el perfil, no lo que mande el cliente.
create policy "el local ve sus bloqueos" on public.bloqueos
  for select using (
    exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.rol = 'local'
        and p.local_slug = bloqueos.local_slug
    )
  );

create policy "el local bloquea en su complejo" on public.bloqueos
  for insert with check (
    creado_por = auth.uid()
    and exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.rol = 'local'
        and p.local_slug = bloqueos.local_slug
    )
  );

create policy "el local libera sus bloqueos" on public.bloqueos
  for delete using (
    exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.rol = 'local'
        and p.local_slug = bloqueos.local_slug
    )
  );

-- Impide bloquear una hora que ya tiene una reserva pagada: el local no
-- puede dejar sin cancha a alguien que ya pagó.
create or replace function public.validar_bloqueo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.reservas r
    where r.local_slug = new.local_slug
      and r.cancha_id = new.cancha_id
      and r.fecha = new.fecha
      and r.hora = new.hora
  ) then
    raise exception 'Esa hora ya tiene una reserva pagada.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger antes_de_bloquear
  before insert on public.bloqueos
  for each row execute function public.validar_bloqueo();

-- ====================================================================
-- DISPONIBILIDAD: ahora suma reservas y bloqueos
-- ====================================================================

-- Reemplaza la versión de esquema.sql. Sigue devolviendo solo horas,
-- sin exponer de quién es cada reserva ni el motivo del bloqueo.
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
  where r.local_slug = p_local and r.cancha_id = p_cancha and r.fecha = p_fecha
  union
  select b.hora
  from public.bloqueos b
  where b.local_slug = p_local and b.cancha_id = p_cancha and b.fecha = p_fecha;
$$;

grant execute on function public.horarios_ocupados(text, text, date)
  to anon, authenticated;
