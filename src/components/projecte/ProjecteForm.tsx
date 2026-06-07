// src/components/projecte/ProjecteForm.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { FormInput, FormSelect } from '../ui/FormField'
import type { Projecte, ProjecteForm as PForm } from '../../lib/supabase-projectes'
import { emptyProjecte } from '../../lib/supabase-projectes'

interface Props {
  initial?: Partial<Projecte>
  onSave: (data: PForm) => Promise<void>
  onClose: () => void
}

const US_SUGGESTIONS = ['Habitatge', 'Magatzem', 'Local comercial', 'Oficina', 'Taller', 'Garatge', 'Piscina', 'Restaurant', 'Bar']

const NCP_OPTIONS = [
  { value: 'nova', label: 'Nova instal·lació' },
  { value: 'ampliacio', label: 'Ampliació' },
  { value: 'reforma', label: 'Modificació o reforma' },
]

const CLASSIF_OPTIONS = [
  { value: 'mtd', label: 'Memòria tècnica de disseny' },
  { value: 'p1', label: 'Classe P1' },
  { value: 'p2', label: 'Classe P2' },
]

export function ProjecteForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<PForm>({ ...emptyProjecte(), ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof PForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const setNum = (field: keyof PForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))

  const setNumNull = (field: keyof PForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value ? parseFloat(e.target.value) : null }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Cal indicar un nom per al projecte.'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message ?? JSON.stringify(err)
      setError(msg || 'Error en desar')
    }
    setSaving(false)
  }

  const section = (title: string) => (
    <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">{title}</h3>
  )

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="bg-[#0f1729] border border-[#1e2d47] rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d47]">
            <h2 className="font-display font-bold text-lg tracking-widest uppercase text-slate-100">
              {initial?.id ? 'Editar projecte' : 'Nou projecte'}
            </h2>
            <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <FormInput label="Nom del projecte" value={form.nom} onChange={set('nom')} placeholder="Ex: Can Manel" required autoFocus />
            <FormInput
              label="Característiques de l'edifici (descripció física)"
              value={form.caracteristiques_edifici}
              onChange={set('caracteristiques_edifici')}
              placeholder="ex: Nau industrial PB. Estructura metàl·lica. 350 m²."
            />

            {/* Titular */}
            <div className="space-y-3">
              {section('Titular de la instal·lació')}
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Nom / Raó social" value={form.titular_nom} onChange={set('titular_nom')} />
                <FormInput label="NIF / DNI" value={form.titular_nif} onChange={set('titular_nif')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Telèfon" value={form.titular_telefon} onChange={set('titular_telefon')} type="tel" />
                <FormInput label="Correu electrònic" value={form.titular_correu} onChange={set('titular_correu')} type="email" />
              </div>
            </div>

            {/* Adreça instal·lació */}
            <div className="space-y-3">
              {section('Adreça de la instal·lació')}
              <div className="grid grid-cols-4 gap-3">
                <FormInput label="Tipus via" value={form.inst_tipus_via} onChange={set('inst_tipus_via')} placeholder="Carrer" />
                <div className="col-span-2"><FormInput label="Nom de la via" value={form.inst_nom_via} onChange={set('inst_nom_via')} /></div>
                <FormInput label="Núm." value={form.inst_numero} onChange={set('inst_numero')} />
              </div>
              <div className="grid grid-cols-5 gap-3">
                <FormInput label="Bloc" value={form.inst_bloc} onChange={set('inst_bloc')} />
                <FormInput label="Escala" value={form.inst_escala} onChange={set('inst_escala')} />
                <FormInput label="Pis" value={form.inst_pis} onChange={set('inst_pis')} />
                <FormInput label="Porta" value={form.inst_porta} onChange={set('inst_porta')} />
                <FormInput label="C.P." value={form.inst_cp} onChange={set('inst_cp')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Municipi" value={form.inst_poblacio} onChange={set('inst_poblacio')} />
              </div>
            </div>

            {/* Dades tècniques */}
            <div className="space-y-3">
              {section('Dades tècniques (s\'apliquen a tots els documents)')}

              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Empresa distribuïdora" value={form.empresa_distribuidora} onChange={set('empresa_distribuidora')} placeholder="ex: Endesa, e-distribució..." />
                <FormInput label="CUPS" value={form.cups} onChange={set('cups')} placeholder="ES0021..." />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormInput label="Característiques de l'edifici (descripció física)" value={form.caracteristiques_edifici} onChange={set('caracteristiques_edifici')} placeholder="ex: Nau industrial PB. Estructura metàl·lica. 350 m²." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormInput label="Secció LGA (mm²)" value={form.seccio_lga_mm2} onChange={set('seccio_lga_mm2')} placeholder="10" className="font-mono" />
                <FormInput label="Tensió (V)" value={form.tensio_v} onChange={set('tensio_v')} placeholder="230" className="font-mono" />
                <FormInput label="IGA (A)" type="number" value={String(form.iga_amperatge || '')} onChange={setNum('iga_amperatge')} className="font-mono" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormInput label="Potència màxima (kW)" type="number" step="0.01" value={String(form.potencia_kw || '')} onChange={setNum('potencia_kw')} className="font-mono" />
                <FormInput label="Calibre fusibles CGP (A)" type="number" value={String(form.calibre_fusibles_cgp_a || '')} onChange={setNum('calibre_fusibles_cgp_a')} className="font-mono" />
                <FormInput label="Material conductor" value={form.material_conductor} onChange={set('material_conductor')} placeholder="Coure" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Resistència a terra (Ω)" type="number" step="0.1" value={String(form.resist_terra_ohm ?? '')} onChange={setNumNull('resist_terra_ohm')} className="font-mono" />
                <FormInput label="Superfície local (m²)" type="number" value={String(form.superficie_local_m2 ?? '')} onChange={setNumNull('superficie_local_m2')} className="font-mono" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormSelect label="Nova / Ampliació / Reforma" value={form.nova_ampliacio_reforma} onChange={set('nova_ampliacio_reforma')} options={NCP_OPTIONS} />
                <FormSelect label="Classificació" value={form.classificacio} onChange={set('classificacio')} options={CLASSIF_OPTIONS} />
                <div className="flex flex-col gap-1">
                  <FormInput
                    label="Ús de la instal·lació (PDF)"
                    value={form.us_installacio}
                    onChange={set('us_installacio')}
                    placeholder="ex: Habitatge, Magatzem, Local comercial..."
                    list="us-suggestions"
                  />
                  <datalist id="us-suggestions">
                    {US_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={onClose} className="btn-ghost">Cancel·la</button>
              <button type="submit" disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" />
                {saving ? 'Desant…' : 'Desa el projecte'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
