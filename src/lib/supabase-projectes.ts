// src/lib/supabase-projectes.ts
import { supabase } from './supabase'

export interface Projecte {
  id: string
  instalador_id: string
  nom: string
  estat: 'actiu' | 'tancat'
  // Titular
  titular_nom: string
  titular_nif: string
  titular_telefon: string
  titular_correu: string
  // Adreça instal·lació
  inst_tipus_via: string
  inst_nom_via: string
  inst_numero: string
  inst_bloc: string
  inst_escala: string
  inst_pis: string
  inst_porta: string
  inst_cp: string
  inst_poblacio: string
  // Dades tècniques (shared across all documents)
  empresa_distribuidora: string
  seccio_lga_mm2: string
  tensio_v: string
  iga_amperatge: number
  potencia_kw: number
  calibre_fusibles_cgp_a: number
  material_conductor: string
  resist_terra_ohm: number | null
  nova_ampliacio_reforma: 'nova' | 'ampliacio' | 'reforma'
  us_installacio: string
  caracteristiques_edifici: string
  superficie_local_m2: number | null
  cups: string
  classificacio: 'p1' | 'p2' | 'mtd'
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
    // Tècnic
    empresa_distribuidora: '',
    seccio_lga_mm2: '10',
    tensio_v: '230',
    iga_amperatge: 40,
    potencia_kw: 0,
    calibre_fusibles_cgp_a: 63,
    material_conductor: 'Coure',
    resist_terra_ohm: null,
    nova_ampliacio_reforma: 'nova',
    us_installacio: 'f) Instal·lacions d\'habitatges',
    caracteristiques_edifici: '',
    superficie_local_m2: null,
    cups: '',
    classificacio: 'mtd',
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

// ── Prefill functions ─────────────────────────────────────────────────────────

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
    iga_amperatge: p.iga_amperatge || 40,
    capcalera: {
      titular: p.titular_nom,
      emplacament,
      empresa_distribuidora: p.empresa_distribuidora || '',
      seccio_connexio: p.seccio_lga_mm2 ? `${p.seccio_lga_mm2}mm²` : '10mm²',
      tensio: p.tensio_v ? `${p.tensio_v}V` : '230V',
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
    // Technical
    tensio_v: p.tensio_v || '230',
    seccio_lga_mm2: p.seccio_lga_mm2 || '',
    potencia_kw: p.potencia_kw || 0,
    calibre_fusibles_cgp_a: p.calibre_fusibles_cgp_a || 0,
    material_conductor: p.material_conductor || 'Coure',
    intensitat_iga_a: p.iga_amperatge || 0,
    resist_terra_ohm: p.resist_terra_ohm || 0,
    us_installacio: p.us_installacio || 'f) Instal·lacions d\'habitatges',
    cups: p.cups || '',
    classificacio: p.classificacio || 'mtd',
    tipus_actuacio: p.nova_ampliacio_reforma === 'nova' ? 'nova'
      : p.nova_ampliacio_reforma === 'ampliacio' ? 'ampliacio' : 'modificacio',
  }
}

export function prefillElec3(p: Projecte) {
  return {
    nom: p.nom,
    us_installacio: p.us_installacio || '',
    empresa_distribuidora: p.empresa_distribuidora || '',
    nova_ampliacio_reforma: p.nova_ampliacio_reforma || 'nova',
    resist_terra_ohm: p.resist_terra_ohm ?? null,
    potencia_instal_kw: p.potencia_kw || null,
    intensitat_iga_a: p.iga_amperatge || null,
    superficie_local_m2: p.superficie_local_m2 ?? null,
  }
}

export function prefillMemoriaDescriptiva(p: Projecte) {
  return { nom: p.nom }
}
