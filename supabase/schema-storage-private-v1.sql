-- Tanca l'exposició pública del bucket 'instaladores' (logos i FIRMES) (2026-06-16)
-- Les firmes manuscrites són dades sensibles; no han de ser accessibles per URL
-- pública. L'app passa a servir firma_url i empresa_logo_url amb URLs SIGNADES
-- (createSignedUrl), regenerades a cada càrrega del perfil — funcionen igual amb
-- el bucket privat i no depenen de polítiques RLS de SELECT.
--
-- ⚠️ Aplicar NOMÉS després de desplegar el codi que genera URLs signades.
UPDATE storage.buckets SET public = false WHERE id = 'instaladores';
DROP POLICY IF EXISTS "Archivos públicos para lectura" ON storage.objects;
