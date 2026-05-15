import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WizardData, Receptor, FotoDoc } from '../types'
import { defaultWizardData } from '../types'

interface WizardStore {
  data: WizardData
  memoriaId: string | null
  isDirty: boolean

  // Setters por sección
  setReferencia: (ref: string) => void
  setSolicitante: (s: Partial<WizardData['solicitante']>) => void
  setUbicacion: (u: Partial<WizardData['ubicacion']>) => void
  addReceptor: (r: Receptor) => void
  updateReceptor: (id: string, r: Partial<Receptor>) => void
  removeReceptor: (id: string) => void
  setElementoFrontera: (e: Partial<WizardData['elementoFrontera']>) => void
  addFoto: (f: FotoDoc) => void
  updateFoto: (id: string, partial: Partial<FotoDoc>) => void
  removeFoto: (id: string) => void
  setIncluirCalculos: (v: boolean) => void
  setCalculos: (c: Partial<WizardData['calculos']>) => void
  setFirma: (lugar: string, fecha: string) => void
  setPasoActual: (paso: number) => void

  // Helpers
  getPotenciaTotal: () => number
  setMemoriaId: (id: string) => void
  loadMemoria: (id: string, data: WizardData) => void
  reset: () => void
  markClean: () => void
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      data: defaultWizardData(),
      memoriaId: null,
      isDirty: false,

      setReferencia: (ref) =>
        set((s) => ({ data: { ...s.data, referencia_interna: ref }, isDirty: true })),

      setSolicitante: (partial) =>
        set((s) => ({
          data: { ...s.data, solicitante: { ...s.data.solicitante, ...partial } },
          isDirty: true,
        })),

      setUbicacion: (partial) =>
        set((s) => ({
          data: { ...s.data, ubicacion: { ...s.data.ubicacion, ...partial } },
          isDirty: true,
        })),

      addReceptor: (r) =>
        set((s) => ({
          data: { ...s.data, receptores: [...s.data.receptores, r] },
          isDirty: true,
        })),

      updateReceptor: (id, partial) =>
        set((s) => ({
          data: {
            ...s.data,
            receptores: s.data.receptores.map((r) =>
              r.id === id ? { ...r, ...partial } : r
            ),
          },
          isDirty: true,
        })),

      removeReceptor: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            receptores: s.data.receptores.filter((r) => r.id !== id),
          },
          isDirty: true,
        })),

      setElementoFrontera: (partial) =>
        set((s) => ({
          data: { ...s.data, elementoFrontera: { ...s.data.elementoFrontera, ...partial } },
          isDirty: true,
        })),

      addFoto: (f) =>
        set((s) => ({
          data: {
            ...s.data,
            elementoFrontera: {
              ...s.data.elementoFrontera,
              fotos: [...s.data.elementoFrontera.fotos, f],
            },
          },
          isDirty: true,
        })),

      updateFoto: (id, partial) =>
        set((s) => ({
          data: {
            ...s.data,
            elementoFrontera: {
              ...s.data.elementoFrontera,
              fotos: s.data.elementoFrontera.fotos.map((f) =>
                f.id === id ? { ...f, ...partial } : f
              ),
            },
          },
          isDirty: true,
        })),

      removeFoto: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            elementoFrontera: {
              ...s.data.elementoFrontera,
              fotos: s.data.elementoFrontera.fotos.filter((f) => f.id !== id),
            },
          },
          isDirty: true,
        })),

      setIncluirCalculos: (v) =>
        set((s) => ({ data: { ...s.data, incluir_calculos: v }, isDirty: true })),

      setCalculos: (partial) =>
        set((s) => ({
          data: { ...s.data, calculos: { ...s.data.calculos, ...partial } },
          isDirty: true,
        })),

      setFirma: (lugar, fecha) =>
        set((s) => ({
          data: { ...s.data, lugarFirma: lugar, fechaFirma: fecha },
          isDirty: true,
        })),

      setPasoActual: (paso) =>
        set((s) => ({ data: { ...s.data, paso_actual: paso } })),

      setMemoriaId: (id) => set({ memoriaId: id }),

      getPotenciaTotal: () => {
        const receptores = get().data.receptores
        return receptores.reduce((sum, r) => sum + (r.potencia_kw || 0), 0)
      },

      loadMemoria: (id, saved) => {
        const d = defaultWizardData()
        set({
          memoriaId: id,
          data: {
            ...d,
            ...saved,
            solicitante: { ...d.solicitante, ...saved.solicitante },
            ubicacion: { ...d.ubicacion, ...saved.ubicacion },
            receptores: saved.receptores ?? d.receptores,
            elementoFrontera: {
              ...d.elementoFrontera,
              ...saved.elementoFrontera,
              fotos: saved.elementoFrontera?.fotos ?? [],
            },
            calculos: { ...d.calculos, ...saved.calculos },
          },
          isDirty: false,
        })
      },

      reset: () =>
        set({ data: defaultWizardData(), memoriaId: null, isDirty: false }),

      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'wizard-draft',
      partialize: (s) => ({ data: s.data, memoriaId: s.memoriaId }),
    }
  )
)
