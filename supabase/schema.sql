-- ═══════════════════════════════════════════════════════════════════
-- Memoria Eléctrica — Schema inicial
-- Pegar en Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabla: instaladores ──────────────────────────────────────────
create table if not exists public.instaladores (
  id                 uuid primary key references auth.users(id) on delete cascade,
  nombre_completo    text not null default '',
  dni_nie            text not null default '',
  tipo               text not null default 'IBTE' check (tipo in ('IBTE','IBTM','TECNICO_TITULADO','EMPRESA')),
  numero_carnet      text not null default '',
  numero_colegiado   text,
  empresa_nombre     text,
  empresa_cif        text,
  empresa_direccion  text,
  empresa_telefono   text,
  empresa_email      text,
  empresa_logo_url   text,
  firma_url          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.instaladores enable row level security;

create policy "Instalador ve su propio perfil"
  on public.instaladores for select
  using (auth.uid() = id);

create policy "Instalador edita su propio perfil"
  on public.instaladores for insert
  with check (auth.uid() = id);

create policy "Instalador actualiza su propio perfil"
  on public.instaladores for update
  using (auth.uid() = id);

-- ── Tabla: memorias ──────────────────────────────────────────────
create table if not exists public.memorias (
  id                  uuid primary key default gen_random_uuid(),
  instalador_id       uuid not null references public.instaladores(id) on delete cascade,
  referencia_interna  text,
  numero_expediente   text,
  estado              text not null default 'borrador' check (estado in ('borrador','finalizada')),
  wizard_data         jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index on public.memorias (instalador_id, updated_at desc);

alter table public.memorias enable row level security;

create policy "Instalador ve sus memorias"
  on public.memorias for select
  using (instalador_id = auth.uid());

create policy "Instalador crea memorias"
  on public.memorias for insert
  with check (instalador_id = auth.uid());

create policy "Instalador actualiza sus memorias"
  on public.memorias for update
  using (instalador_id = auth.uid());

create policy "Instalador borra sus memorias"
  on public.memorias for delete
  using (instalador_id = auth.uid());

-- ── Storage bucket: instaladores ────────────────────────────────
insert into storage.buckets (id, name, public)
values ('instaladores', 'instaladores', true)
on conflict (id) do nothing;

create policy "Usuario sube a su carpeta"
  on storage.objects for insert
  with check (
    bucket_id = 'instaladores'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Archivos públicos para lectura"
  on storage.objects for select
  using (bucket_id = 'instaladores');

create policy "Usuario actualiza su carpeta"
  on storage.objects for update
  using (
    bucket_id = 'instaladores'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
