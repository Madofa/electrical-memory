-- Migració: converteix els camps de resistència a text per poder introduir
-- valors tal com apareixen als certificats reals (">1049", "1,43", "1.049"...) (2026-06-14)
ALTER TABLE public.certificats_elec1
  ALTER COLUMN resist_aillament_mt TYPE text
    USING (CASE WHEN resist_aillament_mt = 0 THEN '' ELSE resist_aillament_mt::text END),
  ALTER COLUMN resist_aillament_mt SET DEFAULT '',
  ALTER COLUMN resist_terra_ohm TYPE text
    USING (CASE WHEN resist_terra_ohm = 0 THEN '' ELSE resist_terra_ohm::text END),
  ALTER COLUMN resist_terra_ohm SET DEFAULT '',
  ADD COLUMN IF NOT EXISTS resist_aillament_conductors_mt text NOT NULL DEFAULT '';
