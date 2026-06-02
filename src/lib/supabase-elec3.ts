import { supabase } from './supabase'
import type { Tram } from './elec3-calculs'
import { initTrams } from './elec3-calculs'
import type { Projecte } from './supabase-projectes'
import { prefillElec3 } from './supabase-projectes'

const TABLE = 'calculs_elec3'

export interface Elec3Doc {
  id: string
  instalador_id: string
  nom: string
  trams: Tram[]
  estat: 'esborrany' | 'finalitzat'
  us_installacio: string
  empresa_distribuidora: string
  nova_ampliacio_reforma: 'nova' | 'ampliacio' | 'reforma'
  resist_terra_ohm: number | null
  potencia_instal_kw: number | null
  intensitat_iga_a: number | null
  superficie_local_m2: number | null
  created_at: string
  updated_at: string
}

export async function getElec3Docs(instaladorId: string) {
  return supabase.from(TABLE).select('*').eq('instalador_id', instaladorId).order('updated_at', { ascending: false })
}

export async function getElec3Doc(id: string) {
  return supabase.from(TABLE).select('*').eq('id', id).single()
}

export async function createElec3Doc(
  instaladorId: string,
  projecteId?: string,
  projecte?: Projecte,
): Promise<string> {
  const prefill = projecte ? prefillElec3(projecte) : {}
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      instalador_id: instaladorId,
      nom: '',
      trams: initTrams(),
      estat: 'esborrany',
      us_installacio: 'Vivenda Elevada',
      empresa_distribuidora: '',
      nova_ampliacio_reforma: 'nova',
      resist_terra_ohm: null,
      potencia_instal_kw: null,
      intensitat_iga_a: null,
      superficie_local_m2: null,
      ...prefill,
      ...(projecteId ? { projecte_id: projecteId } : {}),
    })
    .select('id')
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
  return (data![0] as { id: string }).id
}

export async function updateElec3Doc(id: string, patch: Partial<Elec3Doc>) {
  const { error } = await supabase.from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
}

export async function deleteElec3Doc(id: string) {
  return supabase.from(TABLE).delete().eq('id', id)
}
