-- Migració: permet text lliure a "Resistència a terra" del projecte,
-- per a casos sense connexió a terra (2026-06-15)
ALTER TABLE public.projectes
  ALTER COLUMN resist_terra_ohm TYPE text
    USING (CASE WHEN resist_terra_ohm IS NULL THEN '' ELSE resist_terra_ohm::text END),
  ALTER COLUMN resist_terra_ohm SET DEFAULT '';
