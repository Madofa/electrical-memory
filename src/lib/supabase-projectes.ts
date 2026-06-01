// src/lib/supabase-projectes.ts
import { supabase } from './supabase'

export interface Projecte {
  id: string
  instalador_id: string
  nom: string
  estat: 'actiu' | 'tancat'
  titular_nom: string
  titular_nif: string
  titular_telefon: string
  titular_correu: string
  inst_tipus_via: string
  inst_nom_via: string
  inst_numero: string
  inst_bloc: string
  inst_escala: string
  inst_pis: string
  inst_porta: string
  inst_cp: string
  inst_poblacio: string
  created_at: string
  updated_at: string
}

export type ProjecteForm = Omit<Projecte, 'id' | 'instalador_id' | 'created_at' | 'updated_at'>

export function emptyProjecte(): ProjecteForm {
  return {
    nom: '', estat: 'actiu',
    titular_nom: '', titular_nif: '', titular_telefon: '', titular_correu: '',
    inst_tipus_via: '', inst_nom_via: '', inst_numero: '',
    inst_bloc: '', inst_escala: '', inst_pis: '', inst_porta: '',
    inst_cp: '', inst_poblacio: '',
  }
}

export async function getProjectes(instaladorId: string) {
  return supabase
    .from('projectes')
    .select('*')
    .eq('instalador_id', instaladorId)
    .order('updated_at', { ascending: false })
}

export async function getProjecte(id: string) {
  return supabase.from('projectes').select('*').eq('id', id).single()
}

export async function createProjecte(instaladorId: string, data: ProjecteForm): Promise<string> {
  const { data: rows, error } = await supabase
    .from('projectes')
    .insert({ instalador_id: instaladorId, ...data })
    .select('id')
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
  if (!rows?.length) throw new Error('Insert sense resposta — possible bloqueig RLS')
  return (rows[0] as { id: string }).id
}

export async function updateProjecte(id: string, patch: Partial<ProjecteForm>) {
  const { error } = await supabase
    .from('projectes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
}

export async function deleteProjecte(id: string) {
  return supabase.from('projectes').delete().eq('id', id)
}

export async function assignDocToProjecte(
  table: 'memorias' | 'esquemes_unifilars' | 'certificats_elec1' | 'calculs_elec3' | 'memories_descriptives',
  docId: string,
  projecteId: string,
) {
  const { error } = await supabase
    .from(table)
    .update({ projecte_id: projecteId, updated_at: new Date().toISOString() })
    .eq('id', docId)
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
}

export function prefillMTD(p: Projecte) {
  return {
    solicitante: {
      razon_social: p.titular_nom,
      cif_nif: p.titular_nif,
      telefono: p.titular_telefon,
      email: p.titular_correu,
      direccion: '', municipio: '', cp: '',
    },
    ubicacion_patch: {
      direccion: p.inst_nom_via,
      numero: p.inst_numero,
      municipio: p.inst_poblacio,
      cp: p.inst_cp,
    },
  }
}

export function prefillEsquemaUnifilar(p: Projecte) {
  const emplacament = [p.inst_nom_via, p.inst_numero, p.inst_cp, p.inst_poblacio].filter(Boolean).join(', ')
  return {
    nom: p.nom,
    capcalera: {
      titular: p.titular_nom,
      emplacament,
      empresa_distribuidora: '',
      seccio_connexio: '10mm²',
      tensio: '230V',
    },
  }
}

export function prefillElec1(p: Projecte) {
  return {
    nom: p.nom,
    titular_nom: p.titular_nom,
    titular_nif: p.titular_nif,
    titular_telefon: p.titular_telefon,
    titular_correu: p.titular_correu,
    inst_tipus_via: p.inst_tipus_via,
    inst_nom_via: p.inst_nom_via,
    inst_numero: p.inst_numero,
    inst_bloc: p.inst_bloc,
    inst_escala: p.inst_escala,
    inst_pis: p.inst_pis,
    inst_porta: p.inst_porta,
    inst_cp: p.inst_cp,
    inst_poblacio: p.inst_poblacio,
  }
}

export function prefillElec3(p: Projecte) {
  return { nom: p.nom }
}

export function prefillMemoriaDescriptiva(p: Projecte) {
  return { nom: p.nom }
}
