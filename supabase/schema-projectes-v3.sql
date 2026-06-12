-- Migració: adreça del titular al projecte (2026-06-12)
ALTER TABLE public.projectes
  ADD COLUMN IF NOT EXISTS titular_tipus_via text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titular_nom_via   text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titular_numero    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titular_bloc      text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titular_escala    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titular_pis       text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titular_porta     text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titular_cp        text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titular_poblacio  text NOT NULL DEFAULT '';
