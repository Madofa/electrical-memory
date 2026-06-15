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
  // Adreça del titular
  titular_tipus_via: string
  titular_nom_via: string
  titular_numero: string
  titular_bloc: string
  titular_escala: string
  titular_pis: string
  titular_porta: string
  titular_cp: string
  titular_poblacio: string
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
  resist_terra_ohm: string
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
    titular_tipus_via: '', titular_nom_via: '', titular_numero: '',
    titular_bloc: '', titular_escala: '', titular_pis: '', titular_porta: '',
    titular_cp: '', titular_poblacio: '',
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
    resist_terra_ohm: '',
    nova_ampliacio_reforma: 'nova',
    us_installacio: 'Habitatge',
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
    titular_tipus_via: p.titular_tipus_via,
    titular_nom_via: p.titular_nom_via,
    titular_numero: p.titular_numero,
    titular_bloc: p.titular_bloc,
    titular_escala: p.titular_escala,
    titular_pis: p.titular_pis,
    titular_porta: p.titular_porta,
    titular_cp: p.titular_cp,
    titular_poblacio: p.titular_poblacio,
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
    resist_terra_ohm: p.resist_terra_ohm || '',
    us_installacio: p.us_installacio || 'Habitatge',
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
    resist_terra_ohm: p.resist_terra_ohm || '',
    potencia_instal_kw: p.potencia_kw || null,
    intensitat_iga_a: p.iga_amperatge || null,
    superficie_local_m2: p.superficie_local_m2 ?? null,
  }
}

export function prefillMemoriaDescriptiva(p: Projecte) {
  return { nom: p.nom }
}

// ── Sync document → project ────────────────────────────────────────────────
// Quan l'usuari edita un camp d'un document que també existeix al projecte,
// aquest valor és la font prioritària i s'ha de propagar al projecte, perquè
// la resta de documents (que es prefilen/sincronitzen des del projecte)
// rebin la dada corregida.

const ELEC1_DIRECT_FIELDS = new Set([
  'titular_nom', 'titular_nif', 'titular_telefon', 'titular_correu',
  'titular_tipus_via', 'titular_nom_via', 'titular_numero', 'titular_bloc',
  'titular_escala', 'titular_pis', 'titular_porta', 'titular_cp', 'titular_poblacio',
  'inst_tipus_via', 'inst_nom_via', 'inst_numero', 'inst_bloc', 'inst_escala',
  'inst_pis', 'inst_porta', 'inst_cp', 'inst_poblacio',
  'cups', 'us_installacio', 'tensio_v', 'seccio_lga_mm2',
  'material_conductor', 'potencia_kw', 'calibre_fusibles_cgp_a',
  'resist_terra_ohm', 'classificacio',
])

export function mapElec1FieldToProjecte(field: string, value: unknown): Partial<ProjecteForm> | null {
  if (ELEC1_DIRECT_FIELDS.has(field)) return { [field]: value } as Partial<ProjecteForm>
  if (field === 'intensitat_iga_a') return { iga_amperatge: value as number }
  if (field === 'tipus_actuacio') {
    return { nova_ampliacio_reforma: value === 'modificacio' ? 'reforma' : value as 'nova' | 'ampliacio' }
  }
  return null
}

const ELEC3_DIRECT_FIELDS = new Set([
  'us_installacio', 'caracteristiques_edifici', 'empresa_distribuidora',
  'nova_ampliacio_reforma', 'resist_terra_ohm', 'superficie_local_m2',
])

export function mapElec3FieldToProjecte(field: string, value: unknown): Partial<ProjecteForm> | null {
  if (ELEC3_DIRECT_FIELDS.has(field)) return { [field]: value } as Partial<ProjecteForm>
  if (field === 'potencia_instal_kw') return { potencia_kw: (value as number | null) ?? 0 }
  if (field === 'intensitat_iga_a')   return { iga_amperatge: (value as number | null) ?? 0 }
  return null
}
