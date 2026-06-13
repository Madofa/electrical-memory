-- Migració: telèfon i correu de l'adreça de la instal·lació (2026-06-13)
ALTER TABLE public.certificats_elec1
  ADD COLUMN IF NOT EXISTS inst_telefon text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS inst_correu  text NOT NULL DEFAULT '';
