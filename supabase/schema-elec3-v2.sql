ALTER TABLE public.calculs_elec3
  ADD COLUMN IF NOT EXISTS us_installacio           text NOT NULL DEFAULT 'Vivenda Elevada',
  ADD COLUMN IF NOT EXISTS empresa_distribuidora    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nova_ampliacio_reforma   text NOT NULL DEFAULT 'nova'
    CHECK (nova_ampliacio_reforma IN ('nova', 'ampliacio', 'reforma')),
  ADD COLUMN IF NOT EXISTS resist_terra_ohm         numeric,
  ADD COLUMN IF NOT EXISTS potencia_instal_kw       numeric,
  ADD COLUMN IF NOT EXISTS intensitat_iga_a         numeric,
  ADD COLUMN IF NOT EXISTS superficie_local_m2      numeric;
