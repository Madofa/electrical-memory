// Càlculs de caiguda de tensió per tram (REBT ITC-BT-19)

export type Material = 'coure' | 'alumini'
export type TipusCorrent = 'mono' | 'tri'

export interface Tram {
  id: string
  nom: string
  carrega_pct: number       // % càrrega simultànea, ex: 100
  potencia_kw: number
  cos_fi: number            // factor de potència, ex: 0.9
  seccio_mm2: number        // mm²
  longitud_m: number
  material: Material
  tipus: TipusCorrent
  tensio_v?: number         // auto: mono=230, tri=400; override possible
}

export interface TramCalculat extends Tram {
  potencia_demanada_kw: number
  intensitat_a: number
  moment_kwm: number
  caiguda_parcial_pct: number
  caiguda_total_pct: number
  ok: boolean               // ≤3% il·luminació / ≤5% altres
}

const GAMMA: Record<Material, number> = { coure: 56, alumini: 35 }
const LIMIT_PCT = 5  // límit genèric; per il·luminació seria 3

export function calculaTrams(trams: Tram[]): TramCalculat[] {
  let acumulat = 0
  return trams.map((t) => {
    const U = t.tensio_v ?? (t.tipus === 'mono' ? 230 : 400)
    const gamma = GAMMA[t.material]
    const cosfi = Math.max(t.cos_fi || 0.001, 0.001)  // guard against 0 / empty
    const pot = (t.potencia_kw * (t.carrega_pct / 100))
    const I = t.tipus === 'mono'
      ? (pot * 1000) / (U * cosfi)
      : (pot * 1000) / (Math.sqrt(3) * U * cosfi)
    const moment = pot * t.longitud_m
    // ITC-BT-19: ΔU% includes cos_fi in the denominator
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

export function tramBuit(): Tram {
  return {
    id: crypto.randomUUID(),
    nom: '',
    carrega_pct: 100,
    potencia_kw: 0,
    cos_fi: 0.9,
    seccio_mm2: 6,
    longitud_m: 0,
    material: 'coure',
    tipus: 'mono',
  }
}

export function tramDerivacioIndividual(): Tram {
  return {
    id: crypto.randomUUID(),
    nom: 'Derivació individual (A — B)',
    carrega_pct: 100,
    potencia_kw: 0,
    cos_fi: 1,
    seccio_mm2: 10,
    longitud_m: 10,
    material: 'coure',
    tipus: 'mono',
  }
}
