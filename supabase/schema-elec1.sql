create table if not exists public.certificats_elec1 (
  id                      uuid primary key default gen_random_uuid(),
  instalador_id           uuid not null references public.instaladores(id) on delete cascade,
  nom                     text not null default '',
  -- Titular
  titular_nom             text not null default '',
  titular_nif             text not null default '',
  titular_tipus_via       text not null default '',
  titular_nom_via         text not null default '',
  titular_numero          text not null default '',
  titular_bloc            text not null default '',
  titular_escala          text not null default '',
  titular_pis             text not null default '',
  titular_porta           text not null default '',
  titular_cp              text not null default '',
  titular_poblacio        text not null default '',
  titular_telefon         text not null default '',
  titular_correu          text not null default '',
  -- Instal·lació
  inst_tipus_via          text not null default '',
  inst_nom_via            text not null default '',
  inst_numero             text not null default '',
  inst_bloc               text not null default '',
  inst_escala             text not null default '',
  inst_pis                text not null default '',
  inst_porta              text not null default '',
  inst_cp                 text not null default '',
  inst_poblacio           text not null default '',
  -- Característiques
  tipus_actuacio          text not null default 'nova' check (tipus_actuacio in ('nova','ampliacio','modificacio')),
  cups                    text not null default '',
  classificacio           text not null default 'mtd' check (classificacio in ('p1','p2','mtd')),
  us_installacio          text not null default '',
  -- Dades tècniques
  potencia_kw             numeric(8,2) not null default 0,
  tensio_v                text not null default '230',
  seccio_lga_mm2          text not null default '',
  num_circuits            integer not null default 0,
  calibre_fusibles_cgp_a  integer not null default 0,
  material_conductor      text not null default 'Coure',
  resist_aillament_mt     numeric(8,2) not null default 0,
  resist_terra_ohm        numeric(8,2) not null default 0,
  intensitat_iga_a        integer not null default 0,
  -- Certificació
  observacions            text not null default '',
  data_signatura          text not null default '',
  -- Estat
  estat                   text not null default 'esborrany' check (estat in ('esborrany','finalitzat')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists certificats_elec1_instalador_idx
  on public.certificats_elec1 (instalador_id, updated_at desc);

alter table public.certificats_elec1 enable row level security;

create policy "Instal·lador veu els seus certificats ELEC-1"
  on public.certificats_elec1 for select using (instalador_id = auth.uid());
create policy "Instal·lador crea certificats ELEC-1"
  on public.certificats_elec1 for insert with check (instalador_id = auth.uid());
create policy "Instal·lador actualitza els seus certificats ELEC-1"
  on public.certificats_elec1 for update using (instalador_id = auth.uid());
create policy "Instal·lador esborra els seus certificats ELEC-1"
  on public.certificats_elec1 for delete using (instalador_id = auth.uid());

grant select, insert, update, delete on public.certificats_elec1 to authenticated;
grant select on public.certificats_elec1 to anon;
