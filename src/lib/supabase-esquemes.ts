import { supabase } from './supabase'
import type { EsquemaUnifilar, EstatEsquema } from '../types/esquemaUnifilar'
import { defaultCapcalera } from '../types/esquemaUnifilar'
import { instanciarPlantilla } from './plantilles-installacio'

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
): Promise<string> {
  const { circuits, diferencials, iga_amperatge } = instanciarPlantilla(tipus)
  const payload = {
    instalador_id: instaladorId,
    nom,
    tipus_installacio: tipus,
    circuits,
    diferencials,
    iga_amperatge,
    capcalera: defaultCapcalera(),
    estat: 'esborrany' as EstatEsquema,
  }
  const { data, error } = await supabase.from(TABLE).insert(payload).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Insert sense resposta — possible bloqueig RLS')
  return (data[0] as { id: string }).id
}

export async function updateEsquema(id: string, patch: Partial<EsquemaUnifilar>): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
