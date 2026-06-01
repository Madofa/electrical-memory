import { supabase } from './supabase'
import type { Tram } from './elec3-calculs'
import { tramDerivacioIndividual } from './elec3-calculs'
import type { Projecte } from './supabase-projectes'
import { prefillElec3 } from './supabase-projectes'

const TABLE = 'calculs_elec3'

export interface Elec3Doc {
  id: string
  instalador_id: string
  nom: string
  trams: Tram[]
  estat: 'esborrany' | 'finalitzat'
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
      trams: [tramDerivacioIndividual()],
      estat: 'esborrany',
      ...prefill,
      ...(projecteId ? { projecte_id: projecteId } : {}),
    })
    .select('id')
  if (error) throw error
  return (data![0] as { id: string }).id
}

export async function updateElec3Doc(id: string, patch: Partial<Elec3Doc>) {
  const { error } = await supabase.from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteElec3Doc(id: string) {
  return supabase.from(TABLE).delete().eq('id', id)
}
