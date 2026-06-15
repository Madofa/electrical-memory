-- Migració: resist_terra_ohm a text, en línia amb projectes i certificats_elec1 (2026-06-15)
ALTER TABLE public.calculs_elec3
  ALTER COLUMN resist_terra_ohm TYPE text
    USING (CASE WHEN resist_terra_ohm IS NULL THEN '' ELSE resist_terra_ohm::text END),
  ALTER COLUMN resist_terra_ohm SET DEFAULT '';
