-- Esquema Unifilar (Model ELEC 2) — schema + RLS
-- Ejecutar en el SQL editor de Supabase tras restaurar el proyecto.

create table if not exists public.esquemes_unifilars (
  id                  uuid primary key default gen_random_uuid(),
  instalador_id       uuid not null references public.instaladores(id) on delete cascade,
  nom                 text not null default '',
  tipus_installacio   text not null default 'habitatge_basica',
  circuits            jsonb not null default '[]',
  diferencials        jsonb not null default '[]',
  iga_amperatge       integer not null default 40,
  capcalera           jsonb not null default '{}',
  estat               text not null default 'esborrany' check (estat in ('esborrany','finalitzat')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists esquemes_unifilars_instalador_updated_idx
  on public.esquemes_unifilars (instalador_id, updated_at desc);

alter table public.esquemes_unifilars enable row level security;

drop policy if exists "Instalador veu els seus esquemes" on public.esquemes_unifilars;
drop policy if exists "Instalador crea esquemes" on public.esquemes_unifilars;
drop policy if exists "Instalador actualitza els seus esquemes" on public.esquemes_unifilars;
drop policy if exists "Instalador esborra els seus esquemes" on public.esquemes_unifilars;

create policy "Instalador veu els seus esquemes"
  on public.esquemes_unifilars for select
  using (instalador_id = auth.uid());

create policy "Instalador crea esquemes"
  on public.esquemes_unifilars for insert
  with check (instalador_id = auth.uid());

create policy "Instalador actualitza els seus esquemes"
  on public.esquemes_unifilars for update
  using (instalador_id = auth.uid());

create policy "Instalador esborra els seus esquemes"
  on public.esquemes_unifilars for delete
  using (instalador_id = auth.uid());

grant select, insert, update, delete on public.esquemes_unifilars to authenticated;
grant select on public.esquemes_unifilars to anon;
