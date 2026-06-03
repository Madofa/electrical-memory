-- Migració: dades tècniques al projecte (2026-06-02)
ALTER TABLE public.projectes
  ADD COLUMN IF NOT EXISTS empresa_distribuidora    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seccio_lga_mm2           text NOT NULL DEFAULT '10',
  ADD COLUMN IF NOT EXISTS tensio_v                 text NOT NULL DEFAULT '230',
  ADD COLUMN IF NOT EXISTS iga_amperatge            integer NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS potencia_kw              numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calibre_fusibles_cgp_a   integer NOT NULL DEFAULT 63,
  ADD COLUMN IF NOT EXISTS material_conductor       text NOT NULL DEFAULT 'Coure',
  ADD COLUMN IF NOT EXISTS resist_terra_ohm         numeric,
  ADD COLUMN IF NOT EXISTS nova_ampliacio_reforma   text NOT NULL DEFAULT 'nova'
    CHECK (nova_ampliacio_reforma IN ('nova', 'ampliacio', 'reforma')),
  ADD COLUMN IF NOT EXISTS us_installacio           text NOT NULL DEFAULT 'f) Instal·lacions d''habitatges',
  ADD COLUMN IF NOT EXISTS superficie_local_m2      numeric,
  ADD COLUMN IF NOT EXISTS cups                     text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS classificacio            text NOT NULL DEFAULT 'mtd'
    CHECK (classificacio IN ('p1', 'p2', 'mtd'));
