-- Endureix les polítiques RLS de UPDATE afegint WITH CHECK (2026-06-16)
-- Sense WITH CHECK, un usuari podia canviar instalador_id d'una fila pròpia
-- cap a una altra compte (injectar dades en comptes aliens). Amb WITH CHECK,
-- el nou valor també s'ha de validar contra auth.uid().
ALTER POLICY "Instal·lador actualitza els seus càlculs ELEC-3" ON public.calculs_elec3 WITH CHECK (instalador_id = auth.uid());
ALTER POLICY "Instal·lador actualitza els seus certificats ELEC-1" ON public.certificats_elec1 WITH CHECK (instalador_id = auth.uid());
ALTER POLICY "Instalador actualitza els seus esquemes" ON public.esquemes_unifilars WITH CHECK (instalador_id = auth.uid());
ALTER POLICY "Instalador actualiza su propio perfil" ON public.instaladores WITH CHECK (auth.uid() = id);
ALTER POLICY "Instalador actualiza sus memorias" ON public.memorias WITH CHECK (instalador_id = auth.uid());
ALTER POLICY "Instal·lador actualitza les seves memòries descriptives" ON public.memories_descriptives WITH CHECK (instalador_id = auth.uid());
ALTER POLICY "update_own" ON public.projectes WITH CHECK (instalador_id = auth.uid());
