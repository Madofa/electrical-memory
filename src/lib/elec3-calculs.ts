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
  return {
    id, nom: label,
    carrega_pct: 100, potencia_kw: 0, cos_fi: 0.9,
    seccio_mm2: id === 'derivacio_individual' ? 10 : 2.5,
    longitud_m: 0,
    material: 'coure', tipus: 'mono',
    tipus_conductor: 'Cu',
    tensio_nominal_aillament: '0,45/0,75',
    canal_sense_tub: '', canal_tub_encastat_mm: null,
    canal_tub_sense_encas_mm: null, canal_enterrat_prof_m: null,
    aillament_instal_kohm: null, conduc_neutre_mm2: null, conduc_protec_mm2: null,
  }
}

export function initTrams(): Tram[] {
  return FIXED_SLOTS.map((s) => tramDefaults(s.id, s.label))
}

export function migrateTrams(existing: Tram[]): Tram[] {
  return FIXED_SLOTS.map((s, i) => {
    const old = existing[i]
    if (!old) return tramDefaults(s.id, s.label)
    return { ...tramDefaults(s.id, s.label), ...old, id: s.id, nom: s.label }
  })
}

const GAMMA: Record<Material, number> = { coure: 56, alumini: 35 }
const LIMIT_PCT = 5

export function calculaTrams(trams: Tram[]): TramCalculat[] {
  let acumulat = 0
  return trams.map((t) => {
    const U = t.tensio_v ?? (t.tipus === 'mono' ? 230 : 400)
    const gamma = GAMMA[t.material]
    const cosfi = Math.max(t.cos_fi || 0.001, 0.001)
    const pot = t.potencia_kw * (t.carrega_pct / 100)
    const I = t.tipus === 'mono'
      ? (pot * 1000) / (U * cosfi)
      : (pot * 1000) / (Math.sqrt(3) * U * cosfi)
    const moment = pot * t.longitud_m
    const dU = t.tipus === 'mono'
      ? (200000 * pot * t.longitud_m) / (gamma * t.seccio_mm2 * U * U * cosfi)
      : (100000 * pot * t.longitud_m) / (gamma * t.seccio_mm2 * U * U * cosfi)
    acumulat += dU
    return {
      ...t,
      potencia_demanada_kw: round2(pot),
      intensitat_a: round2(I),
      moment_kwm: round2(moment),
      caiguda_parcial_pct: round2(dU),
      caiguda_total_pct: round2(acumulat),
      ok: acumulat <= LIMIT_PCT,
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
