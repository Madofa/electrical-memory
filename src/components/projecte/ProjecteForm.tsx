// src/components/projecte/ProjecteForm.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { FormInput } from '../ui/FormField'
import type { Projecte, ProjecteForm as PForm } from '../../lib/supabase-projectes'
import { emptyProjecte } from '../../lib/supabase-projectes'

interface Props {
  initial?: Partial<Projecte>
  onSave: (data: PForm) => Promise<void>
  onClose: () => void
}

export function ProjecteForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<PForm>({ ...emptyProjecte(), ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof PForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

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

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Titular de la instal·lació</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Nom / Raó social" value={form.titular_nom} onChange={set('titular_nom')} />
                <FormInput label="NIF / DNI" value={form.titular_nif} onChange={set('titular_nif')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Telèfon" value={form.titular_telefon} onChange={set('titular_telefon')} type="tel" />
                <FormInput label="Correu electrònic" value={form.titular_correu} onChange={set('titular_correu')} type="email" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Adreça de la instal·lació</h3>
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
