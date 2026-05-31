// ── Esquema Unifilar (Model ELEC 2) ────────────────────────────────

export type TipusInstallacio =
  | 'habitatge_basica'
  | 'habitatge_elevada'
  | 'local_comercial'
  | 'taller'
  | 'magatzem'
  | 'oficina'
  | 'garatge'
  | 'industrial'
  | 'comunitat'
  | 'altre'

export interface Circuit {
  id: string                 // uuid local per a drag-and-drop
  nom: string                // ex: "C1 Llum Dalt"
  potencia_kw: number
  seccio: string             // ex: "2×1,5+1,5"
  pia_amperatge: number      // 10, 16, 25, ...
  diferencial_grup: string   // id del grup de diferencial al qual pertany
}

export interface Diferencial {
  id: string
  amperatge: number          // ex: 40
  sensibilitat_ma: number    // ex: 30
}

export interface DadesCapcalera {
  empresa_distribuidora: string
  seccio_connexio: string    // "10mm²"
  tensio: string             // "230V" o "400V"
  emplacament: string
  titular: string
}

export type EstatEsquema = 'esborrany' | 'finalitzat'

export interface EsquemaUnifilar {
  id: string
  instalador_id: string
  nom: string                // referència del projecte (ex: "Can Manel")
  tipus_installacio: TipusInstallacio
  circuits: Circuit[]
  diferencials: Diferencial[]
  iga_amperatge: number      // ex: 40
  capcalera: DadesCapcalera
  estat: EstatEsquema
  created_at: string
  updated_at: string
}

export const LABELS_TIPUS_INSTALLACIO: Record<TipusInstallacio, string> = {
  habitatge_basica: 'Habitatge unifamiliar (electrificació bàsica)',
  habitatge_elevada: 'Habitatge unifamiliar (electrificació elevada)',
  local_comercial: 'Local comercial',
  taller: 'Taller',
  magatzem: 'Magatzem',
  oficina: 'Oficina',
  garatge: 'Garatge',
  industrial: 'Industrial',
  comunitat: 'Comunitat de veïns',
  altre: 'Altre (sense plantilla)',
}

export const SECCIONS_DISPONIBLES = ['1,5', '2,5', '4', '6', '10', '16', '25', '35', '50']

export function defaultCapcalera(): DadesCapcalera {
  return {
    empresa_distribuidora: '',
    seccio_connexio: '10mm²',
    tensio: '230V',
    emplacament: '',
    titular: '',
  }
}
