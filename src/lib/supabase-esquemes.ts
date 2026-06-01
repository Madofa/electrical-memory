import { supabase } from './supabase'
import type { EsquemaUnifilar, EstatEsquema } from '../types/esquemaUnifilar'
import { defaultCapcalera } from '../types/esquemaUnifilar'
import { instanciarPlantilla } from './plantilles-installacio'
import type { Projecte } from './supabase-projectes'
import { prefillEsquemaUnifilar } from './supabase-projectes'

const TABLE = 'esquemes_unifilars'

export async function getEsquemes(instaladorId: string) {
  return supabase
    .from(TABLE)
    .select('*')
    .eq('instalador_id', instaladorId)
    .order('updated_at', { ascending: false })
}

export async function getEsquema(id: string) {
  return supabase.from(TABLE).select('*').eq('id', id).single()
}

export async function deleteEsquema(id: string) {
  return supabase.from(TABLE).delete().eq('id', id)
}

export async function createEsquemaFromPlantilla(
  instaladorId: string,
  tipus: EsquemaUnifilar['tipus_installacio'],
  nom: string,
  projecteId?: string,
  projecte?: Projecte,
): Promise<string> {
  const { circuits, diferencials, iga_amperatge } = instanciarPlantilla(tipus)
  const prefill = projecte ? prefillEsquemaUnifilar(projecte) : null
  const payload = {
    instalador_id: instaladorId,
    nom: prefill?.nom || nom,
    tipus_installacio: tipus,
    circuits,
    diferencials,
    iga_amperatge,
    capcalera: prefill?.capcalera ?? defaultCapcalera(),
    estat: 'esborrany' as EstatEsquema,
    ...(projecteId ? { projecte_id: projecteId } : {}),
  }
  const { data, error } = await supabase.from(TABLE).insert(payload).select('id')
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
  if (!data?.length) throw new Error('Insert sense resposta — possible bloqueig RLS')
  return (data[0] as { id: string }).id
}

export async function updateEsquema(id: string, patch: Partial<EsquemaUnifilar>): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
}
