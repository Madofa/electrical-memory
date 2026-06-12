// Càlculs de caiguda de tensió per tram (REBT ITC-BT-19)

export type Material = 'coure' | 'alumini'
export type TipusCorrent = 'mono' | 'tri'

export interface Tram {
  id: string
  nom: string
  carrega_pct: number
  potencia_kw: number
  cos_fi: number
  seccio_mm2: number
  longitud_m: number
  material: Material
  tipus: TipusCorrent
  tensio_v?: number
  // 9 new fields (official form)
  tipus_conductor: 'Cu' | 'Al'
  tensio_nominal_aillament: string
  canal_sense_tub: string
  canal_tub_encastat_mm: number | null
  canal_tub_sense_encas_mm: number | null
  canal_enterrat_prof_m: number | null
  aillament_instal_kohm: number | null
  conduc_neutre_mm2: number | null
  conduc_protec_mm2: number | null
}

export interface TramCalculat extends Tram {
  potencia_demanada_kw: number
  intensitat_a: number
  moment_kwm: number
  caiguda_parcial_pct: number
  caiguda_total_pct: number
  limit_pct: number
  ok: boolean
}

export const FIXED_SLOTS = [
  { id: 'derivacio_individual', label: 'Derivació individual (A — B)' },
  { id: 'C_D',  label: 'C — D' },
  { id: 'E_F',  label: 'E — F' },
  { id: 'G_H',  label: 'G — H' },
  { id: 'I_J',  label: 'I — J' },
  { id: 'K_L',  label: 'K — L' },
  { id: 'M_N',  label: 'M — N' },
  { id: 'O_P',  label: 'O — P' },
  { id: 'Q_R',  label: 'Q — R' },
  { id: 'S_T',  label: 'S — T' },
  { id: 'U_V',  label: 'U — V' },
  { id: 'W_X',  label: 'W — X' },
  { id: 'Y_Z',  label: 'Y — Z' },
] as const

export type SlotId = typeof FIXED_SLOTS[number]['id']

function tramDefaults(id: string, label: string): Tram {
  const isDI = id === 'derivacio_individual'
  const seccio = isDI ? 10 : 2.5
  return {
    id, nom: label,
    carrega_pct: 100, potencia_kw: 0,
    cos_fi: isDI ? 1 : 0.9,           // cosfi=1 per DI, 0.9 per circuits
    seccio_mm2: seccio,
    longitud_m: 0,
    material: 'coure', tipus: 'mono',
    tipus_conductor: 'Cu',
    tensio_nominal_aillament: '0,45/0,75',
    canal_sense_tub: '',
    canal_tub_encastat_mm: isDI ? 60 : 20,   // 60mm DI, 20mm circuits (ITC-BT-19)
    canal_tub_sense_encas_mm: null,
    canal_enterrat_prof_m: null,
    aillament_instal_kohm: null,
    conduc_neutre_mm2: seccio,          // per defecte = mateixa secció
    conduc_protec_mm2: seccio,          // per defecte = mateixa secció
  }
}

export function initTrams(): Tram[] {
  return FIXED_SLOTS.map((s) => tramDefaults(s.id, s.label))
}

export function migrateTrams(existing: Tram[]): Tram[] {
  return FIXED_SLOTS.map((s, i) => {
    const old = existing[i]
    const defaults = tramDefaults(s.id, s.label)
    if (!old) return defaults
    // Merge: keep user-entered values, fill nulls with sensible defaults
    return {
      ...defaults,
      ...old,
      id: s.id,
      nom: s.label,
      // Fill nulls with defaults so PDF always has Cu, 0,45/0,75, tub, neutre, protec
      tipus_conductor:          old.tipus_conductor          || defaults.tipus_conductor,
      tensio_nominal_aillament: old.tensio_nominal_aillament || defaults.tensio_nominal_aillament,
      canal_tub_encastat_mm:    old.canal_tub_encastat_mm    ?? defaults.canal_tub_encastat_mm,
      conduc_neutre_mm2:        old.conduc_neutre_mm2        ?? defaults.conduc_neutre_mm2,
      conduc_protec_mm2:        old.conduc_protec_mm2        ?? defaults.conduc_protec_mm2,
    }
  })
}

const GAMMA: Record<Material, number> = { coure: 56, alumini: 35 }

function limitPct(nom: string): number {
  const n = nom.toLowerCase()
  return /llum|alumb|il·lum|il\.lum|light|lamp/.test(n) ? 3 : 5
}

// Factor de càrrega per al prefill inicial des de l'ELEC-2.
// Valors orientatius per a instal·lacions residencials; l'instalador els pot modificar manualment.
// Per a instal·lacions no residencials, cal ajustar-los manualment.
export function carregaPctFromNom(nom: string): number {
  const n = nom.toLowerCase()
  // Endoll de bany: ús molt esporàdic
  if (/endoll|presa/.test(n) && /bany|lavabo|wc/.test(n)) return 20
  // Circuits de bany (llum, extractor): ús breu i intermitent
  if (/bany|lavabo|wc/.test(n)) return 30
  // Il·luminació general / principal
  if (/general|principal/.test(n) && /llum|iluminac|il·lum|enll|light|led|fluoresc/.test(n)) return 75
  // Aire condicionat: compressor tot o res (ITC-BT-47: 100% quan funciona)
  if (/aire|clima|a\.c\./.test(n)) return 100
  // Il·luminació no general
  if (/llum|iluminac|il·lum|enll|light|led|fluoresc/.test(n)) return 75
  // Endolls generals
  if (/endoll|presa/.test(n)) return 25
  return 50
}

// circuitNoms: optional ELEC-2 circuit names indexed by circuit slot (0 = first circuit after DI)
export function calculaTrams(trams: Tram[], circuitNoms?: string[]): TramCalculat[] {
  // Topology: DI (tram 0) → main panel → each circuit branches in parallel.
  // Total drop for each branch = DI_drop + branch_own_drop (NOT cumulative series).
  let diDrop = 0

  return trams.map((t, idx) => {
    const U = t.tensio_v ?? (t.tipus === 'mono' ? 230 : 400)
    const gamma = GAMMA[t.material]
    // Si cos_fi és 0 o no està definit (dada incompleta/corrupta), fem servir el
    // valor per defecte del tipus de tram per evitar intensitats absurdes (ITC-BT-19)
    const cosfi = t.cos_fi > 0 ? t.cos_fi : (idx === 0 ? 1 : 0.9)
    const pot = t.potencia_kw * (t.carrega_pct / 100)
    const isEmpty = pot === 0 && t.longitud_m === 0

    const I = isEmpty ? 0 : t.tipus === 'mono'
      ? (pot * 1000) / (U * cosfi)
      : (pot * 1000) / (Math.sqrt(3) * U * cosfi)
    const moment = pot * t.longitud_m
    const dU = isEmpty ? 0 : t.tipus === 'mono'
      ? (200000 * pot * t.longitud_m) / (gamma * t.seccio_mm2 * U * U * cosfi)
      : (100000 * pot * t.longitud_m) / (gamma * t.seccio_mm2 * U * U * cosfi)

    // DI (tram 0): its own drop is the shared drop for all branches
    if (idx === 0) diDrop = dU

    // Total: DI drop + own drop. Empty rows: show 0.
    const total = isEmpty ? 0 : (idx === 0 ? dU : diDrop + dU)
    // Use ELEC-2 circuit name for limit detection if available, otherwise tram nom
    const nomForLimit = (idx > 0 && circuitNoms?.[idx - 1]) ? circuitNoms[idx - 1] : t.nom
    const limit = limitPct(nomForLimit)

    return {
      ...t,
      potencia_demanada_kw: round2(pot),
      intensitat_a: round2(I),
      moment_kwm: round2(moment),
      caiguda_parcial_pct: round2(dU),
      caiguda_total_pct: round2(total),
      limit_pct: limit,
      ok: isEmpty ? true : total <= limit,
    }
  })
}

function round2(v: number) { return Math.round(v * 100) / 100 }

export function tramDerivacioIndividual(): Tram {
  return tramDefaults('derivacio_individual', 'Derivació individual (A — B)')
}

export function tramBuit(): Tram {
  return tramDefaults('C_D', 'C — D')
}
