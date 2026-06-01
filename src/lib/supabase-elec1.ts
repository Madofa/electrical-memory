import { supabase } from './supabase'
import type { Instalador } from '../types'
import type { Projecte } from './supabase-projectes'
import { prefillElec1 } from './supabase-projectes'

const TABLE = 'certificats_elec1'

export interface CertificatElec1 {
  id: string
  instalador_id: string
  nom: string
  titular_nom: string; titular_nif: string
  titular_tipus_via: string; titular_nom_via: string; titular_numero: string
  titular_bloc: string; titular_escala: string; titular_pis: string; titular_porta: string
  titular_cp: string; titular_poblacio: string; titular_telefon: string; titular_correu: string
  inst_tipus_via: string; inst_nom_via: string; inst_numero: string
  inst_bloc: string; inst_escala: string; inst_pis: string; inst_porta: string
  inst_cp: string; inst_poblacio: string
  tipus_actuacio: 'nova' | 'ampliacio' | 'modificacio'
  cups: string
  classificacio: 'p1' | 'p2' | 'mtd'
  us_installacio: string
  potencia_kw: number; tensio_v: string; seccio_lga_mm2: string; num_circuits: number
  calibre_fusibles_cgp_a: number; material_conductor: string
  resist_aillament_mt: number; resist_aillament_conductors_mt: number; resist_terra_ohm: number; intensitat_iga_a: number
  observacions: string; data_signatura: string
  estat: 'esborrany' | 'finalitzat'
  created_at: string; updated_at: string
}

export function emptyCertificat(_instalador: Instalador | null): Omit<CertificatElec1, 'id' | 'instalador_id' | 'created_at' | 'updated_at'> {
  return {
    nom: '',
    titular_nom: '', titular_nif: '',
    titular_tipus_via: '', titular_nom_via: '', titular_numero: '',
    titular_bloc: '', titular_escala: '', titular_pis: '', titular_porta: '',
    titular_cp: '', titular_poblacio: '', titular_telefon: '', titular_correu: '',
    inst_tipus_via: '', inst_nom_via: '', inst_numero: '',
    inst_bloc: '', inst_escala: '', inst_pis: '', inst_porta: '',
    inst_cp: '', inst_poblacio: '',
    tipus_actuacio: 'nova',
    cups: '',
    classificacio: 'mtd',
    us_installacio: 'f) Instal·lacions d\'habitatges',
    potencia_kw: 0, tensio_v: '230', seccio_lga_mm2: '', num_circuits: 0,
    calibre_fusibles_cgp_a: 0, material_conductor: 'Coure',
    resist_aillament_mt: 0, resist_aillament_conductors_mt: 0, resist_terra_ohm: 0, intensitat_iga_a: 0,
    observacions: '',
    data_signatura: new Date().toISOString().split('T')[0],
    estat: 'esborrany',
  }
}

export async function getCertificatsElec1(instaladorId: string) {
  return supabase.from(TABLE).select('*').eq('instalador_id', instaladorId).order('updated_at', { ascending: false })
}

export async function getCertificatElec1(id: string) {
  return supabase.from(TABLE).select('*').eq('id', id).single()
}

export async function createCertificatElec1(
  instaladorId: string,
  instalador: Instalador | null,
  projecteId?: string,
  projecte?: Projecte,
): Promise<string> {
  const prefill = projecte ? prefillElec1(projecte) : {}
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      instalador_id: instaladorId,
      ...emptyCertificat(instalador),
      ...prefill,
      ...(projecteId ? { projecte_id: projecteId } : {}),
    })
    .select('id')
  if (error) throw error
  return (data![0] as { id: string }).id
}

export async function updateCertificatElec1(id: string, patch: Partial<CertificatElec1>) {
  const { error } = await supabase.from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteCertificatElec1(id: string) {
  return supabase.from(TABLE).delete().eq('id', id)
}
