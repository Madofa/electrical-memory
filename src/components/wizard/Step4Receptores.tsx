import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Zap, AlertCircle } from 'lucide-react'
import { useWizardStore } from '../../stores/wizardStore'
import type { Receptor, GradoElectrificacion } from '../../types'
import { FormInput, FormSelect } from '../ui/FormField'

interface Props { onNext: () => void }

const GRADO_OPTIONS: { value: GradoElectrificacion; label: string }[] = [
  { value: 'basica', label: 'Básica (5,75 kW)' },
  { value: 'elevada', label: 'Elevada (9,20 kW)' },
  { value: '', label: 'Sin grado (locales, garajes...)' },
]

const TENSION_OPTIONS = [
  { value: '230 V', label: '230 V (monofásico)' },
  { value: '3×230/400 V', label: '3×230/400 V (trifásico)' },
]

function newReceptor(): Receptor {
  return {
    id: crypto.randomUUID(),
    concepto: '',
    aclarador: '',
    potencia_kw: 0,
    tension: '3×230/400 V',
    grado: '',
  }
}

export function Step4Receptores({ onNext: _onNext }: Props) {
  const { data, addReceptor, updateReceptor, removeReceptor, getPotenciaTotal } = useWizardStore()
  const [expanded, setExpanded] = useState<string | null>(null)

  const potenciaTotal = getPotenciaTotal()
  const needsTrifasico = potenciaTotal > 15

  const handleAdd = () => {
    const r = newReceptor()
    addReceptor(r)
    setExpanded(r.id)
  }

  const upd = (id: string) => (field: keyof Receptor) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = field === 'potencia_kw' ? parseFloat(e.target.value) || 0 : e.target.value
    updateReceptor(id, { [field]: value })
  }

  return (
    <div className="space-y-4">
      {/* Totalizador */}
      <div className="card border-amber-500/20 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-display font-semibold tracking-widest uppercase text-amber-500/60 mb-0.5">
            Potencia total
          </p>
          <p className="font-mono font-semibold text-2xl text-amber-400">
            {potenciaTotal.toFixed(2).replace('.', ',')} kW
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500 font-mono">
            {needsTrifasico ? '3×230/400 V' : '230 V'}
          </p>
          <p className="text-[11px] text-slate-600 font-mono">
            {data.receptores.length} receptores
          </p>
        </div>
      </div>

      {needsTrifasico && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-400 text-xs font-body">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Potencia &gt;15 kW → suministro trifásico obligatorio (ITC-BT-10)
        </div>
      )}

      {/* Lista */}
      <AnimatePresence>
        {data.receptores.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`card cursor-pointer transition-all duration-200 ${expanded === r.id ? 'border-amber-500/30' : 'hover:border-ink-400'}`}
            >
              {/* Header receptor */}
              <div
                className="flex items-center gap-3"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-500/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-semibold text-slate-200 text-[13px] truncate">
                    {r.concepto || `Receptor ${i + 1}`}
                    {r.aclarador && <span className="text-slate-500 ml-2 font-normal text-[12px]">{r.aclarador}</span>}
                  </div>
                  <div className="text-[11px] text-amber-500/60 font-mono">
                    {r.potencia_kw > 0 ? `${r.potencia_kw.toFixed(2)} kW · ${r.tension}` : 'Sin datos aún'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeReceptor(r.id) }}
                  className="btn-ghost p-1.5 text-slate-600 hover:text-red-400 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Expanded fields */}
              <AnimatePresence>
                {expanded === r.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5 mt-4 border-t border-[#1e2d47] grid grid-cols-2 gap-4">
                      <FormInput
                        label="Concepto"
                        value={r.concepto}
                        onChange={upd(r.id)('concepto')}
                        placeholder="Vivienda / Local / Ascensor..."
                        className="col-span-2"
                        required
                      />
                      <FormInput
                        label="Aclarador"
                        value={r.aclarador}
                        onChange={upd(r.id)('aclarador')}
                        placeholder="1ª 1A / LOCAL 1..."
                        hint="Identificador en la tabla"
                      />
                      <FormInput
                        label="Potencia (kW)"
                        value={r.potencia_kw || ''}
                        onChange={upd(r.id)('potencia_kw')}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="9,20"
                        className="font-mono"
                      />
                      <FormSelect
                        label="Tensión"
                        value={r.tension}
                        onChange={upd(r.id)('tension') as any}
                        options={TENSION_OPTIONS}
                      />
                      <FormSelect
                        label="Grado electrificación"
                        value={r.grado}
                        onChange={upd(r.id)('grado') as any}
                        options={GRADO_OPTIONS}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button type="button" onClick={handleAdd} className="btn-secondary w-full justify-center">
        <Plus className="w-4 h-4" />
        Añadir receptor
      </button>

      {data.receptores.length === 0 && (
        <p className="text-center text-[12px] text-slate-600 font-body py-2">
          Añade al menos un receptor (vivienda, local, garaje, ascensor...)
        </p>
      )}
    </div>
  )
}
