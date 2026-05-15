import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Zap, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useWizardStore } from '../../stores/wizardStore'
import type { Receptor, GradoElectrificacion } from '../../types'
import { FormInput, FormSelect } from '../ui/FormField'

interface Props { onNext: () => void }

// Presets: concepto + grado + potencia estándar de contratación en España
// La potencia indicada es orientativa y siempre editable
const PRESETS: { label: string; concepto: string; grado: GradoElectrificacion; tension: string; potencia_kw: number; hint?: string }[] = [
  // Viviendas — grado según ITC-BT-10, potencia solicitada editable
  { label: 'Vivienda básica',      concepto: 'Vivienda',            grado: 'basica',   tension: '230 V',        potencia_kw: 5.75, hint: 'Grado básico (mín. 5,75 kW)' },
  { label: 'Vivienda elevada',     concepto: 'Vivienda',            grado: 'elevada',  tension: '230 V',        potencia_kw: 9.20, hint: 'Grado elevado (mín. 9,20 kW)' },
  // Potencias estándar de contratación (monofásico)
  { label: '2,3 kW — 10A mono',    concepto: '',                    grado: '',         tension: '230 V',        potencia_kw: 2.30 },
  { label: '3,45 kW — 15A mono',   concepto: '',                    grado: '',         tension: '230 V',        potencia_kw: 3.45 },
  { label: '4,6 kW — 20A mono',    concepto: '',                    grado: '',         tension: '230 V',        potencia_kw: 4.60 },
  { label: '6,9 kW — 30A mono',    concepto: '',                    grado: '',         tension: '230 V',        potencia_kw: 6.90 },
  // Otros espacios
  { label: 'Local comercial',      concepto: 'Local comercial',     grado: '',         tension: '3×230/400 V',  potencia_kw: 0 },
  { label: 'Oficina',              concepto: 'Oficina',             grado: '',         tension: '3×230/400 V',  potencia_kw: 0 },
  { label: 'Garaje / Parking',     concepto: 'Garaje',              grado: '',         tension: '3×230/400 V',  potencia_kw: 0 },
  { label: 'Trastero',             concepto: 'Trastero',            grado: '',         tension: '230 V',        potencia_kw: 0 },
  { label: 'Ascensor',             concepto: 'Ascensor',            grado: '',         tension: '3×230/400 V',  potencia_kw: 0 },
  { label: 'Zonas comunes',        concepto: 'Zonas comunes',       grado: '',         tension: '3×230/400 V',  potencia_kw: 0 },
  { label: 'Uso industrial',       concepto: 'Uso industrial',      grado: '',         tension: '3×230/400 V',  potencia_kw: 0 },
  { label: 'Otro (vacío)',         concepto: '',                    grado: '',         tension: '230 V',        potencia_kw: 0 },
]

const GRADO_OPTIONS: { value: GradoElectrificacion; label: string }[] = [
  { value: 'basica',   label: 'Básica — 5,75 kW (ITC-BT-10)' },
  { value: 'elevada',  label: 'Elevada — 9,20 kW (ITC-BT-10)' },
  { value: '',         label: 'Sin grado (locales, garajes, servicios...)' },
]

const TENSION_OPTIONS = [
  { value: '230 V',       label: '230 V (monofásico)' },
  { value: '3×230/400 V', label: '3×230/400 V (trifásico)' },
]

function newReceptor(preset?: typeof PRESETS[0]): Receptor {
  return {
    id: crypto.randomUUID(),
    concepto: preset?.concepto ?? '',
    aclarador: '',
    potencia_kw: preset?.potencia_kw ?? 0,
    tension: preset?.tension ?? '230 V',
    grado: preset?.grado ?? '',
  }
}

export function Step4Receptores({ onNext: _onNext }: Props) {
  const { data, addReceptor, updateReceptor, removeReceptor, getPotenciaTotal } = useWizardStore()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showPresets, setShowPresets] = useState(data.receptores.length === 0)

  const potenciaTotal = getPotenciaTotal()
  const needsTrifasico = potenciaTotal > 15

  const handleAdd = (preset?: typeof PRESETS[0]) => {
    const r = newReceptor(preset)
    addReceptor(r)
    setExpanded(r.id)
    setShowPresets(false)
  }

  const upd = (id: string) => (field: keyof Receptor) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = field === 'potencia_kw' ? parseFloat(e.target.value) || 0 : e.target.value
    updateReceptor(id, { [field]: value })
  }

  const esVivienda = (concepto: string) =>
    concepto.toLowerCase().includes('vivienda')

  return (
    <div className="space-y-4">
      {/* Totalizador */}
      <div className="card border-amber-500/20 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-display font-semibold tracking-widest uppercase text-amber-500/60 mb-0.5">
            Potencia total solicitada
          </p>
          <p className="font-mono font-semibold text-2xl text-amber-400">
            {potenciaTotal.toFixed(2).replace('.', ',')} kW
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500 font-mono">
            {needsTrifasico ? '3×230/400 V · Trifásico' : '230 V · Monofásico'}
          </p>
          <p className="text-[11px] text-slate-600 font-mono">
            {data.receptores.length} {data.receptores.length === 1 ? 'elemento' : 'elementos'}
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
            <div className={`card cursor-pointer transition-all duration-200 ${expanded === r.id ? 'border-amber-500/30' : 'hover:border-ink-400'}`}>
              <div className="flex items-center gap-3" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-500/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-semibold text-slate-200 text-[13px] truncate">
                    {r.concepto || `Elemento ${i + 1}`}
                    {r.aclarador && <span className="text-slate-500 ml-2 font-normal text-[12px]">{r.aclarador}</span>}
                  </div>
                  <div className="text-[11px] text-amber-500/60 font-mono">
                    {r.potencia_kw > 0
                      ? `${r.potencia_kw.toFixed(2)} kW · ${r.tension}${r.grado === 'basica' ? ' · Básica' : r.grado === 'elevada' ? ' · Elevada' : ''}`
                      : 'Sin potencia definida'}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {expanded === r.id ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeReceptor(r.id) }}
                    className="btn-ghost p-1.5 text-slate-600 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded === r.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5 mt-4 border-t border-[#1e2d47] space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormInput
                          label="Tipo de espacio"
                          value={r.concepto}
                          onChange={upd(r.id)('concepto')}
                          placeholder="Vivienda, Local, Garaje..."
                          required
                        />
                        <FormInput
                          label="Aclarador (opcional)"
                          value={r.aclarador}
                          onChange={upd(r.id)('aclarador')}
                          placeholder="1º 1ª, Planta -1..."
                          hint="Si hay varios del mismo tipo"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormInput
                          label="Potencia solicitada (kW)"
                          value={r.potencia_kw || ''}
                          onChange={upd(r.id)('potencia_kw')}
                          type="number"
                          step="0.01"
                          min="0"
                          className="font-mono"
                          hint="Editable — independiente del grado"
                        />
                        <FormSelect
                          label="Tensión"
                          value={r.tension}
                          onChange={upd(r.id)('tension') as any}
                          options={TENSION_OPTIONS}
                        />
                      </div>
                      {esVivienda(r.concepto) && (
                        <FormSelect
                          label="Grado de electrificación (ITC-BT-10)"
                          value={r.grado}
                          onChange={upd(r.id)('grado') as any}
                          options={GRADO_OPTIONS}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Botón añadir + presets */}
      <button
        type="button"
        onClick={() => setShowPresets(!showPresets)}
        className="btn-secondary w-full justify-center"
      >
        <Plus className="w-4 h-4" />
        Añadir elemento
        {showPresets ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleAdd(p)}
                  className="text-left px-3 py-2.5 rounded-xl border border-ink-500 bg-ink-800 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-200"
                >
                  <div className="font-body font-semibold text-[12px] text-slate-300">{p.label}</div>
                  <div className="text-[10px] font-mono text-amber-500/50">
                    {p.hint ?? (p.potencia_kw > 0 ? `${p.potencia_kw.toFixed(2)} kW` : 'Potencia a definir')}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
