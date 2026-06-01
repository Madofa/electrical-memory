import { supabase } from './supabase'
import type { Projecte } from './supabase-projectes'
import { prefillMemoriaDescriptiva } from './supabase-projectes'

const TABLE = 'memories_descriptives'

export interface MemoriaDescriptiva {
  id: string
  instalador_id: string
  nom: string
  seccio_immoble: string
  seccio_escomesa: string
  seccio_quadre: string
  seccio_treballs: string
  seccio_justificacio: string
  lloc_signatura: string
  data_signatura: string
  estat: 'esborrany' | 'finalitzat'
  created_at: string
  updated_at: string
}

export function emptyMemoriaDescriptiva(): Omit<MemoriaDescriptiva, 'id' | 'instalador_id' | 'created_at' | 'updated_at'> {
  return {
    nom: '',
    seccio_immoble: '',
    seccio_escomesa: '',
    seccio_quadre: '',
    seccio_treballs: '',
    seccio_justificacio: '',
    lloc_signatura: '',
    data_signatura: new Date().toISOString().split('T')[0],
    estat: 'esborrany',
  }
}

export async function getMemoriesDescriptives(instaladorId: string) {
  return supabase
    .from(TABLE).select('*')
    .eq('instalador_id', instaladorId)
    .order('updated_at', { ascending: false })
}

export async function getMemoriaDescriptiva(id: string) {
  return supabase.from(TABLE).select('*').eq('id', id).single()
}

export async function createMemoriaDescriptiva(
  instaladorId: string,
  projecteId?: string,
  projecte?: Projecte,
): Promise<string> {
  const prefill = projecte ? prefillMemoriaDescriptiva(projecte) : {}
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      instalador_id: instaladorId,
      ...emptyMemoriaDescriptiva(),
      ...prefill,
      ...(projecteId ? { projecte_id: projecteId } : {}),
    })
    .select('id')
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
  return (data![0] as { id: string }).id
}

export async function updateMemoriaDescriptiva(id: string, patch: Partial<MemoriaDescriptiva>) {
  const { error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
}

export async function deleteMemoriaDescriptiva(id: string) {
  return supabase.from(TABLE).delete().eq('id', id)
}
