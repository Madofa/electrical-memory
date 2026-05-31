create table if not exists public.calculs_elec3 (
  id               uuid primary key default gen_random_uuid(),
  instalador_id    uuid not null references public.instaladores(id) on delete cascade,
  nom              text not null default '',
  -- cada tram és un jsonb amb: {id, nom, carrega_pct, potencia_kw, cos_fi, seccio_mm2, longitud_m, material, tipus}
  trams            jsonb not null default '[]',
  estat            text not null default 'esborrany' check (estat in ('esborrany','finalitzat')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists calculs_elec3_instalador_idx
  on public.calculs_elec3 (instalador_id, updated_at desc);

alter table public.calculs_elec3 enable row level security;

create policy "Instal·lador veu els seus càlculs ELEC-3"
  on public.calculs_elec3 for select using (instalador_id = auth.uid());
create policy "Instal·lador crea càlculs ELEC-3"
  on public.calculs_elec3 for insert with check (instalador_id = auth.uid());
create policy "Instal·lador actualitza els seus càlculs ELEC-3"
  on public.calculs_elec3 for update using (instalador_id = auth.uid());
create policy "Instal·lador esborra els seus càlculs ELEC-3"
  on public.calculs_elec3 for delete using (instalador_id = auth.uid());
