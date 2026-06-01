-- supabase/schema-projectes.sql

-- 1. Taula projectes
create table if not exists public.projectes (
  id              uuid primary key default gen_random_uuid(),
  instalador_id   uuid not null references public.instaladores(id) on delete cascade,
  nom             text not null default '',
  estat           text not null default 'actiu' check (estat in ('actiu','tancat')),
  titular_nom     text not null default '',
  titular_nif     text not null default '',
  titular_telefon text not null default '',
  titular_correu  text not null default '',
  inst_tipus_via  text not null default '',
  inst_nom_via    text not null default '',
  inst_numero     text not null default '',
  inst_bloc       text not null default '',
  inst_escala     text not null default '',
  inst_pis        text not null default '',
  inst_porta      text not null default '',
  inst_cp         text not null default '',
  inst_poblacio   text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists projectes_instalador_idx
  on public.projectes (instalador_id, updated_at desc);

alter table public.projectes enable row level security;

create policy "select_own" on public.projectes for select using (instalador_id = auth.uid());
create policy "insert_own" on public.projectes for insert with check (instalador_id = auth.uid());
create policy "update_own" on public.projectes for update using (instalador_id = auth.uid());
create policy "delete_own" on public.projectes for delete using (instalador_id = auth.uid());

-- 2. Columna projecte_id als 5 documents (nullable, SET NULL en esborrar projecte)
alter table public.memorias
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;

alter table public.esquemes_unifilars
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;

alter table public.certificats_elec1
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;

alter table public.calculs_elec3
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;

alter table public.memories_descriptives
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;


-- GRANTs per al rol authenticated (Supabase no els afegeix automàticament amb SQL manual)
grant select, insert, update, delete on public.projectes to authenticated;
grant select on public.projectes to anon;
