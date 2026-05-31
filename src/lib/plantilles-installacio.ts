import type { Circuit, Diferencial, TipusInstallacio } from '../types/esquemaUnifilar'

// Plantillas de circuitos por tipo de instalación. Los IDs de circuit y
// diferencial se generan in situ al instanciar la plantilla, de manera que
// los grupos de diferencial queden enlazados correctamente.

interface Plantilla {
  circuits: Omit<Circuit, 'id' | 'diferencial_grup'>[]
  diferencials: Omit<Diferencial, 'id'>[]
  iga_amperatge: number
  // Índice del diferencial (sobre diferencials) al que pertenece cada circuit
  // del array circuits, en el mismo orden.
  circuit_diferencial_idx: number[]
}

const HABITATGE_BASICA: Plantilla = {
  circuits: [
    { nom: 'C1 Il·luminació',          potencia_kw: 2.30, seccio: '2×1,5+1,5', pia_amperatge: 10 },
    { nom: 'C2 Preses generals',        potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 16 },
    { nom: 'C3 Cuina i forn',           potencia_kw: 5.75, seccio: '2×6+6',     pia_amperatge: 25 },
    { nom: 'C4 Rentadora/Rentaplats',   potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 20 },
    { nom: 'C5 Bany i auxiliars',       potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 16 },
  ],
  diferencials: [
    { amperatge: 40, sensibilitat_ma: 30 },
    { amperatge: 40, sensibilitat_ma: 30 },
  ],
  iga_amperatge: 25,
  circuit_diferencial_idx: [0, 0, 1, 1, 1],
}

const HABITATGE_ELEVADA: Plantilla = {
  circuits: [
    ...HABITATGE_BASICA.circuits,
    { nom: 'C6 Aire condicionat',     potencia_kw: 5.75, seccio: '2×6+6',     pia_amperatge: 25 },
    { nom: 'C7 Eixugadora',           potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 16 },
    { nom: 'C8 Climatització',        potencia_kw: 5.75, seccio: '2×6+6',     pia_amperatge: 25 },
    { nom: 'C9 Calefacció',           potencia_kw: 5.75, seccio: '2×6+6',     pia_amperatge: 25 },
  ],
  diferencials: [
    { amperatge: 40, sensibilitat_ma: 30 },
    { amperatge: 40, sensibilitat_ma: 30 },
    { amperatge: 40, sensibilitat_ma: 30 },
  ],
  iga_amperatge: 40,
  circuit_diferencial_idx: [0, 0, 1, 1, 1, 2, 2, 2, 2],
}

const LOCAL_COMERCIAL: Plantilla = {
  circuits: [
    { nom: 'C1 Il·luminació',          potencia_kw: 2.30, seccio: '2×1,5+1,5', pia_amperatge: 10 },
    { nom: 'C2 Preses generals',        potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 16 },
    { nom: 'C3 Climatització',          potencia_kw: 5.75, seccio: '2×6+6',     pia_amperatge: 25 },
    { nom: 'C4 Ventilació',             potencia_kw: 2.30, seccio: '2×2,5+2,5', pia_amperatge: 16 },
  ],
  diferencials: [
    { amperatge: 40, sensibilitat_ma: 30 },
    { amperatge: 40, sensibilitat_ma: 30 },
  ],
  iga_amperatge: 25,
  circuit_diferencial_idx: [0, 0, 1, 1],
}

const OFICINA: Plantilla = {
  circuits: [
    { nom: 'C1 Il·luminació',          potencia_kw: 2.30, seccio: '2×1,5+1,5', pia_amperatge: 10 },
    { nom: 'C2 Preses ofimàtica',       potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 16 },
    { nom: 'C3 Climatització',          potencia_kw: 5.75, seccio: '2×6+6',     pia_amperatge: 25 },
  ],
  diferencials: [
    { amperatge: 40, sensibilitat_ma: 30 },
    { amperatge: 40, sensibilitat_ma: 30 },
  ],
  iga_amperatge: 25,
  circuit_diferencial_idx: [0, 0, 1],
}

const GARATGE: Plantilla = {
  circuits: [
    { nom: 'C1 Il·luminació',          potencia_kw: 2.30, seccio: '2×1,5+1,5', pia_amperatge: 10 },
    { nom: 'C2 Preses',                 potencia_kw: 2.30, seccio: '2×2,5+2,5', pia_amperatge: 16 },
    { nom: 'C3 Porta motoritzada',      potencia_kw: 1.50, seccio: '2×2,5+2,5', pia_amperatge: 16 },
    { nom: 'C4 Ventilació forçada',     potencia_kw: 2.30, seccio: '2×2,5+2,5', pia_amperatge: 16 },
  ],
  diferencials: [
    { amperatge: 40, sensibilitat_ma: 30 },
  ],
  iga_amperatge: 25,
  circuit_diferencial_idx: [0, 0, 0, 0],
}

const TALLER: Plantilla = {
  circuits: [
    { nom: 'C1 Il·luminació',          potencia_kw: 2.30, seccio: '2×1,5+1,5', pia_amperatge: 10 },
    { nom: 'C2 Preses generals',        potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 16 },
    { nom: 'C3 Maquinària trifàsica',   potencia_kw: 7.50, seccio: '4×6+6',     pia_amperatge: 25 },
  ],
  diferencials: [
    { amperatge: 40, sensibilitat_ma: 30 },
    { amperatge: 40, sensibilitat_ma: 300 },
  ],
  iga_amperatge: 40,
  circuit_diferencial_idx: [0, 0, 1],
}

const MAGATZEM: Plantilla = {
  circuits: [
    { nom: 'C1 Il·luminació',          potencia_kw: 2.30, seccio: '2×1,5+1,5', pia_amperatge: 10 },
    { nom: 'C2 Preses',                 potencia_kw: 2.30, seccio: '2×2,5+2,5', pia_amperatge: 16 },
  ],
  diferencials: [
    { amperatge: 40, sensibilitat_ma: 30 },
  ],
  iga_amperatge: 16,
  circuit_diferencial_idx: [0, 0],
}

const COMUNITAT: Plantilla = {
  circuits: [
    { nom: 'C1 Il·luminació escala',   potencia_kw: 1.50, seccio: '2×1,5+1,5', pia_amperatge: 10 },
    { nom: 'C2 Ascensor',              potencia_kw: 5.75, seccio: '4×6+6',     pia_amperatge: 25 },
    { nom: 'C3 Porter electrònic',     potencia_kw: 0.50, seccio: '2×1,5+1,5', pia_amperatge: 10 },
    { nom: 'C4 Bombes',                potencia_kw: 2.30, seccio: '4×2,5+2,5', pia_amperatge: 16 },
  ],
  diferencials: [
    { amperatge: 40, sensibilitat_ma: 30 },
    { amperatge: 40, sensibilitat_ma: 30 },
  ],
  iga_amperatge: 25,
  circuit_diferencial_idx: [0, 1, 0, 1],
}

const INDUSTRIAL: Plantilla = {
  circuits: [
    { nom: 'C1 Il·luminació',          potencia_kw: 2.30, seccio: '2×1,5+1,5', pia_amperatge: 10 },
    { nom: 'C2 Preses',                 potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 16 },
  ],
  diferencials: [
    { amperatge: 40, sensibilitat_ma: 30 },
  ],
  iga_amperatge: 63,
  circuit_diferencial_idx: [0, 0],
}

const ALTRE: Plantilla = {
  circuits: [],
  diferencials: [{ amperatge: 40, sensibilitat_ma: 30 }],
  iga_amperatge: 25,
  circuit_diferencial_idx: [],
}

const PLANTILLES: Record<TipusInstallacio, Plantilla> = {
  habitatge_basica: HABITATGE_BASICA,
  habitatge_elevada: HABITATGE_ELEVADA,
  local_comercial: LOCAL_COMERCIAL,
  taller: TALLER,
  magatzem: MAGATZEM,
  oficina: OFICINA,
  garatge: GARATGE,
  industrial: INDUSTRIAL,
  comunitat: COMUNITAT,
  altre: ALTRE,
}

export function instanciarPlantilla(tipus: TipusInstallacio): {
  circuits: Circuit[]
  diferencials: Diferencial[]
  iga_amperatge: number
} {
  const p = PLANTILLES[tipus]
  const diferencials: Diferencial[] = p.diferencials.map((d) => ({
    id: crypto.randomUUID(),
    ...d,
  }))
  const circuits: Circuit[] = p.circuits.map((c, i) => ({
    id: crypto.randomUUID(),
    ...c,
    diferencial_grup: diferencials[p.circuit_diferencial_idx[i]]?.id ?? diferencials[0].id,
  }))
  return { circuits, diferencials, iga_amperatge: p.iga_amperatge }
}
