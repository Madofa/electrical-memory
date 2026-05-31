import { create } from 'zustand'
import type { Circuit, Diferencial, EsquemaUnifilar, DadesCapcalera } from '../types/esquemaUnifilar'
import { defaultCapcalera } from '../types/esquemaUnifilar'

interface EsquemaState {
  id: string | null
  nom: string
  tipus_installacio: EsquemaUnifilar['tipus_installacio']
  circuits: Circuit[]
  diferencials: Diferencial[]
  iga_amperatge: number
  capcalera: DadesCapcalera
  estat: EsquemaUnifilar['estat']
  dirty: boolean

  loadFromServer: (e: EsquemaUnifilar) => void
  reset: () => void

  setNom: (v: string) => void
  setIga: (v: number) => void
  setCapcalera: (patch: Partial<DadesCapcalera>) => void

  addCircuit: () => void
  updateCircuit: (id: string, patch: Partial<Circuit>) => void
  removeCircuit: (id: string) => void
  reorderCircuits: (ids: string[]) => void

  addDiferencial: () => void
  updateDiferencial: (id: string, patch: Partial<Diferencial>) => void
  removeDiferencial: (id: string) => void

  markClean: () => void
}

const initial = {
  id: null,
  nom: '',
  tipus_installacio: 'habitatge_basica' as EsquemaUnifilar['tipus_installacio'],
  circuits: [] as Circuit[],
  diferencials: [] as Diferencial[],
  iga_amperatge: 25,
  capcalera: defaultCapcalera(),
  estat: 'esborrany' as EsquemaUnifilar['estat'],
  dirty: false,
}

export const useEsquemaStore = create<EsquemaState>((set) => ({
  ...initial,

  loadFromServer: (e) => set({
    id: e.id,
    nom: e.nom,
    tipus_installacio: e.tipus_installacio,
    circuits: e.circuits,
    diferencials: e.diferencials,
    iga_amperatge: e.iga_amperatge,
    capcalera: { ...defaultCapcalera(), ...e.capcalera },
    estat: e.estat,
    dirty: false,
  }),

  reset: () => set(initial),

  setNom: (nom) => set({ nom, dirty: true }),
  setIga: (iga_amperatge) => set({ iga_amperatge, dirty: true }),
  setCapcalera: (patch) => set((s) => ({
    capcalera: { ...s.capcalera, ...patch },
    dirty: true,
  })),

  addCircuit: () => set((s) => {
    const grup = s.diferencials[0]?.id ?? ''
    const nou: Circuit = {
      id: crypto.randomUUID(),
      nom: `C${s.circuits.length + 1} Nou`,
      potencia_kw: 0,
      seccio: '2×2,5+2,5',
      pia_amperatge: 16,
      diferencial_grup: grup,
    }
    return { circuits: [...s.circuits, nou], dirty: true }
  }),

  updateCircuit: (id, patch) => set((s) => ({
    circuits: s.circuits.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    dirty: true,
  })),

  removeCircuit: (id) => set((s) => ({
    circuits: s.circuits.filter((c) => c.id !== id),
    dirty: true,
  })),

  reorderCircuits: (ids) => set((s) => {
    const map = new Map(s.circuits.map((c) => [c.id, c]))
    return {
      circuits: ids.map((id) => map.get(id)!).filter(Boolean),
      dirty: true,
    }
  }),

  addDiferencial: () => set((s) => ({
    diferencials: [
      ...s.diferencials,
      { id: crypto.randomUUID(), amperatge: 40, sensibilitat_ma: 30 },
    ],
    dirty: true,
  })),

  updateDiferencial: (id, patch) => set((s) => ({
    diferencials: s.diferencials.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    dirty: true,
  })),

  removeDiferencial: (id) => set((s) => {
    // Si era el último, no permitimos quitarlo: necesitamos al menos uno
    // donde reasignar los circuitos.
    if (s.diferencials.length <= 1) return s
    const fallback = s.diferencials.find((d) => d.id !== id)!.id
    return {
      diferencials: s.diferencials.filter((d) => d.id !== id),
      circuits: s.circuits.map((c) => (c.diferencial_grup === id ? { ...c, diferencial_grup: fallback } : c)),
      dirty: true,
    }
  }),

  markClean: () => set({ dirty: false }),
}))
