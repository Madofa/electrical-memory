create table if not exists public.memories_descriptives (
  id                uuid primary key default gen_random_uuid(),
  instalador_id     uuid not null references public.instaladores(id) on delete cascade,
  nom               text not null default '',
  seccio_immoble    text not null default '',
  seccio_escomesa   text not null default '',
  seccio_quadre     text not null default '',
  seccio_treballs   text not null default '',
  seccio_justificacio text not null default '',
  lloc_signatura    text not null default '',
  data_signatura    text not null default '',
  estat             text not null default 'esborrany' check (estat in ('esborrany','finalitzat')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists memories_descriptives_instalador_idx
  on public.memories_descriptives (instalador_id, updated_at desc);

alter table public.memories_descriptives enable row level security;

create policy "Instal·lador veu les seves memòries descriptives"
  on public.memories_descriptives for select using (instalador_id = auth.uid());
create policy "Instal·lador crea memòries descriptives"
  on public.memories_descriptives for insert with check (instalador_id = auth.uid());
create policy "Instal·lador actualitza les seves memòries descriptives"
  on public.memories_descriptives for update using (instalador_id = auth.uid());
create policy "Instal·lador esborra les seves memòries descriptives"
  on public.memories_descriptives for delete using (instalador_id = auth.uid());
