-- Migració: adreça completa de l'empresa instal·ladora (2026-06-13)
ALTER TABLE public.instaladores
  ADD COLUMN IF NOT EXISTS empresa_tipus_via text,
  ADD COLUMN IF NOT EXISTS empresa_nom_via   text,
  ADD COLUMN IF NOT EXISTS empresa_numero    text,
  ADD COLUMN IF NOT EXISTS empresa_bloc      text,
  ADD COLUMN IF NOT EXISTS empresa_escala    text,
  ADD COLUMN IF NOT EXISTS empresa_pis       text,
  ADD COLUMN IF NOT EXISTS empresa_porta     text,
  ADD COLUMN IF NOT EXISTS empresa_cp        text,
  ADD COLUMN IF NOT EXISTS empresa_poblacio  text;
